/**
 * Startix Strategic Synthesis Engine ✦
 * =================================
 * Handles cross-departmental data aggregation for executive dashboards.
 */

window.StrategicSynthesis = {
    /**
     * Fetches aggregated strategic data from all departments.
     * @param {string} mode - 'company' to fetch all, or a specific dept code.
     */
    async fetchAggregatedSwot(mode = 'company') {
        const results = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
        const isCompanyMode = mode === 'company';

        try {
            const user = await window.api.getCurrentUser();
            const diagData = user?.diagnosticData;

            if (isCompanyMode) {
                // Fetch from all modules for all departments
                const types = ['SWOT', 'AUDIT', 'PESTEL', 'DEEP_ANALYSIS'];
                const allDataArr = await Promise.all(
                    types.map(t => window.api.get(`/api/dept/analysis/all/${t}`).catch(() => ({ data: {} })))
                );

                const allSwots = allDataArr[0]?.data || {};
                const allAudits = allDataArr[1]?.data || {};
                const allPestels = allDataArr[2]?.data || {};
                const allDeeps = allDataArr[3]?.data || {};

                // 1. SWOT Aggregation (Captures top 2 items per department)
                Object.entries(allSwots).forEach(([dk, dd]) => {
                    if (dk === 'company') return;
                    const deptLabel = dk.toUpperCase();
                    if (dd.strengths) {
                        dd.strengths.split('\n').slice(0, 2).forEach(s => {
                            if (s.trim()) results.strengths.push(`[${deptLabel}] ${s.trim()}`);
                        });
                    }
                    if (dd.weaknesses) {
                        dd.weaknesses.split('\n').slice(0, 2).forEach(w => {
                            if (w.trim()) results.weaknesses.push(`[${deptLabel}] ${w.trim()}`);
                        });
                    }
                });

                // 2. Audit Aggregation (Compliance & Risk)
                Object.entries(allAudits).forEach(([dk, dd]) => {
                    const deptLabel = dk.toUpperCase();
                    if (dd.meta?.violations > 0) results.weaknesses.push(`[${deptLabel}] مخاطر امتثال: وجود ${dd.meta.violations} مخالفات تشغيلية`);
                    if (dd.score < 60) results.weaknesses.push(`[${deptLabel}] ضعف في الضوابط الرقابية (الدرجة: ${dd.score}%)`);
                    if (dd.meta?.criticalFindings) {
                        results.threats.push(`[${deptLabel}] ثغرة أمنية/قانونية من التدقيق`);
                    }
                });

                // 3. Deep Analysis Aggregation (Structural Challenges)
                Object.entries(allDeeps).forEach(([dk, dd]) => {
                    const deptLabel = dk.toUpperCase();
                    const challenge = dd.mainChallenge || dd.main_challenge;
                    if (challenge) results.weaknesses.push(`[${deptLabel}] تحدي هيكلي: ${challenge}`);
                    if (dd.strategicGap) results.opportunities.push(`[${deptLabel}] فجوة نمو مكتشفة: ${dd.strategicGap}`);
                });

                // 4. PESTEL Aggregation (External Market Signals)
                Object.entries(allPestels).forEach(([dk, dd]) => {
                    const deptLabel = dk.toUpperCase();
                    Object.values(dd).forEach(v => {
                        if (typeof v === 'string' && v.length > 5) {
                            const lines = v.split('\n').map(l => l.trim()).filter(l => l.length > 3);
                            lines.slice(0, 3).forEach(l => {
                                const threatKws = ['خطر', 'تهديد', 'تحدي', 'ضريبة', 'ضرائب', 'تضخم', 'انخفاض', 'منافس', 'مخاطر', 'أزمة', 'قيود', 'إفلاس', 'تراجع', 'عقبات'];
                                if (threatKws.some(k => l.includes(k))) {
                                    results.threats.push(`[${deptLabel}] ${l}`);
                                } else {
                                    results.opportunities.push(`[${deptLabel}] ${l}`);
                                }
                            });
                        }
                    });
                });
            } else {
                // Local department-only aggregation (Audit, PESTEL, Deep)
                const [auditRes, pestelRes, deepRes] = await Promise.all([
                    window.api.get(`/api/dept/analysis?dept=${mode}&type=AUDIT`).catch(() => null),
                    window.api.get(`/api/dept/analysis?dept=${mode}&type=PESTEL`).catch(() => null),
                    window.api.get(`/api/dept/analysis?dept=${mode}&type=DEEP_ANALYSIS`).catch(() => null)
                ]);

                if (auditRes?.data) {
                    const ad = auditRes.data;
                    if (ad.score < 50) results.weaknesses.push('[تدقيق] ضعف في مستوى الامتثال العام');
                    if (ad.meta?.violations > 0) results.weaknesses.push(`[تدقيق] وجود ${ad.meta.violations} مخالفات`);
                }
                if (pestelRes?.data) {
                    Object.values(pestelRes.data).forEach(v => {
                        if (typeof v === 'string' && v.length > 5) {
                            v.split('\n').forEach(line => {
                                if (line.includes('خطر')) results.threats.push(`[بستل] ${line.trim()}`);
                                else results.opportunities.push(`[بستل] ${line.trim()}`);
                            });
                        }
                    });
                }
                if (deepRes?.data) {
                    const dd = deepRes.data;
                    const challenge = dd.mainChallenge || dd.main_challenge;
                    if (challenge) results.weaknesses.push(`[عميق] ${challenge}`);
                }
            }

            // Global diagnostic data (Diagnostic Wizard)
            if (diagData) {
                if (diagData.gov === 'advanced') results.strengths.push('[تشخيص] حوكمة مؤسسية قوية');
                if (diagData.digital === 'high') results.strengths.push('[تشخيص] نضج رقمي عالي');
            }

            return results;
        } catch (err) {
            console.error('[StrategicSynthesis Error]', err);
            return results;
        }
    },

    /**
     * Generates cross-departmental strategy suggestions for TOWS.
     */
    generateCorporateStrategies(s, w, o, t) {
        const strats = { so: [], wo: [], st: [], wt: [] };

        const hasHr = (arr) => arr.some(x => x.includes('[HR]'));
        const hasFinance = (arr) => arr.some(x => x.includes('[مالية]'));
        const hasOperations = (arr) => arr.some(x => x.includes('[عمليات]'));
        const hasAudit = (arr) => arr.some(x => x.includes('[تدقيق]'));

        // SO: Strong departments pushing into opportunities
        if (s.length && o.length) {
            strats.so.push("تكامل قوى الإدارات القيادية لفتح أسواق أو منتجات جديدة");
            if (hasHr(s)) strats.so.push("رفع كفاءة رأس المال البشري القوي لاستكشاف آفاق توسع جديدة");
            if (hasOperations(s)) strats.so.push("استثمار الانضباط التشغيلي في تسريع وتيرة النمو");
            strats.so.push("تعزيز التكامل الرأسي بين الإدارات القوية لتقليل التكاليف وزيادة الربحية");
            strats.so.push("استغلال السمعة المؤسسية القوية للتوسع في قطاعات مجاورة");
        }

        // WO: Opportunities covering weak spots
        if (w.length && o.length) {
            strats.wo.push("توظيف الفرص التقنية الخارجية لسد فجوات الإدارات المتعثرة");
            if (hasAudit(w)) strats.wo.push("معالجة فجوات التدقيق عبر أدوات أتمتة ورقابة حديثة");
            if (hasHr(w)) strats.wo.push("استقطاب كفاءات خارجية لسد النقص المعرفي في الأقسام الضعيفة");
            strats.wo.push("إعادة هندسة العمليات الضعيفة بالاستفادة من التغيرات التنظيمية الجديدة");
            strats.wo.push("الاستثمار في التحول الرقمي لمعالجة البيروقراطية في الإدارات ذات الإنتاجية المنخفضة");
        }

        // ST: Defending against threats
        if (s.length >= 1 && t.length >= 1) {
            strats.st.push("استخدام استقرار الإدارات القوية كدرع ضد المتغيرات الاقتصادية");
            if (hasFinance(s)) strats.st.push("تعزيز الملاءة المالية لمواجهة تقلبات السوق وارتفاع التكاليف");
            strats.st.push("تنويع مصادر الإيرادات استناداً إلى نقاط القوة الأساسية للمنشأة");
            strats.st.push("استخدام الريادة التقنية للمنشأة لرفع حواجز الدخول أمام المنافسين الجدد");
            strats.st.push("توظيف الكفاءات القيادية في وضع خطط استباقية لمواجهة المخاطر السيبرانية");
        } else if (s.length >= 1) {
            // Fallback if threats are zero but strengths exist - generic defensive
            strats.st.push("تعزيز التحصين المؤسسي عبر استثمار الكفاءات الحالية في الرقابة الداخلية");
        }

        // WT: Critical risk mitigation
        if (w.length >= 1 && t.length >= 1) {
            strats.wt.push("خطة طوارئ عاجلة للأقسام التي تعاني من فجوات امتثال ومخاطر عالية");
            if (hasAudit(w)) strats.wt.push("تصحيح مسار الأقسام ذات الإنذارات الحمراء لتجنب العقوبات القانونية");
            strats.wt.push("إعادة هيكلة العمليات في المناطق ذات المخاطر التشغيلية المرتفعة");
            strats.wt.push("تقليص الأنشطة غير الأساسية في الإدارات الضعيفة لتركيز الموارد على الحماية");
            strats.wt.push("البحث عن تحالفات استراتيجية لتوزيع مخاطر السوق التي يصعب مواجهتها منفردين");
        } else if (w.length >= 1) {
            strats.wt.push("وضع إطار لإدارة المخاطر يعالج نقاط الضعف المسجلة في التدقيق");
        }

        return strats;
    },

    generateCorporateScenarios() {
        return {
            pessimistic: "انكماش حاد في الاقتصاد الكلي، تعثر سلاسل الإمداد العالمية، ونقص حاد في المواهب التقنية مما يؤدي لتباطؤ النمو بنسبة 20%.",
            realistic: "نمو مستقر مدفوع بالتحول الرقمي، استقرار في الطلب المحلي مع توسع تدريجي في الأسواق الإقليمية، وتوازن بين التكاليف والإيرادات.",
            optimistic: "طفرة اقتصادية وفتح أسواق جديدة، نجاح مبادرات التحول الرقمي بالكامل، واكتساب حصة سوقية قيادية مع زيادة الأرباح بنسبة 40%."
        };
    },

    generateCorporateVisionMission() {
        return {
            vision: [
                "أن نكون المنظمة الرائدة عالمياً في تقديم حلول متكاملة ومستدامة تفوق توقعات عملائنا",
                "تحقيق الريادة والابتكار في قطاعنا لتمكين مجتمع أكثر نماءً واستقراراً",
                "بناء صرح مؤسسي يتسم بالكفاءة والتحول الرقمي لضمان مستقبل مستدام للأجيال القادمة"
            ],
            mission: [
                "تقديم منتجات وخدمات عالية الجودة تعزز من قيمة حياة عملائنا وتدفع عجلة الاقتصاد",
                "الالتزام بالتميز التشغيلي والابتكار المستمر لتطوير حلول ذكية تلبي احتياجات الأسواق المتغيرة",
                "تمكين شركائنا وموظفينا من خلال بيئة عمل محفزة ومستدامة تضمن النمو المتبادل"
            ],
            values: [
                "النزاهة والشفافية في كل تعاملاتنا",
                "الابتكار المستمر كطريق للتميز",
                "التمكين والعمل الجماعي لتعظيم الأثر",
                "التركيز على العميل وقياس الاستدامة"
            ]
        };
    }
};
