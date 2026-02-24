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

// ============ DONE ============
// db push و seed بيصيرون وقت التشغيل (runtime) 
// لأن الشبكة الداخلية ما تشتغل وقت البناء
console.log('');
console.log('ℹ️  Database push will happen at runtime (start command)');
console.log('ℹ️  Internal networking is not available during build.');
console.log('');
console.log('🎉 ===================================');
console.log('🎉  Railway Build COMPLETE!');
console.log('🎉  Ready to start with db push + seed');
console.log('🎉 ===================================');
console.log('');
