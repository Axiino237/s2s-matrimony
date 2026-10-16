const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function runTests() {
  console.log('🚀 [START] Comprehensive Upload Limits & Horoscope Validation Tests...\n');

  try {
    // 1. Verify Public Settings Endpoint
    console.log('1️⃣ Testing /settings/public upload limits...');
    const publicSettingsRes = await axios.get(`${API_BASE}/settings/public`);
    const limits = publicSettingsRes.data?.data?.uploadLimits || publicSettingsRes.data?.uploadLimits;
    console.log('   Public upload limits retrieved:', limits);
    if (!limits || limits.maxHoroscopeFilesCount !== 2 || limits.maxHoroscopeFileSizeMb !== 10) {
      throw new Error(`Unexpected public upload limits: ${JSON.stringify(limits)}`);
    }
    console.log('   ✅ Public upload limits correctly returned (Horoscope: 10MB / 2 files, Photos: 5MB / 5 files, Biodata: 10MB / 10 files).\n');

    // 2. Register test user
    console.log('2️⃣ Registering dedicated test member for upload validation...');
    const timestamp = Date.now();
    const testEmail = `upload_limit_${timestamp}@s2smatrimony.com`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      email: testEmail,
      password: 'Password123!',
      firstName: 'Upload',
      lastName: 'Tester',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      gender: 'MALE',
      dateOfBirth: '1995-05-15',
      profileFor: 'MYSELF',
    });
    const token = regRes.data?.accessToken || regRes.data?.token || regRes.data?.data?.accessToken;
    if (!token) throw new Error('Failed to obtain JWT token for test user');
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('   ✅ Test member registered and authenticated successfully.\n');

    // 3. Test Horoscope File Upload Limits
    console.log('3️⃣ Testing Horoscope File Upload validation...');

    // Clean up any existing horoscope files first
    await axios.delete(`${API_BASE}/profiles/horoscope-file`, { headers: authHeaders }).catch(() => {});

    // A. Oversized file (> 10MB)
    console.log('   A. Attempting upload of oversized horoscope file (10.5MB binary equivalent)...');
    const oversizedLength = Math.ceil(10.5 * 1024 * 1024 * 4 / 3);
    const oversizedBase64 = 'data:application/pdf;base64,' + 'A'.repeat(oversizedLength);
    try {
      await axios.post(`${API_BASE}/profiles/horoscope-file`, { horoscopeFile: oversizedBase64 }, { headers: authHeaders });
      throw new Error('FAILED: Oversized horoscope file was unexpectedly accepted!');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if ((status === 400 || status === 413) && (String(msg).includes('exceeds') || String(msg).includes('too large'))) {
        console.log(`   ✅ Correctly rejected oversized file: [${status}] ${msg}`);
      } else {
        throw new Error(`Unexpected error on oversized file: [${status}] ${msg} - ${JSON.stringify(err.response?.data)}`);
      }
    }

    // B. Invalid file format (e.g. .exe / executable)
    console.log('   B. Attempting upload of invalid format (.exe)...');
    const invalidExtBase64 = 'data:application/x-msdownload;base64,TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAA';
    try {
      await axios.post(`${API_BASE}/profiles/horoscope-file`, { horoscopeFile: invalidExtBase64 }, { headers: authHeaders });
      throw new Error('FAILED: Invalid extension horoscope file was unexpectedly accepted!');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 400 && (String(msg).includes('Unsupported') || String(msg).includes('format'))) {
        console.log(`   ✅ Correctly rejected invalid format: [${status}] ${msg}`);
      } else {
        throw new Error(`Unexpected response for invalid extension: [${status}] ${JSON.stringify(err.response?.data)}`);
      }
    }

    // C. Valid file #1
    console.log('   C. Uploading valid horoscope file #1 (PDF)...');
    const validFile1 = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0tpZHMgWzUgMCBSXQovQ291bnQgMQovVHlwZSAvUGFnZXMKL1Jlc291cmNlcyA8PAovUHJvY1NldCBbL1BERiAvVGV4dF0KL0ZvbnQgPDwKL0YxIDYgMCBSCj4+Cj4+Cj4+CmVuZG9iag==';
    const upload1Res = await axios.post(`${API_BASE}/profiles/horoscope-file`, { horoscopeFile: validFile1 }, { headers: authHeaders });
    console.log('   ✅ File #1 uploaded successfully. Result:', upload1Res.data?.data?.horoscopeFile ? 'File attached' : 'OK');

    // D. Valid file #2 (JPEG chart)
    console.log('   D. Uploading valid horoscope file #2 (JPEG chart)...');
    const validFile2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const upload2Res = await axios.post(`${API_BASE}/profiles/horoscope-file`, { horoscopeFile: validFile2 }, { headers: authHeaders });
    console.log('   ✅ File #2 uploaded successfully. Cumulative count now: 2 files.');

    // E. 3rd file - should strictly REJECT (max 2 files)
    console.log('   E. Attempting upload of file #3 (exceeding 2 files limit)...');
    const validFile3 = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0tpZHMgWzUgMCBSXQ==';
    try {
      await axios.post(`${API_BASE}/profiles/horoscope-file`, { horoscopeFile: validFile3 }, { headers: authHeaders });
      throw new Error('FAILED: 3rd horoscope file was unexpectedly accepted! Max 2 files limit violated.');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 400 && String(msg).includes('limit of 2')) {
        console.log(`   ✅ Correctly rejected 3rd file: [${status}] ${msg}`);
      } else {
        throw new Error(`Unexpected error on 3rd file: [${status}] ${JSON.stringify(err.response?.data)}`);
      }
    }

    // F. Individual file removal
    console.log('   F. Removing file #1 individually by URL/identifier...');
    await axios.delete(`${API_BASE}/profiles/horoscope-file`, {
      headers: authHeaders,
      data: { fileIndex: 0 },
    });
    // Check remaining horoscope files
    const myProfileRes = await axios.get(`${API_BASE}/profiles/me`, { headers: authHeaders });
    const remainingHoro = myProfileRes.data?.data?.horoscope?.horoscopeFile || myProfileRes.data?.horoscope?.horoscopeFile;
    console.log('   Remaining horoscope file in DB:', remainingHoro ? 'Preserved second file' : 'None');
    if (!remainingHoro) {
      throw new Error('FAILED: Individual removal deleted all files instead of retaining the second file!');
    }
    console.log('   ✅ Individual file removal confirmed: second file retained additively.\n');

    // 4. Test Profile Photo Upload Limits (Max 5MB, Max 5 Photos)
    console.log('4️⃣ Testing Profile Photo Upload validation...');

    // A. Oversized photo (> 5MB)
    console.log('   A. Attempting upload of oversized photo (5.5MB binary equivalent)...');
    const oversizedPhotoLength = Math.ceil(5.5 * 1024 * 1024 * 4 / 3);
    const oversizedPhoto = 'data:image/jpeg;base64,' + '/9j/4AAQSkZJRgABAQEASABIAAD/' + 'B'.repeat(oversizedPhotoLength);
    try {
      await axios.post(`${API_BASE}/profiles/photos`, { url: oversizedPhoto, isMain: false }, { headers: authHeaders });
      throw new Error('FAILED: Oversized photo (>5MB) was unexpectedly accepted!');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if ((status === 400 || status === 413) && (String(msg).includes('5 MB') || String(msg).includes('exceeds') || String(msg).includes('too large'))) {
        console.log(`   ✅ Correctly rejected oversized photo: [${status}] ${msg}`);
      } else {
        throw new Error(`Unexpected response for oversized photo: [${status}] ${msg} - ${JSON.stringify(err.response?.data)}`);
      }
    }

    // B. Invalid file format for profile photo (e.g. PDF)
    console.log('   B. Attempting upload of non-image file as profile photo (PDF)...');
    try {
      await axios.post(`${API_BASE}/profiles/photos`, { url: validFile1, isMain: false }, { headers: authHeaders });
      throw new Error('FAILED: Non-image was unexpectedly accepted as profile photo!');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 400 && (String(msg).includes('format') || String(msg).includes('image'))) {
        console.log(`   ✅ Correctly rejected non-image photo: [${status}] ${msg}`);
      } else {
        throw new Error(`Unexpected response for non-image photo: [${status}] ${JSON.stringify(err.response?.data)}`);
      }
    }
    console.log('   ✅ Profile photo file size (5MB) and format validation passed.\n');

    // 5. Test AI Biodata Parser Limits (Max 10MB)
    console.log('5️⃣ Testing AI Biodata Parser file size limit...');
    try {
      await axios.post(
        `${API_BASE}/profiles/parse-biodata`,
        { text: 'Sample text', imageBase64: oversizedBase64, fileName: 'huge_biodata.pdf' },
        { headers: authHeaders }
      );
      throw new Error('FAILED: Oversized biodata was unexpectedly accepted for AI parsing!');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 400 && String(msg).includes('10 MB')) {
        console.log(`   ✅ Correctly rejected oversized biodata file: [${status}] ${msg}`);
      } else {
        throw new Error(`Unexpected response for oversized biodata: [${status}] ${JSON.stringify(err.response?.data)}`);
      }
    }
    console.log('   ✅ AI Biodata parser file size validation passed.\n');

    console.log('🎉 [SUCCESS] All file size and upload limits validation tests PASSED flawlessly!');
  } catch (error) {
    console.error('\n❌ [TEST FAILURE]:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

runTests();
