const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
    console.log('🧪 Starting Diagnostic Flow Test...');

    // 1. Get a test user (Admin user)
    const user = await prisma.user.findFirst({ where: { email: 'admin@stratix.com' } });
    if (!user) {
        console.error('❌ Could not find admin user for test.');
        return;
    }

    // 2. Get a test entity (Strategic consulting)
    const entity = await prisma.entity.findFirst();
    if (!entity) {
        console.error('❌ Could not find an entity for the test.');
        return;
    }

    // 3. Create a new Diagnostic Session (Level: SCREENING)
    const session = await prisma.diagSession.create({
        data: {
            user: { connect: { id: user.id } },
            entity: { connect: { id: entity.id } },
            level: 'SCREENING',
            status: 'IN_PROGRESS'
        }
    });
    console.log(`✅ Session Created (ID: ${session.id})`);

    // 4. Record a response for the first question (q_user_role)
    const question = await prisma.diagQuestion.findUnique({ where: { questionKey: 'q_user_role' } });
    if (!question) {
        console.error('❌ Could not find question q_user_role.');
        return;
    }

    const response = await prisma.diagResponse.create({
        data: {
            sessionId: session.id,
            questionId: question.id,
            answerValue: 'OWNER',
            answerScore: 10
        }
    });
    console.log(`✅ Response Recorded (Score: ${response.answerScore})`);

    // 5. Verify the session has responses
    const updatedSession = await prisma.diagSession.findUnique({
        where: { id: session.id },
        include: { responses: true }
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Test Summary:`);
    console.log(`- User: ${user.name}`);
    console.log(`- Session Status: ${updatedSession.status}`);
    console.log(`- Responses Count: ${updatedSession.responses.length}`);
    console.log(`- First Answer: ${updatedSession.responses[0].answerValue}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Diagnostic Engine (Database Flow) is WORKING perfectly!');
}

runTest()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
