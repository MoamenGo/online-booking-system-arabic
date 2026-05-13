// lib/auth-helpers.ts - دوال المصادقة للـ API routes
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);
}

export async function getAuthUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { ownedBusiness: true },
    });

    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export function requireAuth(user: unknown) {
  if (!user) {
    return Response.json(
      { success: false, message: 'يجب تسجيل الدخول أولاً' },
      { status: 401 }
    );
  }
  return null;
}

export function requireRole(user: { role: string }, ...roles: string[]) {
  if (!roles.includes(user.role)) {
    return Response.json(
      { success: false, message: 'ليس لديك صلاحية للوصول إلى هذا المورد' },
      { status: 403 }
    );
  }
  return null;
}

export function handlePrismaError(err: unknown) {
  const error = err as { code?: string; meta?: { target?: string[] }; message?: string };
  
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'الحقل';
    return Response.json({ success: false, message: `هذا ${field} مسجل مسبقاً` }, { status: 409 });
  }
  if (error.code === 'P2025') {
    return Response.json({ success: false, message: 'السجل المطلوب غير موجود' }, { status: 404 });
  }

  console.error('❌ خطأ:', error.message);
  return Response.json(
    { success: false, message: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' },
    { status: 500 }
  );
}
