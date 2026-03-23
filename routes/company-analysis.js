const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────────

/** استخرج كود الإدارة من الـ JWT (يدعم عدة صيغ) */
function resolveDeptKey(user) {
    if (!user) return null;
    if (user.dept) return user.dept.toLowerCase();
    if (user.departmentRole) return user.departmentRole.toLowerCase();
    if (user.userCategory?.startsWith('DEPT_'))
        return user.userCategory.replace('DEPT_', '').toLowerCase();
    return null;
}

/** JSON.parse آمن مع قيمة افتراضية */
function safeParseJSON(str, def) {
    if (!str) return def;
    if (typeof str === 'object') return str;
    try { return JSON.parse(str); } catch { return def; }
}

// ============ COMPANY ANALYSIS ============


// Get all analyses for a version (with progress)
router.get('/version/:versionId', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.params;
        const { status, category } = req.query;

        let where = { versionId };
        if (status) where.status = status;

        const analyses = await prisma.companyAnalysis.findMany({
            where,
            include: {
                tool: {
                    select: {
                        code: true,
                        nameAr: true,
                        nameEn: true,
                        category: true,
                        isPrimary: true,
                        icon: true,
                        color: true,
                        order: true
                    }
                }
            },
            orderBy: { tool: { order: 'asc' } }
        });

        // Filter by category if needed
        let filtered = analyses;
        if (category) {
            filtered = analyses.filter(a => a.tool.category === category);
        }

        // Calculate overall progress
        const totalTools = filtered.length;
        const completedTools = filtered.filter(a => a.status === 'COMPLETED').length;
        const overallProgress = totalTools > 0 ? Math.round((completedTools / totalTools) * 100) : 0;

        // Group by category
        const grouped = {
            DIAGNOSIS: filtered.filter(a => a.tool.category === 'DIAGNOSIS'),
            CHOICE: filtered.filter(a => a.tool.category === 'CHOICE'),
            EXECUTION: filtered.filter(a => a.tool.category === 'EXECUTION'),
            ADAPTATION: filtered.filter(a => a.tool.category === 'ADAPTATION')
        };

        res.json({
            analyses: filtered,
            grouped,
            stats: {
                total: totalTools,
                completed: completedTools,
                inProgress: filtered.filter(a => a.status === 'IN_PROGRESS').length,
                draft: filtered.filter(a => a.status === 'DRAFT').length,
                overallProgress
            }
        });
    } catch (error) {
        console.error('Error fetching analyses:', error);
        res.status(500).json({ error: 'Failed to fetch analyses' });
    }
});

// Get single analysis by version + toolCode
router.get('/version/:versionId/:toolCode', verifyToken, async (req, res) => {
    try {
        const { versionId, toolCode } = req.params;

        const analysis = await prisma.companyAnalysis.findUnique({
            where: {
                versionId_toolCode: { versionId, toolCode: toolCode.toUpperCase() }
            },
            include: {
                tool: true,
                version: {
                    select: {
                        id: true,
                        versionNumber: true,
                        name: true,
                        status: true,
                        entity: { select: { id: true, legalName: true, displayName: true } }
                    }
                }
            }
        });

        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        // Parse data JSON
        let parsedData = null;
        if (analysis.data) {
            try { parsedData = JSON.parse(analysis.data); } catch (e) { parsedData = analysis.data; }
        }

        res.json({ ...analysis, parsedData });
    } catch (error) {
        console.error('Error fetching analysis:', error);
        res.status(500).json({ error: 'Failed to fetch analysis' });
    }
});

// Get single analysis by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const analysis = await prisma.companyAnalysis.findUnique({
            where: { id: req.params.id },
            include: {
                tool: true,
                version: {
                    select: {
                        id: true,
                        versionNumber: true,
                        name: true,
                        entity: { select: { id: true, legalName: true, displayName: true } }
                    }
                }
            }
        });

        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        let parsedData = null;
        if (analysis.data) {
            try { parsedData = JSON.parse(analysis.data); } catch (e) { parsedData = analysis.data; }
        }

        res.json({ ...analysis, parsedData });
    } catch (error) {
        console.error('Error fetching analysis:', error);
        res.status(500).json({ error: 'Failed to fetch analysis' });
    }
});

// Create analysis
router.post('/', verifyToken, async (req, res) => {
    try {
        const { versionId, toolCode, data, summary, status } = req.body;

        if (!versionId || !toolCode) {
            return res.status(400).json({ error: 'versionId and toolCode are required' });
        }

        // Find the tool definition
        const tool = await prisma.toolDefinition.findUnique({
            where: { code: toolCode.toUpperCase() }
        });

        if (!tool) {
            return res.status(404).json({ error: `Tool '${toolCode}' not found` });
        }

        // Check if already exists
        const existing = await prisma.companyAnalysis.findUnique({
            where: { versionId_toolCode: { versionId, toolCode: toolCode.toUpperCase() } }
        });

        if (existing) {
            return res.status(409).json({
                error: 'Analysis already exists for this version and tool',
                existingId: existing.id
            });
        }

        // Calculate progress from data
        let progress = 0;
        if (data) {
            try {
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                progress = calculateProgress(toolCode.toUpperCase(), parsed);
            } catch (e) { /* ignore parse errors */ }
        }

        const analysis = await prisma.companyAnalysis.create({
            data: {
                versionId,
                toolId: tool.id,
                toolCode: toolCode.toUpperCase(),
                data: typeof data === 'object' ? JSON.stringify(data) : data || null,
                summary: summary || null,
                status: status || 'DRAFT',
                progress,
                createdBy: req.user?.id || null
            },
            include: {
                tool: { select: { code: true, nameAr: true, nameEn: true, category: true, icon: true, color: true } },
                version: { select: { id: true, versionNumber: true, name: true } }
            }
        });

        res.status(201).json(analysis);
    } catch (error) {
        console.error('Error creating analysis:', error);
        res.status(500).json({ error: 'Failed to create analysis' });
    }
});

// Update analysis — with dept-scoped field protection for DEPT_MANAGER
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        let { data, summary, status, progress, score } = req.body;

        const existing = await prisma.companyAnalysis.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        // ── 🛡️ فلترة قسرية لمدير الإدارة: يعدّل حقوله فقط ──────────────────
        if (req.user?.userType === 'DEPT_MANAGER' && data !== undefined) {
            const deptKey = resolveDeptKey(req.user);

            if (deptKey) {
                const incomingData = safeParseJSON(data, {});
                const currentData = safeParseJSON(existing.data, {});

                // تعريف الأقسام المسموحة لكل إدارة في أداة VALUE_CHAIN
                const VC_DEPT_MAPPING = {
                    hr: ['hrManagement'],
                    finance: ['infrastructure', 'procurement'],
                    operations: ['inboundLogistics', 'operations', 'outboundLogistics', 'procurement'],
                    marketing: ['marketingSales'],
                    sales: ['marketingSales', 'service'],
                    it: ['techDevelopment'],
                    procurement: ['procurement'],
                    cs: ['service'],
                    quality: ['operations', 'service'],
                    compliance: ['infrastructure'],
                    projects: ['operations', 'techDevelopment'],
                    support: ['infrastructure', 'hrManagement', 'procurement', 'techDevelopment'],
                    legal: ['infrastructure'],
                };

                // تعريف الأقسام المسموحة لكل إدارة في أداة BUSINESS_MODEL
                const BMC_DEPT_MAPPING = {
                    hr: ['keyResources', 'keyActivities'],
                    finance: ['revenueStreams', 'costStructure'],
                    marketing: ['customerSegments', 'valueProposition', 'channels', 'customerRelationships'],
                    sales: ['customerSegments', 'channels', 'customerRelationships', 'revenueStreams'],
                    operations: ['valueProposition', 'keyActivities', 'keyResources', 'keyPartners', 'costStructure'],
                    projects: ['keyActivities', 'keyResources', 'keyPartners'],
                    support: ['keyResources', 'keyPartners'],
                    compliance: ['keyPartners', 'keyActivities'],
                    it: ['keyResources', 'keyActivities', 'keyPartners'],
                    legal: ['keyPartners', 'keyActivities'],
                };

                const TOOL_MAPPING = {
                    'VALUE_CHAIN': VC_DEPT_MAPPING,
                    'BUSINESS_MODEL': BMC_DEPT_MAPPING,
                };

                const mapping = TOOL_MAPPING[existing.toolCode];
                if (mapping) {
                    const allowedKeys = mapping[deptKey] || [];
                    // 🔒 الحقول غير المسموحة تُستعاد من قاعدة البيانات
                    Object.keys(currentData).forEach(key => {
                        if (!allowedKeys.includes(key)) {
                            incomingData[key] = currentData[key];
                        }
                    });
                    console.debug(`[Analysis PATCH] DEPT_MANAGER ${deptKey} allowed: [${allowedKeys.join(', ')}] on ${existing.toolCode}`);
                }

                data = JSON.stringify(incomingData);
            }
        }
        // ── OWNER / ADMIN: تحويل الكائن لنص فقط ─────────────────────────────
        else if (data !== undefined && typeof data === 'object') {
            data = JSON.stringify(data);
        }

        // ── بناء حقول التحديث ────────────────────────────────────────────────
        const updateData = {};

        if (data !== undefined) {
            updateData.data = data;
            // حساب التقدم تلقائياً ما لم يُرسَل صراحة
            if (progress === undefined) {
                try {
                    const parsed = safeParseJSON(data, null);
                    if (parsed) updateData.progress = calculateProgress(existing.toolCode, parsed);
                } catch (e) { /* ignore */ }
            }
        }

        if (summary !== undefined) updateData.summary = summary;
        if (progress !== undefined) updateData.progress = progress;
        if (score !== undefined) updateData.score = score ? parseFloat(score) : null;

        if (status !== undefined) {
            updateData.status = status;
            if (status === 'COMPLETED' && !existing.completedAt) {
                updateData.completedAt = new Date();
                updateData.progress = 100;
            }
        }

        updateData.updatedBy = req.user?.id || null;

        const analysis = await prisma.companyAnalysis.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                tool: { select: { code: true, nameAr: true, nameEn: true, category: true } },
                version: { select: { id: true, versionNumber: true, name: true } }
            }
        });

        res.json(analysis);
    } catch (error) {
        console.error('Error updating analysis:', error);
        res.status(500).json({ error: 'Failed to update analysis' });
    }
});


// Delete analysis
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const existing = await prisma.companyAnalysis.findUnique({ where: { id: req.params.id } });
        if (!existing) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        await prisma.companyAnalysis.delete({ where: { id: req.params.id } });
        res.json({ message: 'Analysis deleted successfully' });
    } catch (error) {
        console.error('Error deleting analysis:', error);
        res.status(500).json({ error: 'Failed to delete analysis' });
    }
});

// Get summary for a version (all tools progress)
router.get('/summary/:versionId', verifyToken, async (req, res) => {
    try {
        const { versionId } = req.params;

        // Get all tools
        const tools = await prisma.toolDefinition.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });

        // Get existing analyses
        const analyses = await prisma.companyAnalysis.findMany({
            where: { versionId },
            include: { tool: true }
        });

        const analysisMap = {};
        analyses.forEach(a => { analysisMap[a.toolCode] = a; });

        // Build summary
        const toolsSummary = tools.map(tool => ({
            code: tool.code,
            nameAr: tool.nameAr,
            nameEn: tool.nameEn,
            category: tool.category,
            isPrimary: tool.isPrimary,
            icon: tool.icon,
            color: tool.color,
            status: analysisMap[tool.code]?.status || 'NOT_STARTED',
            progress: analysisMap[tool.code]?.progress || 0,
            score: analysisMap[tool.code]?.score || null,
            analysisId: analysisMap[tool.code]?.id || null
        }));

        // Overall stats
        const started = analyses.length;
        const completed = analyses.filter(a => a.status === 'COMPLETED').length;
        const primaryTools = tools.filter(t => t.isPrimary);
        const primaryCompleted = primaryTools.filter(t => analysisMap[t.code]?.status === 'COMPLETED').length;

        res.json({
            tools: toolsSummary,
            stats: {
                totalTools: tools.length,
                started,
                completed,
                overallProgress: tools.length > 0 ? Math.round((completed / tools.length) * 100) : 0,
                primaryProgress: primaryTools.length > 0 ? Math.round((primaryCompleted / primaryTools.length) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// ============ HELPER FUNCTIONS ============

function calculateProgress(toolCode, data) {
    if (!data) return 0;

    switch (toolCode) {
        case 'SWOT': {
            const sections = ['strengths', 'weaknesses', 'opportunities', 'threats'];
            const filled = sections.filter(s => Array.isArray(data[s]) && data[s].length > 0).length;
            return Math.round((filled / 4) * 100);
        }
        case 'PESTEL': {
            const sections = ['political', 'economic', 'social', 'technological', 'environmental', 'legal'];
            const filled = sections.filter(s => Array.isArray(data[s]) && data[s].length > 0).length;
            return Math.round((filled / 6) * 100);
        }
        case 'PORTER': {
            const forces = ['rivalry', 'newEntrants', 'substitutes', 'supplierPower', 'buyerPower'];
            const filled = forces.filter(f => data[f] !== undefined && data[f] !== null).length;
            return Math.round((filled / 5) * 100);
        }
        case 'VRIO': {
            if (Array.isArray(data.resources) && data.resources.length > 0) return 100;
            return 0;
        }
        case 'TOWS': {
            const quadrants = ['so', 'wo', 'st', 'wt'];
            const filled = quadrants.filter(q => Array.isArray(data[q]) && data[q].length > 0).length;
            return Math.round((filled / 4) * 100);
        }
        case 'ANSOFF': {
            const quadrants = ['marketPenetration', 'productDevelopment', 'marketDevelopment', 'diversification'];
            const filled = quadrants.filter(q => Array.isArray(data[q]) && data[q].length > 0).length;
            return Math.round((filled / 4) * 100);
        }
        case 'BLUE_OCEAN': {
            const actions = ['eliminate', 'reduce', 'raise', 'create'];
            const filled = actions.filter(a => Array.isArray(data[a]) && data[a].length > 0).length;
            return Math.round((filled / 4) * 100);
        }
        case 'BSC': {
            const perspectives = ['financial', 'customer', 'internal', 'learning'];
            const filled = perspectives.filter(p => Array.isArray(data[p]) && data[p].length > 0).length;
            return Math.round((filled / 4) * 100);
        }
        case 'SCENARIO': {
            if (Array.isArray(data.scenarios) && data.scenarios.length >= 2) return 100;
            if (Array.isArray(data.scenarios) && data.scenarios.length === 1) return 50;
            return 0;
        }
        case 'VALUE_CHAIN': {
            // 9 activities in Porter's value chain (5 primary + 4 support)
            const activities = data.activities || data;
            const vcKeys = ['inboundLogistics', 'operations', 'outboundLogistics', 'marketing', 'service',
                'procurement', 'technology', 'hrm', 'infrastructure'];
            const filled = vcKeys.filter(k => {
                const v = activities[k];
                return Array.isArray(v) ? v.length > 0 : (v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v);
            }).length;
            return Math.round((filled / 9) * 100);
        }
        case 'CORE_COMPETENCY': {
            if (Array.isArray(data.competencies) && data.competencies.length > 0) return 100;
            if (Array.isArray(data.resources) && data.resources.length > 0) return 80;
            if (data.analysis || data.description) return 30;
            return 0;
        }
        case 'CUSTOMER_JOURNEY': {
            const stages = ['awareness', 'consideration', 'purchase', 'retention', 'advocacy'];
            const filled = stages.filter(s => {
                const v = data[s];
                return Array.isArray(v) ? v.length > 0 : (v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v);
            }).length;
            return Math.round((filled / 5) * 100);
        }
        case 'INTERNAL_ENV': {
            // Check how many sections of company health have data
            const sections = ['departments', 'employees', 'financials', 'operations', 'technology', 'culture'];
            const filled = sections.filter(s => {
                const v = data[s];
                return Array.isArray(v) ? v.length > 0 : (v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v);
            }).length;
            return sections.length > 0 ? Math.round((filled / sections.length) * 100) : 0;
        }
        default:
            return 0;
    }
}

module.exports = router;
