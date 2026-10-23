const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('../src/server/routes/authRoutes');
const bookRoutes = require('../src/server/routes/bookRoutes');
const adminRoutes = require('../src/server/routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded book files and cover images statically
const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Serverless-friendly MongoDB connection caching
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState >= 1) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  const db = await mongoose.connect(uri, {
    bufferCommands: false,
  });

  cachedDb = db;
  return db;
}

// Middleware to ensure DB connection before processing API requests
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    res.status(500).json({ message: 'Database connection failed: ' + error.message });
  }
});

// Mount endpoints
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', serverless: true });
});

// Fallback for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route ${req.method} ${req.url} not found` });
});

module.exports = app;
