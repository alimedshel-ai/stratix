const http = require('http');

function request(method, path, data, cookies) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        ...(cookies ? { 'Cookie': cookies } : {})
      }
    };
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        resolve({ status: res.statusCode, body: d, setCookie });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Login as test.finance
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'test.finance@startix.ai',
    password: 'Test1234!'
  });
  console.log('Login status:', loginRes.status);

  const loginData = JSON.parse(loginRes.body);
  if (loginData.message === 'Invalid credentials') {
    console.log('Invalid credentials. Trying admin...');
  } else if (loginRes.setCookie) {
    const cookie = loginRes.setCookie.map(c => c.split(';')[0]).join('; ');
    console.log('Got cookie:', cookie.substring(0, 50) + '...');

    // Check /api/auth/me
    const meRes = await request('GET', '/api/auth/me', null, cookie);
    const me = JSON.parse(meRes.body);
    console.log('Me:', JSON.stringify({ id: me.id, email: me.email, entityId: me.entityId, userType: me.userType }));

    // Check team-overview
    const teamRes = await request('GET', `/api/departments/${me.entityId}/team-overview`, null, cookie);
    const team = JSON.parse(teamRes.body);
    console.log('Team status:', teamRes.status);
    console.log('Departments:', team.departments?.length);
    if (team.departments) {
      team.departments.forEach(d => {
        console.log(`  [${d.code}] ${d.name} - hasMember: ${d.hasMember} - members: ${d.members?.length}`);
      });
    } else {
      console.log('Error:', team.error || team.message);
    }
  } else {
    console.log('Login response:', loginRes.body.substring(0, 200));
  }
}

main().catch(console.error);
