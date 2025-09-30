export async function onRequestPost(context) {
    const { request, env } = context;
    const BOT_TOKEN = '8028491354:AAG_56-Us87dQFRWmZW0ID3fLVJJ9LYtas4';

    try {
        const update = await request.json();

        if (update.message) {
            const message = update.message;
            const chatId = message.chat.id;
            const text = message.text ? message.text.trim() : '';
            const caption = message.caption ? message.caption.trim() : '';

            if (text === '/start') {
                return await sendWelcome(chatId, BOT_TOKEN);
            }
            else if (message.photo && caption) {
                return await processImage(chatId, message, caption, BOT_TOKEN);
            }
            else if (message.photo && !caption) {
                return await sendTextResponse(chatId, 
                    "❌ <b>يجب إضافة وصف للصورة</b>\n\nأعد إرسال الصورة مع إضافة التسمية التوضيحية", BOT_TOKEN);
            }
        }

        return new Response(JSON.stringify({ status: 'OK' }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// دالة إرسال رسالة الترحيب
async function sendWelcome(chatId, BOT_TOKEN) {
    const welcomeText = `🎨 <b>مرحباً بك في بوت تحرير الصور المتقدم!</b>\n\n
✨ <b>مميزات البوت:</b>\n
• <code>☁ 𝝢𝝖𝝢𝝤 𝝗𝝖𝝢𝝖𝝢𝝖 </code> - تقنية التعديل المتقدم\n
• معالجة الصور بجودة عالية\n
• العديد من التأثيرات والتحسينات\n\n
📸 <b>كيفية الاستخدام:</b>\n
1. أرسل صورة إلى البوت\n
2. أضف وصف التعديل <b>مع الصورة</b>\n
3. انتظر حتى انتهاء المعالجة\n\n`;

    const keyboard = {
        inline_keyboard: [
            [
                {
                    text: '📢 برومت جاهز',
                    url: 'https://t.me/VISCODZ'
                }
            ]
        ]
    };

    return await sendPhoto(chatId, 'https://t.me/bgrtiio/27', welcomeText, keyboard, BOT_TOKEN);
}

// دالة معالجة الصورة
async function processImage(chatId, message, caption, BOT_TOKEN) {
    try {
        const photo = message.photo[message.photo.length - 1];
        const fileUrl = await getTelegramFileUrl(photo.file_id, BOT_TOKEN);

        if (!fileUrl) {
            return await sendTextResponse(chatId, "❌ <b>خطأ في تحميل الصورة</b>", BOT_TOKEN);
        }

        // إرسال رسالة التقدم
        const progressMessage = await sendTextResponse(chatId, "⏳ <b>جاري تحرير الصورة...</b>\n⚡ <b>باستخدام تقنية الذكاء الاصطناعي</b>", BOT_TOKEN);
        const progressMessageId = progressMessage.result?.message_id;

        // استدعاء API التعديل
        const result = await callEditAPI(caption, fileUrl);

        if (result && result.success && result.image_data) {
            // حذف رسالة التقدم
            if (progressMessageId) await deleteMessage(chatId, progressMessageId, BOT_TOKEN);

            // إرسال الصورة المعدلة (كرابط صورة مباشرة وليس Base64)
            return await sendPhotoFromUrl(chatId, result.image_data, caption, BOT_TOKEN);
        } else {
            if (progressMessageId) await deleteMessage(chatId, progressMessageId, BOT_TOKEN);
            return await sendTextResponse(chatId, 
                "❌ <b>عذراً، لم أتمكن من تحرير الصورة</b>\n\nجرب وصفاً بالإنجليزية أو وصفاً أكثر وضوحاً", BOT_TOKEN);
        }

    } catch (error) {
        console.error('Image Processing Error:', error);
        return await sendTextResponse(chatId, "❌ <b>حدث خطأ أثناء معالجة الصورة</b>", BOT_TOKEN);
    }
}

// دالة للاتصال بالـ API الخارجي
async function callEditAPI(text, imageUrl) {
    const apiUrl = "https://viscodev.x10.mx/LOGO/nano.php";

    const postData = {
        text: text,
        links: imageUrl
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        });

        if (response.ok) {
            return await response.json();
        }
        return false;
    } catch (error) {
        console.error('API Error:', error);
        return false;
    }
}

// استدعاء Telegram API باستخدام JSON وليس FormData
async function bot(method, datas = {}, BOT_TOKEN) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datas)
        });

        return await response.json();
    } catch (error) {
        console.error('Telegram API Error:', error);
        return { ok: false };
    }
}

async function sendMessage(chatId, text, replyMarkup = null, BOT_TOKEN) {
    const params = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    };

    if (replyMarkup) {
        params.reply_markup = replyMarkup;
    }

    return await bot('sendMessage', params, BOT_TOKEN);
}

async function sendTextResponse(chatId, text, BOT_TOKEN) {
    return await sendMessage(chatId, text, null, BOT_TOKEN);
}

async function sendPhoto(chatId, photoUrl, caption, replyMarkup = null, BOT_TOKEN) {
    const params = {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML'
    };

    if (replyMarkup) {
        params.reply_markup = replyMarkup;
    }

    return await bot('sendPhoto', params, BOT_TOKEN);
}

// إرسال الصورة المعدلة من رابط وليس Base64
async function sendPhotoFromUrl(chatId, imageUrl, text, BOT_TOKEN) {
    return await sendPhoto(chatId, imageUrl, `✅ <b>تم تحرير الصورة بنجاح!</b>\n📝 <b>الوصف:</b> ${escapeHtml(text)}`, null, BOT_TOKEN);
}

async function deleteMessage(chatId, messageId, BOT_TOKEN) {
    return await bot('deleteMessage', {
        chat_id: chatId,
        message_id: messageId
    }, BOT_TOKEN);
}

async function getTelegramFileUrl(fileId, BOT_TOKEN) {
    const result = await bot('getFile', { file_id: fileId }, BOT_TOKEN);
    if (result && result.result && result.result.file_path) {
        return `https://api.telegram.org/file/bot${BOT_TOKEN}/${result.result.file_path}`;
    }
    return null;
}

// دالة مساعدة للهروب من HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
