// app/api/auth/me/route.ts - بيانات المستخدم الحالي
import { NextRequest } from 'next/server';
import { getAuthUser, requireAuth } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  const authError = requireAuth(user);
  if (authError) return authError;

  const { password: _, ...safeUser } = user!;
  return Response.json({
    success: true,
    data: { user: safeUser, business: (user as any).ownedBusiness },
  });
}
