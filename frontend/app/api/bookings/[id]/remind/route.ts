// app/api/bookings/[id]/remind/route.ts - إرسال تذكير
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, handlePrismaError } from '@/lib/auth-helpers';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true, business: true },
    });

    if (!booking) {
      return Response.json({ success: false, message: 'الحجز غير موجود' }, { status: 404 });
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { remindedAt: new Date() },
    });

    return Response.json({ success: true, message: 'تم إرسال التذكير بنجاح' });
  } catch (error) {
    return handlePrismaError(error);
  }
}
