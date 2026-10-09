/**
 * api/index.js — Vercel Serverless Entrypoint
 *
 * Wraps the Express application for Vercel Serverless Functions.
 * Ensures the Supabase PostgreSQL Prisma connection pool is initialized and cached
 * before delegating the incoming HTTP request to Express.
 */

const { connectPrisma } = require('../server/config/prisma');
const app = require('../server/server');

module.exports = async (req, res) => {
  try {
    await connectPrisma();
  } catch (error) {
    console.error('⚠️ [Serverless] Supabase database connection error:', error.message);
  }
  return app(req, res);
};
