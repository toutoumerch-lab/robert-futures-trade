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

// Serve static files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
