// @ts-nocheck
/**
 * Interactive Audit Engine
 * محرك الفحص التفاعلي الشامل
 */

class InteractiveAuditEngine {
    constructor() {
        this.systems = new Map();
        this.results = new Map();
        this.currentSystem = null;
        this.totalScore = 0;
        this.confidenceScores = new Map();

        this.init();
    }

    init() {
        this.registerSimulators();
        this.setupEventListeners();
        this.renderProgressTracker();
    }

    // ===== نظام التسجيل =====
    registerSimulators() {
        // 1. نظام الحضور والانصراف (البصمة)
        this.registerSystem('attendance', {
            name: 'نظام الحضور والانصراف',
            icon: 'bi-fingerprint',
            simulators: ['fingerprint', 'manual-entry', 'integration-test'],
            validators: ['time-calculation', 'overtime-rules', 'leave-balance'],
            weight: 0.15
        });

        // 2. نظام الرواتب
        this.registerSystem('payroll', {
            name: 'نظام الرواتب',
            icon: 'bi-cash-stack',
            simulators: ['salary-calc', 'deductions', 'payslip'],
            validators: ['tax-calculation', 'social-insurance', 'bank-transfer'],
            weight: 0.20
        });

        // 3. نظام إدارة المواهب
        this.registerSystem('talent', {
            name: 'إدارة المواهب والتعاقدات',
            icon: 'bi-people',
            simulators: ['contract-workflow', 'approval-chain'],
            validators: ['compliance-check', 'document-integrity'],
            weight: 0.10
        });

        // ... تسجيل باقي الأنظمة الـ 9
        this.registerSystem('performance', { name: 'إدارة الأداء', weight: 0.10 });
        this.registerSystem('training', { name: 'التدريب والتطوير', weight: 0.08 });
        this.registerSystem('succession', { name: 'التعاقب الوظيفي', weight: 0.05 });
        this.registerSystem('analytics', { name: 'التحليلات والتقارير', weight: 0.07 });
        this.registerSystem('employee', { name: 'خدمات الموظفين', weight: 0.08 });
        this.registerSystem('compliance', { name: 'الامتثال والسياسات', weight: 0.07 });
        this.registerSystem('recruitment', { name: 'التوظيف', weight: 0.05 });
        this.registerSystem('compensation', { name: 'التعويضات والمزايا', weight: 0.05 });
    }

    registerSystem(id, config) {
        this.systems.set(id, {
            id,
            score: 0,
            confidence: 0,
            testsCompleted: 0,
            totalTests: 0,
            ...config
        });
    }

    // ===== محاكي البصمة =====
    async simulateFingerprint() {
        const scanner = document.querySelector('.fingerprint-scanner');
        const resultDiv = document.getElementById('fingerprint-result');

        // بدء المسح
        scanner.classList.add('scanning');
        resultDiv.innerHTML = '<div class="text-center">جاري المسح...</div>';

        // محاكاة وقت المسح (2 ثانية)
        await this.delay(2000);

        // توليد نتيجة عشوائية واقعية (80% نجاح)
        const isSuccess = Math.random() > 0.2;
        const scanTime = 800 + Math.random() * 1200; // 800-2000ms

        scanner.classList.remove('scanning');

        if (isSuccess) {
            scanner.classList.add('success');
            this.recordTestResult('attendance', 'fingerprint', {
                success: true,
                scanTime,
                quality: 0.85 + Math.random() * 0.15,
                timestamp: new Date()
            });

            resultDiv.innerHTML = `
                <div class="result-panel success show">
                    <h4>✓ مسح ناجح</h4>
                    <p>الوقت: ${scanTime.toFixed(0)} مللي ثانية</p>
                    <p>جودة البصمة: ${(0.85 + Math.random() * 0.15).toFixed(2)}%</p>
                    <span class="confidence-badge confidence-high">
                        ثقة عالية
                    </span>
                </div>
            `;
        } else {
            scanner.classList.add('error');
            this.recordTestResult('attendance', 'fingerprint', {
                success: false,
                error: 'بصمة غير واضحة',
                timestamp: new Date()
            });

            resultDiv.innerHTML = `
                <div class="result-panel danger show">
                    <h4>✗ فشل المسح</h4>
                    <p>السبب: بصمة غير واضحة أو ضغط خفيف</p>
                    <button class="test-btn" onclick="auditEngine.simulateFingerprint()">
                        إعادة المحاولة
                    </button>
                </div>
            `;
        }

        this.updateSystemScore('attendance');
    }

    // ===== حاسبة الرواتب التفاعلية =====
    calculateSalary() {
        const basicSalary = parseFloat(document.getElementById('basic-salary').value) || 0;
        const allowances = parseFloat(document.getElementById('allowances').value) || 0;
        const deductions = parseFloat(document.getElementById('deductions').value) || 0;
        const overtime = parseFloat(document.getElementById('overtime').value) || 0;

        // حسابات قانونية (نموذج سعودي)
        const grossSalary = basicSalary + allowances + (overtime * 1.5);
        const socialInsurance = basicSalary * 0.0975; // 9.75% للسعودي
        const taxableIncome = grossSalary - socialInsurance - deductions;
        const tax = this.calculateTax(taxableIncome);
        const netSalary = grossSalary - socialInsurance - tax - deductions;

        // التحقق من القواعد
        const validations = this.validatePayroll({
            basicSalary, allowances, deductions, overtime,
            grossSalary, socialInsurance, tax, netSalary
        });

        const resultDiv = document.getElementById('payroll-result');
        const isValid = validations.every(v => v.passed);

        this.recordTestResult('payroll', 'calculation', {
            inputs: { basicSalary, allowances, deductions, overtime },
            outputs: { grossSalary, netSalary, tax, socialInsurance },
            validations,
            isValid,
            timestamp: new Date()
        });

        resultDiv.innerHTML = `
            <div class="result-panel ${isValid ? 'success' : 'warning'} show">
                <h4>${isValid ? '✓' : '⚠'} نتيجة الحساب</h4>
                <div class="grid-2">
                    <div>
                        <strong>الراتب الأساسي:</strong> ${basicSalary.toFixed(2)} ر.س
                    </div>
                    <div>
                        <strong>البدلات:</strong> ${allowances.toFixed(2)} ر.س
                    </div>
                    <div>
                        <strong>الإضافي:</strong> ${(overtime * 1.5).toFixed(2)} ر.س
                    </div>
                    <div>
                        <strong>الإجمالي:</strong> ${grossSalary.toFixed(2)} ر.س
                    </div>
                    <div class="text-danger">
                        <strong>التأمينات:</strong> -${socialInsurance.toFixed(2)} ر.س
                    </div>
                    <div class="text-danger">
                        <strong>الضريبة:</strong> -${tax.toFixed(2)} ر.س
                    </div>
                    <div class="text-danger">
                        <strong>الاستقطاعات:</strong> -${deductions.toFixed(2)} ر.س
                    </div>
                    <div class="text-success font-bold">
                        <strong>الصافي:</strong> ${netSalary.toFixed(2)} ر.س
                    </div>
                </div>
                ${!isValid ? `
                    <div class="mt-3 p-2 bg-red-50 rounded">
                        <strong>ملاحظات:</strong>
                        <ul class="mt-1">
                            ${validations.filter(v => !v.passed).map(v => `<li>${v.message}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <span class="confidence-badge ${isValid ? 'confidence-high' : 'confidence-medium'} mt-2">
                    ${isValid ? 'حساب دقيق' : 'يحتاج مراجعة'}
                </span>
            </div>
        `;

        this.updateSystemScore('payroll');
    }

    calculateTax(income) {
        // نموذج مبسط للضريبة السعودية
        if (income <= 0) return 0;
        // يمكن إضافة شرائح ضريبية أكثر تعقيداً
        return income > 10000 ? (income - 10000) * 0.05 : 0;
    }

    validatePayroll(data) {
        const validations = [];

        // التحقق من الحد الأدنى للراتب
        validations.push({
            rule: 'minimum_wage',
            passed: data.basicSalary >= 4000,
            message: 'الراتب الأساسي أقل من الحد الأدنى (4000 ر.س)'
        });

        // التحقق من نسبة البدلات
        const allowanceRatio = data.allowances / data.basicSalary;
        validations.push({
            rule: 'allowance_ratio',
            passed: allowanceRatio <= 0.5,
            message: 'نسبة البدلات تتجاوز 50% من الأساسي (مخالفة)'
        });

        // التحقق من صافي الراتب
        validations.push({
            rule: 'positive_net',
            passed: data.netSalary > 0,
            message: 'صافي الراتب سالب!'
        });

        return validations;
    }

    // ===== اختبار التكامل بين الأنظمة =====
    async testIntegration(system1, system2) {
        const flow = document.getElementById('integration-flow');
        const node1 = flow.querySelector(`[data-system="${system1}"]`);
        const node2 = flow.querySelector(`[data-system="${system2}"]`);
        const line = flow.querySelector('.connection-line');

        // تنشيط العقدة الأولى
        node1.classList.add('active');
        await this.delay(500);

        // محاكاة الاتصال
        line.classList.add('active');
        await this.delay(1000);

        // اختبار الاتصال (80% نجاح)
        const isConnected = Math.random() > 0.2;

        if (isConnected) {
            node2.classList.add('active');
            line.classList.add('active');

            this.recordTestResult('integration', `${system1}-${system2}`, {
                connected: true,
                latency: 50 + Math.random() * 100,
                dataIntegrity: 0.95 + Math.random() * 0.05
            });

            this.showToast(`✓ الاتصال بين ${system1} و ${system2} ناجح`, 'success');
        } else {
            line.classList.add('error');
            node2.classList.add('error');

            this.recordTestResult('integration', `${system1}-${system2}`, {
                connected: false,
                error: 'timeout',
                latency: null
            });

            this.showToast(`✗ فشل الاتصال بين ${system1} و ${system2}`, 'error');
        }

        await this.delay(2000);

        // إعادة الضبط
        node1.classList.remove('active');
        node2.classList.remove('active', 'error');
        line.classList.remove('active', 'error');
    }

    // ===== مسار التعاقد التفاعلي =====
    async simulateContractWorkflow() {
        const steps = ['request', 'hr-review', 'legal-review', 'manager-approval', 'signature'];
        const currentStep = 0;

        for (let i = 0; i < steps.length; i++) {
            const stepEl = document.getElementById(`step-${steps[i]}`);
            stepEl.classList.add('active');

            // محاكاة وقت المعالجة
            await this.delay(800);

            // 10% احتمالية رفض في كل خطوة
            if (Math.random() < 0.1) {
                stepEl.classList.remove('active');
                stepEl.classList.add('error');

                this.recordTestResult('talent', 'workflow', {
                    completed: false,
                    failedAt: steps[i],
                    duration: i * 800
                });

                this.showToast(`توقف في خطوة: ${steps[i]}`, 'warning');
                return;
            }

            stepEl.classList.remove('active');
            stepEl.classList.add('success');
        }

        this.recordTestResult('talent', 'workflow', {
            completed: true,
            duration: steps.length * 800,
            efficiency: 0.9
        });

        this.showToast('✓ مسار التعاقد اكتمل بنجاح', 'success');
        this.updateSystemScore('talent');
    }

    // ===== نظام التسجيل والتقييم =====
    recordTestResult(systemId, testType, data) {
        const key = `${systemId}-${testType}`;
        this.results.set(key, {
            systemId,
            testType,
            ...data,
            confidence: this.calculateConfidence(data)
        });

        this.confidenceScores.set(key, this.calculateConfidence(data));
    }

    calculateConfidence(data) {
        let confidence = 0.5; // قاعدة

        if (data.success || data.connected || data.completed) confidence += 0.3;
        if (data.timestamp) confidence += 0.1;
        if (data.quality > 0.8 || data.dataIntegrity > 0.9) confidence += 0.1;

        return Math.min(confidence, 1.0);
    }

    updateSystemScore(systemId) {
        const system = this.systems.get(systemId);
        const systemResults = Array.from(this.results.values())
            .filter(r => r.systemId === systemId);

        if (systemResults.length === 0) return;

        const avgScore = systemResults.reduce((sum, r) =>
            sum + (r.success || r.connected || r.completed ? 1 : 0), 0
        ) / systemResults.length * 100;

        const avgConfidence = systemResults.reduce((sum, r) =>
            sum + (r.confidence || 0), 0
        ) / systemResults.length;

        system.score = avgScore;
        system.confidence = avgConfidence;
        system.testsCompleted = systemResults.length;

        this.updateProgressTracker();
        this.updateScoreMeter();
        this.analyzeSWOTImplications(systemId);
    }

    // ===== واجهة المستخدم =====
    updateScoreMeter() {
        const totalSystems = this.systems.size;
        const completedSystems = Array.from(this.systems.values())
            .filter(s => s.testsCompleted > 0).length;

        const overallScore = Array.from(this.systems.values())
            .reduce((sum, s) => sum + (s.score * s.weight), 0);

        const meter = document.querySelector('.score-circle');
        const value = document.querySelector('.score-value');

        if (meter && value) {
            const degrees = (overallScore / 100) * 360;
            meter.style.background = `conic-gradient(var(--primary) ${degrees}deg, #e2e8f0 ${degrees}deg)`;
            value.textContent = Math.round(overallScore);
        }
    }

    updateProgressTracker() {
        const totalTests = Array.from(this.systems.values())
            .reduce((sum, s) => sum + s.totalTests, 0);
        const completedTests = Array.from(this.results.values()).length;

        const percentage = (completedTests / totalTests) * 100;

        const fill = document.querySelector('.progress-fill');
        const text = document.querySelector('.progress-text');

        if (fill) fill.style.width = `${percentage}%`;
        if (text) text.textContent = `${completedTests}/${totalTests} اختبار مكتمل`;
    }

    renderProgressTracker() {
        const container = document.getElementById('audit-progress');
        if (!container) return;

        container.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold">تقدم الفحص التفاعلي</span>
                <span class="progress-text text-sm text-gray-600">0/${this.systems.size * 3} اختبار</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;
    }

    // ===== SWOT Integration (الربط التلقائي بـ SWOT) =====
    analyzeSWOTImplications(systemId) {
        const system = this.systems.get(systemId);
        if (!system || system.testsCompleted === 0) return;

        const swotKey = 'stratix_swot_suggestions';
        let suggestions = [];
        try {
            suggestions = JSON.parse(localStorage.getItem(swotKey) || '[]');
        } catch (e) { suggestions = []; }

        // تنظيف الاقتراحات القديمة لهذا النظام لتحديثها
        suggestions = suggestions.filter(s => s.systemId !== systemId);

        // تحليل النتيجة
        if (system.score >= 85) {
            suggestions.push({
                systemId,
                type: 'STRENGTH',
                title: `كفاءة ${system.name}`,
                description: `نظام ${system.name} يعمل بكفاءة وموثوقية عالية (${Math.round(system.score)}%)`
            });
        } else if (system.score < 60) {
            suggestions.push({
                systemId,
                type: 'WEAKNESS',
                title: `قصور في ${system.name}`,
                description: `أداء النظام منخفض (${Math.round(system.score)}%) ويحتاج تدخل عاجل`
            });
        }

        // حفظ الاقتراحات
        try {
            localStorage.setItem(swotKey, JSON.stringify(suggestions));
        } catch (e) { console.warn('Failed to save SWOT suggestions to localStorage'); }

        // إشعار المستخدم
        if (suggestions.some(s => s.systemId === systemId)) {
            this.showToast('تم تحديث مقترحات SWOT تلقائياً', 'info');
        }

        // إرسال حدث لتحديث الواجهة إن وجدت
        window.dispatchEvent(new CustomEvent('stratix-swot-updated', { detail: suggestions }));
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔍 التشخيص الشامل (أخطاء، تعارض، تكرار، تعليق)
    // ═══════════════════════════════════════════════════════════════
    runFullDiagnostics() {
        const report = {
            timestamp: new Date(),
            errors: [],
            conflicts: [],
            redundancies: [],
            comments: [],
            stats: {
                totalIssues: 0,
                securityScore: 100,
                storageWaste: '0KB'
            }
        };

        // 1. كشف الأخطاء (Failures)
        this.results.forEach((res, key) => {
            if (res.success === false || res.connected === false || res.completed === false) {
                const sys = this.systems.get(res.systemId);
                report.errors.push({
                    system: sys?.name || res.systemId,
                    test: res.testType,
                    msg: res.error || 'فشل في الاختبار التشغيلي',
                    resultKey: key
                });
            }
        });

        // 2. كشف التعارض (Conflicts - Logic Mismatch)
        const payroll = this.results.get('payroll-calculation');
        const attendance = this.results.get('attendance-fingerprint');
        const talent = this.results.get('talent-workflow');

        // تعارض 1: رواتب سليمة vs بصمة فاشلة
        if (payroll?.isValid && attendance?.success === false) {
            report.conflicts.push({
                source: 'الرواتب ↔ الحضور',
                msg: 'تم اعتماد مسير الرواتب رغم وجود مشاكل في بيانات الحضور (مخاطرة مالية)'
            });
        }
        // تعارض 2: توظيف مكتمل vs عدم وجود بصمة
        if (talent?.completed && !this.results.has('attendance-fingerprint')) {
            report.conflicts.push({
                source: 'التوظيف ↔ الحضور',
                msg: 'تم تعيين موظفين جدد ولم يتم تسجيلهم في نظام البصمة بعد'
            });
        }

        // 3. كشف التكرار (Redundancy)
        if (this.results.has('attendance-manual-entry') && this.results.has('attendance-fingerprint')) {
            report.redundancies.push({
                process: 'تسجيل الحضور',
                msg: 'ازدواجية: يتم استخدام الإدخال اليدوي والبصمة معاً (هدر للوقت)'
            });
        }

        // 4. فحص تنظيم الملفات (File Integrity & Organization)
        // محاكاة: إذا لم يتم التنظيم بعد، نظهر مشكلة
        if (!this._filesOptimized) {
            const wasteMB = Math.floor(Math.random() * 150) + 50; // 50-200MB
            report.stats.storageWaste = `${wasteMB}MB`;
            report.redundancies.push({
                process: 'أرشيف النظام',
                msg: `تراكم ملفات مؤقتة وتكرار في النسخ الاحتياطي (${wasteMB}MB)`,
                type: 'FILES' // علامة مميزة
            });
        }

        // 5. الإحصائيات والتعليق
        report.stats.totalIssues = report.errors.length + report.conflicts.length + report.redundancies.length;
        const score = this.calculateOverallScore();
        let sentiment = 'neutral';
        let text = '';

        if (score >= 85) {
            sentiment = 'positive';
            text = 'النظام يعمل بتناغم ممتاز. البيانات تتدفق بسلاسة، والمخاطر التشغيلية في أدنى مستوياتها.';
        } else if (score >= 60) {
            sentiment = 'neutral';
            text = 'النظام يعمل بشكل مقبول، لكن هناك فجوات في التكامل بين الرواتب والحضور تحتاج تدخلاً يدوياً.';
        } else {
            sentiment = 'negative';
            text = 'النظام يعاني من تفكك حاد. الاعتماد عليه بوضعه الحالي يشكل مخاطرة قانونية ومالية عالية.';
        }

        report.comments.push({ sentiment, text });

        this.renderDiagnosticsReport(report);
        return report;
    }

    renderDiagnosticsReport(report) {
        const container = document.getElementById('audit-report-container') || this.createReportContainer();
        if (!container) return; // Safe check for headless/test environments

        let html = `<div class="audit-report-card fade-in">
            <div class="report-header">
                <h3><i class="bi bi-clipboard-pulse"></i> تقرير الفحص الشامل</h3>
                <span class="report-date">${new Date().toLocaleTimeString('ar-SA')}</span>
            </div>
            
            <!-- إحصائيات سريعة -->
            <div class="report-stats">
                <div class="stat-item"><span class="stat-val text-danger">${report.errors.length}</span><span class="stat-lbl">أخطاء</span></div>
                <div class="stat-item"><span class="stat-val text-warning">${report.conflicts.length}</span><span class="stat-lbl">تعارض</span></div>
                <div class="stat-item"><span class="stat-val text-primary">${report.redundancies.length}</span><span class="stat-lbl">تكرار</span></div>
                <div class="stat-item"><span class="stat-val">${report.stats.totalIssues}</span><span class="stat-lbl">إجمالي</span></div>
            </div>
            <div class="stx-divider"></div>`;

        // Sections
        if (report.errors.length > 0) {
            html += `<div class="report-section section-danger">
                <div class="report-section-header">
                    <h4><i class="bi bi-x-circle-fill"></i> الأخطاء (${report.errors.length})</h4>
                    <button class="fix-btn" onclick="auditEngine.fixAllErrors()"><i class="bi bi-magic"></i> إصلاح الكل</button>
                </div>
                <ul class="error-list">
                    ${report.errors.map(e => `
                        <li>
                            <span>${e.msg} في <b>${e.system}</b></span>
                            <button class="fix-btn" onclick="auditEngine.autoFix('${e.resultKey}')">
                                <i class="bi bi-magic"></i> إصلاح تلقائي
                            </button>
                        </li>`).join('')}
                </ul>
            </div>`;
        } else {
            html += `<div class="report-section section-success"><i class="bi bi-check-circle-fill"></i> لا توجد أخطاء حرجة</div>`;
        }

        if (report.conflicts.length > 0) html += `<div class="report-section section-warning"><h4><i class="bi bi-exclamation-triangle-fill"></i> التعارضات المنطقية</h4><ul>${report.conflicts.map(c => `<li>${c.msg}</li>`).join('')}</ul></div>`;

        if (report.redundancies.length > 0) {
            html += `<div class="report-section section-info"><h4><i class="bi bi-layers-fill"></i> التكرار والهدر</h4>
            <ul class="error-list">${report.redundancies.map(r => `
                <li>
                    <span>${r.msg}</span>
                    ${r.type === 'FILES' ? `<button class="fix-btn" onclick="auditEngine.optimizeFiles()"><i class="bi bi-broom"></i> تنظيف وتنظيم</button>` : ''}
                </li>`).join('')}
            </ul></div>`;
        }

        const comment = report.comments[0];
        html += `<div class="report-verdict ${comment.sentiment}"><h4>💬 رأي النظام</h4><p>${comment.text}</p></div>`;
        html += this.renderHistory();
        html += `</div>`;

        container.innerHTML = html;
        container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    createReportContainer() {
        const section = document.querySelector('.interactive-audit-container');
        if (!section) return null; // Safe check
        const div = document.createElement('div');
        div.id = 'audit-report-container';
        section.appendChild(div);
        return div;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🛠️ الإصلاح التلقائي (Auto-Fix Simulation)
    // ═══════════════════════════════════════════════════════════════
    autoFix(key) {
        const res = this.results.get(key);
        if (!res) return;

        this.showToast('جاري تطبيق الإصلاح التلقائي...', 'info');

        setTimeout(() => {
            // تصحيح الحالة
            if (res.hasOwnProperty('success')) res.success = true;
            if (res.hasOwnProperty('connected')) res.connected = true;
            if (res.hasOwnProperty('completed')) res.completed = true;
            if (res.hasOwnProperty('isValid')) res.isValid = true;
            res.error = null;

            // تحديث النظام واعادة التشخيص
            this.updateSystemScore(res.systemId);
            this.runFullDiagnostics();
            this.showToast('تم إصلاح الخطأ بنجاح ✅', 'success');
        }, 1000);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ⚡ إصلاح الكل (Fix All Errors)
    // ═══════════════════════════════════════════════════════════════════
    fixAllErrors() {
        if (this.results.size === 0) return;

        this.showToast('جاري معالجة وإصلاح كافة المشاكل...', 'info');
        document.querySelectorAll('.simulator-card').forEach(el => el.classList.remove('crash-mode'));

        setTimeout(() => {
            const uniqueSystems = new Set();
            this.results.forEach((res) => {
                if (res.success === false || res.connected === false || res.completed === false || res.isValid === false) {
                    // تصحيح الحالة
                    if (res.hasOwnProperty('success')) res.success = true;
                    if (res.hasOwnProperty('connected')) res.connected = true;
                    if (res.hasOwnProperty('completed')) res.completed = true;
                    if (res.hasOwnProperty('isValid')) res.isValid = true;
                    res.error = null;
                    uniqueSystems.add(res.systemId);
                }
            });

            // تحديث الأنظمة المتأثرة
            uniqueSystems.forEach(sysId => this.updateSystemScore(sysId));

            this.runFullDiagnostics();
            this.showToast('تم تنظيف النظام بالكامل (System All Clear) 🛡️', 'success');
        }, 2000);
    }

    // ═══════════════════════════════════════════════════════════════
    // 🧹 تنظيم الملفات (File Optimization)
    // ═══════════════════════════════════════════════════════════════
    optimizeFiles() {
        this.showToast('جاري فحص التكرار وأرشفة الملفات...', 'info');

        setTimeout(() => {
            this._filesOptimized = true; // نضع علامة أن التنظيم تم
            this.runFullDiagnostics();   // إعادة التشخيص لتحديث التقرير
            this.showToast('تم حذف الملفات الزائدة وتنظيم الأرشيف ✅', 'success');
        }, 1500);
    }

    // ═══════════════════════════════════════════════════════════════
    // 📜 سجل الفحص (Audit History)
    // ═══════════════════════════════════════════════════════════════
    saveHistory(report) {
        const history = this.getHistory();
        const entry = {
            timestamp: report.timestamp,
            score: this.calculateOverallScore(),
            issuesCount: report.stats.totalIssues,
            conflicts: report.conflicts.length,
            errors: report.errors.length
        };

        // منع التكرار السريع (نفس الدقيقة)
        if (history.length > 0) {
            const lastTime = new Date(history[0].timestamp).getTime();
            const thisTime = new Date(entry.timestamp).getTime();
            if (thisTime - lastTime < 60000) return;
        }

        history.unshift(entry);
        if (history.length > 5) history.pop(); // الاحتفاظ بآخر 5

        try {
            localStorage.setItem('stratix_audit_history', JSON.stringify(history));
        } catch (e) { console.warn('Failed to save audit history'); }
    }

    getHistory() {
        try { return JSON.parse(localStorage.getItem('stratix_audit_history') || '[]'); } catch (e) { return []; }
    }

    renderHistory() {
        const history = this.getHistory();
        const previousRuns = history.slice(1);
        if (previousRuns.length === 0) return '';

        // إضافة الرسم البياني في الهيدر
        let html = `<div class="stx-divider"></div><div class="history-section">
            <div class="history-header">
                <h4><i class="bi bi-clock-history"></i> نتائج سابقة للمقارنة</h4>
                ${this.renderSparkline(history)}
            </div>
            <div class="history-grid">`;

        previousRuns.forEach(h => { const date = new Date(h.timestamp); html += `<div class="history-card"><div class="h-time" title="${date.toLocaleString()}">${date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div><div class="h-score ${h.score >= 80 ? 'good' : h.score < 50 ? 'bad' : 'mid'}">${Math.round(h.score)}%</div><div class="h-issues">${h.issuesCount} مشاكل</div></div>`; });
        return html + `</div></div>`;
    }

    renderSparkline(history) {
        if (history.length < 2) return '';
        const data = history.slice().reverse(); // ترتيب زمني (الأقدم لليسار)
        const width = 80, height = 25;

        const points = data.map((h, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - (h.score / 100) * height; // 100% في الأعلى (y=0)
            return `${x},${y}`;
        }).join(' ');

        return `<div class="sparkline-wrapper"><span class="spark-label">مسار التحسن:</span><svg viewBox="0 -5 ${width} ${height + 10}" class="sparkline-svg"><polyline points="${points}" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${width}" cy="${height - (data[data.length - 1].score / 100) * height}" r="3" fill="var(--primary)" /></svg></div>`;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🚀 الفحص الشامل الآلي (Run All Tests)
    // ═══════════════════════════════════════════════════════════════════
    async runAllTests() {
        this.showToast('🚀 جاري تشغيل الفحص الشامل لكافة الأنظمة...', 'info');

        // تصفير الواجهة
        document.querySelectorAll('.simulator-card').forEach(el =>
            el.classList.remove('success', 'warning', 'danger', 'active', 'crash-mode')
        );

        // 1. فحص البصمة
        const scanner = document.querySelector('.fingerprint-scanner');
        if (scanner) scanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.simulateFingerprint();
        await this.delay(500);

        // 2. الرواتب
        this.calculateSalary();
        await this.delay(500);

        // 3. التعاقد
        await this.simulateContractWorkflow();
        await this.delay(500);

        // 4. التكامل
        await this.testIntegration('attendance', 'payroll');

        // 5. التشخيص النهائي
        this.runFullDiagnostics();
    }

    // ===== أدوات مساعدة =====
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showToast(message, type = 'info') {
        // يمكن ربطها بنظام Toast الموجود
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    setupEventListeners() {
        // يتم ربط الأحداث ديناميكياً عند render كل simulator
    }

    // ===== التصدير =====
    exportResults() {
        return {
            timestamp: new Date(),
            systems: Object.fromEntries(this.systems),
            results: Object.fromEntries(this.results),
            overallScore: this.calculateOverallScore(),
            recommendations: this.generateRecommendations()
        };
    }

    calculateOverallScore() {
        return Array.from(this.systems.values())
            .reduce((sum, s) => sum + (s.score * s.weight), 0);
    }

    generateRecommendations() {
        const weakSystems = Array.from(this.systems.values())
            .filter(s => s.score < 60)
            .sort((a, b) => a.score - b.score);

        return weakSystems.map(s => ({
            system: s.name,
            priority: s.score < 40 ? 'critical' : 'high',
            action: s.score < 40 ? 'إعادة هيكلة فورية' : 'تحسين مطلوب',
            estimatedCost: this.estimateImprovementCost(s)
        }));
    }

    estimateImprovementCost(system) {
        // تقديرات مبدئية
        const baseCosts = {
            'attendance': 15000,
            'payroll': 25000,
            'talent': 20000,
            'performance': 10000,
            'training': 12000,
            'succession': 8000,
            'analytics': 18000,
            'employee': 10000,
            'compliance': 5000,
            'recruitment': 15000,
            'compensation': 12000
        };

        return baseCosts[system.id] * (1 + (100 - system.score) / 100);
    }
}

// ===== تهيئة عالمية =====
let auditEngine;

document.addEventListener('DOMContentLoaded', () => {
    auditEngine = new InteractiveAuditEngine();
});

// ===== دوال مساعدة للـ HTML =====
function simulateFingerprint() {
    auditEngine.simulateFingerprint();
}

function calculateSalary() {
    auditEngine.calculateSalary();
}

function testIntegration(s1, s2) {
    auditEngine.testIntegration(s1, s2);
}

function simulateContractWorkflow() {
    auditEngine.simulateContractWorkflow();
}

function runFullDiagnostics() {
    auditEngine.runFullDiagnostics();
}

function simulateSystemCrash() {
    auditEngine.simulateSystemCrash && auditEngine.simulateSystemCrash();
}

function runAllTests() {
    auditEngine.runAllTests && auditEngine.runAllTests();
}