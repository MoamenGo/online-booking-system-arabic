// app/api/auth/profile/route.ts - تحديث الملف الشخصي
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, handlePrismaError } from '@/lib/auth-helpers';

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { name, email } = await request.json();
    const updated = await prisma.user.update({
      where: { id: user!.id },
      data: { name, email: email || null },
    });
    const { password: _, ...safeUser } = updated;
    return Response.json({ success: true, message: 'تم تحديث الملف الشخصي بنجاح', data: safeUser });
  } catch (error) {
    return handlePrismaError(error);
  }
}
