const jwt = require('jsonwebtoken');

async function testApi() {
    const JWT_SECRET = '85ca79d43f51b7199627ed462e21cfecdb4eafbbf1d846b4169fe172efd7d5f9cbd953cbea48c93561f30d7ffe2e254112cd020f016a68f5761e8bdedffac747';
    const token = jwt.sign({
        id: 'test-user-id',
        systemRole: 'USER',
        role: 'ADMIN',
        userType: 'DEPT_MANAGER',
        deptCode: 'hr',
        userCategory: 'DEPT_HR',
        entityId: 'test-entity-id'
    }, JWT_SECRET);

    const url = 'http://localhost:3000/api/company-analysis';
    const payload = {
        versionId: 'cmn37uiqa00096as340ac2ogz',
        toolCode: 'CORE_COMPETENCY',
        data: { competencies: [{ title: 'استقطاب المواهب', impact: 'MEDIUM', impactType: 'neutral' }] },
        status: 'IN_PROGRESS'
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': 'token=' + token },
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        console.log('Status POST:', res.status, text);

        const dataObj = JSON.parse(text);
        if (dataObj.id || dataObj.existingId) {
            const id = dataObj.id || dataObj.existingId;
            console.log('Now patching', id);
            const resPatch = await fetch(url + '/' + id, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Cookie': 'token=' + token },
                body: JSON.stringify(payload)
            });
            console.log('Status PATCH:', resPatch.status, await resPatch.text());
        }

    } catch (err) {
        console.error('Fetch error:', err);
    }
}
testApi();
