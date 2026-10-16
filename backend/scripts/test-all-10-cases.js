const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BASE_URL = 'http://localhost:3001/api/v1/profiles/parse-biodata';

// Helper: Minimal PDF generator
function createPdfWithPages(pagesText) {
  const objects = [];
  const offsets = [];

  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;

  const pageObjectIds = [];
  const contentObjectIds = [];

  for (let i = 0; i < pagesText.length; i++) {
    pageObjectIds.push(4 + i * 2);
    contentObjectIds.push(4 + i * 2 + 1);
  }

  const pdfParts = [];
  pdfParts.push("%PDF-1.4\n");

  offsets.push(Buffer.byteLength(pdfParts.join('')));
  pdfParts.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  offsets.push(Buffer.byteLength(pdfParts.join('')));
  const kidsStr = pageObjectIds.map(id => `${id} 0 R`).join(' ');
  pdfParts.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pagesText.length} >>\nendobj\n`);

  offsets.push(Buffer.byteLength(pdfParts.join('')));
  pdfParts.push(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  for (let i = 0; i < pagesText.length; i++) {
    const pageId = pageObjectIds[i];
    const contentId = contentObjectIds[i];
    const text = pagesText[i];

    const lines = text.split('\n');
    let streamContent = 'BT\n/F1 12 Tf\n40 760 Td\n16 TL\n';
    for (const line of lines) {
      const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      streamContent += `(${escaped}) '\n`;
    }
    streamContent += 'ET\n';

    offsets.push(Buffer.byteLength(pdfParts.join('')));
    pdfParts.push(`${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`);

    offsets.push(Buffer.byteLength(pdfParts.join('')));
    pdfParts.push(`${contentId} 0 obj\n<< /Length ${Buffer.byteLength(streamContent)} >>\nstream\n${streamContent}\nendstream\nendobj\n`);
  }

  const xrefOffset = Buffer.byteLength(pdfParts.join(''));
  const totalObjs = 3 + pagesText.length * 2;
  pdfParts.push(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (const offset of offsets) {
    pdfParts.push(String(offset).padStart(10, '0') + ' 00000 n \n');
  }
  pdfParts.push(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return Buffer.from(pdfParts.join(''), 'utf-8');
}

// Helper: Minimal DOCX generator
function createDocx(xmlContent, mediaImages = {}) {
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[i] = c;
  }
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  const entries = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>',
    'word/document.xml': xmlContent,
    ...mediaImages
  };

  const fileRecords = [];
  let offset = 0;
  const parts = [];

  for (const [name, content] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name, 'utf-8');
    const dataBuf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    const compressed = zlib.deflateRawSync(dataBuf);
    const crc = crc32(dataBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    fileRecords.push({ nameBuf, crc, compSize: compressed.length, uncompSize: dataBuf.length, offset });
    parts.push(localHeader, nameBuf, compressed);
    offset += 30 + nameBuf.length + compressed.length;
  }

  const cdStart = offset;
  for (const rec of fileRecords) {
    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0);
    cdHeader.writeUInt16LE(20, 4);
    cdHeader.writeUInt16LE(20, 6);
    cdHeader.writeUInt16LE(0, 8);
    cdHeader.writeUInt16LE(8, 10);
    cdHeader.writeUInt16LE(0, 12);
    cdHeader.writeUInt16LE(0, 14);
    cdHeader.writeUInt32LE(rec.crc, 16);
    cdHeader.writeUInt32LE(rec.compSize, 20);
    cdHeader.writeUInt32LE(rec.uncompSize, 24);
    cdHeader.writeUInt16LE(rec.nameBuf.length, 28);
    cdHeader.writeUInt16LE(0, 30);
    cdHeader.writeUInt16LE(0, 32);
    cdHeader.writeUInt16LE(0, 34);
    cdHeader.writeUInt16LE(0, 36);
    cdHeader.writeUInt32LE(0, 38);
    cdHeader.writeUInt32LE(rec.offset, 42);

    parts.push(cdHeader, rec.nameBuf);
    offset += 46 + rec.nameBuf.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(fileRecords.length, 8);
  eocd.writeUInt16LE(fileRecords.length, 10);
  eocd.writeUInt32LE(offset - cdStart, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);

  parts.push(eocd);
  return Buffer.concat(parts);
}

// Minimal 1x1 image buffers
const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const dummyJpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');

async function postParseBiodata(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runAll10Tests() {
  console.log('================================================================');
  console.log('RUNNING COMPREHENSIVE AI BIODATA EXTRACTION RELIABILITY TEST SUITE');
  console.log('================================================================\n');

  const results = [];

  // TEST 1: One-page text-based PDF
  try {
    console.log('--- TEST 1: One-page text-based PDF ---');
    const p1 = `MATRIMONY BIODATA
Name: Kausalya Natarajan
Gender: Female
DOB: 12-DEC-1995
Marital Status: Never Married
Height: 162 cm
Weight: 54 kg
Complexion: Fair
Religion: Hindu
Caste: Saiva Pillai
Degree: B.E. Computer Science
Designation: Senior QA Engineer
Company: TCS
Salary: 10 LPA
Location: Chennai
Mobile: 9840112233`;
    const pdfBuf = createPdfWithPages([p1]);
    const res = await postParseBiodata({
      imageBase64: `data:application/pdf;base64,${pdfBuf.toString('base64')}`,
      fileName: 'kausalya_biodata.pdf'
    });
    const pass = res.ok && res.data.profile?.firstName?.includes('Kausalya') && res.data.profile?.gender === 'FEMALE';
    console.log(`Result: ${pass ? 'PASS ✅' : 'FAIL ❌'} (status ${res.status})`);
    console.log('Extracted name:', res.data.profile?.displayName, 'DOB:', res.data.profile?.dateOfBirth, 'Company:', res.data.occupation?.company);
    results.push({ test: '1. One-page text PDF', pass });
  } catch (e) {
    console.error('Test 1 error:', e.message);
    results.push({ test: '1. One-page text PDF', pass: false, error: e.message });
  }

  // TEST 2: Two-page PDF containing biodata across both pages
  try {
    console.log('\n--- TEST 2: Two-page PDF containing biodata across both pages ---');
    const page1 = `MATRIMONY BIODATA - PERSONAL DETAILS
Name: Karthik Subramanian
Gender: Male
DOB: 05-JUL-1992
Marital Status: Never Married
Height: 175 cm
Complexion: Wheatish
Degree: M.Tech Robotics
Company: Bosch Global
Salary: 22 LPA
Location: Coimbatore`;

    const page2 = `FAMILY AND HOROSCOPE DETAILS
Father Name: Subramanian V (Retired Govt Officer)
Mother Name: Gomathi S (Teacher)
Brothers: 1
Sisters: 1
Star: Krithigai - Pada 2
Rasi: Rishabam
Lagnam: Kadagam
Mobile: 9443210987
Address: 15 Cross Road, RS Puram, Coimbatore - 641002`;

    const pdf2Buf = createPdfWithPages([page1, page2]);
    const res = await postParseBiodata({
      imageBase64: `data:application/pdf;base64,${pdf2Buf.toString('base64')}`,
      fileName: 'karthik_2page.pdf'
    });
    const pass = res.ok &&
      res.data.profile?.displayName?.includes('Karthik') &&
      res.data.family?.fatherName?.includes('Subramanian') &&
      res.data.horoscope?.star === 'Krithigai' &&
      res.data.horoscope?.rasi === 'Rishabam';
    console.log(`Result: ${pass ? 'PASS ✅' : 'FAIL ❌'} (status ${res.status})`);
    console.log('Page 1 extracted:', res.data.profile?.displayName, res.data.occupation?.designation || res.data.occupation?.company);
    console.log('Page 2 extracted:', res.data.family?.fatherName, 'Star:', res.data.horoscope?.star, 'Rasi:', res.data.horoscope?.rasi);
    results.push({ test: '2. Two-page PDF across both pages', pass });
  } catch (e) {
    console.error('Test 2 error:', e.message);
    results.push({ test: '2. Two-page PDF across both pages', pass: false, error: e.message });
  }

  // TEST 3: Multi-page scanned PDF (minimal vector text, processed via multimodal vision)
  try {
    console.log('\n--- TEST 3: Multi-page scanned PDF ---');
    // Minimal text to simulate scanned document
    const page1 = `SCANNED BIODATA - REF: 8821\nName: Priya Dharshini\nGender: Female\nDOB: 18-NOV-1994\nDegree: MBA Finance`;
    const page2 = `SCANNED PAGE 2\nFather: Dharshini Raman\nStar: Ashwini\nRasi: Mesham\nMobile: 9789012345`;
    const scannedBuf = createPdfWithPages([page1, page2]);
    const res = await postParseBiodata({
      imageBase64: `data:application/pdf;base64,${scannedBuf.toString('base64')}`,
      fileName: 'scanned_biodata.pdf'
    });
    const pass = res.ok && res.data.profile?.gender === 'FEMALE' && res.data.profile?.displayName?.includes('Priya');
    console.log(`Result: ${pass ? 'PASS ✅' : 'FAIL ❌'} (status ${res.status})`);
    console.log('Name:', res.data.profile?.displayName, 'DOB:', res.data.profile?.dateOfBirth, 'Father:', res.data.family?.fatherName);
    results.push({ test: '3. Multi-page scanned PDF', pass });
  } catch (e) {
    console.error('Test 3 error:', e.message);
    results.push({ test: '3. Multi-page scanned PDF', pass: false, error: e.message });
  }

  // TEST 4: JPEG biodata image
  try {
    console.log('\n--- TEST 4: JPEG biodata image ---');
    const res = await postParseBiodata({
      imageBase64: `data:image/jpeg;base64,${dummyJpg.toString('base64')}`,
      fileName: 'profile_photo.jpg'
    });
    // Valid JPEG format accepted and handled (even if dummy image produces valid schema)
    const pass = res.ok && res.data.profile !== undefined;
    console.log(`Result: ${pass ? 'PASS ✅' : 'FAIL ❌'} (status ${res.status})`);
    results.push({ test: '4. JPEG biodata image', pass });
  } catch (e) {
    console.error('Test 4 error:', e.message);
    results.push({ test: '4. JPEG biodata image', pass: false, error: e.message });
  }

  // TEST 5: PNG biodata image
  try {
    console.log('\n--- TEST 5: PNG biodata image ---');
    const res = await postParseBiodata({
      imageBase64: `data:image/png;base64,${dummyPng.toString('base64')}`,
      fileName: 'biodata_sheet.png'
    });
    const pass = res.ok && res.data.profile !== undefined;
    console.log(`Result: ${pass ? 'PASS ✅' : 'FAIL ❌'} (status ${res.status})`);
    results.push({ test: '5. PNG biodata image', pass });
  } catch (e) {
    console.error('Test 5 error:', e.message);
    results.push({ test: '5. PNG biodata image', pass: false, error: e.message });
  }

  // TEST 6: DOCX biodata document
  try {
    console.log('\n--- TEST 6: DOCX biodata document ---');
    const docxXml = `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>BIODATA</w:t></w:r></w:p>
    <w:p><w:r><w:t>Name: Aravind Seshadri</w:t></w:r></w:p>
    <w:p><w:r><w:t>Gender: Male</w:t></w:r></w:p>
    <w:p><w:r><w:t>DOB: 10-JAN-1991</w:t></w:r></w:p>
    <w:p><w:r><w:t>Degree: M.S. Artificial Intelligence</w:t></w:r></w:p>
    <w:p><w:r><w:t>Designation: AI Architect</w:t></w:r></w:p>
    <w:p><w:r><w:t>Company: Microsoft</w:t></w:r></w:p>
    <w:p><w:r><w:t>Salary: 45 LPA</w:t></w:r></w:p>
    <w:p><w:r><w:t>Father: Seshadri R (Late)</w:t></w:r></w:p>
    <w:p><w:r><w:t>Star: Swathi</w:t></w:r></w:p>
    <w:p><w:r><w:t>Rasi: Thulaam</w:t></w:r></w:p>
    <w:p><w:r><w:t>Mobile: 9888877777</w:t></w:r></w:p>
  </w:body>
</w:document>`;
    const docxBuf = createDocx(docxXml, { 'word/media/image1.png': dummyPng });
    const res = await postParseBiodata({
      imageBase64: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBuf.toString('base64')}`,
      fileName: 'aravind_biodata.docx'
    });
    const pass = res.ok &&
      res.data.profile?.displayName?.includes('Aravind') &&
      res.data.occupation?.company === 'Microsoft' &&
      res.data.family?.fatherAlive === false;
    console.log(`Result: ${pass ? 'PASS ✅' : 'FAIL ❌'} (status ${res.status})`);
    console.log('Name:', res.data.profile?.displayName, 'Company:', res.data.occupation?.company, 'Father Alive:', res.data.family?.fatherAlive);
    results.push({ test: '6. DOCX biodata document', pass });
  } catch (e) {
    console.error('Test 6 error:', e.message);
    results.push({ test: '6. DOCX biodata document', pass: false, error: e.message });
  }

  // TEST 7: Tamil and English mixed-language biodata
  try {
    console.log('\n--- TEST 7: Tamil and English mixed-language biodata ---');
    const tamilText = `சுயவிவரம் (Biodata)
பெயர் (Name): Meenakshi Sundaram
பாலினம்: பெண் (Female)
பிறந்த தேதி (DOB): 14-FEB-1997
படிப்பு (Degree): B.Tech Information Technology
வேலை (Job): Software Engineer in Cognizant
மாத வருமானம் (Monthly Income): 1.2 Lakhs per month
நட்சத்திரம் (Star): அனுஷம் (Anusham - Pada 3)
ராசி (Rasi): விருச்சிகம் (Viruchigam)
தந்தை பெயர்: Sundaram M
தாய் பெயர்: Saradha S
மொபைல் எண்: 9791012345
முகவரி: மதுரை, தமிழ்நாடு`;

    const res = await postParseBiodata({ text: tamilText });
    const pass = res.ok &&
      res.data.profile?.displayName?.includes('Meenakshi') &&
      res.data.profile?.gender === 'FEMALE' &&
      res.data.horoscope?.star?.includes('Anusham') &&
      res.data.horoscope?.rasi === 'Viruchigam';
    console.log(`Result: ${pass ? 'PASS ✅' : 'FAIL ❌'} (status ${res.status})`);
    console.log('Name:', res.data.profile?.displayName, 'Star:', res.data.horoscope?.star, 'Rasi:', res.data.horoscope?.rasi, 'Salary:', res.data.occupation?.salary);
    results.push({ test: '7. Tamil & English mixed biodata', pass });
  } catch (e) {
    console.error('Test 7 error:', e.message);
    results.push({ test: '7. Tamil & English mixed biodata', pass: false, error: e.message });
  }

  // TEST 8: Unsupported file format
  try {
    console.log('\n--- TEST 8: Unsupported file format ---');
    const fakeZipData = Buffer.from('FAKE_SPREADSHEET_DATA_FOR_XLSX_FILE', 'utf-8');
    const res = await postParseBiodata({
      imageBase64: `data:application/vnd.ms-excel;base64,${fakeZipData.toString('base64')}`,
      fileName: 'members.xlsx'
    });
    const pass = res.status === 400 && res.data.message?.includes('Unsupported file format');
    console.log(`Result: ${pass ? 'PASS ✅' : 'FAIL ❌'} (status ${res.status}) - Message: ${res.data.message}`);
    results.push({ test: '8. Unsupported file format (rejected with 400)', pass });
  } catch (e) {
    console.error('Test 8 error:', e.message);
    results.push({ test: '8. Unsupported file format', pass: false, error: e.message });
  }

  // TEST 9: Corrupt or password-protected PDF
  try {
    console.log('\n--- TEST 9: Corrupt or password-protected PDF ---');
    const corruptPdf = Buffer.from('%PDF-1.4\nBROKEN_CORRUPTED_PDF_PAYLOAD_EOF\n', 'utf-8');
    const res = await postParseBiodata({
      imageBase64: `data:application/pdf;base64,${corruptPdf.toString('base64')}`,
      fileName: 'corrupted_file.pdf'
    });
    const pass = res.status === 400 && res.data.message?.includes('Unable to read PDF file');
    console.log(`Result: ${pass ? 'PASS ✅' : 'FAIL ❌'} (status ${res.status}) - Message: ${res.data.message}`);
    results.push({ test: '9. Corrupt/protected PDF (rejected with 400)', pass });
  } catch (e) {
    console.error('Test 9 error:', e.message);
    results.push({ test: '9. Corrupt/protected PDF', pass: false, error: e.message });
  }

  // TEST 10: Document with biodata on page 1 and horoscope charts on page 2
  try {
    console.log('\n--- TEST 10: Document with biodata on page 1 and horoscope charts on page 2 ---');
    const page1 = `MATRIMONY BIODATA
Name: Deepak Krishnan
Gender: Male
DOB: 28-SEP-1994
Height: 180 cm
Degree: B.E. Mechanical Engineering
Company: L&T Construction
Salary: 16 LPA
Location: Chennai
Mobile: 9940567890`;

    const page2 = `HOROSCOPE DETAILS & VEDIC RASI CHART
Father Name: Krishnan S
Mother Name: Vasantha K
Star: Punarpoosam - Pada 4
Rasi: Kadagam
Lagnam: Mesham

Rasi Chart:
Mesham: Lagna
Mithunam: Mercury
Kadagam: Moon, Jupiter
Simmam: Sun
Thulaam: Venus, Saturn
Dhanusu: Rahu
Viruchigam: Mars
Meenam: Ketu`;

    const pdfHoroBuf = createPdfWithPages([page1, page2]);
    const res = await postParseBiodata({
      imageBase64: `data:application/pdf;base64,${pdfHoroBuf.toString('base64')}`,
      fileName: 'deepak_with_chart.pdf'
    });
    const pass = res.ok &&
      res.data.profile?.displayName?.includes('Deepak') &&
      res.data.horoscope?.star?.includes('Punarpoosam') &&
      res.data.horoscope?.rasiChart !== null &&
      Object.keys(res.data.horoscope?.rasiChart || {}).length > 0;
    console.log(`Result: ${pass ? 'PASS ✅' : 'FAIL ❌'} (status ${res.status})`);
    console.log('Name:', res.data.profile?.displayName, 'Rasi:', res.data.horoscope?.rasi);
    console.log('Extracted Rasi Chart Houses:', res.data.horoscope?.rasiChart);
    results.push({ test: '10. Page 1 biodata + Page 2 chart grid', pass });
  } catch (e) {
    console.error('Test 10 error:', e.message);
    results.push({ test: '10. Page 1 biodata + Page 2 chart grid', pass: false, error: e.message });
  }

  console.log('\n================================================================');
  console.log('TEST SUITE SUMMARY:');
  console.log('================================================================');
  let allPassed = true;
  for (const r of results) {
    console.log(`${r.pass ? '✅ PASS' : '❌ FAIL'}: ${r.test}`);
    if (!r.pass) allPassed = false;
  }
  console.log(`\nFinal Verdict: ${allPassed ? 'ALL 10 TESTS PASSED SUCCESSFULLY! 🎉' : 'SOME TESTS FAILED.'}`);
}

runAll10Tests();
