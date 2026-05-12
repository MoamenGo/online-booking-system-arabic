'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { servicesAPI } from '@/lib/api';
import { formatDuration, formatPrice } from '@/lib/utils';
import type { Service, CreateServiceInput } from '@/types';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/constants';

// ===== إدارة الخدمات =====
export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreateServiceInput>({
    name: '', description: '', duration: 30, price: 0, color: '#2170e4', isActive: true, sortOrder: 0,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await servicesAPI.getAll(true);
      if (res.data.success) setServices(res.data.data ?? []);
    } catch {
      setServices(MOCK_SERVICES);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingService(null);
    setForm({ name: '', description: '', duration: 30, price: 0, color: '#2170e4', isActive: true, sortOrder: services.length });
    setModalOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({ name: service.name, description: service.description, duration: service.duration, price: service.price, color: service.color || '#2170e4', isActive: service.isActive, sortOrder: service.sortOrder });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error(ERROR_MESSAGES.required); return; }
    setSaving(true);
    try {
      if (editingService) {
        await servicesAPI.update(editingService.id, form);
        toast.success(SUCCESS_MESSAGES.serviceUpdated);
      } else {
        await servicesAPI.create(form);
        toast.success(SUCCESS_MESSAGES.serviceCreated);
      }
      setModalOpen(false);
      fetchServices();
    } catch {
      // تحديث محلي تجريبي
      if (editingService) {
        setServices((prev) => prev.map((s) => s.id === editingService.id ? { ...s, ...form } : s));
        toast.success(SUCCESS_MESSAGES.serviceUpdated);
      } else {
        const newService: Service = { id: Date.now().toString(), businessId: 'b1', ...form, name: form.name, duration: form.duration, price: form.price, currency: 'SAR', isActive: form.isActive ?? true, sortOrder: form.sortOrder ?? 0 };
        setServices((prev) => [...prev, newService]);
        toast.success(SUCCESS_MESSAGES.serviceCreated);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await servicesAPI.update(service.id, { isActive: !service.isActive });
    } catch {}
    setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleDelete = async (id: string) => {
    try {
      await servicesAPI.delete(id);
      toast.success(SUCCESS_MESSAGES.serviceDeleted);
    } catch {
      toast.success(SUCCESS_MESSAGES.serviceDeleted);
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirmId(null);
  };

  const COLORS = ['#2170e4', '#0058be', '#505f76', '#585d60', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];

  return (
    <div className="flex flex-col gap-unit-lg animate-fade-in-up">
      {/* رأس الصفحة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface mb-1">الخدمات المتاحة</h1>
          <p className="text-body-md text-on-surface-variant">إدارة وتحديث قائمة الخدمات المقدمة.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary text-on-primary text-label-md font-semibold py-2 px-6 rounded-lg hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined">add_circle</span>
          إضافة خدمة جديدة
        </button>
      </div>

      {/* شبكة الخدمات */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-surface-container animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
          {services.map((service) => (
            <div key={service.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-card overflow-hidden flex flex-col card-hover">
              {/* شريط اللون */}
              <div className="h-2 w-full" style={{ backgroundColor: service.color || '#2170e4' }} />

              <div className="p-unit-md flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-title-lg font-semibold text-on-surface">{service.name}</h3>
                  <div className="bg-surface-variant text-on-surface-variant text-caption px-2 py-1 rounded-md">
                    {service.isActive ? 'نشط' : 'غير نشط'}
                  </div>
                </div>

                {service.description && (
                  <p className="text-caption text-on-surface-variant mb-3">{service.description}</p>
                )}

                <div className="space-y-2 mb-4 flex-grow">
                  <div className="flex items-center text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline ml-2 text-[20px]">schedule</span>
                    {formatDuration(service.duration)}
                  </div>
                  <div className="flex items-center text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline ml-2 text-[20px]">payments</span>
                    {formatPrice(service.price, service.currency)}
                  </div>
                </div>

                <div className="pt-4 border-t border-outline-variant flex justify-between items-center mt-auto">
                  {/* Toggle */}
                  <label className="flex items-center cursor-pointer gap-2">
                    <div
                      className={`relative w-10 h-6 rounded-full transition-colors ${service.isActive ? 'bg-primary' : 'bg-surface-variant border border-outline-variant'}`}
                      onClick={() => handleToggleActive(service)}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow ${service.isActive ? 'right-1' : 'left-1'}`}
                      />
                    </div>
                    <span className={`text-label-md ${service.isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {service.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(service)}
                      className="p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-primary rounded-md transition-colors"
                      title="تعديل"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(service.id)}
                      className="p-1.5 text-on-surface-variant hover:bg-error-container hover:text-error rounded-md transition-colors"
                      title="حذف"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal إضافة/تعديل */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-box">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <h2 className="text-title-lg font-semibold text-on-surface">
                {editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex flex-col gap-unit-md">
              <div className="flex flex-col gap-1">
                <label className="text-label-md font-medium text-on-surface">اسم الخدمة *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: كشف عام"
                  className="border border-outline rounded-lg p-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-md font-medium text-on-surface">الوصف</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="وصف مختصر للخدمة..."
                  rows={2}
                  className="border border-outline rounded-lg p-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-label-md font-medium text-on-surface">المدة (دقيقة) *</label>
                  <input
                    type="number"
                    min={5}
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
                    className="border border-outline rounded-lg p-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary dir-ltr"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-label-md font-medium text-on-surface">السعر (ريال) *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                    className="border border-outline rounded-lg p-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary dir-ltr"
                    required
                  />
                </div>
              </div>

              {/* لوحة الألوان */}
              <div className="flex flex-col gap-1">
                <label className="text-label-md font-medium text-on-surface">اللون</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c ? 'border-on-surface scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* حالة التفعيل */}
              <div className="flex items-center gap-3">
                <label className="text-label-md font-medium text-on-surface">حالة الخدمة</label>
                <div
                  className={`relative w-12 h-7 rounded-full cursor-pointer transition-colors ${form.isActive ? 'bg-primary' : 'bg-surface-variant border border-outline-variant'}`}
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                >
                  <div className={`absolute top-1.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'right-1.5' : 'left-1.5'}`} />
                </div>
                <span className="text-body-md text-on-surface-variant">{form.isActive ? 'نشطة' : 'معطلة'}</span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-outline text-on-surface py-3 rounded-lg text-label-md hover:bg-surface-container transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary text-on-primary py-3 rounded-lg text-label-md font-semibold hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {editingService ? 'حفظ التعديلات' : 'إضافة الخدمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirmId(null)}>
          <div className="modal-box max-w-sm">
            <div className="p-6 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-[32px]">delete_forever</span>
              </div>
              <h3 className="text-title-lg font-semibold text-on-surface">تأكيد الحذف</h3>
              <p className="text-body-md text-on-surface-variant">
                هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 border border-outline py-2.5 rounded-lg text-label-md text-on-surface hover:bg-surface-container transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 bg-error text-on-error py-2.5 rounded-lg text-label-md font-semibold hover:opacity-90 transition-opacity"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MOCK_SERVICES: Service[] = [
  { id: '1', businessId: 'b1', name: 'كشف عام', description: 'فحص طبي شامل', duration: 30, price: 100, currency: 'SAR', color: '#2170e4', isActive: true, sortOrder: 0 },
  { id: '2', businessId: 'b1', name: 'تنظيف أسنان', description: 'تنظيف وتلميع الأسنان', duration: 45, price: 250, currency: 'SAR', color: '#505f76', isActive: true, sortOrder: 1 },
  { id: '3', businessId: 'b1', name: 'حشو عصب', description: 'علاج جذور الأسنان', duration: 60, price: 600, currency: 'SAR', color: '#585d60', isActive: false, sortOrder: 2 },
  { id: '4', businessId: 'b1', name: 'تقويم أسنان', description: 'تركيب وتعديل التقويم', duration: 40, price: 2500, currency: 'SAR', color: '#0058be', isActive: true, sortOrder: 3 },
  { id: '5', businessId: 'b1', name: 'خلع ضرس', description: 'خلع طبي تحت التخدير', duration: 45, price: 350, currency: 'SAR', color: '#d97706', isActive: true, sortOrder: 4 },
  { id: '6', businessId: 'b1', name: 'تبييض أسنان', description: 'تبييض بالليزر', duration: 60, price: 800, currency: 'SAR', color: '#dc2626', isActive: true, sortOrder: 5 },
];
