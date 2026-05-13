// app/api/services/route.ts - إدارة الخدمات
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, requireRole, handlePrismaError } from '@/lib/auth-helpers';

// ===== GET /api/services — جلب الخدمات (عام) =====
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive');
    const businessId = searchParams.get('businessId');

    const where: Record<string, unknown> = {};
    if (businessId) where.businessId = businessId;
    if (!includeInactive || includeInactive !== 'true') where.isActive = true;

    const services = await prisma.service.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return Response.json({ success: true, data: services });
  } catch (error) {
    return handlePrismaError(error);
  }
}

// ===== POST /api/services — إنشاء خدمة جديدة =====
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;
    const roleError = requireRole(user!, 'owner', 'staff');
    if (roleError) return roleError;

    const { name, description, duration, price, color, isActive = true, sortOrder = 0 } = await request.json();

    if (!name || !duration || price === undefined) {
      return Response.json({ success: false, message: 'الاسم والمدة والسعر مطلوبة' }, { status: 400 });
    }

    const businessId = (user as any).ownedBusiness?.id;
    if (!businessId) {
      return Response.json({ success: false, message: 'لا يوجد عمل تجاري مرتبط بهذا الحساب' }, { status: 403 });
    }

    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        currency: (user as any).ownedBusiness?.currency || 'SAR',
        color: color || '#2170e4',
        isActive,
        sortOrder: parseInt(sortOrder),
      },
    });

    return Response.json({ success: true, message: 'تم إضافة الخدمة بنجاح', data: service }, { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
}
