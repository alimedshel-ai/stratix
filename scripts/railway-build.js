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

console.log('🚂 [Railway Build] Starting...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Database URL exists: ${!!process.env.DATABASE_URL}`);

// ============ Step 1: Swap provider to PostgreSQL ============
try {
    let schema = fs.readFileSync(schemaPath, 'utf-8');

    if (schema.includes('provider = "sqlite"')) {
        schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');

        // SQLite uses @default(cuid()) which works in PostgreSQL too ✅
        // SQLite String? works in PostgreSQL too ✅
        // No other changes needed!

        fs.writeFileSync(schemaPath, schema);
        console.log('✅ [Step 1] Schema provider changed: sqlite → postgresql');
    } else {
        console.log('ℹ️ [Step 1] Schema already uses postgresql');
    }
} catch (err) {
    console.error('❌ [Step 1] Failed to update schema:', err.message);
    process.exit(1);
}

// ============ Step 2: Generate Prisma Client ============
try {
    console.log('🔨 [Step 2] Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ [Step 2] Prisma Client generated');
} catch (err) {
    console.error('❌ [Step 2] Failed to generate Prisma Client:', err.message);
    process.exit(1);
}

// ============ Step 3: Push schema to database ============
try {
    console.log('📦 [Step 3] Pushing schema to database...');
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ [Step 3] Database schema pushed');
} catch (err) {
    console.error('❌ [Step 3] Failed to push schema:', err.message);
    console.error('⚠️ Make sure DATABASE_URL is set in Railway variables!');
    process.exit(1);
}

// ============ Step 4: Seed essential data (first deploy only) ============
try {
    console.log('🌱 [Step 4] Checking if seed is needed...');

    // Check if sectors exist — if not, this is first deploy
    const checkScript = `
    const prisma = require('./lib/prisma');
    async function check() {
      try {
        const count = await prisma.sector.count();
        if (count === 0) {
          console.log('NEEDS_SEED');
        } else {
          console.log('ALREADY_SEEDED');
        }
        await prisma.$disconnect();
      } catch(e) {
        console.log('NEEDS_SEED');
      }
    }
    check();
  `;

    const tempFile = path.join(__dirname, '_check_seed.js');
    fs.writeFileSync(tempFile, checkScript);

    const result = execSync(`node ${tempFile}`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8'
    }).trim();

    // Cleanup temp file
    fs.unlinkSync(tempFile);

    if (result.includes('NEEDS_SEED')) {
        console.log('🌱 First deploy detected — running seed...');
        execSync('node scripts/seed.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        console.log('✅ [Step 4] Seed completed');
    } else {
        console.log('ℹ️ [Step 4] Data already exists — skipping seed');
    }
} catch (err) {
    console.warn('⚠️ [Step 4] Seed skipped (non-critical):', err.message);
    // Don't exit — seed failure shouldn't block deployment
}

console.log('');
console.log('🎉 [Railway Build] Complete!');
console.log('🚀 Ready to start with: node server.js');
