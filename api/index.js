/**
 * api/index.js — Vercel Serverless Entrypoint
 *
 * Wraps the Express application for Vercel Serverless Functions.
 * Ensures the MongoDB connection pool is initialized and cached before delegating
 * the incoming HTTP request to Express.
 */

const connectDB = require('../server/config/db');
const app = require('../server/server');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    console.error('⚠️ [Serverless] Database connection error:', error.message);
  }
  return app(req, res);
};
