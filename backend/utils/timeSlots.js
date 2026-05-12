// backend/utils/timeSlots.js - دالة حساب الأوقات المتاحة

/**
 * تحويل الوقت HH:MM إلى دقائق
 */
function toMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * تنسيق الوقت بالعربي
 */
function formatArabicTime(time24) {
  const [hourStr, minuteStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  
  let period;
  let displayHour = hour;
  
  if (hour === 0) { displayHour = 12; period = 'فجراً'; }
  else if (hour < 12) { period = 'صباحاً'; }
  else if (hour === 12) { period = 'ظهراً'; }
  else { displayHour = hour - 12; period = 'مساءً'; }
  
  const minuteDisplay = minute === '00' ? '' : `:${minute}`;
  return `${displayHour}${minuteDisplay} ${period}`;
}

/**
 * توليد جميع الأوقات المتاحة ليوم معين
 */
function generateTimeSlots({
  workStart,    // "09:00"
  workEnd,      // "21:00"
  slotDuration, // 30 (دقيقة)
  breakStart,   // "13:00" | null
  breakEnd,     // "15:00" | null
  existingBookings, // [{ startTime, endTime }]
  serviceDuration,  // مدة الخدمة بالدقائق
  date,             // Date object
}) {
  const slots = [];
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

    // تجاهل الأوقات الماضية
    if (isToday && current < currentMinutes) {
      available = false;
    }

    // استثناء وقت الاستراحة
    if (breakStartMin && breakEndMin) {
      if (current < breakEndMin && end > breakStartMin) {
        available = false;
      }
    }

    // التحقق من التعارض مع الحجوزات الموجودة
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

    slots.push({
      time: timeStr,
      endTime: endStr,
      available,
      label: formatArabicTime(timeStr),
    });

    current += slotDuration;
  }

  return slots;
}

module.exports = { generateTimeSlots, toMinutes, formatArabicTime };
