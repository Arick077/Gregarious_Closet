const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  adminSetup,
  checkUsername,
  sendOtp,
  verifyOtp 
} = require('../controllers/authController');

// --- AUTHENTICATION & VERIFICATION ROUTES ---

// Real-time Unique Username Verification (Requirement #4)
router.get('/check-username', checkUsername);

// Send Simulated OTP to Email or Phone (Requirement #5)
router.post('/send-otp', sendOtp);

// Verify 6-digit OTP Code (Requirement #5)
router.post('/verify-otp', verifyOtp);

// Public Registration (strictly sets role: 'user')
router.post('/register', register);

// Public Login
router.post('/login', login);

// Secret Admin Setup (requires valid adminSecret)
router.post('/admin-setup', adminSetup);

module.exports = router;
