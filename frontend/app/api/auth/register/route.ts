// app/api/auth/register/route.ts - تسجيل حساب جديد
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateToken, handlePrismaError } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, password, role = 'customer', businessName, businessType } = await request.json();

    if (!name || !phone || !password) {
      return Response.json({ success: false, message: 'الاسم ورقم الجوال وكلمة المرور مطلوبة' }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ success: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phone: phone.startsWith('+') ? phone : `+966${phone}`,
        email: email || null,
        password: hashedPassword,
        role,
      },
    });

    let business = null;
    if (role === 'owner' && businessName) {
      business = await prisma.business.create({
        data: {
          name: businessName,
          type: businessType || 'other',
          phone: user.phone,
          email: email || null,
          country: 'السعودية',
          currency: 'SAR',
          timezone: 'Asia/Riyadh',
          workingDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
          workStart: '09:00',
          workEnd: '21:00',
          slotDuration: 30,
          owner: { connect: { id: user.id } },
        },
      });
    }

    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;

    return Response.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: { user: safeUser, token, business },
    }, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}
