const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkDataEntryPermission, checkPermission } = require('../middleware/permission');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.originalname.match(/\.(xlsx|xls|csv)$/i)) cb(null, true);
        else cb(new Error('نوع الملف غير مدعوم'), false);
    }
});

// ============================================
// GET /api/stats/datasets — قائمة مجموعات البيانات
// ============================================
router.get('/datasets', verifyToken, async (req, res) => {
    try {
        const { category, year, search, status } = req.query;
        const where = {};

        if (category) where.category = category;
        if (year) where.year = parseInt(year);
        if (status) where.status = status; else where.status = 'ACTIVE';

        // بناء شروط البحث
        const andConditions = [];

        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: search } },
                    { nameAr: { contains: search } },
                    { description: { contains: search } },
                    { source: { contains: search } },
                ]
            });
        }

        // صلاحية الكيان
        if (req.user.activeEntityId) {
            andConditions.push({
                OR: [
                    { entityId: req.user.activeEntityId },
                    { entityId: null }
                ]
            });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        const datasets = await prisma.statisticalDataset.findMany({
            where,
            include: {
                _count: { select: { records: true } }
            },
            orderBy: [{ year: 'desc' }, { createdAt: 'desc' }]
        });

        res.json({ datasets, total: datasets.length });
    } catch (error) {
        console.error('Stats datasets error:', error);
        res.status(500).json({ error: 'خطأ في جلب البيانات' });
    }
});

// ============================================
// GET /api/stats/datasets/:id — تفاصيل مجموعة من البيانات
// ============================================
router.get('/datasets/:id', verifyToken, async (req, res) => {
    try {
        const dataset = await prisma.statisticalDataset.findUnique({
            where: { id: req.params.id },
            include: {
                records: { orderBy: { sortOrder: 'asc' } }
            }
        });

        if (!dataset) return res.status(404).json({ error: 'مجموعة البيانات غير موجودة' });
        res.json(dataset);
    } catch (error) {
        console.error('Stats dataset detail error:', error);
        res.status(500).json({ error: 'خطأ في جلب البيانات' });
    }
});

// ============================================
// POST /api/stats/datasets — إنشاء مجموعة بيانات يدوي
// ============================================
router.post('/datasets', verifyToken, checkDataEntryPermission('canEnterKPI'), async (req, res) => {
    try {
        const { name, nameAr, description, category, source, sourceUrl, year, records } = req.body;

        if (!name || !category) {
            return res.status(400).json({ error: 'الاسم والتصنيف مطلوبين' });
        }

        const dataset = await prisma.statisticalDataset.create({
            data: {
                name,
                nameAr: nameAr || null,
                description: description || null,
                category,
                source: source || null,
                sourceUrl: sourceUrl || null,
                year: year ? parseInt(year) : new Date().getFullYear(),
                entityId: req.user.activeEntityId || null,
                uploadedBy: req.user.id || null,
                records: records && records.length > 0 ? {
                    create: records.map((r, i) => ({
                        indicator: r.indicator,
                        indicatorAr: r.indicatorAr || null,
                        value: r.value != null ? parseFloat(r.value) : null,
                        textValue: r.textValue || null,
                        unit: r.unit || null,
                        period: r.period || null,
                        region: r.region || null,
                        subCategory: r.subCategory || null,
                        notes: r.notes || null,
                        sortOrder: i,
                    }))
                } : undefined,
            },
            include: { records: true, _count: { select: { records: true } } }
        });

        res.status(201).json({ message: 'تم إنشاء مجموعة البيانات', dataset });
    } catch (error) {
        console.error('Stats create error:', error);
        res.status(500).json({ error: 'خطأ في الإنشاء' });
    }
});

// ============================================
// POST /api/stats/upload — رفع Excel كمجموعة بيانات
// ============================================
router.post('/upload', verifyToken, checkDataEntryPermission('canEnterKPI'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'لم يتم رفع ملف' });

        const { category, source, year, datasetName } = req.body;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];
        const sheetName = worksheet.name;

        const rows = [];
        let headers = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                row.eachCell((cell, colNumber) => {
                    headers[colNumber] = cell.value?.toString() || `Col_${colNumber}`;
                });
            } else {
                const rowData = {};
                let hasData = false;
                row.eachCell((cell, colNumber) => {
                    if (headers[colNumber]) {
                        rowData[headers[colNumber]] = cell.value;
                        hasData = true;
                    }
                });
                if (hasData) rows.push(rowData);
            }
        });

        if (!rows.length) return res.status(400).json({ error: 'الملف فارغ' });

        const keys = Object.keys(rows[0]);
        const nameCol = keys[0];
        const valueCol = keys.find(k => {
            const first = rows[0][k];
            return typeof first === 'number' || (!isNaN(parseFloat(first)) && first !== null);
        }) || keys[1];

        const dataset = await prisma.statisticalDataset.create({
            data: {
                name: datasetName || `${sheetName || 'بيانات'} — ${req.file.originalname}`,
                nameAr: datasetName || null,
                description: `تم الرفع من ملف: ${req.file.originalname} (${rows.length} صف)`,
                category: category || 'CUSTOM',
                source: source || null,
                year: year ? parseInt(year) : new Date().getFullYear(),
                fileName: req.file.originalname,
                fileType: req.file.originalname.split('.').pop(),
                entityId: req.user.activeEntityId || null,
                uploadedBy: req.user.id || null,
                records: {
                    create: rows.map((row, i) => {
                        const indicator = String(row[nameCol] || `صف ${i + 1}`);
                        const rawVal = row[valueCol];
                        const numVal = parseFloat(rawVal);

                        const extraData = {};
                        keys.forEach(k => {
                            if (k !== nameCol && k !== valueCol && row[k] != null) {
                                extraData[k] = row[k];
                            }
                        });

                        return {
                            indicator,
                            indicatorAr: indicator,
                            value: !isNaN(numVal) ? numVal : null,
                            textValue: isNaN(numVal) && rawVal ? String(rawVal) : null,
                            unit: row['الوحدة'] || row['unit'] || row['Unit'] || null,
                            period: row['الفترة'] || row['period'] || row['Period'] || null,
                            region: row['المنطقة'] || row['region'] || row['Region'] || null,
                            subCategory: row['التصنيف'] || row['category'] || null,
                            notes: Object.keys(extraData).length > 0 ? JSON.stringify(extraData) : null,
                            sortOrder: i,
                        };
                    })
                }
            },
            include: { _count: { select: { records: true } } }
        });

        res.status(201).json({
            message: `تم رفع ${rows.length} سجل بنجاح`,
            dataset,
            columns: keys,
            totalRecords: rows.length,
        });

    } catch (error) {
        console.error('Stats upload error:', error);
        // ✅ لا نكشف تفاصيل الخطأ الداخلية
        res.status(500).json({ error: 'خطأ في معالجة الملف — تأكد من صحة التنسيق' });
    }
});

// ============================================
// GET /api/stats/search — بحث في كل البيانات الإحصائية
// ============================================
router.get('/search', verifyToken, async (req, res) => {
    try {
        const { q, category, limit } = req.query;
        if (!q) return res.status(400).json({ error: 'ادخل كلمة بحث' });

        const where = {
            OR: [
                { indicator: { contains: q } },
                { indicatorAr: { contains: q } },
                { notes: { contains: q } },
            ]
        };

        if (category) {
            where.dataset = { category };
        }

        const records = await prisma.statisticalRecord.findMany({
            where,
            include: {
                dataset: { select: { name: true, nameAr: true, category: true, source: true, year: true } }
            },
            take: parseInt(limit) || 50,
            orderBy: { createdAt: 'desc' }
        });

        res.json({ records, total: records.length });
    } catch (error) {
        console.error('Stats search error:', error);
        res.status(500).json({ error: 'خطأ في البحث' });
    }
});

// ============================================
// GET /api/stats/summary — ملخص للتحليل الاستراتيجي
// ============================================
router.get('/summary', verifyToken, async (req, res) => {
    try {
        const { category, year } = req.query;

        const where = { status: 'ACTIVE' };
        if (category) where.category = category;
        if (year) where.year = parseInt(year);
        if (req.user.activeEntityId) {
            where.OR = [
                { entityId: req.user.activeEntityId },
                { entityId: null },
            ];
        }

        const datasets = await prisma.statisticalDataset.findMany({
            where,
            include: {
                records: {
                    orderBy: { sortOrder: 'asc' },
                    take: 100
                },
                _count: { select: { records: true } }
            },
            orderBy: { year: 'desc' }
        });

        const byCategory = {};
        datasets.forEach(ds => {
            if (!byCategory[ds.category]) byCategory[ds.category] = [];
            byCategory[ds.category].push({
                name: ds.nameAr || ds.name,
                source: ds.source,
                year: ds.year,
                recordCount: ds._count.records,
                topRecords: ds.records.slice(0, 10).map(r => ({
                    indicator: r.indicatorAr || r.indicator,
                    value: r.value,
                    textValue: r.textValue,
                    unit: r.unit,
                    period: r.period,
                }))
            });
        });

        res.json({
            totalDatasets: datasets.length,
            totalRecords: datasets.reduce((s, d) => s + d._count.records, 0),
            categories: byCategory,
        });
    } catch (error) {
        console.error('Stats summary error:', error);
        res.status(500).json({ error: 'خطأ في التلخيص' });
    }
});

// ============================================
// PATCH /api/stats/datasets/:id — تحديث مجموعة بيانات
// ============================================
router.patch('/datasets/:id', verifyToken, checkDataEntryPermission('canEnterKPI'), async (req, res) => {
    try {
        const { name, nameAr, description, category, source, year, status } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (nameAr !== undefined) updateData.nameAr = nameAr;
        if (description !== undefined) updateData.description = description;
        if (category) updateData.category = category;
        if (source !== undefined) updateData.source = source;
        if (year) updateData.year = parseInt(year);
        if (status) updateData.status = status;

        const dataset = await prisma.statisticalDataset.update({
            where: { id: req.params.id },
            data: updateData,
        });

        res.json({ message: 'تم التحديث', dataset });
    } catch (error) {
        console.error('Stats update error:', error);
        res.status(500).json({ error: 'خطأ في التحديث' });
    }
});

// ============================================
// DELETE /api/stats/datasets/:id — حذف مجموعة (EDITOR+)
// ============================================
router.delete('/datasets/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
    try {
        await prisma.statisticalDataset.delete({ where: { id: req.params.id } });
        res.json({ message: 'تم الحذف' });
    } catch (error) {
        console.error('Stats delete error:', error);
        res.status(500).json({ error: 'خطأ في الحذف' });
    }
});

// ============================================
// GET /api/stats/for-analysis — بيانات مرتبطة بنوع التحليل
// ============================================
router.get('/for-analysis', verifyToken, async (req, res) => {
    try {
        const { tool, category: manualCategory } = req.query;

        if (!tool && !manualCategory) {
            return res.status(400).json({ error: 'حدد نوع التحليل (tool) أو التصنيف (category)' });
        }

        const TOOL_CATEGORY_MAP = {
            'SWOT': ['MARKET', 'COMPETITIVE', 'FINANCIAL', 'OPERATIONAL', 'DEMOGRAPHIC', 'REGULATORY', 'INDUSTRY'],
            'PESTEL': ['MARKET', 'REGULATORY', 'DEMOGRAPHIC', 'COMPETITIVE'],
            'PORTER': ['COMPETITIVE', 'INDUSTRY', 'MARKET'],
            'ASSESSMENT': ['OPERATIONAL', 'FINANCIAL', 'MARKET', 'DEMOGRAPHIC'],
            'FINANCIAL': ['FINANCIAL', 'MARKET'],
            'BENCHMARKING': ['COMPETITIVE', 'INDUSTRY'],
            'GAP_ANALYSIS': ['OPERATIONAL', 'FINANCIAL'],
            'VALUE_CHAIN': ['OPERATIONAL', 'INDUSTRY'],
            'CORE_COMPETENCY': ['OPERATIONAL', 'COMPETITIVE'],
            'CUSTOMER_JOURNEY': ['DEMOGRAPHIC', 'MARKET', 'COMPETITIVE'],
            'THREE_HORIZONS': ['MARKET', 'INDUSTRY', 'COMPETITIVE'],
            'OGSM': ['FINANCIAL', 'OPERATIONAL', 'MARKET'],
        };

        let categories;
        if (manualCategory) {
            categories = [manualCategory];
        } else {
            categories = TOOL_CATEGORY_MAP[tool.toUpperCase()] || ['MARKET', 'FINANCIAL', 'OPERATIONAL'];
        }

        const where = {
            status: 'ACTIVE',
            category: { in: categories },
        };

        if (req.user.activeEntityId) {
            where.OR = [
                { entityId: req.user.activeEntityId },
                { entityId: null },
            ];
        }

        const datasets = await prisma.statisticalDataset.findMany({
            where,
            include: {
                records: {
                    orderBy: { sortOrder: 'asc' },
                    take: 50,
                },
                _count: { select: { records: true } }
            },
            orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
            take: 20,
        });

        const CATEGORY_AR = {
            MARKET: 'بيانات السوق',
            DEMOGRAPHIC: 'بيانات ديموغرافية',
            FINANCIAL: 'بيانات مالية',
            OPERATIONAL: 'بيانات تشغيلية',
            INDUSTRY: 'بيانات القطاع',
            COMPETITIVE: 'بيانات تنافسية',
            REGULATORY: 'بيانات تنظيمية',
            CUSTOM: 'بيانات أخرى',
        };

        const grouped = {};
        datasets.forEach(ds => {
            const cat = ds.category;
            if (!grouped[cat]) {
                grouped[cat] = {
                    nameAr: CATEGORY_AR[cat] || cat,
                    datasets: [],
                    totalRecords: 0,
                };
            }
            grouped[cat].datasets.push({
                id: ds.id,
                name: ds.nameAr || ds.name,
                source: ds.source,
                year: ds.year,
                recordCount: ds._count.records,
                records: ds.records.map(r => ({
                    indicator: r.indicatorAr || r.indicator,
                    value: r.value,
                    textValue: r.textValue,
                    unit: r.unit,
                    period: r.period,
                }))
            });
            grouped[cat].totalRecords += ds._count.records;
        });

        res.json({
            tool: tool || null,
            relevantCategories: categories.map(c => ({ code: c, nameAr: CATEGORY_AR[c] || c })),
            totalDatasets: datasets.length,
            totalRecords: datasets.reduce((s, d) => s + d._count.records, 0),
            data: grouped,
            tip: datasets.length === 0
                ? 'لا توجد بيانات إحصائية متاحة — ارفع بيانات من صفحة "البيانات الإحصائية"'
                : `${datasets.length} مجموعة بيانات متاحة لدعم التحليل`,
        });

    } catch (error) {
        console.error('Stats for-analysis error:', error);
        res.status(500).json({ error: 'خطأ في جلب البيانات' });
    }
});

module.exports = router;
