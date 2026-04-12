/**
 * Report Engine v2 — محرك التقارير التنفيذي
 * تصميم نظيف للمدراء وأصحاب المصلحة
 */

window.ReportEngine = (function () {
    'use strict';

    let _config = null;
    const HTML2PDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js';
    let _html2pdfLoaded = false;

    function loadHtml2Pdf() {
        return new Promise((resolve, reject) => {
            if (_html2pdfLoaded || window.html2pdf) { _html2pdfLoaded = true; resolve(); return; }
            const s = document.createElement('script');
            s.src = HTML2PDF_CDN;
            s.onload = () => { _html2pdfLoaded = true; resolve(); };
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    // ═══ التهيئة ═══
    function init(config) {
        _config = config;
        injectButtons();
        injectModal();
    }

    function injectButtons() {
        const targets = [
            '.stx-header .d-flex.gap-2',
            '.mb-5 .d-flex.gap-2',
            '.d-flex.justify-content-between .d-flex.gap-2',
            '.d-flex.justify-content-between .d-flex.gap-3'
        ];
        let headerBtns = null;
        for (const sel of targets) {
            headerBtns = document.querySelector(sel);
            if (headerBtns) break;
        }

        const btnHtml = `
            <div class="dropdown d-inline-block">
                <button class="btn btn-outline-info btn-modern btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                    <i class="bi bi-file-earmark-pdf"></i> تقرير
                </button>
                <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end" style="min-width:200px">
                    <li><a class="dropdown-item" href="#" onclick="ReportEngine.preview();return false"><i class="bi bi-eye me-2 text-info"></i>معاينة</a></li>
                    <li><a class="dropdown-item" href="#" onclick="ReportEngine.downloadPDF();return false"><i class="bi bi-file-pdf me-2 text-danger"></i>تحميل PDF</a></li>
                    <li><a class="dropdown-item" href="#" onclick="ReportEngine.printReport();return false"><i class="bi bi-printer me-2 text-success"></i>طباعة</a></li>
                    <li><hr class="dropdown-divider opacity-10"></li>
                    <li><a class="dropdown-item" href="#" onclick="ReportEngine.showEmailDialog();return false"><i class="bi bi-envelope me-2 text-warning"></i>إرسال بالبريد</a></li>
                </ul>
            </div>`;

        if (headerBtns) {
            headerBtns.insertAdjacentHTML('beforeend', btnHtml);
        } else {
            const fab = document.createElement('div');
            fab.innerHTML = btnHtml;
            fab.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:9999;';
            document.body.appendChild(fab);
        }
    }

    function injectModal() {
        if (document.getElementById('reportModal')) return;
        const wrap = document.createElement('div');
        wrap.innerHTML = `
        <div class="modal fade" id="reportModal" tabindex="-1">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content" style="background:#0f172a;border:1px solid rgba(255,255,255,0.1);border-radius:20px;">
                    <div class="modal-header border-0 p-4">
                        <h5 class="modal-title fw-800 text-white">معاينة التقرير</h5>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="ReportEngine.downloadPDF()"><i class="bi bi-file-pdf me-1"></i>PDF</button>
                            <button class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="ReportEngine.printReport()"><i class="bi bi-printer me-1"></i>طباعة</button>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                    </div>
                    <div class="modal-body p-0" id="reportPreviewBody" style="background:white;max-height:75vh;overflow-y:auto;border-radius:0 0 20px 20px;"></div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="emailModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:20px;">
                    <div class="modal-header border-0 p-4">
                        <h5 class="modal-title fw-800 text-white"><i class="bi bi-envelope-paper text-warning me-2"></i>إرسال التقرير</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4 pt-0">
                        <div class="mb-3"><label class="form-label text-muted small fw-800">البريد الإلكتروني</label>
                        <input type="email" id="reportEmailTo" class="form-control bg-dark text-white border-secondary" placeholder="name@company.com" dir="ltr"></div>
                        <div class="mb-3"><label class="form-label text-muted small fw-800">ملاحظة (اختياري)</label>
                        <textarea id="reportEmailNote" class="form-control bg-dark text-white border-secondary" rows="2" placeholder="مرفق تقرير..."></textarea></div>
                        <div id="emailStatus" class="small mb-2"></div>
                    </div>
                    <div class="modal-footer border-0 p-4">
                        <button type="button" class="btn btn-link text-muted" data-bs-dismiss="modal">إلغاء</button>
                        <button type="button" class="btn btn-warning px-4 rounded-pill fw-800" onclick="ReportEngine.sendEmail()"><i class="bi bi-send me-1"></i>إرسال</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.appendChild(wrap);
    }

    // ═══════════════════════════════════════════════════
    //  بناء التقرير — تصميم تنفيذي نظيف
    // ═══════════════════════════════════════════════════
    function buildReportHTML() {
        if (!_config?.collectData) return '<p>لا توجد بيانات</p>';
        const { sections, meta } = _config.collectData();
        const deptName = meta?.deptName || (meta?.dept || '').toUpperCase();
        const date = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
        const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

        // ─── فصل الملخص عن الأقسام ───
        const summarySection = sections.find(s => s.isSummary);
        const contentSections = sections.filter(s => !s.isSummary);

        // ─── بناء الملخص التنفيذي ───
        let execSummaryHTML = '';
        if (meta?.highlights && meta.highlights.length > 0) {
            execSummaryHTML = `
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
                <div style="font-weight:800;color:#166534;margin-bottom:10px;font-size:0.9rem;">الملخص التنفيذي</div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                    ${meta.highlights.map(h => `<div style="display:flex;align-items:flex-start;gap:8px;font-size:0.85rem;color:#1e293b;line-height:1.6;">
                        <span style="color:${h.color || '#16a34a'};margin-top:2px;flex-shrink:0;">${h.icon || '●'}</span>
                        <span>${h.text}</span>
                    </div>`).join('')}
                </div>
            </div>`;
        }

        // ─── مؤشرات رقمية (KPIs bar) ───
        let kpiBarHTML = '';
        if (meta?.kpis && meta.kpis.length > 0) {
            kpiBarHTML = `
            <div style="display:flex;gap:1px;margin-bottom:32px;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
                ${meta.kpis.map(k => `<div style="flex:1;padding:16px 12px;text-align:center;background:${k.bg || '#f8fafc'};">
                    <div style="font-size:1.5rem;font-weight:900;color:${k.color || '#1e293b'};letter-spacing:-0.5px;">${k.value}</div>
                    <div style="font-size:0.68rem;color:#64748b;font-weight:600;margin-top:2px;">${k.label}</div>
                </div>`).join('')}
            </div>`;
        }

        // ─── درجة الجاهزية ───
        let scoreHTML = '';
        if (meta?.qualityScore !== undefined) {
            const s = meta.qualityScore;
            const c = s >= 70 ? '#16a34a' : s >= 40 ? '#ca8a04' : '#dc2626';
            const bg = s >= 70 ? '#f0fdf4' : s >= 40 ? '#fefce8' : '#fef2f2';
            scoreHTML = `
            <div style="display:flex;align-items:center;gap:20px;background:${bg};border-radius:12px;padding:18px 24px;margin-bottom:32px;">
                <div style="width:54px;height:54px;border-radius:50%;border:4px solid ${c};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <span style="font-weight:900;font-size:1.15rem;color:${c};">${s}%</span>
                </div>
                <div style="flex:1;">
                    <div style="font-weight:800;font-size:0.95rem;color:${c};">${meta.qualityLabel || 'التقييم'}</div>
                    <div style="font-size:0.78rem;color:#475569;line-height:1.5;margin-top:2px;">${meta.qualityAdvice || ''}</div>
                </div>
            </div>`;
        }

        // ─── أقسام المحتوى ───
        let bodyHTML = '';
        contentSections.forEach((sec, i) => {
            bodyHTML += `
            <div style="margin-bottom:28px;page-break-inside:avoid;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <div style="width:4px;height:22px;border-radius:2px;background:${sec.color || '#6366f1'};"></div>
                    <h3 style="margin:0;font-size:0.95rem;font-weight:800;color:#1e293b;">${sec.title}</h3>
                </div>
                <div style="padding-right:14px;font-size:0.85rem;line-height:1.7;color:#334155;">${sec.content}</div>
            </div>
            ${i < contentSections.length - 1 ? '<hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 28px;">' : ''}`;
        });

        // ─── التوصيات (إذا وجدت) ───
        let recsHTML = '';
        if (meta?.recommendations && meta.recommendations.length > 0) {
            recsHTML = `
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 24px;margin-top:32px;page-break-inside:avoid;">
                <div style="font-weight:800;color:#1e40af;margin-bottom:12px;font-size:0.9rem;">التوصيات والخطوات التالية</div>
                ${meta.recommendations.map((r, i) => `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;font-size:0.83rem;color:#1e293b;line-height:1.6;">
                    <span style="background:#3b82f6;color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;flex-shrink:0;margin-top:2px;">${i + 1}</span>
                    <span>${r}</span>
                </div>`).join('')}
            </div>`;
        }

        return `
        <div id="reportPrintArea" style="font-family:'Tajawal',sans-serif;direction:rtl;padding:48px 44px;max-width:800px;margin:0 auto;color:#1e293b;line-height:1.7;">

            <!-- الهيدر -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div>
                    <div style="font-size:0.72rem;font-weight:700;color:#6366f1;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">STRATIX | ستارتكس</div>
                    <h1 style="margin:0;font-size:1.4rem;font-weight:900;color:#0f172a;">${_config.pageTitle || 'تقرير استراتيجي'}</h1>
                </div>
                <div style="text-align:left;flex-shrink:0;">
                    <div style="font-size:0.75rem;color:#64748b;">${date}</div>
                    <div style="font-size:0.7rem;color:#94a3b8;">${time}</div>
                </div>
            </div>
            <div style="font-size:0.8rem;color:#475569;margin-bottom:6px;">إدارة <strong>${deptName}</strong></div>
            <hr style="border:none;border-top:2px solid #0f172a;margin:12px 0 28px;">

            ${scoreHTML}
            ${kpiBarHTML}
            ${execSummaryHTML}
            ${bodyHTML}
            ${recsHTML}

            <!-- الفوتر -->
            <div style="margin-top:48px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:0.65rem;color:#94a3b8;">
                <span>منصة ستارتكس للتخطيط الاستراتيجي — ${date}</span>
                <span>سري — للاستخدام الداخلي</span>
            </div>
        </div>`;
    }

    // ═══ معاينة ═══
    function preview() {
        document.getElementById('reportPreviewBody').innerHTML = buildReportHTML();
        new bootstrap.Modal(document.getElementById('reportModal')).show();
    }

    // ═══ تحميل PDF ═══
    async function downloadPDF() {
        try {
            await loadHtml2Pdf();
            const container = document.createElement('div');
            container.innerHTML = buildReportHTML();
            container.style.cssText = 'position:absolute;left:-9999px;top:0;width:750px;';
            document.body.appendChild(container);
            const dept = _config?.collectData?.()?.meta?.dept || 'dept';
            await html2pdf().set({
                margin: [12, 12, 12, 12],
                filename: `stratix_${_config.pageId || 'report'}_${dept}_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            }).from(container).save();
            document.body.removeChild(container);
            if (window.DeptPage?.showMessage) DeptPage.showMessage('تم تحميل التقرير PDF');
        } catch (err) {
            console.error('[ReportEngine] PDF error:', err);
            alert('حدث خطأ في توليد PDF — جرّب الطباعة');
        }
    }

    // ═══ طباعة ═══
    function printReport() {
        const w = window.open('', '_blank', 'width=900,height=700');
        w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap" rel="stylesheet">
        <style>body{margin:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
        </head><body>${buildReportHTML()}</body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 600);
    }

    // ═══ إيميل ═══
    function showEmailDialog() {
        document.getElementById('emailStatus').innerHTML = '';
        document.getElementById('reportEmailTo').value = '';
        document.getElementById('reportEmailNote').value = '';
        new bootstrap.Modal(document.getElementById('emailModal')).show();
    }

    async function sendEmail() {
        const to = document.getElementById('reportEmailTo').value.trim();
        const note = document.getElementById('reportEmailNote').value.trim();
        const st = document.getElementById('emailStatus');
        if (!to || !to.includes('@')) { st.innerHTML = '<span class="text-danger">أدخل بريد صحيح</span>'; return; }
        st.innerHTML = '<span class="text-info"><i class="bi bi-hourglass-split"></i> جاري الإرسال...</span>';
        try {
            const res = await fetch('/api/reports/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
                body: JSON.stringify({ to, note, subject: `تقرير: ${_config.pageTitle || 'تحليل'} — ستارتكس`, reportHtml: buildReportHTML() })
            });
            const data = await res.json();
            if (data.success) {
                st.innerHTML = '<span class="text-success"><i class="bi bi-check-circle-fill"></i> تم الإرسال!</span>';
                setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('emailModal'))?.hide(), 1500);
            } else {
                st.innerHTML = `<span class="text-warning">${data.message || 'فشل الإرسال'}</span>`;
            }
        } catch (err) { st.innerHTML = '<span class="text-danger">خطأ في الاتصال</span>'; }
    }

    // ═══════════════════════════════════════════
    //  أدوات بناء المحتوى
    // ═══════════════════════════════════════════

    /** نص → قائمة نظيفة مع بادجات المصدر */
    function textToList(text, color) {
        if (!text || !text.trim()) return '<p style="color:#94a3b8;font-style:italic;font-size:0.82rem;">لا توجد بيانات</p>';
        const lines = text.split('\n').filter(l => l.trim().length > 2);
        const tagColors = { 'تشخيص': '#6366f1', 'تدقيق': '#d97706', 'بستل': '#0891b2', 'صحة': '#10b981', 'عميق': '#7c3aed' };
        return lines.map(l => {
            let clean = l.trim().replace(/^[\-\*\d\.]+\s*/, '');
            // استخراج التاق [مصدر] وتحويله لبادج
            const tagMatch = clean.match(/^\[([^\]]+)\]\s*/);
            let tagBadge = '';
            if (tagMatch) {
                const tagName = tagMatch[1];
                const tColor = tagColors[tagName] || '#64748b';
                tagBadge = `<span style="font-size:0.6rem;font-weight:700;color:${tColor};background:${tColor}12;padding:1px 6px;border-radius:4px;margin-left:6px;flex-shrink:0;white-space:nowrap;">${tagName}</span>`;
                clean = clean.replace(/^\[([^\]]+)\]\s*/, '');
            }
            return `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:5px;font-size:0.84rem;line-height:1.6;">
                <span style="color:${color || '#6366f1'};margin-top:3px;font-size:0.6rem;flex-shrink:0;">⬤</span>
                <span style="flex:1;">${clean}</span>${tagBadge}
            </div>`;
        }).join('');
    }

    /** بطاقة KPI */
    function dataCard(label, value, color) {
        return `<div style="flex:1;min-width:90px;text-align:center;padding:14px 8px;background:${color || '#6366f1'}08;border-radius:10px;">
            <div style="font-size:1.3rem;font-weight:900;color:${color || '#1e293b'}">${value}</div>
            <div style="font-size:0.65rem;color:#64748b;font-weight:600;margin-top:2px">${label}</div>
        </div>`;
    }

    /** جدول نظيف */
    function simpleTable(headers, rows) {
        return `<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
            <thead><tr>${headers.map(h => `<th style="background:#f8fafc;padding:10px 14px;font-weight:700;border-bottom:2px solid #e2e8f0;text-align:right;color:#475569;font-size:0.75rem;">${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.map((r, i) => `<tr style="background:${i % 2 ? '#fafbfc' : 'white'}">${r.map(c => `<td style="padding:9px 14px;border-bottom:1px solid #f1f5f9;">${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>`;
    }

    /** grid بطاقات */
    function cardGrid(items) {
        return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            ${items.map(i => `<div style="background:${i.bg || '#f8fafc'};border:1px solid ${i.borderColor || '#e2e8f0'};border-radius:10px;padding:12px 14px;${i.borderRight ? 'border-right:4px solid ' + i.borderRight : ''}">
                ${i.label ? `<div style="font-size:0.68rem;font-weight:700;color:${i.labelColor || '#64748b'};margin-bottom:3px">${i.label}</div>` : ''}
                <div style="font-weight:700;color:#1e293b;font-size:0.85rem;">${i.value}</div>
                ${i.sub ? `<div style="font-size:0.72rem;color:#94a3b8;margin-top:3px">${i.sub}</div>` : ''}
            </div>`).join('')}
        </div>`;
    }

    return { init, preview, downloadPDF, printReport, showEmailDialog, sendEmail, buildReportHTML, textToList, dataCard, simpleTable, cardGrid };
})();
