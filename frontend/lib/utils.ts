import { ARABIC_MONTHS, ARABIC_DAYS, CURRENCIES, BOOKING_STATUS } from './constants';
import type { BookingStatus } from '@/types';

// ===== تنسيق الأوقات بالعربي =====
export function formatTimeArabic(time24: string): string {
  const [hourStr, minuteStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';

  let period = '';
  let displayHour = hour;

  if (hour === 0) {
    displayHour = 12;
    period = 'فجراً';
  } else if (hour < 12) {
    period = 'صباحاً';
  } else if (hour === 12) {
    period = 'ظهراً';
  } else {
    displayHour = hour - 12;
    period = hour < 18 ? 'مساءً' : 'مساءً';
    if (hour >= 20) period = 'مساءً';
  }

  const minuteDisplay = minute === '00' ? '' : `:${minute}`;
  return `${displayHour}${minuteDisplay} ${period}`;
}

// ===== تنسيق التاريخ بالعربي =====
export function formatDateArabic(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = ARABIC_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// ===== تنسيق التاريخ مع اليوم =====
export function formatDateWithDay(dateStr: string): string {
  const date = new Date(dateStr);
  const dayName = ARABIC_DAYS[date.getDay()];
  const day = date.getDate();
  const month = ARABIC_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}، ${day} ${month} ${year}`;
}

// ===== اليوم بالعربي =====
export function getTodayArabic(): string {
  return formatDateWithDay(new Date().toISOString());
}

// ===== تنسيق السعر =====
export function formatPrice(amount: number, currency: string = 'SAR'): string {
  const curr = CURRENCIES[currency as keyof typeof CURRENCIES];
  if (!curr) return `${amount} ${currency}`;
  return `${amount.toLocaleString('en')} ${curr.symbol}`;
}

// ===== التحقق من رقم الجوال السعودي =====
export function validateSaudiPhone(phone: string): boolean {
  // يبدأ بـ 5 ويكون 9 أرقام
  const cleaned = phone.replace(/\s/g, '').replace(/^(\+966|0966|966|0)/, '');
  return /^5\d{8}$/.test(cleaned);
}

// ===== تنظيف رقم الهاتف =====
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '').replace(/^(\+966|0966|966|0)/, '');
  return `+966${cleaned}`;
}

// ===== التحقق من البريد الإلكتروني =====
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== توليد رقم حجز =====
export function generateBookingNumber(count: number): string {
  const year = new Date().getFullYear();
  const seq = String(count).padStart(4, '0');
  return `BK-${year}-${seq}`;
}

// ===== حساب وقت الانتهاء =====
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

// ===== تحقق من تعارض الأوقات =====
export function isTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  return s1 < e2 && s2 < e1;
}

// ===== الحصول على اسم حالة الحجز بالعربي =====
export function getStatusLabel(status: BookingStatus): string {
  return BOOKING_STATUS[status]?.label ?? status;
}

// ===== الحصول على class badge لحالة الحجز =====
export function getStatusBadgeClass(status: BookingStatus): string {
  return BOOKING_STATUS[status]?.badgeClass ?? 'badge-no_show';
}

// ===== اختصار اسم المستخدم (أول حرف) =====
export function getInitial(name: string): string {
  return name.trim().charAt(0);
}

// ===== تحقق إذا كان اليوم ماضياً =====
export function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

// ===== تحقق إذا كان اليوم هو اليوم =====
export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// ===== تنسيق مدة الخدمة =====
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return hours === 1 ? 'ساعة واحدة' : `${hours} ساعات`;
  return `${hours} ساعة و${mins} دقيقة`;
}

// ===== إنشاء مصفوفة الأوقات =====
export function generateTimeSlotLabels(
  workStart: string,
  workEnd: string,
  slotDuration: number
): { time: string; label: string }[] {
  const slots: { time: string; label: string }[] = [];
  const [startH, startM] = workStart.split(':').map(Number);
  const [endH, endM] = workEnd.split(':').map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const label = formatTimeArabic(time);
    slots.push({ time, label });
    current += slotDuration;
  }

  return slots;
}

// ===== تنسيق التاريخ لـ API (YYYY-MM-DD) =====
export function toApiDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ===== الحصول على أيام الشهر =====
export function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=الأحد
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];
  // خلايا فارغة قبل اليوم الأول
  for (let i = 0; i < firstDay; i++) days.push(null);
  // أيام الشهر
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

// ===== تقليم النص =====
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// ===== الحصول على لون عشوائي للخدمة =====
const SERVICE_COLORS = [
  '#2170e4', // أزرق أساسي
  '#505f76', // رمادي ثانوي
  '#585d60', // رمادي ثالثي
  '#0058be', // أزرق داكن
  '#004395', // أزرق أعمق
  '#16a34a', // أخضر
  '#d97706', // برتقالي
  '#dc2626', // أحمر
];

export function getServiceColor(index: number): string {
  return SERVICE_COLORS[index % SERVICE_COLORS.length];
}
