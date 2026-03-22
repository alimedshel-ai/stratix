const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// SYNC ENGINE — ربط الأدوات الموجودة بـ CompanyAnalysis
// يسحب البيانات من الجداول الأصلية ويحسب التقدم تلقائياً
// ============================================================

/**
 * POST /api/sync/:versionId
 * مزامنة جميع الأدوات لنسخة استراتيجية معينة
 * يفحص الجداول الأصلية ويُنشئ/يُحدّث CompanyAnalysis تلقائياً
 */
router.post('/:versionId', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.params;

        // التحقق من وجود النسخة
        const version = await prisma.strategyVersion.findUnique({
            where: { id: versionId },
            include: { entity: { select: { id: true, legalName: true } } }
        });

        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }

        const results = {};

        // 1. SWOT — من AnalysisPoint (عبر Assessment)
        results.SWOT = await syncSWOT(versionId, version.entityId, req.user?.id);

        // 2. PESTEL — محفوظ الآن كـ Direct Tool في CompanyAnalysis
        results.PESTEL = await syncDirectTool(versionId, 'PESTEL', req.user?.id);

        // 3. PORTER — محفوظ الآن كـ Direct Tool في CompanyAnalysis
        results.PORTER = await syncDirectTool(versionId, 'PORTER', req.user?.id);

        // 4. ANSOFF — من StrategicChoice
        results.ANSOFF = await syncANSOFF(versionId, req.user?.id);

        // 5. BSC — من StrategicObjective
        results.BSC = await syncBSC(versionId, req.user?.id);

        // 6. أدوات بيانات مباشرة (محفوظة في CompanyAnalysis)
        results.CUSTOMER_JOURNEY = await syncDirectTool(versionId, 'CUSTOMER_JOURNEY', req.user?.id);
        results.VALUE_CHAIN = await syncDirectTool(versionId, 'VALUE_CHAIN', req.user?.id);
        results.CORE_COMPETENCY = await syncDirectTool(versionId, 'CORE_COMPETENCY', req.user?.id);

        res.json({
            message: 'Sync completed',
            version: { id: versionId, name: version.name },
            results
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Sync failed', details: error.message });
    }
});

/**
 * POST /api/sync/:versionId/:toolCode
 * مزامنة أداة واحدة فقط
 */
router.post('/:versionId/:toolCode', verifyToken, async (req, res) => {
    try {
        const { versionId, toolCode } = req.params;
        const code = toolCode.toUpperCase();

        const version = await prisma.strategyVersion.findUnique({
            where: { id: versionId },
            include: { entity: { select: { id: true } } }
        });

        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }

        let result;
        switch (code) {
            case 'SWOT':
                result = await syncSWOT(versionId, version.entityId, req.user?.id);
                break;
            case 'PESTEL':
            case 'PORTER':
            case 'CUSTOMER_JOURNEY':
            case 'VALUE_CHAIN':
            case 'CORE_COMPETENCY':
                result = await syncDirectTool(versionId, code, req.user?.id);
                break;
            case 'ANSOFF':
                result = await syncANSOFF(versionId, req.user?.id);
                break;
            case 'BSC':
                result = await syncBSC(versionId, req.user?.id);
                break;
            default:
                return res.status(400).json({ error: `Tool '${code}' does not support auto-sync` });
        }

        res.json({ toolCode: code, ...result });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Sync failed', details: error.message });
    }
});

/**
 * GET /api/sync/:versionId/status
 * حالة المزامنة — أي أدوات فيها بيانات وأيها فارغة
 */
router.get('/:versionId/status', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.params;

        const version = await prisma.strategyVersion.findUnique({
            where: { id: versionId },
            include: { entity: { select: { id: true } } }
        });

        if (!version) {
            return res.status(404).json({ error: 'Version not found' });
        }

        // جلب الإحصائيات من الجداول الأصلية مع معالجة الأخطاء الجزئية
        const [
            swotCount,
            ansoffCount,
            bscCount,
            directCounts
        ] = await Promise.all([
            prisma.analysisPoint.count({
                where: { assessment: { entityId: version.entityId } }
            }).catch(() => 0),
            prisma.strategicChoice.count({
                where: { versionId, choiceType: { not: null } }
            }).catch(() => 0),
            prisma.strategicObjective.count({
                where: { versionId, perspective: { not: null } }
            }).catch(() => 0),
            // جلب سجلات CompanyAnalysis لجميع الأدوات
            prisma.companyAnalysis.findMany({
                where: { versionId, toolCode: { in: ['SWOT', 'PESTEL', 'PORTER', 'ANSOFF', 'BSC', 'CUSTOMER_JOURNEY', 'VALUE_CHAIN', 'CORE_COMPETENCY'] } },
                select: { toolCode: true, data: true, progress: true, status: true, updatedAt: true }
            }).catch(() => [])
        ]);

        const directMap = {};
        directCounts.forEach(rec => { directMap[rec.toolCode] = rec; });

        function directToolHasData(toolCode) {
            const rec = directMap[toolCode];
            if (!rec?.data) return false;
            try {
                const parsed = typeof rec.data === 'string' ? JSON.parse(rec.data) : rec.data;
                return parsed && Object.keys(parsed).length > 0;
            } catch { return false; }
        }

        const tools = [
            {
                code: 'SWOT',
                sourceTable: 'AnalysisPoint',
                sourceCount: swotCount,
                hasData: swotCount > 0 || directToolHasData('SWOT'),
                synced: !!directMap.SWOT,
                status: directMap.SWOT?.status || 'NOT_SYNCED',
                progress: directMap.SWOT?.progress || 0,
                lastSync: directMap.SWOT?.updatedAt || null
            },
            {
                code: 'PESTEL',
                sourceTable: 'CompanyAnalysis (مباشر)',
                sourceCount: directToolHasData('PESTEL') ? 1 : 0,
                hasData: directToolHasData('PESTEL'),
                synced: !!directMap.PESTEL,
                status: directMap.PESTEL?.status || 'NOT_SYNCED',
                progress: directMap.PESTEL?.progress || 0,
                lastSync: directMap.PESTEL?.updatedAt || null
            },
            {
                code: 'PORTER',
                sourceTable: 'CompanyAnalysis (مباشر)',
                sourceCount: directToolHasData('PORTER') ? 1 : 0,
                hasData: directToolHasData('PORTER'),
                synced: !!directMap.PORTER,
                status: directMap.PORTER?.status || 'NOT_SYNCED',
                progress: directMap.PORTER?.progress || 0,
                lastSync: directMap.PORTER?.updatedAt || null
            },
            {
                code: 'ANSOFF',
                sourceTable: 'StrategicChoice',
                sourceCount: ansoffCount,
                hasData: ansoffCount > 0,
                synced: !!directMap.ANSOFF,
                status: directMap.ANSOFF?.status || 'NOT_SYNCED',
                progress: directMap.ANSOFF?.progress || 0,
                lastSync: directMap.ANSOFF?.updatedAt || null
            },
            {
                code: 'BSC',
                sourceTable: 'StrategicObjective',
                sourceCount: bscCount,
                hasData: bscCount > 0,
                synced: !!directMap.BSC,
                status: directMap.BSC?.status || 'NOT_SYNCED',
                progress: directMap.BSC?.progress || 0,
                lastSync: directMap.BSC?.updatedAt || null
            },
            {
                code: 'CUSTOMER_JOURNEY',
                sourceTable: 'CompanyAnalysis (مباشر)',
                sourceCount: directToolHasData('CUSTOMER_JOURNEY') ? 1 : 0,
                hasData: directToolHasData('CUSTOMER_JOURNEY'),
                synced: !!directMap.CUSTOMER_JOURNEY,
                status: directMap.CUSTOMER_JOURNEY?.status || 'NOT_SYNCED',
                progress: directMap.CUSTOMER_JOURNEY?.progress || 0,
                lastSync: directMap.CUSTOMER_JOURNEY?.updatedAt || null
            },
            {
                code: 'VALUE_CHAIN',
                sourceTable: 'CompanyAnalysis (مباشر)',
                sourceCount: directToolHasData('VALUE_CHAIN') ? 1 : 0,
                hasData: directToolHasData('VALUE_CHAIN'),
                synced: !!directMap.VALUE_CHAIN,
                status: directMap.VALUE_CHAIN?.status || 'NOT_SYNCED',
                progress: directMap.VALUE_CHAIN?.progress || 0,
                lastSync: directMap.VALUE_CHAIN?.updatedAt || null
            },
            {
                code: 'CORE_COMPETENCY',
                sourceTable: 'CompanyAnalysis (مباشر)',
                sourceCount: directToolHasData('CORE_COMPETENCY') ? 1 : 0,
                hasData: directToolHasData('CORE_COMPETENCY'),
                synced: !!directMap.CORE_COMPETENCY,
                status: directMap.CORE_COMPETENCY?.status || 'NOT_SYNCED',
                progress: directMap.CORE_COMPETENCY?.progress || 0,
                lastSync: directMap.CORE_COMPETENCY?.updatedAt || null
            }
        ];

        res.json({
            versionId,
            tools,
            summary: {
                withData: tools.filter(t => t.hasData).length,
                synced: tools.filter(t => t.synced).length,
                needsSync: tools.filter(t => t.hasData && !t.synced).length
            }
        });
    } catch (error) {
        console.error('Error fetching sync status:', error);
        res.status(500).json({ error: 'Failed to fetch sync status' });
    }
});


// ============ SYNC FUNCTIONS ============

async function syncSWOT(versionId, entityId, userId) {
    // SWOT data comes from AnalysisPoint table, linked through Assessment → Entity
    const points = await prisma.analysisPoint.findMany({
        where: { assessment: { entityId } },
        select: { type: true, title: true, description: true, impact: true }
    });

    if (points.length === 0) {
        return { status: 'NO_DATA', message: 'No SWOT data found', progress: 0 };
    }

    // Group by type
    const grouped = {
        strengths: points.filter(p => p.type === 'STRENGTH').map(p => ({
            title: p.title, description: p.description, impact: p.impact
        })),
        weaknesses: points.filter(p => p.type === 'WEAKNESS').map(p => ({
            title: p.title, description: p.description, impact: p.impact
        })),
        opportunities: points.filter(p => p.type === 'OPPORTUNITY').map(p => ({
            title: p.title, description: p.description, impact: p.impact
        })),
        threats: points.filter(p => p.type === 'THREAT').map(p => ({
            title: p.title, description: p.description, impact: p.impact
        }))
    };

    // Calculate progress (how many quadrants are filled)
    const filledQuadrants = ['strengths', 'weaknesses', 'opportunities', 'threats']
        .filter(q => grouped[q].length > 0).length;
    const progress = Math.round((filledQuadrants / 4) * 100);
    const status = progress === 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'DRAFT';

    // Generate summary
    const summary = `S:${grouped.strengths.length} W:${grouped.weaknesses.length} O:${grouped.opportunities.length} T:${grouped.threats.length} — إجمالي ${points.length} نقطة`;

    return await upsertAnalysis(versionId, 'SWOT', grouped, progress, status, summary, userId);
}

async function syncPESTEL(versionId, userId) {
    const PESTEL_TYPES = ['POLITICAL', 'ECONOMIC', 'SOCIAL', 'TECHNOLOGICAL', 'ENVIRONMENTAL', 'LEGAL'];

    const analyses = await prisma.externalAnalysis.findMany({
        where: { versionId, type: { in: PESTEL_TYPES } },
        select: { type: true, factor: true, impact: true, probability: true, trend: true, notes: true }
    });

    if (analyses.length === 0) {
        return { status: 'NO_DATA', message: 'No PESTEL data found', progress: 0 };
    }

    const grouped = {};
    PESTEL_TYPES.forEach(type => {
        grouped[type.toLowerCase()] = analyses
            .filter(a => a.type === type)
            .map(a => ({ factor: a.factor, impact: a.impact, probability: a.probability, trend: a.trend, notes: a.notes }));
    });

    const filledSections = PESTEL_TYPES.filter(t => grouped[t.toLowerCase()].length > 0).length;
    const progress = Math.round((filledSections / 6) * 100);
    const status = progress === 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'DRAFT';

    const summary = PESTEL_TYPES.map(t => `${t[0]}:${grouped[t.toLowerCase()].length}`).join(' ') + ` — إجمالي ${analyses.length} عامل`;

    return await upsertAnalysis(versionId, 'PESTEL', grouped, progress, status, summary, userId);
}

async function syncPORTER(versionId, userId) {
    const PORTER_TYPES = ['PORTER_RIVALRY', 'PORTER_NEW_ENTRANTS', 'PORTER_SUBSTITUTES', 'PORTER_SUPPLIERS', 'PORTER_BUYERS'];
    const PORTER_KEYS = ['rivalry', 'newEntrants', 'substitutes', 'supplierPower', 'buyerPower'];

    const analyses = await prisma.externalAnalysis.findMany({
        where: { versionId, type: { in: PORTER_TYPES } },
        select: { type: true, factor: true, impact: true, probability: true, notes: true }
    });

    if (analyses.length === 0) {
        return { status: 'NO_DATA', message: 'No Porter data found', progress: 0 };
    }

    const grouped = {};
    PORTER_TYPES.forEach((type, i) => {
        const items = analyses.filter(a => a.type === type);
        grouped[PORTER_KEYS[i]] = {
            factors: items.map(a => ({ factor: a.factor, impact: a.impact, probability: a.probability, notes: a.notes })),
            count: items.length,
            // Convert impact to numeric score for visualization
            avgScore: items.length > 0 ?
                items.reduce((sum, a) => sum + impactToScore(a.impact), 0) / items.length : 0
        };
    });

    const filledForces = PORTER_KEYS.filter(k => grouped[k].count > 0).length;
    const progress = Math.round((filledForces / 5) * 100);
    const status = progress === 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'DRAFT';

    const avgScore = PORTER_KEYS.reduce((sum, k) => sum + grouped[k].avgScore, 0) / 5;
    const summary = `${filledForces}/5 قوى مغطاة — متوسط الشدة: ${avgScore.toFixed(1)}/5 — إجمالي ${analyses.length} عامل`;

    return await upsertAnalysis(versionId, 'PORTER', grouped, progress, status, summary, userId);
}

async function syncANSOFF(versionId, userId) {
    const choices = await prisma.strategicChoice.findMany({
        where: { versionId, choiceType: { not: null } },
        select: {
            choiceType: true, title: true, description: true, status: true,
            priority: true, marketAttractiveness: true, competitiveAdvantage: true,
            feasibility: true, isSelected: true
        }
    });

    if (choices.length === 0) {
        return { status: 'NO_DATA', message: 'No Ansoff data found', progress: 0 };
    }

    const QUADRANTS = {
        'MARKET_PENETRATION': 'marketPenetration',
        'PRODUCT_DEVELOPMENT': 'productDevelopment',
        'MARKET_DEVELOPMENT': 'marketDevelopment',
        'DIVERSIFICATION': 'diversification'
    };

    const grouped = {
        marketPenetration: [],
        productDevelopment: [],
        marketDevelopment: [],
        diversification: [],
        other: [] // for choices that don't fit Ansoff quadrants
    };

    choices.forEach(c => {
        const key = QUADRANTS[c.choiceType] || 'other';
        grouped[key].push({
            title: c.title,
            description: c.description,
            status: c.status,
            priority: c.priority,
            isSelected: c.isSelected,
            scores: {
                marketAttractiveness: c.marketAttractiveness,
                competitiveAdvantage: c.competitiveAdvantage,
                feasibility: c.feasibility
            }
        });
    });

    const ansoffKeys = Object.keys(QUADRANTS).map(k => QUADRANTS[k]);
    const filledQuadrants = ansoffKeys.filter(k => grouped[k].length > 0).length;
    const progress = Math.round((filledQuadrants / 4) * 100);
    const status = progress === 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'DRAFT';

    const selected = choices.filter(c => c.isSelected).length;
    const summary = `${filledQuadrants}/4 ربع مغطى — ${choices.length} خيار (${selected} معتمد)`;

    return await upsertAnalysis(versionId, 'ANSOFF', grouped, progress, status, summary, userId);
}

async function syncBSC(versionId, userId) {
    const objectives = await prisma.strategicObjective.findMany({
        where: { versionId },
        include: {
            kpis: {
                select: { name: true, target: true, actual: true, status: true, unit: true }
            }
        }
    });

    if (objectives.length === 0) {
        return { status: 'NO_DATA', message: 'No BSC data found', progress: 0 };
    }

    const PERSPECTIVES = ['FINANCIAL', 'CUSTOMER', 'INTERNAL_PROCESS', 'LEARNING_GROWTH'];

    const grouped = {};
    PERSPECTIVES.forEach(p => {
        grouped[p.toLowerCase()] = objectives
            .filter(o => o.perspective === p)
            .map(o => ({
                title: o.title,
                description: o.description,
                status: o.status,
                weight: o.weight,
                targetValue: o.targetValue,
                kpis: o.kpis.map(k => ({
                    name: k.name, target: k.target, actual: k.actual,
                    status: k.status, unit: k.unit,
                    achievement: k.target > 0 ? Math.round((k.actual || 0) / k.target * 100) : 0
                }))
            }));
    });

    // Also capture objectives without perspective (OKR style)
    const unclassified = objectives.filter(o => !o.perspective || !PERSPECTIVES.includes(o.perspective));
    if (unclassified.length > 0) {
        grouped.unclassified = unclassified.map(o => ({
            title: o.title, description: o.description, status: o.status,
            kpis: o.kpis.map(k => ({ name: k.name, target: k.target, actual: k.actual, status: k.status }))
        }));
    }

    const filledPerspectives = PERSPECTIVES.filter(p => grouped[p.toLowerCase()].length > 0).length;
    const totalObjectives = objectives.length;
    const totalKPIs = objectives.reduce((sum, o) => sum + o.kpis.length, 0);

    // Progress: based on perspectives coverage + KPI completion
    const perspectiveProgress = Math.round((filledPerspectives / 4) * 50); // 50% weight
    const kpiProgress = totalKPIs > 0 ?
        Math.round(objectives.reduce((sum, o) =>
            sum + o.kpis.reduce((kSum, k) =>
                kSum + (k.target > 0 ? Math.min((k.actual || 0) / k.target, 1) : 0), 0), 0
        ) / totalKPIs * 50) : 0; // 50% weight

    const progress = Math.min(perspectiveProgress + kpiProgress, 100);
    const status = progress >= 80 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'DRAFT';

    // Score: average KPI achievement
    const score = totalKPIs > 0 ?
        Math.round(objectives.reduce((sum, o) =>
            sum + o.kpis.reduce((kSum, k) =>
                kSum + (k.target > 0 ? Math.min((k.actual || 0) / k.target * 100, 100) : 0), 0), 0
        ) / totalKPIs) : null;

    const summary = `${filledPerspectives}/4 محاور — ${totalObjectives} هدف — ${totalKPIs} مؤشر — الأداء: ${score || 0}%`;

    return await upsertAnalysis(versionId, 'BSC', grouped, progress, status, summary, userId, score);
}

/**
 * syncDirectTool — للأدوات اللي بياناتها محفوظة مباشرة في CompanyAnalysis
 * مثل: CUSTOMER_JOURNEY, VALUE_CHAIN, CORE_COMPETENCY
 * المزامنة هنا = التحقق من وجود بيانات وتحديث الحالة
 */
async function syncDirectTool(versionId, toolCode, userId) {
    // Check if data already exists in CompanyAnalysis
    const existing = await prisma.companyAnalysis.findUnique({
        where: { versionId_toolCode: { versionId, toolCode } }
    });

    if (!existing) {
        return { status: 'NO_DATA', message: `لا توجد بيانات لـ ${toolCode}`, progress: 0 };
    }

    // Parse existing data to calculate progress
    let data = {};
    try {
        data = typeof existing.data === 'string' ? JSON.parse(existing.data) : (existing.data || {});
    } catch { data = {}; }

    const keys = Object.keys(data);
    const filledKeys = keys.filter(k => {
        const val = data[k];
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'object' && val !== null) return Object.keys(val).length > 0;
        if (typeof val === 'string') return val.trim().length > 0;
        return val !== null && val !== undefined;
    });

    let totalSections = keys.length;
    if (toolCode === 'PESTEL') totalSections = 6;
    if (toolCode === 'PORTER') totalSections = 5;
    if (toolCode === 'VALUE_CHAIN') totalSections = 9; // ✅ 5 أساسية + 4 داعمة

    const progress = keys.length > 0 ? Math.round((filledKeys.length / Math.max(totalSections, 1)) * 100) : (existing.progress || 0);
    const status = progress >= 80 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'DRAFT';

    // Count items for summary
    const TOOL_NAMES = {
        CUSTOMER_JOURNEY: 'خريطة رحلة العميل',
        VALUE_CHAIN: 'سلسلة القيمة',
        CORE_COMPETENCY: 'القدرات الجوهرية'
    };
    const summary = `${TOOL_NAMES[toolCode] || toolCode} — ${filledKeys.length}/${keys.length} أقسام مكتملة`;

    // Update status and progress
    await prisma.companyAnalysis.update({
        where: { id: existing.id },
        data: { progress, status, summary, updatedBy: userId }
    });

    return { status: 'SYNCED', id: existing.id, progress, analysisStatus: status, summary };
}


// ============ HELPER FUNCTIONS ============

async function upsertAnalysis(versionId, toolCode, data, progress, status, summary, userId, score = null) {
    // Find the tool
    const tool = await prisma.toolDefinition.findUnique({ where: { code: toolCode } });
    if (!tool) {
        return { status: 'ERROR', message: `Tool '${toolCode}' not found in ToolDefinition` };
    }

    const existing = await prisma.companyAnalysis.findUnique({
        where: { versionId_toolCode: { versionId, toolCode } }
    });

    const dataStr = JSON.stringify(data);
    const now = new Date();

    if (existing) {
        const updated = await prisma.companyAnalysis.update({
            where: { id: existing.id },
            data: {
                data: dataStr,
                progress,
                status,
                summary,
                score,
                updatedBy: userId,
                completedAt: status === 'COMPLETED' ? now : existing.completedAt
            }
        });
        return { status: 'UPDATED', id: updated.id, progress, analysisStatus: status, summary };
    } else {
        const created = await prisma.companyAnalysis.create({
            data: {
                versionId,
                toolId: tool.id,
                toolCode,
                data: dataStr,
                progress,
                status,
                summary,
                score,
                createdBy: userId,
                completedAt: status === 'COMPLETED' ? now : null
            }
        });
        return { status: 'CREATED', id: created.id, progress, analysisStatus: status, summary };
    }
}

function impactToScore(impact) {
    switch (impact?.toUpperCase()) {
        case 'HIGH': return 5;
        case 'MEDIUM': return 3;
        case 'LOW': return 1;
        default: return 3;
    }
}

module.exports = router;
