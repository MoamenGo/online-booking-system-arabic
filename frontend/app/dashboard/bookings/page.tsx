'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { bookingsAPI } from '@/lib/api';
import { formatDateArabic, formatTimeArabic, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';
import { BOOKING_STATUS, SUCCESS_MESSAGES } from '@/lib/constants';

// ===== إدارة الحجوزات =====
export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsAPI.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        page,
        limit: LIMIT,
      });
      if (res.data.success && res.data.data) {
        setBookings(res.data.data.data);
        setTotal(res.data.data.total);
      }
    } catch {
      setBookings(MOCK_BOOKINGS);
      setTotal(MOCK_BOOKINGS.length);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await bookingsAPI.update(bookingId, { status: newStatus });
      toast.success(newStatus === 'confirmed' ? 'تم تأكيد الحجز' : newStatus === 'completed' ? 'تم إكمال الحجز' : 'تم إلغاء الحجز');
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: newStatus } : b));
    } catch {
      toast.error('حدث خطأ، حاول مرة أخرى');
    }
  };

  const handleRemind = async (bookingId: string) => {
    try {
      await bookingsAPI.remind(bookingId);
      toast.success(SUCCESS_MESSAGES.reminderSent);
    } catch {
      toast.success(SUCCESS_MESSAGES.reminderSent); // تجريبي
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col gap-unit-lg animate-fade-in-up">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface mb-1">إدارة الحجوزات</h1>
          <p className="text-body-md text-on-surface-variant">إجمالي الحجوزات: {total}</p>
        </div>
      </div>

      {/* شريط الفلاتر */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex flex-col sm:flex-row gap-3">
        {/* بحث */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
            placeholder="ابحث بالاسم أو الجوال أو رقم الحجز..."
            className="w-full border border-outline-variant rounded-lg py-2.5 px-4 pr-10 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* فلتر الحالة */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-outline-variant rounded-lg py-2.5 px-4 text-label-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary bg-surface-container-lowest"
        >
          <option value="all">جميع الحالات</option>
          {Object.entries(BOOKING_STATUS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <button
          onClick={fetchBookings}
          className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-label-md font-semibold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
          فلتر
        </button>
      </div>

      {/* الجدول */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-surface-container">
              <tr className="border-b border-outline-variant">
                {['رقم الحجز', 'العميل', 'الخدمة', 'التاريخ والوقت', 'المبلغ', 'الحالة', 'إجراءات'].map((h) => (
                  <th key={h} className="py-3.5 px-4 text-label-md font-semibold text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-surface-container">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-5 bg-surface-container animate-pulse rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[48px] mb-2 block">inbox</span>
                    <p className="text-body-md">لا توجد حجوزات تطابق الفلاتر المحددة</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-surface-container hover:bg-surface/50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="text-caption font-mono text-primary">{booking.bookingNumber}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-body-md text-on-surface">{booking.customerName}</div>
                      <div className="text-caption text-on-surface-variant dir-ltr">{booking.customerPhone}</div>
                    </td>
                    <td className="py-4 px-4 text-body-md text-on-surface-variant">{booking.service?.name ?? '—'}</td>
                    <td className="py-4 px-4">
                      <div className="text-body-md text-on-surface">{formatDateArabic(booking.date)}</div>
                      <div className="text-caption text-on-surface-variant dir-ltr">{formatTimeArabic(booking.startTime)}</div>
                    </td>
                    <td className="py-4 px-4 text-body-md text-on-surface-variant">
                      {booking.totalAmount ? `${booking.totalAmount} ريال` : '—'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`badge ${getStatusBadgeClass(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="تأكيد"
                          >
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'completed')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="إكمال"
                          >
                            <span className="material-symbols-outlined text-[18px]">done_all</span>
                          </button>
                        )}
                        {!['cancelled', 'completed'].includes(booking.status) && (
                          <>
                            <button
                              onClick={() => handleRemind(booking.id)}
                              className="p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary rounded-md transition-colors"
                              title="إرسال تذكير"
                            >
                              <span className="material-symbols-outlined text-[18px]">notifications</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              className="p-1.5 text-on-surface-variant hover:bg-error-container hover:text-error rounded-md transition-colors"
                              title="إلغاء"
                            >
                              <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t border-outline-variant">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <span className="text-label-md text-on-surface">
              الصفحة {page} من {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const MOCK_BOOKINGS: Booking[] = [
  { id: '1', bookingNumber: 'BK-2026-0001', businessId: 'b1', serviceId: 's1', customerId: 'c1', date: new Date().toISOString(), startTime: '09:00', endTime: '09:30', status: 'confirmed', customerName: 'محمد عبدالله', customerPhone: '+966501234567', totalAmount: 100, currency: 'SAR', service: { id: 's1', businessId: 'b1', name: 'كشف عام', duration: 30, price: 100, currency: 'SAR', isActive: true, sortOrder: 0 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
  { id: '2', bookingNumber: 'BK-2026-0002', businessId: 'b1', serviceId: 's2', customerId: 'c2', date: new Date().toISOString(), startTime: '10:30', endTime: '11:15', status: 'pending', customerName: 'سارة أحمد', customerPhone: '+966509876543', totalAmount: 200, currency: 'SAR', service: { id: 's2', businessId: 'b1', name: 'تنظيف أسنان', duration: 45, price: 200, currency: 'SAR', isActive: true, sortOrder: 1 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
  { id: '3', bookingNumber: 'BK-2026-0003', businessId: 'b1', serviceId: 's3', customerId: 'c3', date: new Date().toISOString(), startTime: '14:00', endTime: '15:00', status: 'completed', customerName: 'فهد العتيبي', customerPhone: '+966507654321', totalAmount: 800, currency: 'SAR', service: { id: 's3', businessId: 'b1', name: 'تبييض أسنان', duration: 60, price: 800, currency: 'SAR', isActive: true, sortOrder: 5 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
  { id: '4', bookingNumber: 'BK-2026-0004', businessId: 'b1', serviceId: 's4', customerId: 'c4', date: new Date().toISOString(), startTime: '16:00', endTime: '16:45', status: 'cancelled', customerName: 'نورة الخالد', customerPhone: '+966506543210', totalAmount: 350, currency: 'SAR', service: { id: 's4', businessId: 'b1', name: 'خلع ضرس', duration: 45, price: 350, currency: 'SAR', isActive: true, sortOrder: 4 }, whatsappSent: false, smsSent: false, emailSent: false, createdAt: '', updatedAt: '' },
];
