const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function runTest() {
  console.log('🚀 [START] Testing User Report Screen & RBAC for Admin and Super Admin...\n');

  try {
    // 1. Create / login Member user
    console.log('1️⃣ Registering a regular Member...');
    const memberEmail = `member_rbac_${Date.now()}@s2smatrimony.com`;
    const memberReg = await axios.post(`${API_BASE}/auth/register`, {
      email: memberEmail,
      password: 'Password123!',
      firstName: 'Regular',
      lastName: 'Member',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      gender: 'FEMALE',
      dateOfBirth: '1998-08-18',
      profileFor: 'MYSELF',
    });
    const memberToken = memberReg.data?.accessToken || memberReg.data?.data?.accessToken;
    console.log('   ✅ Regular member registered.\n');

    // 2. Test Member attempting to access /super-admin/reports
    console.log('2️⃣ Verifying Member is rejected from User Reports (403 Forbidden)...');
    try {
      await axios.get(`${API_BASE}/super-admin/reports`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      throw new Error('FAILED: Regular member was allowed to access reports analytics!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(`   ✅ Correctly blocked regular member: [${err.response.status}] ${err.response.data?.message}\n`);
      } else {
        throw new Error(`Unexpected status for member: [${err.response?.status}] ${err.message}`);
      }
    }

    // 3. Login as Admin user
    console.log('3️⃣ Logging in as Admin (admin@s2smatrimony.com)...');
    let adminToken;
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@s2smatrimony.com',
      password: 'admin123',
    });
    adminToken = adminLogin.data?.accessToken || adminLogin.data?.data?.accessToken;
    if (!adminToken) throw new Error('Could not obtain Admin access token');
    console.log('   ✅ Logged in as Admin successfully.');

    if (adminToken) {
      // 4. Test Admin accessing /super-admin/reports
      console.log('4️⃣ Testing Admin access to /super-admin/reports...');
      const adminReportsRes = await axios.get(`${API_BASE}/super-admin/reports`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (adminReportsRes.status === 200 && adminReportsRes.data) {
        console.log('   ✅ Admin successfully accessed platform reports analytics!');
        console.log('   Total Registrations in Report:', adminReportsRes.data.totalRegistrations);
        console.log('   Total Revenue in Report:', adminReportsRes.data.totalRevenue);
      } else {
        throw new Error(`Failed to load reports for Admin: status ${adminReportsRes.status}`);
      }

      // 5. Test Admin accessing /super-admin/reports/data
      console.log('5️⃣ Testing Admin access to /super-admin/reports/data (exports dataset)...');
      const adminExportRes = await axios.get(`${API_BASE}/super-admin/reports/data?type=registrations&days=30`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (adminExportRes.status === 200 && Array.isArray(adminExportRes.data?.data)) {
        console.log(`   ✅ Admin successfully retrieved export dataset (${adminExportRes.data.total} records).\n`);
      } else {
        throw new Error(`Failed to get export data for Admin: status ${adminExportRes.status}`);
      }

      // 6. Test Admin trying to access Super Admin exclusive endpoint (e.g. /super-admin/roles)
      console.log('6️⃣ Verifying Admin CANNOT access Super Admin exclusive routes (/super-admin/roles)...');
      try {
        await axios.get(`${API_BASE}/super-admin/roles`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        throw new Error('FAILED: Admin was unexpectedly allowed to access Super Admin exclusive roles endpoint!');
      } catch (err) {
        if (err.response?.status === 403) {
          console.log(`   ✅ Correctly blocked Admin from Super Admin exclusive route: [${err.response.status}] ${err.response.data?.message}\n`);
        } else {
          throw new Error(`Unexpected status for Admin accessing roles: [${err.response?.status}] ${err.message}`);
        }
      }
      // 7. Test Super Admin access to User Reports
      console.log('7️⃣ Testing Super Admin (superadmin@s2smatrimony.com) access to User Reports...');
      const superAdminLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: 'superadmin@s2smatrimony.com',
        password: 'admin123',
      });
      const superAdminToken = superAdminLogin.data?.accessToken || superAdminLogin.data?.data?.accessToken;
      const superAdminReportsRes = await axios.get(`${API_BASE}/super-admin/reports`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      if (superAdminReportsRes.status === 200 && superAdminReportsRes.data) {
        console.log(`   ✅ Super Admin successfully accessed platform reports (${superAdminReportsRes.data.totalRegistrations} registrations).\n`);
      } else {
        throw new Error(`Failed to load reports for Super Admin: status ${superAdminReportsRes.status}`);
      }
    }

    console.log('🎉 [SUCCESS] All User Report RBAC & sharing tests PASSED flawlessly!');
  } catch (error) {
    console.error('\n❌ [TEST FAILURE]:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

runTest();
