const mongoose = require('mongoose');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecosteps');
    console.log('✅ Database connected successfully');
    
    // Create indexes for better performance
    const PreAssessment = require('./models/PreAssessment');
    await PreAssessment.createIndexes();
    console.log('✅ Database indexes created');
    
    console.log('🚀 Backend setup complete! You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

setupDatabase();
