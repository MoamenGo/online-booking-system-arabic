'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { bookingsAPI } from '@/lib/api';
import { formatDateArabic, formatTimeArabic } from '@/lib/utils';
import type { Booking } from '@/types';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (bookingId) {
      bookingsAPI.getById(bookingId)
        .then((res) => { if (res.data.success) setBooking(res.data.data ?? null); })
        .catch(() => setBooking(MOCK_BOOKING));
    } else {
      setBooking(MOCK_BOOKING);
    }
  }, [bookingId]);

  return (
    <main className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-modal p-unit-lg md:p-margin-desktop flex flex-col items-center animate-fade-in-up">
      {/* أيقونة النجاح */}
      <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center mb-unit-lg shadow-sm border border-outline-variant">
        <span
          className="material-symbols-outlined text-[48px] text-on-primary-container filled"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
      </div>

      {/* العنوان */}
      <h1 className="text-headline-lg font-bold text-on-surface text-center mb-unit-xs">
        تم تأكيد حجزك بنجاح! 🎉
      </h1>
      <p className="text-body-lg text-on-surface-variant text-center mb-unit-lg">
        رقم الحجز:{' '}
        <span className="font-bold text-on-surface dir-ltr inline-block">
          {booking?.bookingNumber ?? 'BK-2026-0001'}
        </span>
      </p>

      {/* بطاقة الملخص */}
      {booking && (
        <div className="w-full bg-surface-container rounded-lg p-unit-md flex flex-col gap-unit-md mb-unit-lg border border-outline-variant">
          {[
            { label: 'اسم العميل', value: booking.customerName },
            { label: 'الخدمة', value: booking.service?.name ?? '—' },
            { label: 'التاريخ', value: formatDateArabic(booking.date) },
            { label: 'الوقت', value: formatTimeArabic(booking.startTime), ltr: true },
            { label: 'رقم الهاتف', value: booking.customerPhone, ltr: true },
          ].map((row, i, arr) => (
            <div
              key={i}
              className={`flex justify-between items-center ${i < arr.length - 1 ? 'border-b border-outline-variant pb-unit-sm' : ''}`}
            >
              <span className="text-label-md text-on-surface-variant">{row.label}</span>
              <span className={`text-body-md font-semibold text-on-surface ${row.ltr ? 'dir-ltr' : ''}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* الأزرار */}
      <a
        href="/"
        className="w-full bg-primary text-on-primary text-label-md font-semibold py-4 px-unit-md rounded-lg text-center hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center justify-center gap-2"
      >
        العودة للرئيسية
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
      </a>

      <p className="text-caption text-on-surface-variant text-center mt-4">
        سيتم إرسال تأكيد الحجز على رقم جوالك المسجل
      </p>
    </main>
  );
}

// ===== صفحة تأكيد الحجز =====
export default function BookingSuccessPage() {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop">
      <Suspense fallback={<div className="text-on-surface-variant">جاري التحميل...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}

const MOCK_BOOKING: Booking = {
  id: 'mock-1',
  bookingNumber: 'BK-2026-0001',
  businessId: 'b1',
  serviceId: 's1',
  customerId: 'c1',
  date: new Date().toISOString(),
  startTime: '10:00',
  endTime: '10:30',
  status: 'confirmed',
  customerName: 'أحمد عبدالله',
  customerPhone: '+966 50 123 4567',
  service: { id: 's1', businessId: 'b1', name: 'كشف عام', duration: 30, price: 100, currency: 'SAR', isActive: true, sortOrder: 0 },
  currency: 'SAR',
  whatsappSent: false,
  smsSent: false,
  emailSent: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
