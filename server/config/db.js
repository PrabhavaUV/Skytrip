const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGO_URI from .env
 * Logs a helpful error message if connection fails, allowing the HTTP server
 * and React frontend to remain accessible even if local MongoDB is offline.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/skytrip',
      { serverSelectionTimeoutMS: 5000 }
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.warn('Backend database features require MongoDB running locally or a valid MONGO_URI in .env.');
    console.warn('See DEBUG_LOG.md → ERR-001 for details.');
  }
};

module.exports = connectDB;
