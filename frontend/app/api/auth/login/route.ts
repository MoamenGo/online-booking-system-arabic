// app/api/auth/login/route.ts - تسجيل الدخول
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateToken, handlePrismaError } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const { phone, email, password } = await request.json();

    if (!password) {
      return Response.json({ success: false, message: 'كلمة المرور مطلوبة' }, { status: 400 });
    }

    const identifier = phone
      ? (phone.startsWith('+') ? phone : `+966${phone.replace(/^0/, '')}`)
      : email;

    if (!identifier) {
      return Response.json({ success: false, message: 'رقم الجوال أو البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: phone ? { phone: identifier } : { email: identifier },
      include: { ownedBusiness: true },
    });

    if (!user) {
      return Response.json({ success: false, message: 'رقم الجوال أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    if (!user.isActive) {
      return Response.json({ success: false, message: 'تم تعطيل هذا الحساب، تواصل مع الدعم' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return Response.json({ success: false, message: 'رقم الجوال أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;

    return Response.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: { user: safeUser, token, business: user.ownedBusiness },
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}
