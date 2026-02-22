const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============ DASHBOARD API ============
// System-wide statistics and entity health overview

// Get system-wide dashboard stats
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const [
            entitiesCount,
            usersCount,
            sectorsCount,
            versionsCount,
            objectivesCount,
            kpisCount,
            initiativesCount,
            reviewsCount,
            choicesCount,
            risksCount,
            assessmentsCount,
            alertsUnread,
        ] = await Promise.all([
            prisma.entity.count(),
            prisma.user.count(),
            prisma.sector.count(),
            prisma.strategyVersion.count(),
            prisma.strategicObjective.count(),
            prisma.kPI.count(),
            prisma.strategicInitiative.count(),
            prisma.strategicReview.count(),
            prisma.strategicChoice.count(),
            prisma.strategicRisk.count(),
            prisma.assessment.count(),
            prisma.strategicAlert.count({ where: { isRead: false, isDismissed: false } }),
        ]);

        res.json({
            entities: entitiesCount,
            users: usersCount,
            sectors: sectorsCount,
            versions: versionsCount,
            objectives: objectivesCount,
            kpis: kpisCount,
            initiatives: initiativesCount,
            reviews: reviewsCount,
            choices: choicesCount,
            risks: risksCount,
            assessments: assessmentsCount,
            unreadAlerts: alertsUnread,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Get entity-specific dashboard
router.get('/entity/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        // Get entity info
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            select: {
                id: true, legalName: true, displayName: true, size: true, school: true,
                sector: { select: { id: true, nameAr: true, nameEn: true } }
            }
        });

        if (!entity) {
            return res.status(404).json({ error: 'Entity not found' });
        }

        // Get active version
        const activeVersion = await prisma.strategyVersion.findFirst({
            where: { entityId, isActive: true },
            include: {
                _count: {
                    select: {
                        objectives: true,
                        kpis: true,
                        initiatives: true,
                        reviews: true,
                        choices: true,
                        risks: true,
                        directions: true,
                        externalAnalyses: true,
                    }
                }
            }
        });

        // Get recent alerts
        const recentAlerts = await prisma.strategicAlert.findMany({
            where: { entityId, isDismissed: false },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        const unreadAlerts = await prisma.strategicAlert.count({
            where: { entityId, isRead: false, isDismissed: false }
        });

        // Get recent reviews
        const recentReviews = await prisma.strategicReview.findMany({
            where: { version: { entityId } },
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, title: true, decision: true, status: true, createdAt: true
            }
        });

        // KPI performance summary
        let kpiSummary = { onTrack: 0, warning: 0, critical: 0, total: 0 };
        if (activeVersion) {
            const kpis = await prisma.kPI.findMany({
                where: { versionId: activeVersion.id },
                select: { id: true, actual: true, target: true, warningThreshold: true, criticalThreshold: true }
            });
            kpiSummary.total = kpis.length;
            kpis.forEach(kpi => {
                if (!kpi.actual || !kpi.target) return;
                const pct = (kpi.actual / kpi.target) * 100;
                if (kpi.criticalThreshold && pct <= kpi.criticalThreshold) {
                    kpiSummary.critical++;
                } else if (kpi.warningThreshold && pct <= kpi.warningThreshold) {
                    kpiSummary.warning++;
                } else {
                    kpiSummary.onTrack++;
                }
            });
        }

        // Initiatives progress
        let initiativeSummary = { planned: 0, inProgress: 0, completed: 0, overdue: 0, total: 0 };
        if (activeVersion) {
            const initiatives = await prisma.strategicInitiative.findMany({
                where: { versionId: activeVersion.id },
                select: { status: true, endDate: true }
            });
            initiativeSummary.total = initiatives.length;
            initiatives.forEach(ini => {
                if (ini.status === 'COMPLETED') initiativeSummary.completed++;
                else if (ini.status === 'IN_PROGRESS') initiativeSummary.inProgress++;
                else if (ini.status === 'PLANNED') initiativeSummary.planned++;
                if (ini.endDate && new Date(ini.endDate) < new Date() && ini.status !== 'COMPLETED') {
                    initiativeSummary.overdue++;
                }
            });
        }

        res.json({
            entity,
            activeVersion: activeVersion ? {
                id: activeVersion.id,
                name: activeVersion.name,
                versionNumber: activeVersion.versionNumber,
                status: activeVersion.status,
                counts: activeVersion._count,
            } : null,
            kpiSummary,
            initiativeSummary,
            recentAlerts,
            unreadAlerts,
            recentReviews,
        });
    } catch (error) {
        console.error('Error fetching entity dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch entity dashboard' });
    }
});

// Get recent activity across the system
router.get('/activity', verifyToken, async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const [recentVersions, recentReviews, recentAlerts, recentAudit] = await Promise.all([
            prisma.strategyVersion.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, versionNumber: true, status: true, createdAt: true, entity: { select: { legalName: true } } }
            }),
            prisma.strategicReview.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, title: true, decision: true, status: true, createdAt: true }
            }),
            prisma.strategicAlert.findMany({
                where: { isDismissed: false },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, type: true, severity: true, title: true, createdAt: true }
            }),
            prisma.auditLog.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, action: true, details: true, createdAt: true, user: { select: { name: true } } }
            }),
        ]);

        res.json({
            recentVersions,
            recentReviews,
            recentAlerts,
            recentAudit,
        });
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

module.exports = router;
