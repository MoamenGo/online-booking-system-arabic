// ===== أنواع TypeScript للمشروع =====

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'owner' | 'customer' | 'staff';
  isActive: boolean;
  ownedBusiness?: Business;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  nameEn?: string;
  type: string; // clinic | salon | school | restaurant | other
  phone: string;
  email?: string;
  logo?: string;
  description?: string;
  address?: string;
  city?: string;
  country: string;
  currency: string;
  timezone: string;
  workingDays: string[];
  workStart: string;
  workEnd: string;
  slotDuration: number;
  breakStart?: string;
  breakEnd?: string;
  whatsappEnabled: boolean;
  whatsappNumber?: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  paymentEnabled: boolean;
  paymentMethod?: string;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  duration: number; // بالدقائق
  price: number;
  currency: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  bookingNumber: string; // BK-2024-0001
  businessId: string;
  serviceId: string;
  customerId: string;
  staffId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  totalAmount?: number;
  currency: string;
  service?: Service;
  business?: Business;
  whatsappSent: boolean;
  smsSent: boolean;
  emailSent: boolean;
  remindedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  label: string; // "9:00 صباحاً"
}

export interface DayOff {
  id: string;
  businessId: string;
  date: string;
  reason?: string;
  isRecurring: boolean;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  bookingId?: string;
  businessId: string;
  type: 'whatsapp' | 'sms' | 'email';
  to: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
}

export interface DailyReport {
  date: string;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  noShowBookings: number;
  totalRevenue: number;
  bookings: Booking[];
}

export interface WeeklyReport {
  startDate: string;
  endDate: string;
  totalBookings: number;
  totalRevenue: number;
  cancellationRate: number;
  dailyData: { date: string; count: number; revenue: number }[];
}

export interface MonthlyReport {
  month: string;
  totalBookings: number;
  totalRevenue: number;
  cancellationRate: number;
  topServices: { name: string; count: number; revenue: number }[];
}

export interface DashboardOverview {
  todayBookings: number;
  weekBookings: number;
  monthBookings: number;
  monthRevenue: number;
  recentBookings: Booking[];
  todayBookingsList: Booking[];
}

export interface AuthToken {
  user: User;
  token: string;
  business?: Business;
}

// نموذج إنشاء حجز جديد
export interface CreateBookingInput {
  serviceId: string;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}

// نموذج إنشاء خدمة
export interface CreateServiceInput {
  name: string;
  description?: string;
  duration: number;
  price: number;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// نموذج تسجيل
export interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role?: 'owner' | 'customer';
  businessName?: string;
  businessType?: string;
}
