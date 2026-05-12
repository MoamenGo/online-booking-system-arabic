import axios from 'axios';
import type {
  ApiResponse,
  AuthToken,
  Booking,
  Business,
  CreateBookingInput,
  CreateServiceInput,
  DailyReport,
  DashboardOverview,
  DayOff,
  MonthlyReport,
  PaginatedResponse,
  RegisterInput,
  Service,
  TimeSlot,
  User,
  WeeklyReport,
} from '@/types';

// ===== إعداد Axios Instance =====
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'ar',
  },
});

// ===== Request Interceptor: إضافة التوكن =====
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response Interceptor: معالجة الأخطاء =====
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // تسجيل خروج تلقائي
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ===== دوال المصادقة =====
export const authAPI = {
  // تسجيل حساب جديد
  register: (data: RegisterInput) =>
    api.post<ApiResponse<AuthToken>>('/auth/register', data),

  // تسجيل الدخول
  login: (phone: string, password: string) =>
    api.post<ApiResponse<AuthToken>>('/auth/login', { phone, password }),

  // الحصول على بيانات المستخدم الحالي
  getMe: () =>
    api.get<ApiResponse<{ user: User; business?: Business }>>('/auth/me'),

  // تحديث الملف الشخصي
  updateProfile: (data: Partial<User>) =>
    api.put<ApiResponse<User>>('/auth/profile', data),

  // تغيير كلمة المرور
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<ApiResponse>('/auth/password', { currentPassword, newPassword }),
};

// ===== دوال الحجوزات =====
export const bookingsAPI = {
  // جلب جميع الحجوزات (مع فلترة)
  getAll: (params?: {
    date?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    from?: string;
    to?: string;
  }) => api.get<ApiResponse<PaginatedResponse<Booking>>>('/bookings', { params }),

  // جلب حجز واحد
  getById: (id: string) =>
    api.get<ApiResponse<Booking>>(`/bookings/${id}`),

  // إنشاء حجز جديد
  create: (data: CreateBookingInput) =>
    api.post<ApiResponse<Booking>>('/bookings', data),

  // تحديث حجز
  update: (id: string, data: Partial<Booking>) =>
    api.put<ApiResponse<Booking>>(`/bookings/${id}`, data),

  // إلغاء حجز
  cancel: (id: string) =>
    api.put<ApiResponse<Booking>>(`/bookings/${id}`, { status: 'cancelled' }),

  // تأكيد حجز
  confirm: (id: string) =>
    api.put<ApiResponse<Booking>>(`/bookings/${id}`, { status: 'confirmed' }),

  // إكمال حجز
  complete: (id: string) =>
    api.put<ApiResponse<Booking>>(`/bookings/${id}`, { status: 'completed' }),

  // الأوقات المتاحة
  getAvailableSlots: (date: string, serviceId: string) =>
    api.get<ApiResponse<TimeSlot[]>>('/bookings/slots/available', {
      params: { date, serviceId },
    }),

  // حجوزات اليوم
  getToday: () =>
    api.get<ApiResponse<Booking[]>>('/bookings/today'),

  // إرسال تذكير
  remind: (id: string) =>
    api.post<ApiResponse>(`/bookings/${id}/remind`),
};

// ===== دوال الخدمات =====
export const servicesAPI = {
  // جلب جميع الخدمات
  getAll: (includeInactive = false) =>
    api.get<ApiResponse<Service[]>>('/services', {
      params: { includeInactive },
    }),

  // إنشاء خدمة جديدة
  create: (data: CreateServiceInput) =>
    api.post<ApiResponse<Service>>('/services', data),

  // تحديث خدمة
  update: (id: string, data: Partial<CreateServiceInput>) =>
    api.put<ApiResponse<Service>>(`/services/${id}`, data),

  // حذف خدمة
  delete: (id: string) =>
    api.delete<ApiResponse>(`/services/${id}`),

  // إعادة ترتيب الخدمات
  reorder: (orders: { id: string; sortOrder: number }[]) =>
    api.put<ApiResponse>('/services/reorder', { orders }),
};

// ===== دوال التقارير =====
export const reportsAPI = {
  // تقرير يومي
  getDaily: (date: string) =>
    api.get<ApiResponse<DailyReport>>('/reports/daily', { params: { date } }),

  // تقرير أسبوعي
  getWeekly: (startDate: string, endDate: string) =>
    api.get<ApiResponse<WeeklyReport>>('/reports/weekly', {
      params: { startDate, endDate },
    }),

  // تقرير شهري
  getMonthly: (month: string) =>
    api.get<ApiResponse<MonthlyReport>>('/reports/monthly', {
      params: { month },
    }),

  // نظرة عامة للوحة التحكم
  getOverview: () =>
    api.get<ApiResponse<DashboardOverview>>('/reports/overview'),
};

// ===== دوال إعدادات العمل =====
export const businessAPI = {
  // الحصول على الإعدادات
  getSettings: () =>
    api.get<ApiResponse<Business>>('/business/settings'),

  // تحديث الإعدادات
  updateSettings: (data: Partial<Business>) =>
    api.put<ApiResponse<Business>>('/business/settings', data),

  // جلب أيام الإجازة
  getDayOffs: () =>
    api.get<ApiResponse<DayOff[]>>('/business/dayoffs'),

  // إضافة يوم إجازة
  addDayOff: (date: string, reason?: string, isRecurring = false) =>
    api.post<ApiResponse<DayOff>>('/business/dayoffs', { date, reason, isRecurring }),

  // حذف يوم إجازة
  removeDayOff: (id: string) =>
    api.delete<ApiResponse>(`/business/dayoffs/${id}`),
};

// ===== تصدير الـ instance الرئيسي =====
export default api;
