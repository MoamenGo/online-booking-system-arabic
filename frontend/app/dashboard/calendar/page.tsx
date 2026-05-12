'use client';

import { useState, useEffect, useMemo } from 'react';
import { bookingsAPI } from '@/lib/api';
import { ARABIC_MONTHS, ARABIC_DAYS_SHORT, BOOKING_STATUS } from '@/lib/constants';
import { formatTimeArabic, getStatusBadgeClass, getStatusLabel, toApiDate } from '@/lib/utils';
import type { Booking } from '@/types';

export default function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // جلب حجوزات اليوم المحدد
  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    bookingsAPI.getAll({ date: toApiDate(selectedDate), limit: 50 })
      .then((res) => { if (res.data.success && res.data.data) setBookings(res.data.data.data); })
      .catch(() => setBookings(MOCK_BOOKINGS))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  // أيام الشهر
  const days = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(viewYear, viewMonth, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [viewYear, viewMonth]);

  const goToPrev = () => { if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else setViewMonth((m) => m - 1); };
  const goToNext = () => { if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else setViewMonth((m) => m + 1); };

  const isSameDay = (a: Date, b: Date) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const isToday = (d: Date) => isSameDay(d, today);
  const isSelected = (d: Date) => selectedDate ? isSameDay(d, selectedDate) : false;

  return (
    <div className="flex flex-col gap-unit-lg animate-fade-in-up">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface mb-1">التقويم</h1>
        <p className="text-body-md text-on-surface-variant">عرض الحجوزات حسب التاريخ.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* التقويم */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-card">
          {/* رأس التقويم */}
          <div className="flex justify-between items-center p-4 border-b border-outline-variant">
            <button onClick={goToNext} className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant"><span className="material-symbols-outlined">chevron_right</span></button>
            <h2 className="text-title-lg font-semibold text-on-surface">{ARABIC_MONTHS[viewMonth]} {viewYear}</h2>
            <button onClick={goToPrev} className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant"><span className="material-symbols-outlined">chevron_left</span></button>
          </div>

          {/* رؤوس الأيام */}
          <div className="grid grid-cols-7 gap-px bg-surface-container p-2">
            {ARABIC_DAYS_SHORT.map((d) => <div key={d} className="text-center text-label-md font-semibold text-on-surface-variant py-2">{d}</div>)}
          </div>

          {/* الأيام */}
          <div className="grid grid-cols-7 gap-px bg-surface-container p-2">
            {days.map((date, i) => (
              <div key={i} className="flex items-center justify-center">
                {date ? (
                  <button
                    onClick={() => setSelectedDate(date)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-label-md transition-all ${
                      isSelected(date) ? 'bg-primary text-on-primary font-bold' :
                      isToday(date) ? 'border-2 border-primary text-primary font-semibold' :
                      'text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                ) : <div className="w-10 h-10" />}
              </div>
            ))}
          </div>
        </div>

        {/* قائمة حجوزات اليوم المحدد */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-card p-6 flex flex-col">
          <h3 className="text-title-lg font-semibold text-on-surface mb-4 pb-3 border-b border-outline-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">list_alt</span>
            {selectedDate ? `حجوزات ${selectedDate.getDate()} ${ARABIC_MONTHS[selectedDate.getMonth()]}` : 'اختر يوماً'}
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-surface-container animate-pulse rounded-lg" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant flex-1 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[40px] mb-2">event_busy</span>
              <p className="text-body-md">لا توجد حجوزات في هذا اليوم</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-surface-container-high hover:border-primary-fixed transition-colors">
                  <div className="text-center w-14 shrink-0">
                    <div className="text-title-lg font-bold text-primary dir-ltr">{b.startTime}</div>
                  </div>
                  <div className="w-px h-10 bg-outline-variant" />
                  <div className="flex-1 min-w-0">
                    <div className="text-body-md font-semibold text-on-surface truncate">{b.customerName}</div>
                    <div className="text-caption text-on-surface-variant truncate">{b.service?.name ?? '—'}</div>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(b.status)} shrink-0`}>{getStatusLabel(b.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MOCK_BOOKINGS: Booking[] = [
  { id: '1', bookingNumber: 'BK-2026-0001', businessId: 'b1', serviceId: 's1', customerId: 'c1', date: new Date().toISOString(), startTime: '09:00', endTime: '09:30', status: 'confirmed', customerName: 'فاطمة علي', customerPhone: '', currency: 'SAR', service: { id: 's1', businessId: 'b1', name: 'كشف عام', duration: 30, price: 100, currency: 'SAR', isActive: true, sortOrder: 0 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
  { id: '2', bookingNumber: 'BK-2026-0002', businessId: 'b1', serviceId: 's2', customerId: 'c2', date: new Date().toISOString(), startTime: '10:30', endTime: '11:15', status: 'pending', customerName: 'خالد محمد', customerPhone: '', currency: 'SAR', service: { id: 's2', businessId: 'b1', name: 'تنظيف أسنان', duration: 45, price: 200, currency: 'SAR', isActive: true, sortOrder: 1 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
];
