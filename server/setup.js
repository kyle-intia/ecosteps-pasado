const mongoose = require('mongoose');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    // Use the same connection settings as your main server
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecosteps', {
      // Note: useNewUrlParser & useUnifiedTopology are default in Mongoose 6+
    });
    console.log('✅ Database connected successfully');
    
    // Import models AFTER connection to ensure they are registered with Mongoose
    const PreAssessment = require('./models/PreAssessment');
    
    // This will build any indexes defined in the PreAssessment schema that are not already built.
    await PreAssessment.createIndexes();
    console.log('✅ Database indexes created/verified');
    
    console.log('🚀 Backend setup complete! You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1); // Exit with a failure code
  } finally {
    // It's correct to disconnect, but now it happens after everything else is done.
    await mongoose.disconnect();
    console.log('✅ Database connection closed.');
  }
};

// Run the setup
setupDatabase();