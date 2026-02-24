#!/usr/bin/env node

/**
 * 🚀 Railway Start Script
 * ========================
 * يُنفَّذ عند بدء التشغيل على Railway.
 * يسوي db push + seed قبل تشغيل السيرفر.
 * الشبكة الداخلية متاحة هنا (Runtime).
 */

const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('');
console.log('🚀 ===================================');
console.log('🚀  STRATIX — Railway Start Script');
console.log('🚀 ===================================');
console.log('');

// ============ Step 1: Push schema to database ============
console.log('📦 [Step 1/2] Pushing schema to database...');
try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: rootDir });
    console.log('   ✅ Database schema pushed successfully');
} catch (err) {
    console.error('   ❌ Failed to push schema:', err.message);
    process.exit(1);
}

// ============ Step 2: Seed if needed ============
console.log('');
console.log('🌱 [Step 2/2] Checking if seed is needed...');
try {
    const checkScript = `
    const prisma = require('./lib/prisma');
    prisma.sector.count()
      .then(c => { console.log(c === 0 ? 'NEEDS_SEED' : 'HAS_DATA'); return prisma.$disconnect(); })
      .catch(() => { console.log('NEEDS_SEED'); return prisma.$disconnect(); });
    `;
    const result = execSync(`node -e "${checkScript.replace(/\n/g, ' ')}"`, {
        cwd: rootDir,
        encoding: 'utf-8',
        timeout: 15000
    }).trim();

    if (result.includes('NEEDS_SEED')) {
        console.log('   🌱 First deploy — running seed...');
        execSync('node scripts/seed.js', { stdio: 'inherit', cwd: rootDir, timeout: 60000 });
        console.log('   ✅ Seed completed');
    } else {
        console.log('   ℹ️ Data exists — skipping seed');
    }
} catch (err) {
    console.warn('   ⚠️ Seed check skipped (non-critical):', err.message?.substring(0, 100));
}

// ============ Step 3: Start the server ============
console.log('');
console.log('🚀 Starting server...');
console.log('');

// Use require to start the server in the same process
require(path.join(rootDir, 'server.js'));
