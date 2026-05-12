'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { servicesAPI, bookingsAPI } from '@/lib/api';
import { formatDateArabic, formatTimeArabic, formatDuration, formatPrice, toApiDate } from '@/lib/utils';
import type { Service, TimeSlot } from '@/types';
import BookingCalendar from '@/components/booking/Calendar';
import ServiceSelector from '@/components/booking/ServiceSelector';
import TimeSlotsGrid from '@/components/booking/TimeSlots';
import BookingSummary from '@/components/booking/BookingSummary';
import StepWizard from '@/components/booking/StepWizard';
import { ERROR_MESSAGES } from '@/lib/constants';

// ===== الصفحة الرئيسية للحجز =====
export default function BookingPage() {
  const router = useRouter();

  // ===== حالة التطبيق =====
  const [currentStep, setCurrentStep] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ===== بيانات العميل =====
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ===== جلب الخدمات =====
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await servicesAPI.getAll();
        if (res.data.success && res.data.data) {
          setServices(res.data.data.filter((s) => s.isActive));
        }
      } catch {
        // استخدام بيانات تجريبية
        setServices(MOCK_SERVICES);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // ===== جلب الأوقات المتاحة =====
  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !selectedService) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const dateStr = toApiDate(selectedDate);
      const res = await bookingsAPI.getAvailableSlots(dateStr, selectedService.id);
      if (res.data.success && res.data.data) {
        setSlots(res.data.data);
      }
    } catch {
      // استخدام أوقات تجريبية
      setSlots(generateMockSlots());
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, selectedService]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // ===== التحقق من النموذج =====
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.customerName.trim() || form.customerName.trim().length < 2) {
      newErrors.customerName = ERROR_MESSAGES.minName;
    }
    if (!form.customerPhone.trim()) {
      newErrors.customerPhone = ERROR_MESSAGES.required;
    } else {
      const cleaned = form.customerPhone.replace(/\s/g, '');
      if (!/^5\d{8}$/.test(cleaned) && !/^\+9665\d{8}$/.test(cleaned)) {
        newErrors.customerPhone = ERROR_MESSAGES.invalidPhone;
      }
    }
    if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      newErrors.customerEmail = ERROR_MESSAGES.invalidEmail;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== تأكيد الحجز =====
  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!selectedService || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    try {
      const phone = form.customerPhone.replace(/\s/g, '');
      const normalizedPhone = phone.startsWith('+') ? phone : `+966${phone}`;

      const res = await bookingsAPI.create({
        serviceId: selectedService.id,
        date: toApiDate(selectedDate),
        startTime: selectedTime,
        customerName: form.customerName.trim(),
        customerPhone: normalizedPhone,
        customerEmail: form.customerEmail || undefined,
        notes: form.notes || undefined,
      });

      if (res.data.success) {
        toast.success('تم تأكيد الحجز بنجاح!');
        router.push(`/booking/success?bookingId=${res.data.data?.id}`);
      }
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(errorMsg || ERROR_MESSAGES.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== التنقل بين الخطوات =====
  const canGoNext = (): boolean => {
    if (currentStep === 0) return !!selectedService;
    if (currentStep === 1) return !!selectedDate && !!selectedTime;
    if (currentStep === 2) return form.customerName.trim().length >= 2 && form.customerPhone.trim().length >= 9;
    return false;
  };

  const handleNext = () => {
    if (currentStep < 3 && canGoNext()) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ===== Header ===== */}
      <header className="bg-surface-container-lowest border-b border-outline-variant shadow-sm w-full sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto flex flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16">
          <div className="flex items-center gap-unit-sm">
            <span className="material-symbols-outlined text-primary text-[32px] filled">event_available</span>
            <span className="text-headline-md font-bold text-primary">نظام الحجز الذكي</span>
          </div>
          <a href="/login">
            <button className="text-label-md text-primary border border-primary px-4 py-2 rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">login</span>
              تسجيل الدخول
            </button>
          </a>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center py-unit-lg px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto w-full gap-unit-lg">
        {/* ===== Hero ===== */}
        <section className="text-center w-full max-w-3xl space-y-3 py-6 animate-fade-in-up">
          <h1 className="text-display-lg font-bold text-on-surface">احجز موعدك بسهولة</h1>
          <p className="text-body-lg text-on-surface-variant">
            اختر الخدمة، حدد الوقت المناسب، وأكد حجزك في خطوات بسيطة. نحن هنا لتقديم أفضل خدمة لك.
          </p>
        </section>

        {/* ===== Step Wizard ===== */}
        <StepWizard currentStep={currentStep} />

        {/* ===== المحتوى الرئيسي ===== */}
        <section className="w-full max-w-5xl bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant p-gutter flex flex-col gap-unit-lg relative overflow-hidden animate-fade-in-up">
          {/* ديكور */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary-fixed rounded-full blur-3xl opacity-40 z-0 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter relative z-10">
            {/* ===== العمود الرئيسي ===== */}
            <div className="lg:col-span-8 flex flex-col gap-gutter">

              {/* الخطوة 1: اختيار الخدمة */}
              {currentStep === 0 && (
                <div className="animate-slide-in">
                  <ServiceSelector
                    services={services}
                    loading={loadingServices}
                    selectedService={selectedService}
                    onSelect={(service) => {
                      setSelectedService(service);
                      setSelectedDate(null);
                      setSelectedTime(null);
                      setSlots([]);
                    }}
                  />
                </div>
              )}

              {/* الخطوة 2: اختيار التاريخ والوقت */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-gutter animate-slide-in">
                  {/* التقويم */}
                  <div>
                    <div className="flex items-center gap-2 mb-unit-md">
                      <div className="step-indicator active">
                        <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                      </div>
                      <h2 className="text-title-lg font-semibold text-on-surface">اختر التاريخ</h2>
                    </div>
                    <BookingCalendar
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                    />
                  </div>

                  {/* الأوقات المتاحة */}
                  {selectedDate && (
                    <div>
                      <div className="flex items-center gap-2 mb-unit-md">
                        <div className="step-indicator active">
                          <span className="material-symbols-outlined text-[20px]">schedule</span>
                        </div>
                        <h2 className="text-title-lg font-semibold text-on-surface">اختر الوقت</h2>
                        <span className="text-body-md text-on-surface-variant">
                          — {formatDateArabic(selectedDate.toISOString())}
                        </span>
                      </div>
                      <TimeSlotsGrid
                        slots={slots}
                        selectedTime={selectedTime}
                        onTimeSelect={setSelectedTime}
                        isLoading={loadingSlots}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* الخطوة 3: بيانات العميل */}
              {currentStep === 2 && (
                <div className="animate-slide-in">
                  <div className="flex items-center gap-2 mb-unit-md">
                    <div className="step-indicator active">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <h2 className="text-title-lg font-semibold text-on-surface">بياناتك الشخصية</h2>
                  </div>
                  <div className="flex flex-col gap-unit-md">
                    {/* الاسم */}
                    <div className="flex flex-col gap-1">
                      <label className="text-label-md font-medium text-on-surface" htmlFor="name">
                        الاسم الكامل <span className="text-error">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={form.customerName}
                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        placeholder="أدخل اسمك الكامل"
                        className={`w-full border rounded-lg p-3 bg-surface-container-lowest text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${errors.customerName ? 'border-error' : 'border-outline'}`}
                      />
                      {errors.customerName && (
                        <p className="text-caption text-error flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          {errors.customerName}
                        </p>
                      )}
                    </div>

                    {/* رقم الجوال */}
                    <div className="flex flex-col gap-1">
                      <label className="text-label-md font-medium text-on-surface" htmlFor="phone">
                        رقم الجوال <span className="text-error">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-body-md text-on-surface-variant border-l border-outline-variant pl-3 pr-1 h-full flex items-center" dir="ltr">
                          +966
                        </span>
                        <input
                          id="phone"
                          type="tel"
                          dir="ltr"
                          value={form.customerPhone}
                          onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                          placeholder="5X XXX XXXX"
                          className={`w-full border rounded-lg p-3 pl-20 bg-surface-container-lowest text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-left ${errors.customerPhone ? 'border-error' : 'border-outline'}`}
                        />
                      </div>
                      {errors.customerPhone && (
                        <p className="text-caption text-error flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          {errors.customerPhone}
                        </p>
                      )}
                    </div>

                    {/* البريد الإلكتروني */}
                    <div className="flex flex-col gap-1">
                      <label className="text-label-md font-medium text-on-surface" htmlFor="email">
                        البريد الإلكتروني <span className="text-on-surface-variant text-caption">(اختياري)</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        dir="ltr"
                        value={form.customerEmail}
                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                        placeholder="example@email.com"
                        className={`w-full border rounded-lg p-3 bg-surface-container-lowest text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-left ${errors.customerEmail ? 'border-error' : 'border-outline'}`}
                      />
                      {errors.customerEmail && (
                        <p className="text-caption text-error flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          {errors.customerEmail}
                        </p>
                      )}
                    </div>

                    {/* ملاحظات */}
                    <div className="flex flex-col gap-1">
                      <label className="text-label-md font-medium text-on-surface" htmlFor="notes">
                        ملاحظات <span className="text-on-surface-variant text-caption">(اختياري)</span>
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="أي ملاحظات أو طلبات خاصة..."
                        className="w-full border border-outline rounded-lg p-3 bg-surface-container-lowest text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* الخطوة 4: تأكيد الحجز */}
              {currentStep === 3 && (
                <div className="animate-slide-in">
                  <div className="flex items-center gap-2 mb-unit-md">
                    <div className="step-indicator active">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </div>
                    <h2 className="text-title-lg font-semibold text-on-surface">مراجعة وتأكيد الحجز</h2>
                  </div>
                  <BookingSummary
                    service={selectedService}
                    date={selectedDate}
                    time={selectedTime}
                    customerName={form.customerName}
                    customerPhone={form.customerPhone}
                    customerEmail={form.customerEmail}
                    notes={form.notes}
                  />
                </div>
              )}

              {/* ===== أزرار التنقل ===== */}
              <div className="flex justify-between gap-4 mt-4">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-6 py-3 border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    السابق
                  </button>
                )}
                <div className="flex-1" />
                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canGoNext()}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary rounded-lg text-label-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary rounded-lg text-title-lg font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري التأكيد...
                      </>
                    ) : (
                      <>
                        تأكيد الحجز
                        <span className="material-symbols-outlined text-[20px]">check</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ===== العمود الجانبي (ملخص الحجز) ===== */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 bg-surface-container rounded-xl p-gutter shadow-sm border border-outline-variant flex flex-col gap-unit-md">
                <h3 className="text-title-lg font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
                  ملخص الحجز
                </h3>

                {selectedService ? (
                  <div className="flex flex-col gap-unit-sm">
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                      <span className="text-label-md text-on-surface-variant">الخدمة</span>
                      <span className="text-body-md font-semibold text-on-surface">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                      <span className="text-label-md text-on-surface-variant">المدة</span>
                      <span className="text-body-md text-on-surface">{formatDuration(selectedService.duration)}</span>
                    </div>
                    {selectedDate && (
                      <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                        <span className="text-label-md text-on-surface-variant">التاريخ</span>
                        <span className="text-body-md text-on-surface">{formatDateArabic(selectedDate.toISOString())}</span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex justify-between items-center py-2 border-b border-outline-variant">
                        <span className="text-label-md text-on-surface-variant">الوقت</span>
                        <span className="text-body-md text-on-surface dir-ltr">{formatTimeArabic(selectedTime)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-body-md font-semibold text-on-surface">الإجمالي</span>
                      <span className="text-title-lg font-bold text-primary">
                        {formatPrice(selectedService.price, selectedService.currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] mb-2 block">shopping_cart</span>
                    <p className="text-body-md">اختر خدمة لعرض ملخص الحجز</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant py-6 text-center">
        <p className="text-caption text-on-surface-variant">جميع الحقوق محفوظة © {new Date().getFullYear()} نظام الحجز الذكي</p>
      </footer>
    </div>
  );
}

// ===== بيانات تجريبية =====
const MOCK_SERVICES: Service[] = [
  { id: '1', businessId: 'b1', name: 'كشف عام', description: 'فحص طبي شامل', duration: 30, price: 100, currency: 'SAR', color: '#2170e4', isActive: true, sortOrder: 0 },
  { id: '2', businessId: 'b1', name: 'تنظيف أسنان', description: 'تنظيف وتلميع', duration: 45, price: 200, currency: 'SAR', color: '#505f76', isActive: true, sortOrder: 1 },
  { id: '3', businessId: 'b1', name: 'حشو عصب', description: 'علاج جذور الأسنان', duration: 60, price: 500, currency: 'SAR', color: '#0058be', isActive: true, sortOrder: 2 },
  { id: '4', businessId: 'b1', name: 'تقويم أسنان', description: 'تركيب تقويم', duration: 30, price: 300, currency: 'SAR', color: '#16a34a', isActive: true, sortOrder: 3 },
  { id: '5', businessId: 'b1', name: 'خلع ضرس', description: 'خلع طبي', duration: 45, price: 350, currency: 'SAR', color: '#d97706', isActive: true, sortOrder: 4 },
  { id: '6', businessId: 'b1', name: 'تبييض أسنان', description: 'تبييض بالليزر', duration: 60, price: 800, currency: 'SAR', color: '#dc2626', isActive: true, sortOrder: 5 },
];

function generateMockSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const booked = ['10:30', '11:30', '14:00'];
  for (let h = 9; h <= 20; h++) {
    for (const m of ['00', '30']) {
      if (h === 20 && m === '30') continue;
      const time = `${String(h).padStart(2, '0')}:${m}`;
      const available = !booked.includes(time);
      let label = '';
      if (h < 12) label = `${h === 9 || h === 10 || h === 11 ? h : h}:${m} صباحاً`;
      else if (h === 12) label = `12:${m} ظهراً`;
      else label = `${h - 12}:${m} مساءً`;
      slots.push({ time, available, label });
    }
  }
  return slots;
}
