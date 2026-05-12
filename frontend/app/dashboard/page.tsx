'use client';

import { useState, useEffect } from 'react';
import { reportsAPI, bookingsAPI } from '@/lib/api';
import { formatDateWithDay, formatTimeArabic, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import type { DashboardOverview, Booking } from '@/types';

// ===== لوحة التحكم - نظرة عامة =====
export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, todayRes] = await Promise.all([
          reportsAPI.getOverview(),
          bookingsAPI.getToday(),
        ]);
        if (overviewRes.data.success) setOverview(overviewRes.data.data ?? null);
        if (todayRes.data.success) setTodayBookings(todayRes.data.data ?? []);
      } catch {
        setOverview(MOCK_OVERVIEW);
        setTodayBookings(MOCK_TODAY);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      label: 'حجوزات اليوم',
      value: overview?.todayBookings ?? 0,
      icon: 'today',
      change: '+2 عن الأمس',
      changePositive: true,
      bg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      label: 'هذا الأسبوع',
      value: overview?.weekBookings ?? 0,
      icon: 'date_range',
      change: 'معدل طبيعي',
      changePositive: true,
      bg: 'bg-secondary/10',
      iconColor: 'text-secondary',
    },
    {
      label: 'إجمالي الشهر',
      value: overview?.monthBookings ?? 0,
      icon: 'calendar_month',
      change: '+15% نمو',
      changePositive: true,
      bg: 'bg-tertiary/10',
      iconColor: 'text-tertiary',
    },
    {
      label: 'إيرادات الشهر',
      value: `${(overview?.monthRevenue ?? 0).toLocaleString('en')} ريال`,
      icon: 'account_balance_wallet',
      change: 'تم تحصيل 80%',
      changePositive: true,
      isPrimary: true,
    },
  ];

  return (
    <div className="flex flex-col gap-unit-lg animate-fade-in-up">
      {/* ترحيب */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-display-lg font-bold text-on-surface mb-2">مرحباً 👋</h1>
          <p className="text-body-lg text-on-surface-variant">إليك نظرة سريعة على سير العمل اليوم.</p>
        </div>
        <div className="bg-surface-container px-4 py-2 rounded-lg flex items-center gap-2 text-on-surface-variant text-label-md border border-outline-variant">
          <span className="material-symbols-outlined text-primary">event</span>
          {formatDateWithDay(new Date().toISOString())}
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`rounded-xl p-6 border flex flex-col relative overflow-hidden shadow-card card-hover ${
              stat.isPrimary
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container-lowest border-outline-variant'
            }`}
          >
            {stat.isPrimary && (
              <div className="absolute -left-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-[120px]">payments</span>
              </div>
            )}
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className={`text-label-md ${stat.isPrimary ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
                {stat.label}
              </h3>
              <div className={`p-2 rounded-lg ${stat.isPrimary ? 'bg-white/20' : stat.bg}`}>
                <span className={`material-symbols-outlined ${stat.isPrimary ? 'text-on-primary' : stat.iconColor}`}>
                  {stat.icon}
                </span>
              </div>
            </div>
            <div className={`text-headline-lg font-bold relative z-10 ${stat.isPrimary ? 'text-on-primary' : 'text-on-surface'}`}>
              {loading ? (
                <div className="h-8 bg-surface-container animate-pulse rounded w-16" />
              ) : (
                stat.value
              )}
            </div>
            <div className={`mt-2 text-caption flex items-center gap-1 relative z-10 ${stat.isPrimary ? 'text-primary-fixed' : 'text-secondary'}`}>
              <span className="material-symbols-outlined text-[14px]">
                {stat.changePositive ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <span>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* صفين جنباً إلى جنب */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* حجوزات اليوم */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant p-6">
          <div className="flex justify-between items-center mb-6 border-b border-surface-container pb-4">
            <h3 className="text-title-lg font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">list_alt</span>
              حجوزات اليوم
            </h3>
            <a href="/dashboard/bookings" className="text-label-md text-primary hover:text-on-primary-fixed-variant transition-colors">
              عرض الكل
            </a>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-surface-container animate-pulse rounded-lg" />
              ))}
            </div>
          ) : todayBookings.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] mb-2 block">event_busy</span>
              <p className="text-body-md">لا توجد حجوزات اليوم</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayBookings.slice(0, 5).map((booking) => (
                <BookingItem key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>

        {/* إجراءات سريعة */}
        <div className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant p-6">
          <h3 className="text-title-lg font-semibold text-on-surface mb-6 border-b border-surface-container pb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">bolt</span>
            إجراءات سريعة
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {QUICK_ACTIONS.map((action, i) => (
              <a key={i} href={action.href}>
                <button className="flex flex-col items-center justify-center p-4 bg-surface hover:bg-surface-container transition-colors rounded-lg border border-outline-variant gap-2 group w-full">
                  <div className={`w-12 h-12 rounded-full ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <span className={`material-symbols-outlined ${action.color}`}>{action.icon}</span>
                  </div>
                  <span className="text-label-md text-on-surface text-center">{action.label}</span>
                </button>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* آخر الحجوزات - جدول */}
      <div className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-title-lg font-semibold text-on-surface">آخر الحجوزات</h3>
          <a href="/dashboard/bookings" className="text-label-md text-primary hover:text-on-primary-fixed-variant">
            عرض الكل
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-outline-variant">
                {['العميل', 'الخدمة', 'التاريخ والوقت', 'المبلغ', 'الحالة'].map((h) => (
                  <th key={h} className="py-3 px-4 text-label-md text-on-surface-variant bg-surface font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(overview?.recentBookings ?? MOCK_RECENT).map((b) => (
                <tr key={b.id} className="border-b border-surface-container hover:bg-surface/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-body-md text-on-surface">{b.customerName}</td>
                  <td className="py-4 px-4 text-body-md text-on-surface-variant">{b.service?.name ?? '—'}</td>
                  <td className="py-4 px-4 text-body-md text-on-surface-variant dir-ltr text-right">
                    {formatTimeArabic(b.startTime)}
                  </td>
                  <td className="py-4 px-4 text-body-md text-on-surface-variant">
                    {b.totalAmount ? `${b.totalAmount} ريال` : '—'}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`badge ${getStatusBadgeClass(b.status)}`}>
                      <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
                      {getStatusLabel(b.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===== مكون عنصر الحجز =====
function BookingItem({ booking }: { booking: Booking }) {
  const initial = booking.customerName.charAt(0);
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-surface rounded-lg border border-surface-container-high hover:border-primary-fixed transition-colors gap-3">
      <div className="flex items-center gap-4">
        <div className="text-center w-16">
          <div className="text-headline-md font-bold text-primary dir-ltr">{booking.startTime}</div>
          <div className="text-caption text-on-surface-variant">صباحاً</div>
        </div>
        <div className="w-px h-10 bg-outline-variant hidden sm:block" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
            {initial}
          </div>
          <div>
            <div className="text-body-md font-semibold text-on-surface">{booking.customerName}</div>
            <div className="text-caption text-on-surface-variant">{booking.service?.name ?? '—'}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
          {getStatusLabel(booking.status)}
        </span>
        <button className="text-outline hover:text-primary transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>
    </div>
  );
}

// ===== البيانات التجريبية =====
const MOCK_OVERVIEW: DashboardOverview = {
  todayBookings: 8,
  weekBookings: 32,
  monthBookings: 120,
  monthRevenue: 15000,
  recentBookings: [],
  todayBookingsList: [],
};

const MOCK_TODAY: Booking[] = [
  { id: '1', bookingNumber: 'BK-2026-0001', businessId: 'b1', serviceId: 's1', customerId: 'c1', date: new Date().toISOString(), startTime: '09:00', endTime: '09:30', status: 'pending', customerName: 'محمد عبدالله', customerPhone: '+966501234567', currency: 'SAR', service: { id: 's1', businessId: 'b1', name: 'استشارة أولية', duration: 30, price: 100, currency: 'SAR', isActive: true, sortOrder: 0 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
  { id: '2', bookingNumber: 'BK-2026-0002', businessId: 'b1', serviceId: 's2', customerId: 'c2', date: new Date().toISOString(), startTime: '10:30', endTime: '11:15', status: 'confirmed', customerName: 'سارة أحمد', customerPhone: '+966509876543', currency: 'SAR', service: { id: 's2', businessId: 'b1', name: 'متابعة علاج', duration: 45, price: 200, currency: 'SAR', isActive: true, sortOrder: 1 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
];

const MOCK_RECENT: Booking[] = [
  { id: '3', bookingNumber: 'BK-2026-0003', businessId: 'b1', serviceId: 's3', customerId: 'c3', date: '', startTime: '16:00', endTime: '17:00', status: 'completed', customerName: 'فهد العتيبي', customerPhone: '', currency: 'SAR', totalAmount: 500, service: { id: 's3', businessId: 'b1', name: 'تبييض أسنان', duration: 60, price: 500, currency: 'SAR', isActive: true, sortOrder: 2 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
  { id: '4', bookingNumber: 'BK-2026-0004', businessId: 'b1', serviceId: 's4', customerId: 'c4', date: '', startTime: '14:30', endTime: '15:15', status: 'cancelled', customerName: 'نورة الخالد', customerPhone: '', currency: 'SAR', totalAmount: 350, service: { id: 's4', businessId: 'b1', name: 'تنظيف بشرة', duration: 45, price: 350, currency: 'SAR', isActive: true, sortOrder: 3 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
  { id: '5', bookingNumber: 'BK-2026-0005', businessId: 'b1', serviceId: 's5', customerId: 'c5', date: '', startTime: '10:00', endTime: '10:30', status: 'completed', customerName: 'خالد السالم', customerPhone: '', currency: 'SAR', totalAmount: 200, service: { id: 's5', businessId: 'b1', name: 'استشارة طبية', duration: 30, price: 200, currency: 'SAR', isActive: true, sortOrder: 4 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
];

const QUICK_ACTIONS = [
  { label: 'عميل جديد', icon: 'person_add', bg: 'bg-primary-container/20', color: 'text-primary', href: '/dashboard/bookings' },
  { label: 'إنشاء فاتورة', icon: 'receipt_long', bg: 'bg-secondary-container', color: 'text-secondary', href: '/dashboard/bookings' },
  { label: 'تعديل الدوام', icon: 'schedule', bg: 'bg-tertiary-container/20', color: 'text-tertiary', href: '/dashboard/settings' },
  { label: 'حظر موعد', icon: 'block', bg: 'bg-error-container', color: 'text-error', href: '/dashboard/settings' },
];
