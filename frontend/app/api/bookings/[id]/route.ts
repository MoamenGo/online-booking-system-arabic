// app/api/bookings/[id]/route.ts - تفاصيل/تحديث حجز
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, handlePrismaError } from '@/lib/auth-helpers';

// ===== GET /api/bookings/:id — تفاصيل حجز (عام) =====
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true, business: true },
    });

    if (!booking) {
      return Response.json({ success: false, message: 'الحجز غير موجود' }, { status: 404 });
    }

    return Response.json({ success: true, data: booking });
  } catch (error) {
    return handlePrismaError(error);
  }
}

// ===== PUT /api/bookings/:id — تحديث حجز =====
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { id } = await params;
    const { status, date, startTime, notes } = await request.json();

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(notes !== undefined && { notes }),
      },
      include: { service: true },
    });

    return Response.json({ success: true, message: 'تم تحديث الحجز بنجاح', data: booking });
  } catch (error) {
    return handlePrismaError(error);
  }
}
