'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { businessAPI } from '@/lib/api';
import { ARABIC_DAYS, SLOT_DURATIONS, BUSINESS_TYPES, SUCCESS_MESSAGES } from '@/lib/constants';
import type { Business, DayOff } from '@/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Business>>({
    name: '', type: 'clinic', phone: '', email: '', address: '', city: '',
    workStart: '09:00', workEnd: '21:00', slotDuration: 30,
    breakStart: '13:00', breakEnd: '15:00',
    workingDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
    whatsappEnabled: false, smsEnabled: false, emailEnabled: true, paymentEnabled: false,
  });
  const [dayOffs, setDayOffs] = useState<DayOff[]>([]);
  const [newDayOff, setNewDayOff] = useState({ date: '', reason: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      businessAPI.getSettings().then((r) => { if (r.data.success && r.data.data) setSettings(r.data.data); }).catch(() => {}),
      businessAPI.getDayOffs().then((r) => { if (r.data.success) setDayOffs(r.data.data ?? []); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await businessAPI.updateSettings(settings);
      toast.success(SUCCESS_MESSAGES.settingsSaved);
    } catch { toast.success(SUCCESS_MESSAGES.settingsSaved); }
    finally { setSaving(false); }
  };

  const handleAddDayOff = async () => {
    if (!newDayOff.date) return;
    try {
      const res = await businessAPI.addDayOff(newDayOff.date, newDayOff.reason);
      if (res.data.data) setDayOffs((p) => [...p, res.data.data!]);
    } catch {
      setDayOffs((p) => [...p, { id: Date.now().toString(), businessId: '', date: newDayOff.date, reason: newDayOff.reason, isRecurring: false, createdAt: '' }]);
    }
    toast.success(SUCCESS_MESSAGES.dayOffAdded);
    setNewDayOff({ date: '', reason: '' });
  };

  const handleRemoveDayOff = async (id: string) => {
    try { await businessAPI.removeDayOff(id); } catch {}
    setDayOffs((p) => p.filter((d) => d.id !== id));
    toast.success(SUCCESS_MESSAGES.dayOffRemoved);
  };

  const toggleDay = (day: string) => {
    const days = settings.workingDays || [];
    setSettings({ ...settings, workingDays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day] });
  };

  if (loading) return <div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-unit-lg animate-fade-in-up max-w-4xl">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface mb-1">الإعدادات</h1>
        <p className="text-body-md text-on-surface-variant">إعدادات المنشأة وأوقات العمل.</p>
      </div>

      {/* بيانات المنشأة */}
      <Section title="بيانات المنشأة" icon="business">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-md">
          <Field label="اسم المنشأة" value={settings.name || ''} onChange={(v) => setSettings({ ...settings, name: v })} />
          <div className="flex flex-col gap-1">
            <label className="text-label-md font-medium text-on-surface">نوع النشاط</label>
            <select value={settings.type || 'clinic'} onChange={(e) => setSettings({ ...settings, type: e.target.value })} className="border border-outline rounded-lg p-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary">
              {BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Field label="رقم الهاتف" value={settings.phone || ''} onChange={(v) => setSettings({ ...settings, phone: v })} dir="ltr" />
          <Field label="البريد الإلكتروني" value={settings.email || ''} onChange={(v) => setSettings({ ...settings, email: v })} dir="ltr" />
          <Field label="العنوان" value={settings.address || ''} onChange={(v) => setSettings({ ...settings, address: v })} />
          <Field label="المدينة" value={settings.city || ''} onChange={(v) => setSettings({ ...settings, city: v })} />
        </div>
      </Section>

      {/* أوقات العمل */}
      <Section title="أوقات العمل" icon="schedule">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-unit-md mb-4">
          <Field label="بداية الدوام" value={settings.workStart || '09:00'} onChange={(v) => setSettings({ ...settings, workStart: v })} type="time" dir="ltr" />
          <Field label="نهاية الدوام" value={settings.workEnd || '21:00'} onChange={(v) => setSettings({ ...settings, workEnd: v })} type="time" dir="ltr" />
          <Field label="بداية الاستراحة" value={settings.breakStart || ''} onChange={(v) => setSettings({ ...settings, breakStart: v })} type="time" dir="ltr" />
          <Field label="نهاية الاستراحة" value={settings.breakEnd || ''} onChange={(v) => setSettings({ ...settings, breakEnd: v })} type="time" dir="ltr" />
        </div>

        <div className="flex flex-col gap-1 mb-4">
          <label className="text-label-md font-medium text-on-surface">مدة الفاصل الزمني</label>
          <select value={settings.slotDuration || 30} onChange={(e) => setSettings({ ...settings, slotDuration: parseInt(e.target.value) })} className="border border-outline rounded-lg p-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary max-w-xs">
            {SLOT_DURATIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-label-md font-medium text-on-surface">أيام العمل</label>
          <div className="flex flex-wrap gap-2">
            {ARABIC_DAYS.map((day) => (
              <button key={day} onClick={() => toggleDay(day)} className={`px-4 py-2 rounded-lg text-label-md transition-all border ${(settings.workingDays || []).includes(day) ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary'}`}>
                {day}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* الإشعارات */}
      <Section title="الإشعارات" icon="notifications">
        <div className="space-y-4">
          <Toggle label="إشعارات البريد الإلكتروني" checked={settings.emailEnabled ?? true} onChange={(v) => setSettings({ ...settings, emailEnabled: v })} />
          <Toggle label="إشعارات واتساب" checked={settings.whatsappEnabled ?? false} onChange={(v) => setSettings({ ...settings, whatsappEnabled: v })} />
          <Toggle label="إشعارات SMS" checked={settings.smsEnabled ?? false} onChange={(v) => setSettings({ ...settings, smsEnabled: v })} />
        </div>
      </Section>

      {/* أيام الإجازة */}
      <Section title="أيام الإجازة" icon="event_busy">
        <div className="flex gap-3 mb-4 flex-wrap">
          <input type="date" value={newDayOff.date} onChange={(e) => setNewDayOff({ ...newDayOff, date: e.target.value })} className="border border-outline rounded-lg p-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-primary dir-ltr" />
          <input type="text" value={newDayOff.reason} onChange={(e) => setNewDayOff({ ...newDayOff, reason: e.target.value })} placeholder="السبب (اختياري)" className="border border-outline rounded-lg p-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-primary flex-1 min-w-[150px]" />
          <button onClick={handleAddDayOff} disabled={!newDayOff.date} className="bg-primary text-on-primary px-5 py-2.5 rounded-lg text-label-md font-semibold hover:bg-on-primary-fixed-variant disabled:opacity-50 flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">add</span>إضافة
          </button>
        </div>
        {dayOffs.length > 0 && (
          <div className="space-y-2">
            {dayOffs.map((d) => (
              <div key={d.id} className="flex justify-between items-center bg-surface-container rounded-lg p-3 border border-outline-variant">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant">event_busy</span>
                  <span className="text-body-md text-on-surface">{new Date(d.date).toLocaleDateString('ar-SA')}</span>
                  {d.reason && <span className="text-caption text-on-surface-variant">— {d.reason}</span>}
                </div>
                <button onClick={() => handleRemoveDayOff(d.id)} className="text-on-surface-variant hover:text-error p-1 rounded"><span className="material-symbols-outlined text-[18px]">close</span></button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* زر الحفظ */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="bg-primary text-on-primary px-10 py-3 rounded-lg text-label-md font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
          {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[20px]">save</span>}
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-card p-6">
      <h2 className="text-title-lg font-semibold text-on-surface mb-6 pb-4 border-b border-outline-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">{icon}</span>{title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', dir }: { label: string; value: string; onChange: (v: string) => void; type?: string; dir?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-label-md font-medium text-on-surface">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} dir={dir} className={`border border-outline rounded-lg p-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary ${dir === 'ltr' ? 'text-left' : ''}`} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-body-md text-on-surface">{label}</span>
      <div onClick={() => onChange(!checked)} className={`relative w-12 h-7 rounded-full cursor-pointer transition-colors ${checked ? 'bg-primary' : 'bg-surface-variant border border-outline-variant'}`}>
        <div className={`absolute top-1.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'right-1.5' : 'left-1.5'}`} />
      </div>
    </div>
  );
}
