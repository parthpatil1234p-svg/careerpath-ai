/**
 * config/prisma.js — Supabase PostgreSQL Prisma Client Singleton
 *
 * Provides a cached, pooled PrismaClient instance across hot-reloads and serverless invocations.
 * CareerPath AI · Enterprise Architecture
 */

const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = global.prisma;
}

/**
 * Validates connection to Supabase PostgreSQL database
 */
async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log('✅ Supabase PostgreSQL Connected [Prisma ORM]: db.naefjieafxfdzliphaxb.supabase.co');
    return prisma;
  } catch (error) {
    console.warn('⚠️  Supabase PostgreSQL Notice:', error.message);
    return null;
  }
}

module.exports = {
  prisma,
  connectPrisma,
};
