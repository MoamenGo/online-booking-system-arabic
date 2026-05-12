// backend/routes/business.js - مسارات إعدادات العمل التجاري
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const prisma = new PrismaClient();

// ===== GET /api/business/settings - جلب إعدادات العمل =====
router.get('/settings', authMiddleware, async (req, res, next) => {
  try {
    const businessId = req.user.ownedBusiness?.id;
    if (!businessId) return res.status(404).json({ success: false, message: 'لا يوجد عمل تجاري' });

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
});

// ===== PUT /api/business/settings - تحديث إعدادات العمل =====
router.put('/settings', authMiddleware, roleGuard('owner'), async (req, res, next) => {
  try {
    const businessId = req.user.ownedBusiness?.id;
    const updateData = req.body;
    delete updateData.id;
    delete updateData.ownerId;

    const business = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });

    res.json({ success: true, message: 'تم حفظ الإعدادات بنجاح', data: business });
  } catch (error) {
    next(error);
  }
});

// ===== GET /api/business/dayoffs - أيام الإجازة =====
router.get('/dayoffs', authMiddleware, async (req, res, next) => {
  try {
    const businessId = req.user.ownedBusiness?.id;
    const dayOffs = await prisma.dayOff.findMany({
      where: { businessId },
      orderBy: { date: 'asc' },
    });
    res.json({ success: true, data: dayOffs });
  } catch (error) {
    next(error);
  }
});

// ===== POST /api/business/dayoffs - إضافة يوم إجازة =====
router.post('/dayoffs', authMiddleware, roleGuard('owner'), async (req, res, next) => {
  try {
    const businessId = req.user.ownedBusiness?.id;
    const { date, reason, isRecurring = false } = req.body;

    const dayOff = await prisma.dayOff.create({
      data: { businessId, date: new Date(date), reason, isRecurring },
    });

    res.status(201).json({ success: true, message: 'تم إضافة يوم الإجازة بنجاح', data: dayOff });
  } catch (error) {
    next(error);
  }
});

// ===== DELETE /api/business/dayoffs/:id - حذف يوم إجازة =====
router.delete('/dayoffs/:id', authMiddleware, roleGuard('owner'), async (req, res, next) => {
  try {
    await prisma.dayOff.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'تم حذف يوم الإجازة' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
