'use client';

import type { TimeSlot } from '@/types';

interface TimeSlotsProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (time: string) => void;
  isLoading: boolean;
}

// ===== شبكة الأوقات المتاحة =====
export default function TimeSlotsGrid({
  slots,
  selectedTime,
  onTimeSelect,
  isLoading,
}: TimeSlotsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-unit-sm">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-surface-container animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant bg-surface-container rounded-lg">
        <span className="material-symbols-outlined text-[40px] mb-2 block">event_busy</span>
        <p className="text-body-md">لا توجد أوقات متاحة في هذا اليوم</p>
        <p className="text-caption mt-1">يرجى اختيار تاريخ آخر</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-unit-sm">
      {slots.map((slot) => {
        const isSelected = selectedTime === slot.time;
        const isBooked = !slot.available;

        return (
          <button
            key={slot.time}
            onClick={() => slot.available && onTimeSelect(slot.time)}
            disabled={isBooked}
            title={isBooked ? 'هذا الوقت محجوز' : slot.label}
            className={`time-slot text-center text-label-md transition-all duration-150 ${
              isBooked
                ? 'booked'
                : isSelected
                ? 'selected'
                : ''
            }`}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
