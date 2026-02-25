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

// ============ HEALTH INDEX API ============
// مؤشر الصحة الاستراتيجية — Composite Score (0-100)
// Formula: KPI Performance × 35% + Initiative Completion × 25% + Review Regularity × 20% + Risk Management × 20%

router.get('/health/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        // 1. Verify entity
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            select: { id: true, legalName: true, displayName: true }
        });
        if (!entity) return res.status(404).json({ error: 'Entity not found' });

        // 2. Get active strategy version
        const activeVersion = await prisma.strategyVersion.findFirst({
            where: { entityId, isActive: true }
        });

        if (!activeVersion) {
            return res.json({
                entityId,
                entityName: entity.legalName || entity.displayName,
                healthScore: 0,
                level: 'UNKNOWN',
                message: 'لا توجد نسخة استراتيجية نشطة',
                breakdown: { kpiScore: 0, initiativeScore: 0, reviewScore: 0, riskScore: 0 },
                trend: 'STABLE',
                lastUpdated: new Date()
            });
        }

        const versionId = activeVersion.id;

        // ======= Component 1: KPI Performance (35%) =======
        const kpis = await prisma.kPI.findMany({
            where: { versionId },
            select: { actual: true, target: true, warningThreshold: true, criticalThreshold: true }
        });

        let kpiScore = 0;
        if (kpis.length > 0) {
            const measuredKpis = kpis.filter(k => k.actual != null && k.target != null && k.target > 0);
            if (measuredKpis.length > 0) {
                const totalPct = measuredKpis.reduce((sum, k) => {
                    const pct = Math.min((k.actual / k.target) * 100, 120); // cap at 120%
                    return sum + pct;
                }, 0);
                kpiScore = Math.min(totalPct / measuredKpis.length, 100);
            } else {
                kpiScore = 30; // KPIs exist but no data entered yet
            }
        }

        // ======= Component 2: Initiative Completion (25%) =======
        const initiatives = await prisma.strategicInitiative.findMany({
            where: { versionId },
            select: { status: true, progress: true, endDate: true }
        });

        let initiativeScore = 0;
        if (initiatives.length > 0) {
            const completed = initiatives.filter(i => i.status === 'COMPLETED').length;
            const avgProgress = initiatives.reduce((sum, i) => sum + (i.progress || 0), 0) / initiatives.length;
            const onTime = initiatives.filter(i => {
                if (!i.endDate) return true;
                return i.status === 'COMPLETED' || new Date(i.endDate) >= new Date();
            }).length;
            const onTimeRate = (onTime / initiatives.length) * 100;

            initiativeScore = (avgProgress * 0.5) + ((completed / initiatives.length) * 100 * 0.3) + (onTimeRate * 0.2);
            initiativeScore = Math.min(initiativeScore, 100);
        }

        // ======= Component 3: Review Regularity (20%) =======
        const reviews = await prisma.strategicReview.findMany({
            where: { versionId },
            select: { status: true, overallScore: true, createdAt: true, decision: true },
            orderBy: { createdAt: 'desc' }
        });

        let reviewScore = 0;
        if (reviews.length > 0) {
            // Score based on: review frequency + completion rate + recent scores
            const completedReviews = reviews.filter(r => r.status === 'COMPLETED').length;
            const completionRate = (completedReviews / reviews.length) * 100;

            // Frequency: at least 1 review per quarter = 100
            const monthsSinceFirst = reviews.length > 0
                ? Math.max(1, (new Date() - new Date(reviews[reviews.length - 1].createdAt)) / (1000 * 60 * 60 * 24 * 30))
                : 1;
            const reviewFrequency = Math.min((reviews.length / (monthsSinceFirst / 3)) * 100, 100);

            // Average review scores
            const scoredReviews = reviews.filter(r => r.overallScore != null);
            const avgReviewScore = scoredReviews.length > 0
                ? scoredReviews.reduce((s, r) => s + r.overallScore, 0) / scoredReviews.length
                : 50;

            reviewScore = (completionRate * 0.3) + (reviewFrequency * 0.3) + (avgReviewScore * 0.4);
            reviewScore = Math.min(reviewScore, 100);
        }

        // ======= Component 4: Risk Management (20%) =======
        const risks = await prisma.strategicRisk.findMany({
            where: { versionId },
            select: { status: true, probabilityScore: true, impactScore: true, riskScore: true, mitigation: true }
        });

        let riskScore = 100; // Start at 100 (no risks = healthy)
        if (risks.length > 0) {
            const mitigated = risks.filter(r => r.status === 'MITIGATED' || r.status === 'CLOSED').length;
            const mitigationRate = (mitigated / risks.length) * 100;

            const hasMitigation = risks.filter(r => r.mitigation && r.mitigation.trim().length > 0).length;
            const planRate = (hasMitigation / risks.length) * 100;

            const highRisks = risks.filter(r => {
                const score = r.riskScore || ((r.probabilityScore || 3) * (r.impactScore || 3));
                return score >= 15;
            }).length;
            const highRiskPenalty = Math.min(highRisks * 10, 40);

            riskScore = (mitigationRate * 0.4) + (planRate * 0.3) + (100 - highRiskPenalty) * 0.3;
            riskScore = Math.max(Math.min(riskScore, 100), 0);
        }

        // ======= Composite Health Score =======
        const healthScore = Math.round(
            (kpiScore * 0.35) +
            (initiativeScore * 0.25) +
            (reviewScore * 0.20) +
            (riskScore * 0.20)
        );

        // Determine level
        let level, message;
        if (healthScore >= 80) { level = 'EXCELLENT'; message = 'أداء استراتيجي ممتاز — استمر!'; }
        else if (healthScore >= 60) { level = 'GOOD'; message = 'أداء جيد مع فرص للتحسين'; }
        else if (healthScore >= 40) { level = 'WARNING'; message = 'تحتاج لانتباه — هناك مؤشرات ضعيفة'; }
        else if (healthScore >= 20) { level = 'CRITICAL'; message = 'وضع حرج — تدخل عاجل مطلوب'; }
        else { level = 'DANGER'; message = 'خطر — النظام الاستراتيجي بحاجة لإعادة بناء'; }

        // Determine trend from last 2 reviews
        let trend = 'STABLE';
        const scoredReviews = reviews.filter(r => r.overallScore != null);
        if (scoredReviews.length >= 2) {
            const latest = scoredReviews[0].overallScore;
            const previous = scoredReviews[1].overallScore;
            if (latest > previous + 5) trend = 'IMPROVING';
            else if (latest < previous - 5) trend = 'DECLINING';
        }

        // Response
        res.json({
            entityId,
            entityName: entity.legalName || entity.displayName,
            healthScore,
            level,
            message,
            trend,
            breakdown: {
                kpiScore: Math.round(kpiScore),
                kpiWeight: 35,
                initiativeScore: Math.round(initiativeScore),
                initiativeWeight: 25,
                reviewScore: Math.round(reviewScore),
                reviewWeight: 20,
                riskScore: Math.round(riskScore),
                riskWeight: 20
            },
            details: {
                totalKpis: kpis.length,
                totalInitiatives: initiatives.length,
                totalReviews: reviews.length,
                totalRisks: risks.length,
                versionName: activeVersion.name || `v${activeVersion.versionNumber}`,
                versionStatus: activeVersion.status
            },
            lastUpdated: new Date()
        });

    } catch (error) {
        console.error('Error calculating health index:', error);
        res.status(500).json({ error: 'Failed to calculate health index' });
    }
});

// Get Health Index for ALL entities (system overview)
router.get('/health-overview', verifyToken, async (req, res) => {
    try {
        // Single query — fetch all entities with their active version, KPIs, and initiatives
        const entities = await prisma.entity.findMany({
            select: {
                id: true,
                legalName: true,
                displayName: true,
                versions: {
                    where: { isActive: true },
                    take: 1,
                    select: {
                        id: true,
                        kpis: { select: { actual: true, target: true } },
                        initiatives: { select: { progress: true } }
                    }
                }
            },
            orderBy: { legalName: 'asc' }
        });

        const results = entities.map(entity => {
            const activeVersion = entity.versions[0];
            if (!activeVersion) {
                return { entityId: entity.id, entityName: entity.legalName || entity.displayName, healthScore: 0, level: 'UNKNOWN', hasStrategy: false };
            }

            const kpis = activeVersion.kpis;
            const initiatives = activeVersion.initiatives;

            let kpiScore = 0;
            const measured = kpis.filter(k => k.actual != null && k.target != null && k.target > 0);
            if (measured.length > 0) {
                kpiScore = Math.min(measured.reduce((s, k) => s + Math.min((k.actual / k.target) * 100, 120), 0) / measured.length, 100);
            }
            const iniScore = initiatives.length > 0
                ? initiatives.reduce((s, i) => s + (i.progress || 0), 0) / initiatives.length
                : 0;

            const score = Math.round(kpiScore * 0.5 + iniScore * 0.5);
            let level;
            if (score >= 80) level = 'EXCELLENT';
            else if (score >= 60) level = 'GOOD';
            else if (score >= 40) level = 'WARNING';
            else if (score >= 20) level = 'CRITICAL';
            else level = 'DANGER';

            return { entityId: entity.id, entityName: entity.legalName || entity.displayName, healthScore: score, level, hasStrategy: true, kpis: kpis.length, initiatives: initiatives.length };
        });

        results.sort((a, b) => b.healthScore - a.healthScore);

        res.json({
            entities: results,
            summary: {
                total: results.length,
                excellent: results.filter(r => r.level === 'EXCELLENT').length,
                good: results.filter(r => r.level === 'GOOD').length,
                warning: results.filter(r => r.level === 'WARNING').length,
                critical: results.filter(r => r.level === 'CRITICAL').length,
                danger: results.filter(r => r.level === 'DANGER').length,
                unknown: results.filter(r => r.level === 'UNKNOWN').length,
                averageScore: results.length > 0 ? Math.round(results.reduce((s, r) => s + r.healthScore, 0) / results.length) : 0
            }
        });

    } catch (error) {
        console.error('Error fetching health overview:', error);
        res.status(500).json({ error: 'Failed to fetch health overview' });
    }
});

// ============ CONSULTANT DASHBOARD API ============
// Returns all entities the current user has access to, with health data for each

router.get('/consultant-overview', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get all memberships for this user
        const memberships = await prisma.member.findMany({
            where: { userId },
            include: {
                entity: {
                    include: {
                        company: { select: { id: true, nameAr: true, nameEn: true } },
                        sector: { select: { id: true, nameAr: true } },
                    }
                }
            }
        });

        if (!memberships.length) {
            return res.json({ entities: [], summary: { total: 0 } });
        }

        // Process all memberships concurrently
        const results = await Promise.all(memberships.map(async (membership) => {
            const entity = membership.entity;
            if (!entity) return null;

            const activeVersion = await prisma.strategyVersion.findFirst({
                where: { entityId: entity.id, isActive: true },
                select: { id: true }
            });

            let healthScore = 0, kpiCount = 0, iniCount = 0, alertCount = 0;
            let kpiSummary = { onTrack: 0, warning: 0, critical: 0, total: 0 };
            let iniSummary = { completed: 0, inProgress: 0, overdue: 0, total: 0 };

            if (activeVersion) {
                const [kpis, initiatives, alerts] = await Promise.all([
                    prisma.kPI.findMany({
                        where: { versionId: activeVersion.id },
                        select: { actual: true, target: true, warningThreshold: true, criticalThreshold: true }
                    }),
                    prisma.strategicInitiative.findMany({
                        where: { versionId: activeVersion.id },
                        select: { status: true, progress: true, endDate: true }
                    }),
                    prisma.strategicAlert.count({
                        where: { entityId: entity.id, isRead: false, isDismissed: false }
                    })
                ]);

                kpiCount = kpis.length;
                kpiSummary.total = kpis.length;
                let kpiScore = 0;
                const measured = kpis.filter(k => k.actual != null && k.target != null && k.target > 0);
                if (measured.length > 0) {
                    kpiScore = Math.min(measured.reduce((s, k) => s + Math.min((k.actual / k.target) * 100, 120), 0) / measured.length, 100);
                }
                kpis.forEach(kpi => {
                    if (!kpi.actual || !kpi.target) return;
                    const pct = (kpi.actual / kpi.target) * 100;
                    if (kpi.criticalThreshold && pct <= kpi.criticalThreshold) kpiSummary.critical++;
                    else if (kpi.warningThreshold && pct <= kpi.warningThreshold) kpiSummary.warning++;
                    else kpiSummary.onTrack++;
                });

                iniCount = initiatives.length;
                iniSummary.total = initiatives.length;
                initiatives.forEach(ini => {
                    if (ini.status === 'COMPLETED') iniSummary.completed++;
                    else if (ini.status === 'IN_PROGRESS') iniSummary.inProgress++;
                    if (ini.endDate && new Date(ini.endDate) < new Date() && ini.status !== 'COMPLETED') iniSummary.overdue++;
                });
                const iniScore = initiatives.length > 0
                    ? initiatives.reduce((s, i) => s + (i.progress || 0), 0) / initiatives.length
                    : 0;

                healthScore = Math.round(kpiScore * 0.5 + iniScore * 0.5);
                alertCount = alerts;
            }

            let level;
            if (healthScore >= 80) level = 'EXCELLENT';
            else if (healthScore >= 60) level = 'GOOD';
            else if (healthScore >= 40) level = 'WARNING';
            else if (healthScore >= 20) level = 'CRITICAL';
            else level = 'DANGER';

            return {
                entityId: entity.id,
                entityName: entity.displayName || entity.legalName,
                companyName: entity.company?.nameAr || entity.company?.nameEn || null,
                sectorName: entity.sector?.nameAr || null,
                role: membership.role,
                userType: membership.userType,
                healthScore, level,
                hasStrategy: !!activeVersion,
                kpis: kpiCount, initiatives: iniCount, alerts: alertCount,
                kpiSummary, iniSummary,
                joinedAt: membership.joinedAt,
            };
        }));

        // Remove nulls (entities that were deleted)
        const validResults = results.filter(Boolean);

        validResults.sort((a, b) => b.healthScore - a.healthScore);

        const avgScore = validResults.length > 0
            ? Math.round(validResults.reduce((s, r) => s + r.healthScore, 0) / validResults.length)
            : 0;

        res.json({
            entities: validResults,
            summary: {
                total: validResults.length,
                averageScore: avgScore,
                excellent: validResults.filter(r => r.level === 'EXCELLENT').length,
                good: validResults.filter(r => r.level === 'GOOD').length,
                warning: validResults.filter(r => r.level === 'WARNING').length,
                critical: validResults.filter(r => r.level === 'CRITICAL').length,
                totalAlerts: validResults.reduce((s, r) => s + r.alerts, 0),
                totalKpis: validResults.reduce((s, r) => s + r.kpis, 0),
                totalInitiatives: validResults.reduce((s, r) => s + r.initiatives, 0),
            }
        });

    } catch (error) {
        console.error('Error fetching consultant overview:', error);
        res.status(500).json({ error: 'Failed to fetch consultant overview' });
    }
});

// ============ REPORT DATA API ============
// بيانات التقارير — يجمع كل المعلومات للتقرير في طلب واحد
router.get('/report-data', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const entityId = req.user.entityId;

        if (!entityId) {
            return res.status(400).json({ error: 'لا يوجد كيان مرتبط بحسابك' });
        }

        // Get entity info
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            select: { id: true, legalName: true, displayName: true, size: true }
        });

        // Get active version
        const activeVersion = await prisma.strategyVersion.findFirst({
            where: { entityId, isActive: true }
        });

        if (!activeVersion) {
            return res.json({ entity, hasData: false, message: 'لا توجد خطة استراتيجية نشطة' });
        }

        const versionId = activeVersion.id;

        // Fetch all data in parallel
        const [objectives, kpis, kpiEntries, initiatives, risks, reviews, directions, members] = await Promise.all([
            prisma.strategicObjective.findMany({
                where: { versionId },
                select: { id: true, title: true, perspective: true, weight: true, progress: true, status: true }
            }),
            prisma.kPI.findMany({
                where: { versionId },
                select: {
                    id: true, name: true, actual: true, target: true, unit: true,
                    warningThreshold: true, criticalThreshold: true,
                    frequency: true, objective: { select: { title: true, perspective: true } }
                }
            }),
            prisma.kPIEntry.findMany({
                where: { kpi: { versionId } },
                select: { value: true, periodStart: true, createdAt: true, kpi: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 100
            }),
            prisma.strategicInitiative.findMany({
                where: { versionId },
                select: {
                    id: true, title: true, status: true, progress: true,
                    budget: true, budgetSpent: true, startDate: true, endDate: true,
                    owner: true, priority: true
                }
            }),
            prisma.strategicRisk.findMany({
                where: { versionId },
                select: {
                    id: true, title: true, status: true, category: true,
                    probabilityScore: true, impactScore: true, riskScore: true,
                    mitigation: true
                }
            }),
            prisma.strategicReview.findMany({
                where: { versionId },
                select: {
                    id: true, title: true, status: true, decision: true,
                    overallScore: true, createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            prisma.strategicDirection.findMany({
                where: { versionId },
                select: { id: true, type: true, content: true },
                take: 20
            }),
            prisma.member.findMany({
                where: { entityId },
                select: { id: true, role: true, user: { select: { name: true, email: true } } }
            })
        ]);

        // === KPI Summary ===
        const kpiSummary = { total: kpis.length, onTrack: 0, warning: 0, critical: 0, noData: 0 };
        kpis.forEach(kpi => {
            if (!kpi.actual || !kpi.target) { kpiSummary.noData++; return; }
            const pct = (kpi.actual / kpi.target) * 100;
            if (kpi.criticalThreshold && pct <= kpi.criticalThreshold) kpiSummary.critical++;
            else if (kpi.warningThreshold && pct <= kpi.warningThreshold) kpiSummary.warning++;
            else kpiSummary.onTrack++;
        });

        // === Objectives Summary ===
        const objSummary = { total: objectives.length, byPerspective: {} };
        const perspNames = { FINANCIAL: 'مالي', CUSTOMER: 'عملاء', INTERNAL: 'عمليات', INTERNAL_PROCESS: 'عمليات', LEARNING: 'تعلم ونمو', LEARNING_GROWTH: 'تعلم ونمو' };
        objectives.forEach(obj => {
            const p = obj.perspective || 'INTERNAL';
            if (!objSummary.byPerspective[p]) objSummary.byPerspective[p] = { name: perspNames[p] || p, count: 0, avgProgress: 0, total: 0 };
            objSummary.byPerspective[p].count++;
            objSummary.byPerspective[p].total += (obj.progress || 0);
        });
        Object.values(objSummary.byPerspective).forEach(v => { v.avgProgress = v.count > 0 ? Math.round(v.total / v.count) : 0; });
        const overallProgress = objectives.length > 0
            ? Math.round(objectives.reduce((s, o) => s + (o.progress || 0), 0) / objectives.length)
            : 0;

        // === Initiative Summary ===
        const iniSummary = { total: initiatives.length, completed: 0, inProgress: 0, planned: 0, overdue: 0 };
        let totalBudget = 0, totalActualCost = 0;
        initiatives.forEach(ini => {
            if (ini.status === 'COMPLETED') iniSummary.completed++;
            else if (ini.status === 'IN_PROGRESS') iniSummary.inProgress++;
            else iniSummary.planned++;
            if (ini.endDate && new Date(ini.endDate) < new Date() && ini.status !== 'COMPLETED') iniSummary.overdue++;
            totalBudget += (ini.budget || 0);
            totalActualCost += (ini.budgetSpent || 0);
        });
        const budgetUtilization = totalBudget > 0 ? Math.round((totalActualCost / totalBudget) * 100) : 0;

        // === Risk Summary ===
        const riskSummary = { total: risks.length, critical: 0, high: 0, medium: 0, low: 0, mitigated: 0 };
        risks.forEach(r => {
            const score = r.riskScore || ((r.probabilityScore || 3) * (r.impactScore || 3));
            if (score >= 20) riskSummary.critical++;
            else if (score >= 15) riskSummary.high++;
            else if (score >= 8) riskSummary.medium++;
            else riskSummary.low++;
            if (r.status === 'MITIGATED' || r.status === 'CLOSED') riskSummary.mitigated++;
        });

        // === Health Score (simplified) ===
        const measured = kpis.filter(k => k.actual != null && k.target != null && k.target > 0);
        const kpiScore = measured.length > 0 ? Math.min(measured.reduce((s, k) => s + Math.min((k.actual / k.target) * 100, 120), 0) / measured.length, 100) : 0;
        const iniScore = initiatives.length > 0 ? initiatives.reduce((s, i) => s + (i.progress || 0), 0) / initiatives.length : 0;
        const healthScore = Math.round(kpiScore * 0.5 + iniScore * 0.5);

        res.json({
            hasData: true,
            entity,
            version: { id: activeVersion.id, name: activeVersion.name, number: activeVersion.versionNumber },
            healthScore,
            overallProgress,
            kpiSummary,
            kpis: kpis.map(k => ({
                name: k.name, actual: k.actual, target: k.target, unit: k.unit,
                pct: k.target ? Math.round((k.actual / k.target) * 100) : 0,
                objective: k.objective?.title, perspective: k.objective?.perspective
            })),
            objSummary,
            objectives: objectives.map(o => ({ name: o.title, perspective: perspNames[o.perspective] || o.perspective, progress: o.progress || 0, status: o.status })),
            iniSummary,
            initiatives: initiatives.map(i => ({ name: i.title, status: i.status, progress: i.progress || 0, owner: i.owner, budget: i.budget, actualCost: i.budgetSpent, priority: i.priority })),
            budgetUtilization,
            totalBudget, totalActualCost,
            riskSummary,
            risks: risks.map(r => ({ name: r.title, status: r.status, category: r.category, score: r.riskScore || ((r.probabilityScore || 3) * (r.impactScore || 3)), mitigation: r.mitigation })),
            reviews,
            directions,
            teamSize: members.length,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error fetching report data:', error);
        res.status(500).json({ error: 'فشل في جلب بيانات التقرير' });
    }
});

module.exports = router;
