/**
 * Diagnostic V2 API Routes
 */
'use strict';

const express = require('express');
const router = express.Router();
const sessionService = require('../lib/diag-session-service');
const sessionSaveService = require('../lib/session-save-service');
const sessionResultsService = require('../lib/session-results-service');

const errorMessages = {
    SESSION_NOT_FOUND: 'تعذر العثور على الجلسة، يرجى المحاولة مرة أخرى.',
    SESSION_ALREADY_LINKED: 'هذه الجلسة مرتبطة بالفعل بحساب مستخدم.',
    INVALID_DATA: 'البيانات المرسلة غير مكتملة أو غير صالحة.'
};

/**
 * @route   POST /api/diagnostic/start
 */
router.post('/start', async (req, res) => {
    try {
        const metadata = {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            referrer: req.get('Referrer'),
            ...req.body.metadata
        };
        const result = await sessionService.startSession(metadata);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('[Diagnostic API] Error starting session:', error);
        res.status(500).json({ success: false, message: 'Failed to start session', error: error.message });
    }
});

/**
 * @route   GET /api/diagnostic/questions/:level
 */
router.get('/questions/:level', async (req, res) => {
    try {
        const { level } = req.params;
        const questions = await sessionService.getQuestionsByLevel(level);
        res.json({ success: true, data: questions });
    } catch (error) {
        console.error('[Diagnostic API] Error fetching questions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch questions' });
    }
});

/**
 * @route   GET /api/diagnostic/session/:tempId
 */
router.get('/session/:tempId', async (req, res) => {
    try {
        const { tempId } = req.params;
        const session = await sessionService.getSessionByTempId(tempId);
        if (!session) {
            return res.status(404).json({ success: false, message: errorMessages.SESSION_NOT_FOUND });
        }
        res.json({ success: true, data: session });
    } catch (error) {
        console.error('[Diagnostic API] Error fetching session:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch session' });
    }
});

const jwt = require('jsonwebtoken');

/**
 * @route   POST /api/diagnostic/save
 */
router.post('/save', async (req, res) => {
    try {
        const { tempSessionId, email, orgData } = req.body;
        if (!tempSessionId || !email) {
            return res.status(400).json({ success: false, message: 'بيانات غير مكتملة. يرجى إرسال tempSessionId و email.' });
        }


        // التحقق من صيغة البريد
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'صيغة البريد الإلكتروني غير صحيحة.' });
        }

        const result = await sessionSaveService.saveSession(tempSessionId, email, orgData);

        if (result.success && result.user) {
            const user = result.user;
            // إنشاء JWT token للمستخدم الجديد ليدخل فوراً
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    systemRole: user.systemRole || 'USER',
                    role: 'OWNER',
                    userType: 'COMPANY_MANAGER',
                    entityId: result.entityId
                },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.cookie('token', token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000
            });

            return res.json({ ...result, token });
        }

        res.json(result);

    } catch (error) {
        console.error('[Diagnostic API] Error saving session:', error);

        let status = 500;
        let message = error.message;

        if (error.message.includes('SESSION_NOT_FOUND')) {
            status = 404;
        } else if (error.message.includes('SESSION_ALREADY_LINKED')) {
            status = 409;
        }

        res.status(status).json({ success: false, message: message });
    }
});

/**
 * @route   POST /api/diagnostic/answer
 */
router.post('/answer', async (req, res) => {
    try {
        const { tempSessionId, questionKey, answerValue, metadata } = req.body;
        if (!tempSessionId || !questionKey) {
            return res.status(400).json({ success: false, message: errorMessages.INVALID_DATA });
        }
        const result = await sessionService.processAnswer(tempSessionId, questionKey, answerValue, metadata);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('[Diagnostic API] Error processing answer:', error);
        res.status(500).json({ success: false, message: 'Failed to process answer', error: error.message });
    }
});

/**
 * @route   PATCH /api/diagnostic/level
 */
router.patch('/level', async (req, res) => {
    try {
        const { tempSessionId, newLevel } = req.body;
        if (!tempSessionId || !newLevel) {
            return res.status(400).json({ success: false, message: errorMessages.INVALID_DATA });
        }
        const updatedSession = await sessionService.upgradeSessionLevel(tempSessionId, newLevel);
        res.json({ success: true, data: updatedSession });
    } catch (error) {
        console.error('[Diagnostic API] Error updating level:', error);
        res.status(500).json({ success: false, message: 'Failed to update session level', error: error.message });
    }
});

/**
 * @route   GET /api/diagnostic/result/:tempId
 */
router.get('/result/:tempId', async (req, res) => {
    try {
        const { tempId } = req.params;
        const result = await sessionResultsService.getFreeResults(tempId);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('[Diagnostic API] Error fetching results:', error);
        let status = 500;
        let message = error.message;
        if (error.message.includes('SESSION_NOT_FOUND')) {
            status = 404;
            message = errorMessages.SESSION_NOT_FOUND;
        }
        res.status(status).json({ success: false, message: message });
    }
});

module.exports = router;
