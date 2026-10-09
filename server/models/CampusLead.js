/**
 * models/CampusLead.js — Pure Prisma ORM CampusLead Model
 *
 * Implements Mongoose-compatible interface for University TPO partner leads.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * CareerPath AI Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel } = require('./prismaBase');

const CampusLead = createPrismaModel('CampusLead', {});

module.exports = CampusLead;
