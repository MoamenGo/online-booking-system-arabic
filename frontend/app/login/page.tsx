'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { ERROR_MESSAGES } from '@/lib/constants';

// ===== صفحة تسجيل الدخول =====
export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.phone.trim()) e.phone = ERROR_MESSAGES.required;
    if (!form.password.trim()) e.password = ERROR_MESSAGES.required;
    else if (form.password.length < 6) e.password = ERROR_MESSAGES.weakPassword;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const phone = form.phone.replace(/\s/g, '');
      const normalized = phone.startsWith('+') ? phone : `+966${phone}`;
      const res = await authAPI.login(normalized, form.password);
      if (res.data.success && res.data.data) {
        const { token, user } = res.data.data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        toast.success('مرحباً بك! تم تسجيل الدخول بنجاح');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || ERROR_MESSAGES.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop">
      <main className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-modal border border-outline-variant p-unit-lg md:p-[2.5rem] flex flex-col gap-unit-lg relative overflow-hidden animate-fade-in-up">
        {/* شريط لوني علوي */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-primary via-primary-container to-secondary" />

        {/* رأس الصفحة */}
        <div className="flex flex-col items-center text-center gap-unit-sm">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-unit-sm">
            <span className="material-symbols-outlined text-on-primary-container text-[32px]">calendar_clock</span>
          </div>
          <h1 className="font-bold text-headline-lg text-primary">نظام الحجز الذكي</h1>
          <p className="text-title-lg font-semibold text-on-surface mt-unit-sm">تسجيل الدخول</p>
          <p className="text-body-md text-on-surface-variant">مرحباً بك مجدداً في لوحة التحكم الخاصة بك</p>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-unit-md" noValidate>
          {/* رقم الجوال */}
          <div className="flex flex-col gap-unit-xs">
            <label className="text-label-md font-medium text-on-surface" htmlFor="phone">
              رقم الجوال
            </label>
            <div className="relative flex items-center">
              <span
                className="absolute left-3 text-body-md text-on-surface-variant flex items-center h-full border-l border-outline-variant pr-3"
                dir="ltr"
              >
                +966
              </span>
              <input
                id="phone"
                type="tel"
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="5X XXX XXXX"
                className={`w-full border rounded-lg px-3 py-3 pl-20 text-left text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${errors.phone ? 'border-error' : 'border-outline-variant'}`}
              />
            </div>
            {errors.phone && (
              <p className="text-caption text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.phone}
              </p>
            )}
          </div>

          {/* كلمة المرور */}
          <div className="flex flex-col gap-unit-xs">
            <div className="flex justify-between items-center">
              <label className="text-label-md font-medium text-on-surface" htmlFor="password">
                كلمة المرور
              </label>
              <a href="#" className="text-caption text-primary hover:text-on-primary-fixed-variant transition-colors">
                هل نسيت كلمة المرور؟
              </a>
            </div>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className={`w-full border rounded-lg px-3 py-3 text-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${errors.password ? 'border-error' : 'border-outline-variant'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
            {errors.password && (
              <p className="text-caption text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {errors.password}
              </p>
            )}
          </div>

          {/* زر الدخول */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary text-label-md font-semibold py-3 rounded-lg mt-unit-sm hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center justify-center gap-unit-sm disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                تسجيل الدخول
                <span className="material-symbols-outlined text-[20px]">login</span>
              </>
            )}
          </button>
        </form>

        {/* روابط إضافية */}
        <div className="flex justify-center items-center pt-unit-md border-t border-outline-variant">
          <p className="text-body-md text-on-surface-variant">
            ليس لديك حساب؟{' '}
            <a href="/register" className="text-primary font-medium hover:text-on-primary-fixed-variant transition-colors">
              تسجيل منشأة جديدة
            </a>
          </p>
        </div>

        <div className="text-center">
          <a href="/" className="text-caption text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            العودة للصفحة الرئيسية
          </a>
        </div>
      </main>
    </div>
  );
}
