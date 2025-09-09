const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const preAssessmentRoutes = require('./routes/preAssessmentRoutes');
const dailyTrackingRoutes = require('./routes/dailyTrackingRoutes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000' // Adjust based on your frontend URL
};
app.use(cors(corsOptions)); // Use app.use(cors()) for development simplicity

app.use(express.json({ limit: '10mb' })); // Optional: Add a limit to JSON payloads
app.use(express.urlencoded({ extended: true }));

// Rate limiting - Consider applying only in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// Database connection (Updated for Mongoose 6+)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecosteps');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Routes
app.use('/api/preassessment', preAssessmentRoutes);
app.use('/api/daily-tracking', dailyTrackingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
