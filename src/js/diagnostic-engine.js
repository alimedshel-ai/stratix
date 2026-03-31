/**
 * Startix — Diagnostic Engine v2.4 (Bulletproof Edition)
 * المحرك المركزي لتحديد المسار الاستراتيجي — الربط بين UI والمنطق الاستشاري.
 */

export const DiagnosticEngine = (function () {
    'use strict';

    // ═══════════════════════════════════════════
    // 1. خريطة تحديد المسار — صاحب مشروع (Owner)
    // ═══════════════════════════════════════════

    function determineOwnerPath(answers) {
        const { stage, entity_size, sector, fin, res, gov, scale, exit } = answers;

        // ١. تصنيف الحجم (تطابق مع UI)
        const sizeCategory = classifySize(entity_size);

        // ٢. قواعد التوجيه الاستراتيجي (Forensic Logic)
        let patternKey = 'default_strategic';
        let reason = 'مسار تطوير استراتيجي شامل يغطي الجوانب المالية، التنظيمية والحوكمة في المنشأة.';

        // أولوية ١: مسار الطوارئ (Emergency)
        if (res === 'critical' || stage === 'struggle') {
            patternKey = 'emergency_risk';
            reason = 'تنبيه: المنشأة تمر بمرحلة حرجة (نقص سيولة/تعثر). الأولوية القصوى لتأمين الوضع المالي وإدارة الأزمات.';
        }
        // أولوية ٢: مسار الفوضى (Ordered Chaos)
        else if (stage === 'scaling' && (gov === 'none' || gov === 'partial')) {
            patternKey = 'growing_chaotic';
            reason = 'النمو سريع لكن النظام غائب. المسار يركز على بناء الهياكل واللوائح (SOPs) لدعم التوسع الآمن.';
        }
        // أولوية ٣: مسار التميز (Market Leader)
        else if (scale === 'easy' && fin === 'perfect' && stage === 'stable') {
            patternKey = 'mature_competitive';
            reason = 'المعطيات تشير لفرصة ريادة حقيقية. المسار يركز على الابتكار، التوسع الدولي، وتعزيز التميز التنافسي.';
        }
        // أولوية ٤: التأسيس (Startup)
        else if (stage === 'startup') {
            patternKey = 'nascent_cautious';
            reason = 'المرحلة تتطلب بناء أساسات صلبة من البداية. المسار يوفر خارطة طريق للتأسيس المستدام وتفادي أخطاء البدايات.';
        }

        // ٣. حقن بيانات القطاع (Sector Identity)
        const SECTOR_DATA = {
            service: { name: 'القطاع الخدمي', emoji: '💼', color: '#3b82f6' },
            commercial: { name: 'القطاع التجاري', emoji: '🏪', color: '#f59e0b' },
            industrial: { name: 'القطاع الصناعي', emoji: '🏭', color: '#10b981' },
            gov: { name: 'القطاع الحكومي', emoji: '🏛️', color: '#ef4444' },
            sectoral: { name: 'القطاعي / شبه حكومي', emoji: '🤝', color: '#8b5cf6' },
            non_profit: { name: 'قطاع غير ربحي', emoji: '🤲', color: '#6366f1' }
        };

        const sd = SECTOR_DATA[sector] || SECTOR_DATA.service;

        return {
            category: 'owner',
            patternKey,
            reason,
            sizeCategory,
            userType: 'OWNER',
            name: sd.name,
            emoji: sd.emoji,
            color: sd.color,
            dashboardPath: '/dashboard.html',
            answers: { ...answers, size: entity_size, maturity: stage }
        };
    }

    // ═══════════════════════════════════════════
    // 2. خريطة تحديد المسار — مدير إدارة (Manager)
    // ═══════════════════════════════════════════

    function determineManagerPath(answers) {
        const {
            department, teamSize, dept_governance, dept_kpi_tracking,
            digital_maturity, agility, innovation, challenge
        } = answers;

        const DEPT_MAP = {
            hr: { name: 'الموارد البشرية', emoji: '👥', color: '#8b5cf6', icon: 'bi-people-fill' },
            finance: { name: 'المالية', emoji: '💰', color: '#10b981', icon: 'bi-cash-coin' },
            marketing: { name: 'التسويق', emoji: '📢', color: '#f59e0b', icon: 'bi-megaphone-fill' },
            operations: { name: 'العمليات', emoji: '⚙️', color: '#6b7280', icon: 'bi-gear-wide-connected' },
            it: { name: 'التقنية', emoji: '💻', color: '#3b82f6', icon: 'bi-cpu' },
            sales: { name: 'المبيعات', emoji: '🎯', color: '#f59e0b', icon: 'bi-bullseye' },
            logistics: { name: 'اللوجستيات', emoji: '🚚', color: '#6b7280', icon: 'bi-truck' },
            governance: { name: 'الحوكمة والامتثال', emoji: '🏛️', color: '#ef4444', icon: 'bi-shield-check' }
        };

        let dept = DEPT_MAP[department] || DEPT_MAP.hr;

        // Custom Reasoning for Departments
        let reason = `مسار متخصص لتحليل نضج إدارة ${dept.name} ورفع كفاءتها الاستراتيجية.`;
        if (dept_governance === 'none') reason = `تفتقد إدارة ${dept.name} للتوثيق الإجرائي؛ مما يسبب هدر الاستمرارية بدوران الكوادر.`;
        else if (dept_kpi_tracking === 'none' || dept_kpi_tracking === 'vague') reason = `تدار إدارة ${dept.name} بدون لوحة مؤشرات واضحة؛ المسار سيبني لك نظام قياس للأداء.`;

        return {
            category: 'manager',
            department: department || 'hr',
            userType: 'DEPT_MANAGER',
            name: dept.name,
            emoji: dept.emoji,
            color: dept.color,
            icon: dept.icon,
            dashboardPath: '/dept-dashboard.html',
            deptDeepPath: `/dept-deep.html?dept=${department || 'hr'}&single=1`,
            reason,
            sizeCategory: classifySize(teamSize),
            answers
        };
    }

    // ═══════════════════════════════════════════
    // 3. دوال مساعدة (Storage & Helpers)
    // ═══════════════════════════════════════════

    function classifySize(size) {
        if (!size) return 'medium';
        const s = String(size).toLowerCase();
        // دعم المسميات الجديدة والقديمة
        if (['micro', 'pico', 'small', 'أقل من ٥', 'أقل من ٣'].includes(s)) return 'small';
        if (['medium', '٢١-١٠٠ شخص', '١٠ - ٣٠', '٥-٢٠ شخص', '٣ - ١٠'].includes(s)) return 'medium';
        if (['large', 'أكثر من ١٠٠ شخص', 'أكثر من ٣٠'].includes(s)) return 'large';
        return 'medium';
    }

    function saveToSession(result) {
        try {
            sessionStorage.setItem('diagnosticResult', JSON.stringify(result));
            sessionStorage.setItem('diagnosticTimestamp', new Date().toISOString());
        } catch (e) { console.error('Engine Save Error:', e); }
    }

    function getFromSession() {
        try {
            const raw = sessionStorage.getItem('diagnosticResult');
            if (!raw) return null;
            const res = JSON.parse(raw);

            // تحقق من الصلاحية (24 ساعة)
            const ts = sessionStorage.getItem('diagnosticTimestamp');
            if (ts && (new Date() - new Date(ts)) > 24 * 60 * 60 * 1000) return null;

            return res;
        } catch (e) { return null; }
    }

    function clearSession() {
        sessionStorage.removeItem('diagnosticResult');
        sessionStorage.removeItem('diagnosticTimestamp');
    }

    function promoteToLocalStorage() {
        try {
            const res = getFromSession();
            if (!res) return false;

            // Dual-write Patterns
            if (res.patternKey) {
                localStorage.setItem('painAmbition', JSON.stringify({
                    patternKey: res.patternKey,
                    category: res.category,
                    sizeCategory: res.sizeCategory,
                    diagnosticAnswers: res.answers,
                    diagnosticDate: new Date().toISOString()
                }));
            }

            localStorage.setItem('stratix_diagnostic_payload', JSON.stringify(res));

            // Sync for Login/Sidebar
            if (res.category === 'manager') {
                localStorage.setItem('stratix_user_type', 'DEPT_MANAGER');
                localStorage.setItem('stratix_dept', res.department);
            } else {
                localStorage.setItem('stratix_user_type', 'BUSINESS');
            }

            return true;
        } catch (e) { return false; }
    }

    return {
        determineOwnerPath,
        determineManagerPath,
        saveToSession,
        getFromSession,
        promoteToLocalStorage,
        clearSession,
        classifySize,
        VERSION: '2.4.0'
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiagnosticEngine;
}
