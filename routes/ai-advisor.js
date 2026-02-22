/**
 * AI Advisor API — المستشار الذكي
 * يقرأ بيانات التقدم ومخرجات الأدوات ويقدّم اقتراحات سياقية ذكية
 *
 * 🧵 يطبق مبدأ "الخيط الذهبي":
 *   - كل أداة تُغذي التالية
 *   - AI يربط بينها ويقترح الخطوة المناسبة
 *   - لا قفز، لا تكرار، لا إجبار
 */
const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ═══════════════════════════════════════════
//  GET /api/ai-advisor/context
//  جلب اقتراحات المستشار الذكي حسب السياق الحالي
// ═══════════════════════════════════════════
router.get('/context', verifyToken, async (req, res) => {
    try {
        const { page, entityId } = req.query;
        const userId = req.user?.id;

        if (!entityId) {
            return res.json({ suggestions: [], nudge: null });
        }

        // === 0. جلب نوع المستخدم ===
        let userType = 'EXPLORER';
        if (userId) {
            try {
                const userRecord = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { userType: true }
                });
                userType = userRecord?.userType || 'EXPLORER';
            } catch (e) { /* fallback */ }
        }

        // === 1. جلب بيانات التقدم ===
        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            select: {
                id: true,
                legalName: true,
                displayName: true,
                size: true,
                industryId: true,
                sectorId: true,
                typeId: true,
                logoUrl: true,
                metadata: true,
            }
        });

        if (!entity) {
            return res.json({ suggestions: [], nudge: null });
        }

        // === 2. جلب البيانات الاستراتيجية ===
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

        // === 3. جلب الألم والطموح ===
        let painAmbitionData = null;
        try {
            if (entity.metadata && typeof entity.metadata === 'object') {
                painAmbitionData = entity.metadata.painAmbition || null;
            }
        } catch (e) { /* ignore */ }

        // === 4. جلب التحليلات المكتملة ===
        let completedTools = [];
        if (activeVersion) {
            const analyses = await prisma.companyAnalysis.findMany({
                where: { versionId: activeVersion.id },
                select: { toolCode: true, progress: true, updatedAt: true }
            });
            completedTools = analyses.map(a => ({
                code: a.toolCode,
                progress: a.progress || 0,
                updatedAt: a.updatedAt
            }));
        }

        // === 5. جلب التنبيهات الأخيرة ===
        const recentAlerts = await prisma.strategicAlert.findMany({
            where: { entityId, isDismissed: false, isRead: false },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { type: true, severity: true, title: true, message: true }
        });

        // === 6. حساب نتائج KPI ===
        let kpiSummary = { total: 0, onTrack: 0, warning: 0, critical: 0, achieved: 0 };
        if (activeVersion) {
            const kpis = await prisma.kPI.findMany({
                where: { versionId: activeVersion.id },
                select: { actual: true, target: true, status: true }
            });
            kpiSummary.total = kpis.length;
            kpis.forEach(kpi => {
                if (kpi.status === 'ACHIEVED') { kpiSummary.achieved++; return; }
                if (!kpi.actual || !kpi.target) return;
                const ratio = kpi.actual / kpi.target;
                if (ratio >= 0.9) kpiSummary.onTrack++;
                else if (ratio >= 0.5) kpiSummary.warning++;
                else kpiSummary.critical++;
            });
        }

        // === 7. جلب المبادرات المتأخرة ===
        let overdueInitiatives = 0;
        if (activeVersion) {
            const initiatives = await prisma.strategicInitiative.findMany({
                where: { versionId: activeVersion.id },
                select: { status: true, endDate: true }
            });
            overdueInitiatives = initiatives.filter(i =>
                i.endDate && new Date(i.endDate) < new Date() && i.status !== 'COMPLETED'
            ).length;
        }

        // === 8. حساب patternKey ===
        const patternKey = painAmbitionData?.patternKey || detectPattern(entity);

        // ═══════════════════════════════════════════
        //  🧠 بناء الاقتراحات الذكية
        // ═══════════════════════════════════════════
        const suggestions = [];
        let nudge = null;
        const counts = activeVersion?._count || {};

        // --- قواعد الخيط الذهبي ---

        // الخطوة 1: هل أكمل الألم والطموح؟
        if (!painAmbitionData) {
            suggestions.push({
                id: 'start-pain-ambition',
                type: 'START',
                priority: 100,
                icon: '💔',
                title: 'ابدأ رحلتك الاستراتيجية',
                message: 'حدد ألمك وطموحك أولاً — هذه الخطوة الأساسية التي تبني عليها كل شيء',
                action: { label: 'ابدأ الآن', href: '/pain-ambition.html' },
                estimatedTime: '5 دقائق',
            });
            nudge = {
                icon: '🚀',
                text: 'رحلتك تبدأ هنا — حدد ألمك وطموحك',
                href: '/pain-ambition.html'
            };
        }

        // الخطوة 2: أكمل الألم → أقترح التشخيص حسب النمط
        else if (!hasCompletedTool(completedTools, 'SWOT') && counts.objectives === 0) {
            const toolSuggestion = getToolByPattern(patternKey);
            suggestions.push({
                id: 'suggest-diagnosis',
                type: 'NEXT_STEP',
                priority: 90,
                icon: '🔍',
                title: `الخطوة التالية: ${toolSuggestion.label}`,
                message: toolSuggestion.reason,
                action: { label: `ابدأ ${toolSuggestion.label}`, href: toolSuggestion.href },
                estimatedTime: '10 دقائق',
                context: `بناءً على نمطك: ${getPatternLabel(patternKey)}`
            });
        }

        // الخطوة 3: أكمل SWOT → أقترح TOWS
        if (hasCompletedTool(completedTools, 'SWOT') && !hasCompletedTool(completedTools, 'TOWS')) {
            const swotTool = completedTools.find(t => t.code === 'SWOT');
            suggestions.push({
                id: 'suggest-tows',
                type: 'NEXT_STEP',
                priority: 85,
                icon: '🔄',
                title: 'حوّل تحليلك إلى استراتيجيات',
                message: 'لديك تحليل SWOT جاهز — استخدم مصفوفة TOWS لتوليد استراتيجيات من نقاط القوة والضعف',
                action: { label: 'ابدأ TOWS', href: '/tows.html' },
                estimatedTime: '10 دقائق',
                context: `SWOT مكتمل بنسبة ${swotTool?.progress || 100}%`
            });
        }

        // الخطوة 4: لا أهداف بعد → أقترح BSC/أهداف
        if (painAmbitionData && counts.objectives === 0 && (hasCompletedTool(completedTools, 'SWOT') || hasCompletedTool(completedTools, 'TOWS'))) {
            suggestions.push({
                id: 'suggest-objectives',
                type: 'NEXT_STEP',
                priority: 80,
                icon: '🎯',
                title: 'حان وقت تحديد الأهداف',
                message: 'تحليلاتك جاهزة — حدد أهدافك الاستراتيجية ومؤشرات الأداء',
                action: { label: 'حدد الأهداف', href: '/objectives.html' },
                estimatedTime: '15 دقيقة',
            });
        }

        // الخطوة 5: أهداف موجودة + KPIs ضعيفة → أقترح مبادرات
        if (kpiSummary.critical > 0 && counts.initiatives === 0) {
            suggestions.push({
                id: 'suggest-initiatives',
                type: 'WARNING',
                priority: 75,
                icon: '⚠️',
                title: `${kpiSummary.critical} مؤشرات في وضع حرج`,
                message: 'مؤشرات الأداء تحتاج مبادرات تصحيحية — أنشئ مبادرات لتحسين الأداء',
                action: { label: 'أنشئ مبادرة', href: '/initiatives.html' },
            });
        }

        // الخطوة 6: مبادرات متأخرة → أقترح مراجعة
        if (overdueInitiatives >= 2) {
            suggestions.push({
                id: 'overdue-review',
                type: 'ALERT',
                priority: 95,
                icon: '🔴',
                title: `${overdueInitiatives} مبادرات متأخرة`,
                message: 'لديك مبادرات تجاوزت موعدها — يُنصح بإجراء مراجعة دورية',
                action: { label: 'ابدأ المراجعة', href: '/reviews.html' },
            });
        }

        // --- اقتراحات سياقية حسب الصفحة ---
        if (page) {
            const pageNudge = getPageNudge(page, {
                patternKey, counts, kpiSummary,
                completedTools, overdueInitiatives, recentAlerts
            });
            if (pageNudge) {
                nudge = nudge || pageNudge;
            }
        }

        // ═══════════════════════════════════════════
        // 🛡️ قواعد المخاطر وأصحاب المصلحة
        // ═══════════════════════════════════════════
        if (activeVersion) {
            // جلب المخاطر
            let risks = [];
            try {
                risks = await prisma.strategicRisk.findMany({
                    where: { versionId: activeVersion.id },
                    include: { _count: { select: { stakeholders: true } } },
                    take: 100,
                });
            } catch (e) { /* ignore */ }

            // جلب أصحاب المصلحة
            let stakeholders = [];
            try {
                stakeholders = await prisma.stakeholder.findMany({
                    where: { entityId },
                    include: { _count: { select: { stakeholderRisks: true } } },
                    take: 100,
                });
            } catch (e) { /* ignore */ }

            // قاعدة: مخاطر حرجة (riskScore >= 16)
            const criticalRisks = risks.filter(r => (r.riskScore || 0) >= 16);
            if (criticalRisks.length > 0) {
                suggestions.push({
                    id: 'critical-risks',
                    type: 'ALERT',
                    priority: 92,
                    icon: '🔴',
                    title: `${criticalRisks.length} مخاطر حرجة تحتاج تدخل فوري`,
                    message: 'مخاطر بدرجة 16+ يجب أن تكون لها خطة تخفيف مفصلة ومسؤول محدد',
                    action: { label: 'عرض المخاطر الحرجة', href: '/risk-map.html' },
                    context: 'مخاطر حرجة',
                });
            }

            // قاعدة: مخاطر بدون مسؤول
            const risksNoOwner = risks.filter(r => !r.owner || r.owner.trim() === '');
            if (risksNoOwner.length > 0) {
                suggestions.push({
                    id: 'risks-no-owner',
                    type: 'WARNING',
                    priority: 70,
                    icon: '👤',
                    title: `${risksNoOwner.length} مخاطر بدون مسؤول`,
                    message: 'كل خطر يحتاج مسؤولاً واضحاً لمتابعته وتنفيذ خطة التخفيف',
                    action: { label: 'تعيين مسؤولين', href: '/risk-map.html' },
                    context: 'إدارة المخاطر',
                });
            }

            // قاعدة: مخاطر غير مرتبطة بأصحاب مصلحة
            const risksNoSH = risks.filter(r => (r._count?.stakeholders || 0) === 0);
            if (risksNoSH.length > 0 && stakeholders.length > 0) {
                suggestions.push({
                    id: 'risks-no-stakeholders',
                    type: 'WARNING',
                    priority: 55,
                    icon: '🔗',
                    title: `${risksNoSH.length} مخاطر غير مرتبطة بأصحاب مصلحة`,
                    message: 'ربط المخاطر بأصحاب المصلحة يحسن التواصل ويسرّع الاستجابة',
                    action: { label: 'ربط المخاطر', href: '/risk-map.html' },
                    context: 'تكامل',
                });
            }

            // قاعدة: أصحاب مصلحة مقاومين
            const resistant = stakeholders.filter(s => s.position === 'RESISTANT');
            if (resistant.length > 0) {
                suggestions.push({
                    id: 'resistant-stakeholders',
                    type: 'WARNING',
                    priority: 72,
                    icon: '⚡',
                    title: `${resistant.length} أصحاب مصلحة مقاومين`,
                    message: 'المقاومة قد تعيق تنفيذ الخطة — اقترح ورش حوار أو اجتماعات توضيحية',
                    action: { label: 'عرض المقاومين', href: '/stakeholders.html' },
                    context: 'أصحاب المصلحة',
                });
            }

            // قاعدة: مؤثرين بمشاركة منخفضة
            const lowEngHighPower = stakeholders.filter(s => s.engagement < 40 && s.influence >= 4);
            if (lowEngHighPower.length > 0) {
                suggestions.push({
                    id: 'low-engagement-influencers',
                    type: 'ALERT',
                    priority: 82,
                    icon: '⚠️',
                    title: `${lowEngHighPower.length} مؤثرين بمشاركة منخفضة`,
                    message: 'أصحاب مصلحة ذوي قوة عالية لكن مشاركتهم ضعيفة — خطر استراتيجي!',
                    action: { label: 'تحسين المشاركة', href: '/stakeholders.html' },
                    context: 'تنبيه',
                });
            }

            // قاعدة: لا يوجد أصحاب مصلحة
            if (stakeholders.length === 0 && risks.length > 0) {
                suggestions.push({
                    id: 'no-stakeholders',
                    type: 'NEXT_STEP',
                    priority: 65,
                    icon: '👥',
                    title: 'أضف أصحاب المصلحة',
                    message: `لديك ${risks.length} مخاطر لكن بدون أصحاب مصلحة — حدد من يتأثر بخطتك`,
                    action: { label: 'إضافة أصحاب مصلحة', href: '/stakeholders.html' },
                    estimatedTime: '15 دقيقة',
                    context: 'أصحاب المصلحة',
                });
            }
        }

        // ═══════════════════════════════════════════
        //  🎭 اقتراحات مخصصة حسب نوع المستخدم
        // ═══════════════════════════════════════════
        if (userType === 'CONSULTANT') {
            // نصائح للمستشار
            suggestions.push({
                id: 'consultant-overview',
                type: 'INFO',
                priority: 50,
                icon: '🧠',
                title: 'لوحة العملاء متاحة',
                message: 'تابع أداء جميع عملائك من مكان واحد — قارن صحتهم الاستراتيجية واكتشف من يحتاج اهتمامك',
                action: { label: 'لوحة العملاء', href: '/consultant-dashboard.html' },
                context: 'مستشار',
            });
            if (kpiSummary.critical > 0) {
                suggestions.push({
                    id: 'consultant-critical-alert',
                    type: 'ALERT',
                    priority: 88,
                    icon: '📋',
                    title: `${kpiSummary.critical} مؤشرات حرجة عند عميلك`,
                    message: 'كمستشار يُنصح بإعداد تقرير تحسين عاجل ومشاركته مع العميل',
                    action: { label: 'عرض المؤشرات', href: '/kpis.html' },
                    context: 'عميل يحتاج تدخل',
                });
            }
        }

        if (userType === 'DEPT_MANAGER') {
            // نصائح لمدير الإدارة
            suggestions.push({
                id: 'dept-dashboard-tip',
                type: 'INFO',
                priority: 50,
                icon: '📊',
                title: 'لوحة إدارتك جاهزة',
                message: 'تابع مؤشرات إدارتك والمبادرات والتنبيهات من لوحة مخصصة لك',
                action: { label: 'لوحة إدارتي', href: '/dept-dashboard.html' },
                context: 'مدير إدارة',
            });
            if (overdueInitiatives > 0) {
                suggestions.push({
                    id: 'dept-overdue',
                    type: 'WARNING',
                    priority: 85,
                    icon: '⏰',
                    title: `${overdueInitiatives} مبادرات متأخرة في إدارتك`,
                    message: 'راجع المبادرات المتأخرة وحدّث حالتها — فريقك ينتظر توجيهاتك',
                    action: { label: 'المبادرات', href: '/initiatives.html' },
                    context: 'إدارتك',
                });
            }
        }

        if (userType === 'EXPLORER') {
            // نصائح للمستكشف
            if (!painAmbitionData) {
                // Already handled above
            } else {
                suggestions.push({
                    id: 'explorer-choose-type',
                    type: 'NEXT_STEP',
                    priority: 45,
                    icon: '🎭',
                    title: 'حدد دورك في المنصة',
                    message: 'اختر نوع حسابك (مدير شركة، مدير إدارة، أو مستشار) لتجربة مخصصة',
                    action: { label: 'اختر نوعك', href: '/select-type.html' },
                    context: 'تخصيص',
                });
            }
        }

        // --- تنبيهات إيجابية ---
        if (kpiSummary.achieved > 0) {
            suggestions.push({
                id: 'celebration',
                type: 'SUCCESS',
                priority: 60,
                icon: '🎉',
                title: `${kpiSummary.achieved} مؤشرات حققت أهدافها!`,
                message: 'أداء ممتاز — استمر وشارك الإنجاز مع فريقك',
                action: { label: 'عرض الإنجازات', href: '/achievements.html' },
            });
        }

        // --- ترتيب حسب الأولوية ---
        suggestions.sort((a, b) => b.priority - a.priority);

        // --- إرجاع أعلى 5 فقط ---
        res.json({
            suggestions: suggestions.slice(0, 5),
            nudge: nudge || (suggestions.length > 0 ? {
                icon: suggestions[0].icon,
                text: suggestions[0].title,
                href: suggestions[0].action?.href || '/dashboard.html'
            } : null),
            context: {
                patternKey,
                patternLabel: getPatternLabel(patternKey),
                completedTools: completedTools.map(t => t.code),
                totalProgress: calculateOverallProgress(painAmbitionData, counts, completedTools),
                userType,
            }
        });

    } catch (error) {
        console.error('AI Advisor error:', error);
        res.status(500).json({ error: 'Failed to generate AI advisor context' });
    }
});

// ═══════════════════════════════════════════
//  GET /api/ai-advisor/tool-chain/:entityId
//  سلسلة الأدوات: ما أُكمل وما يأتي بعده
// ═══════════════════════════════════════════
router.get('/tool-chain/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        const entity = await prisma.entity.findUnique({
            where: { id: entityId },
            select: { id: true, metadata: true }
        });
        if (!entity) return res.status(404).json({ error: 'Entity not found' });

        const activeVersion = await prisma.strategyVersion.findFirst({
            where: { entityId, isActive: true },
            include: {
                _count: { select: { objectives: true, kpis: true, initiatives: true, reviews: true } }
            }
        });

        // جلب التحليلات
        let analyses = [];
        if (activeVersion) {
            analyses = await prisma.companyAnalysis.findMany({
                where: { versionId: activeVersion.id },
                select: { toolCode: true, progress: true, data: true, updatedAt: true },
                orderBy: { updatedAt: 'desc' }
            });
        }

        // بناء السلسلة
        const painAmbition = entity.metadata?.painAmbition || null;
        const patternKey = painAmbition?.patternKey || 'default';

        const chain = [
            {
                step: 1,
                id: 'PAIN_AMBITION',
                label: 'الألم والطموح',
                icon: '💔',
                status: painAmbition ? 'COMPLETED' : 'PENDING',
                progress: painAmbition ? 100 : 0,
                output: painAmbition ? {
                    patternKey,
                    patternLabel: getPatternLabel(patternKey),
                    painsCount: painAmbition.pains?.length || 0,
                    ambitionsCount: painAmbition.ambitions?.length || 0,
                } : null,
            },
            {
                step: 2,
                id: 'SWOT',
                label: 'تحليل SWOT',
                icon: '🔍',
                status: getToolStatus(analyses, 'SWOT'),
                progress: getToolProgress(analyses, 'SWOT'),
                output: getToolSummary(analyses, 'SWOT'),
            },
            {
                step: 3,
                id: 'TOWS',
                label: 'مصفوفة TOWS',
                icon: '🔄',
                status: getToolStatus(analyses, 'TOWS'),
                progress: getToolProgress(analyses, 'TOWS'),
                output: getToolSummary(analyses, 'TOWS'),
            },
            {
                step: 4,
                id: 'BSC_OBJECTIVES',
                label: 'الأهداف و BSC',
                icon: '🎯',
                status: (activeVersion?._count.objectives || 0) > 0 ? 'COMPLETED' : 'PENDING',
                progress: (activeVersion?._count.objectives || 0) > 0 ? 100 : 0,
                output: activeVersion ? {
                    objectives: activeVersion._count.objectives,
                    kpis: activeVersion._count.kpis,
                } : null,
            },
            {
                step: 5,
                id: 'INITIATIVES',
                label: 'المبادرات',
                icon: '🚀',
                status: (activeVersion?._count.initiatives || 0) > 0 ? 'COMPLETED' : 'PENDING',
                progress: (activeVersion?._count.initiatives || 0) > 0 ? 100 : 0,
                output: activeVersion ? {
                    initiatives: activeVersion._count.initiatives,
                } : null,
            },
            {
                step: 6,
                id: 'REVIEWS',
                label: 'المراجعة الدورية',
                icon: '📊',
                status: (activeVersion?._count.reviews || 0) > 0 ? 'IN_PROGRESS' : 'PENDING',
                progress: (activeVersion?._count.reviews || 0) > 0 ? 50 : 0,
                output: activeVersion ? {
                    reviews: activeVersion._count.reviews,
                } : null,
            },
        ];

        // تحديد الخطوة الحالية
        let currentStep = 1;
        for (let i = 0; i < chain.length; i++) {
            if (chain[i].status === 'PENDING') {
                currentStep = chain[i].step;
                break;
            }
            currentStep = chain[i].step + 1;
        }

        res.json({
            entityId,
            patternKey,
            currentStep: Math.min(currentStep, 6),
            chain,
            recommendation: getChainRecommendation(chain, patternKey),
        });

    } catch (error) {
        console.error('Tool chain error:', error);
        res.status(500).json({ error: 'Failed to get tool chain' });
    }
});

// ═══════════════════════════════════════════
//  Helper Functions
// ═══════════════════════════════════════════

function detectPattern(entity) {
    if (!entity) return 'default';
    const hasBasics = entity.industryId && entity.sectorId && entity.typeId;
    const hasLogo = !!entity.logoUrl;
    if (!hasBasics) return 'startup';
    if (entity.size === 'LARGE' || entity.size === 'ENTERPRISE') return 'mature';
    if (hasLogo && hasBasics) return 'growing';
    return 'growing';
}

function getPatternLabel(key) {
    const labels = {
        startup: 'شركة ناشئة',
        growing: 'شركة نامية',
        mature: 'شركة ناضجة',
        struggling: 'شركة متعثرة مالياً',
        default: 'غير محدد',
    };
    return labels[key] || labels.default;
}

function getToolByPattern(patternKey) {
    const toolMap = {
        startup: {
            label: 'تحليل SWOT',
            href: '/swot.html',
            reason: 'أنت في مرحلة التأسيس — تحليل SWOT سيساعدك على فهم موقعك التنافسي بسرعة'
        },
        growing: {
            label: 'تحليل SWOT + Porter',
            href: '/swot.html',
            reason: 'شركتك في نمو — ابدأ بـ SWOT لفهم بيئتك الداخلية والخارجية'
        },
        mature: {
            label: 'تحليل PESTEL',
            href: '/tool-detail.html?code=PESTEL',
            reason: 'شركتك ناضجة — PESTEL سيكشف التغيرات الخارجية المؤثرة على استراتيجيتك'
        },
        struggling: {
            label: 'تشخيص طوارئ (SWOT)',
            href: '/swot.html',
            reason: 'وضعك يحتاج تشخيصاً سريعاً — ابدأ بـ SWOT لتحديد المشكلات الجذرية'
        },
        default: {
            label: 'تحليل SWOT',
            href: '/swot.html',
            reason: 'ابدأ بتحليل SWOT لفهم نقاط القوة والضعف والفرص والتهديدات'
        },
    };
    return toolMap[patternKey] || toolMap.default;
}

function hasCompletedTool(completedTools, code) {
    return completedTools.some(t => t.code === code && t.progress >= 50);
}

function getToolStatus(analyses, code) {
    const tool = analyses.find(a => a.toolCode === code);
    if (!tool) return 'PENDING';
    if (tool.progress >= 100) return 'COMPLETED';
    if (tool.progress > 0) return 'IN_PROGRESS';
    return 'PENDING';
}

function getToolProgress(analyses, code) {
    const tool = analyses.find(a => a.toolCode === code);
    return tool?.progress || 0;
}

function getToolSummary(analyses, code) {
    const tool = analyses.find(a => a.toolCode === code);
    if (!tool || !tool.data) return null;
    // Return a safe summary without full data
    const data = typeof tool.data === 'object' ? tool.data : {};
    return {
        hasData: true,
        progress: tool.progress || 0,
        itemCount: Array.isArray(data.items) ? data.items.length : Object.keys(data).length,
    };
}

function getPageNudge(page, ctx) {
    const nudges = {
        '/swot.html': ctx.completedTools.some(t => t.code === 'SWOT')
            ? null
            : { icon: '💡', text: 'ركّز على أهم 3-5 نقاط في كل قسم', href: null },
        '/tows.html': {
            icon: '🔄', text: 'TOWS يبني على SWOT — ربط النقاط ببعضها يولّد استراتيجيات', href: null
        },
        '/objectives.html': ctx.counts.objectives === 0
            ? { icon: '🎯', text: 'ابدأ بـ 3-4 أهداف واضحة — لا تكثر في البداية', href: null }
            : null,
        '/kpis.html': ctx.kpiSummary.critical > 0
            ? { icon: '⚠️', text: `${ctx.kpiSummary.critical} مؤشرات في وضع حرج — راجعها`, href: null }
            : null,
        '/initiatives.html': ctx.overdueInitiatives > 0
            ? { icon: '🔴', text: `${ctx.overdueInitiatives} مبادرات متأخرة — تحتاج مراجعة`, href: null }
            : null,
        '/reviews.html': {
            icon: '📊', text: 'المراجعة الدورية تكشف الانحرافات مبكراً', href: null
        },
        '/risk-map.html': {
            icon: '🛡️', text: 'ركّز على المخاطر في الربع الأحمر — احتمالية وتأثير عاليين', href: null
        },
        '/stakeholders.html': {
            icon: '👥', text: 'أصحاب المصلحة في ربع "إدارة فعالة" يحتاجون أكبر اهتمام', href: null
        },
        '/dashboard.html': ctx.recentAlerts.length > 0
            ? { icon: '🔔', text: `${ctx.recentAlerts.length} تنبيهات جديدة تحتاج انتباهك`, href: '/intelligence.html' }
            : null,
        '/consultant-dashboard.html': {
            icon: '🧠', text: 'راجع العملاء ذوي الصحة المنخفضة أولاً — ركّز على الأحمر والبرتقالي', href: null
        },
        '/dept-dashboard.html': {
            icon: '📊', text: 'تابع مؤشرات إدارتك يومياً — التنبيهات المبكرة تمنع المشاكل', href: null
        },
        '/select-type.html': {
            icon: '🎭', text: 'اختر نوعك بعناية — كل نوع يفتح لك أدوات ولوحات مختلفة', href: null
        },
    };
    return nudges[page] || null;
}

function calculateOverallProgress(painAmbition, counts, completedTools) {
    let score = 0;
    const weights = { painAmbition: 10, diagnosis: 25, planning: 25, execution: 25, review: 15 };

    // Pain & Ambition (10%)
    if (painAmbition) score += weights.painAmbition;

    // Diagnosis (25%) — based on completed tools
    const diagnosisTools = ['SWOT', 'PESTEL', 'PORTER', 'VALUE_CHAIN'];
    const diagDone = completedTools.filter(t => diagnosisTools.includes(t.code) && t.progress >= 50).length;
    score += Math.min((diagDone / 2) * weights.diagnosis, weights.diagnosis);

    // Planning (25%) — objectives + KPIs
    if (counts.objectives > 0) score += weights.planning * 0.5;
    if (counts.kpis > 0) score += weights.planning * 0.5;

    // Execution (25%) — initiatives
    if (counts.initiatives > 0) score += weights.execution;

    // Review (15%) — reviews
    if (counts.reviews > 0) score += weights.review;

    return Math.round(score);
}

function getChainRecommendation(chain, patternKey) {
    const pending = chain.find(s => s.status === 'PENDING');
    if (!pending) {
        return {
            icon: '🏆',
            title: 'مسارك مكتمل!',
            message: 'أكملت جميع مراحل الخيط الذهبي — استمر في المراجعات الدورية',
            action: null
        };
    }

    const recs = {
        PAIN_AMBITION: {
            icon: '💔',
            title: 'ابدأ بتحديد ألمك وطموحك',
            message: 'هذه المحطة الأولى — 5 دقائق فقط لتحديد اتجاهك',
            action: { label: 'ابدأ', href: '/pain-ambition.html' }
        },
        SWOT: {
            icon: '🔍',
            title: 'شخّص وضعك الحالي',
            message: getToolByPattern(patternKey).reason,
            action: { label: 'ابدأ التشخيص', href: getToolByPattern(patternKey).href }
        },
        TOWS: {
            icon: '🔄',
            title: 'حوّل التحليل إلى استراتيجيات',
            message: 'لديك تشخيص جاهز — TOWS سيولّد خيارات استراتيجية من نقاطك',
            action: { label: 'ابدأ TOWS', href: '/tows.html' }
        },
        BSC_OBJECTIVES: {
            icon: '🎯',
            title: 'حدد الأهداف والمؤشرات',
            message: 'استراتيجيتك واضحة — حدد 3-4 أهداف و KPIs لقياس التقدم',
            action: { label: 'حدد الأهداف', href: '/objectives.html' }
        },
        INITIATIVES: {
            icon: '🚀',
            title: 'أطلق المبادرات',
            message: 'أهدافك محددة — أنشئ مبادرات ومشاريع لتحقيقها',
            action: { label: 'أنشئ مبادرة', href: '/initiatives.html' }
        },
        REVIEWS: {
            icon: '📊',
            title: 'ابدأ المراجعة الدورية',
            message: 'كل شيء يعمل — ابدأ المراجعات لتتابع الأداء وتكتشف الانحرافات',
            action: { label: 'ابدأ المراجعة', href: '/reviews.html' }
        },
    };

    return recs[pending.id] || recs.PAIN_AMBITION;
}

module.exports = router;
