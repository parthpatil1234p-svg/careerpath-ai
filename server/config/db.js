/**
 * config/db.js — MongoDB Atlas Connection
 *
 * Exports an async connectDB() function that creates a Mongoose connection
 * to MongoDB Atlas using the MONGODB_URI environment variable.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`⚠️  MongoDB Connection Warning: ${error.message}`);
    console.error('   👉 Tip: If on a new Wi-Fi or Hackathon network, ensure "0.0.0.0/0" is added in MongoDB Atlas -> Network Access.');
  }
};

module.exports = connectDB;
