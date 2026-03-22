// routes/health.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const prisma = require('../lib/prisma'); // عدل المسار حسب مشروعك

// GET /api/health-score?versionId=...
router.get('/api/health-score', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const versionId = req.query.versionId || req.user.activeVersionId;

        // ✅ التحقق من وجود versionId – إرجاع 400 خطأ صريح
        if (!versionId) {
            return res.status(400).json({ error: 'versionId مطلوب' });
        }

        const analyses = await prisma.companyAnalysis.findMany({
            where: {
                userId,
                versionId: versionId,
            },
            select: { progress: true }
        });

        if (analyses.length === 0) {
            return res.json({ overallProgress: 0 });
        }

        const totalProgress = analyses.reduce((sum, a) => sum + a.progress, 0);
        const average = Math.round(totalProgress / analyses.length);
        res.json({ overallProgress: average });
    } catch (err) {
        console.error('Health score error:', err);
        res.status(500).json({ error: 'Failed to compute health score' });
    }
});

module.exports = router;
