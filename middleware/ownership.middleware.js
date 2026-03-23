/**
 * ownership.middleware.js — Startix Platform
 * ─────────────────────────────────────────────────────────────────
 * يضمن عزل البيانات Multi-tenant ويمنع IDOR attacks
 *
 * الاستخدام:
 *   const { checkOwnership, checkCreateOwnership, filterByOwnership } = require('../middleware/ownership.middleware');
 *
 *   // GET: فلترة تلقائية بالـ entity
 *   router.get('/', verifyToken, filterByOwnership('KPI'), kpiController.list);
 *
 *   // POST: التحقق من الإنشاء
 *   router.post('/', verifyToken, checkCreateOwnership({ versionIdField: 'strategyVersionId' }), kpiController.create);
 *
 *   // PATCH/DELETE: التحقق من الملكية
 *   router.patch('/:id', verifyToken, checkOwnership('KPI'), kpiController.update);
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const prisma = require('../lib/prisma');

// ═══════════════════════════════════════════════════════════
// 1. خريطة الملكية — علاقة كل model بـ entityId
// ═══════════════════════════════════════════════════════════

const OWNERSHIP_GRAPH = {
    // ── جذر: Entity نفسها ──
    'Entity': { isRoot: true, field: 'id' },

    // ── مباشر: entityId في الجدول ──
    'User': { field: 'entityId' },
    'Department': { field: 'entityId' },
    'StrategyVersion': { field: 'entityId' },
    'InvestorRelation': { field: 'entityId' },
    'AuditLog': { field: 'entityId' },
    'ResourceAccess': { field: 'entityId' },
    'Member': { field: 'entityId' },
    'Invitation': { field: 'entityId' },
    'Integration': { field: 'entityId' },

    // ── غير مباشر عمق 1: عبر strategyVersion ──
    'KPI': {
        relation: 'strategyVersion',
        parent: 'StrategyVersion',
        filterPath: { strategyVersion: { entityId: null } }
    },
    'StrategicObjective': {
        relation: 'strategyVersion',
        parent: 'StrategyVersion',
        filterPath: { strategyVersion: { entityId: null } }
    },
    'StrategicInitiative': {
        relation: 'strategyVersion',
        parent: 'StrategyVersion',
        filterPath: { strategyVersion: { entityId: null } }
    },
    'StrategicChoice': {
        relation: 'strategyVersion',
        parent: 'StrategyVersion',
        filterPath: { strategyVersion: { entityId: null } }
    },
    'StrategicRisk': {
        relation: 'strategyVersion',
        parent: 'StrategyVersion',
        filterPath: { strategyVersion: { entityId: null } }
    },
    'ExternalAnalysis': {
        relation: 'strategyVersion',
        parent: 'StrategyVersion',
        filterPath: { strategyVersion: { entityId: null } }
    },
    'StrategicDirection': {
        relation: 'strategyVersion',
        parent: 'StrategyVersion',
        filterPath: { strategyVersion: { entityId: null } }
    },
    'StrategicReview': {
        relation: 'strategyVersion',
        parent: 'StrategyVersion',
        filterPath: { strategyVersion: { entityId: null } }
    },
    'CompanyAnalysis': {
        relation: 'strategyVersion',
        parent: 'StrategyVersion',
        filterPath: { strategyVersion: { entityId: null } }
    },

    // ── غير مباشر عمق 2: عبر KPI أو initiative ──
    'KPIEntry': {
        relation: 'kpi',
        parent: 'KPI',
        nested: true,
        filterPath: { kpi: { strategyVersion: { entityId: null } } }
    },
    'InitiativeTask': {
        relation: 'initiative',
        parent: 'StrategicInitiative',
        nested: true,
        filterPath: { initiative: { strategyVersion: { entityId: null } } }
    },
    'InitiativeKpi': {
        relation: 'initiative',
        parent: 'StrategicInitiative',
        nested: true,
        filterPath: { initiative: { strategyVersion: { entityId: null } } }
    },
};

// ═══════════════════════════════════════════════════════════
// 2. استخراج entityId من أي مورد
// ═══════════════════════════════════════════════════════════

/**
 * يتتبع علاقات الـ OWNERSHIP_GRAPH لاستخراج entityId
 * @param {string} modelName - اسم الـ Prisma model (PascalCase)
 * @param {string} recordId - id السجل
 * @param {number} depth - عمق التتبع (للحماية من الحلقات)
 */
async function extractEntityId(modelName, recordId, depth = 0) {
    if (depth > 3) throw new Error('Ownership graph too deep — possible cycle');

    const config = OWNERSHIP_GRAPH[modelName];
    if (!config) throw new Error(`Unknown model in OWNERSHIP_GRAPH: ${modelName}`);

    // ─── جذر: Entity نفسها ───
    if (config.isRoot) return recordId;

    // تحويل PascalCase → camelCase لـ Prisma
    const prismaModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);

    // ─── مباشر: entityId موجود في الجدول ───
    if (config.field) {
        const record = await prisma[prismaModel].findUnique({
            where: { id: recordId },
            select: { [config.field]: true }
        });
        if (!record) throw new Error('Record not found');
        return record[config.field];
    }

    // ─── غير مباشر: تتبع العلاقة ───
    if (config.relation) {
        const parentPrismaModel = config.parent.charAt(0).toLowerCase() + config.parent.slice(1);
        const parentConfig = OWNERSHIP_GRAPH[config.parent];

        const include = config.nested
            ? {
                [config.relation]: {
                    include: {
                        [parentConfig.relation]: {
                            select: { [OWNERSHIP_GRAPH[parentConfig.parent]?.field || 'entityId']: true }
                        }
                    }
                }
            }
            : {
                [config.relation]: {
                    select: { [parentConfig.field || 'entityId']: true }
                }
            };

        const record = await prisma[prismaModel].findUnique({
            where: { id: recordId },
            include
        });

        if (!record) throw new Error('Record not found');

        const relRecord = record[config.relation];
        if (!relRecord) throw new Error(`Related ${config.relation} not found`);

        // عمق 1: parent لديه field مباشر
        if (parentConfig.field) {
            return relRecord[parentConfig.field];
        }

        // عمق 2: تتبع إضافي
        const grandparentConfig = OWNERSHIP_GRAPH[parentConfig.parent];
        const grandParentRecord = relRecord[parentConfig.relation];
        if (grandParentRecord && grandparentConfig?.field) {
            return grandParentRecord[grandparentConfig.field];
        }

        // تتبع recursive كـ fallback
        return extractEntityId(config.parent, relRecord.id, depth + 1);
    }

    throw new Error(`Cannot determine entityId for ${modelName}`);
}

// ═══════════════════════════════════════════════════════════
// 3. checkOwnership — للـ GET/:id, PATCH/:id, DELETE/:id
// ═══════════════════════════════════════════════════════════

/**
 * يتحقق أن السجل ينتمي لـ entity المستخدم
 * ويُحقن req.resource و req.resourceEntityId
 */
function checkOwnership(modelName, options = {}) {
    const { idParam = 'id', injectResource = true } = options;

    return async (req, res, next) => {
        try {
            const user = req.user;

            // SUPER_ADMIN يتخطى
            if (user.systemRole === 'SUPER_ADMIN') return next();

            const recordId = req.params[idParam];
            if (!recordId) {
                return res.status(400).json({ error: 'Bad Request', message: 'Resource ID required' });
            }

            const resourceEntityId = await extractEntityId(modelName, recordId);
            const userEntityId = user.activeEntityId || user.entityId;

            if (resourceEntityId !== userEntityId) {
                console.warn(
                    `[OWNERSHIP VIOLATION] User ${user.id} (entity: ${userEntityId}) ` +
                    `tried to access ${modelName}#${recordId} (entity: ${resourceEntityId})`
                );
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have access to this resource'
                });
            }

            // حقن المورد لتجنب double query في الـ controller
            if (injectResource) {
                const prismaModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
                req.resource = await prisma[prismaModel].findUnique({ where: { id: recordId } });
                req.resourceEntityId = resourceEntityId;
            }

            next();
        } catch (err) {
            console.error('[checkOwnership]', err.message);
            if (err.message === 'Record not found') {
                return res.status(404).json({ error: 'Not Found', message: 'Resource not found' });
            }
            res.status(500).json({ error: 'Internal Server Error', message: 'Failed to verify ownership' });
        }
    };
}

// ═══════════════════════════════════════════════════════════
// 4. checkCreateOwnership — للـ POST
// ═══════════════════════════════════════════════════════════

/**
 * يتحقق أن الإنشاء يتم داخل entity المستخدم
 * يدعم: entityId مباشر، versionId، departmentId
 */
function checkCreateOwnership(options = {}) {
    const {
        entityIdField = 'entityId',
        versionIdField = 'versionId',
        allowCrossEntity = false
    } = options;

    return async (req, res, next) => {
        try {
            const user = req.user;
            if (user.systemRole === 'SUPER_ADMIN') return next();

            const userEntityId = user.activeEntityId || user.entityId;

            // ─── حالة 1: entityId مباشر في الـ body ───
            if (req.body[entityIdField]) {
                if (req.body[entityIdField] !== userEntityId) {
                    return res.status(403).json({
                        error: 'Forbidden',
                        message: 'Cannot create resource for a different entity'
                    });
                }
                return next();
            }

            // ─── حالة 2: versionId يُشير لـ entity ───
            if (req.body[versionIdField]) {
                const version = await prisma.strategyVersion.findUnique({
                    where: { id: req.body[versionIdField] },
                    select: { entityId: true }
                });
                if (!version) {
                    return res.status(404).json({ error: 'Not Found', message: 'Strategy version not found' });
                }
                if (version.entityId !== userEntityId) {
                    return res.status(403).json({ error: 'Forbidden', message: 'Version does not belong to your entity' });
                }
                req.inferredEntityId = version.entityId;
                return next();
            }

            // ─── حالة 3: departmentId يُشير لـ entity ───
            if (req.body.departmentId) {
                const dept = await prisma.department.findUnique({
                    where: { id: req.body.departmentId },
                    select: { entityId: true }
                });
                if (!dept) {
                    return res.status(404).json({ error: 'Not Found', message: 'Department not found' });
                }
                if (dept.entityId !== userEntityId) {
                    return res.status(403).json({ error: 'Forbidden', message: 'Department does not belong to your entity' });
                }
                req.inferredEntityId = dept.entityId;
                return next();
            }

            // ─── لا يوجد معرف مرجعي ───
            if (!allowCrossEntity) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'entityId, versionId, or departmentId required'
                });
            }

            next();
        } catch (err) {
            console.error('[checkCreateOwnership]', err.message);
            res.status(500).json({ error: 'Internal Server Error', message: 'Failed to verify create ownership' });
        }
    };
}

// ═══════════════════════════════════════════════════════════
// 5. filterByOwnership — للـ GET (list)
// ═══════════════════════════════════════════════════════════

/**
 * يُحقن req.ownershipFilter — استخدمه في الـ controller مباشرة:
 *   const where = req.ownershipFilter || {};
 *   const records = await prisma.kpi.findMany({ where, ... });
 */
function filterByOwnership(modelName) {
    return async (req, res, next) => {
        try {
            const user = req.user;

            // SUPER_ADMIN يرى كل شيء
            if (user.systemRole === 'SUPER_ADMIN') {
                req.ownershipFilter = null;
                return next();
            }

            const userEntityId = user.activeEntityId || user.entityId;
            const config = OWNERSHIP_GRAPH[modelName];

            if (!config) {
                return res.status(500).json({ error: 'Server Error', message: `Unknown model: ${modelName}` });
            }

            // ─── جذر ───
            if (config.isRoot) {
                req.ownershipFilter = { id: userEntityId };
                return next();
            }

            // ─── مباشر على entityId ───
            if (config.field === 'entityId') {
                req.ownershipFilter = { entityId: userEntityId };
                return next();
            }

            // ─── غير مباشر: ملء filterPath بالـ entityId ───
            if (config.filterPath) {
                req.ownershipFilter = fillFilterPath(config.filterPath, userEntityId);
                return next();
            }

            // افتراضي: لا فلتر (أمان)
            req.ownershipFilter = {};
            next();
        } catch (err) {
            console.error('[filterByOwnership]', err.message);
            res.status(500).json({ error: 'Internal Server Error', message: 'Failed to apply ownership filter' });
        }
    };
}

/**
 * يملأ كل قيمة null في filterPath بـ entityId المستخدم
 * { strategyVersion: { entityId: null } } → { strategyVersion: { entityId: 'xxx' } }
 */
function fillFilterPath(filter, entityId) {
    const result = {};
    for (const [key, value] of Object.entries(filter)) {
        if (value === null) {
            result[key] = entityId;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            result[key] = fillFilterPath(value, entityId);
        } else {
            result[key] = value;
        }
    }
    return result;
}

// ═══════════════════════════════════════════════════════════
// 6. تصدير
// ═══════════════════════════════════════════════════════════

module.exports = {
    OWNERSHIP_GRAPH,
    extractEntityId,
    checkOwnership,
    checkCreateOwnership,
    filterByOwnership,
};
