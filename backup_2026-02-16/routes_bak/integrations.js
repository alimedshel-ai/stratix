const express = require('express');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ============ INTEGRATIONS ============

// Get all integrations
router.get('/', verifyToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, entityId, provider, isActive } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let where = {};

        if (entityId) where.entityId = entityId;
        if (provider) where.provider = provider;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const integrations = await prisma.integration.findMany({
            where,
            include: {
                entity: {
                    select: { id: true, legalName: true, displayName: true }
                }
            },
            skip,
            take: parseInt(limit),
            orderBy: [{ createdAt: 'desc' }]
        });

        const total = await prisma.integration.count({ where });

        res.json({
            integrations,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching integrations:', error);
        res.status(500).json({ error: 'Failed to fetch integrations' });
    }
});

// Get single integration
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const integration = await prisma.integration.findUnique({
            where: { id: req.params.id },
            include: {
                entity: { select: { id: true, legalName: true, displayName: true } }
            }
        });

        if (!integration) return res.status(404).json({ error: 'Integration not found' });
        res.json(integration);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch integration' });
    }
});

// Create integration
router.post('/', verifyToken, async (req, res) => {
    try {
        const { entityId, provider, name, webhookUrl, apiKey, isActive, config } = req.body;

        if (!entityId || !provider || !name) {
            return res.status(400).json({ error: 'entityId, provider, and name are required' });
        }

        const integration = await prisma.integration.create({
            data: {
                entityId,
                provider,
                name,
                webhookUrl: webhookUrl || null,
                apiKey: apiKey || null,
                isActive: isActive || false,
                config: config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null
            },
            include: {
                entity: { select: { id: true, legalName: true } }
            }
        });

        res.status(201).json(integration);
    } catch (error) {
        console.error('Error creating integration:', error);
        res.status(500).json({ error: 'Failed to create integration' });
    }
});

// Update integration
router.patch('/:id', verifyToken, async (req, res) => {
    try {
        const { name, webhookUrl, apiKey, isActive, config, provider } = req.body;

        const existing = await prisma.integration.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Integration not found' });

        const updateData = {};
        if (name) updateData.name = name;
        if (provider) updateData.provider = provider;
        if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
        if (apiKey !== undefined) updateData.apiKey = apiKey;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (config !== undefined) updateData.config = config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null;

        const integration = await prisma.integration.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                entity: { select: { id: true, legalName: true } }
            }
        });

        res.json(integration);
    } catch (error) {
        console.error('Error updating integration:', error);
        res.status(500).json({ error: 'Failed to update integration' });
    }
});

// Toggle integration active status
router.patch('/:id/toggle', verifyToken, async (req, res) => {
    try {
        const existing = await prisma.integration.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Integration not found' });

        const integration = await prisma.integration.update({
            where: { id: req.params.id },
            data: { isActive: !existing.isActive }
        });

        res.json(integration);
    } catch (error) {
        console.error('Error toggling integration:', error);
        res.status(500).json({ error: 'Failed to toggle integration' });
    }
});

// Test webhook connectivity
router.post('/:id/test', verifyToken, async (req, res) => {
    try {
        const integration = await prisma.integration.findUnique({ where: { id: req.params.id } });
        if (!integration) return res.status(404).json({ error: 'Integration not found' });

        if (!integration.webhookUrl) {
            return res.status(400).json({ error: 'No webhook URL configured', success: false });
        }

        // Simulate webhook test
        try {
            const response = await fetch(integration.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: true, source: 'stratix', timestamp: new Date().toISOString() }),
                signal: AbortSignal.timeout(5000)
            });

            // Update last sync time
            await prisma.integration.update({
                where: { id: req.params.id },
                data: { lastSyncAt: new Date() }
            });

            res.json({
                success: response.ok,
                status: response.status,
                message: response.ok ? 'Webhook test successful' : `Webhook returned status ${response.status}`
            });
        } catch (fetchError) {
            res.json({
                success: false,
                message: `Connection failed: ${fetchError.message}`
            });
        }
    } catch (error) {
        console.error('Error testing integration:', error);
        res.status(500).json({ error: 'Failed to test integration' });
    }
});

// Delete integration
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const existing = await prisma.integration.findUnique({ where: { id: req.params.id } });
        if (!existing) return res.status(404).json({ error: 'Integration not found' });

        await prisma.integration.delete({ where: { id: req.params.id } });
        res.json({ message: 'Integration deleted successfully' });
    } catch (error) {
        console.error('Error deleting integration:', error);
        res.status(500).json({ error: 'Failed to delete integration' });
    }
});

module.exports = router;
