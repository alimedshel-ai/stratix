/**
 * routes/import.js — Phase 9
 * رفع ملفات Excel/Word + استيراد ذكي
 */
const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============ MULTER CONFIG ============
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E6)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // .xlsx
            'application/vnd.ms-excel',                                            // .xls
            'text/csv',                                                            // .csv
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword',                                                  // .doc
        ];
        const allowedExts = ['.xlsx', '.xls', '.csv', '.docx', '.doc'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('نوع الملف غير مدعوم. الأنواع المدعومة: Excel (.xlsx, .xls, .csv) أو Word (.docx)'));
        }
    }
});

// ============ 1. UPLOAD & PREVIEW ============
// رفع ملف + تحليل أولي (preview)
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
        }

        const { type } = req.body; // KPI_ENTRY, FINANCIAL, SWOT, INITIATIVES
        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();

        let result;

        if (['.xlsx', '.xls', '.csv'].includes(ext)) {
            result = await parseExcel(filePath, type);
        } else if (['.docx', '.doc'].includes(ext)) {
            result = await parseWord(filePath);
        } else {
            return res.status(400).json({ error: 'نوع الملف غير مدعوم' });
        }

        // حفظ البيانات مؤقتاً في ملف JSON (للتأكيد لاحقاً)
        const previewId = `preview-${Date.now()}-${Math.round(Math.random() * 1E6)}`;
        const previewPath = path.join(__dirname, '..', 'uploads', `${previewId}.json`);
        fs.writeFileSync(previewPath, JSON.stringify({
            previewId,
            type: type || result.detectedType,
            originalName: req.file.originalname,
            filePath,
            data: result,
            uploadedBy: req.user.id,
            uploadedAt: new Date().toISOString(),
        }));

        res.json({
            previewId,
            originalName: req.file.originalname,
            type: type || result.detectedType || 'UNKNOWN',
            summary: result.summary,
            headers: result.headers,
            preview: result.rows?.slice(0, 10) || result.preview,
            totalRows: result.rows?.length || 0,
            validation: result.validation,
        });
    } catch (error) {
        console.error('Import upload error:', error);
        res.status(500).json({ error: 'فشل في رفع الملف: ' + error.message });
    }
});

// ============ 2. CONFIRM & SAVE ============
// تأكيد الاستيراد وحفظ البيانات
router.post('/confirm', verifyToken, async (req, res) => {
    try {
        const { previewId, type, versionId, entityId, mapping } = req.body;

        if (!previewId) {
            return res.status(400).json({ error: 'previewId مطلوب' });
        }

        // قراءة البيانات المحفوظة
        const previewPath = path.join(__dirname, '..', 'uploads', `${previewId}.json`);
        if (!fs.existsSync(previewPath)) {
            return res.status(404).json({ error: 'بيانات المعاينة غير موجودة أو انتهت صلاحيتها' });
        }

        const previewData = JSON.parse(fs.readFileSync(previewPath, 'utf8'));
        const dataType = type || previewData.type;
        const rows = previewData.data.rows || [];

        let savedCount = 0;
        let errors = [];

        switch (dataType) {
            case 'KPI_ENTRY':
                ({ savedCount, errors } = await saveKPIEntries(rows, versionId, entityId, mapping, req.user.id));
                break;
            case 'FINANCIAL':
                ({ savedCount, errors } = await saveFinancialData(rows, entityId, req.user.id));
                break;
            case 'SWOT':
                ({ savedCount, errors } = await saveSWOTData(rows, entityId, req.user.id));
                break;
            case 'INITIATIVES':
                ({ savedCount, errors } = await saveInitiatives(rows, versionId, req.user.id));
                break;
            default:
                return res.status(400).json({ error: `نوع البيانات غير معروف: ${dataType}` });
        }

        // تنظيف الملفات
        cleanupFile(previewPath);
        cleanupFile(previewData.filePath);

        res.json({
            success: true,
            message: `تم استيراد ${savedCount} سجل بنجاح`,
            savedCount,
            errors,
            type: dataType,
        });
    } catch (error) {
        console.error('Import confirm error:', error);
        res.status(500).json({ error: 'فشل في تأكيد الاستيراد: ' + error.message });
    }
});

// ============ 3. DOWNLOAD TEMPLATE ============
// تحميل قالب فارغ
router.get('/templates/:type', verifyToken, async (req, res) => {
    try {
        const { type } = req.params;
        const wb = new ExcelJS.Workbook();
        let ws;

        switch (type) {
            case 'KPI_ENTRY':
                ws = wb.addWorksheet('إدخال المؤشرات');
                ws.addRows([
                    ['اسم المؤشر', 'القيمة الفعلية', 'بداية الفترة', 'نهاية الفترة', 'ملاحظات'],
                    ['نسبة رضا العملاء', 85, '2026-01-01', '2026-01-31', 'بيانات يناير'],
                    ['معدل الإنتاجية', 92, '2026-01-01', '2026-01-31', ''],
                ]);
                break;

            case 'FINANCIAL':
                ws = wb.addWorksheet('القرارات المالية');
                ws.addRows([
                    ['العنوان', 'الوصف', 'المبلغ', 'العملة', 'النوع', 'الحالة', 'تاريخ القرار'],
                    ['استثمار تقني', 'شراء خوادم جديدة', 500000, 'SAR', 'INVESTMENT', 'PROPOSED', '2026-03-01'],
                ]);
                break;

            case 'SWOT':
                ws = wb.addWorksheet('تحليل SWOT');
                ws.addRows([
                    ['النوع', 'العنوان', 'الوصف', 'التأثير'],
                    ['STRENGTH', 'فريق عمل متميز', 'خبرات متنوعة ومؤهلات عالية', 'HIGH'],
                    ['WEAKNESS', 'بنية تقنية قديمة', 'أنظمة بحاجة لتحديث', 'MEDIUM'],
                    ['OPPORTUNITY', 'سوق جديد', 'فرصة توسع إقليمي', 'HIGH'],
                    ['THREAT', 'منافسة شديدة', 'دخول منافسين جدد', 'MEDIUM'],
                ]);
                break;

            case 'INITIATIVES':
                ws = wb.addWorksheet('المبادرات');
                ws.addRows([
                    ['العنوان', 'الوصف', 'المسؤول', 'الحالة', 'تاريخ البداية', 'تاريخ النهاية', 'الميزانية', 'الأولوية'],
                    ['التحول الرقمي', 'أتمتة العمليات الأساسية', 'أحمد محمد', 'PLANNED', '2026-01-01', '2026-06-30', 200000, 'HIGH'],
                ]);
                break;

            default:
                return res.status(400).json({ error: `نوع القالب غير معروف: ${type}` });
        }

        // إرسال الملف
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=template_${type}.xlsx`);
        await wb.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Template download error:', error);
        res.status(500).json({ error: 'فشل في تحميل القالب' });
    }
});

// ============ 4. IMPORT HISTORY ============
// سجل عمليات الاستيراد (من الملفات المؤقتة)
router.get('/history', verifyToken, (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            return res.json({ history: [] });
        }

        const files = fs.readdirSync(uploadsDir)
            .filter(f => f.endsWith('.json') && f.startsWith('preview-'))
            .map(f => {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(uploadsDir, f), 'utf8'));
                    return {
                        previewId: data.previewId,
                        type: data.type,
                        originalName: data.originalName,
                        uploadedAt: data.uploadedAt,
                        totalRows: data.data?.rows?.length || 0,
                    };
                } catch { return null; }
            })
            .filter(Boolean)
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        res.json({ history: files });
    } catch (error) {
        res.status(500).json({ error: 'فشل في جلب السجل' });
    }
});

// ============================================================
// PARSERS
// ============================================================

/**
 * Excel/CSV Parser
 */
async function parseExcel(filePath, type) {
    const workbook = new ExcelJS.Workbook();
    if (filePath.endsWith('.csv')) {
        await workbook.csv.readFile(filePath);
    } else {
        await workbook.xlsx.readFile(filePath);
    }

    const worksheet = workbook.worksheets[0];
    const jsonData = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const rowValues = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rowValues[colNumber - 1] = cell.value?.toString() || '';
        });
        jsonData.push(rowValues);
    });

    if (jsonData.length === 0) {
        return { summary: { error: 'الملف فارغ' }, headers: [], rows: [], validation: { valid: 0, warnings: 0, errors: 1 } };
    }

    const headers = jsonData[0].map(h => String(h).trim());
    const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== '')).map((row, idx) => {
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = row[i] !== undefined ? row[i] : '';
        });
        obj._rowNum = idx + 2; // رقم الصف الأصلي
        return obj;
    });

    // كشف النوع تلقائياً
    const detectedType = detectType(headers, type);

    // تحقق
    const validation = validateRows(rows, headers, detectedType);

    return {
        summary: {
            sheets: workbook.worksheets.length,
            activeSheet: worksheet.name,
            totalRows: rows.length,
            columns: headers.length,
        },
        headers,
        rows,
        detectedType,
        validation,
    };
}

/**
 * Word (.docx) Parser
 */
async function parseWord(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    // استخراج بنية النص
    const lines = text.split('\n').filter(l => l.trim());
    const paragraphs = [];
    let currentSection = null;

    for (const line of lines) {
        const trimmed = line.trim();
        // كشف العناوين (أرقام أو bold-like patterns)
        if (/^[\d]+[\.\-\)]/.test(trimmed) || /^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً)/.test(trimmed)) {
            currentSection = trimmed;
            paragraphs.push({ type: 'heading', text: trimmed });
        } else if (trimmed.length > 0) {
            paragraphs.push({ type: 'paragraph', text: trimmed, section: currentSection });
        }
    }

    // محاولة استخراج جداول
    const tableResult = await mammoth.convertToHtml({ path: filePath });
    const tables = extractTablesFromHtml(tableResult.value);

    return {
        summary: {
            totalLines: lines.length,
            paragraphs: paragraphs.length,
            tables: tables.length,
        },
        detectedType: 'DOCUMENT',
        preview: paragraphs.slice(0, 20),
        tables,
        fullText: text.substring(0, 5000), // أول 5000 حرف
        validation: { valid: paragraphs.length, warnings: 0, errors: 0 },
    };
}

/**
 * استخراج الجداول من HTML
 */
function extractTablesFromHtml(html) {
    const tables = [];
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let match;

    while ((match = tableRegex.exec(html)) !== null) {
        const tableHtml = match[1];
        const rows = [];
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
            const cells = [];
            const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
            let cellMatch;

            while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
                cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
            }
            if (cells.length > 0) rows.push(cells);
        }
        if (rows.length > 0) tables.push(rows);
    }
    return tables;
}

/**
 * كشف نوع البيانات تلقائياً من العناوين
 */
function detectType(headers, explicitType) {
    if (explicitType) return explicitType;

    const headersLower = headers.map(h => h.toLowerCase());
    const headersStr = headersLower.join(' ');

    if (headersStr.includes('مؤشر') || headersStr.includes('kpi') || headersStr.includes('القيمة الفعلية'))
        return 'KPI_ENTRY';
    if (headersStr.includes('مبلغ') || headersStr.includes('مالي') || headersStr.includes('ميزانية') || headersStr.includes('financial'))
        return 'FINANCIAL';
    if (headersStr.includes('strength') || headersStr.includes('weakness') || headersStr.includes('قوة') || headersStr.includes('ضعف'))
        return 'SWOT';
    if (headersStr.includes('مبادر') || headersStr.includes('initiative') || headersStr.includes('أولوية'))
        return 'INITIATIVES';

    return 'UNKNOWN';
}

/**
 * Validation — فحص البيانات
 */
function validateRows(rows, headers, type) {
    let valid = 0, warnings = 0, errors = 0;
    const issues = [];

    rows.forEach((row, idx) => {
        let rowValid = true;

        // فحص الحقول الفارغة المهمة
        if (type === 'KPI_ENTRY') {
            const nameCol = headers.find(h => h.includes('اسم') || h.includes('مؤشر') || h.toLowerCase().includes('kpi'));
            const valueCol = headers.find(h => h.includes('قيمة') || h.includes('فعلي') || h.toLowerCase().includes('value'));

            if (nameCol && !row[nameCol]) {
                issues.push({ row: row._rowNum, field: nameCol, type: 'error', message: 'اسم المؤشر مطلوب' });
                errors++;
                rowValid = false;
            }
            if (valueCol && (row[valueCol] === '' || isNaN(row[valueCol]))) {
                issues.push({ row: row._rowNum, field: valueCol, type: 'error', message: 'القيمة يجب أن تكون رقم' });
                errors++;
                rowValid = false;
            }
        }

        if (type === 'SWOT') {
            const typeCol = headers.find(h => h.includes('نوع') || h.toLowerCase().includes('type'));
            if (typeCol && !['STRENGTH', 'WEAKNESS', 'OPPORTUNITY', 'THREAT'].includes(String(row[typeCol]).toUpperCase())) {
                issues.push({ row: row._rowNum, field: typeCol, type: 'warning', message: 'النوع يجب أن يكون STRENGTH/WEAKNESS/OPPORTUNITY/THREAT' });
                warnings++;
            }
        }

        if (rowValid) valid++;
    });

    return { valid, warnings, errors, issues };
}

// ============================================================
// SAVE FUNCTIONS
// ============================================================

/**
 * حفظ بيانات مؤشرات الأداء
 */
async function saveKPIEntries(rows, versionId, entityId, mapping, userId) {
    let savedCount = 0;
    const errors = [];

    // جلب KPIs المتاحة
    let kpis = [];
    if (versionId) {
        kpis = await prisma.kPI.findMany({
            where: { versionId },
            select: { id: true, name: true, nameAr: true }
        });
    }

    for (const row of rows) {
        try {
            // البحث عن المؤشر بالاسم (fuzzy match)
            const nameValue = findValue(row, ['اسم المؤشر', 'اسم', 'مؤشر', 'KPI', 'name']);
            const actualValue = findValue(row, ['القيمة الفعلية', 'القيمة', 'فعلي', 'value', 'actual']);
            const startDate = findValue(row, ['بداية الفترة', 'بداية', 'من', 'start', 'periodStart']);
            const endDate = findValue(row, ['نهاية الفترة', 'نهاية', 'إلى', 'end', 'periodEnd']);
            const notes = findValue(row, ['ملاحظات', 'notes', 'ملاحظة']);

            if (!nameValue || actualValue === '' || actualValue === undefined) {
                errors.push({ row: row._rowNum, error: 'بيانات ناقصة (اسم أو قيمة)' });
                continue;
            }

            // البحث عن KPI مطابق
            let matchedKpi = kpis.find(k =>
                k.name === nameValue ||
                k.nameAr === nameValue ||
                k.name?.includes(nameValue) ||
                k.nameAr?.includes(nameValue) ||
                nameValue.includes(k.name) ||
                (k.nameAr && nameValue.includes(k.nameAr))
            );

            if (!matchedKpi && mapping && mapping[nameValue]) {
                matchedKpi = kpis.find(k => k.id === mapping[nameValue]);
            }

            if (!matchedKpi) {
                errors.push({ row: row._rowNum, error: `لم يتم العثور على مؤشر بهذا الاسم: "${nameValue}"` });
                continue;
            }

            await prisma.kPIEntry.create({
                data: {
                    kpiId: matchedKpi.id,
                    value: parseFloat(actualValue),
                    periodStart: new Date(startDate || new Date()),
                    periodEnd: new Date(endDate || new Date()),
                    enteredBy: userId,
                    status: 'CONFIRMED',
                    notes: notes || null,
                }
            });
            savedCount++;
        } catch (err) {
            errors.push({ row: row._rowNum, error: err.message });
        }
    }

    return { savedCount, errors };
}

/**
 * حفظ بيانات مالية
 */
async function saveFinancialData(rows, entityId, userId) {
    let savedCount = 0;
    const errors = [];

    if (!entityId) {
        return { savedCount: 0, errors: [{ error: 'entityId مطلوب للبيانات المالية' }] };
    }

    for (const row of rows) {
        try {
            const title = findValue(row, ['العنوان', 'title', 'اسم']);
            const description = findValue(row, ['الوصف', 'description', 'تفاصيل']);
            const amount = findValue(row, ['المبلغ', 'amount', 'مبلغ']);
            const currency = findValue(row, ['العملة', 'currency']) || 'SAR';
            const type = findValue(row, ['النوع', 'type']) || 'INVESTMENT';
            const status = findValue(row, ['الحالة', 'status']) || 'PROPOSED';

            if (!title) {
                errors.push({ row: row._rowNum, error: 'العنوان مطلوب' });
                continue;
            }

            await prisma.financialDecision.create({
                data: {
                    entityId,
                    title,
                    description: description || null,
                    amount: amount ? parseFloat(amount) : null,
                    currency,
                    type,
                    status,
                }
            });
            savedCount++;
        } catch (err) {
            errors.push({ row: row._rowNum, error: err.message });
        }
    }

    return { savedCount, errors };
}

/**
 * حفظ بيانات SWOT
 */
async function saveSWOTData(rows, entityId, userId) {
    let savedCount = 0;
    const errors = [];

    if (!entityId) {
        return { savedCount: 0, errors: [{ error: 'entityId مطلوب لبيانات SWOT' }] };
    }

    // البحث عن تقييم موجود أو إنشاء جديد
    let assessment = await prisma.assessment.findFirst({
        where: { entityId },
        orderBy: { createdAt: 'desc' }
    });

    if (!assessment) {
        assessment = await prisma.assessment.create({
            data: {
                entityId,
                title: 'تقييم مستورد',
                status: 'DRAFT',
            }
        });
    }

    // عدّاد لكل نوع (للترميز التلقائي)
    const counters = { STRENGTH: 0, WEAKNESS: 0, OPPORTUNITY: 0, THREAT: 0 };
    const existing = await prisma.analysisPoint.findMany({
        where: { assessmentId: assessment.id },
        select: { type: true }
    });
    existing.forEach(p => { if (counters[p.type] !== undefined) counters[p.type]++; });

    for (const row of rows) {
        try {
            const type = String(findValue(row, ['النوع', 'type']) || '').toUpperCase();
            const title = findValue(row, ['العنوان', 'title', 'اسم', 'النقطة']);
            const description = findValue(row, ['الوصف', 'description', 'تفاصيل']);
            const impact = findValue(row, ['التأثير', 'impact']) || 'MEDIUM';

            if (!['STRENGTH', 'WEAKNESS', 'OPPORTUNITY', 'THREAT'].includes(type)) {
                errors.push({ row: row._rowNum, error: `نوع غير صحيح: "${type}"` });
                continue;
            }
            if (!title) {
                errors.push({ row: row._rowNum, error: 'العنوان مطلوب' });
                continue;
            }

            counters[type]++;
            const codePrefix = type === 'STRENGTH' ? 'S' : type === 'WEAKNESS' ? 'W' : type === 'OPPORTUNITY' ? 'O' : 'T';

            await prisma.analysisPoint.create({
                data: {
                    assessmentId: assessment.id,
                    type,
                    code: `${codePrefix}${counters[type]}`,
                    title,
                    description: description || null,
                    impact: String(impact).toUpperCase(),
                }
            });
            savedCount++;
        } catch (err) {
            errors.push({ row: row._rowNum, error: err.message });
        }
    }

    return { savedCount, errors };
}

/**
 * حفظ مبادرات
 */
async function saveInitiatives(rows, versionId, userId) {
    let savedCount = 0;
    const errors = [];

    if (!versionId) {
        return { savedCount: 0, errors: [{ error: 'versionId مطلوب للمبادرات' }] };
    }

    for (const row of rows) {
        try {
            const title = findValue(row, ['العنوان', 'title', 'اسم', 'المبادرة']);
            const description = findValue(row, ['الوصف', 'description']);
            const owner = findValue(row, ['المسؤول', 'owner', 'المالك']);
            const status = findValue(row, ['الحالة', 'status']) || 'PLANNED';
            const startDate = findValue(row, ['تاريخ البداية', 'بداية', 'start']);
            const endDate = findValue(row, ['تاريخ النهاية', 'نهاية', 'end']);
            const budget = findValue(row, ['الميزانية', 'budget', 'المبلغ']);
            const priority = findValue(row, ['الأولوية', 'priority']) || 'MEDIUM';

            if (!title) {
                errors.push({ row: row._rowNum, error: 'عنوان المبادرة مطلوب' });
                continue;
            }

            await prisma.strategicInitiative.create({
                data: {
                    versionId,
                    title,
                    description: description || null,
                    owner: owner || null,
                    status: String(status).toUpperCase(),
                    startDate: startDate ? new Date(startDate) : null,
                    endDate: endDate ? new Date(endDate) : null,
                    budget: budget ? parseFloat(budget) : null,
                    priority: String(priority).toUpperCase(),
                }
            });
            savedCount++;
        } catch (err) {
            errors.push({ row: row._rowNum, error: err.message });
        }
    }

    return { savedCount, errors };
}

// ============================================================
// HELPERS
// ============================================================

/**
 * البحث عن قيمة في صف بأسماء أعمدة متعددة
 */
function findValue(row, possibleHeaders) {
    for (const header of possibleHeaders) {
        if (row[header] !== undefined && row[header] !== '') {
            return row[header];
        }
        // بحث جزئي
        const keys = Object.keys(row);
        const match = keys.find(k => k.includes(header) || header.includes(k));
        if (match && row[match] !== undefined && row[match] !== '') {
            return row[match];
        }
    }
    return undefined;
}

/**
 * تنظيف ملف مؤقت
 */
function cleanupFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (e) { /* ignore */ }
}

// تنظيف تلقائي للملفات المؤقتة (أكثر من ساعة)
setInterval(() => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) return;

    const files = fs.readdirSync(uploadsDir);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    files.forEach(f => {
        const fPath = path.join(uploadsDir, f);
        try {
            const stat = fs.statSync(fPath);
            if (stat.mtimeMs < oneHourAgo) {
                fs.unlinkSync(fPath);
            }
        } catch (e) { /* ignore */ }
    });
}, 30 * 60 * 1000); // كل 30 دقيقة

module.exports = router;
