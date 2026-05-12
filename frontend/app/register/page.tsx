'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { BUSINESS_TYPES, ERROR_MESSAGES } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '', businessName: '', businessType: 'clinic' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = ERROR_MESSAGES.minName;
    if (!form.phone.trim()) e.phone = ERROR_MESSAGES.required;
    if (!form.password) e.password = ERROR_MESSAGES.required;
    else if (form.password.length < 6) e.password = ERROR_MESSAGES.weakPassword;
    if (form.password !== form.confirmPassword) e.confirmPassword = 'كلمتا المرور غير متطابقتين';
    if (!form.businessName.trim()) e.businessName = ERROR_MESSAGES.required;
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = ERROR_MESSAGES.invalidEmail;
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
      const res = await authAPI.register({ name: form.name.trim(), phone: normalized, email: form.email || undefined, password: form.password, role: 'owner', businessName: form.businessName.trim(), businessType: form.businessType });
      if (res.data.success && res.data.data) {
        localStorage.setItem('authToken', res.data.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
        toast.success('تم إنشاء الحساب بنجاح! مرحباً بك');
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || ERROR_MESSAGES.networkError);
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-surface min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop">
      <main className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-modal border border-outline-variant p-unit-lg md:p-[2.5rem] flex flex-col gap-unit-lg relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-l from-primary via-primary-container to-secondary" />

        <div className="flex flex-col items-center text-center gap-unit-sm">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-unit-sm">
            <span className="material-symbols-outlined text-on-primary-container text-[32px]">add_business</span>
          </div>
          <h1 className="font-bold text-headline-lg text-primary">تسجيل منشأة جديدة</h1>
          <p className="text-body-md text-on-surface-variant">أنشئ حسابك وابدأ بإدارة حجوزاتك</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-unit-md" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-md">
            <FormField id="name" label="الاسم الكامل *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} placeholder="اسمك الكامل" />
            <div className="flex flex-col gap-unit-xs">
              <label className="text-label-md font-medium text-on-surface">رقم الجوال *</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-body-md text-on-surface-variant border-l border-outline-variant pr-3 h-full flex items-center" dir="ltr">+966</span>
                <input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="5X XXX XXXX" className={`w-full border rounded-lg px-3 py-3 pl-20 text-left text-body-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.phone ? 'border-error' : 'border-outline-variant'}`} />
              </div>
              {errors.phone && <p className="text-caption text-error">{errors.phone}</p>}
            </div>
          </div>

          <FormField id="email" label="البريد الإلكتروني" value={form.email} onChange={(v) => setForm({ ...form, email: v })} error={errors.email} placeholder="example@email.com" dir="ltr" optional />
          <FormField id="businessName" label="اسم المنشأة *" value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })} error={errors.businessName} placeholder="مثال: عيادة الابتسامة" />

          <div className="flex flex-col gap-unit-xs">
            <label className="text-label-md font-medium text-on-surface">نوع النشاط</label>
            <select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} className="border border-outline-variant rounded-lg px-3 py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary">
              {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-md">
            <div className="flex flex-col gap-unit-xs">
              <label className="text-label-md font-medium text-on-surface">كلمة المرور *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="6 أحرف على الأقل" className={`w-full border rounded-lg px-3 py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary ${errors.password ? 'border-error' : 'border-outline-variant'}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span></button>
              </div>
              {errors.password && <p className="text-caption text-error">{errors.password}</p>}
            </div>
            <FormField id="confirmPassword" label="تأكيد كلمة المرور *" value={form.confirmPassword} onChange={(v) => setForm({ ...form, confirmPassword: v })} error={errors.confirmPassword} placeholder="أعد كتابة كلمة المرور" type="password" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary text-label-md font-semibold py-3.5 rounded-lg mt-unit-sm hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري إنشاء الحساب...</> : <>إنشاء الحساب<span className="material-symbols-outlined text-[20px]">person_add</span></>}
          </button>
        </form>

        <div className="flex justify-center pt-unit-md border-t border-outline-variant">
          <p className="text-body-md text-on-surface-variant">لديك حساب؟ <a href="/login" className="text-primary font-medium hover:text-on-primary-fixed-variant">تسجيل الدخول</a></p>
        </div>
      </main>
    </div>
  );
}

function FormField({ id, label, value, onChange, error, placeholder, type = 'text', dir, optional }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; type?: string; dir?: string; optional?: boolean }) {
  return (
    <div className="flex flex-col gap-unit-xs">
      <label htmlFor={id} className="text-label-md font-medium text-on-surface">{label} {optional && <span className="text-caption text-on-surface-variant">(اختياري)</span>}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} dir={dir} className={`w-full border rounded-lg px-3 py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary ${dir === 'ltr' ? 'text-left' : ''} ${error ? 'border-error' : 'border-outline-variant'}`} />
      {error && <p className="text-caption text-error">{error}</p>}
    </div>
  );
}
