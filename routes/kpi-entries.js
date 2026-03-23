const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkDataEntryPermission, checkPermission } = require('../middleware/permission');
const { checkOwnership } = require('../middleware/ownership');

const router = express.Router();

// ============ KPI ENTRIES ============
// Periodic data entry for KPI tracking

// ===== Helper: sync KPI actual field from latest confirmed entry =====
async function syncKpiActual(kpiId) {
    try {
        const kpi = await prisma.kPI.findUnique({ where: { id: kpiId } });
        if (!kpi) return;

        const latestConfirmed = await prisma.kPIEntry.findFirst({
            where: { kpiId, status: 'CONFIRMED' },
            orderBy: { periodEnd: 'desc' },
        });

        if (latestConfirmed) {
            const target = kpi.target || 0;
            const actual = latestConfirmed.value;
            const ratio = target > 0 ? actual / target : 0;
            let kpiStatus = 'ON_TRACK';
            if (ratio < 0.5) kpiStatus = 'CRITICAL';
            else if (ratio < 0.7) kpiStatus = 'AT_RISK';
            else if (ratio < 0.9) kpiStatus = 'BELOW_TARGET';

            await prisma.kPI.update({
                where: { id: kpiId },
                data: { actual, status: kpiStatus }
            });
            console.log(`[KPI-Entry] Synced KPI ${kpiId}: actual=${actual}, status=${kpiStatus}`);
        } else {
            // No confirmed entries left → reset actual
            await prisma.kPI.update({
                where: { id: kpiId },
                data: { actual: null, status: 'ON_TRACK' }
            });
            console.log(`[KPI-Entry] Reset KPI ${kpiId}: no confirmed entries`);
        }
    } catch (err) {
        console.error('[KPI-Entry] syncKpiActual error:', err);
    }
}

// Get all entries (with filters)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { kpiId, status, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};
        // Auto-filter by user's entity
        if (req.user.activeEntityId) {
            where.kpi = { version: { entityId: req.user.activeEntityId } };
        }
        if (kpiId) where.kpiId = kpiId;
        if (status) where.status = status;

        const entries = await prisma.kPIEntry.findMany({
            where,
            include: {
                kpi: {
                    select: {
                        id: true,
                        name: true,
                        nameAr: true,
                        unit: true,
                        target: true,
                        warningThreshold: true,
                        criticalThreshold: true,
                    }
                }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ periodStart: 'desc' }]
        });

        const total = await prisma.kPIEntry.count({ where });

        res.json({
            entries,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching KPI entries:', error);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// Get entries for a specific KPI with stats
router.get('/stats/:kpiId', verifyToken, checkOwnership('kPI', 'kpiId'), async (req, res) => {
    try {
        const entries = await prisma.kPIEntry.findMany({
            where: { kpiId: req.params.kpiId, status: 'CONFIRMED' },
            orderBy: [{ periodStart: 'desc' }],
            take: 20
        });

        const kpi = await prisma.kPI.findUnique({
            where: { id: req.params.kpiId },
            select: { id: true, name: true, nameAr: true, unit: true, target: true, warningThreshold: true, criticalThreshold: true }
        });

        if (!kpi) {
            return res.status(404).json({ error: 'KPI not found' });
        }

        const values = entries.map(e => e.value);
        const stats = {
            count: entries.length,
            latest: entries.length > 0 ? entries[0].value : null,
            average: values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length) : null,
            min: values.length > 0 ? Math.min(...values) : null,
            max: values.length > 0 ? Math.max(...values) : null,
            trend: calculateTrend(values),
        };

        res.json({ kpi, entries, stats });
    } catch (error) {
        console.error('Error fetching KPI stats:', error);
        res.status(500).json({ error: 'Failed to fetch KPI stats' });
    }
});

// Get single entry
router.get('/:id', verifyToken, checkOwnership('kPIEntry'), async (req, res) => {
    try {
        const entry = await prisma.kPIEntry.findUnique({
            where: { id: req.params.id },
            include: {
                kpi: {
                    select: { id: true, name: true, nameAr: true, unit: true, target: true }
                }
            }
        });

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        res.json(entry);
    } catch (error) {
        console.error('Error fetching entry:', error);
        res.status(500).json({ error: 'Failed to fetch entry' });
    }
});

// Create entry (DATA_ENTRY with canEnterKPI)
router.post('/', verifyToken, checkDataEntryPermission('canEnterKPI'), async (req, res) => {
    try {
        const { kpiId, value, periodStart, periodEnd, enteredBy, status, notes } = req.body;

        if (!kpiId || value === undefined || !periodStart || !periodEnd) {
            return res.status(400).json({ error: 'kpiId, value, periodStart, and periodEnd are required' });
        }

        // Verify KPI exists and belongs to user's entity
        const kpi = await prisma.kPI.findUnique({
            where: { id: kpiId },
            include: { version: { select: { entityId: true } } }
        });
        if (!kpi) {
            return res.status(404).json({ error: 'KPI not found' });
        }

        const userEntityId = req.user?.activeEntityId || req.user?.entityId;
        if (kpi.version?.entityId !== userEntityId && req.user?.systemRole !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'غير مصرح لك إضافة بيانات في هذا المؤشر' });
        }

        const entry = await prisma.kPIEntry.create({
            data: {
                kpiId,
                value: parseFloat(value),
                periodStart: new Date(periodStart),
                periodEnd: new Date(periodEnd),
                enteredBy: enteredBy || null,
                status: status || 'CONFIRMED',
                notes: notes || null,
            },
            include: {
                kpi: { select: { id: true, name: true, unit: true, target: true } }
            }
        });

        // ===== AUTO-UPDATE KPI actual =====
        await syncKpiActual(kpiId);

        res.status(201).json(entry);
    } catch (error) {
        console.error('Error creating KPI entry:', error);
        res.status(500).json({ error: 'Failed to create entry' });
    }
});

// Bulk create entries (DATA_ENTRY with canEnterKPI)
router.post('/bulk', verifyToken, checkDataEntryPermission('canEnterKPI'), async (req, res) => {
    try {
        const { entries } = req.body;

        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: 'entries array is required' });
        }

        const userEntityId = req.user?.activeEntityId || req.user?.entityId;
        const isSuperAdmin = req.user?.systemRole === 'SUPER_ADMIN';

        const created = [];
        for (const entry of entries) {
            const { kpiId, value, periodStart, periodEnd, enteredBy, status, notes } = entry;
            if (!kpiId || value === undefined || !periodStart || !periodEnd) continue;

            const kpi = await prisma.kPI.findUnique({
                where: { id: kpiId },
                include: { version: { select: { entityId: true } } }
            });
            if (!kpi || (!isSuperAdmin && kpi.version?.entityId !== userEntityId)) continue;

            const result = await prisma.kPIEntry.create({
                data: {
                    kpiId,
                    value: parseFloat(value),
                    periodStart: new Date(periodStart),
                    periodEnd: new Date(periodEnd),
                    enteredBy: enteredBy || null,
                    status: status || 'CONFIRMED',
                    notes: notes || null,
                }
            });
            created.push(result);
        }

        res.status(201).json({ created: created.length, entries: created });
    } catch (error) {
        console.error('Error bulk creating entries:', error);
        res.status(500).json({ error: 'Failed to bulk create entries' });
    }
});

// Update entry (DATA_ENTRY with canEnterKPI)
router.patch('/:id', verifyToken, checkDataEntryPermission('canEnterKPI'), checkOwnership('kPIEntry'), async (req, res) => {
    try {
        const { value, periodStart, periodEnd, status, notes } = req.body;

        const existing = await prisma.kPIEntry.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        const updateData = {};
        if (value !== undefined) updateData.value = parseFloat(value);
        if (periodStart) updateData.periodStart = new Date(periodStart);
        if (periodEnd) updateData.periodEnd = new Date(periodEnd);
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes || null;

        const entry = await prisma.kPIEntry.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                kpi: { select: { id: true, name: true, unit: true, target: true } }
            }
        });

        // ===== AUTO-SYNC KPI actual =====
        await syncKpiActual(existing.kpiId);

        res.json(entry);
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({ error: 'Failed to update entry' });
    }
});

// Delete entry
router.delete('/:id', verifyToken, checkPermission('EDITOR'), checkOwnership('kPIEntry'), async (req, res) => {
    try {
        const entry = await prisma.kPIEntry.findUnique({ where: { id: req.params.id } });
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        await prisma.kPIEntry.delete({ where: { id: req.params.id } });

        // ===== AUTO-SYNC KPI actual =====
        await syncKpiActual(entry.kpiId);

        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

// Helper: Calculate trend from values array (newest first)
function calculateTrend(values) {
    if (values.length < 2) return 'STABLE';
    const recent = values.slice(0, Math.ceil(values.length / 2));
    const older = values.slice(Math.ceil(values.length / 2));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const diff = ((recentAvg - olderAvg) / olderAvg) * 100;
    if (diff > 5) return 'INCREASING';
    if (diff < -5) return 'DECREASING';
    return 'STABLE';
}

module.exports = router;
