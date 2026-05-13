// app/api/bookings/route.ts - إنشاء وجلب الحجوزات
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, handlePrismaError } from '@/lib/auth-helpers';

// ===== إيجاد أو إنشاء عميل ضيف =====
async function findOrCreateGuest(phone: string, name: string, email?: string) {
  const normalizedPhone = phone.startsWith('+') ? phone : `+966${phone.replace(/^0/, '')}`;
  let user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone,
        email: email || null,
        password: await bcrypt.hash(normalizedPhone, 10),
        role: 'customer',
      },
    });
  }
  return user;
}

// ===== توليد رقم الحجز =====
async function generateBookingNumber(businessId: string) {
  const year = new Date().getFullYear();
  const count = await prisma.booking.count({ where: { businessId } });
  return `BK-${year}-${String(count + 1).padStart(4, '0')}`;
}

// ===== POST /api/bookings — إنشاء حجز جديد =====
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request); // optional auth
    const { serviceId, date, startTime, customerName, customerPhone, customerEmail, notes } = await request.json();

    if (!serviceId || !date || !startTime || !customerName || !customerPhone) {
      return Response.json({ success: false, message: 'جميع الحقول الأساسية مطلوبة' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true },
    });

    if (!service || !service.isActive) {
      return Response.json({ success: false, message: 'الخدمة غير متاحة' }, { status: 404 });
    }

    const businessId = service.businessId;

    // حساب وقت الانتهاء
    const [startH, startM] = startTime.split(':').map(Number);
    const endMinutes = startH * 60 + startM + service.duration;
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMin = endMinutes % 60;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    const bookingDate = new Date(date);

    // التحقق من عدم التعارض
    const conflicting = await prisma.booking.findFirst({
      where: {
        businessId,
        date: { gte: bookingDate, lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000) },
        status: { in: ['pending', 'confirmed'] },
        OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }],
      },
    });

    if (conflicting) {
      return Response.json({ success: false, message: 'هذا الموعد محجوز مسبقاً، اختر وقتاً آخر' }, { status: 409 });
    }

    // التحقق من يوم الإجازة
    const dayOff = await prisma.dayOff.findFirst({ where: { businessId, date: bookingDate } });
    if (dayOff) {
      return Response.json({ success: false, message: 'هذا اليوم إجازة رسمية، اختر يوماً آخر' }, { status: 400 });
    }

    const bookingNumber = await generateBookingNumber(businessId);
    const customer = user || await findOrCreateGuest(customerPhone, customerName, customerEmail);

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        businessId,
        serviceId,
        customerId: customer.id,
        date: bookingDate,
        startTime,
        endTime,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        notes: notes || null,
        totalAmount: service.price,
        currency: service.currency,
        status: 'confirmed',
      },
      include: { service: true, business: true },
    });

    return Response.json({ success: true, message: 'تم تأكيد الحجز بنجاح', data: booking }, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}

// ===== GET /api/bookings — جلب الحجوزات =====
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (user!.role === 'owner') {
      where.businessId = (user as any).ownedBusiness?.id;
    } else {
      where.customerId = user!.id;
    }

    if (date) {
      const d = new Date(date);
      where.date = { gte: d, lt: new Date(d.getTime() + 24 * 60 * 60 * 1000) };
    } else if (from || to) {
      where.date = {} as Record<string, Date>;
      if (from) (where.date as Record<string, Date>).gte = new Date(from);
      if (to) (where.date as Record<string, Date>).lte = new Date(to);
    }

    if (status && status !== 'all') where.status = status;

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { bookingNumber: { contains: search } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { service: true },
        orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: { data: bookings, total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}
