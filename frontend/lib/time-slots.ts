// lib/time-slots.ts - حساب الأوقات المتاحة

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatArabicTime(time24: string): string {
  const [hourStr, minuteStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;

  let period: string;
  let displayHour = hour;

  if (hour === 0) { displayHour = 12; period = 'فجراً'; }
  else if (hour < 12) { period = 'صباحاً'; }
  else if (hour === 12) { period = 'ظهراً'; }
  else { displayHour = hour - 12; period = 'مساءً'; }

  const minuteDisplay = minute === '00' ? '' : `:${minute}`;
  return `${displayHour}${minuteDisplay} ${period}`;
}

interface GenerateTimeSlotsParams {
  workStart: string;
  workEnd: string;
  slotDuration: number;
  breakStart: string | null;
  breakEnd: string | null;
  existingBookings: { startTime: string; endTime: string }[];
  serviceDuration: number;
  date: Date;
}

export function generateTimeSlots({
  workStart,
  workEnd,
  slotDuration,
  breakStart,
  breakEnd,
  existingBookings,
  serviceDuration,
  date,
}: GenerateTimeSlotsParams) {
  const slots: { time: string; endTime: string; available: boolean; label: string }[] = [];
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() + 5 : 0;

  const startMin = toMinutes(workStart);
  const endMin = toMinutes(workEnd);
  const breakStartMin = breakStart ? toMinutes(breakStart) : null;
  const breakEndMin = breakEnd ? toMinutes(breakEnd) : null;

  let current = startMin;

  while (current + serviceDuration <= endMin) {
    const end = current + serviceDuration;
    const timeStr = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
    const endStr = `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;

    let available = true;

    if (isToday && current < currentMinutes) {
      available = false;
    }

    if (breakStartMin && breakEndMin) {
      if (current < breakEndMin && end > breakStartMin) {
        available = false;
      }
    }

    if (available) {
      for (const booking of existingBookings) {
        const bookingStart = toMinutes(booking.startTime);
        const bookingEnd = toMinutes(booking.endTime);
        if (current < bookingEnd && end > bookingStart) {
          available = false;
          break;
        }
      }
    }

    slots.push({ time: timeStr, endTime: endStr, available, label: formatArabicTime(timeStr) });
    current += slotDuration;
  }

  return slots;
}
