// backend/routes/notifications.js - مسارات الإشعارات
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// ===== POST /api/notifications/test - اختبار الإشعارات =====
router.post('/test', authMiddleware, async (req, res) => {
  const { type, to } = req.body;
  res.json({
    success: true,
    message: `تم إرسال إشعار تجريبي من نوع ${type} إلى ${to}`,
  });
});

module.exports = router;
