const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// --- THE MEMBERSHIP MANAGER'S REGISTER PROCESS ---
const register = async (req, res) => {
  try {
    // 1. Explicitly destructure ONLY allowed fields to prevent Mass Assignment
    const { username, name, email, password } = req.body;
    const finalUsername = username || name;

    // 2. Check if they forgot to fill out any fields
    if (!finalUsername || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // 3. Look in the filing cabinet to see if this email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 4. Scramble the password so no one (not even us) can read it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create user - FORCEFULLY set role: 'user' to prevent privilege escalation
    const newUser = new User({
      username: finalUsername,
      name: finalUsername,
      email,
      password: hashedPassword,
      role: 'user' // Forcefully set to regular user
    });

    // 6. Lock the profile in the database
    await newUser.save();

    // 7. Success! Print their VIP wristband (Token) with role included
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '1d' }
    );

    // 8. Tell the customer "Success!" and hand them back their token and basic info
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        username: newUser.username || newUser.name,
        name: newUser.name || newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// --- THE MEMBERSHIP MANAGER'S LOGIN PROCESS ---
const login = async (req, res) => {
  try {
    // 1. The customer gives us their email and password
    const { email, password } = req.body;

    // 2. Check if they forgot to type either one
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 3. Look in the filing cabinet for someone with this email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 4. Compare the password they typed with the scrambled one in our cabinet
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 5. Success! Print their VIP wristband (Token) with role. It expires in 1 day.
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '1d' }
    );

    // 6. Hand the customer their wristband and let them in
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username || user.name,
        name: user.name || user.username,
        email: user.email,
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

    // 1. Check adminSecret against process.env.ADMIN_SETUP_SECRET
    const configuredSecret = process.env.ADMIN_SETUP_SECRET;
    if (!configuredSecret || !adminSecret || adminSecret !== configuredSecret) {
      return res.status(403).json({ message: 'Forbidden: Invalid or missing admin setup secret' });
    }

    const finalUsername = username || name;
    if (!finalUsername || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    // 2. Check if email is already taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user with role: 'admin'
    const newAdmin = new User({
      username: finalUsername,
      name: finalUsername,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    await newAdmin.save();

    // 5. Issue token with admin role
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

module.exports = { register, login, adminSetup };
