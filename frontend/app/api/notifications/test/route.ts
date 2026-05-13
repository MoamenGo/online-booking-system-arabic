// app/api/notifications/test/route.ts - اختبار الإشعارات
import { NextRequest } from 'next/server';
import { getAuthUser, requireAuth } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  const authError = requireAuth(user);
  if (authError) return authError;

  const { type, to } = await request.json();
  return Response.json({
    success: true,
    message: `تم إرسال إشعار تجريبي من نوع ${type} إلى ${to}`,
  });
}
