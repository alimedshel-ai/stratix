/**
 * Prisma Client Singleton
 * يضمن استخدام instance واحد عبر التطبيق (يمنع connection pool exhaustion)
 */

'use strict';

const { PrismaClient } = require('@prisma/client');

// منع إنشاء multiple instances في development (Hot Reload)
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;

