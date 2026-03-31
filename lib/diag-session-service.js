/**
 * DiagSessionService - منطق إدارة الجلسات التشخيصية V2
 */
'use strict';

const prisma = require('./prisma');
const { crypto } = require('crypto');
const { v4: uuidv4 } = require('uuid'); // assuming uuid is installed, otherwise fallback to crypto

/**
 * مساعد: تحويل options من JSON string إلى Array
 * (SQLite يخزنها كـ string، Prisma لا يحولها تلقائياً عند استخدام String في الـ schema)
 */
function parseJSON(raw) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('Error parsing JSON:', e);
        return null;
    }
}

/**
 * مساعد: توليد tempSessionId فريد
 */
function generateTempId() {
    const randomValue = Math.random().toString(36).substring(2, 18);
    return `tmp_${randomValue}`;
}

/**
 * سحب أسئلة مستوى معين مرتبة
 * @param {string} level - screening, diagnostic, analysis
 */
async function getQuestionsByLevel(level) {
    const questions = await prisma.diagQuestion.findMany({
        where: {
            level: level,
            isActive: true,
        },
        orderBy: { orderIndex: 'asc' },
        include: {
            dependsOnQuestion: true,
        }
    });

    return questions.map((q) => ({
        id: q.id,
        questionKey: q.questionKey,
        questionText: q.questionText,
        questionTextEn: q.questionTextEn || undefined,
        level: q.level,
        category: q.category,
        type: q.type,
        options: parseJSON(q.options),
        orderIndex: q.orderIndex,
        dependsOnQuestionId: q.dependsOnQuestionId,
        dependsOnAnswerValues: parseJSON(q.dependsOnAnswerValues)
    }));
}

/**
 * بدء جلسة جديدة (مؤقتة — بدون مستخدم أو منشأة حالياً)
 * @param {Object} metadata - بيانات إضافية (UTM, Device, etc)
 */
async function startSession(metadata = {}) {
    const tempSessionId = generateTempId();

    // إنشاء الجلسة في قاعدة البيانات
    const session = await prisma.diagSession.create({
        data: {
            tempSessionId,
            level: 'screening',
            status: 'in_progress',
            metadata: metadata ? JSON.stringify(metadata) : null,
            // entityId و startedByUserId تبقى null حتى يسجّل المستخدم أو يختار المنشأة
        },
        select: {
            id: true,
            tempSessionId: true,
            level: true,
        },
    });

    // سحب أول دفعة من الأسئلة (Screening)
    const questions = await getQuestionsByLevel('screening');

    if (questions.length === 0) {
        throw new Error('NO_QUESTIONS_FOUND: لا توجد أسئلة نشطة في مستوى screening');
    }

    return {
        sessionId: session.id,
        tempSessionId: session.tempSessionId,
        firstQuestion: questions[0],
        totalQuestions: questions.length,
        level: session.level,
    };
}

/**
 * التحقق من وجود جلسة بـ tempSessionId
 */
async function getSessionByTempId(tempId) {
    if (!tempId) return null;
    return prisma.diagSession.findUnique({
        where: { tempSessionId: tempId },
        include: {
            entity: true,
            user: true
        }
    });
}

/**
 * ترقية مستوى الجلسة
 */
async function upgradeSessionLevel(tempSessionId, newLevel) {
    if (!tempSessionId) throw new Error('MISSING_TEMP_ID');

    // التحقق من أن المستوى صالح
    const validLevels = ['screening', 'diagnostic', 'analysis'];
    if (!validLevels.includes(newLevel)) {
        throw new Error('INVALID_LEVEL: مستوى غير صالح');
    }

    return prisma.diagSession.update({
        where: { tempSessionId: tempSessionId },
        data: {
            level: newLevel,
            status: 'in_progress',
        }
    });
}

/**
 * معالجة الإجابة وجلب السؤال التالي
 */
async function processAnswer(tempSessionId, questionKey, answerValue, metadata = {}) {
    // 1. جلب الجلسة
    const session = await prisma.diagSession.findUnique({
        where: { tempSessionId },
        include: { responses: true }
    });

    if (!session) throw new Error('SESSION_NOT_FOUND');

    // 2. جلب السؤال
    const question = await prisma.diagQuestion.findUnique({
        where: { questionKey }
    });

    if (!question) throw new Error('QUESTION_NOT_FOUND');

    // 3. حفظ الإجابة (Upsert)
    await prisma.diagnosticResponse.upsert({
        where: {
            sessionId_questionId: {
                sessionId: session.id,
                questionId: question.id
            }
        },
        update: {
            answerValue: String(answerValue),
            timeSpentSec: metadata.timeSpent || null,
        },
        create: {
            sessionId: session.id,
            questionId: question.id,
            answerValue: String(answerValue),
            timeSpentSec: metadata.timeSpent || null,
        }
    });

    // 4. جلب جميع أسئلة المستوى الحالي لتحديد السؤال التالي وحساب التقدم
    const questions = await getQuestionsByLevel(session.level);
    const responsesMap = new Map();

    // جلب الإجابات المحدثة للجلسة
    const allResponses = await prisma.diagnosticResponse.findMany({
        where: { sessionId: session.id }
    });
    allResponses.forEach(r => responsesMap.set(r.questionId, r.answerValue));

    // ✅ تطبيق الإصلاح 1: فلترة عداد الإجابات على المستوى الحالي فقط
    const levelQuestionIds = new Set(questions.map(q => q.id));
    const answeredCount = [...responsesMap.keys()]
        .filter(id => levelQuestionIds.has(id)).length;

    // 5. منطق تحديد السؤال التالي (تجاوز الأسئلة التي لا تنطبق شروطها)
    let nextQuestion = null;
    const currentIndex = questions.findIndex(q => q.id === question.id);

    for (let i = currentIndex + 1; i < questions.length; i++) {
        const q = questions[i];

        // التحقق من الشرط (إذا كان موجوداً)
        if (q.dependsOnQuestionId) {
            const parentAnswer = responsesMap.get(q.dependsOnQuestionId);
            const validAnswers = q.dependsOnAnswerValues || [];

            if (parentAnswer && validAnswers.includes(parentAnswer)) {
                nextQuestion = q;
                break;
            } else {
                continue; // تخطي السؤال لأنه لا يفي بالشرط
            }
        } else {
            nextQuestion = q;
            break;
        }
    }

    return {
        nextQuestion,
        progress: {
            current: answeredCount,
            total: questions.length,
            percent: Math.round((answeredCount / questions.length) * 100)
        },
        levelComplete: !nextQuestion
    };
}

/**
 * جلب جميع إجابات الجلسة في شكل خريطة (Key -> Value)
 */
async function getSessionAnswers(tempSessionId) {
    const session = await prisma.diagSession.findUnique({
        where: { tempSessionId },
        include: {
            responses: {
                include: { question: true }
            }
        }
    });

    if (!session || !session.responses) return {};

    const answers = {};
    session.responses.forEach(r => {
        if (r.question && r.question.questionKey) {
            answers[r.question.questionKey] = r.answerValue;
        }
    });

    return answers;
}

module.exports = {
    startSession,
    getQuestionsByLevel,
    getSessionByTempId,
    processAnswer,
    upgradeSessionLevel,
    getSessionAnswers
};

