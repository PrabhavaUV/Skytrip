const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGO_URI from .env
 * Exits the process if the connection fails (no point running without a DB)
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/skytrip'
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('Make sure MongoDB is running. See DEBUG_LOG.md → ERR-001');
    process.exit(1);
  }
};

module.exports = connectDB;
