const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support larger payloads for Base64 QR codes or images
const path = require('path');
app.use('/public', express.static(path.join(__dirname, 'public'))); // Serve static assets (like images)

// Import routes
const restaurantRoutes = require('./routes/restaurant');
const menuRoutes = require('./routes/menu');
const adminRoutes = require('./routes/admin');

// Mount routes
app.use('/api/restaurant-info', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const db = require('./db');
  res.json({
    status: 'OK',
    timestamp: new Date(),
    databaseFallback: db.useFallback()
  });
});

// Root / redirect or welcome message
app.get('/', (req, res) => {
  res.send('Bali Bong Restaurant API is running.');
});

// Start server only if not running in a serverless environment like Vercel
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Bali Bong Server is running on port ${PORT}`);
  });
}

module.exports = app;
