// backend/middleware/errorHandler.js - معالجة الأخطاء المركزية
module.exports = (err, req, res, next) => {
  console.error('❌ خطأ:', err.message);
  console.error(err.stack);

  // أخطاء Prisma
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'الحقل';
    return res.status(409).json({
      success: false,
      message: `هذا ${field} مسجل مسبقاً`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'السجل المطلوب غير موجود',
    });
  }

  // أخطاء التحقق من البيانات (Joi)
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: err.details[0].message,
    });
  }

  // خطأ عام
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً',
  });
};
