const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Fallback environment variables for serverless environments (e.g. Vercel)
const DEFAULT_MONGO_URI = 'mongodb+srv://blankcode077_db_user:bDx3EfNVqMEjAQn7@cluster0.knaivdd.mongodb.net/gregarious_closet?retryWrites=true&w=majority';
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = DEFAULT_MONGO_URI;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'my_super_secret_restaurant_key_123';
}

const authRoutes = require('../src/server/routes/authRoutes');
const bookRoutes = require('../src/server/routes/bookRoutes');
const adminRoutes = require('../src/server/routes/adminRoutes');
const commentRoutes = require('../src/server/routes/commentRoutes');
const graphqlRoutes = require('../src/server/routes/graphqlRoutes');
const readerRoutes = require('../src/server/routes/readerRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded book files and cover images statically
const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Immediate health check endpoint (responds without blocking on DB connection)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    serverless: true,
    dbState: mongoose.connection.readyState
  });
});

// Serverless-friendly MongoDB connection caching
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState >= 1) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;

  const db = await mongoose.connect(uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000
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
app.use('/api', commentRoutes);
app.use('/api/reader', readerRoutes);
app.use('/graphql', graphqlRoutes);

// Fallback for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route ${req.method} ${req.url} not found` });
});

module.exports = app;
