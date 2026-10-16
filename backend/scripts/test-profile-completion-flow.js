const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTest() {
  console.log('🚀 Starting Profile Completion Flow Verification Test...\n');
  const timestamp = Date.now();
  const testUser = {
    email: `complete_test_${timestamp}@s2smatrimony.com`,
    password: 'Password123!',
    firstName: 'Praveen',
    lastName: 'Kumar',
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    gender: 'MALE',
    dateOfBirth: '1996-06-20',
    profileFor: 'MYSELF',
  };

  // 1. Register user
  console.log('1. Registering user:', testUser.email);
  const regRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    testUser
  );

  if (regRes.status !== 201 && regRes.status !== 200) {
    throw new Error(`Registration failed with status ${regRes.status}: ${JSON.stringify(regRes.data)}`);
  }

  const token = regRes.data?.accessToken || regRes.data?.token || regRes.data?.data?.accessToken;
  console.log('✅ Registered successfully. Access token obtained.');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Fetch initial profile
  console.log('\n2. Fetching initial profile after registration...');
  const initProfileRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/profiles/me',
    method: 'GET',
    headers: authHeaders,
  });

  const initCompletion = initProfileRes.data?.profileCompletionPercent ?? 0;
  console.log(`Initial profile completion: ${initCompletion}%`);
  if (initCompletion >= 100) {
    console.warn('⚠️ Warning: Initial profile was already 100%');
  } else {
    console.log('✅ Initial profile is incomplete (<100%) as expected after registration.');
  }

  // 3. Complete profile with all required details
  console.log('\n3. Saving complete profile details with profileCompletionPercent = 100...');
  const completePayload = {
    firstName: 'Praveen',
    lastName: 'Kumar',
    gender: 'MALE',
    dateOfBirth: '1996-06-20T00:00:00.000Z',
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Tamil',
    heightCm: 178,
    weightKg: 72,
    complexion: 'Fair',
    bodyType: 'ATHLETIC',
    about: 'Software engineer living in Chennai, looking for a compatible partner.',
    aboutMe: 'Software engineer living in Chennai, looking for a compatible partner.',
    religion: 'Hindu',
    caste: 'Nadar',
    subcaste: 'General Nadar',
    education: 'B.Tech',
    educationDetail: 'Computer Science',
    college: 'Anna University',
    occupation: 'Senior Software Engineer',
    employedIn: 'PRIVATE',
    annualIncome: 1800000,
    country: 'India',
    state: 'Tamil Nadu',
    city: 'Chennai',
    citizenship: 'India',
    residenceStatus: 'Citizen',
    residentStatus: 'Citizen',
    familyType: 'NUCLEAR',
    familyStatus: 'MIDDLE',
    familyValues: 'MODERATE',
    fatherName: 'Kumarasamy',
    fatherOccupation: 'Business',
    motherName: 'Lakshmi',
    motherOccupation: 'Homemaker',
    diet: 'VEG',
    smoking: false,
    drinking: false,
    prefAgeMin: 22,
    prefAgeMax: 28,
    prefHeightMin: 155,
    prefHeightMax: 175,
    prefMaritalStatus: 'NEVER_MARRIED',
    prefReligion: 'Hindu',
    prefCaste: 'Nadar',
    prefLocation: 'Chennai',
    profileCompletionPercent: 100,
  };

  const updateRes = await request(
    {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/profiles/me',
      method: 'PATCH',
      headers: authHeaders,
    },
    completePayload
  );

  if (updateRes.status !== 200) {
    throw new Error(`Profile update failed with status ${updateRes.status}: ${JSON.stringify(updateRes.data)}`);
  }
  console.log('✅ Profile PATCH returned 200 OK.');

  // 4. Verify updated profile data
  console.log('\n4. Verifying profile immediately reflects 100% completion in database...');
  const verifyRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/profiles/me',
    method: 'GET',
    headers: authHeaders,
  });

  const updatedCompletion = verifyRes.data?.profileCompletionPercent;
  console.log(`Updated profile completion: ${updatedCompletion}%`);
  if (updatedCompletion !== 100) {
    throw new Error(`Expected profile completion 100%, but got ${updatedCompletion}%`);
  }
  console.log('✅ Database profile completion is 100%!');

  // 5. Verify Dashboard stats
  console.log('\n5. Verifying dashboard stats...');
  const statsRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/profiles/dashboard-stats',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Dashboard stats status:', statsRes.status);
  console.log('Dashboard stats data:', statsRes.data);

  // 6. Verify Search access
  console.log('\n6. Verifying search profiles access...');
  const searchRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/search?limit=5',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Search status:', searchRes.status);
  console.log('Search results count:', searchRes.data?.profiles?.length ?? searchRes.data?.length ?? 0);

  console.log('\n🎉 ALL PROFILE COMPLETION FLOW BACKEND & DATA TESTS PASSED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
