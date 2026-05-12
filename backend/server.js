// backend/server.js - نقطة الدخول الرئيسية للخادم
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== إعداد Rate Limiting =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 200,
  message: { success: false, message: 'تم تجاوز الحد المسموح من الطلبات، حاول مرة أخرى لاحقاً' },
});

// ===== Middlewares =====
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', limiter);

// ===== Health Check =====
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'نظام الحجز الذكي يعمل بشكل جيد ✅',
  });
});

// ===== المسارات =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/services', require('./routes/services'));
app.use('/api/business', require('./routes/business'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

// ===== معالجة المسارات غير الموجودة =====
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `المسار '${req.originalUrl}' غير موجود`,
  });
});

// ===== معالج الأخطاء العام =====
app.use(require('./middleware/errorHandler'));

// ===== تشغيل الخادم =====
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log('   نظام الحجز الذكي - الخادم الخلفي');
  console.log('========================================');
  console.log(`✅  الخادم يعمل على المنفذ: ${PORT}`);
  console.log(`🌐  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📅  الوقت: ${new Date().toLocaleString('ar-SA')}`);
  console.log('========================================');
  console.log('');
});

module.exports = app;
