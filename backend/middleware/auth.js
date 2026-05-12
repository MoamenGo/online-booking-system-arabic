// backend/middleware/auth.js - التحقق من التوكن
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  try {
    // قراءة التوكن من الـ header أو الـ cookie
    let token = null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول أولاً',
      });
    }

    // فك تشفير التوكن
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    } catch {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً',
      });
    }

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { ownedBusiness: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'تم تعطيل هذا الحساب، تواصل مع الدعم',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
