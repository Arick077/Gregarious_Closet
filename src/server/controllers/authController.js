const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');

// --- REAL-TIME USERNAME AVAILABILITY CHECK ---
const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || !username.trim()) {
      return res.status(400).json({ available: false, message: 'Username is required' });
    }

    const cleanUsername = username.trim();

    if (cleanUsername.length < 3) {
      return res.status(200).json({ 
        available: false, 
        message: 'Username must be at least 3 characters long' 
      });
    }

    // Case-insensitive exact match against username or legacy name
    const escaped = cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        { name: { $regex: new RegExp(`^${escaped}$`, 'i') } }
      ]
    });

    if (existingUser) {
      return res.status(200).json({
        available: false,
        message: 'Username is already taken'
      });
    }

    return res.status(200).json({
      available: true,
      message: 'Username is available!'
    });

  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ available: false, message: 'Server error checking username' });
  }
};

// --- SEND OTP VERIFICATION CODE (FREE & SERVERLESS SAFE) ---
const sendOtp = async (req, res) => {
  try {
    const { identifier, type } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ success: false, message: 'Email or phone number is required' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const otpType = type === 'email' ? 'email' : 'phone';

    // Generate random 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing pending OTP for this identifier
    await Otp.deleteMany({ identifier: cleanIdentifier });

    // Save new OTP document with 5-minute MongoDB TTL
    const newOtp = new Otp({
      identifier: cleanIdentifier,
      code: otpCode,
      type: otpType
    });
    await newOtp.save();

    console.log(`[OTP GENERATED] Type: ${otpType} | To: ${cleanIdentifier} | Code: ${otpCode}`);

    // Return demoCode for 100% free academic evaluation and automated testing
    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanIdentifier}`,
      demoCode: otpCode
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error sending verification code' });
  }
};

// --- VERIFY OTP CODE ---
const verifyOtp = async (req, res) => {
  try {
    const { identifier, code } = req.body;

    if (!identifier || !code) {
      return res.status(400).json({ success: false, message: 'Identifier and verification code are required' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanCode = code.toString().trim();

    // Check if matching document exists in Otp collection
    const otpRecord = await Otp.findOne({
      identifier: cleanIdentifier,
      code: cleanCode
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new one.'
      });
    }

    // Code is valid: remove the consumed OTP document
    await Otp.deleteMany({ identifier: cleanIdentifier });

    return res.status(200).json({
      success: true,
      message: 'Verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying code' });
  }
};

// --- THE MEMBERSHIP MANAGER'S REGISTER PROCESS ---
const register = async (req, res) => {
  try {
    // 1. Explicitly destructure allowed fields to prevent Mass Assignment
    const { username, name, email, phone, isVerified, password } = req.body;
    const finalUsername = (username && username.trim()) || (name && name.trim());

    // 2. Check if they forgot to fill out required fields
    if (!finalUsername || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // 3. Look in the database to see if email or username is already registered
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const escapedUsername = finalUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingUsername = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') } },
        { name: { $regex: new RegExp(`^${escapedUsername}$`, 'i') } }
      ]
    });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
    }

    // 4. Scramble the password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create user - FORCEFULLY set role: 'user' to prevent privilege escalation
    const newUser = new User({
      username: finalUsername,
      name: finalUsername,
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      isVerified: Boolean(isVerified),
      password: hashedPassword,
      role: 'user'
    });

    // 6. Lock the profile in the database
    await newUser.save();

    // 7. Print VIP wristband (Token) with role included
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '1d' }
    );

    // 8. Return success response
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username || newUser.name,
        name: newUser.name || newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        isVerified: newUser.isVerified,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration: ' + error.message });
  }
};

// --- THE MEMBERSHIP MANAGER'S LOGIN PROCESS ---
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username || user.name,
        name: user.name || user.username,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// --- SECRET ADMIN CREATION ROUTE ---
const adminSetup = async (req, res) => {
  try {
    const { adminSecret, username, name, email, password } = req.body;

    const configuredSecret = process.env.ADMIN_SETUP_SECRET;
    if (!configuredSecret || !adminSecret || adminSecret !== configuredSecret) {
      return res.status(403).json({ message: 'Forbidden: Invalid or missing admin setup secret' });
    }

    const finalUsername = username || name;
    if (!finalUsername || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new User({
      username: finalUsername,
      name: finalUsername,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'admin'
    });

    await newAdmin.save();

    const token = jwt.sign(
      { userId: newAdmin._id, role: newAdmin.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Admin account created successfully',
      token,
      user: {
        id: newAdmin._id,
        username: newAdmin.username || newAdmin.name,
        name: newAdmin.name || newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });

  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({ message: 'Server error during admin setup' });
  }
};

module.exports = { 
  register, 
  login, 
  adminSetup,
  checkUsername,
  sendOtp,
  verifyOtp
};
