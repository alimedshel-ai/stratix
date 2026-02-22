const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============ AUTO ALERT ENGINE ============
// محرك التنبيهات التلقائي — يفحص البيانات ويطلق تنبيهات ذكية
//
// Trigger Rules:
//   KPI: deviation > 10% → WARNING, > 25% → CRITICAL
//   KPI: ratio >= 1.0 → 🎉 KPI_ACHIEVED (SUCCESS)
//   Objective: all KPIs achieved → 🏆 OBJECTIVE_ACHIEVED (SUCCESS)
//   Initiative: endDate passed & status != COMPLETED → DELAYED
//   Review: No review in 90 days → OVERDUE
//   Risk: High score (>= 15) → HIGH RISK
//   Health: Entity health < 40 → LOW HEALTH

// ========== RUN FULL SCAN ==========
// POST /api/alert-engine/scan
// Scans all entities and generates alerts automatically

router.post('/scan', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.body; // optional: scan specific entity

        let entities;
        if (entityId) {
            const entity = await prisma.entity.findUnique({ where: { id: entityId } });
            if (!entity) return res.status(404).json({ error: 'Entity not found' });
            entities = [entity];
        } else {
            entities = await prisma.entity.findMany();
        }

        const results = {
            scanned: entities.length,
            alertsGenerated: 0,
            cascadingActions: 0,
            breakdown: {
                kpiAchieved: 0,
                objectiveAchieved: 0,
                kpiWarnings: 0,
                kpiCritical: 0,
                initiativeDelayed: 0,
                reviewOverdue: 0,
                riskHigh: 0,
                healthLow: 0
            },
            closedLoopActions: []  // ✨ تتبع الإجراءات التصحيحية التلقائية
        };

        for (const entity of entities) {
            const activeVersion = await prisma.strategyVersion.findFirst({
                where: { entityId: entity.id, isActive: true }
            });

            if (!activeVersion) continue;
            const versionId = activeVersion.id;

            // ===== 1. KPI ALERTS =====
            const kpis = await prisma.kPI.findMany({
                where: { versionId },
                select: { id: true, name: true, actual: true, target: true, warningThreshold: true, criticalThreshold: true, status: true, objectiveId: true, direction: true }
            });

            for (const kpi of kpis) {
                if (kpi.target == null || kpi.target === 0 || kpi.actual == null) continue;

                // ✨ حساب ذكي حسب اتجاه المؤشر
                // HIGHER_IS_BETTER (مثل رضا العملاء): ratio = actual/target → أعلى = أفضل
                // LOWER_IS_BETTER (مثل وقت الانتظار): ratio = target/actual → أقل = أفضل
                const isLowerBetter = kpi.direction === 'LOWER_IS_BETTER';
                const ratio = isLowerBetter
                    ? (kpi.actual > 0 ? kpi.target / kpi.actual : 1)
                    : kpi.actual / kpi.target;
                const criticalThreshold = kpi.criticalThreshold || 0.5;
                const warningThreshold = kpi.warningThreshold || 0.75;

                // ===== 🎉 تنبيهات إيجابية: KPI حقق الهدف =====
                if (ratio >= 1.0 && kpi.status !== 'ACHIEVED') {
                    // Check no duplicate success alert in last 30 days
                    const existingSuccess = await prisma.strategicAlert.findFirst({
                        where: {
                            entityId: entity.id,
                            referenceId: kpi.id,
                            type: 'KPI_ACHIEVED',
                            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                        }
                    });

                    if (!existingSuccess) {
                        await prisma.strategicAlert.create({
                            data: {
                                entityId: entity.id,
                                type: 'KPI_ACHIEVED',
                                severity: 'SUCCESS',
                                title: `🎉 مبروك! مؤشر "${kpi.name}" حقق الهدف`,
                                message: `الأداء الفعلي (${(ratio * 100).toFixed(1)}%) وصل أو تجاوز المستهدف. القيمة: ${kpi.actual} من ${kpi.target}`,
                                referenceId: kpi.id,
                                referenceType: 'KPI'
                            }
                        });
                        results.alertsGenerated++;
                        results.breakdown.kpiAchieved++;
                    }

                    // Update KPI status to ACHIEVED
                    await prisma.kPI.update({ where: { id: kpi.id }, data: { status: 'ACHIEVED' } });

                    // ✨ CLOSED LOOP: Check if ALL KPIs under this objective are now ACHIEVED
                    if (kpi.objectiveId) {
                        const siblingKpis = await prisma.kPI.findMany({
                            where: { objectiveId: kpi.objectiveId },
                            select: { id: true, status: true }
                        });
                        const allAchieved = siblingKpis.every(k => k.id === kpi.id ? true : k.status === 'ACHIEVED');

                        if (allAchieved && siblingKpis.length > 0) {
                            const objective = await prisma.strategicObjective.findUnique({
                                where: { id: kpi.objectiveId },
                                select: { id: true, title: true, status: true }
                            });

                            if (objective && objective.status !== 'ACHIEVED') {
                                await prisma.strategicObjective.update({
                                    where: { id: kpi.objectiveId },
                                    data: { status: 'ACHIEVED' }
                                });

                                await prisma.strategicAlert.create({
                                    data: {
                                        entityId: entity.id,
                                        type: 'OBJECTIVE_ACHIEVED',
                                        severity: 'SUCCESS',
                                        title: `🏆 الهدف "${objective.title}" مكتمل!`,
                                        message: `جميع مؤشرات الأداء (${siblingKpis.length}) تحت هذا الهدف حققت أهدافها`,
                                        referenceId: objective.id,
                                        referenceType: 'OBJECTIVE'
                                    }
                                });
                                results.alertsGenerated++;
                                results.breakdown.objectiveAchieved++;
                                results.cascadingActions++;
                                results.closedLoopActions.push({
                                    type: 'OBJECTIVE_ACHIEVED',
                                    action: `تحديث حالة الهدف "${objective.title}" إلى مكتمل`,
                                    reason: `جميع مؤشرات الأداء (${siblingKpis.length}) حققت أهدافها`,
                                    objectiveId: kpi.objectiveId
                                });
                            }
                        }
                    }
                    continue; // Skip warning/critical checks for achieved KPIs
                }

                // Skip healthy KPIs (performing well but not yet achieved)
                if (ratio >= 0.9) continue;

                // Check if an alert already exists for this KPI (avoid duplicates)
                const existingAlert = await prisma.strategicAlert.findFirst({
                    where: {
                        entityId: entity.id,
                        referenceId: kpi.id,
                        referenceType: 'KPI',
                        isDismissed: false,
                        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // last 7 days
                    }
                });

                if (existingAlert) continue;

                if (ratio <= criticalThreshold) {
                    // CRITICAL: performance <= criticalThreshold
                    await prisma.strategicAlert.create({
                        data: {
                            entityId: entity.id,
                            type: 'KPI_CRITICAL',
                            severity: 'CRITICAL',
                            title: `⛔ مؤشر "${kpi.name}" في وضع حرج`,
                            message: `الأداء الفعلي (${(ratio * 100).toFixed(1)}%) أقل بكثير من المستهدف. القيمة: ${kpi.actual} من ${kpi.target}`,
                            referenceId: kpi.id,
                            referenceType: 'KPI'
                        }
                    });
                    results.alertsGenerated++;
                    results.breakdown.kpiCritical++;

                    // Update KPI status
                    await prisma.kPI.update({ where: { id: kpi.id }, data: { status: 'OFF_TRACK' } });

                    // ✨ CLOSED LOOP: Cascade to linked Objective
                    if (kpi.objectiveId) {
                        const objective = await prisma.strategicObjective.findUnique({
                            where: { id: kpi.objectiveId },
                            select: { id: true, title: true, status: true }
                        });
                        if (objective && objective.status !== 'OFF_TRACK') {
                            await prisma.strategicObjective.update({
                                where: { id: kpi.objectiveId },
                                data: { status: 'AT_RISK' }
                            });
                            results.cascadingActions++;
                            results.closedLoopActions.push({
                                type: 'OBJECTIVE_STATUS_UPDATE',
                                action: `تحديث حالة الهدف "${objective.title}" إلى تحت المراقبة`,
                                reason: `مؤشر "${kpi.name}" في وضع حرج (${(ratio * 100).toFixed(1)}%)`,
                                objectiveId: kpi.objectiveId,
                                kpiId: kpi.id
                            });
                        }
                    }
                } else if (ratio <= warningThreshold) {
                    // WARNING: performance <= warningThreshold
                    await prisma.strategicAlert.create({
                        data: {
                            entityId: entity.id,
                            type: 'KPI_WARNING',
                            severity: 'WARNING',
                            title: `⚠️ مؤشر "${kpi.name}" يحتاج انتباه`,
                            message: `الأداء الفعلي (${(ratio * 100).toFixed(1)}%) أقل من المتوقع. القيمة: ${kpi.actual} من ${kpi.target}`,
                            referenceId: kpi.id,
                            referenceType: 'KPI'
                        }
                    });
                    results.alertsGenerated++;
                    results.breakdown.kpiWarnings++;

                    // Update KPI status
                    await prisma.kPI.update({ where: { id: kpi.id }, data: { status: 'AT_RISK' } });
                }
            }

            // ===== 2. INITIATIVE DELAYS =====
            const initiatives = await prisma.strategicInitiative.findMany({
                where: { versionId },
                select: { id: true, title: true, status: true, endDate: true, progress: true }
            });

            const now = new Date();
            for (const ini of initiatives) {
                if (ini.status === 'COMPLETED' || ini.status === 'CANCELLED') continue;
                if (!ini.endDate) continue;
                if (new Date(ini.endDate) > now) continue; // Not overdue yet

                // Check for existing
                const existing = await prisma.strategicAlert.findFirst({
                    where: {
                        entityId: entity.id,
                        referenceId: ini.id,
                        referenceType: 'INITIATIVE',
                        isDismissed: false,
                        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                    }
                });

                if (existing) continue;

                const daysOverdue = Math.floor((now - new Date(ini.endDate)) / (1000 * 60 * 60 * 24));
                const severity = daysOverdue > 30 ? 'CRITICAL' : 'WARNING';

                await prisma.strategicAlert.create({
                    data: {
                        entityId: entity.id,
                        type: 'INITIATIVE_DELAYED',
                        severity,
                        title: `⏰ مبادرة "${ini.title}" متأخرة`,
                        message: `المبادرة متأخرة بـ ${daysOverdue} يوم. الإنجاز: ${ini.progress || 0}%`,
                        referenceId: ini.id,
                        referenceType: 'INITIATIVE'
                    }
                });
                results.alertsGenerated++;
                results.breakdown.initiativeDelayed++;

                // ✨ CLOSED LOOP: If initiative is severely delayed (>30 days), auto-escalate risks
                if (daysOverdue > 30) {
                    const relatedRisks = await prisma.strategicRisk.findMany({
                        where: {
                            versionId,
                            status: { notIn: ['MITIGATED', 'CLOSED'] }
                        },
                        select: { id: true, description: true, probabilityScore: true, status: true }
                    });

                    for (const risk of relatedRisks) {
                        if (risk.status !== 'MONITORING' && risk.probabilityScore && risk.probabilityScore < 4) {
                            await prisma.strategicRisk.update({
                                where: { id: risk.id },
                                data: { probabilityScore: Math.min((risk.probabilityScore || 3) + 1, 5) }
                            });
                            results.cascadingActions++;
                            results.closedLoopActions.push({
                                type: 'RISK_ESCALATION',
                                action: `رفع احتمالية الخطر "${(risk.description || '').substring(0, 40)}"`,
                                reason: `مبادرة "${ini.title}" متأخرة ${daysOverdue} يوم`,
                                riskId: risk.id
                            });
                            break; // Only escalate one risk per delayed initiative
                        }
                    }
                }
            }

            // ===== 3. REVIEW OVERDUE =====
            const latestReview = await prisma.strategicReview.findFirst({
                where: { versionId },
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true }
            });

            const daysSinceReview = latestReview
                ? Math.floor((now - new Date(latestReview.createdAt)) / (1000 * 60 * 60 * 24))
                : 999;

            if (daysSinceReview > 90) {
                const existingReviewAlert = await prisma.strategicAlert.findFirst({
                    where: {
                        entityId: entity.id,
                        type: 'REVIEW_OVERDUE',
                        isDismissed: false,
                        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
                    }
                });

                if (!existingReviewAlert) {
                    await prisma.strategicAlert.create({
                        data: {
                            entityId: entity.id,
                            type: 'REVIEW_OVERDUE',
                            severity: daysSinceReview > 180 ? 'CRITICAL' : 'WARNING',
                            title: `📋 لم يتم إجراء مراجعة لأكثر من ${daysSinceReview} يوم`,
                            message: `يُنصح بإجراء مراجعة دورية كل 3 أشهر على الأقل لضمان التوافق الاستراتيجي`,
                            referenceType: 'REVIEW'
                        }
                    });
                    results.alertsGenerated++;
                    results.breakdown.reviewOverdue++;
                }
            }

            // ===== 4. HIGH RISKS =====
            const risks = await prisma.strategicRisk.findMany({
                where: { versionId, status: { notIn: ['MITIGATED', 'CLOSED'] } },
                select: { id: true, description: true, probabilityScore: true, impactScore: true, riskScore: true, mitigation: true }
            });

            for (const risk of risks) {
                const score = risk.riskScore || ((risk.probabilityScore || 3) * (risk.impactScore || 3));
                if (score < 15) continue;

                const existing = await prisma.strategicAlert.findFirst({
                    where: {
                        entityId: entity.id,
                        referenceId: risk.id,
                        referenceType: 'RISK',
                        isDismissed: false,
                        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
                    }
                });

                if (existing) continue;

                const hasMitigation = risk.mitigation && risk.mitigation.trim().length > 0;

                await prisma.strategicAlert.create({
                    data: {
                        entityId: entity.id,
                        type: 'RISK_HIGH',
                        severity: score >= 20 ? 'CRITICAL' : 'WARNING',
                        title: `🚨 خطر عالي: ${(risk.description || 'خطر غير محدد').substring(0, 50)}`,
                        message: `درجة الخطر: ${score}/25. ${hasMitigation ? 'يوجد خطة تخفيف' : '⚠️ لا يوجد خطة تخفيف'}`,
                        referenceId: risk.id,
                        referenceType: 'RISK'
                    }
                });
                results.alertsGenerated++;
                results.breakdown.riskHigh++;
            }

            // ===== 5. HEALTH CHECK (LOW HEALTH) =====
            // Quick health calculation for this entity
            let quickHealthScore = 0;
            const measuredKpis = kpis.filter(k => k.actual != null && k.target != null && k.target > 0);
            const kpiPct = measuredKpis.length > 0
                ? Math.min(measuredKpis.reduce((s, k) => {
                    // ✨ حساب ذكي حسب اتجاه المؤشر في Health Score
                    const isLB = k.direction === 'LOWER_IS_BETTER';
                    const r = isLB ? (k.actual > 0 ? k.target / k.actual : 1) : k.actual / k.target;
                    return s + Math.min(r * 100, 120);
                }, 0) / measuredKpis.length, 100)
                : 0;
            const iniPct = initiatives.length > 0
                ? initiatives.reduce((s, i) => s + (i.progress || 0), 0) / initiatives.length
                : 0;
            quickHealthScore = Math.round(kpiPct * 0.6 + iniPct * 0.4);

            if (quickHealthScore < 40 && quickHealthScore > 0) {
                const existingHealthAlert = await prisma.strategicAlert.findFirst({
                    where: {
                        entityId: entity.id,
                        type: 'HEALTH_LOW',
                        isDismissed: false,
                        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
                    }
                });

                if (!existingHealthAlert) {
                    await prisma.strategicAlert.create({
                        data: {
                            entityId: entity.id,
                            type: 'HEALTH_LOW',
                            severity: quickHealthScore < 20 ? 'CRITICAL' : 'WARNING',
                            title: `💔 صحة الكيان منخفضة (${quickHealthScore}/100)`,
                            message: `مؤشر الصحة الاستراتيجية أقل من المقبول. KPIs: ${Math.round(kpiPct)}% — المبادرات: ${Math.round(iniPct)}%`,
                            referenceType: 'HEALTH'
                        }
                    });
                    results.alertsGenerated++;
                    results.breakdown.healthLow++;
                }
            }
        }

        res.json({
            message: `تم فحص ${results.scanned} كيان وتوليد ${results.alertsGenerated} تنبيه${results.cascadingActions > 0 ? ` + ${results.cascadingActions} إجراء تصحيحي تلقائي` : ''}`,
            ...results
        });
    } catch (error) {
        console.error('Alert engine error:', error);
        res.status(500).json({ error: 'Alert engine scan failed' });
    }
});

// ========== GENERATE SMART RECOMMENDATIONS ==========
// POST /api/alert-engine/recommendations/:entityId
// Cross-reference weak KPIs with SWOT analysis to recommend actions

router.post('/recommendations/:entityId', verifyToken, async (req, res) => {
    try {
        const { entityId } = req.params;

        const activeVersion = await prisma.strategyVersion.findFirst({
            where: { entityId, isActive: true }
        });

        if (!activeVersion) {
            return res.json({ recommendations: [], message: 'لا يوجد إصدار استراتيجي نشط' });
        }

        const versionId = activeVersion.id;

        // Get weak KPIs
        const weakKpis = await prisma.kPI.findMany({
            where: {
                versionId,
                status: { in: ['AT_RISK', 'OFF_TRACK'] }
            },
            include: { objective: { select: { title: true, perspective: true } } }
        });

        // Get SWOT analysis
        const analysisPoints = await prisma.analysisPoint.findMany({
            where: {
                assessment: { entityId }
            },
            select: { type: true, title: true, description: true, impact: true }
        });

        const weaknesses = analysisPoints.filter(p => p.type === 'WEAKNESS');
        const threats = analysisPoints.filter(p => p.type === 'THREAT');
        const strengths = analysisPoints.filter(p => p.type === 'STRENGTH');
        const opportunities = analysisPoints.filter(p => p.type === 'OPPORTUNITY');

        // Get stalled initiatives
        const stalledInitiatives = await prisma.strategicInitiative.findMany({
            where: {
                versionId,
                status: { in: ['PLANNED', 'ON_HOLD'] }
            },
            select: { title: true, status: true, progress: true }
        });

        // Generate recommendations
        const recommendations = [];

        // Rule 1: Weak KPI + relevant weakness = suggest corrective action
        for (const kpi of weakKpis) {
            // ✨ حساب ذكي حسب اتجاه المؤشر في التوصيات
            const isLB = kpi.direction === 'LOWER_IS_BETTER';
            const ratio = kpi.target > 0
                ? (isLB ? (kpi.actual > 0 ? kpi.target / kpi.actual : 1) : (kpi.actual || 0) / kpi.target)
                : 0;
            const severity = ratio < 0.5 ? 'HIGH' : 'MEDIUM';

            const rec = {
                type: 'KPI_IMPROVEMENT',
                severity,
                kpi: kpi.name,
                perspective: kpi.objective?.perspective || 'غير محدد',
                currentRatio: `${(ratio * 100).toFixed(1)}%`,
                suggestion: ratio < 0.5
                    ? `⚠️ مؤشر "${kpi.name}" أقل من 50% — يجب تعديل المبادرات المرتبطة أو تخصيص موارد إضافية`
                    : `📊 مؤشر "${kpi.name}" أقل من المستهدف — يُنصح بمراجعة خطة العمل`,
                relatedWeaknesses: weaknesses.filter(w =>
                    w.title?.toLowerCase().includes(kpi.name.toLowerCase().split(' ')[0])
                ).map(w => w.title),
                relatedThreats: threats.slice(0, 2).map(t => t.title)
            };
            recommendations.push(rec);
        }

        // Rule 2: High-impact opportunities not linked to initiatives
        for (const opp of opportunities.filter(o => o.impact === 'HIGH')) {
            recommendations.push({
                type: 'OPPORTUNITY_CAPTURE',
                severity: 'MEDIUM',
                suggestion: `🟢 فرصة عالية التأثير: "${opp.title}" — يُنصح بإنشاء مبادرة لاستغلالها`,
                details: opp.description
            });
        }

        // Rule 3: Generate strategic decision recommendation
        let overallDecision = 'CONTINUE';
        const weakCount = weakKpis.length;
        const totalKpis = await prisma.kPI.count({ where: { versionId } });
        const weakRatio = totalKpis > 0 ? weakCount / totalKpis : 0;

        if (weakRatio > 0.5) {
            overallDecision = 'PIVOT';
        } else if (weakRatio > 0.25) {
            overallDecision = 'ADJUST';
        }

        const decisionLabels = {
            CONTINUE: { label: 'استمر', icon: '✅', desc: 'الأداء العام جيد — واصل مع تحسينات طفيفة' },
            ADJUST: { label: 'عدّل', icon: '🔧', desc: 'بعض المؤشرات ضعيفة — حِدّث المبادرات والأهداف' },
            PIVOT: { label: 'تحوّل', icon: '🔄', desc: 'أغلب المؤشرات ضعيفة — أعد النظر في الاستراتيجية' }
        };

        res.json({
            entityId,
            version: activeVersion.name || `v${activeVersion.versionNumber}`,
            decision: {
                recommendation: overallDecision,
                ...decisionLabels[overallDecision],
                weakKpisCount: weakCount,
                totalKpis,
                weakRatio: `${(weakRatio * 100).toFixed(0)}%`
            },
            recommendations,
            stalledInitiatives,
            swotSummary: {
                strengths: strengths.length,
                weaknesses: weaknesses.length,
                opportunities: opportunities.length,
                threats: threats.length
            }
        });
    } catch (error) {
        console.error('Recommendation engine error:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

// ============================================
// ✨ PHASE 7: الجهاز العصبي الاستراتيجي
// ============================================

// ========== 7.2 ROOT CAUSE VIA BSC ==========
// GET /api/alert-engine/root-cause/:kpiId
// تتبع السلسلة السببية للخلف: لماذا هذا المؤشر ينخفض؟

router.get('/root-cause/:kpiId', verifyToken, async (req, res) => {
    try {
        const { kpiId } = req.params;

        // Get the KPI + its objective
        const kpi = await prisma.kPI.findUnique({
            where: { id: kpiId },
            include: {
                objective: {
                    select: { id: true, title: true, perspective: true }
                },
                version: { select: { id: true, entityId: true } }
            }
        });

        if (!kpi) return res.status(404).json({ error: 'KPI not found' });
        if (!kpi.objective) return res.json({ rootCauses: [], message: 'المؤشر غير مرتبط بهدف' });

        const versionId = kpi.versionId;
        const objectiveId = kpi.objective.id;

        // BSC flow (reverse): Financial ← Customer ← Internal ← Learning
        const bscReverseFlow = {
            'FINANCIAL': 'CUSTOMER',
            'CUSTOMER': 'INTERNAL_PROCESS',
            'INTERNAL_PROCESS': 'LEARNING_GROWTH'
        };

        // Get all causal links for this version
        // causalLinks — DISABLED
        const allLinks = [];

        // Trace backwards from the affected objective
        const rootCauses = [];
        const visited = new Set();

        function traceBack(currentObjectiveId, depth = 0) {
            if (depth > 5 || visited.has(currentObjectiveId)) return;
            visited.add(currentObjectiveId);

            // Find links where this objective is the TARGET (who feeds into it?)
            const feedingLinks = allLinks.filter(l => l.targetId === currentObjectiveId);

            for (const link of feedingLinks) {
                const source = link.source;
                const weakKpis = (source.kpis || []).filter(k =>
                    k.target > 0 && k.actual != null && (k.actual / k.target) < 0.7
                );

                rootCauses.push({
                    depth,
                    objectiveId: source.id,
                    objectiveTitle: source.title,
                    perspective: source.perspective,
                    status: source.status,
                    linkType: link.linkType,
                    linkStrength: link.strength,
                    weakKpis: weakKpis.map(k => ({
                        id: k.id,
                        name: k.name,
                        ratio: k.target > 0 ? Math.round((k.actual / k.target) * 100) : 0,
                        status: k.status
                    })),
                    isProbableRootCause: weakKpis.length > 0
                });

                traceBack(source.id, depth + 1);
            }
        }

        traceBack(objectiveId);

        // Also check BSC hierarchy (even without explicit causal links)
        const currentPerspective = kpi.objective.perspective;
        const sourcePerspective = bscReverseFlow[currentPerspective];

        let bscSuggestions = [];
        if (sourcePerspective) {
            const lowerObjectives = await prisma.strategicObjective.findMany({
                where: { versionId, perspective: sourcePerspective },
                include: {
                    kpis: { select: { id: true, name: true, actual: true, target: true, status: true } }
                }
            });

            bscSuggestions = lowerObjectives
                .filter(o => {
                    const weakKpis = o.kpis.filter(k =>
                        k.target > 0 && k.actual != null && (k.actual / k.target) < 0.7
                    );
                    return weakKpis.length > 0;
                })
                .map(o => ({
                    objectiveId: o.id,
                    objectiveTitle: o.title,
                    perspective: o.perspective,
                    weakKpis: o.kpis.filter(k =>
                        k.target > 0 && k.actual != null && (k.actual / k.target) < 0.7
                    ).map(k => ({
                        id: k.id,
                        name: k.name,
                        ratio: k.target > 0 ? Math.round((k.actual / k.target) * 100) : 0
                    })),
                    suggestion: `فجوة في منظور ${sourcePerspective === 'LEARNING_GROWTH' ? 'التعلم والنمو' :
                        sourcePerspective === 'INTERNAL_PROCESS' ? 'العمليات الداخلية' :
                            sourcePerspective === 'CUSTOMER' ? 'العملاء' : sourcePerspective}`
                }));
        }

        const probableRoots = rootCauses.filter(r => r.isProbableRootCause);

        res.json({
            kpi: {
                id: kpi.id,
                name: kpi.name,
                actual: kpi.actual,
                target: kpi.target,
                ratio: kpi.target > 0 ? Math.round(((kpi.actual || 0) / kpi.target) * 100) : 0,
                perspective: kpi.objective?.perspective
            },
            rootCauses: rootCauses.sort((a, b) => a.depth - b.depth),
            bscSuggestions,
            summary: {
                totalTracedObjectives: rootCauses.length,
                probableRootCauses: probableRoots.length,
                bscSuggestions: bscSuggestions.length,
                deepestLevel: Math.max(0, ...rootCauses.map(r => r.depth))
            },
            message: probableRoots.length > 0
                ? `🔍 تم العثور على ${probableRoots.length} سبب جذري محتمل`
                : bscSuggestions.length > 0
                    ? `💡 لا روابط سببية مباشرة، لكن يوجد ${bscSuggestions.length} فجوة في المنظور الأدنى`
                    : '✅ لم يتم العثور على أسباب جذرية واضحة'
        });
    } catch (error) {
        console.error('Root cause analysis error:', error);
        res.status(500).json({ error: 'Failed to perform root cause analysis' });
    }
});

// ========== 7.3 TOWS → INITIATIVE ==========
// POST /api/alert-engine/tows-to-initiative
// تحويل استراتيجية TOWS معتمدة إلى مبادرة تلقائياً

router.post('/tows-to-initiative', verifyToken, async (req, res) => {
    // DISABLED — TOWS model removed
    return res.status(501).json({ error: 'هذه الميزة معطّلة حالياً (TOWS)' });
});

// ========== 7.3 IMPACT CHAIN ==========
// GET /api/alert-engine/impact-chain/:objectiveId
// عرض سلسلة التأثير: ما الأهداف المتأثرة بهذا الهدف؟

router.get('/impact-chain/:objectiveId', verifyToken, async (req, res) => {
    try {
        const { objectiveId } = req.params;

        const objective = await prisma.strategicObjective.findUnique({
            where: { id: objectiveId },
            select: { id: true, title: true, perspective: true, versionId: true }
        });

        if (!objective) return res.status(404).json({ error: 'Objective not found' });

        // causalLinks — DISABLED
        const allLinks = [];

        // Trace forward: what does this objective affect?
        const impactChain = [];
        const visited = new Set();

        function traceForward(currentId, depth = 0) {
            if (depth > 5 || visited.has(currentId)) return;
            visited.add(currentId);

            const impactedLinks = allLinks.filter(l => l.sourceId === currentId);
            for (const link of impactedLinks) {
                impactChain.push({
                    depth,
                    from: link.source,
                    to: link.target,
                    linkType: link.linkType,
                    strength: link.strength
                });
                traceForward(link.targetId, depth + 1);
            }
        }

        traceForward(objectiveId);

        // Get unique affected objectives
        const affectedObjectives = [...new Set(impactChain.map(l => l.to.id))]
            .map(id => impactChain.find(l => l.to.id === id)?.to)
            .filter(Boolean);

        res.json({
            source: objective,
            impactChain,
            affectedObjectives,
            summary: {
                totalAffected: affectedObjectives.length,
                byPerspective: {
                    FINANCIAL: affectedObjectives.filter(o => o.perspective === 'FINANCIAL').length,
                    CUSTOMER: affectedObjectives.filter(o => o.perspective === 'CUSTOMER').length,
                    INTERNAL_PROCESS: affectedObjectives.filter(o => o.perspective === 'INTERNAL_PROCESS').length,
                    LEARNING_GROWTH: affectedObjectives.filter(o => o.perspective === 'LEARNING_GROWTH').length
                }
            }
        });
    } catch (error) {
        console.error('Impact chain error:', error);
        res.status(500).json({ error: 'Failed to trace impact chain' });
    }
});

module.exports = router;
