// backend/services/email.js - إشعارات البريد الإلكتروني
const nodemailer = require('nodemailer');

// إعداد transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * قالب HTML عربي للبريد الإلكتروني
 */
function buildEmailHTML(title, content) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f2f3ff;font-family:'IBM Plex Sans Arabic',Arial,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f3ff;padding:40px 20px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- رأس -->
        <tr>
          <td style="background:#0058be;padding:32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">نظام الحجز الذكي</h1>
          </td>
        </tr>
        <!-- المحتوى -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- تذييل -->
        <tr>
          <td style="background:#f2f3ff;padding:20px;text-align:center;color:#727785;font-size:12px;">
            جميع الحقوق محفوظة © ${new Date().getFullYear()} نظام الحجز الذكي
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * إرسال تأكيد الحجز
 */
async function sendBookingConfirmation(booking, business) {
  if (!process.env.SMTP_USER) {
    console.log('📧 البريد الإلكتروني غير مُعدّ - تخطي');
    return;
  }
  if (!booking.customerEmail) return;

  const content = `
    <h2 style="color:#131b2e;font-size:20px;margin-bottom:8px;">تم تأكيد حجزك بنجاح! 🎉</h2>
    <p style="color:#424754;font-size:16px;margin-bottom:24px;">مرحباً <strong>${booking.customerName}</strong>، تم تأكيد حجزك في <strong>${business.name}</strong></p>
    <table width="100%" cellpadding="12" style="border:1px solid #c2c6d6;border-radius:8px;border-collapse:collapse;">
      <tr><td style="background:#f2f3ff;font-weight:600;color:#424754;">رقم الحجز</td><td style="color:#131b2e;font-weight:700;">${booking.bookingNumber}</td></tr>
      <tr><td style="background:#f2f3ff;font-weight:600;color:#424754;">الخدمة</td><td style="color:#131b2e;">${booking.service?.name}</td></tr>
      <tr><td style="background:#f2f3ff;font-weight:600;color:#424754;">التاريخ</td><td style="color:#131b2e;">${new Date(booking.date).toLocaleDateString('ar-SA')}</td></tr>
      <tr><td style="background:#f2f3ff;font-weight:600;color:#424754;">الوقت</td><td style="color:#131b2e;">${booking.startTime} - ${booking.endTime}</td></tr>
      <tr><td style="background:#f2f3ff;font-weight:600;color:#424754;">المبلغ</td><td style="color:#0058be;font-weight:700;">${booking.totalAmount} ${booking.currency}</td></tr>
    </table>
    <p style="color:#424754;font-size:14px;margin-top:24px;">إذا كنت بحاجة لإلغاء أو تعديل الموعد، يرجى التواصل معنا مبكراً. شكراً لاختيارك! 🙏</p>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'نظام الحجز الذكي'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: booking.customerEmail,
    subject: `✅ تأكيد الحجز - ${booking.bookingNumber}`,
    html: buildEmailHTML('تأكيد الحجز', content),
  });

  console.log(`📧 تم إرسال تأكيد الحجز إلى ${booking.customerEmail}`);
}

/**
 * إرسال تذكير
 */
async function sendBookingReminder(booking, business) {
  if (!booking.customerEmail) return;
  console.log(`📧 إرسال تذكير إلى ${booking.customerEmail}`);
}

/**
 * إرسال إشعار الإلغاء
 */
async function sendBookingCancellation(booking, business) {
  if (!booking.customerEmail) return;
  console.log(`📧 إرسال إشعار إلغاء إلى ${booking.customerEmail}`);
}

module.exports = { sendBookingConfirmation, sendBookingReminder, sendBookingCancellation };
