const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// --- THE SIGNS POINTING TO THE MANAGER ---

// Sign 1: "Want to join? Give us your info here."
router.post('/register', register);

// Sign 2: "Already a member? Show your ID here."
router.post('/login', login);

// Put the signs in the main hallway
module.exports = router;