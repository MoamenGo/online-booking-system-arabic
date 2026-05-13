// app/api/services/reorder/route.ts - إعادة ترتيب الخدمات
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, requireRole, handlePrismaError } from '@/lib/auth-helpers';

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;
    const roleError = requireRole(user!, 'owner');
    if (roleError) return roleError;

    const { orders } = await request.json();
    await Promise.all(
      orders.map(({ id, sortOrder }: { id: string; sortOrder: number }) =>
        prisma.service.update({ where: { id }, data: { sortOrder } })
      )
    );

    return Response.json({ success: true, message: 'تم إعادة الترتيب بنجاح' });
  } catch (error) {
    return handlePrismaError(error);
  }
}
