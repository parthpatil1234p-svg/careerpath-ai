/**
 * models/Skill.js — Pure Prisma ORM Skill Model
 *
 * Implements Mongoose-compatible interface for skills directory & taxonomy.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * CareerPath AI Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel } = require('./prismaBase');

const Skill = createPrismaModel('Skill', {});

module.exports = Skill;
