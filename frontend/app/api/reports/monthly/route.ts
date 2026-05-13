// app/api/reports/monthly/route.ts - تقرير شهري
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, requireRole, handlePrismaError } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;
    const roleError = requireRole(user!, 'owner');
    if (roleError) return roleError;

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const businessId = (user as any).ownedBusiness?.id;
    const [year, m] = (month || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`).split('-').map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);

    const bookings = await prisma.booking.findMany({
      where: { businessId, date: { gte: start, lt: end } },
      include: { service: true },
    });

    const serviceStats: Record<string, { count: number; revenue: number }> = {};
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

    return Response.json({
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
    return handlePrismaError(error);
  }
}
