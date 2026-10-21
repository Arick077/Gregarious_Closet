const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// --- THE MEMBERSHIP MANAGER'S REGISTER PROCESS ---
const register = async (req, res) => {
  try {
    // 1. The customer hands us their filled-out form
    const { name, email, password } = req.body;

    // 2. Check if they forgot to fill out any fields
    if (!name || !email || !password) {
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

    // 5. Create the official VIP profile using our User Blueprint
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    // 6. Lock the profile in the database
    await newUser.save();

    // 7. Success! Print their VIP wristband (Token)
    const token = jwt.sign(
      { userId: newUser._id }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '1d' }
    );

    // 8. Tell the customer "Success!" and hand them back their token and basic info
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    // If the kitchen catches on fire, tell the customer there's a server error
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
      // We don't say "Email not found" for security reasons. Keep it vague!
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 4. Compare the password they typed with the scrambled one in our cabinet
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 5. Success! Print their VIP wristband (Token). It expires in 1 day.
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '1d' }
    );

    // 6. Hand the customer their wristband and let them in
    res.status(200).json({
      message: 'Login successful',
      token, // <-- This is the wristband!
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Put the manager on the counter so other files can use them
module.exports = { register, login };