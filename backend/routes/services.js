// backend/routes/services.js - مسارات الخدمات
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const prisma = new PrismaClient();

// ===== GET /api/services - جلب الخدمات =====
router.get('/', async (req, res, next) => {
  try {
    const { includeInactive, businessId } = req.query;

    const where = {};
    if (businessId) where.businessId = businessId;
    if (!includeInactive || includeInactive !== 'true') where.isActive = true;

    const services = await prisma.service.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
});

// ===== POST /api/services - إنشاء خدمة جديدة =====
router.post('/', authMiddleware, roleGuard('owner', 'staff'), async (req, res, next) => {
  try {
    const { name, description, duration, price, color, isActive = true, sortOrder = 0 } = req.body;

    if (!name || !duration || price === undefined) {
      return res.status(400).json({ success: false, message: 'الاسم والمدة والسعر مطلوبة' });
    }

    const businessId = req.user.ownedBusiness?.id;
    if (!businessId) {
      return res.status(403).json({ success: false, message: 'لا يوجد عمل تجاري مرتبط بهذا الحساب' });
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        currency: req.user.ownedBusiness?.currency || 'SAR',
        color: color || '#2170e4',
        isActive,
        sortOrder: parseInt(sortOrder),
      },
    });

    res.status(201).json({ success: true, message: 'تم إضافة الخدمة بنجاح', data: service });
  } catch (error) {
    next(error);
  }
});

// ===== PUT /api/services/reorder - إعادة الترتيب =====
router.put('/reorder', authMiddleware, roleGuard('owner'), async (req, res, next) => {
  try {
    const { orders } = req.body;
    await Promise.all(
      orders.map(({ id, sortOrder }) =>
        prisma.service.update({ where: { id }, data: { sortOrder } })
      )
    );
    res.json({ success: true, message: 'تم إعادة الترتيب بنجاح' });
  } catch (error) {
    next(error);
  }
});

// ===== PUT /api/services/:id - تحديث خدمة =====
router.put('/:id', authMiddleware, roleGuard('owner', 'staff'), async (req, res, next) => {
  try {
    const { name, description, duration, price, color, isActive, sortOrder } = req.body;

    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
      },
    });

    res.json({ success: true, message: 'تم تحديث الخدمة بنجاح', data: service });
  } catch (error) {
    next(error);
  }
});

// ===== DELETE /api/services/:id - حذف خدمة =====
router.delete('/:id', authMiddleware, roleGuard('owner'), async (req, res, next) => {
  try {
    // التحقق من وجود حجوزات مرتبطة
    const bookingsCount = await prisma.booking.count({
      where: {
        serviceId: req.params.id,
        status: { in: ['pending', 'confirmed'] },
      },
    });

    if (bookingsCount > 0) {
      // حذف منطقي (تعطيل)
      await prisma.service.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      return res.json({ success: true, message: 'تم تعطيل الخدمة (توجد حجوزات مرتبطة بها)' });
    }

    await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'تم حذف الخدمة بنجاح' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
