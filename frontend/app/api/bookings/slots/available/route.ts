// app/api/bookings/slots/available/route.ts - الأوقات المتاحة
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { generateTimeSlots } from '@/lib/time-slots';
import { handlePrismaError } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');

    if (!date || !serviceId) {
      return Response.json({ success: false, message: 'التاريخ ومعرف الخدمة مطلوبان' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true },
    });

    if (!service) {
      return Response.json({ success: false, message: 'الخدمة غير موجودة' }, { status: 404 });
    }

    const bookingDate = new Date(date);
    const business = service.business;

    const dayOff = await prisma.dayOff.findFirst({
      where: { businessId: business.id, date: bookingDate },
    });

    if (dayOff) {
      return Response.json({ success: true, data: [] });
    }

    const existingBookings = await prisma.booking.findMany({
      where: {
        businessId: business.id,
        date: { gte: bookingDate, lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000) },
        status: { in: ['pending', 'confirmed'] },
      },
      select: { startTime: true, endTime: true },
    });

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

    return Response.json({ success: true, data: slots });
  } catch (error) {
    return handlePrismaError(error);
  }
}
