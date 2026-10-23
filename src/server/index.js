// 1. Bring out the appliances
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');

// Fix for Node.js querySrv ECONNREFUSED on Windows
dns.setServers(['8.8.8.8', '1.1.1.1']);

// 2. Unlock the secret safe (.env) so we can use our passwords
// Ensure .env is loaded whether run from root or server folder
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
}
if (!process.env.MONGODB_URI) {
  require('dotenv').config();
}

// 3. Bring in our route modules
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 4. Build the Express server
const app = express();
const PORT = process.env.PORT || 5000;

// 5. Middleware
app.use(cors()); // Allow frontend communication
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Serve uploaded book files and cover images statically
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// 6. Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/admin', adminRoutes);

// 7. Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB (The Pantry is stocked!)');
    
    app.listen(PORT, () => {
      console.log(`Restaurant is OPEN and running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('Pantry connection error:', err));
