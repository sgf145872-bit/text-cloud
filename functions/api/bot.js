export async function onRequestPost(context) {
    const { request } = context;
    
    try {
        const update = await request.json();
        
        // معالجة الرسائل
        if (update.message) {
            const message = update.message;
            const chatId = message.chat.id;
            const text = message.text ? message.text.trim() : '';
            const caption = message.caption ? message.caption.trim() : '';
            
            if (text === '/start') {
                return await sendWelcome(chatId);
            }
            else if (message.photo && caption) {
                return await processImage(chatId, message, caption);
            }
            else if (message.photo && !caption) {
                return await sendTextResponse(chatId, 
                    "❌ <b>يجب إضافة وصف للصورة</b>\n\nأعد إرسال الصورة مع إضافة التسمية التوضيحية");
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
async function sendWelcome(chatId) {
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
    
    return await sendPhoto(chatId, 'https://t.me/bgrtiio/27', welcomeText, keyboard);
}

// دالة معالجة الصورة
async function processImage(chatId, message, caption) {
    try {
        const photo = message.photo[message.photo.length - 1];
        const fileUrl = await getTelegramFileUrl(photo.file_id);
        
        if (!fileUrl) {
            return await sendTextResponse(chatId, "❌ <b>خطأ في تحميل الصورة</b>");
        }
        
        // إرسال رسالة التقدم
        const progressMessage = await sendTextResponse(chatId, "⏳ <b>جاري تحرير الصورة...</b>\n⚡ <b>باستخدام تقنية الذكاء الاصطناعي</b>");
        const progressMessageId = progressMessage.result.message_id;
        
        // استدعاء API التعديل
        const result = await callEditAPI(caption, fileUrl);
        
        if (result && result.success && result.image_data) {
            // حذف رسالة التقدم
            await deleteMessage(chatId, progressMessageId);
            
            // إرسال الصورة المعدلة
            return await sendImageFromBase64(chatId, result.image_data, caption);
        } else {
            // حذف رسالة التقدم وإرسال رسالة خطأ
            await deleteMessage(chatId, progressMessageId);
            return await sendTextResponse(chatId, 
                "❌ <b>عذراً، لم أتمكن من تحرير الصورة</b>\n\nجرب وصفاً بالإنجليزية أو وصفاً أكثر وضوحاً");
        }
        
    } catch (error) {
        console.error('Image Processing Error:', error);
        return await sendTextResponse(chatId, "❌ <b>حدث خطأ أثناء معالجة الصورة</b>");
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

// دوال Telegram API
async function bot(method, datas = {}) {
    const botToken = "8028491354:AAG_56-Us87dQFRWmZW0ID3fLVJJ9LYtas4";
    const url = `https://api.telegram.org/bot${botToken}/${method}`;
    
    try {
        const formData = new FormData();
        for (const key in datas) {
            if (datas[key] instanceof File || datas[key] instanceof Blob) {
                formData.append(key, datas[key]);
            } else if (typeof datas[key] === 'object') {
                formData.append(key, JSON.stringify(datas[key]));
            } else {
                formData.append(key, datas[key]);
            }
        }
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    } catch (error) {
        console.error('Telegram API Error:', error);
        return { ok: false };
    }
}

async function sendMessage(chatId, text, replyMarkup = null) {
    const params = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
    };
    
    if (replyMarkup) {
        params.reply_markup = JSON.stringify(replyMarkup);
    }
    
    return await bot('sendMessage', params);
}

async function sendTextResponse(chatId, text) {
    return await sendMessage(chatId, text);
}

async function sendPhoto(chatId, photoUrl, caption, replyMarkup = null) {
    const params = {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML'
    };
    
    if (replyMarkup) {
        params.reply_markup = JSON.stringify(replyMarkup);
    }
    
    return await bot('sendPhoto', params);
}

async function sendImageFromBase64(chatId, imageData, text) {
    try {
        // تحويل base64 إلى blob
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'image/png' });
        const file = new File([blob], 'edited_image.png', { type: 'image/png' });
        
        return await bot('sendPhoto', {
            chat_id: chatId,
            photo: file,
            caption: `✅ <b>تم تحرير الصورة بنجاح!</b>\n📝 <b>الوصف:</b> ${escapeHtml(text)}`
        });
        
    } catch (error) {
        console.error('Send Image Error:', error);
        return await sendMessage(chatId, 
            "✅ <b>تم تحرير الصورة بنجاح!</b>\n📝 <b>الوصف:</b> " + escapeHtml(text));
    }
}

async function deleteMessage(chatId, messageId) {
    return await bot('deleteMessage', {
        chat_id: chatId,
        message_id: messageId
    });
}

async function getTelegramFileUrl(fileId) {
    const result = await bot('getFile', { file_id: fileId });
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
