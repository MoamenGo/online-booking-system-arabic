// app/api/business/dayoffs/[id]/route.ts - حذف يوم إجازة
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, requireRole, handlePrismaError } from '@/lib/auth-helpers';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;
    const roleError = requireRole(user!, 'owner');
    if (roleError) return roleError;

    const { id } = await params;
    await prisma.dayOff.delete({ where: { id } });
    return Response.json({ success: true, message: 'تم حذف يوم الإجازة' });
  } catch (error) {
    return handlePrismaError(error);
  }
}
