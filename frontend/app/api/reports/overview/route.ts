// app/api/reports/overview/route.ts - نظرة عامة للوحة التحكم
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, handlePrismaError } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const businessId = (user as any).ownedBusiness?.id;
    if (!businessId) {
      return Response.json({ success: false, message: 'غير مصرح' }, { status: 403 });
    }

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

    return Response.json({
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
    return handlePrismaError(error);
  }
}
