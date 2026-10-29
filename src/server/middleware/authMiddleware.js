const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token from Authorization header (Bearer <token>)
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Lookup user in DB to ensure role and existence are up to date
    const targetId = decoded.userId || decoded._id || decoded.id;
    const user = await User.findById(targetId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Optional authentication: if token is present and valid, attaches req.user; otherwise continues
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const targetId = decoded.userId || decoded._id || decoded.id;
      const user = await User.findById(targetId).select('-password');
      if (user) {
        req.user = user;
      }
    }
  } catch {
    // Ignore invalid token for public endpoints
  }
  next();
};

/**
 * Middleware to ensure authenticated user has 'admin' role
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
  next();
};

module.exports = { verifyToken, optionalAuth, isAdmin };
