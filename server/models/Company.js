/**
 * models/Company.js — Pure Prisma ORM Company Model
 *
 * Implements Mongoose-compatible interface for corporate recruiter companies.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * CareerPath AI Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel } = require('./prismaBase');

const Company = createPrismaModel('Company', {});

module.exports = Company;
