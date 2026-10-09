/**
 * models/YoutubeCache.js — Pure Prisma ORM YoutubeCache Model
 *
 * Implements Mongoose-compatible interface for cached YouTube video results.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * CareerPath AI Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel } = require('./prismaBase');

const YoutubeCache = createPrismaModel('YoutubeCache', {});

module.exports = YoutubeCache;
