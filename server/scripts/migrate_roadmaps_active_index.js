/**
 * migrate_roadmaps_active_index.js
 *
 * Pre-flight database migration script for Single Active Career Route:
 * 1. Backs up all existing roadmaps to server/backups/roadmaps_backup_<timestamp>.json
 * 2. Resolves any multiple active roadmaps per user:
 *    - Keeps the latest active roadmap (by updatedAt/createdAt)
 *    - Safely marks older active roadmaps as 'abandoned' (with abandonedAt = new Date())
 * 3. Normalizes any roadmaps with missing status to 'archived'
 * 4. Ensures the MongoDB partial unique index on { user: 1 } where status == 'active' exists
 * 5. Verifies index health and prints summary report
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Roadmap = require('../models/Roadmap');

async function runMigration() {
  console.log('=== STARTING ROADMAP ACTIVE INDEX MIGRATION ===\n');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is missing from environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✔ Connected to MongoDB successfully.');

    // 1. Back up all roadmaps
    const allRoadmaps = await Roadmap.find({}).lean();
    console.log(`✔ Found ${allRoadmaps.length} total roadmap records.`);

    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFile = path.join(backupDir, `roadmaps_backup_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(allRoadmaps, null, 2), 'utf-8');
    console.log(`✔ Backup saved to: ${backupFile}`);

    // 2. Normalize missing or invalid status
    const unassignedUpdate = await Roadmap.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'archived' } }
    );
    if (unassignedUpdate.modifiedCount > 0) {
      console.log(`✔ Normalized ${unassignedUpdate.modifiedCount} roadmaps with missing status to "archived".`);
    }

    // 3. Resolve multiple active roadmaps per user
    const activeRoadmaps = await Roadmap.find({ status: 'active' }).sort({ updatedAt: -1, createdAt: -1 });
    const userActiveMap = new Map();
    const toAbandonIds = [];

    for (const rm of activeRoadmaps) {
      const userKey = rm.user.toString();
      if (!userActiveMap.has(userKey)) {
        // Keep the latest one active
        userActiveMap.set(userKey, rm._id);
      } else {
        // Duplicate active roadmap for this user: queue for abandonment
        toAbandonIds.push(rm._id);
      }
    }

    if (toAbandonIds.length > 0) {
      console.log(`⚠ Found ${toAbandonIds.length} duplicate active roadmaps. Safely marking as 'abandoned'...`);
      const abandonResult = await Roadmap.updateMany(
        { _id: { $in: toAbandonIds } },
        { $set: { status: 'abandoned', abandonedAt: new Date() } }
      );
      console.log(`✔ Safely updated ${abandonResult.modifiedCount} roadmaps to "abandoned" (zero history deleted).`);
    } else {
      console.log('✔ Zero duplicate active roadmaps found across all users.');
    }

    // 4. Create / Sync Partial Unique Index
    console.log('✔ Creating/Syncing partial unique index on { user: 1 } with status: "active"...');
    const collection = Roadmap.collection;

    // Check existing indexes
    const existingIndexes = await collection.indexes();
    const hasActivePartialIndex = existingIndexes.some(
      idx => idx.key && idx.key.user === 1 && idx.unique && idx.partialFilterExpression && idx.partialFilterExpression.status === 'active'
    );

    if (hasActivePartialIndex) {
      console.log('✔ Partial unique index already present and active.');
    } else {
      await collection.createIndex(
        { user: 1 },
        {
          unique: true,
          partialFilterExpression: { status: 'active' },
          name: 'user_1_single_active_roadmap_unique',
        }
      );
      console.log('✔ Successfully created partial unique index: user_1_single_active_roadmap_unique');
    }

    // 5. Verify index
    const updatedIndexes = await collection.indexes();
    console.log('\nVerified Indexes on Roadmaps collection:');
    updatedIndexes.forEach(idx => {
      console.log(` - ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${!!idx.unique}, partial: ${JSON.stringify(idx.partialFilterExpression || null)})`);
    });

    console.log('\n====================================================');
    console.log('🎉 ROADMAP MIGRATION & INDEX CREATION COMPLETED SUCCESSFULLY!');
    console.log('====================================================\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
