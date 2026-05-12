'use client';

import { useState } from 'react';
import { ARABIC_DAYS_SHORT, ARABIC_MONTHS } from '@/lib/constants';
import { isPastDate, isToday } from '@/lib/utils';

interface BookingCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  workingDays?: number[]; // 0=الأحد ... 6=السبت — إذا فارغة تعني كل الأيام
  dayOffs?: string[]; // تواريخ YYYY-MM-DD
}

// ===== تقويم تفاعلي بالعربي =====
export default function BookingCalendar({
  selectedDate,
  onDateSelect,
  workingDays = [0, 1, 2, 3, 4], // الأحد للخميس
  dayOffs = [],
}: BookingCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // ===== توليد أيام الشهر =====
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(viewYear, viewMonth, d));
  }
  // تكملة الأسبوع الأخير
  while (days.length % 7 !== 0) days.push(null);

  // ===== التنقل بين الأشهر =====
  const goToPrev = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const goToNext = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  // ===== تحديد حالة اليوم =====
  const getDayClass = (date: Date): string => {
    const dateStr = date.toISOString().split('T')[0];
    const isSelected =
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();

    if (isSelected) return 'calendar-day selected';

    const past = isPastDate(date.toISOString());
    const isDayOff = dayOffs.includes(dateStr);
    const isWorkingDay = workingDays.includes(date.getDay());
    const todayClass = isToday(date.toISOString()) ? ' today' : '';

    if (past || isDayOff || !isWorkingDay) {
      return `calendar-day disabled${todayClass}`;
    }

    return `calendar-day${todayClass}`;
  };

  const handleDayClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const past = isPastDate(date.toISOString());
    const isDayOff = dayOffs.includes(dateStr);
    const isWorkingDay = workingDays.includes(date.getDay());
    if (!past && !isDayOff && isWorkingDay) {
      onDateSelect(date);
    }
  };

  return (
    <div className="border border-outline-variant rounded-xl bg-surface-container-lowest shadow-sm max-w-sm">
      {/* ===== رأس التقويم ===== */}
      <div className="flex justify-between items-center p-4 border-b border-outline-variant">
        <button
          onClick={goToNext}
          className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
          title="الشهر التالي"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-label-md font-semibold text-on-surface">
            {ARABIC_MONTHS[viewMonth]} {viewYear}
          </span>
          {(viewMonth !== today.getMonth() || viewYear !== today.getFullYear()) && (
            <button
              onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }}
              className="text-caption text-primary hover:underline mt-0.5"
            >
              اليوم
            </button>
          )}
        </div>

        <button
          onClick={goToPrev}
          className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
          title="الشهر السابق"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
      </div>

      {/* ===== رؤوس الأيام ===== */}
      <div className="grid grid-cols-7 gap-1 px-3 pt-3 pb-1">
        {ARABIC_DAYS_SHORT.map((day) => (
          <div key={day} className="text-caption text-on-surface-variant text-center font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* ===== أيام الشهر ===== */}
      <div className="grid grid-cols-7 gap-1 p-3">
        {days.map((date, i) => (
          <div key={i} className="flex items-center justify-center">
            {date ? (
              <button
                onClick={() => handleDayClick(date)}
                className={getDayClass(date)}
                disabled={getDayClass(date).includes('disabled')}
              >
                {date.getDate()}
              </button>
            ) : (
              <div className="h-9 w-9" />
            )}
          </div>
        ))}
      </div>

      {/* ===== مفتاح الألوان ===== */}
      <div className="flex items-center gap-4 px-4 pb-3 text-caption text-on-surface-variant flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>محدد</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full border-2 border-primary" />
          <span>اليوم</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-surface-container" />
          <span>غير متاح</span>
        </div>
      </div>
    </div>
  );
}
