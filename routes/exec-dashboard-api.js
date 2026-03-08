const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// EXEC DASHBOARD API — /api/v1/
// 5 endpoints matching the exec-dashboard.html requirements
// ============================================================

// --- Helper: get active entity for the authenticated user ---
async function getActiveEntityAndVersion(req) {
    const userId = req.user.id;
    const entityId = req.user.activeEntityId;

    // If no entity in token, find first membership
    let resolvedEntityId = entityId;
    if (!resolvedEntityId) {
        const membership = await prisma.member.findFirst({
            where: { userId },
            select: { entityId: true },
            orderBy: { joinedAt: 'desc' }
        });
        if (membership) resolvedEntityId = membership.entityId;
    }

    if (!resolvedEntityId) return { entityId: null, version: null };

    const version = await prisma.strategyVersion.findFirst({
        where: { entityId: resolvedEntityId, isActive: true },
        select: { id: true, name: true, versionNumber: true, status: true }
    });

    return { entityId: resolvedEntityId, version };
}


// ============================================================
// 1. GET /api/v1/heartbeat
// Returns a hash that changes when entity data changes.
// Dashboard uses this to decide whether to re-fetch everything.
// ============================================================
router.get('/heartbeat', verifyToken, async (req, res) => {
    try {
        const { entityId } = await getActiveEntityAndVersion(req);
        if (!entityId) return res.json({ hash: 0 });

        // Hash = combination of latest timestamps
        const [latestAlert, latestActivity, latestKpiEntry] = await Promise.all([
            prisma.strategicAlert.findFirst({
                where: { entityId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            }),
            prisma.activity.findFirst({
                where: { entityId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            }),
            prisma.kPIEntry.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            })
        ]);

        const hash = [
            latestAlert?.createdAt?.getTime() || 0,
            latestActivity?.createdAt?.getTime() || 0,
            latestKpiEntry?.createdAt?.getTime() || 0
        ].join('-');

        res.json({ hash });
    } catch (error) {
        console.error('[exec-api] heartbeat error:', error.message);
        res.json({ hash: Date.now() }); // Fallback: always update
    }
});


// ============================================================
// 2. GET /api/v1/bsc/score
// Returns BSC perspective scores (Financial, Customer, Ops, Growth)
// Attempts to use v_bsc_perspective_scores view first,
// then falls back to manual calculation from KPI data.
// ============================================================
router.get('/bsc/score', verifyToken, async (req, res) => {
    try {
        const { entityId, version } = await getActiveEntityAndVersion(req);
        if (!entityId || !version) {
            return res.json({ fin: 0, cust: 0, ops: 0, growth: 0, compliance: 0 });
        }

        // Try SQL view first (if migration has been applied)
        try {
            const viewResults = await prisma.$queryRawUnsafe(`
                SELECT perspective, avg_score
                FROM v_bsc_perspective_scores
                WHERE entity_id = $1 AND version_id = $2
            `, entityId, version.id);

            if (viewResults && viewResults.length > 0) {
                const map = {};
                viewResults.forEach(r => { map[r.perspective] = parseFloat(r.avg_score) || 0; });

                const scores = {
                    fin: map['FINANCIAL'] || 0,
                    cust: map['CUSTOMER'] || 0,
                    ops: map['INTERNAL_PROCESS'] || 0,
                    growth: map['LEARNING_GROWTH'] || 0
                };

                // Overall compliance from company score view
                let compliance = 0;
                try {
                    const companyScore = await prisma.$queryRawUnsafe(`
                        SELECT overall_score FROM v_bsc_company_score
                        WHERE entity_id = $1 AND version_id = $2
                    `, entityId, version.id);
                    if (companyScore.length > 0) compliance = parseFloat(companyScore[0].overall_score) || 0;
                } catch (_) { /* view might not exist */ }

                return res.json({ ...scores, compliance });
            }
        } catch (_viewError) {
            // View doesn't exist yet — fall back to manual calculation
        }

        // --- FALLBACK: Manual KPI-based calculation ---
        const kpis = await prisma.kPI.findMany({
            where: { versionId: version.id },
            select: {
                actual: true,
                target: true,
                bscPerspective: true,
                direction: true,
                warningThreshold: true,
                objective: { select: { perspective: true } }
            }
        });

        const perspScores = { FINANCIAL: [], CUSTOMER: [], INTERNAL_PROCESS: [], LEARNING_GROWTH: [] };

        kpis.forEach(kpi => {
            const perspective = kpi.bscPerspective || kpi.objective?.perspective;
            if (!perspective || !perspScores[perspective]) return;
            if (kpi.actual == null || kpi.target == null || kpi.target === 0) return;

            let achievement;
            if (kpi.direction === 'LOWER_IS_BETTER') {
                achievement = kpi.actual === 0 ? 100 : Math.min((kpi.target / kpi.actual) * 100, 150);
            } else {
                achievement = Math.min((kpi.actual / kpi.target) * 100, 150);
            }
            perspScores[perspective].push(achievement);
        });

        const avg = (arr) => arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length * 100) / 100 : 0;

        const scores = {
            fin: avg(perspScores.FINANCIAL),
            cust: avg(perspScores.CUSTOMER),
            ops: avg(perspScores.INTERNAL_PROCESS),
            growth: avg(perspScores.LEARNING_GROWTH)
        };

        const compliance = Math.round((scores.fin + scores.cust + scores.ops + scores.growth) / 4 * 100) / 100;

        res.json({ ...scores, compliance });

    } catch (error) {
        console.error('[exec-api] bsc/score error:', error.message);
        res.status(500).json({ error: 'Failed to calculate BSC scores' });
    }
});


// ============================================================
// 3. GET /api/v1/profile/status
// Returns user profile + current strategic journey stage
// ============================================================
router.get('/profile/status', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { entityId, version } = await getActiveEntityAndVersion(req);

        // Get user name
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, systemRole: true }
        });

        if (!entityId || !version) {
            return res.json({
                name: user?.name || 'مستخدم جديد',
                currentStage: 1,
                level: 'NEW'
            });
        }

        // Determine current strategic maturity stage from data presence
        const versionId = version.id;
        const [
            deptCount,
            externalCount,
            assessmentCount,
            objectiveCount,
            riskCount,
            initiativeCount
        ] = await Promise.all([
            prisma.department.count({ where: { entityId } }),
            prisma.externalAnalysis.count({ where: { versionId } }),
            prisma.assessment.count({ where: { entityId } }),
            prisma.strategicObjective.count({ where: { versionId } }),
            prisma.strategicRisk.count({ where: { versionId } }),
            prisma.strategicInitiative.count({ where: { versionId } })
        ]);

        // Stage logic: 6 stages in order
        let currentStage = 1;
        if (deptCount > 0) currentStage = 2;         // Stage 1 done → move to 2
        if (externalCount > 0) currentStage = 3;      // Stage 2 done → move to 3
        if (assessmentCount > 0) currentStage = 4;    // Stage 3 done → move to 4
        if (objectiveCount > 0) currentStage = 5;     // Stage 4 done → move to 5
        if (riskCount > 0) currentStage = 6;          // Stage 5 done → move to 6
        if (initiativeCount > 0) currentStage = 6;    // Stage 6 (keep at 6 — final)

        // Determine entity level based on data maturity
        const totalDataPoints = deptCount + externalCount + assessmentCount + objectiveCount + riskCount + initiativeCount;
        let level = 'NEW';
        if (totalDataPoints > 50) level = 'ADVANCED';
        else if (totalDataPoints > 20) level = 'MEDIUM';
        else if (totalDataPoints > 5) level = 'BASIC';

        // Get membership role
        const membership = await prisma.member.findFirst({
            where: { userId, entityId },
            select: { role: true, departmentRole: true }
        });

        res.json({
            name: user?.name || 'مستخدم',
            email: user?.email,
            role: membership?.departmentRole || membership?.role || 'USER',
            currentStage,
            level,
            versionName: version.name || `v${version.versionNumber}`,
            versionStatus: version.status,
            dataPoints: totalDataPoints
        });

    } catch (error) {
        console.error('[exec-api] profile/status error:', error.message);
        res.status(500).json({ error: 'Failed to fetch profile status' });
    }
});


// ============================================================
// 4. GET /api/v1/alerts
// Returns recent strategic alerts for the entity
// ============================================================
router.get('/alerts', verifyToken, async (req, res) => {
    try {
        const { entityId } = await getActiveEntityAndVersion(req);
        if (!entityId) return res.json([]);

        const alerts = await prisma.strategicAlert.findMany({
            where: {
                entityId,
                isDismissed: false
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
                id: true,
                type: true,
                severity: true,
                title: true,
                message: true,
                referenceType: true,
                referenceId: true,
                isRead: true,
                createdAt: true
            }
        });

        // Transform to exec-dashboard format
        const result = alerts.map(a => ({
            id: a.id,
            type: a.severity === 'CRITICAL' ? 'CRITICAL' : a.severity === 'WARNING' ? 'WARNING' : 'INFO',
            title: a.title,
            msg: a.message || `${a.type} — ${a.referenceType || ''}`,
            color: a.severity === 'CRITICAL' ? 'rose' : a.severity === 'WARNING' ? 'amber' : 'emerald',
            isRead: a.isRead,
            referenceType: a.referenceType,
            referenceId: a.referenceId,
            createdAt: a.createdAt
        }));

        res.json(result);

    } catch (error) {
        console.error('[exec-api] alerts error:', error.message);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});


// ============================================================
// 5. GET /api/v1/activities
// Returns recent activity log for the entity
// ============================================================
router.get('/activities', verifyToken, async (req, res) => {
    try {
        const { entityId } = await getActiveEntityAndVersion(req);
        if (!entityId) return res.json([]);

        const activities = await prisma.activity.findMany({
            where: { entityId },
            orderBy: { createdAt: 'desc' },
            take: 15,
            select: {
                id: true,
                action: true,
                targetType: true,
                targetName: true,
                userName: true,
                userAvatar: true,
                createdAt: true
            }
        });

        // Transform to exec-dashboard format
        const result = activities.map(a => {
            const timeDiff = Date.now() - new Date(a.createdAt).getTime();
            const mins = Math.floor(timeDiff / 60000);
            const hours = Math.floor(mins / 60);
            const days = Math.floor(hours / 24);

            let time;
            if (days > 0) time = `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
            else if (hours > 0) time = `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
            else if (mins > 0) time = `منذ ${mins} ${mins === 1 ? 'دقيقة' : 'دقائق'}`;
            else time = 'الآن';

            // Build action description
            const actionMap = {
                'CREATED': 'أنشأ',
                'UPDATED': 'حدّث',
                'DELETED': 'حذف',
                'COMPLETED': 'أكمل',
                'COMMENTED': 'علّق على',
                'APPROVED': 'اعتمد',
                'REJECTED': 'رفض'
            };
            const actionVerb = actionMap[a.action] || a.action;
            const actionText = `${actionVerb} ${a.targetName || a.targetType || ''}`;

            return {
                id: a.id,
                user: a.userName || 'النظام',
                action: actionText,
                time,
                avatar: a.userAvatar
            };
        });

        res.json(result);

    } catch (error) {
        console.error('[exec-api] activities error:', error.message);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});


// ============================================================
// BONUS: POST /api/v1/profile/update-stage
// Save user's current journey stage (for roadmap persistence)
// ============================================================
router.post('/profile/update-stage', verifyToken, async (req, res) => {
    try {
        const { stage } = req.body;
        if (!stage || stage < 1 || stage > 6) {
            return res.status(400).json({ error: 'Stage must be between 1 and 6' });
        }

        const userId = req.user.id;
        const { entityId } = await getActiveEntityAndVersion(req);
        if (!entityId) return res.status(400).json({ error: 'No active entity' });

        // Log stage transition as activity
        await prisma.activity.create({
            data: {
                action: 'UPDATED',
                targetType: 'JOURNEY',
                targetId: entityId,
                targetName: `المرحلة ${stage}`,
                userId: userId,
                userName: req.user.name || 'مدير',
                entityId: entityId
            }
        });

        res.json({ success: true, stage });

    } catch (error) {
        console.error('[exec-api] update-stage error:', error.message);
        res.status(500).json({ error: 'Failed to update stage' });
    }
});


module.exports = router;
