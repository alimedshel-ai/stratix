const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

// Get the current user's active configuration / version
async function getUserVersionId(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            entity: { include: { versions: { where: { status: 'ACTIVE' }, take: 1 } } }
        }
    });

    if (user?.entity?.versions?.[0]) {
        return user.entity.versions[0].id;
    }
    return null;
}

// 1. Get all projects for the current active version
router.get('/', verifyToken, async (req, res) => {
    try {
        const versionId = await getUserVersionId(req.user.id);
        if (!versionId) return res.json([]);

        const projects = await prisma.strategicProject.findMany({
            where: { versionId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء جلب المشاريع.' });
    }
});

// 2. Create a new project
router.post('/', verifyToken, async (req, res) => {
    try {
        const versionId = await getUserVersionId(req.user.id);
        if (!versionId) return res.status(400).json({ error: 'لم يتم العثور على إصدار نشط.' });

        const { name, description, initiative, objective, status, progress, startDate, endDate, manager } = req.body;

        const newProject = await prisma.strategicProject.create({
            data: {
                versionId,
                name,
                description,
                initiative,
                objective,
                status: status || 'planning',
                progress: typeof progress === 'number' ? progress : 0,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                manager
            }
        });

        res.json(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء إنشاء المشروع.' });
    }
});

// 3. Update a project
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const versionId = await getUserVersionId(req.user.id);

        const existingProject = await prisma.strategicProject.findUnique({ where: { id } });
        if (!existingProject || existingProject.versionId !== versionId) {
            return res.status(404).json({ error: 'المشروع غير موجود.' });
        }

        const { name, description, initiative, objective, status, progress, startDate, endDate, manager } = req.body;

        const updatedProject = await prisma.strategicProject.update({
            where: { id },
            data: {
                name,
                description,
                initiative,
                objective,
                status,
                progress: typeof progress === 'number' ? progress : existingProject.progress,
                startDate: startDate ? new Date(startDate) : existingProject.startDate,
                endDate: endDate ? new Date(endDate) : existingProject.endDate,
                manager
            }
        });

        res.json(updatedProject);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديث المشروع.' });
    }
});

// 4. Delete a project
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const versionId = await getUserVersionId(req.user.id);

        const existingProject = await prisma.strategicProject.findUnique({ where: { id } });
        if (!existingProject || existingProject.versionId !== versionId) {
            return res.status(404).json({ error: 'المشروع غير موجود.' });
        }

        await prisma.strategicProject.delete({ where: { id } });
        res.json({ message: 'تم الحذف بنجاح' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء حذف المشروع.' });
    }
});

module.exports = router;
