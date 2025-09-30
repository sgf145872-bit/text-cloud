const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const botToken = "8028491354:AAG_56-Us87dQFRWmZW0ID3fLVJJ9LYtas4";
const bot = new TelegramBot(botToken, { polling: true });

// دالة للاتصال بالـ API الخارجي
async function callEditAPI(text, imageUrl) {
    const apiUrl = "https://viscodev.x10.mx/LOGO/nano.php";
    
    const postData = {
        text: text,
        links: imageUrl
    };
    
    try {
        const response = await axios.post(apiUrl, postData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 120000
        });
        
        return response.data;
    } catch (error) {
        console.error('API Error:', error.message);
        return false;
    }
}

// دالة للحصول على رابط ملف التليجرام
async function getTelegramFileUrl(fileId) {
    try {
        const file = await bot.getFile(fileId);
        return `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
    } catch (error) {
        console.error('File URL Error:', error.message);
        return null;
    }
}

// دالة إرسال الصورة المعدلة
async function sendImage(chatId, imageData, text) {
    try {
        // حفظ الصورة مؤقتاً
        const tempDir = require('os').tmpdir();
        const tempFile = path.join(tempDir, `image_${Date.now()}.png`);
        
        // تحويل base64 إلى buffer وحفظه
        const imageBuffer = Buffer.from(imageData, 'base64');
        fs.writeFileSync(tempFile, imageBuffer);
        
        // إرسال الصورة
        await bot.sendPhoto(chatId, tempFile, {
            caption: `✅ <b>تم تحرير الصورة بنجاح!</b>\n📝 <b>الوصف:</b> ${escapeHtml(text)}`,
            parse_mode: 'HTML'
        });
        
        // حذف الملف المؤقت
        fs.unlinkSync(tempFile);
        
    } catch (error) {
        console.error('Send Image Error:', error.message);
        throw error;
    }
}

// دالة إرسال رسالة الترحيب
function sendWelcome(chatId) {
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
    
    bot.sendPhoto(chatId, 'https://t.me/bgrtiio/27', {
        caption: welcomeText,
        parse_mode: 'HTML',
        reply_markup: keyboard
    });
}

// دالة عرض التقدم
async function showProgress(chatId, progressMessageId = null) {
    const progressMessages = [
        "⏳ <b>جاري تحرير الصورة...</b>",
        "⏳ <b>جاري تحرير الصورة..</b>",
        "⏳ <b>جاري تحرير الصورة.</b>",
        "⏳ <b>جاري تحرير الصورة..</b>"
    ];
    
    const message = progressMessages[Math.floor(Math.random() * progressMessages.length)];
    
    if (progressMessageId) {
        await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: progressMessageId,
            parse_mode: 'HTML'
        });
    } else {
        const sentMessage = await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        return sentMessage.message_id;
    }
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

// معالجة الرسائل
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';
    const caption = msg.caption ? msg.caption.trim() : '';
    
    if (text === '/start') {
        sendWelcome(chatId);
    } else if (msg.photo && caption) {
        try {
            // الحصول على أعلى دقة للصورة
            const photo = msg.photo[msg.photo.length - 1];
            const fileUrl = await getTelegramFileUrl(photo.file_id);
            
            if (fileUrl) {
                // إرسال رسالة التقدم
                const progressMessageId = await showProgress(chatId);
                
                // تحديث رسالة التقدم
                await showProgress(chatId, progressMessageId);
                
                // استدعاء API التعديل
                const result = await callEditAPI(caption, fileUrl);
                
                if (result && result.success && result.image_data) {
                    // حذف رسالة التقدم
                    await bot.deleteMessage(chatId, progressMessageId);
                    
                    // إرسال الصورة المعدلة
                    await sendImage(chatId, result.image_data, caption);
                } else {
                    // حذف رسالة التقدم وإرسال رسالة خطأ
                    await bot.deleteMessage(chatId, progressMessageId);
                    await bot.sendMessage(
                        chatId, 
                        "❌ <b>عذراً، لم أتمكن من تحرير الصورة</b>\n\nجرب وصفاً بالإنجليزية أو وصفاً أكثر وضوحاً", 
                        { parse_mode: 'HTML' }
                    );
                }
            } else {
                await bot.sendMessage(chatId, "❌ <b>خطأ في تحميل الصورة</b>", { parse_mode: 'HTML' });
            }
        } catch (error) {
            console.error('Processing Error:', error.message);
            await bot.sendMessage(chatId, "❌ <b>حدث خطأ أثناء معالجة الصورة</b>", { parse_mode: 'HTML' });
        }
    } else if (msg.photo && !caption) {
        await bot.sendMessage(
            chatId, 
            "❌ <b>يجب إضافة وصف للصورة</b>\n\nأعد إرسال الصورة مع إضافة التسمية التوضيحية", 
            { parse_mode: 'HTML' }
        );
    }
});

// معالجة الأخطاء
bot.on('polling_error', (error) => {
    console.error('Polling Error:', error);
});

bot.on('webhook_error', (error) => {
    console.error('Webhook Error:', error);
});

console.log('Bot is running...');
