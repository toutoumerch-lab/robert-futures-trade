require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure all API responses explicitly declare UTF-8 encoding
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/prop-firms', require('./routes/propFirmRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api', require('./routes/moduleRoutes'));
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/checkouts', require('./routes/checkoutRoutes'));
app.use('/api/admin/revenue',    require('./routes/revenueRoutes'));
app.use('/api/admin/analytics', require('./routes/analyticsRoutes'));
app.use('/api/about',           require('./routes/aboutRoutes'));
app.use('/api/reviews',         require('./routes/reviewRoutes'));
app.use('/webhook',             require('./routes/tawkRoutes'));
app.use('/api/contact',         require('./routes/contactRoutes'));

// Serve static files
// /api/uploads/ — proxied by nginx (works in production without extra nginx config)
// /uploads/     — kept for backward compatibility with old DB URLs
const path = require('path');
const uploadsDir = path.join(__dirname, 'public/uploads');
app.use('/api/uploads', express.static(uploadsDir));
app.use('/uploads',     express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('[ENV] TWILIO_ACCOUNT_SID:       ', !!process.env.TWILIO_ACCOUNT_SID);
  console.log('[ENV] TWILIO_AUTH_TOKEN:         ', !!process.env.TWILIO_AUTH_TOKEN);
  console.log('[ENV] TWILIO_VERIFY_SERVICE_SID: ', !!process.env.TWILIO_VERIFY_SERVICE_SID);
  console.log('[ENV] RESEND_API_KEY:            ', !!process.env.RESEND_API_KEY);
});

