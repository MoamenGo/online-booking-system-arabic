// backend/routes/bookings.js - مسارات الحجوزات
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const { generateTimeSlots } = require('../utils/timeSlots');
const { sendNotification } = require('../services/whatsapp');
const { sendBookingConfirmation } = require('../services/email');

const prisma = new PrismaClient();

// ===== Auth اختياري للحجز العام =====
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = require('jsonwebtoken');
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
      const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { ownedBusiness: true } });
      if (user) req.user = user;
    }
  } catch {}
  next();
}

// ===== إيجاد أو إنشاء عميل ضيف =====
async function findOrCreateGuest(phone, name, email) {
  const normalizedPhone = phone.startsWith('+') ? phone : `+966${phone.replace(/^0/, '')}`;
  let user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone,
        email: email || null,
        password: await bcrypt.hash(normalizedPhone, 10),
        role: 'customer',
      },
    });
  }
  return user;
}

// ===== دالة توليد رقم الحجز =====
async function generateBookingNumber(businessId) {
  const year = new Date().getFullYear();
  const count = await prisma.booking.count({ where: { businessId } });
  return `BK-${year}-${String(count + 1).padStart(4, '0')}`;
}

// ===== POST /api/bookings - إنشاء حجز جديد (عام - بدون تسجيل دخول) =====
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { serviceId, date, startTime, customerName, customerPhone, customerEmail, notes } = req.body;

    if (!serviceId || !date || !startTime || !customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'جميع الحقول الأساسية مطلوبة' });
    }

    // التحقق من وجود الخدمة
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true },
    });

    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'الخدمة غير متاحة' });
    }

    const businessId = service.businessId;

    // حساب وقت الانتهاء
    const [startH, startM] = startTime.split(':').map(Number);
    const endMinutes = startH * 60 + startM + service.duration;
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMin = endMinutes % 60;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    const bookingDate = new Date(date);

    // التحقق من عدم التعارض
    const conflicting = await prisma.booking.findFirst({
      where: {
        businessId,
        date: { gte: bookingDate, lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000) },
        status: { in: ['pending', 'confirmed'] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
      },
    });

    if (conflicting) {
      return res.status(409).json({ success: false, message: 'هذا الموعد محجوز مسبقاً، اختر وقتاً آخر' });
    }

    // التحقق من يوم الإجازة
    const dayOff = await prisma.dayOff.findFirst({
      where: {
        businessId,
        date: bookingDate,
      },
    });

    if (dayOff) {
      return res.status(400).json({ success: false, message: 'هذا اليوم إجازة رسمية، اختر يوماً آخر' });
    }

    // إنشاء الحجز
    const bookingNumber = await generateBookingNumber(businessId);

    // إيجاد أو إنشاء العميل
    const customer = req.user || await findOrCreateGuest(customerPhone, customerName, customerEmail);

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        businessId,
        serviceId,
        customerId: customer.id,
        date: bookingDate,
        startTime,
        endTime,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        notes: notes || null,
        totalAmount: service.price,
        currency: service.currency,
        status: 'confirmed',
      },
      include: { service: true, business: true },
    });

    // إرسال الإشعارات (بدون انتظار)
    if (service.business.emailEnabled && customerEmail) {
      sendBookingConfirmation(booking, service.business).catch(console.error);
    }
    if (service.business.whatsappEnabled) {
      sendNotification({ booking, business: service.business }).catch(console.error);
    }

    res.status(201).json({
      success: true,
      message: 'تم تأكيد الحجز بنجاح',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// ===== GET /api/bookings - جلب الحجوزات =====
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { date, status, page = 1, limit = 20, search, from, to } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // فلترة حسب الدور
    if (req.user.role === 'owner') {
      where.businessId = req.user.ownedBusiness?.id;
    } else {
      where.customerId = req.user.id;
    }

    // فلترة التاريخ
    if (date) {
      const d = new Date(date);
      where.date = {
        gte: d,
        lt: new Date(d.getTime() + 24 * 60 * 60 * 1000),
      };
    } else if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    // فلترة الحالة
    if (status && status !== 'all') where.status = status;

    // بحث
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { bookingNumber: { contains: search } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { service: true },
        orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
        skip,
        take: parseInt(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        data: bookings,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ===== GET /api/bookings/today - حجوزات اليوم =====
router.get('/today', authMiddleware, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const where = {
      date: { gte: today, lt: tomorrow },
    };

    if (req.user.role === 'owner') {
      where.businessId = req.user.ownedBusiness?.id;
    } else {
      where.customerId = req.user.id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: { service: true },
      orderBy: { startTime: 'asc' },
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
});

// ===== GET /api/bookings/slots/available - الأوقات المتاحة (عام) =====
router.get('/slots/available', async (req, res, next) => {
  try {
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({ success: false, message: 'التاريخ ومعرف الخدمة مطلوبان' });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'الخدمة غير موجودة' });
    }

    const bookingDate = new Date(date);
    const business = service.business;

    // التحقق من يوم الإجازة
    const dayOff = await prisma.dayOff.findFirst({
      where: { businessId: business.id, date: bookingDate },
    });

    if (dayOff) {
      return res.json({ success: true, data: [] });
    }

    // جلب الحجوزات الموجودة
    const existingBookings = await prisma.booking.findMany({
      where: {
        businessId: business.id,
        date: {
          gte: bookingDate,
          lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: { in: ['pending', 'confirmed'] },
      },
      select: { startTime: true, endTime: true },
    });

    // توليد الأوقات
    const slots = generateTimeSlots({
      workStart: business.workStart,
      workEnd: business.workEnd,
      slotDuration: business.slotDuration,
      breakStart: business.breakStart,
      breakEnd: business.breakEnd,
      existingBookings,
      serviceDuration: service.duration,
      date: bookingDate,
    });

    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
});

// ===== GET /api/bookings/:id - تفاصيل حجز (عام - لصفحة التأكيد) =====
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { service: true, business: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'الحجز غير موجود' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

// ===== PUT /api/bookings/:id - تحديث الحجز =====
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { status, date, startTime, notes } = req.body;

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(notes !== undefined && { notes }),
      },
      include: { service: true },
    });

    res.json({ success: true, message: 'تم تحديث الحجز بنجاح', data: booking });
  } catch (error) {
    next(error);
  }
});

// ===== POST /api/bookings/:id/remind - إرسال تذكير =====
router.post('/:id/remind', authMiddleware, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { service: true, business: true },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'الحجز غير موجود' });
    }

    // إرسال تذكير (محاكاة)
    await prisma.booking.update({
      where: { id: booking.id },
      data: { remindedAt: new Date() },
    });

    res.json({ success: true, message: 'تم إرسال التذكير بنجاح' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
