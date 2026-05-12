// backend/services/whatsapp.js - إشعارات واتساب
const axios = require('axios');

/**
 * إرسال إشعار واتساب
 */
async function sendNotification({ booking, business, type = 'confirmation' }) {
  if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_TOKEN) {
    console.log('📱 واتساب غير مُعدّ - تخطي الإشعار');
    return;
  }

  const messages = {
    confirmation: `مرحباً ${booking.customerName} 👋
تم تأكيد حجزك بنجاح في ${business.name}
📅 التاريخ: ${new Date(booking.date).toLocaleDateString('ar-SA')}
🕐 الوقت: ${booking.startTime} - ${booking.endTime}
💈 الخدمة: ${booking.service?.name}
💰 المبلغ: ${booking.totalAmount} ${booking.currency}
🔖 رقم الحجز: ${booking.bookingNumber}
شكراً لاختيارك! ✨`,

    reminder: `تذكير بموعدك غداً 📅
مرحباً ${booking.customerName}
لديك موعد في ${business.name}
⏰ الوقت: ${booking.startTime}
💈 الخدمة: ${booking.service?.name}
نراك قريباً! 😊`,

    cancellation: `تم إلغاء الحجز ❌
مرحباً ${booking.customerName}
تم إلغاء حجزك رقم ${booking.bookingNumber}
للحجز مجدداً: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`,
  };

  try {
    await axios.post(`${process.env.WHATSAPP_API_URL}/messages`, {
      token: process.env.WHATSAPP_TOKEN,
      to: booking.customerPhone.replace('+', ''),
      body: messages[type] || messages.confirmation,
    });
    console.log(`✅ تم إرسال إشعار واتساب إلى ${booking.customerPhone}`);
  } catch (error) {
    console.error('❌ فشل إرسال واتساب:', error.message);
    throw error;
  }
}

module.exports = { sendNotification };
