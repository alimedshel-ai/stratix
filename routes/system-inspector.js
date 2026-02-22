const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// مفتش النظام الاستراتيجي — System Inspector
// يفحص الـ 15 منهجية ويقارن الوضع الفعلي بالمطلوب
// ============================================================

// الـ 15 منهجية مع متطلبات الفحص
const METHODOLOGIES = [
    {
        id: 1, level: 'strategic',
        name: 'إدارة التقييمات', nameEn: 'Evaluation Management',
        technique: 'Closed Loop', page: '/assessments',
        checks: ['assessments', 'analysisPoints']
    },
    {
        id: 2, level: 'strategic',
        name: 'ربط القطاعات بالاستراتيجيات', nameEn: 'Sector-Strategy Linkage',
        technique: 'ISIC + GIS', page: '/entities',
        checks: ['sectors', 'entities', 'entityVersionLink']
    },
    {
        id: 3, level: 'strategic',
        name: 'مصفوفة الأولويات', nameEn: 'Priority Matrix',
        technique: 'MCDA', page: '/priority-matrix',
        checks: ['priorityEvaluations']
    },
    {
        id: 4, level: 'strategic',
        name: 'منطق الربط — الخيط الذهبي', nameEn: 'Golden Thread',
        technique: 'Strategy Architecture', page: '/strategy-map',
        checks: ['causalLinks', 'objectiveKpiLink', 'kpiInitiativeLink']
    },
    {
        id: 5, level: 'strategic',
        name: 'إدارة المخاطر الاستراتيجية', nameEn: 'Strategic Risk Management',
        technique: 'Monte Carlo', page: '/choices',
        checks: ['risks', 'riskMitigation']
    },
    {
        id: 6, level: 'strategic',
        name: 'التشخيص التنظيمي', nameEn: 'Organizational Diagnosis',
        technique: 'McKinsey 7S + SWOT', page: '/analysis',
        checks: ['swotPoints', 'pestelPoints', 'porterPoints']
    },
    {
        id: 7, level: 'tactical',
        name: 'من الألم للوضوح', nameEn: 'Pain to Clarity',
        technique: 'Root Cause Analysis', page: '/tools',
        checks: ['strategicPipeline']
    },
    {
        id: 8, level: 'tactical',
        name: 'الأنماط الستة', nameEn: 'Six Patterns',
        technique: 'Clustering', page: '/patterns',
        checks: ['notBuilt']
    },
    {
        id: 9, level: 'tactical',
        name: 'بناء المنتج', nameEn: 'MVP Building',
        technique: 'Digital Twins', page: '/mvp',
        checks: ['notBuilt']
    },
    {
        id: 10, level: 'tactical',
        name: 'هيكل التسعير الثلاثي', nameEn: 'Triple Pricing',
        technique: 'Simulation Model', page: '/pricing',
        checks: ['notBuilt']
    },
    {
        id: 11, level: 'tactical',
        name: 'الضمان القابل للقياس', nameEn: 'Measurable Guarantee',
        technique: 'Evidence-Based', page: '/evidence',
        checks: ['notBuilt']
    },
    {
        id: 12, level: 'tactical',
        name: 'المواءمة والتنزيل', nameEn: 'Cascading Alignment',
        technique: 'Auto-Cascade', page: '/objectives',
        checks: ['objectiveCascade', 'okrs']
    },
    {
        id: 13, level: 'tactical',
        name: 'إدارة التغيير المؤسسي', nameEn: 'Change Management',
        technique: 'Change Readiness', page: '/change',
        checks: ['notBuilt']
    },
    {
        id: 14, level: 'tactical',
        name: 'الموازنة المبنية على الأداء', nameEn: 'Performance-Based Budget',
        technique: 'ERP Integration', page: '/financial',
        checks: ['financialDecisions', 'financialKpiLink']
    },
    {
        id: 15, level: 'operational',
        name: 'بناء المسار — دورة 14 يوم', nameEn: 'Sprint Cycle',
        technique: 'Kanban + Reviews', page: '/initiatives',
        checks: ['initiatives', 'reviews', 'reviewDecisions']
    }
];

// ============================================================
// GET /api/inspector/scan — فحص شامل للنظام
// ============================================================
router.get('/scan', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.query;

        // ========== جمع البيانات الخام ==========
        const whereEntity = entityId ? { entityId } : {};

        const [
            entities, sectors, versions,
            objectives, kpis, initiatives,
            reviews, choices, risks,
            assessments, analysisPoints,
            causalLinks, financialDecisions,
            auditLogs, alerts, towsStrategies,
            directions
        ] = await Promise.all([
            prisma.entity.count(),
            prisma.sector.count(),
            prisma.strategyVersion.findMany({
                where: entityId ? { entityId } : {},
                select: { id: true, name: true, entityId: true, isActive: true, status: true }
            }),
            prisma.strategicObjective.findMany({
                where: entityId ? { version: { entityId } } : {},
                select: { id: true, versionId: true, parentId: true, perspective: true }
            }),
            prisma.kPI.findMany({
                where: entityId ? { version: { entityId } } : {},
                select: { id: true, versionId: true, objectiveId: true, actual: true, target: true, name: true }
            }),
            prisma.strategicInitiative.findMany({
                where: entityId ? { version: { entityId } } : {},
                select: { id: true, versionId: true, status: true, progress: true, endDate: true, kpiId: true, title: true }
            }),
            prisma.strategicReview.findMany({
                where: entityId ? { version: { entityId } } : {},
                select: { id: true, status: true, decision: true, overallScore: true, createdAt: true }
            }),
            prisma.strategicChoice.findMany({
                where: entityId ? { version: { entityId } } : {},
                select: { id: true, status: true, title: true }
            }),
            prisma.strategicRisk.findMany({
                where: entityId ? { version: { entityId } } : {},
                select: { id: true, status: true, mitigation: true, riskScore: true, probabilityScore: true, impactScore: true }
            }),
            prisma.assessment.findMany({
                where: entityId ? { entityId } : {},
                select: { id: true, status: true, entityId: true }
            }),
            prisma.analysisPoint.findMany({
                where: entityId ? { assessment: { entityId } } : {},
                select: { id: true, type: true, impact: true, assessmentId: true }
            }),
            // DISABLED models — return 0
            Promise.resolve(0), // causalLinks
            Promise.resolve(0), // financialDecisions
            prisma.auditLog.count(),
            prisma.strategicAlert.count({ where: { isDismissed: false } }),
            Promise.resolve(0), // towsStrategies
            prisma.strategicDirection.count({ where: entityId ? { version: { entityId } } : {} }),
        ]);

        // ========== تحليل كل منهجية ==========
        const results = [];

        // --- 1. إدارة التقييمات ---
        const completedAssessments = assessments.filter(a => a.status === 'COMPLETED').length;
        const assessmentScore = assessments.length > 0
            ? Math.round((completedAssessments / assessments.length) * 100) : 0;
        results.push({
            ...METHODOLOGIES[0],
            score: assessmentScore,
            status: assessments.length === 0 ? 'empty' : assessmentScore >= 70 ? 'healthy' : assessmentScore >= 30 ? 'warning' : 'critical',
            metrics: {
                total: assessments.length,
                completed: completedAssessments,
                analysisPoints: analysisPoints.length
            },
            issues: [
                ...(assessments.length === 0 ? ['لا توجد تقييمات — أنشئ تقييم أول'] : []),
                ...(completedAssessments === 0 && assessments.length > 0 ? ['لا يوجد تقييم مكتمل — أكمل تقييم واحد على الأقل'] : []),
                ...(analysisPoints.length === 0 && assessments.length > 0 ? ['لا توجد نقاط تحليل (SWOT) — أضف نقاط قوة وضعف'] : []),
            ],
            action: assessments.length === 0 ? 'أنشئ تقييم جديد من صفحة التقييمات' : 'أكمل التقييمات المفتوحة'
        });

        // --- 2. ربط القطاعات ---
        const entitiesWithVersion = versions.length;
        const sectorScore = (entities > 0 && sectors > 0 && entitiesWithVersion > 0)
            ? Math.min(100, Math.round(((sectors > 0 ? 33 : 0) + (entities > 0 ? 33 : 0) + (entitiesWithVersion > 0 ? 34 : 0)))) : 0;
        results.push({
            ...METHODOLOGIES[1],
            score: sectorScore,
            status: sectorScore >= 70 ? 'healthy' : sectorScore >= 30 ? 'warning' : 'critical',
            metrics: {
                sectors: sectors,
                entities: entities,
                versionsLinked: entitiesWithVersion
            },
            issues: [
                ...(sectors === 0 ? ['لا توجد قطاعات — أضف القطاعات الأساسية'] : []),
                ...(entities === 0 ? ['لا توجد كيانات — أضف كيان واحد على الأقل'] : []),
                ...(entitiesWithVersion === 0 ? ['لا توجد استراتيجيات مربوطة بكيانات'] : []),
            ],
            action: 'تأكد أن كل كيان مربوط بقطاع وله نسخة استراتيجية'
        });

        // --- 3. مصفوفة الأولويات ---
        // Check audit logs for MCDA evaluations
        const mcdaEvals = await prisma.auditLog.count({
            where: { action: 'PRIORITY_EVALUATION' }
        });
        const totalItems = initiatives.length + choices.length;
        const mcdaScore = totalItems > 0 ? Math.round((mcdaEvals / totalItems) * 100) : 0;
        results.push({
            ...METHODOLOGIES[2],
            score: Math.min(mcdaScore, 100),
            status: totalItems === 0 ? 'empty' : mcdaScore >= 70 ? 'healthy' : mcdaScore >= 30 ? 'warning' : 'critical',
            metrics: {
                totalItems: totalItems,
                evaluated: mcdaEvals,
                pending: Math.max(0, totalItems - mcdaEvals)
            },
            issues: [
                ...(totalItems === 0 ? ['لا توجد مبادرات أو خيارات لتقييمها'] : []),
                ...(mcdaEvals === 0 && totalItems > 0 ? [`${totalItems} عنصر بانتظار التقييم — افتح مصفوفة الأولويات`] : []),
            ],
            action: 'قيّم جميع المبادرات والخيارات في مصفوفة الأولويات'
        });

        // --- 4. الخيط الذهبي (أهم فحص) ---
        const orphanKpis = kpis.filter(k => !k.objectiveId).length;
        // Initiatives link to KPIs, not directly to objectives. An orphan initiative has no kpiId.
        const orphanInitiatives = initiatives.filter(i => !i.kpiId).length;
        const kpisWithoutActual = kpis.filter(k => k.actual == null || k.target == null).length;

        let goldenThreadScore = 0;
        if (objectives.length > 0) goldenThreadScore += 20;
        if (kpis.length > 0 && orphanKpis === 0) goldenThreadScore += 20;
        else if (kpis.length > 0) goldenThreadScore += 10;
        if (initiatives.length > 0 && orphanInitiatives === 0) goldenThreadScore += 20;
        else if (initiatives.length > 0) goldenThreadScore += 10;
        if (causalLinks > 0) goldenThreadScore += 20;
        if (kpisWithoutActual === 0 && kpis.length > 0) goldenThreadScore += 20;
        else if (kpisWithoutActual < kpis.length) goldenThreadScore += 10;

        results.push({
            ...METHODOLOGIES[3],
            score: goldenThreadScore,
            status: goldenThreadScore >= 70 ? 'healthy' : goldenThreadScore >= 40 ? 'warning' : 'critical',
            metrics: {
                objectives: objectives.length,
                kpis: kpis.length,
                initiatives: initiatives.length,
                causalLinks: causalLinks,
                orphanKpis: orphanKpis,
                orphanInitiatives: orphanInitiatives,
                kpisWithoutData: kpisWithoutActual
            },
            issues: [
                ...(objectives.length === 0 ? ['⛔ لا توجد أهداف استراتيجية — الخيط الذهبي مقطوع'] : []),
                ...(orphanKpis > 0 ? [`⚠️ ${orphanKpis} مؤشر أداء يتيم (غير مربوط بهدف)`] : []),
                ...(orphanInitiatives > 0 ? [`⚠️ ${orphanInitiatives} مبادرة يتيمة (غير مربوطة بمؤشر أداء)`] : []),
                ...(causalLinks === 0 && objectives.length > 1 ? ['لا توجد روابط سببية بين الأهداف — الخريطة الاستراتيجية فارغة'] : []),
                ...(kpisWithoutActual > 0 ? [`${kpisWithoutActual} مؤشر بدون قيمة فعلية — أدخل البيانات`] : []),
            ],
            action: orphanKpis > 0 || orphanInitiatives > 0
                ? 'اربط العناصر اليتيمة بأهدافها من صفحة الأهداف'
                : 'أضف روابط سببية في الخريطة الاستراتيجية'
        });

        // --- 5. إدارة المخاطر ---
        const mitigatedRisks = risks.filter(r => r.status === 'MITIGATED' || r.status === 'CLOSED').length;
        const risksWithoutMitigation = risks.filter(r => !r.mitigation || r.mitigation.trim() === '').length;
        const highRisks = risks.filter(r => {
            const score = r.riskScore || ((r.probabilityScore || 3) * (r.impactScore || 3));
            return score >= 15;
        }).length;
        const riskScore = risks.length > 0
            ? Math.round(((mitigatedRisks / risks.length) * 50) + ((risks.length - risksWithoutMitigation) / risks.length * 30) + (highRisks === 0 ? 20 : 0))
            : (choices.length > 0 ? 30 : 0); // choices exist but no risks = partial

        results.push({
            ...METHODOLOGIES[4],
            score: riskScore,
            status: risks.length === 0 ? (choices.length > 0 ? 'warning' : 'empty') : riskScore >= 70 ? 'healthy' : riskScore >= 40 ? 'warning' : 'critical',
            metrics: {
                totalRisks: risks.length,
                mitigated: mitigatedRisks,
                withoutPlan: risksWithoutMitigation,
                highRisks: highRisks
            },
            issues: [
                ...(risks.length === 0 && choices.length > 0 ? ['خيارات استراتيجية بدون مخاطر — أضف مخاطر محتملة'] : []),
                ...(risksWithoutMitigation > 0 ? [`${risksWithoutMitigation} خطر بدون خطة احتواء`] : []),
                ...(highRisks > 0 ? [`⛔ ${highRisks} خطر عالي يحتاج تدخل فوري`] : []),
            ],
            action: risksWithoutMitigation > 0 ? 'أضف خطط احتواء للمخاطر المكشوفة' : 'راجع سجل المخاطر دورياً'
        });

        // --- 6. التشخيص التنظيمي ---
        const strengths = analysisPoints.filter(p => p.type === 'STRENGTH').length;
        const weaknesses = analysisPoints.filter(p => p.type === 'WEAKNESS').length;
        const opportunities = analysisPoints.filter(p => p.type === 'OPPORTUNITY').length;
        const threats = analysisPoints.filter(p => p.type === 'THREAT').length;
        const hasSWOT = strengths > 0 && weaknesses > 0 && opportunities > 0 && threats > 0;
        const diagScore = hasSWOT ? 80 : (analysisPoints.length > 0 ? 50 : 0);
        // Add TOWS bonus
        const finalDiagScore = Math.min(100, diagScore + (towsStrategies > 0 ? 20 : 0));

        results.push({
            ...METHODOLOGIES[5],
            score: finalDiagScore,
            status: finalDiagScore >= 70 ? 'healthy' : finalDiagScore >= 30 ? 'warning' : 'critical',
            metrics: {
                strengths, weaknesses, opportunities, threats,
                totalPoints: analysisPoints.length,
                towsStrategies: towsStrategies
            },
            issues: [
                ...(analysisPoints.length === 0 ? ['لا يوجد تحليل — ابدأ بتحليل SWOT'] : []),
                ...(!hasSWOT && analysisPoints.length > 0 ? ['تحليل SWOT غير مكتمل — تنقصك بعض الأبعاد'] : []),
                ...(strengths === 0 ? ['لم تُحدد نقاط القوة'] : []),
                ...(weaknesses === 0 ? ['لم تُحدد نقاط الضعف'] : []),
                ...(towsStrategies === 0 && hasSWOT ? ['تحليل SWOT مكتمل لكن بدون استراتيجيات TOWS — ولّد استراتيجيات'] : []),
            ],
            action: !hasSWOT ? 'أكمل تحليل SWOT من صفحة التحليل' : 'ولّد استراتيجيات TOWS من الأدوات المتقدمة'
        });

        // --- 7. من الألم للوضوح ---
        results.push({
            ...METHODOLOGIES[6],
            score: versions.length > 0 ? 70 : 0,
            status: versions.length > 0 ? 'healthy' : 'empty',
            metrics: { strategicPipeline: versions.length, directions: directions },
            issues: versions.length === 0 ? ['لم يبدأ المسار الاستراتيجي — استخدم أداة المسار'] : [],
            action: 'استخدم صفحة الأدوات لبدء المسار الاستراتيجي خطوة بخطوة'
        });

        // --- 8-11, 13: منهجيات لم تُبنى بعد ---
        [7, 8, 9, 10, 12].forEach(idx => {
            results.push({
                ...METHODOLOGIES[idx],
                score: 0,
                status: 'not_built',
                metrics: {},
                issues: ['هذه المنهجية لم تُبنى بعد في النظام'],
                action: 'مخطط لها في المراحل القادمة'
            });
        });

        // --- 12. المواءمة والتنزيل ---
        const hierarchicalObj = objectives.filter(o => o.parentId != null).length;
        const cascadeScore = objectives.length > 0
            ? Math.round(((hierarchicalObj / Math.max(objectives.length - 1, 1)) * 50) + (kpis.length > 0 ? 25 : 0) + (objectives.filter(o => o.perspective).length > 0 ? 25 : 0))
            : 0;
        results.push({
            ...METHODOLOGIES[11],
            score: Math.min(cascadeScore, 100),
            status: cascadeScore >= 70 ? 'healthy' : cascadeScore >= 30 ? 'warning' : 'critical',
            metrics: {
                totalObjectives: objectives.length,
                hierarchical: hierarchicalObj,
                withPerspective: objectives.filter(o => o.perspective).length,
                kpisLinked: kpis.filter(k => k.objectiveId).length
            },
            issues: [
                ...(objectives.length === 0 ? ['لا توجد أهداف — لا يمكن التنزيل'] : []),
                ...(hierarchicalObj === 0 && objectives.length > 1 ? ['الأهداف غير متسلسلة — أضف أهداف فرعية'] : []),
                ...(objectives.filter(o => o.perspective).length === 0 ? ['لم تُحدد المنظورات (BSC) — صنّف الأهداف'] : []),
            ],
            action: 'اربط الأهداف بمنظورات BSC وأنشئ تسلسل هرمي'
        });

        // --- 14. الموازنة المبنية على الأداء ---
        const budgetScore = financialDecisions > 0 ? 60 : 0;
        results.push({
            ...METHODOLOGIES[13],
            score: budgetScore,
            status: budgetScore >= 60 ? 'warning' : financialDecisions > 0 ? 'warning' : 'empty',
            metrics: { financialDecisions, linkedToKpis: 0 },
            issues: [
                ...(financialDecisions === 0 ? ['لا توجد قرارات مالية مسجلة'] : []),
                ...(['الربط التقني بين الميزانية والأداء لم يكتمل بعد']),
            ],
            action: 'سجّل القرارات المالية واربطها بالمبادرات'
        });

        // --- 15. بناء المسار ---
        const completedInit = initiatives.filter(i => i.status === 'COMPLETED').length;
        const overdueInit = initiatives.filter(i => i.endDate && new Date(i.endDate) < new Date() && i.status !== 'COMPLETED').length;
        const completedReviews = reviews.filter(r => r.status === 'COMPLETED').length;
        const reviewsWithDecision = reviews.filter(r => r.decision && r.decision !== 'PENDING').length;

        let sprintScore = 0;
        if (initiatives.length > 0) sprintScore += 30;
        if (completedInit > 0) sprintScore += 20;
        if (reviews.length > 0) sprintScore += 20;
        if (reviewsWithDecision > 0) sprintScore += 15;
        if (overdueInit === 0 && initiatives.length > 0) sprintScore += 15;

        results.push({
            ...METHODOLOGIES[14],
            score: sprintScore,
            status: sprintScore >= 70 ? 'healthy' : sprintScore >= 30 ? 'warning' : 'critical',
            metrics: {
                totalInitiatives: initiatives.length,
                completed: completedInit,
                overdue: overdueInit,
                reviews: reviews.length,
                reviewsCompleted: completedReviews,
                decisionsSet: reviewsWithDecision
            },
            issues: [
                ...(initiatives.length === 0 ? ['لا توجد مبادرات — أنشئ مبادرة أولى'] : []),
                ...(overdueInit > 0 ? [`⛔ ${overdueInit} مبادرة متأخرة عن الموعد`] : []),
                ...(reviews.length === 0 && initiatives.length > 0 ? ['لا توجد مراجعات — جدول مراجعة دورية'] : []),
                ...(reviewsWithDecision === 0 && reviews.length > 0 ? ['مراجعات بدون قرارات — اتخذ قرار (استمر/عدّل/توقف)'] : []),
            ],
            action: overdueInit > 0 ? 'عالج المبادرات المتأخرة فوراً' : 'أنشئ دورة مراجعة كل 14 يوم'
        });

        // ========== الملخص العام ==========
        // Sort results by methodology ID
        results.sort((a, b) => a.id - b.id);

        const builtMethodologies = results.filter(r => r.status !== 'not_built');
        const avgScore = builtMethodologies.length > 0
            ? Math.round(builtMethodologies.reduce((sum, r) => sum + r.score, 0) / builtMethodologies.length) : 0;

        const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
        const criticalIssues = results.filter(r => r.status === 'critical').length;

        // Overall system level
        let systemLevel, systemMessage;
        if (avgScore >= 80) { systemLevel = 'EXCELLENT'; systemMessage = 'النظام الاستراتيجي متكامل — أداء ممتاز!'; }
        else if (avgScore >= 60) { systemLevel = 'GOOD'; systemMessage = 'النظام يعمل بشكل جيد مع فرص للتحسين'; }
        else if (avgScore >= 40) { systemLevel = 'DEVELOPING'; systemMessage = 'النظام في مرحلة البناء — واصل التطوير'; }
        else if (avgScore >= 20) { systemLevel = 'EARLY'; systemMessage = 'المراحل الأولى — ركّز على الأساسيات'; }
        else { systemLevel = 'STARTING'; systemMessage = 'النظام بحاجة لبناء المكونات الأساسية'; }

        res.json({
            overallScore: avgScore,
            systemLevel,
            systemMessage,
            summary: {
                totalMethodologies: 15,
                built: builtMethodologies.length,
                notBuilt: results.filter(r => r.status === 'not_built').length,
                healthy: results.filter(r => r.status === 'healthy').length,
                warning: results.filter(r => r.status === 'warning').length,
                critical: results.filter(r => r.status === 'critical').length,
                empty: results.filter(r => r.status === 'empty').length,
                totalIssues,
                criticalIssues
            },
            levels: {
                strategic: {
                    score: Math.round(results.filter(r => r.level === 'strategic').reduce((s, r) => s + r.score, 0) / 6),
                    methodologies: results.filter(r => r.level === 'strategic')
                },
                tactical: {
                    score: Math.round(results.filter(r => r.level === 'tactical').reduce((s, r) => s + r.score, 0) / 8),
                    methodologies: results.filter(r => r.level === 'tactical')
                },
                operational: {
                    score: Math.round(results.filter(r => r.level === 'operational').reduce((s, r) => s + r.score, 0) / 1),
                    methodologies: results.filter(r => r.level === 'operational')
                }
            },
            methodologies: results,
            scannedAt: new Date()
        });

    } catch (error) {
        console.error('Inspector scan error:', error);
        res.status(500).json({ error: 'Failed to run system inspection', details: error.message });
    }
});

// ============================================================
// GET /api/inspector/golden-thread — تتبع الخيط الذهبي تفصيلياً
// ============================================================
router.get('/golden-thread', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.query;
        if (!versionId) return res.status(400).json({ error: 'versionId مطلوب' });

        // Get full chain: Objectives → KPIs → Initiatives
        const objectives = await prisma.strategicObjective.findMany({
            where: { versionId },
            select: {
                id: true, name: true, perspective: true, parentId: true,
                kpis: {
                    select: {
                        id: true, name: true, actual: true, target: true,
                        warningThreshold: true, criticalThreshold: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        const initiatives = await prisma.strategicInitiative.findMany({
            where: { versionId },
            select: {
                id: true, title: true, status: true, progress: true,
                kpiId: true, endDate: true
            }
        });

        // causalLinks — DISABLED
        const causalLinks = [];

        // Build the thread — initiatives link via kpiId
        const thread = objectives.map(obj => {
            const objKpis = obj.kpis || [];
            const objKpiIds = objKpis.map(k => k.id);
            // Initiatives linked to this objective's KPIs
            const objInitiatives = initiatives.filter(i => i.kpiId && objKpiIds.includes(i.kpiId));
            const objLinks = causalLinks.filter(l => l.sourceId === obj.id || l.targetId === obj.id);

            const kpiStatus = objKpis.map(k => {
                if (k.actual == null || k.target == null) return 'no_data';
                const pct = (k.actual / k.target) * 100;
                if (k.criticalThreshold && pct <= k.criticalThreshold) return 'critical';
                if (k.warningThreshold && pct <= k.warningThreshold) return 'warning';
                return 'on_track';
            });

            return {
                objective: { id: obj.id, name: obj.name, perspective: obj.perspective, parentId: obj.parentId },
                kpis: objKpis.map((k, i) => ({
                    ...k,
                    achievement: k.target ? Math.round((k.actual || 0) / k.target * 100) : null,
                    status: kpiStatus[i]
                })),
                initiatives: objInitiatives.map(i => ({
                    ...i,
                    isOverdue: i.endDate && new Date(i.endDate) < new Date() && i.status !== 'COMPLETED'
                })),
                links: objLinks,
                isOrphan: objKpis.length === 0 && objInitiatives.length === 0,
                threadHealth: objKpis.length > 0 && objInitiatives.length > 0 ? 'connected'
                    : objKpis.length > 0 || objInitiatives.length > 0 ? 'partial' : 'broken'
            };
        });

        const connected = thread.filter(t => t.threadHealth === 'connected').length;
        const partial = thread.filter(t => t.threadHealth === 'partial').length;
        const broken = thread.filter(t => t.threadHealth === 'broken').length;

        res.json({
            versionId,
            totalObjectives: objectives.length,
            threadScore: objectives.length > 0 ? Math.round((connected * 100 + partial * 50) / objectives.length) : 0,
            summary: { connected, partial, broken },
            thread,
            causalLinksCount: causalLinks.length
        });

    } catch (error) {
        console.error('Golden thread error:', error);
        res.status(500).json({ error: 'Failed to analyze golden thread' });
    }
});

module.exports = router;
