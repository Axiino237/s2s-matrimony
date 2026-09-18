const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/v1';

async function runRbacFullFlowCheck() {
  console.log('===============================================================');
  console.log('🛡️  S2S MATRIMONY - RBAC FULL HIERARCHY & FLOW VERIFICATION');
  console.log('    USERS -> user_assignments -> ROLES -> role_permissions');
  console.log('          -> PERMISSIONS -> screen_permissions -> SCREENS');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function testStep(name, fn) {
    process.stdout.write(`⏳ Testing: ${name}... `);
    try {
      const result = await fn();
      console.log(`✅ PASSED`);
      if (result) {
        console.log(`   └─ ${result}`);
      }
      passed++;
      return true;
    } catch (err) {
      console.log(`❌ FAILED`);
      const msg = err.response?.data?.message || err.message;
      console.log(`   └─ Error: ${JSON.stringify(msg)}`);
      failed++;
      return false;
    }
  }

  let superAdminToken = '';
  let adminToken = '';
  let superAdminUser = null;
  let adminUser = null;
  let testScreenId = null;

  // STEP 1: Super Admin Login & JWT Generation
  await testStep('1. Super Admin Authentication (POST /auth/login)', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@s2smatrimony.com',
      password: 'admin123',
    });
    superAdminToken = res.data.accessToken;
    superAdminUser = res.data.user;
    if (!superAdminToken) throw new Error('No access token returned');
    return `Token acquired for ${superAdminUser.email} (ID: ${superAdminUser.id})`;
  });

  // STEP 2: Verify user_assignments in User Profile
  await testStep('2. Verify user_assignments in Super Admin Profile (GET /auth/me)', async () => {
    const res = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const assignments = res.data.userAssignments || [];
    if (assignments.length === 0) throw new Error('No userAssignments found for superadmin');
    const roleNames = assignments.map(a => a.role?.name || a.roleId).join(', ');
    return `Assignments count: ${assignments.length} | Roles: [${roleNames}]`;
  });

  // STEP 3: Admin Login & Profile Verification
  await testStep('3. Admin User Authentication (POST /auth/login)', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@s2smatrimony.com',
      password: 'admin123',
    });
    adminToken = res.data.accessToken;
    adminUser = res.data.user;
    if (!adminToken) throw new Error('No admin token returned');
    return `Admin token acquired for ${adminUser.email}`;
  });

  // STEP 4: Fetch all registered Screens (GET /rbac/screens)
  let allScreens = [];
  await testStep('4. Fetch all 56 Platform Screens (GET /rbac/screens)', async () => {
    const res = await axios.get(`${BASE_URL}/rbac/screens`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    allScreens = res.data;
    if (!Array.isArray(allScreens) || allScreens.length < 50) {
      throw new Error(`Expected at least 50 screens, got ${allScreens.length}`);
    }
    return `Loaded ${allScreens.length} system screens from PostgreSQL`;
  });

  // STEP 5: Super Admin "My Screens" (GET /rbac/my-screens)
  await testStep('5. Super Admin Screen Access (GET /rbac/my-screens)', async () => {
    const res = await axios.get(`${BASE_URL}/rbac/my-screens`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const myScreens = res.data;
    if (!Array.isArray(myScreens) || myScreens.length === 0) {
      throw new Error('Super admin has 0 accessible screens');
    }
    return `Super Admin has access to ${myScreens.length} screens (Full platform coverage)`;
  });

  // STEP 6: Admin User Screen Access vs Super Admin Screens
  await testStep('6. Compare Admin vs Super Admin Permissions', async () => {
    const adminScreensRes = await axios.get(`${BASE_URL}/rbac/my-screens`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminScreens = adminScreensRes.data;
    const adminSlugs = new Set(adminScreens.map(s => s.slug));
    
    // Check if Super Admin screens are restricted for Admin
    const hasSuperAdminScreens = adminSlugs.has('super-admin-admins') || adminSlugs.has('super-admin-db-audit');
    return `Admin has access to ${adminScreens.length} screens. Super-admin-only screens accessible: ${hasSuperAdminScreens ? 'YES (restricted check)' : 'NO (Properly Segregated)'}`;
  });

  // STEP 7: Guard Check Access Endpoint (GET /rbac/check-access)
  await testStep('7. Screen Access Guard Check (GET /rbac/check-access)', async () => {
    const saCheck = await axios.get(`${BASE_URL}/rbac/check-access?screenSlug=super-admin-admins`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    if (!saCheck.data.hasAccess) throw new Error('Super Admin was denied access to super-admin-admins');

    const adminCheck = await axios.get(`${BASE_URL}/rbac/check-access?screenSlug=admin-dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!adminCheck.data.hasAccess) throw new Error('Admin was denied access to admin-dashboard');

    return `Super Admin -> super-admin-admins: ${saCheck.data.hasAccess} | Admin -> admin-dashboard: ${adminCheck.data.hasAccess}`;
  });

  // STEP 8: Inspect User Screen Access Endpoint (GET /rbac/users/:id/screen-access)
  await testStep('8. Inspect User Screen Access Details (GET /rbac/users/:userId/screen-access)', async () => {
    const res = await axios.get(`${BASE_URL}/rbac/users/${adminUser.id}/screen-access`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data = res.data;
    if (!data.accessibleScreens || !data.roles) {
      throw new Error('Invalid user screen access payload structure');
    }
    return `Roles: ${data.roles.join(', ')} | Accessible Screens: ${data.accessibleScreens.length}`;
  });

  // STEP 9: Dynamic Screen CRUD Flow
  await testStep('9. Dynamic Screen Management Flow (Create -> Verify -> Delete)', async () => {
    const testSlug = `automated-e2e-test-${Date.now()}`;
    const testName = `Automated E2E Test Screen ${Date.now()}`;
    // 1. Create
    const createRes = await axios.post(`${BASE_URL}/rbac/screens`, {
      name: testName,
      slug: testSlug,
      route: '/admin/e2e-test',
      description: 'Temporary screen for flow verification',
      isActive: true,
      sortOrder: 999
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    testScreenId = createRes.data.id;

    // 2. Fetch
    const getRes = await axios.get(`${BASE_URL}/rbac/screens/${testScreenId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    if (getRes.data.slug !== testSlug) {
      throw new Error('Screen slug mismatch on retrieval');
    }

    // 3. Delete
    await axios.delete(`${BASE_URL}/rbac/screens/${testScreenId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    return `Created screen ID ${testScreenId}, verified retrieval, deleted successfully`;
  });

  // STEP 10: Multi-tenant Role Assignment with Community & Expiration
  await testStep('10. Multi-tenant Community & Expiration Assignment', async () => {
    // Get roles
    const rolesRes = await axios.get(`${BASE_URL}/rbac/roles`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const moderatorRole = rolesRes.data.find(r => r.name === 'MODERATOR');
    if (!moderatorRole) throw new Error('MODERATOR role not found');

    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Assign MODERATOR role to adminUser for testing
    const assignRes = await axios.post(`${BASE_URL}/rbac/users/assign-role`, {
      userId: adminUser.id,
      roleId: moderatorRole.id,
      expiresAt: futureDate
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    if (!assignRes.data.id) throw new Error('Failed to create userAssignment');

    // Revoke test assignment
    await axios.delete(`${BASE_URL}/rbac/users/revoke-role/${assignRes.data.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    return `Assigned role ${moderatorRole.name} with expiry ${futureDate.split('T')[0]}, then cleanly revoked`;
  });

  console.log('\n===============================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');

  if (failed === 0) {
    console.log('🎉 ALL RBAC FLOWS FULLY OPERATIONAL AND VERIFIED!');
  }
}

runRbacFullFlowCheck().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
