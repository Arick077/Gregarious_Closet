const express = require('express');
const router = express.Router();
const { register, login, adminSetup } = require('../controllers/authController');

// --- AUTHENTICATION ROUTES ---

// Public Registration (strictly sets role: 'user')
router.post('/register', register);

// Public Login
router.post('/login', login);

// Secret Admin Setup (requires valid adminSecret)
router.post('/admin-setup', adminSetup);

module.exports = router;
