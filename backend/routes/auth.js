// backend/routes/auth.js - مسارات المصادقة
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// ===== توليد JWT =====
const generateToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

// ===== POST /api/auth/register - تسجيل حساب جديد =====
router.post('/register', async (req, res, next) => {
  try {
    const { name, phone, email, password, role = 'customer', businessName, businessType } = req.body;

    // التحقق من البيانات الأساسية
    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'الاسم ورقم الجوال وكلمة المرور مطلوبة' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        name,
        phone: phone.startsWith('+') ? phone : `+966${phone}`,
        email: email || null,
        password: hashedPassword,
        role,
      },
    });

    // إنشاء عمل تجاري إذا كان المالك
    let business = null;
    if (role === 'owner' && businessName) {
      business = await prisma.business.create({
        data: {
          name: businessName,
          type: businessType || 'other',
          phone: user.phone,
          email: email || null,
          country: 'السعودية',
          currency: 'SAR',
          timezone: 'Asia/Riyadh',
          workingDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
          workStart: '09:00',
          workEnd: '21:00',
          slotDuration: 30,
          owner: { connect: { id: user.id } },
        },
      });
    }

    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: { user: safeUser, token, business },
    });
  } catch (error) {
    next(error);
  }
});

// ===== POST /api/auth/login - تسجيل الدخول =====
router.post('/login', async (req, res, next) => {
  try {
    const { phone, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'كلمة المرور مطلوبة' });
    }

    // البحث بالهاتف أو البريد
    const identifier = phone
      ? (phone.startsWith('+') ? phone : `+966${phone.replace(/^0/, '')}`)
      : email;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'رقم الجوال أو البريد الإلكتروني مطلوب' });
    }

    const user = await prisma.user.findFirst({
      where: phone
        ? { phone: identifier }
        : { email: identifier },
      include: { ownedBusiness: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'رقم الجوال أو كلمة المرور غير صحيحة' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'تم تعطيل هذا الحساب، تواصل مع الدعم' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'رقم الجوال أو كلمة المرور غير صحيحة' });
    }

    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: { user: safeUser, token, business: user.ownedBusiness },
    });
  } catch (error) {
    next(error);
  }
});

// ===== GET /api/auth/me - بيانات المستخدم الحالي =====
router.get('/me', authMiddleware, async (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json({
    success: true,
    data: { user: safeUser, business: req.user.ownedBusiness },
  });
});

// ===== PUT /api/auth/profile - تحديث الملف الشخصي =====
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, email: email || null },
    });
    const { password: _, ...safeUser } = updated;
    res.json({ success: true, message: 'تم تحديث الملف الشخصي بنجاح', data: safeUser });
  } catch (error) {
    next(error);
  }
});

// ===== PUT /api/auth/password - تغيير كلمة المرور =====
router.put('/password', authMiddleware, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية والجديدة مطلوبتان' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
