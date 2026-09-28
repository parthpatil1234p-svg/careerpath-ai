/**
 * config/db.js — MongoDB Atlas Connection
 *
 * Exports an async connectDB() function that creates a Mongoose connection
 * to MongoDB Atlas using the MONGODB_URI environment variable.
 */

const mongoose = require('mongoose');
const dns = require('dns');

// Resilient DNS resolution for MongoDB Atlas SRV connection on Windows/Node v22+
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

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
