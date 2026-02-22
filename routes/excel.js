const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkDataEntryPermission } = require('../middleware/permission');

const router = express.Router();

// Configure multer for memory storage (no disk writes)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv',
        ];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('نوع الملف غير مدعوم. يرجى رفع ملف Excel (.xlsx, .xls) أو CSV'), false);
        }
    }
});

// ============================================
// POST /api/excel/upload — Parse & import Excel
// ============================================
router.post('/upload', verifyToken, checkDataEntryPermission('canEnterKPI'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
        }

        // Parse the Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

        if (!rows.length) {
            return res.status(400).json({ error: 'الملف فارغ أو لا يحتوي على بيانات' });
        }

        // Get user's entity KPIs for matching
        const entityFilter = req.user.activeEntityId
            ? { version: { entityId: req.user.activeEntityId } }
            : {};

        const kpis = await prisma.kPI.findMany({
            where: entityFilter,
            select: { id: true, name: true, nameAr: true, unit: true, target: true, frequency: true }
        });

        // Build lookup maps
        const kpiByName = {};
        const kpiByNameAr = {};
        kpis.forEach(k => {
            kpiByName[k.name.toLowerCase().trim()] = k;
            if (k.nameAr) kpiByNameAr[k.nameAr.trim()] = k;
        });

        // Process rows
        const results = { matched: [], unmatched: [], errors: [] };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // Excel row (1-indexed + header)

            // Try to find KPI name in various column names
            const kpiName = row['اسم المؤشر'] || row['المؤشر'] || row['KPI'] || row['kpi_name']
                || row['name'] || row['Name'] || row['indicator'] || Object.values(row)[0];

            if (!kpiName || typeof kpiName !== 'string') {
                results.errors.push({ row: rowNum, reason: 'لا يوجد اسم مؤشر' });
                continue;
            }

            // Match KPI
            const kpi = kpiByNameAr[kpiName.trim()]
                || kpiByName[kpiName.toLowerCase().trim()]
                || kpis.find(k =>
                    k.name.toLowerCase().includes(kpiName.toLowerCase().trim()) ||
                    (k.nameAr && k.nameAr.includes(kpiName.trim()))
                );

            if (!kpi) {
                results.unmatched.push({ row: rowNum, name: kpiName });
                continue;
            }

            // Get value
            const value = parseFloat(
                row['القيمة'] || row['القيمة الفعلية'] || row['value'] || row['Value']
                || row['actual'] || row['Actual'] || Object.values(row)[1]
            );

            if (isNaN(value)) {
                results.errors.push({ row: rowNum, name: kpiName, reason: 'القيمة غير صالحة' });
                continue;
            }

            // Get period
            let periodStart, periodEnd;
            const periodRaw = row['الفترة'] || row['period'] || row['Period'] || row['الشهر'] || row['month'];
            const yearRaw = row['السنة'] || row['year'] || row['Year'] || new Date().getFullYear();

            if (periodRaw) {
                // Try to parse month names
                const monthMap = {
                    'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'مايو': 5, 'يونيو': 6,
                    'يوليو': 7, 'أغسطس': 8, 'سبتمبر': 9, 'أكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12,
                    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
                    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'june': 6,
                    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
                    'q1': 1, 'q2': 4, 'q3': 7, 'q4': 10,
                    'الربع الأول': 1, 'الربع الثاني': 4, 'الربع الثالث': 7, 'الربع الرابع': 10,
                };

                const periodStr = String(periodRaw).toLowerCase().trim();
                let month = monthMap[periodStr] || parseInt(periodStr);
                if (isNaN(month) || month < 1 || month > 12) month = new Date().getMonth() + 1;

                const year = parseInt(yearRaw) || new Date().getFullYear();
                periodStart = new Date(year, month - 1, 1);
                periodEnd = new Date(year, month, 0); // last day of month
            } else {
                // Default to current month
                const now = new Date();
                periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
                periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            }

            // Get notes
            const notes = row['ملاحظات'] || row['notes'] || row['Notes'] || '';

            results.matched.push({
                kpiId: kpi.id,
                kpiName: kpi.nameAr || kpi.name,
                value,
                periodStart,
                periodEnd,
                notes: String(notes),
                status: 'DRAFT'
            });
        }

        // Return preview (don't save yet)
        res.json({
            message: 'تم تحليل الملف بنجاح',
            fileName: req.file.originalname,
            totalRows: rows.length,
            summary: {
                matched: results.matched.length,
                unmatched: results.unmatched.length,
                errors: results.errors.length
            },
            preview: results.matched,
            unmatched: results.unmatched,
            errors: results.errors,
            columns: Object.keys(rows[0] || {})
        });

    } catch (error) {
        console.error('Excel upload error:', error);
        res.status(500).json({ error: 'خطأ في معالجة الملف: ' + error.message });
    }
});

// ============================================
// POST /api/excel/confirm — Save parsed entries
// ============================================
router.post('/confirm', verifyToken, checkDataEntryPermission('canEnterKPI'), async (req, res) => {
    try {
        const { entries } = req.body;

        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: 'لا توجد إدخالات للحفظ' });
        }

        let saved = 0;
        let failed = 0;
        const errors = [];

        for (const entry of entries) {
            try {
                await prisma.kPIEntry.create({
                    data: {
                        kpiId: entry.kpiId,
                        value: parseFloat(entry.value),
                        periodStart: new Date(entry.periodStart),
                        periodEnd: new Date(entry.periodEnd),
                        status: entry.status || 'DRAFT',
                        notes: entry.notes || '',
                    }
                });
                saved++;
            } catch (e) {
                failed++;
                errors.push({ kpiId: entry.kpiId, kpiName: entry.kpiName, error: e.message });
            }
        }

        res.json({
            message: `تم حفظ ${saved} إدخال بنجاح`,
            saved,
            failed,
            errors
        });

    } catch (error) {
        console.error('Excel confirm error:', error);
        res.status(500).json({ error: 'خطأ في حفظ البيانات' });
    }
});

// ============================================
// GET /api/excel/template — Download Excel template
// ============================================
router.get('/template', verifyToken, async (req, res) => {
    try {
        // Get user's KPIs
        const entityFilter = req.user.activeEntityId
            ? { version: { entityId: req.user.activeEntityId } }
            : {};

        const kpis = await prisma.kPI.findMany({
            where: entityFilter,
            select: { name: true, nameAr: true, unit: true, target: true, frequency: true, bscPerspective: true },
            orderBy: [{ bscPerspective: 'asc' }, { name: 'asc' }]
        });

        const perspectiveAr = {
            FINANCIAL: 'مالي',
            CUSTOMER: 'عملاء',
            INTERNAL_PROCESS: 'عمليات',
            LEARNING_GROWTH: 'موارد بشرية',
        };

        const freqAr = {
            DAILY: 'يومي', WEEKLY: 'أسبوعي', MONTHLY: 'شهري',
            QUARTERLY: 'ربع سنوي', SEMI_ANNUAL: 'نصف سنوي', ANNUAL: 'سنوي',
        };

        // Build template data
        const templateData = kpis.map(k => ({
            'اسم المؤشر': k.nameAr || k.name,
            'القيمة': '',
            'الفترة': '',
            'السنة': new Date().getFullYear(),
            'ملاحظات': '',
            '---': '---',
            'الوحدة (مرجع)': k.unit || '',
            'المستهدف (مرجع)': k.target || '',
            'التكرار (مرجع)': freqAr[k.frequency] || k.frequency || '',
            'القسم (مرجع)': perspectiveAr[k.bscPerspective] || '',
        }));

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Data entry sheet
        const ws = XLSX.utils.json_to_sheet(templateData);

        // Set column widths
        ws['!cols'] = [
            { wch: 25 }, // اسم المؤشر
            { wch: 15 }, // القيمة
            { wch: 12 }, // الفترة
            { wch: 8 },  // السنة
            { wch: 20 }, // ملاحظات
            { wch: 3 },  // ---
            { wch: 12 }, // الوحدة
            { wch: 15 }, // المستهدف
            { wch: 12 }, // التكرار
            { wch: 15 }, // القسم
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'إدخال البيانات');

        // Instructions sheet
        const instructions = [
            { 'تعليمات استخدام القالب': '📋 دليل استخدام قالب إدخال البيانات' },
            { 'تعليمات استخدام القالب': '' },
            { 'تعليمات استخدام القالب': '1️⃣ الأعمدة المطلوبة:' },
            { 'تعليمات استخدام القالب': '   • اسم المؤشر — اسم المؤشر كما هو (لا تقم بتعديله)' },
            { 'تعليمات استخدام القالب': '   • القيمة — القيمة الفعلية المُحققة' },
            { 'تعليمات استخدام القالب': '   • الفترة — اسم الشهر (يناير، فبراير...) أو رقمه (1-12)' },
            { 'تعليمات استخدام القالب': '   • السنة — سنة التقرير (مثال: 2026)' },
            { 'تعليمات استخدام القالب': '   • ملاحظات — أي ملاحظات إضافية (اختياري)' },
            { 'تعليمات استخدام القالب': '' },
            { 'تعليمات استخدام القالب': '2️⃣ الأعمدة المرجعية (بعد خط الفاصل ---):' },
            { 'تعليمات استخدام القالب': '   • هذه أعمدة للمرجع فقط — لا تقم بتعديلها' },
            { 'تعليمات استخدام القالب': '   • تُظهر الوحدة والمستهدف لمساعدتك في الإدخال' },
            { 'تعليمات استخدام القالب': '' },
            { 'تعليمات استخدام القالب': '3️⃣ ملاحظات مهمة:' },
            { 'تعليمات استخدام القالب': '   • يمكنك حذف صفوف المؤشرات التي لا تريد تعبئتها' },
            { 'تعليمات استخدام القالب': '   • إذا تركت الفترة فارغة ستُستخدم الفترة الحالية' },
            { 'تعليمات استخدام القالب': '   • الملف يقبل أرقام عربية وإنجليزية' },
        ];

        const wsInst = XLSX.utils.json_to_sheet(instructions);
        wsInst['!cols'] = [{ wch: 60 }];
        XLSX.utils.book_append_sheet(wb, wsInst, 'تعليمات');

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=stratix_data_template.xlsx');
        res.send(buffer);

    } catch (error) {
        console.error('Template download error:', error);
        res.status(500).json({ error: 'خطأ في إنشاء القالب' });
    }
});

module.exports = router;
