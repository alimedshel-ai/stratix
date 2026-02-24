#!/usr/bin/env node

/**
 * 🚀 Railway Start Script
 * ========================
 * يُنفَّذ عند بدء التشغيل على Railway.
 * 1. يحوّل provider من sqlite إلى postgresql
 * 2. يسوي prisma generate + db push
 * 3. يسوي seed لو أول مرة
 * 4. يشغّل السيرفر
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma');

console.log('');
console.log('🚀 ===================================');
console.log('🚀  STRATIX — Railway Start Script');
console.log('🚀 ===================================');
console.log(`📍 DATABASE_URL set: ${!!process.env.DATABASE_URL}`);
console.log('');

// ============ Step 1: Swap provider to PostgreSQL ============
console.log('📝 [Step 1/4] Ensuring PostgreSQL provider...');
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
console.log('🔨 [Step 2/4] Generating Prisma Client...');
try {
    execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });
    console.log('   ✅ Prisma Client generated');
} catch (err) {
    console.error('   ❌ Failed to generate Prisma Client:', err.message);
    process.exit(1);
}

// ============ Step 3: Push schema to database ============
console.log('');
console.log('📦 [Step 3/4] Pushing schema to database...');
try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: rootDir });
    console.log('   ✅ Database schema pushed successfully');
} catch (err) {
    console.error('   ❌ Failed to push schema:', err.message);
    process.exit(1);
}

// ============ Step 4: Seed if needed ============
console.log('');
console.log('🌱 [Step 4/4] Checking if seed is needed...');
try {
    const checkScript = `
        const prisma = require('./lib/prisma');
        prisma.sector.count()
          .then(c => { console.log(c === 0 ? 'NEEDS_SEED' : 'HAS_DATA'); return prisma.$disconnect(); })
          .catch(() => { console.log('NEEDS_SEED'); return prisma.$disconnect(); });
    `;
    const result = execSync(`node -e "${checkScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
        cwd: rootDir,
        encoding: 'utf-8',
        timeout: 15000
    }).trim();

    if (result.includes('NEEDS_SEED')) {
        console.log('   🌱 First deploy — running seed...');
        execSync('node scripts/seed.js', { stdio: 'inherit', cwd: rootDir, timeout: 120000 });
        console.log('   ✅ Seed completed');
    } else {
        console.log('   ℹ️ Data exists — skipping seed');
    }
} catch (err) {
    console.warn('   ⚠️ Seed check skipped (non-critical):', err.message?.substring(0, 100));
}

// ============ Step 5: Start the server ============
console.log('');
console.log('🚀 ===================================');
console.log('🚀  Starting Stratix Server...');
console.log('🚀 ===================================');
console.log('');

// Use require to start the server in the same process
require(path.join(rootDir, 'server.js'));
