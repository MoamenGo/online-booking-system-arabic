// app/api/business/settings/route.ts - إعدادات العمل التجاري
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, requireRole, handlePrismaError } from '@/lib/auth-helpers';

// ===== GET /api/business/settings =====
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const businessId = (user as any).ownedBusiness?.id;
    if (!businessId) {
      return Response.json({ success: false, message: 'لا يوجد عمل تجاري' }, { status: 404 });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    return Response.json({ success: true, data: business });
  } catch (error) {
    return handlePrismaError(error);
  }
}

// ===== PUT /api/business/settings =====
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;
    const roleError = requireRole(user!, 'owner');
    if (roleError) return roleError;

    const businessId = (user as any).ownedBusiness?.id;
    const updateData = await request.json();
    delete updateData.id;
    delete updateData.ownerId;

    const business = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });

    return Response.json({ success: true, message: 'تم حفظ الإعدادات بنجاح', data: business });
  } catch (error) {
    return handlePrismaError(error);
  }
}
