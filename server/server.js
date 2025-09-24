require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const leaderboardRoutes = require('./routes/leaderboards');
const communityRoutes = require('./routes/community');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase payload limit for image uploads
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/community', communityRoutes);

// testing
// const Test = require('./testModel');
// async function createTestDoc() {
//   const doc = new Test({ name: 'Hello 3' });
//   await doc.save();
//   console.log('Test document inserted!');
// }
// mongoose.connection.once('open', createTestDoc);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

