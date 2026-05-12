'use client';

import { useState, useEffect, useMemo } from 'react';
import { reportsAPI } from '@/lib/api';
import { formatPrice, formatDateArabic } from '@/lib/utils';
import type { DailyReport, MonthlyReport } from '@/types';

export default function ReportsPage() {
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
  const [dailyDate, setDailyDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dailyData, setDailyData] = useState<DailyReport | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'daily') return;
    setLoading(true);
    reportsAPI.getDaily(dailyDate)
      .then((res) => { if (res.data.success) setDailyData(res.data.data ?? null); })
      .catch(() => setDailyData(MOCK_DAILY))
      .finally(() => setLoading(false));
  }, [tab, dailyDate]);

  useEffect(() => {
    if (tab !== 'monthly') return;
    setLoading(true);
    reportsAPI.getMonthly(selectedMonth)
      .then((res) => { if (res.data.success) setMonthlyData(res.data.data ?? null); })
      .catch(() => setMonthlyData(MOCK_MONTHLY))
      .finally(() => setLoading(false));
  }, [tab, selectedMonth]);

  const statusBar = useMemo(() => {
    if (!dailyData || !dailyData.totalBookings) return null;
    const total = dailyData.totalBookings;
    return [
      { label: 'مؤكد', count: dailyData.confirmedBookings, color: 'bg-blue-500', pct: Math.round((dailyData.confirmedBookings / total) * 100) },
      { label: 'مكتمل', count: dailyData.completedBookings, color: 'bg-green-500', pct: Math.round((dailyData.completedBookings / total) * 100) },
      { label: 'ملغي', count: dailyData.cancelledBookings, color: 'bg-red-500', pct: Math.round((dailyData.cancelledBookings / total) * 100) },
      { label: 'لم يحضر', count: dailyData.noShowBookings, color: 'bg-gray-400', pct: Math.round((dailyData.noShowBookings / total) * 100) },
    ];
  }, [dailyData]);

  return (
    <div className="flex flex-col gap-unit-lg animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface mb-1">التقارير والإحصائيات</h1>
          <p className="text-body-md text-on-surface-variant">تحليل أداء الحجوزات والإيرادات.</p>
        </div>
        <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant">
          {([['daily', 'يومي', 'today'], ['monthly', 'شهري', 'calendar_month']] as const).map(([key, label, icon]) => (
            <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-1.5 px-5 py-2 rounded-md text-label-md font-medium transition-all ${tab === key ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
              <span className="material-symbols-outlined text-[18px]">{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* فلتر التاريخ */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex items-center gap-4">
        <span className="material-symbols-outlined text-primary">{tab === 'daily' ? 'calendar_today' : 'calendar_month'}</span>
        <label className="text-label-md text-on-surface-variant">{tab === 'daily' ? 'التاريخ:' : 'الشهر:'}</label>
        <input
          type={tab === 'daily' ? 'date' : 'month'}
          value={tab === 'daily' ? dailyDate : selectedMonth}
          onChange={(e) => tab === 'daily' ? setDailyDate(e.target.value) : setSelectedMonth(e.target.value)}
          className="border border-outline-variant rounded-lg py-2 px-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary dir-ltr"
        />
        {tab === 'daily' && <span className="text-body-md text-on-surface font-medium">{formatDateArabic(dailyDate)}</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-surface-container animate-pulse rounded-xl" />)}
        </div>
      ) : tab === 'daily' && dailyData ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            <StatCard label="إجمالي الحجوزات" value={dailyData.totalBookings} icon="book_online" bg="bg-primary/10" iconColor="text-primary" />
            <StatCard label="مؤكدة" value={dailyData.confirmedBookings} icon="check_circle" bg="bg-blue-100" iconColor="text-blue-600" />
            <StatCard label="ملغية" value={dailyData.cancelledBookings} icon="cancel" bg="bg-red-100" iconColor="text-red-600" />
            <StatCard label="الإيرادات" value={`${dailyData.totalRevenue.toLocaleString('en')} ريال`} icon="payments" bg="bg-green-100" iconColor="text-green-700" primary />
          </div>
          {statusBar && dailyData.totalBookings > 0 && (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
              <h3 className="text-title-lg font-semibold text-on-surface mb-4">توزيع الحالات</h3>
              <div className="h-6 rounded-full overflow-hidden flex bg-surface-container mb-4">
                {statusBar.filter((s) => s.pct > 0).map((s, i) => <div key={i} className={`${s.color} h-full`} style={{ width: `${s.pct}%` }} />)}
              </div>
              <div className="flex flex-wrap gap-6">
                {statusBar.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${s.color}`} />
                    <span className="text-label-md text-on-surface-variant">{s.label}: {s.count} ({s.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : tab === 'monthly' && monthlyData ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            <StatCard label="إجمالي الحجوزات" value={monthlyData.totalBookings} icon="event_note" bg="bg-primary/10" iconColor="text-primary" />
            <StatCard label="الإيرادات" value={`${monthlyData.totalRevenue.toLocaleString('en')} ريال`} icon="payments" bg="bg-green-100" iconColor="text-green-700" primary />
            <StatCard label="نسبة الإلغاء" value={`${monthlyData.cancellationRate}%`} icon="trending_down" bg="bg-red-100" iconColor="text-red-600" />
            <StatCard label="أعلى خدمة" value={monthlyData.topServices?.[0]?.name ?? '—'} icon="star" bg="bg-amber-100" iconColor="text-amber-700" />
          </div>
          {monthlyData.topServices?.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-card p-6">
              <h3 className="text-title-lg font-semibold text-on-surface mb-6">الخدمات الأكثر طلباً</h3>
              <div className="space-y-4">
                {monthlyData.topServices.map((svc, i) => {
                  const max = monthlyData.topServices[0].count || 1;
                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-headline-md font-bold text-primary w-8 text-center">{i + 1}</span>
                          <span className="text-body-md font-medium text-on-surface">{svc.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-label-md text-on-surface-variant">{svc.count} حجز</span>
                          <span className="text-label-md font-semibold text-primary">{formatPrice(svc.revenue, 'SAR')}</span>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-surface-container overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-l from-primary to-primary-container transition-all duration-500" style={{ width: `${Math.round((svc.count / max) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[56px] mb-3 block">query_stats</span>
          <p className="text-body-lg">لا توجد بيانات</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, bg, iconColor, primary }: { label: string; value: string | number; icon: string; bg: string; iconColor: string; primary?: boolean }) {
  return (
    <div className={`rounded-xl p-5 border flex flex-col gap-3 shadow-card card-hover ${primary ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest border-outline-variant'}`}>
      <div className="flex justify-between items-start">
        <h4 className={`text-label-md ${primary ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>{label}</h4>
        <div className={`p-2 rounded-lg ${primary ? 'bg-white/20' : bg}`}><span className={`material-symbols-outlined text-[20px] ${primary ? 'text-on-primary' : iconColor}`}>{icon}</span></div>
      </div>
      <div className={`text-headline-md font-bold ${primary ? 'text-on-primary' : 'text-on-surface'}`}>{value}</div>
    </div>
  );
}

const MOCK_DAILY: DailyReport = { date: new Date().toISOString(), totalBookings: 8, confirmedBookings: 4, cancelledBookings: 1, completedBookings: 2, noShowBookings: 1, totalRevenue: 2350, bookings: [] };
const MOCK_MONTHLY: MonthlyReport = { month: '', totalBookings: 120, totalRevenue: 42500, cancellationRate: 8, topServices: [{ name: 'كشف عام', count: 45, revenue: 4500 }, { name: 'تنظيف أسنان', count: 32, revenue: 8000 }, { name: 'تبييض أسنان', count: 18, revenue: 14400 }, { name: 'حشو عصب', count: 15, revenue: 7500 }, { name: 'خلع ضرس', count: 10, revenue: 3500 }] };
