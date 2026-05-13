// app/api/services/[id]/route.ts - تحديث/حذف خدمة
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser, requireAuth, requireRole, handlePrismaError } from '@/lib/auth-helpers';

// ===== PUT /api/services/:id — تحديث خدمة =====
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;
    const roleError = requireRole(user!, 'owner', 'staff');
    if (roleError) return roleError;

    const { id } = await params;
    const { name, description, duration, price, color, isActive, sortOrder } = await request.json();

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
      },
    });

    return Response.json({ success: true, message: 'تم تحديث الخدمة بنجاح', data: service });
  } catch (error) {
    return handlePrismaError(error);
  }
}

// ===== DELETE /api/services/:id — حذف خدمة =====
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(request);
    const authError = requireAuth(user);
    if (authError) return authError;
    const roleError = requireRole(user!, 'owner');
    if (roleError) return roleError;

    const { id } = await params;

    const bookingsCount = await prisma.booking.count({
      where: { serviceId: id, status: { in: ['pending', 'confirmed'] } },
    });

    if (bookingsCount > 0) {
      await prisma.service.update({ where: { id }, data: { isActive: false } });
      return Response.json({ success: true, message: 'تم تعطيل الخدمة (توجد حجوزات مرتبطة بها)' });
    }

    await prisma.service.delete({ where: { id } });
    return Response.json({ success: true, message: 'تم حذف الخدمة بنجاح' });
  } catch (error) {
    return handlePrismaError(error);
  }
}
