// routes/tools.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const toolsDataPath = path.join(__dirname, '../src/tools-data.json');
let toolsData = { tools: {} };
let lastLoadTime = 0;

async function loadToolsData() {
    try {
        const content = await fs.readFile(toolsDataPath, 'utf8');
        toolsData = JSON.parse(content);
        lastLoadTime = Date.now();
        console.log(`✅ tools-data.json loaded (${Object.keys(toolsData.tools).length} tools)`);
        return true;
    } catch (err) {
        console.error('❌ فشل تحميل tools-data.json:', err.message);
        return false;
    }
}

// تحميل البيانات عند بدء الخادم (تم النقل إلى server.js)
// loadToolsData();

// ✅ في بيئة التطوير: مراقبة التغييرات وإعادة التحميل تلقائياً
if (process.env.NODE_ENV === 'development') {
    try {
        fsSync.watch(toolsDataPath, (eventType) => {
            if (eventType === 'change') {
                loadToolsData();
                console.log('🔄 tools-data.json reloaded');
            }
        });
    } catch (err) {
        console.warn('⚠️ لا يمكن مراقبة التغييرات على tools-data.json:', err.message);
    }
}

const { verifyToken } = require('../middleware/auth');

// GET /:code (مسجلة في server.js كـ /api/tools)
router.get('/:code', verifyToken, async (req, res) => {
    const { code } = req.params;
    const tool = toolsData.tools[code];
    if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
    }
    // إرجاع البيانات مع مفتاح الكود الذي يعتمد عليه الـ Frontend للعمل
    res.json({ ...tool, code });
});

module.exports = { router, loadToolsData };
