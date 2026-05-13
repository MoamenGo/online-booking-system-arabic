// app/api/auth/password/route.ts - تغيير كلمة المرور
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, handlePrismaError } from '@/lib/auth-helpers';

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return Response.json({ success: false, message: 'كلمة المرور الحالية والجديدة مطلوبتان' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return Response.json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user!.id } });
    const isMatch = await bcrypt.compare(currentPassword, dbUser!.password);
    if (!isMatch) {
      return Response.json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user!.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });

    return Response.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    return handlePrismaError(error);
  }
}
