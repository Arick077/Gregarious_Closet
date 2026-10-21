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

// 3. Bring in our signs for the Membership Manager
const authRoutes = require('./routes/authRoutes');

// 4. Build the actual restaurant building
const app = express();
const PORT = process.env.PORT || 5000;

// 5. The Bouncer and The Translator (Middleware)
app.use(cors()); // The bouncer: lets our React dining room talk to us
app.use(express.json()); // The translator: turns customer data into code we can read

// 6. Hang our signs in a specific hallway
app.use('/api/auth', authRoutes);

// 7. Connect to the Pantry (MongoDB) and open the doors!
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB (The Pantry is stocked!)');
    
    // Flip the OPEN sign on the front door
    app.listen(PORT, () => {
      console.log(`Restaurant is OPEN and running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('Pantry connection error:', err));