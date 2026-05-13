// app/api/reports/daily/route.ts - تقرير يومي
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
    const date = searchParams.get('date');
    const businessId = (user as any).ownedBusiness?.id;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate.getTime() + 86400000);

    const bookings = await prisma.booking.findMany({
      where: { businessId, date: { gte: targetDate, lt: nextDay } },
      include: { service: true },
      orderBy: { startTime: 'asc' },
    });

    const byStatus: Record<string, number> = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    let totalRevenue = 0;

    for (const b of bookings) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      if (b.status === 'completed' || b.status === 'confirmed') {
        totalRevenue += b.totalAmount || 0;
      }
    }

    return Response.json({
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
    return handlePrismaError(error);
  }
}
