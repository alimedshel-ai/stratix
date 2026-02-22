const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================
// 🏗️ SECTORS — المنهجية #2: ربط القطاعات (ISIC)
// Phase 1.2: تقوية + Stats + Hierarchy Validation
// ============================================================


// ============================================================
// GET /api/sectors — List all sectors (enhanced)
// ============================================================
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    let where = {};

    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { nameAr: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sectors, total] = await Promise.all([
      prisma.sector.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: { entities: true, industries: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sector.count({ where }),
    ]);

    res.json({
      sectors,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sectors', error: error.message });
  }
});


// ============================================================
// GET /api/sectors/hierarchy — Full hierarchy tree
// Company → Sector → Industry → Entity → Version
// ============================================================
router.get('/hierarchy', verifyToken, async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({
      include: {
        industries: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            code: true,
            _count: { select: { entities: true } }
          }
        },
        entities: {
          select: {
            id: true,
            legalName: true,
            displayName: true,
            isActive: true,
            companyId: true,
            industryId: true,
            company: {
              select: { id: true, nameAr: true, nameEn: true }
            },
            _count: {
              select: { strategyVersions: true, assessments: true, members: true }
            }
          }
        },
        _count: {
          select: { entities: true, industries: true }
        }
      },
      orderBy: { nameAr: 'asc' }
    });

    // Build hierarchy stats
    const totalSectors = sectors.length;
    const totalEntities = sectors.reduce((sum, s) => sum + s._count.entities, 0);
    const totalIndustries = sectors.reduce((sum, s) => sum + s._count.industries, 0);

    // Integrity checks
    const issues = [];

    // Check for entities without sector
    const orphanEntities = await prisma.entity.count({
      where: { sectorId: null }
    });
    if (orphanEntities > 0) {
      issues.push({
        type: 'ORPHAN_ENTITY',
        severity: 'WARNING',
        message: `${orphanEntities} كيان بدون قطاع محدد`,
        count: orphanEntities
      });
    }

    // Check for entities without industry
    const noIndustryEntities = await prisma.entity.count({
      where: { industryId: null }
    });
    if (noIndustryEntities > 0) {
      issues.push({
        type: 'NO_INDUSTRY',
        severity: 'INFO',
        message: `${noIndustryEntities} كيان بدون صناعة محددة`,
        count: noIndustryEntities
      });
    }

    // Check for entities without company
    const noCompanyEntities = await prisma.entity.count({
      where: { companyId: null }
    });
    if (noCompanyEntities > 0) {
      issues.push({
        type: 'NO_COMPANY',
        severity: 'WARNING',
        message: `${noCompanyEntities} كيان بدون شركة مرتبطة`,
        count: noCompanyEntities
      });
    }

    // Check for empty sectors
    const emptySectors = sectors.filter(s => s._count.entities === 0);
    if (emptySectors.length > 0) {
      issues.push({
        type: 'EMPTY_SECTOR',
        severity: 'INFO',
        message: `${emptySectors.length} قطاع فارغ بدون كيانات`,
        count: emptySectors.length,
        items: emptySectors.map(s => ({ id: s.id, name: s.nameAr }))
      });
    }

    // Check for entities without strategy versions
    const noVersionEntities = await prisma.entity.count({
      where: { strategyVersions: { none: {} } }
    });
    if (noVersionEntities > 0) {
      issues.push({
        type: 'NO_STRATEGY',
        severity: 'WARNING',
        message: `${noVersionEntities} كيان بدون خطة استراتيجية`,
        count: noVersionEntities
      });
    }

    res.json({
      hierarchy: sectors,
      stats: {
        totalSectors,
        totalIndustries,
        totalEntities,
        orphanEntities,
        issuesCount: issues.length
      },
      issues,
      integrity: issues.length === 0 ? 'HEALTHY' : (issues.some(i => i.severity === 'WARNING') ? 'NEEDS_ATTENTION' : 'GOOD')
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching hierarchy', error: error.message });
  }
});


// ============================================================
// GET /api/sectors/:id — Get single sector (enhanced)
// ============================================================
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const sector = await prisma.sector.findUnique({
      where: { id: req.params.id },
      include: {
        industries: { select: { id: true, nameAr: true, nameEn: true, code: true } },
        entities: {
          select: {
            id: true,
            legalName: true,
            displayName: true,
            isActive: true,
            company: {
              select: { id: true, nameAr: true, nameEn: true }
            },
            industry: {
              select: { id: true, nameAr: true, nameEn: true }
            },
            _count: {
              select: { strategyVersions: true, assessments: true, members: true }
            }
          },
        },
        _count: {
          select: { entities: true, industries: true }
        }
      },
    });

    if (!sector) {
      return res.status(404).json({ message: 'Sector not found' });
    }

    res.json({ sector });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sector', error: error.message });
  }
});


// ============================================================
// GET /api/sectors/:id/stats — Sector Statistics (المهمة 1.2.2)
// Entity count + health + performance + strategy coverage
// ============================================================
router.get('/:id/stats', verifyToken, async (req, res) => {
  try {
    const sectorId = req.params.id;

    // Verify sector exists
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
      select: { id: true, nameAr: true, nameEn: true, code: true }
    });

    if (!sector) {
      return res.status(404).json({ message: 'Sector not found' });
    }

    // Get all entities in this sector with deep data
    const entities = await prisma.entity.findMany({
      where: { sectorId },
      include: {
        company: { select: { id: true, nameAr: true, nameEn: true } },
        industry: { select: { id: true, nameAr: true, nameEn: true } },
        strategyVersions: {
          where: { isActive: true },
          select: {
            id: true,
            versionNumber: true,
            status: true,
            objectives: { select: { id: true } },
            kpis: {
              select: {
                id: true,
                target: true,
                actual: true,
                status: true
              }
            },
            initiatives: {
              select: {
                id: true,
                status: true,
                progress: true
              }
            },
            reviews: {
              select: { id: true, decision: true }
            },
            risks: {
              select: { id: true, category: true }
            }
          }
        },
        assessments: {
          include: {
            dimensions: {
              include: { criteria: true }
            }
          }
        },
        _count: {
          select: { members: true }
        }
      }
    });

    const totalEntities = entities.length;
    const activeEntities = entities.filter(e => e.isActive).length;

    // Strategy coverage
    const entitiesWithStrategy = entities.filter(e => e.strategyVersions.length > 0).length;
    const strategyCoverage = totalEntities > 0 ? Math.round((entitiesWithStrategy / totalEntities) * 100) : 0;

    // Assessment coverage
    const entitiesWithAssessment = entities.filter(e => e.assessments.length > 0).length;
    const assessmentCoverage = totalEntities > 0 ? Math.round((entitiesWithAssessment / totalEntities) * 100) : 0;

    // Aggregate KPI performance
    let totalKPIs = 0;
    let onTrackKPIs = 0;
    let atRiskKPIs = 0;
    let criticalKPIs = 0;

    // Aggregate initiatives
    let totalInitiatives = 0;
    let completedInitiatives = 0;
    let inProgressInitiatives = 0;
    let avgInitiativeProgress = 0;

    // Aggregate objectives
    let totalObjectives = 0;
    let totalReviews = 0;
    let totalRisks = 0;

    // Companies in this sector
    const companySet = new Set();

    // Per-entity details
    const entityDetails = [];

    for (const entity of entities) {
      if (entity.company) {
        companySet.add(entity.company.id);
      }

      const activeVersion = entity.strategyVersions[0]; // already filtered to active

      let entityKPIs = 0;
      let entityObjectives = 0;
      let entityInitiatives = 0;
      let entityHealth = null;

      if (activeVersion) {
        entityObjectives = activeVersion.objectives.length;
        totalObjectives += entityObjectives;

        entityKPIs = activeVersion.kpis.length;
        totalKPIs += entityKPIs;

        for (const kpi of activeVersion.kpis) {
          if (kpi.actual !== null && kpi.target !== null && kpi.target > 0) {
            const ratio = kpi.actual / kpi.target;
            if (ratio >= 0.8) onTrackKPIs++;
            else if (ratio >= 0.5) atRiskKPIs++;
            else criticalKPIs++;
          }
        }

        entityInitiatives = activeVersion.initiatives.length;
        totalInitiatives += entityInitiatives;

        for (const init of activeVersion.initiatives) {
          if (init.status === 'COMPLETED') completedInitiatives++;
          else if (init.status === 'IN_PROGRESS') inProgressInitiatives++;
          avgInitiativeProgress += (init.progress || 0);
        }

        totalReviews += activeVersion.reviews.length;
        totalRisks += activeVersion.risks.length;

        // Simple health score for entity
        const kpiScore = entityKPIs > 0 ? (onTrackKPIs / entityKPIs) * 100 : 0;
        const initScore = entityInitiatives > 0 ? (completedInitiatives / entityInitiatives) * 100 : 0;
        entityHealth = Math.round((kpiScore * 0.6 + initScore * 0.4));
      }

      entityDetails.push({
        id: entity.id,
        name: entity.legalName || entity.displayName,
        isActive: entity.isActive,
        company: entity.company,
        industry: entity.industry,
        hasStrategy: entity.strategyVersions.length > 0,
        hasAssessment: entity.assessments.length > 0,
        objectives: entityObjectives,
        kpis: entityKPIs,
        initiatives: entityInitiatives,
        members: entity._count.members,
        healthScore: entityHealth
      });
    }

    // Overall KPI performance
    const kpiPerformance = totalKPIs > 0 ? {
      total: totalKPIs,
      onTrack: onTrackKPIs,
      atRisk: atRiskKPIs,
      critical: criticalKPIs,
      notMeasured: totalKPIs - onTrackKPIs - atRiskKPIs - criticalKPIs,
      performanceRate: Math.round((onTrackKPIs / totalKPIs) * 100)
    } : null;

    // Average initiative progress
    if (totalInitiatives > 0) {
      avgInitiativeProgress = Math.round(avgInitiativeProgress / totalInitiatives);
    }

    // Overall sector health
    let sectorHealth = null;
    if (totalEntities > 0) {
      const validHealthScores = entityDetails.filter(e => e.healthScore !== null);
      if (validHealthScores.length > 0) {
        sectorHealth = Math.round(
          validHealthScores.reduce((sum, e) => sum + e.healthScore, 0) / validHealthScores.length
        );
      }
    }

    res.json({
      sector,
      stats: {
        entities: {
          total: totalEntities,
          active: activeEntities,
          inactive: totalEntities - activeEntities,
          companies: companySet.size
        },
        coverage: {
          strategy: strategyCoverage,
          assessment: assessmentCoverage,
          strategyCount: entitiesWithStrategy,
          assessmentCount: entitiesWithAssessment
        },
        strategic: {
          objectives: totalObjectives,
          kpis: totalKPIs,
          initiatives: totalInitiatives,
          reviews: totalReviews,
          risks: totalRisks
        },
        kpiPerformance,
        initiatives: totalInitiatives > 0 ? {
          total: totalInitiatives,
          completed: completedInitiatives,
          inProgress: inProgressInitiatives,
          planned: totalInitiatives - completedInitiatives - inProgressInitiatives,
          avgProgress: avgInitiativeProgress,
          completionRate: Math.round((completedInitiatives / totalInitiatives) * 100)
        } : null,
        health: {
          sectorScore: sectorHealth,
          grade: sectorHealth !== null ? (
            sectorHealth >= 80 ? 'A' :
              sectorHealth >= 60 ? 'B' :
                sectorHealth >= 40 ? 'C' :
                  sectorHealth >= 20 ? 'D' : 'F'
          ) : null
        }
      },
      entities: entityDetails
    });
  } catch (error) {
    console.error('Error fetching sector stats:', error);
    res.status(500).json({ message: 'Error fetching sector stats', error: error.message });
  }
});


// ============================================================
// POST /api/sectors — Create sector (enhanced validation)
// ============================================================
router.post('/', verifyToken, async (req, res) => {
  try {
    const { nameEn, nameAr, code } = req.body;

    if (!nameEn || !nameAr || !code) {
      return res.status(400).json({ message: 'nameEn, nameAr and code are required' });
    }

    if (nameEn.trim().length < 2 || nameAr.trim().length < 2) {
      return res.status(400).json({ message: 'Sector names must be at least 2 characters' });
    }

    // Check if code already exists
    const existingCode = await prisma.sector.findFirst({
      where: { code: code.trim() },
    });

    if (existingCode) {
      return res.status(400).json({ message: 'Sector code already exists' });
    }

    const sector = await prisma.sector.create({
      data: {
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        code: code.trim(),
      },
    });

    res.status(201).json({ message: 'Sector created successfully', sector });
  } catch (error) {
    res.status(500).json({ message: 'Error creating sector', error: error.message });
  }
});


// ============================================================
// PATCH /api/sectors/:id — Update sector
// ============================================================
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { nameEn, nameAr, code } = req.body;

    // Check if code is being changed and if new code already exists
    if (code) {
      const existingSector = await prisma.sector.findFirst({
        where: {
          code: code.trim(),
          NOT: { id: req.params.id },
        },
      });

      if (existingSector) {
        return res.status(400).json({ message: 'Sector code already exists' });
      }
    }

    const updatedSector = await prisma.sector.update({
      where: { id: req.params.id },
      data: {
        ...(nameEn && { nameEn: nameEn.trim() }),
        ...(nameAr && { nameAr: nameAr.trim() }),
        ...(code && { code: code.trim() }),
      },
    });

    res.json({ message: 'Sector updated successfully', sector: updatedSector });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Sector not found' });
    }
    res.status(500).json({ message: 'Error updating sector', error: error.message });
  }
});


// ============================================================
// DELETE /api/sectors/:id — Delete sector (with dependency check)
// ============================================================
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if sector exists
    const sector = await prisma.sector.findUnique({ where: { id: req.params.id } });
    if (!sector) {
      return res.status(404).json({ message: 'Sector not found' });
    }

    // Check if sector has entities
    const entitiesCount = await prisma.entity.count({
      where: { sectorId: req.params.id },
    });

    if (entitiesCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete sector with entities. Please reassign or delete entities first.',
        entitiesCount,
        hint: 'Reassign entities to another sector before deleting'
      });
    }

    await prisma.sector.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Sector deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting sector', error: error.message });
  }
});

module.exports = router;
