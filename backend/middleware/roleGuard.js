// backend/middleware/roleGuard.js - فحص الصلاحيات
module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'يجب تسجيل الدخول أولاً',
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
    });
  }

  next();
};
