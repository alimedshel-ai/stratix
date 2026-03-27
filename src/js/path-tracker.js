// js/path-tracker.js
(function () {
    // تعريف الخطوات حسب الدور
    const STEPS = {
        owner: [
            { id: 'swot', name: 'تحليل SWOT', path: '/swot.html' },
            { id: 'directions', name: 'التوجهات', path: '/directions.html' },
            { id: 'objectives', name: 'الأهداف', path: '/objectives.html' },
            { id: 'initiatives', name: 'المبادرات', path: '/initiatives.html' },
            { id: 'kpis', name: 'مؤشرات الأداء', path: '/kpis.html' }
        ],
        dept_manager: [
            { id: 'deep', name: 'التحليل الرقمي', path: null },
            { id: 'audit', name: 'التقييم الوصفي', path: null },
            { id: 'swot', name: 'تحليل SWOT', path: '/swot.html' },
            { id: 'directions', name: 'توجهات القسم', path: '/directions.html' },
            { id: 'objectives', name: 'أهداف القسم', path: '/objectives.html' }
        ]
    };

    // إضافة CSS في حالة عدم وجودها
    function ensureStyles() {
        if (document.getElementById('stepper-styles')) return;
        const style = document.createElement('style');
        style.id = 'stepper-styles';
        style.textContent = `
            .stepper-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #1a1d2e;
                border-radius: 16px;
                padding: 12px 20px;
                margin-bottom: 24px;
                border: 1px solid rgba(255,255,255,0.1);
                flex-wrap: wrap;
                gap: 8px;
            }
            .stepper-step {
                display: flex;
                align-items: center;
                font-size: 13px;
                font-weight: 600;
            }
            .stepper-step a {
                text-decoration: none;
                color: inherit;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .step-indicator {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            }
            .stepper-step.completed .step-indicator {
                background: #22c55e;
                color: white;
            }
            .stepper-step.active .step-indicator {
                background: #3b82f6;
                color: white;
            }
            .stepper-step.active .step-name {
                color: #3b82f6;
                font-weight: 800;
            }
            .stepper-arrow {
                color: #94a3b8;
                font-size: 14px;
                margin: 0 4px;
            }
            @media (max-width: 768px) {
                .stepper-step .step-name { display: none; }
            }
        `;
        document.head.appendChild(style);
    }

    function getCurrentStepId() {
        const path = window.location.pathname;
        if (path.includes('swot')) return 'swot';
        if (path.includes('directions')) return 'directions';
        if (path.includes('objectives')) return 'objectives';
        if (path.includes('initiatives')) return 'initiatives';
        if (path.includes('kpis')) return 'kpis';
        if (path.includes('-deep')) return 'deep';
        if (path.includes('-audit')) return 'audit';
        return '';
    }

    async function renderStepper() {
        const role = Context.getUserRole();
        const steps = STEPS[role];
        if (!steps) return;

        // التحقق من وجود الحاوية
        let container = document.getElementById('stepper-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'stepper-container';
            container.className = 'stepper-container';
            const mainContent = document.querySelector('.main-content') || document.body;
            mainContent.insertBefore(container, mainContent.firstChild);
        }

        ensureStyles();

        // جلب حالة الإكمال لكل الخطوات بالتوازي
        const completedResults = await Promise.all(
            steps.map(step => Context.isStepCompleted(step.id).catch(() => false))
        );

        const dept = Context.getDept();
        const currentStepId = getCurrentStepId();

        // تفريغ الحاوية بطريقة آمنة (بدون innerHTML)
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        steps.forEach((step, i) => {
            const completed = completedResults[i];
            const isActive = step.id === currentStepId;

            // بناء الرابط مع ترميز الـ dept
            let href = step.path;
            if (role === 'dept_manager' && (step.id === 'deep' || step.id === 'audit')) {
                const safeDept = encodeURIComponent(dept);
                href = `/${safeDept}-${step.id}.html?dept=${safeDept}`;
            } else if (step.path) {
                const safeDept = dept ? encodeURIComponent(dept) : '';
                href = safeDept ? `${step.path}?dept=${safeDept}` : step.path;
            }

            // إنشاء عنصر الخطوة
            const stepDiv = document.createElement('div');
            stepDiv.className = `stepper-step ${completed ? 'completed' : (isActive ? 'active' : '')}`;
            if (!completed && !isActive) {
                stepDiv.style.pointerEvents = 'none';
                stepDiv.style.opacity = '0.5';
            }

            const link = document.createElement('a');
            link.href = href;
            link.style.textDecoration = 'none';
            link.style.color = 'inherit';
            link.style.display = 'flex';
            link.style.alignItems = 'center';
            link.style.gap = '8px';

            const indicator = document.createElement('div');
            indicator.className = 'step-indicator';
            indicator.textContent = completed ? '✓' : (i + 1).toString();

            const nameSpan = document.createElement('span');
            nameSpan.className = 'step-name';
            nameSpan.textContent = step.name;

            link.appendChild(indicator);
            link.appendChild(nameSpan);
            stepDiv.appendChild(link);

            container.appendChild(stepDiv);

            // إضافة السهم ما عدا آخر خطوة
            if (i < steps.length - 1) {
                const arrow = document.createElement('div');
                arrow.className = 'stepper-arrow';
                arrow.textContent = '→';
                container.appendChild(arrow);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderStepper);
    } else {
        renderStepper();
    }
})();
