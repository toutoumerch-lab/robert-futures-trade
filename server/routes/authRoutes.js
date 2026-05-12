const express = require('express');
const router = express.Router();
const {
  register, login, me,
  verifyOtp, resendOtp,
  sendPhoneOtpHandler, verifyPhoneOtpHandler,
  backfillCountries, setUserCountry,
  forgotPassword, resetPassword, verifyEmail,
} = require('../controllers/authController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.post('/register',        register);
router.post('/login',           login);
router.get('/me',               authenticateToken, me);

router.post('/verify-otp',      verifyOtp);
router.post('/resend-otp',      resendOtp);

router.post('/send-phone-otp',   sendPhoneOtpHandler);
router.post('/verify-phone-otp', verifyPhoneOtpHandler);

router.post('/forgot-password',        forgotPassword);
router.post('/reset-password/:token',  resetPassword);
router.get('/verify-email/:token',     verifyEmail);

// Admin: geo utilities
router.post('/backfill-countries',  authenticateToken, isAdmin, backfillCountries);
router.patch('/users/:id/country',  authenticateToken, isAdmin, setUserCountry);

module.exports = router;
