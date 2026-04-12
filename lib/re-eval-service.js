const prisma = require('./prisma');
const DiagnosticEngine = require('../src/js/diagnostic-engine');

/**
 * محرك إعادة التقييم التلقائي — يفحص التغيرات في صحة المنشأة ويقترح تحديث المسار.
 * يعمل كل 7 أيام أو عند تغيرات كبرى في السيولة.
 */
async function checkCriticalChanges() {
    console.log('🔄 [Re-Eval] Starting strategic re-evaluation check...');

    try {
        // 1. جلب القواعد الديناميكية من القاعدة وتحديث المحرك
        const rules = await prisma.journeyRule.findMany({
            where: { isActive: true },
            orderBy: { priority: 'desc' }
        });

        // المحرك يستخدم setRules لاستقبال القواعد
        if (DiagnosticEngine && typeof DiagnosticEngine.setRules === 'function') {
            DiagnosticEngine.setRules(rules);
        }

        // 2. جلب كل الكيانات التي لديها نموذج نمط (Pattern)
        const entities = await prisma.entity.findMany({
            include: {
                company: {
                    include: {
                        pattern: true  // نستخدم علاقة Company.pattern الموجودة في schema
                    }
                }
            }
        });

        let changesDetected = 0;

        for (const entity of entities) {
            try {
                // البحث عن النمط الحالي (سواء في CompanyPattern أو Metadata)
                const currentPatternKey = entity.company?.pattern?.patternKey || '';

                // استخراج الإجابات السابقة من metadata
                let answers = {};
                if (entity.metadata) {
                    try {
                        const meta = JSON.parse(entity.metadata);
                        answers = meta.painAmbition?.diagnosticAnswers || {};
                    } catch (e) { }
                }

                // تحديث الإجابات بالبيانات الحالية الدقيقة
                answers.liquidityExact = entity.liquidityExact || 0;
                answers.res = entity.liquidityExact; // مزامنة res مع القيمة الرقمية للمحرك

                if (entity.size) answers.entity_size = entity.size;

                // 3. إعادة معالجة الإجابات عبر المحرك المركزي
                const newResult = DiagnosticEngine.determineOwnerPath(answers);

                // 4. المقارنة: هل تغير النمط المقترح؟
                if (newResult.patternKey !== currentPatternKey && currentPatternKey !== '') {

                    // تحقق من عدم وجود تنبيه مشابه نشط (خلال آخر 10 أيام)
                    const existingAlert = await prisma.strategicAlert.findFirst({
                        where: {
                            entityId: entity.id,
                            type: 'STRATEGIC_SHIFT',
                            isDismissed: false,
                            createdAt: { gte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
                        }
                    });

                    if (!existingAlert) {
                        console.log(`⚠️  [Re-Eval] Shift detected for ${entity.legalName}: ${currentPatternKey} -> ${newResult.patternKey}`);

                        await prisma.strategicAlert.create({
                            data: {
                                entityId: entity.id,
                                type: 'STRATEGIC_SHIFT',
                                severity: (newResult.patternKey === 'emergency_risk') ? 'CRITICAL' : 'WARNING',
                                title: `تنبيه: تغير محتمل في التوجه الاستراتيجي`,
                                message: `تم رصد تغير في المعطيات (السيولة: ${entity.liquidityExact} أشهر). يُنصح بمراجعة المسار: ${newResult.patternKey}. السبب: ${newResult.reason}`,
                                referenceType: 'HEALTH'
                            }
                        });
                        changesDetected++;
                    }
                }
            } catch (entityErr) {
                console.error(`❌ [Re-Eval] Skip entity ${entity.id}:`, entityErr.message);
            }
        }

        console.log(`✅ [Re-Eval] Finished. Scanned ${entities.length} entities, raised ${changesDetected} shift alerts.`);
        return { scanned: entities.length, alerts: changesDetected };

    } catch (globalErr) {
        console.error('💀 [Re-Eval] Global Failure:', globalErr);
        throw globalErr;
    }
}

module.exports = { checkCriticalChanges };
