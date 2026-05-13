// app/api/bookings/today/route.ts - حجوزات اليوم
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, handlePrismaError } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {
      date: { gte: today, lt: tomorrow },
    };

    if (user!.role === 'owner') {
      where.businessId = (user as any).ownedBusiness?.id;
    } else {
      where.customerId = user!.id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: { service: true },
      orderBy: { startTime: 'asc' },
    });

    return Response.json({ success: true, data: bookings });
  } catch (error) {
    return handlePrismaError(error);
  }
}
