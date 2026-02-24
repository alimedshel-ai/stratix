const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const enforceLimit = require('../middleware/enforce-limits');

const router = express.Router();

/**
 * @swagger
 * /api/assessments:
 *   get:
 *     summary: جلب جميع التقييمات
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: entityId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, IN_PROGRESS, COMPLETED, ARCHIVED] }
 *     responses:
 *       200:
 *         description: قائمة التقييمات مع النتائج المحسوبة
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assessments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assessment'
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *   post:
 *     summary: إنشاء تقييم جديد
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, entityId]
 *             properties:
 *               title: { type: string, example: 'تقييم Q1 2026' }
 *               description: { type: string }
 *               entityId: { type: string }
 *               status: { type: string, default: 'DRAFT' }
 *     responses:
 *       201:
 *         description: تم إنشاء التقييم
 *       403:
 *         description: تجاوز حد الباقة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlanLimitError'
 */

/**
 * @swagger
 * /api/assessments/{id}:
 *   get:
 *     summary: جلب تقييم واحد مع النتائج التفصيلية
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: بيانات التقييم مع scoring
 *       404:
 *         description: التقييم غير موجود
 *   patch:
 *     summary: تعديل تقييم
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: تم التعديل
 *   delete:
 *     summary: حذف تقييم
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: force
 *         schema: { type: boolean }
 *         description: مطلوب لحذف تقييم مكتمل
 *     responses:
 *       200:
 *         description: تم الحذف
 *       400:
 *         description: لا يمكن حذف تقييم مكتمل بدون force=true
 */

/**
 * @swagger
 * /api/assessments/{id}/score:
 *   get:
 *     summary: جلب نتيجة التقييم فقط (بدون بيانات تفصيلية)
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: النتيجة والتصنيف
 */

/**
 * @swagger
 * /api/assessments/{id}/gaps:
 *   get:
 *     summary: تحليل الفجوات — مقارنة النتيجة بالمستهدف
 *     tags: [Assessments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: target
 *         schema: { type: integer, default: 80 }
 *         description: النسبة المستهدفة (0-100)
 *     responses:
 *       200:
 *         description: تحليل الفجوات بالأبعاد
 */

// ============================================================
// 📊 ASSESSMENTS — المنهجية #1: إدارة التقييمات (Closed Loop)
// Phase 1.1: تقوية + Gap Analysis + Auto Score
// ============================================================

// Valid assessment statuses
const VALID_STATUSES = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];

// ============ HELPER: Calculate Assessment Score ============
function calculateAssessmentScore(assessment) {
  if (!assessment.dimensions || assessment.dimensions.length === 0) {
    return { overallScore: null, dimensionScores: [], totalCriteria: 0, scoredCriteria: 0 };
  }

  const dimensionScores = [];
  let totalCriteria = 0;
  let scoredCriteria = 0;
  let totalWeightedScore = 0;

  for (const dim of assessment.dimensions) {
    const criteria = dim.criteria || [];
    const scored = criteria.filter(c => c.score !== null && c.score !== undefined);
    const dimTotal = criteria.length;
    const dimScored = scored.length;

    totalCriteria += dimTotal;
    scoredCriteria += dimScored;

    let dimAvgScore = null;
    let dimPercentage = null;

    if (dimScored > 0) {
      dimAvgScore = scored.reduce((sum, c) => sum + c.score, 0) / dimScored;
      // Assume score is 0-5 scale, convert to percentage
      dimPercentage = Math.round((dimAvgScore / 5) * 100);
      totalWeightedScore += dimPercentage;
    }

    dimensionScores.push({
      dimensionId: dim.id,
      dimensionName: dim.name,
      totalCriteria: dimTotal,
      scoredCriteria: dimScored,
      completionRate: dimTotal > 0 ? Math.round((dimScored / dimTotal) * 100) : 0,
      averageScore: dimAvgScore !== null ? Math.round(dimAvgScore * 100) / 100 : null,
      percentage: dimPercentage,
      status: dimScored === 0 ? 'NOT_STARTED' : (dimScored < dimTotal ? 'IN_PROGRESS' : 'COMPLETED')
    });
  }

  const scoredDimensions = dimensionScores.filter(d => d.percentage !== null);
  const overallScore = scoredDimensions.length > 0
    ? Math.round(scoredDimensions.reduce((sum, d) => sum + d.percentage, 0) / scoredDimensions.length)
    : null;

  // Grade based on score
  let grade = null;
  if (overallScore !== null) {
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 75) grade = 'B';
    else if (overallScore >= 60) grade = 'C';
    else if (overallScore >= 40) grade = 'D';
    else grade = 'F';
  }

  return {
    overallScore,
    grade,
    dimensionScores,
    totalCriteria,
    scoredCriteria,
    completionRate: totalCriteria > 0 ? Math.round((scoredCriteria / totalCriteria) * 100) : 0
  };
}

// ============ HELPER: Calculate Gap Analysis ============
function calculateGapAnalysis(assessment, targetScore = 80) {
  const scoreData = calculateAssessmentScore(assessment);

  if (scoreData.overallScore === null) {
    return {
      status: 'NO_DATA',
      message: 'لا توجد بيانات تقييم كافية لتحليل الفجوات',
      overallScore: null,
      targetScore,
      gaps: []
    };
  }

  const overallGap = targetScore - scoreData.overallScore;
  const gaps = [];

  for (const dimScore of scoreData.dimensionScores) {
    if (dimScore.percentage === null) {
      gaps.push({
        dimensionId: dimScore.dimensionId,
        dimensionName: dimScore.dimensionName,
        currentScore: null,
        targetScore,
        gap: null,
        severity: 'UNKNOWN',
        status: 'NOT_EVALUATED',
        recommendation: `البعد "${dimScore.dimensionName}" لم يُقيَّم بعد — يجب تقييمه أولاً`,
        weakCriteria: []
      });
      continue;
    }

    const gap = targetScore - dimScore.percentage;
    let severity = 'NONE';
    if (gap > 40) severity = 'CRITICAL';
    else if (gap > 25) severity = 'HIGH';
    else if (gap > 10) severity = 'MEDIUM';
    else if (gap > 0) severity = 'LOW';

    // Find weak criteria within this dimension
    const dim = assessment.dimensions.find(d => d.id === dimScore.dimensionId);
    const weakCriteria = [];

    if (dim && dim.criteria) {
      for (const criterion of dim.criteria) {
        if (criterion.score === null || criterion.score === undefined) {
          weakCriteria.push({
            criterionId: criterion.id,
            criterionName: criterion.name,
            score: null,
            percentage: null,
            gap: null,
            status: 'NOT_SCORED'
          });
        } else {
          const criterionPercent = Math.round((criterion.score / 5) * 100);
          const criterionGap = targetScore - criterionPercent;
          if (criterionGap > 0) {
            weakCriteria.push({
              criterionId: criterion.id,
              criterionName: criterion.name,
              score: criterion.score,
              percentage: criterionPercent,
              gap: criterionGap,
              status: criterionGap > 40 ? 'CRITICAL' : (criterionGap > 20 ? 'NEEDS_IMPROVEMENT' : 'ACCEPTABLE')
            });
          }
        }
      }
    }

    // Sort weak criteria by gap (largest first)
    weakCriteria.sort((a, b) => (b.gap || 999) - (a.gap || 999));

    let recommendation = '';
    if (severity === 'CRITICAL') {
      recommendation = `البعد "${dimScore.dimensionName}" بحاجة لتدخل عاجل — الفجوة ${gap}%`;
    } else if (severity === 'HIGH') {
      recommendation = `البعد "${dimScore.dimensionName}" يتطلب خطة تحسين — الفجوة ${gap}%`;
    } else if (severity === 'MEDIUM') {
      recommendation = `البعد "${dimScore.dimensionName}" يحتاج تحسين تدريجي — الفجوة ${gap}%`;
    } else if (severity === 'LOW') {
      recommendation = `البعد "${dimScore.dimensionName}" قريب من المستهدف — الفجوة ${gap}%`;
    } else {
      recommendation = `البعد "${dimScore.dimensionName}" يحقق أو يتجاوز المستهدف ✅`;
    }

    gaps.push({
      dimensionId: dimScore.dimensionId,
      dimensionName: dimScore.dimensionName,
      currentScore: dimScore.percentage,
      targetScore,
      gap: Math.max(0, gap),
      severity,
      status: gap <= 0 ? 'ACHIEVED' : 'GAP_EXISTS',
      recommendation,
      weakCriteria
    });
  }

  // Sort gaps by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, UNKNOWN: 3, LOW: 4, NONE: 5 };
  gaps.sort((a, b) => (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5));

  return {
    status: overallGap > 0 ? 'GAP_EXISTS' : 'TARGET_MET',
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    overallScore: scoreData.overallScore,
    overallGrade: scoreData.grade,
    targetScore,
    overallGap: Math.max(0, overallGap),
    completionRate: scoreData.completionRate,
    totalDimensions: scoreData.dimensionScores.length,
    evaluatedDimensions: scoreData.dimensionScores.filter(d => d.percentage !== null).length,
    gapsFound: gaps.filter(g => g.severity !== 'NONE').length,
    criticalGaps: gaps.filter(g => g.severity === 'CRITICAL').length,
    gaps
  };
}


// ============================================================
// GET /api/assessments — List all assessments
// ============================================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, entityId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};

    // Auto-filter by user's entity for non-admin users
    if (req.user.activeEntityId) {
      where.entityId = req.user.activeEntityId;
    } else if (entityId) {
      where.entityId = entityId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, } },
        { description: { contains: search, } }
      ];
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      where.status = status;
    }

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        entity: {
          select: {
            id: true,
            legalName: true,
            displayName: true,
            company: {
              select: { id: true, nameAr: true, nameEn: true }
            },
            sector: {
              select: { id: true, nameAr: true, nameEn: true }
            },
            industry: {
              select: { id: true, nameAr: true, nameEn: true }
            }
          }
        },
        dimensions: {
          include: {
            criteria: true
          }
        },
        _count: {
          select: { dimensions: true, analysisPoints: true }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    const total = await prisma.assessment.count({ where });

    // Enrich with computed scores
    const enrichedAssessments = assessments.map(a => {
      const score = calculateAssessmentScore(a);
      return {
        ...a,
        computedScore: score.overallScore,
        computedGrade: score.grade,
        completionRate: score.completionRate,
        totalCriteria: score.totalCriteria,
        scoredCriteria: score.scoredCriteria
      };
    });

    res.json({
      assessments: enrichedAssessments,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// ============================================================
// GET /api/assessments/suggested-dimensions
// مقترحات الأبعاد الجاهزة
// (MUST be BEFORE /:id to prevent Express matching as param)
// ============================================================
router.get('/suggested-dimensions', verifyToken, (req, res) => {
  const suggestions = {
    categories: [
      {
        id: 'bsc',
        name: 'بطاقة الأداء المتوازن (BSC)',
        icon: '🎯',
        description: 'أبعاد منظور بطاقة الأداء المتوازن — الأكثر شيوعاً',
        dimensions: [
          { name: 'البعد المالي', description: 'قياس الأداء المالي والربحية والاستدامة المالية', icon: '💰', suggestedWeight: 2.5, criteria: ['العائد على الاستثمار', 'نمو الإيرادات', 'كفاءة التكاليف', 'الربحية'] },
          { name: 'بعد العملاء', description: 'رضا العملاء وولاءهم والحصة السوقية', icon: '👥', suggestedWeight: 2.5, criteria: ['رضا العملاء', 'معدل الاحتفاظ', 'الحصة السوقية', 'جودة الخدمة'] },
          { name: 'بعد العمليات الداخلية', description: 'كفاءة العمليات الداخلية والجودة والابتكار', icon: '⚙️', suggestedWeight: 2.0, criteria: ['كفاءة العمليات', 'الجودة', 'وقت الدورة', 'الابتكار'] },
          { name: 'بعد التعلم والنمو', description: 'تنمية الموارد البشرية والتقنية والثقافة المؤسسية', icon: '📚', suggestedWeight: 2.0, criteria: ['تطوير الكفاءات', 'البنية التحتية', 'الثقافة المؤسسية', 'القيادة'] },
        ]
      },
      {
        id: 'general',
        name: 'أبعاد عامة',
        icon: '📊',
        description: 'أبعاد تقييم شائعة تناسب معظم المؤسسات',
        dimensions: [
          { name: 'الحوكمة والقيادة', description: 'جودة الحوكمة والقيادة الاستراتيجية واتخاذ القرار', icon: '🏛️', suggestedWeight: 2.0, criteria: ['وضوح الرؤية', 'جودة القرارات', 'المساءلة', 'الشفافية'] },
          { name: 'الموارد البشرية', description: 'إدارة الموهبة والتدريب والتحفيز والأداء', icon: '🧑‍💼', suggestedWeight: 2.0, criteria: ['الاستقطاب', 'التدريب', 'الأداء', 'الرضا الوظيفي'] },
          { name: 'التحول الرقمي', description: 'النضج الرقمي والأتمتة والبنية التحتية التقنية', icon: '💻', suggestedWeight: 1.5, criteria: ['الأتمتة', 'البنية التحتية', 'الأمن السيبراني', 'التحليلات'] },
          { name: 'الابتكار', description: 'ثقافة الابتكار والبحث والتطوير والتحسين المستمر', icon: '💡', suggestedWeight: 1.5, criteria: ['ثقافة الابتكار', 'البحث والتطوير', 'التحسين المستمر'] },
          { name: 'الاستدامة', description: 'الاستدامة البيئية والاجتماعية والمسؤولية المؤسسية', icon: '🌱', suggestedWeight: 1.5, criteria: ['الأثر البيئي', 'المسؤولية الاجتماعية', 'الاستدامة المالية'] },
          { name: 'إدارة المخاطر', description: 'القدرة على تحديد وإدارة المخاطر والاستجابة للأزمات', icon: '🛡️', suggestedWeight: 2.0, criteria: ['تحديد المخاطر', 'خطط الطوارئ', 'الامتثال'] },
        ]
      },
      {
        id: 'government',
        name: 'أبعاد حكومية',
        icon: '🏢',
        description: 'أبعاد تقييم خاصة بالجهات الحكومية',
        dimensions: [
          { name: 'رضا المستفيدين', description: 'جودة الخدمات الحكومية ومستوى رضا المستفيدين', icon: '⭐', suggestedWeight: 3.0, criteria: ['سرعة الخدمة', 'جودة الخدمة', 'سهولة الوصول', 'قنوات التواصل'] },
          { name: 'الكفاءة التشغيلية', description: 'استغلال الموارد والإنتاجية وتقليل الهدر', icon: '📈', suggestedWeight: 2.5, criteria: ['استغلال الموارد', 'الإنتاجية', 'تقليل الهدر'] },
          { name: 'التوافق مع رؤية 2030', description: 'مستوى التوافق مع أهداف رؤية المملكة 2030', icon: '🇸🇦', suggestedWeight: 3.0, criteria: ['ارتباط بالأهداف الوطنية', 'مؤشرات الرؤية', 'التحول الوطني'] },
          { name: 'الشفافية والمساءلة', description: 'مستوى الشفافية والإفصاح والمساءلة المؤسسية', icon: '📋', suggestedWeight: 2.0, criteria: ['الإفصاح', 'النزاهة', 'المساءلة'] },
        ]
      },
      {
        id: 'advanced',
        name: 'أبعاد متقدمة',
        icon: '🔬',
        description: 'أبعاد تحليلية متقدمة للمؤسسات الناضجة',
        dimensions: [
          { name: 'سلسلة القيمة', description: 'كفاءة سلسلة القيمة من المدخلات حتى القيمة النهائية', icon: '🔗', suggestedWeight: 2.0, criteria: ['الموردين', 'العمليات', 'التوزيع', 'خدمة ما بعد البيع'] },
          { name: 'الميزة التنافسية', description: 'قوة الموقع التنافسي ومصادر التميز', icon: '🏆', suggestedWeight: 2.5, criteria: ['التمايز', 'قيادة التكلفة', 'التركيز', 'القدرات الجوهرية'] },
          { name: 'النضج المؤسسي', description: 'مستوى نضج العمليات والأنظمة والثقافة', icon: '📐', suggestedWeight: 2.0, criteria: ['توحيد العمليات', 'القياس', 'التحسين', 'التحسين المستمر'] },
          { name: 'إدارة المعرفة', description: 'قدرة المؤسسة على اكتساب ونقل وتوظيف المعرفة', icon: '🧠', suggestedWeight: 1.5, criteria: ['اكتساب المعرفة', 'مشاركة المعرفة', 'توظيف المعرفة'] },
        ]
      }
    ],
    weightScale: {
      min: 0.5,
      max: 5.0,
      step: 0.5,
      labels: {
        0.5: 'هامشي',
        1.0: 'عادي',
        1.5: 'مهم',
        2.0: 'مهم جداً',
        2.5: 'حيوي',
        3.0: 'أساسي',
        3.5: 'حرج',
        4.0: 'حرج جداً',
        4.5: 'استراتيجي',
        5.0: 'الأعلى أهمية'
      }
    }
  };

  res.json(suggestions);
});

// ============================================================
// GET /api/assessments/:id — Get single assessment with score
// ============================================================
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        entity: {
          select: {
            id: true,
            legalName: true,
            displayName: true,
            industry: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            },
            sector: {
              select: {
                id: true,
                nameEn: true,
                nameAr: true
              }
            }
          }
        },
        dimensions: {
          include: {
            criteria: {
              orderBy: [
                { createdAt: 'asc' }
              ]
            }
          },
          orderBy: [
            { createdAt: 'asc' }
          ]
        },
        analysisPoints: {
          select: { id: true, type: true, title: true, impact: true, code: true }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Enrich with computed score
    const score = calculateAssessmentScore(assessment);

    res.json({
      ...assessment,
      scoring: score
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});


// ============================================================
// GET /api/assessments/:id/score — Get assessment score only
// ============================================================
router.get('/:id/score', verifyToken, async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        dimensions: {
          include: {
            criteria: true
          }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const score = calculateAssessmentScore(assessment);
    res.json(score);
  } catch (error) {
    console.error('Error calculating score:', error);
    res.status(500).json({ error: 'Failed to calculate assessment score' });
  }
});


// ============================================================
// GET /api/assessments/:id/gaps — Gap Analysis (المهمة 1.1.3)
// Compares score with target and identifies gaps
// ============================================================
router.get('/:id/gaps', verifyToken, async (req, res) => {
  try {
    const { target = 80 } = req.query;
    const targetScore = parseInt(target);

    if (isNaN(targetScore) || targetScore < 0 || targetScore > 100) {
      return res.status(400).json({ error: 'Target must be a number between 0 and 100' });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        entity: {
          select: { id: true, legalName: true, displayName: true }
        },
        dimensions: {
          include: {
            criteria: {
              orderBy: [{ createdAt: 'asc' }]
            }
          },
          orderBy: [{ createdAt: 'asc' }]
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const gapAnalysis = calculateGapAnalysis(assessment, targetScore);
    res.json(gapAnalysis);
  } catch (error) {
    console.error('Error calculating gap analysis:', error);
    res.status(500).json({ error: 'Failed to calculate gap analysis' });
  }
});


// ============================================================
// POST /api/assessments — Create assessment (enhanced validation)
// ============================================================
router.post('/', verifyToken, checkPermission('EDITOR'), enforceLimit('maxAssessments'), async (req, res) => {
  try {
    const { title, description, entityId, status } = req.body;

    // 🔒 Enhanced Validation
    if (!title || !entityId) {
      return res.status(400).json({ error: 'Title and entityId are required' });
    }

    if (title.trim().length < 3) {
      return res.status(400).json({ error: 'Title must be at least 3 characters long' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    // Verify entity exists
    const entity = await prisma.entity.findUnique({ where: { id: entityId } });
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found. Please provide a valid entityId.' });
    }

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        entityId,
        status: status || 'DRAFT'
      },
      include: {
        entity: {
          select: {
            id: true,
            legalName: true,
            displayName: true
          }
        },
        dimensions: true
      }
    });

    res.status(201).json(assessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});


// ============================================================
// PATCH /api/assessments/:id — Update assessment
// ============================================================
router.patch('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const assessmentId = req.params.id;

    // Check if assessment exists
    const existing = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!existing) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // 🔒 Validate status
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    if (title && title.trim().length < 3) {
      return res.status(400).json({ error: 'Title must be at least 3 characters long' });
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const assessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: updateData,
      include: {
        entity: {
          select: {
            id: true,
            legalName: true,
            displayName: true
          }
        },
        dimensions: {
          include: { criteria: true }
        }
      }
    });

    // Return with computed score
    const score = calculateAssessmentScore(assessment);
    res.json({ ...assessment, scoring: score });
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
});


// ============================================================
// DELETE /api/assessments/:id — Delete assessment
// ============================================================
router.delete('/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const assessmentId = req.params.id;

    // Check if assessment exists
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Prevent deleting completed assessments without explicit flag
    if (assessment.status === 'COMPLETED' && !req.query.force) {
      return res.status(400).json({
        error: 'Cannot delete a completed assessment. Add ?force=true to confirm deletion.',
        hint: 'Consider archiving instead: PATCH with status=ARCHIVED'
      });
    }

    // Delete assessment (cascade delete dimensions and criteria)
    await prisma.assessment.delete({ where: { id: assessmentId } });

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});


// ============================================================
// DIMENSIONS CRUD
// ============================================================

// Create dimension
router.post('/:assessmentId/dimensions', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const { name, description, weight, orderIndex } = req.body;
    const { assessmentId } = req.params;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Dimension name is required (min 2 characters)' });
    }

    // Validate weight (0.5 - 5.0)
    if (weight !== undefined && weight !== null) {
      if (typeof weight !== 'number' || weight < 0.5 || weight > 5.0) {
        return res.status(400).json({ error: 'Weight must be between 0.5 and 5.0' });
      }
    }

    // Verify assessment exists
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Get current max order index
    const maxOrder = await prisma.dimension.findFirst({
      where: { assessmentId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true }
    });

    const dimension = await prisma.dimension.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        weight: weight ?? 1.0,
        orderIndex: orderIndex ?? ((maxOrder?.orderIndex ?? -1) + 1),
        assessmentId
      },
      include: {
        criteria: true
      }
    });

    res.status(201).json(dimension);
  } catch (error) {
    console.error('Error creating dimension:', error);
    res.status(500).json({ error: 'Failed to create dimension' });
  }
});

// Update dimension
router.patch('/dimensions/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const { name, description, weight, orderIndex } = req.body;
    const dimensionId = req.params.id;

    const existing = await prisma.dimension.findUnique({ where: { id: dimensionId } });
    if (!existing) {
      return res.status(404).json({ error: 'Dimension not found' });
    }

    // Validate weight
    if (weight !== undefined && weight !== null) {
      if (typeof weight !== 'number' || weight < 0.5 || weight > 5.0) {
        return res.status(400).json({ error: 'Weight must be between 0.5 and 5.0' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (weight !== undefined) updateData.weight = weight;
    if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

    const dimension = await prisma.dimension.update({
      where: { id: dimensionId },
      data: updateData,
      include: {
        criteria: true
      }
    });

    res.json(dimension);
  } catch (error) {
    console.error('Error updating dimension:', error);
    res.status(500).json({ error: 'Failed to update dimension' });
  }
});

// Delete dimension
router.delete('/dimensions/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const dimensionId = req.params.id;

    const dimension = await prisma.dimension.findUnique({ where: { id: dimensionId } });
    if (!dimension) {
      return res.status(404).json({ error: 'Dimension not found' });
    }

    await prisma.dimension.delete({ where: { id: dimensionId } });

    res.json({ message: 'Dimension deleted successfully' });
  } catch (error) {
    console.error('Error deleting dimension:', error);
    res.status(500).json({ error: 'Failed to delete dimension' });
  }
});


// ============================================================
// CRITERIA CRUD
// ============================================================

// Create criterion
router.post('/dimensions/:dimensionId/criteria', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const { name, description, score } = req.body;
    const { dimensionId } = req.params;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Criterion name is required (min 2 characters)' });
    }

    // Validate score range
    if (score !== undefined && score !== null) {
      const numScore = parseFloat(score);
      if (isNaN(numScore) || numScore < 0 || numScore > 5) {
        return res.status(400).json({ error: 'Score must be between 0 and 5' });
      }
    }

    // Verify dimension exists
    const dimension = await prisma.dimension.findUnique({ where: { id: dimensionId } });
    if (!dimension) {
      return res.status(404).json({ error: 'Dimension not found' });
    }

    const criterion = await prisma.criterion.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        score: score !== undefined && score !== null ? parseFloat(score) : null,
        dimensionId
      }
    });

    res.status(201).json(criterion);
  } catch (error) {
    console.error('Error creating criterion:', error);
    res.status(500).json({ error: 'Failed to create criterion' });
  }
});

// Update criterion (with score validation)
router.patch('/criteria/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const { name, description, score } = req.body;
    const criterionId = req.params.id;

    const existing = await prisma.criterion.findUnique({ where: { id: criterionId } });
    if (!existing) {
      return res.status(404).json({ error: 'Criterion not found' });
    }

    // Validate score range
    if (score !== undefined && score !== null) {
      const numScore = parseFloat(score);
      if (isNaN(numScore) || numScore < 0 || numScore > 5) {
        return res.status(400).json({ error: 'Score must be between 0 and 5' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (score !== undefined) updateData.score = score !== null ? parseFloat(score) : null;

    const criterion = await prisma.criterion.update({
      where: { id: criterionId },
      data: updateData
    });

    res.json(criterion);
  } catch (error) {
    console.error('Error updating criterion:', error);
    res.status(500).json({ error: 'Failed to update criterion' });
  }
});

// Delete criterion
router.delete('/criteria/:id', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const criterionId = req.params.id;

    const criterion = await prisma.criterion.findUnique({ where: { id: criterionId } });
    if (!criterion) {
      return res.status(404).json({ error: 'Criterion not found' });
    }

    await prisma.criterion.delete({ where: { id: criterionId } });

    res.json({ message: 'Criterion deleted successfully' });
  } catch (error) {
    console.error('Error deleting criterion:', error);
    res.status(500).json({ error: 'Failed to delete criterion' });
  }
});


// ============================================================
// GET /api/assessments/:id/summary — Quick Summary
// ============================================================
router.get('/:id/summary', verifyToken, async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: {
        entity: { select: { id: true, legalName: true, displayName: true } },
        dimensions: {
          include: { criteria: true }
        },
        analysisPoints: {
          select: { id: true, type: true }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const score = calculateAssessmentScore(assessment);

    // SWOT summary
    const swotSummary = {
      strengths: assessment.analysisPoints.filter(p => p.type === 'STRENGTH').length,
      weaknesses: assessment.analysisPoints.filter(p => p.type === 'WEAKNESS').length,
      opportunities: assessment.analysisPoints.filter(p => p.type === 'OPPORTUNITY').length,
      threats: assessment.analysisPoints.filter(p => p.type === 'THREAT').length,
      total: assessment.analysisPoints.length
    };

    res.json({
      id: assessment.id,
      title: assessment.title,
      status: assessment.status,
      entity: assessment.entity,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      scoring: score,
      swot: swotSummary
    });
  } catch (error) {
    console.error('Error fetching assessment summary:', error);
    res.status(500).json({ error: 'Failed to fetch assessment summary' });
  }
});


// (suggested-dimensions route moved above /:id routes)


// ============================================================
// POST /api/assessments/:assessmentId/dimensions/bulk
// إضافة أبعاد متعددة دفعة واحدة
// ============================================================
router.post('/:assessmentId/dimensions/bulk', verifyToken, checkPermission('EDITOR'), async (req, res) => {
  try {
    const { dimensions } = req.body;
    const { assessmentId } = req.params;

    if (!Array.isArray(dimensions) || dimensions.length === 0) {
      return res.status(400).json({ error: 'dimensions array is required' });
    }

    // Verify assessment exists
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Get current max order
    const maxOrder = await prisma.dimension.findFirst({
      where: { assessmentId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true }
    });
    let nextOrder = (maxOrder?.orderIndex ?? -1) + 1;

    const created = [];
    const errors = [];

    for (let i = 0; i < dimensions.length; i++) {
      const { name, description, weight, criteria } = dimensions[i];

      if (!name || name.trim().length < 2) {
        errors.push({ index: i, error: 'Name required (min 2 chars)' });
        continue;
      }

      const validWeight = (weight !== undefined && weight >= 0.5 && weight <= 5.0) ? weight : 1.0;

      const dim = await prisma.dimension.create({
        data: {
          name: name.trim(),
          description: description || null,
          weight: validWeight,
          orderIndex: nextOrder++,
          assessmentId
        }
      });

      // Auto-create criteria if provided
      if (Array.isArray(criteria) && criteria.length > 0) {
        for (const critName of criteria) {
          if (critName && critName.trim().length >= 2) {
            await prisma.criterion.create({
              data: {
                name: critName.trim(),
                dimensionId: dim.id,
                score: 0
              }
            });
          }
        }
      }

      const fullDim = await prisma.dimension.findUnique({
        where: { id: dim.id },
        include: { criteria: true }
      });

      created.push(fullDim);
    }

    res.status(201).json({
      message: `تم إضافة ${created.length} بُعد بنجاح`,
      created: created.length,
      errors: errors.length,
      dimensions: created,
      errorDetails: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk creating dimensions:', error);
    res.status(500).json({ error: 'Failed to bulk create dimensions' });
  }
});

module.exports = router;
