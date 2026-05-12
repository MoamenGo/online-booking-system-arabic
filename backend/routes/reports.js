// backend/routes/reports.js - مسارات التقارير
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const prisma = new PrismaClient();

// ===== GET /api/reports/overview - نظرة عامة للوحة التحكم =====
router.get('/overview', authMiddleware, async (req, res, next) => {
  try {
    const businessId = req.user.ownedBusiness?.id;
    if (!businessId) return res.status(403).json({ success: false, message: 'غير مصرح' });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayCount, weekCount, monthCount, monthRevenue, recentBookings, todayBookingsList] = await Promise.all([
      prisma.booking.count({ where: { businessId, date: { gte: today, lt: tomorrow } } }),
      prisma.booking.count({ where: { businessId, date: { gte: weekStart } } }),
      prisma.booking.count({ where: { businessId, date: { gte: monthStart } } }),
      prisma.booking.aggregate({
        where: { businessId, date: { gte: monthStart }, status: { in: ['confirmed', 'completed'] } },
        _sum: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: { businessId },
        include: { service: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.booking.findMany({
        where: { businessId, date: { gte: today, lt: tomorrow } },
        include: { service: true },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        todayBookings: todayCount,
        weekBookings: weekCount,
        monthBookings: monthCount,
        monthRevenue: monthRevenue._sum.totalAmount || 0,
        recentBookings,
        todayBookingsList,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ===== GET /api/reports/daily - تقرير يومي =====
router.get('/daily', authMiddleware, roleGuard('owner'), async (req, res, next) => {
  try {
    const { date } = req.query;
    const businessId = req.user.ownedBusiness?.id;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate.getTime() + 86400000);

    const bookings = await prisma.booking.findMany({
      where: { businessId, date: { gte: targetDate, lt: nextDay } },
      include: { service: true },
      orderBy: { startTime: 'asc' },
    });

    const byStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    let totalRevenue = 0;

    for (const b of bookings) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      if (b.status === 'completed' || b.status === 'confirmed') {
        totalRevenue += b.totalAmount || 0;
      }
    }

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString(),
        totalBookings: bookings.length,
        ...byStatus,
        totalRevenue,
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ===== GET /api/reports/monthly - تقرير شهري =====
router.get('/monthly', authMiddleware, roleGuard('owner'), async (req, res, next) => {
  try {
    const { month } = req.query; // YYYY-MM
    const businessId = req.user.ownedBusiness?.id;
    const [year, m] = (month || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`).split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);

    const bookings = await prisma.booking.findMany({
      where: { businessId, date: { gte: start, lt: end } },
      include: { service: true },
    });

    const serviceStats = {};
    let totalRevenue = 0;
    let cancelled = 0;

    for (const b of bookings) {
      if (b.status === 'cancelled') cancelled++;
      if (b.status === 'completed' || b.status === 'confirmed') totalRevenue += b.totalAmount || 0;
      const sName = b.service?.name || 'أخرى';
      if (!serviceStats[sName]) serviceStats[sName] = { count: 0, revenue: 0 };
      serviceStats[sName].count++;
      serviceStats[sName].revenue += b.totalAmount || 0;
    }

    const topServices = Object.entries(serviceStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        month,
        totalBookings: bookings.length,
        totalRevenue,
        cancellationRate: bookings.length > 0 ? Math.round((cancelled / bookings.length) * 100) : 0,
        topServices,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
