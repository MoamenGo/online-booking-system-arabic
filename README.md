# نظام الحجز الذكي 🗓️

نظام حجز مواعيد أونلاين متكامل للسوق العربي، يدعم العيادات والصالونات والمدارس والمطاعم.

## 🚀 التقنيات المستخدمة

| المكوّن | التقنية |
|---------|---------|
| الواجهة الأمامية | Next.js 14 (App Router) + TypeScript |
| التنسيق | Tailwind CSS (نظام Material Design 3) |
| الخادم الخلفي | Node.js + Express.js |
| قاعدة البيانات | PostgreSQL + Prisma ORM |
| المصادقة | JWT (JSON Web Tokens) |
| الإشعارات | WhatsApp API + Nodemailer (SMTP) |
| الخط | IBM Plex Sans Arabic |

---

## 📁 هيكل المشروع

```
online-booking-system-arabic/
├── frontend/          ← Next.js 14 (App Router)
│   ├── app/
│   │   ├── layout.tsx          (RTL + خط عربي)
│   │   ├── page.tsx            (صفحة الحجز الرئيسية)
│   │   ├── login/page.tsx      (تسجيل الدخول)
│   │   ├── booking/
│   │   │   └── success/page.tsx (تأكيد الحجز)
│   │   └── dashboard/
│   │       ├── layout.tsx      (Sidebar + Header)
│   │       ├── page.tsx        (نظرة عامة)
│   │       ├── bookings/page.tsx
│   │       ├── services/page.tsx
│   │       ├── reports/page.tsx
│   │       └── settings/page.tsx
│   ├── components/
│   │   └── booking/
│   │       ├── Calendar.tsx    (تقويم تفاعلي)
│   │       ├── ServiceSelector.tsx
│   │       ├── TimeSlots.tsx
│   │       ├── BookingSummary.tsx
│   │       └── StepWizard.tsx
│   ├── lib/
│   │   ├── api.ts              (Axios instance)
│   │   ├── utils.ts            (دوال مساعدة)
│   │   └── constants.ts        (ثوابت عربية)
│   └── types/index.ts          (TypeScript types)
│
└── backend/           ← Node.js + Express
    ├── routes/        (auth, bookings, services, business, reports)
    ├── middleware/    (auth, roleGuard, errorHandler)
    ├── services/      (whatsapp, email)
    ├── utils/         (timeSlots)
    └── prisma/        (schema + seed)
```

---

## ⚡ التشغيل السريع

### 1. تهيئة الـ Backend

```bash
cd backend

# تثبيت المكتبات
npm install

# نسخ ملف البيئة وتعديله
cp .env.example .env
# عدّل DATABASE_URL و JWT_SECRET

# إنشاء جداول قاعدة البيانات
npx prisma db push

# إدخال البيانات التجريبية
npm run db:seed

# تشغيل الخادم
npm run dev
```

### 2. تهيئة الـ Frontend

```bash
cd frontend

# تثبيت المكتبات
npm install

# نسخ ملف البيئة
cp .env.local.example .env.local

# تشغيل الواجهة
npm run dev
```

### 3. فتح التطبيق

- 🌐 الواجهة: http://localhost:3000
- 🔧 الـ API: http://localhost:5000/api/health
- 📊 Prisma Studio: `npm run db:studio` (في مجلد backend)

### بيانات الدخول التجريبية

```
📱 رقم الجوال: +966501234567 (أو: 0501234567)
🔑 كلمة المرور: 123456
```

---

## 🎨 الصفحات المتاحة

| الصفحة | الرابط | الوصف |
|--------|--------|-------|
| الحجز | `/` | الصفحة العامة لحجز المواعيد |
| تأكيد الحجز | `/booking/success` | صفحة تأكيد نجاح الحجز |
| تسجيل الدخول | `/login` | دخول لوحة التحكم |
| لوحة التحكم | `/dashboard` | الإحصائيات والنظرة العامة |
| الحجوزات | `/dashboard/bookings` | إدارة الحجوزات |
| الخدمات | `/dashboard/services` | إدارة الخدمات |
| التقارير | `/dashboard/reports` | التقارير والإحصائيات |
| الإعدادات | `/dashboard/settings` | إعدادات النظام |

---

## 🔗 API Endpoints

### المصادقة
```
POST   /api/auth/register    تسجيل مستخدم جديد
POST   /api/auth/login       تسجيل الدخول
GET    /api/auth/me          بيانات المستخدم الحالي
PUT    /api/auth/profile     تحديث الملف الشخصي
PUT    /api/auth/password    تغيير كلمة المرور
```

### الحجوزات
```
POST   /api/bookings                    إنشاء حجز جديد
GET    /api/bookings                    جلب الحجوزات (مع فلترة)
GET    /api/bookings/today              حجوزات اليوم
GET    /api/bookings/slots/available    الأوقات المتاحة
GET    /api/bookings/:id                تفاصيل حجز
PUT    /api/bookings/:id                تحديث حجز
POST   /api/bookings/:id/remind         إرسال تذكير
```

### الخدمات
```
GET    /api/services          جلب الخدمات
POST   /api/services          إنشاء خدمة
PUT    /api/services/:id      تحديث خدمة
DELETE /api/services/:id      حذف خدمة
PUT    /api/services/reorder  إعادة الترتيب
```

### التقارير
```
GET    /api/reports/overview  نظرة عامة للوحة التحكم
GET    /api/reports/daily     تقرير يومي
GET    /api/reports/monthly   تقرير شهري
```

---

## 🚢 النشر (Deployment)

### Frontend → Vercel
1. اربط مستودع GitHub بـ Vercel
2. حدد المجلد الجذر: `frontend`
3. أضف متغير البيئة: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`

### Backend → Railway
1. اربط المستودع بـ Railway
2. حدد المجلد: `backend`
3. أضف PostgreSQL plugin
4. أضف متغيرات البيئة من `.env.example`

---

## ⚠️ ملاحظات مهمة

- جميع النصوص في الواجهة **بالعربي** كاملاً
- الاتجاه **RTL** (من اليمين لليسار)
- الأرقام **إنجليزية** (1, 2, 3) وليست هندية
- التحقق من بيانات النماذج **بالعربي**
- إشعارات الخطأ والنجاح بـ **Toast** (لا alert)
