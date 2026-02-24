#!/usr/bin/env node

/**
 * 🚂 Railway Build Script
 * ========================
 * يُنفَّذ تلقائياً على Railway أثناء البناء.
 * يحوّل schema.prisma من SQLite إلى PostgreSQL.
 * 
 * محلياً: لا يتغير شيء — SQLite يبقى كما هو.
 * Railway: يتحول تلقائياً لـ PostgreSQL.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const rootDir = path.join(__dirname, '..');

console.log('');
console.log('🚂 ===================================');
console.log('🚂  STRATIX — Railway Build Script');
console.log('🚂 ===================================');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 DATABASE_URL set: ${!!process.env.DATABASE_URL}`);
console.log(`📍 DATABASE_URL type: ${process.env.DATABASE_URL ? (process.env.DATABASE_URL.startsWith('postgres') ? 'PostgreSQL ✅' : 'Other ⚠️') : 'NOT SET ❌'}`);
console.log('');

// ============ Step 1: Swap provider to PostgreSQL ============
console.log('📝 [Step 1/3] Updating schema provider...');
try {
    let schema = fs.readFileSync(schemaPath, 'utf-8');

    if (schema.includes('provider = "sqlite"')) {
        schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
        fs.writeFileSync(schemaPath, schema);
        console.log('   ✅ Schema provider changed: sqlite → postgresql');
    } else if (schema.includes('provider = "postgresql"')) {
        console.log('   ℹ️ Schema already uses postgresql');
    } else {
        console.log('   ⚠️ Unknown provider in schema');
    }
} catch (err) {
    console.error('   ❌ Failed to update schema:', err.message);
    process.exit(1);
}

// ============ Step 2: Generate Prisma Client ============
console.log('');
console.log('🔨 [Step 2/3] Generating Prisma Client...');
try {
    execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });
    console.log('   ✅ Prisma Client generated');
} catch (err) {
    console.error('   ❌ Failed to generate Prisma Client:', err.message);
    process.exit(1);
}

// ============ Step 3: Push schema to database ============
console.log('');
console.log('📦 [Step 3/3] Pushing schema to database...');

// Check if DATABASE_URL is a valid PostgreSQL URL
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl) {
    console.log('   ⚠️ DATABASE_URL is not set!');
    console.log('   ⚠️ Skipping db push — add a PostgreSQL database in Railway first.');
    console.log('   ⚠️ After adding PostgreSQL, redeploy and it will work.');
    console.log('');
    console.log('🟡 [Railway Build] Partial build complete (no database push)');
    console.log('   → Add PostgreSQL service in Railway, then redeploy.');
    process.exit(0); // Don't fail — Prisma Client is generated
}

if (!dbUrl.startsWith('postgres')) {
    console.log(`   ⚠️ DATABASE_URL doesn't look like PostgreSQL: ${dbUrl.substring(0, 20)}...`);
    console.log('   ⚠️ Skipping db push — make sure you have PostgreSQL linked.');
    console.log('');
    console.log('🟡 [Railway Build] Partial build complete (invalid DATABASE_URL)');
    process.exit(0);
}

// DATABASE_URL is valid PostgreSQL — push the schema
try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: rootDir });
    console.log('   ✅ Database schema pushed successfully');
} catch (err) {
    console.error('   ❌ Failed to push schema:', err.message);
    console.error('   ⚠️ Check that your PostgreSQL database is accessible.');
    process.exit(1);
}

// ============ Step 4: Seed essential data (first deploy only) ============
console.log('');
console.log('🌱 [Bonus] Checking if seed is needed...');
try {
    const result = execSync(`node -e "
    const prisma = require('./lib/prisma');
    prisma.sector.count()
      .then(c => { console.log(c === 0 ? 'NEEDS_SEED' : 'HAS_DATA'); return prisma.\\$disconnect(); })
      .catch(() => { console.log('NEEDS_SEED'); return prisma.\\$disconnect(); });
  "`, { cwd: rootDir, encoding: 'utf-8', timeout: 15000 }).trim();

    if (result.includes('NEEDS_SEED')) {
        console.log('   🌱 First deploy — running seed...');
        execSync('node scripts/seed.js', { stdio: 'inherit', cwd: rootDir, timeout: 60000 });
        console.log('   ✅ Seed completed');
    } else {
        console.log('   ℹ️ Data exists — skipping seed');
    }
} catch (err) {
    console.warn('   ⚠️ Seed skipped (non-critical):', err.message?.substring(0, 100));
}

console.log('');
console.log('🎉 ===================================');
console.log('🎉  Railway Build COMPLETE!');
console.log('🎉  Ready to start: node server.js');
console.log('🎉 ===================================');
console.log('');
