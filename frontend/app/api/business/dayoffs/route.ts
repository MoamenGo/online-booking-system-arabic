// app/api/business/dayoffs/route.ts - أيام الإجازة
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, requireRole, handlePrismaError } from '@/lib/auth-helpers';

// ===== GET /api/business/dayoffs =====
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const businessId = (user as any).ownedBusiness?.id;
    const dayOffs = await prisma.dayOff.findMany({
      where: { businessId },
      orderBy: { date: 'asc' },
    });

    return Response.json({ success: true, data: dayOffs });
  } catch (error) {
    return handlePrismaError(error);
  }
}

// ===== POST /api/business/dayoffs =====
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;
    const roleError = requireRole(user!, 'owner');
    if (roleError) return roleError;

    const businessId = (user as any).ownedBusiness?.id;
    const { date, reason, isRecurring = false } = await request.json();

    const dayOff = await prisma.dayOff.create({
      data: { businessId, date: new Date(date), reason, isRecurring },
    });

    return Response.json({ success: true, message: 'تم إضافة يوم الإجازة بنجاح', data: dayOff }, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}
