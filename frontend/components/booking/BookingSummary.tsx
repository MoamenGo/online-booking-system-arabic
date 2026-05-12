'use client';

import { formatDateArabic, formatTimeArabic, formatDuration, formatPrice } from '@/lib/utils';
import type { Service } from '@/types';

interface BookingSummaryProps {
  service: Service | null;
  date: Date | null;
  time: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}

// ===== ملخص الحجز =====
export default function BookingSummary({
  service,
  date,
  time,
  customerName,
  customerPhone,
  customerEmail,
  notes,
}: BookingSummaryProps) {
  if (!service) return null;

  const rows = [
    { label: 'الخدمة', value: service.name, icon: 'medical_services' },
    { label: 'المدة', value: formatDuration(service.duration), icon: 'schedule' },
    date ? { label: 'التاريخ', value: formatDateArabic(date.toISOString()), icon: 'calendar_today' } : null,
    time ? { label: 'الوقت', value: formatTimeArabic(time), icon: 'access_time', ltr: true } : null,
    customerName ? { label: 'الاسم', value: customerName, icon: 'person' } : null,
    customerPhone ? { label: 'الجوال', value: `+966 ${customerPhone}`, icon: 'phone', ltr: true } : null,
    customerEmail ? { label: 'البريد', value: customerEmail, icon: 'email', ltr: true } : null,
    notes ? { label: 'الملاحظات', value: notes, icon: 'notes' } : null,
  ].filter(Boolean) as { label: string; value: string; icon: string; ltr?: boolean }[];

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
      {/* رأس ملون */}
      <div className="bg-primary p-4 text-on-primary flex items-center gap-3">
        <span className="material-symbols-outlined text-[32px] filled">event_available</span>
        <div>
          <h3 className="text-title-lg font-semibold">مراجعة الحجز</h3>
          <p className="text-caption opacity-80">تأكد من صحة البيانات قبل التأكيد</p>
        </div>
      </div>

      {/* التفاصيل */}
      <div className="p-6 flex flex-col gap-3">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex justify-between items-center py-3 ${i < rows.length - 1 ? 'border-b border-outline-variant' : ''}`}
          >
            <span className="text-label-md text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">{row.icon}</span>
              {row.label}
            </span>
            <span className={`text-body-md font-medium text-on-surface ${row.ltr ? 'dir-ltr' : ''}`}>
              {row.value}
            </span>
          </div>
        ))}

        {/* الإجمالي */}
        <div className="mt-2 pt-4 border-t-2 border-primary flex justify-between items-center">
          <span className="text-title-lg font-bold text-on-surface">الإجمالي</span>
          <span className="text-headline-md font-bold text-primary">
            {formatPrice(service.price, service.currency)}
          </span>
        </div>
      </div>

      {/* تنبيه */}
      <div className="bg-surface-container-low px-6 py-3 flex items-center gap-2 text-caption text-on-surface-variant border-t border-outline-variant">
        <span className="material-symbols-outlined text-[16px]">info</span>
        سيتم إرسال تأكيد الحجز على رقم جوالك
      </div>
    </div>
  );
}
