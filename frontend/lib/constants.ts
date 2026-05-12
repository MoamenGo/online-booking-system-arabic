// ===== ثوابت عربية للمشروع =====

// أيام الأسبوع بالعربي
export const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

// اختصارات أيام الأسبوع
export const ARABIC_DAYS_SHORT = ['أحد', 'إثن', 'ثلا', 'أربع', 'خمي', 'جمع', 'سبت'];

// أسماء الأشهر الميلادية بالعربي
export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

// أنواع الأعمال التجارية
export const BUSINESS_TYPES = [
  { value: 'clinic', label: 'عيادة طبية' },
  { value: 'salon', label: 'صالون تجميل' },
  { value: 'school', label: 'مدرسة / مركز تعليمي' },
  { value: 'restaurant', label: 'مطعم / كافيه' },
  { value: 'gym', label: 'نادي رياضي' },
  { value: 'other', label: 'أخرى' },
] as const;

// حالات الحجز
export const BOOKING_STATUS = {
  pending: {
    label: 'معلق',
    badgeClass: 'badge-pending',
    dotColor: 'bg-amber-500',
  },
  confirmed: {
    label: 'مؤكد',
    badgeClass: 'badge-confirmed',
    dotColor: 'bg-blue-500',
  },
  completed: {
    label: 'مكتمل',
    badgeClass: 'badge-completed',
    dotColor: 'bg-green-500',
  },
  cancelled: {
    label: 'ملغي',
    badgeClass: 'badge-cancelled',
    dotColor: 'bg-red-500',
  },
  no_show: {
    label: 'لم يحضر',
    badgeClass: 'badge-no_show',
    dotColor: 'bg-gray-400',
  },
} as const;

// مدد الفواصل الزمنية
export const SLOT_DURATIONS = [
  { value: 15, label: '15 دقيقة' },
  { value: 20, label: '20 دقيقة' },
  { value: 30, label: '30 دقيقة' },
  { value: 45, label: '45 دقيقة' },
  { value: 60, label: 'ساعة واحدة' },
  { value: 90, label: 'ساعة ونصف' },
  { value: 120, label: 'ساعتان' },
] as const;

// العملات المدعومة
export const CURRENCIES = {
  SAR: { name: 'ريال سعودي', symbol: 'ر.س' },
  AED: { name: 'درهم إماراتي', symbol: 'د.إ' },
  EGP: { name: 'جنيه مصري', symbol: 'ج.م' },
  KWD: { name: 'دينار كويتي', symbol: 'د.ك' },
  QAR: { name: 'ريال قطري', symbol: 'ر.ق' },
  BHD: { name: 'دينار بحريني', symbol: 'د.ب' },
  OMR: { name: 'ريال عماني', symbol: 'ر.ع' },
  JOD: { name: 'دينار أردني', symbol: 'د.أ' },
} as const;

// رسائل الخطأ العربية
export const ERROR_MESSAGES = {
  required: 'هذا الحقل مطلوب',
  invalidPhone: 'رقم الجوال غير صحيح (يجب أن يبدأ بـ 5 ويكون 9 أرقام)',
  weakPassword: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
  invalidEmail: 'البريد الإلكتروني غير صحيح',
  phoneTaken: 'هذا الرقم مسجل مسبقاً',
  invalidCredentials: 'رقم الجوال أو كلمة المرور غير صحيحة',
  networkError: 'حدث خطأ في الاتصال، حاول مرة أخرى',
  noSlots: 'لا توجد أوقات متاحة في هذا اليوم',
  slotTaken: 'هذا الموعد محجوز مسبقاً، اختر وقتاً آخر',
  disabledAccount: 'تم تعطيل هذا الحساب، تواصل مع الدعم',
  unauthorized: 'يجب تسجيل الدخول أولاً',
  forbidden: 'ليس لديك صلاحية للوصول',
  serverError: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً',
  minName: 'الاسم يجب أن يكون حرفين على الأقل',
} as const;

// رسائل النجاح
export const SUCCESS_MESSAGES = {
  bookingCreated: 'تم تأكيد الحجز بنجاح',
  bookingCancelled: 'تم إلغاء الحجز',
  bookingUpdated: 'تم تحديث الحجز بنجاح',
  reminderSent: 'تم إرسال التذكير بنجاح',
  serviceCreated: 'تم إضافة الخدمة بنجاح',
  serviceUpdated: 'تم تحديث الخدمة بنجاح',
  serviceDeleted: 'تم حذف الخدمة بنجاح',
  settingsSaved: 'تم حفظ الإعدادات بنجاح',
  passwordChanged: 'تم تغيير كلمة المرور بنجاح',
  profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
  dayOffAdded: 'تم إضافة يوم الإجازة بنجاح',
  dayOffRemoved: 'تم حذف يوم الإجازة',
} as const;

// خطوات الحجز
export const BOOKING_STEPS = [
  { title: 'اختر الخدمة', icon: 'medical_services' },
  { title: 'اختر الموعد', icon: 'calendar_today' },
  { title: 'بياناتك', icon: 'person' },
  { title: 'تأكيد الحجز', icon: 'check_circle' },
] as const;

// قائمة التنقل في لوحة التحكم
export const DASHBOARD_NAV = [
  { title: 'نظرة عامة', href: '/dashboard', icon: 'dashboard' },
  { title: 'التقويم', href: '/dashboard/calendar', icon: 'calendar_month' },
  { title: 'الحجوزات', href: '/dashboard/bookings', icon: 'book_online' },
  { title: 'الخدمات', href: '/dashboard/services', icon: 'category' },
  { title: 'التقارير', href: '/dashboard/reports', icon: 'analytics' },
  { title: 'الإعدادات', href: '/dashboard/settings', icon: 'settings' },
] as const;
