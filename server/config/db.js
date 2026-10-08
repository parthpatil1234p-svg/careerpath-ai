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

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected and ready, return existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: process.env.VERCEL ? 10 : 20,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
      console.log(`✅ MongoDB Connected [${process.env.VERCEL ? 'Serverless' : 'Persistent'}]: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`⚠️  MongoDB Connection Warning: ${error.message}`);
    console.error('   👉 Tip: If on a new Wi-Fi or Hackathon network, ensure "0.0.0.0/0" is added in MongoDB Atlas -> Network Access.');
    throw error;
  }
};

module.exports = connectDB;
