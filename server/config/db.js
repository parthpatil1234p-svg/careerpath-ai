/**
 * config/db.js — Database Connection Forwarder (Supabase PostgreSQL via Prisma)
 *
 * CareerPath AI has transitioned 100% to Supabase PostgreSQL (0% MongoDB).
 * Forwards legacy database connection calls to connectPrisma().
 * CareerPath AI Technologies Inc. · 0% MongoDB Architecture
 */

const { connectPrisma } = require('./prisma');

const connectDB = async () => {
  return connectPrisma();
};

module.exports = connectDB;
