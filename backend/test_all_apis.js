const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/v1';

async function runApiTests() {
  console.log('====================================================');
  console.log('🚀 S2S MATRIMONY - COMPREHENSIVE API TEST SUITE');
  console.log('====================================================\n');

  const results = [];

  async function testEndpoint(name, fn) {
    const start = Date.now();
    try {
      const res = await fn();
      const duration = Date.now() - start;
      const status = res.status;
      const success = status >= 200 && status < 300;
      results.push({ name, status, duration, success, error: null });
      console.log(`✅ [${status}] ${name} (${duration}ms)`);
      return res.data;
    } catch (err) {
      const duration = Date.now() - start;
      const status = err.response ? err.response.status : 'ERR';
      const errorMsg = err.response?.data?.message || err.message;
      results.push({ name, status, duration, success: false, error: errorMsg });
      console.log(`❌ [${status}] ${name} (${duration}ms) -> ${JSON.stringify(errorMsg)}`);
      return null;
    }
  }

  // 1. Public Communities & Masters
  console.log('--- 1. COMMUNITIES & MASTERS APIS ---');
  let communities = await testEndpoint('GET /communities', () =>
    axios.get(`${BASE_URL}/communities`)
  );
  
  await testEndpoint('GET /communities/nadar', () =>
    axios.get(`${BASE_URL}/communities/nadar`)
  );

  // 2. Auth Module
  console.log('\n--- 2. AUTHENTICATION & LOGIN APIS ---');
  let superAdminToken = null;
  let memberToken = null;

  // Login SuperAdmin
  const superAdminLogin = await testEndpoint('POST /auth/login (Super Admin)', () =>
    axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@s2smatrimony.com',
      password: 'admin123',
    })
  );
  if (superAdminLogin?.accessToken) {
    superAdminToken = superAdminLogin.accessToken;
  }

  // Register New Member
  const uniqueId = Date.now();
  const registerRes = await testEndpoint('POST /auth/register (New Member)', () =>
    axios.post(`${BASE_URL}/auth/register`, {
      email: `member_${uniqueId}@gmail.com`,
      phone: `919${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'Password@123',
      firstName: 'Karthik',
      lastName: 'Raman',
      gender: 'MALE',
      profileFor: 'SELF',
      maritalStatus: 'NEVER_MARRIED',
      community: 'Nadar',
      religion: 'Hindu',
      about: 'Software professional based in Chennai',
    })
  );

  if (registerRes?.accessToken) {
    memberToken = registerRes.accessToken;
  }

  // Test /auth/me with Member Token
  if (memberToken) {
    await testEndpoint('GET /auth/me (Member)', () =>
      axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      })
    );
  }

  // Test /auth/me with SuperAdmin Token
  if (superAdminToken) {
    await testEndpoint('GET /auth/me (SuperAdmin)', () =>
      axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      })
    );
  }

  // 3. Profiles & Search
  console.log('\n--- 3. PROFILES & SEARCH APIS ---');
  const memberHeaders = memberToken ? { headers: { Authorization: `Bearer ${memberToken}` } } : {};
  
  if (memberToken) {
    await testEndpoint('GET /profiles/me (My Profile)', () =>
      axios.get(`${BASE_URL}/profiles/me`, memberHeaders)
    );

    await testEndpoint('GET /profiles/dashboard-stats', () =>
      axios.get(`${BASE_URL}/profiles/dashboard-stats`, memberHeaders)
    );

    await testEndpoint('GET /profiles/viewers', () =>
      axios.get(`${BASE_URL}/profiles/viewers`, memberHeaders)
    );
  }

  await testEndpoint('POST /profiles/parse-biodata (AI Parser)', () =>
    axios.post(`${BASE_URL}/profiles/parse-biodata`, {
      text: 'Name: Rajesh Kumar, DOB: 15/06/1995, Caste: Nadar, Qualification: B.E Computer Science, Work: Software Engineer, Chennai'
    })
  );

  await testEndpoint('GET /search (Filtered search)', () =>
    axios.get(`${BASE_URL}/search?gender=FEMALE&page=1&limit=10`)
  );

  // 4. Interests & Messaging
  console.log('\n--- 4. INTERESTS & MESSAGING APIS ---');
  if (memberToken) {
    await testEndpoint('GET /interests/received', () =>
      axios.get(`${BASE_URL}/interests/received`, memberHeaders)
    );

    await testEndpoint('GET /interests/sent', () =>
      axios.get(`${BASE_URL}/interests/sent`, memberHeaders)
    );

    await testEndpoint('GET /messages/chats (Active Chat list)', () =>
      axios.get(`${BASE_URL}/messages/chats`, memberHeaders)
    );
  }

  // 5. Payments & Plans
  console.log('\n--- 5. MEMBERSHIP PLANS & PRICING APIS ---');
  await testEndpoint('GET /payments/plans (Active Plans)', () =>
    axios.get(`${BASE_URL}/payments/plans`)
  );

  // 6. Admin & Super Admin APIs
  console.log('\n--- 6. ADMIN & SUPER ADMIN APIS ---');
  const superAdminHeaders = superAdminToken ? { headers: { Authorization: `Bearer ${superAdminToken}` } } : {};

  if (superAdminToken) {
    await testEndpoint('GET /admin/dashboard-stats', () =>
      axios.get(`${BASE_URL}/admin/dashboard-stats`, superAdminHeaders)
    );

    await testEndpoint('GET /admin/users (Admin user list)', () =>
      axios.get(`${BASE_URL}/admin/users?page=1&limit=10`, superAdminHeaders)
    );

    await testEndpoint('GET /admin/profiles (Pending approvals)', () =>
      axios.get(`${BASE_URL}/admin/profiles?page=1&limit=10`, superAdminHeaders)
    );

    await testEndpoint('GET /super-admin/stats (Global Analytics)', () =>
      axios.get(`${BASE_URL}/super-admin/stats`, superAdminHeaders)
    );

    await testEndpoint('GET /super-admin/roles', () =>
      axios.get(`${BASE_URL}/super-admin/roles`, superAdminHeaders)
    );

    await testEndpoint('GET /super-admin/modules-permissions', () =>
      axios.get(`${BASE_URL}/super-admin/modules-permissions`, superAdminHeaders)
    );

    await testEndpoint('GET /super-admin/settings (System Config)', () =>
      axios.get(`${BASE_URL}/super-admin/settings`, superAdminHeaders)
    );

    await testEndpoint('GET /super-admin/reports (Live Reports)', () =>
      axios.get(`${BASE_URL}/super-admin/reports`, superAdminHeaders)
    );
  }

  // Summary
  console.log('\n====================================================');
  console.log('📊 TEST SUMMARY & SCORECARD');
  console.log('====================================================');
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`Total APIs Tested : ${results.length}`);
  console.log(`✅ Passed         : ${passed}`);
  console.log(`❌ Failed         : ${failed}`);
  console.log(`Success Rate      : ${Math.round((passed / results.length) * 100)}%`);
  console.log('====================================================\n');
}

runApiTests();
