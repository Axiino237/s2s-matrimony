const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testAuditLogsApi() {
  try {
    const token = jwt.sign(
      {
        sub: '6e0f99ff-95e2-451f-8a95-972372fe2b81',
        email: 'superadmin@s2smatrimony.com',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '1h' }
    );

    const headers = { Authorization: `Bearer ${token}` };

    // Test 1: All audit logs (default page 1)
    const allRes = await axios.get('http://localhost:3001/api/v1/super-admin/audit-logs?page=1&limit=15', { headers });
    const allLogs = allRes.data.data || allRes.data.logs;
    console.log(`\n--- Test 1: Default (page 1, limit 15) -> Total in DB: ${allRes.data.total} ---`);
    console.log('Sample returned actions on Page 1:');
    allLogs.slice(0, 10).forEach(l => console.log(`  - ${l.action} | ${l.entity} | ${new Date(l.createdAt).toLocaleTimeString()}`));

    // Test 2: Filter CREATE
    const createRes = await axios.get('http://localhost:3001/api/v1/super-admin/audit-logs?action=CREATE', { headers });
    const createLogs = createRes.data.data || createRes.data.logs;
    console.log(`\n--- Test 2: Action=CREATE -> Count: ${createLogs.length} ---`);
    console.log('Returned actions:', [...new Set(createLogs.map(l => l.action))]);

    // Test 3: Filter UPDATE
    const updateRes = await axios.get('http://localhost:3001/api/v1/super-admin/audit-logs?action=UPDATE', { headers });
    const updateLogs = updateRes.data.data || updateRes.data.logs;
    console.log(`\n--- Test 3: Action=UPDATE -> Count: ${updateLogs.length} ---`);
    console.log('Returned actions:', [...new Set(updateLogs.map(l => l.action))]);

    // Test 4: Filter LOGIN
    const loginLogsRes = await axios.get('http://localhost:3001/api/v1/super-admin/audit-logs?action=LOGIN', { headers });
    const loginLogs = loginLogsRes.data.data || loginLogsRes.data.logs;
    console.log(`\n--- Test 4: Action=LOGIN -> Count: ${loginLogs.length} ---`);
    console.log('Returned actions:', [...new Set(loginLogs.map(l => l.action))]);

    // Test 5: Filter VERIFY
    const verifyRes = await axios.get('http://localhost:3001/api/v1/super-admin/audit-logs?action=VERIFY', { headers });
    const verifyLogs = verifyRes.data.data || verifyRes.data.logs;
    console.log(`\n--- Test 5: Action=VERIFY -> Count: ${verifyLogs.length} ---`);
    console.log('Returned actions:', [...new Set(verifyLogs.map(l => l.action))]);

    // Test 6: Filter PAYMENT
    const payRes = await axios.get('http://localhost:3001/api/v1/super-admin/audit-logs?action=PAYMENT', { headers });
    const payLogs = payRes.data.data || payRes.data.logs;
    console.log(`\n--- Test 6: Action=PAYMENT -> Count: ${payLogs.length} ---`);
    console.log('Returned actions:', [...new Set(payLogs.map(l => l.action))]);

    // Test 7: Filter SUSPEND
    const suspendRes = await axios.get('http://localhost:3001/api/v1/super-admin/audit-logs?action=SUSPEND', { headers });
    const suspendLogs = suspendRes.data.data || suspendRes.data.logs;
    console.log(`\n--- Test 7: Action=SUSPEND -> Count: ${suspendLogs.length} ---`);
    console.log('Returned actions:', [...new Set(suspendLogs.map(l => l.action))]);

    // Test 8: Filter Entity=Plan
    const planRes = await axios.get('http://localhost:3001/api/v1/super-admin/audit-logs?entity=Plan', { headers });
    const planLogs = planRes.data.data || planRes.data.logs;
    console.log(`\n--- Test 8: Entity=Plan -> Count: ${planLogs.length} ---`);
    console.log('Returned entities/actions:', planLogs.map(l => `${l.action} on ${l.entity}`));

  } catch (err) {
    console.error('Audit logs API test failed:', err.message, err.response?.data || '');
  }
}

testAuditLogsApi();
