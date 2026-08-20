/**
 * Gemini AI Service
 * Uses Google Gemini 2.5 Flash Vision API to extract matrimonial biodata
 * from images and text in Tamil, English, Hindi, or any Indian language.
 */

const GEMINI_API_KEY = 'AIzaSyC3H8zTng1AeyaDlfaaO-V3ojkp0kROuXs';
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const buildPrompt = (mode: 'image' | 'text') => `
You are an expert South Indian matrimonial biodata parser with expertise in Tamil, English, Hindi, Telugu, Kannada, and Malayalam scripts.

${mode === 'image'
  ? 'TASK: Carefully read ALL text visible in this biodata image — including Tamil script, English text, and any mixed-language content. Extract every field you can identify.'
  : 'TASK: Parse the following biodata text and extract every field you can identify.'}

Return ONLY a single valid JSON object. Do NOT include markdown fences, explanation, or extra text — just the raw JSON.

The JSON must use these exact keys (use null for missing/unknown fields):

{
  "name": null,
  "firstName": null,
  "lastName": null,
  "displayName": null,
  "dateOfBirth": null,
  "age": null,
  "gender": null,
  "height": null,
  "heightCm": null,
  "weight": null,
  "weightKg": null,
  "complexion": null,
  "bodyType": null,
  "bloodGroup": null,
  "diet": null,
  "motherTongue": null,
  "religion": null,
  "caste": null,
  "subCaste": null,
  "gothram": null,
  "kuladeivam": null,
  "rasi": null,
  "nakshatra": null,
  "star": null,
  "starPadam": null,
  "lagnam": null,
  "dosham": null,
  "chevvai": null,
  "maritalStatus": null,
  "disability": null,
  "about": null,
  "education": null,
  "college": null,
  "university": null,
  "occupation": null,
  "designation": null,
  "company": null,
  "workLocation": null,
  "annualIncome": null,
  "salary": null,
  "fatherName": null,
  "fatherOccupation": null,
  "motherName": null,
  "motherOccupation": null,
  "siblings": null,
  "elderBrothers": 0,
  "youngerBrothers": 0,
  "elderSisters": 0,
  "youngerSisters": 0,
  "familyType": null,
  "familyStatus": null,
  "nativePlace": null,
  "currentCity": null,
  "address": null,
  "mobile": null,
  "email": null,
  "expectations": null,
  "propertyAssets": null,
  "memberId": null,
  "branch": null,
  "regnDate": null,
  "birthPlace": null,
  "birthTime": null,
  "horoscopeDetails": null
}

CRITICAL RULES:
1. Read Tamil (தமிழ்), English, and Hindi text — all are valid
2. Convert height to heightCm as a number (e.g., "5 ft 6 in" = 168)
3. Normalize gender to exactly "Male" or "Female"
4. For siblings, extract elderBrothers / youngerBrothers / elderSisters / youngerSisters as numbers
5. Extract mobile numbers even if written in Tamil numerals
6. Extract salary/income even if written in lakhs (e.g., "14 LPA" = "14,00,000")
7. If a Tamil word is used, translate it to English for the value
8. name = full name (combination of firstName + lastName)
9. For any field NOT present in the biodata, use null.
10. Return ONLY the JSON — no markdown, no prose, no code fences
`;

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Normalizes any profile object into a clean canonical JSON schema
 * where every single field is present, and missing fields are explicitly null.
 */
export const normalizeCanonicalProfileJson = (d: any = {}): Record<string, any> => {
  const strOrNull = (val: any): string | null => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    return s.length > 0 && s !== 'undefined' && s !== 'null' ? s : null;
  };

  const numOrNull = (val: any): number | null => {
    if (val === undefined || val === null || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  const firstName = strOrNull(d.firstName || (d.name ? String(d.name).split(' ')[0] : null));
  const lastName = strOrNull(d.lastName || (d.name ? String(d.name).split(' ').slice(1).join(' ') : null));
  const fullName = strOrNull(d.name || d.fullName || d.displayName || [firstName, lastName].filter(Boolean).join(' ') || null);

  return {
    memberId: strOrNull(d.memberId || d.member_id),
    regnDate: strOrNull(d.regnDate || d.registrationDate),
    branch: strOrNull(d.branch),
    name: fullName,
    firstName: firstName,
    lastName: lastName,
    displayName: fullName,
    gender: strOrNull(d.gender),
    dateOfBirth: strOrNull(d.dateOfBirth || d.dob),
    age: numOrNull(d.age),
    birthPlace: strOrNull(d.birthPlace || d.birth_place || d.placeOfBirth),
    birthTime: strOrNull(d.birthTime || d.birth_time || d.timeOfBirth),
    birthOrder: numOrNull(d.birthOrder),
    maritalStatus: strOrNull(d.maritalStatus || d.marital_status),
    motherTongue: strOrNull(d.motherTongue || d.mother_tongue || 'Tamil'),
    religion: strOrNull(d.religion),
    caste: strOrNull(d.caste || d.community),
    subCaste: strOrNull(d.subCaste || d.sub_caste || d.subcaste),
    gothram: strOrNull(d.gothram),
    kuladeivam: strOrNull(d.kuladeivam),
    height: strOrNull(d.height),
    heightCm: numOrNull(d.heightCm || d.height_cm),
    weight: strOrNull(d.weight),
    weightKg: numOrNull(d.weightKg || d.weight_kg),
    complexion: strOrNull(d.complexion),
    bodyType: strOrNull(d.bodyType || d.body_type),
    bloodGroup: strOrNull(d.bloodGroup || d.blood_group),
    diet: strOrNull(d.diet),
    disability: strOrNull(d.disability),
    about: strOrNull(d.about || d.aboutMe),
    profilePhotoUrl: strOrNull(d.profilePhotoUrl || d.profile_photo || d.photoUrl),

    education: {
      highestQualification: strOrNull(d.education?.highestQualification || d.education || d.qualification),
      degree: strOrNull(d.education?.degree || d.education || d.degree),
      fieldOfStudy: strOrNull(d.education?.fieldOfStudy || d.fieldOfStudy || d.department),
      college: strOrNull(d.education?.college || d.college || d.educationDetails),
      university: strOrNull(d.education?.university || d.university),
      yearCompleted: numOrNull(d.education?.yearCompleted || d.yearCompleted),
    },

    career: {
      occupation: strOrNull(d.career?.occupation || d.occupation || d.designation),
      designation: strOrNull(d.career?.designation || d.designation || d.occupation),
      company: strOrNull(d.career?.company || d.company || d.companyName),
      annualIncome: strOrNull(d.career?.annualIncome || d.annualIncome || d.salary),
      workLocation: strOrNull(d.career?.workLocation || d.workLocation || d.jobLocation || d.currentCity),
    },

    family: {
      fatherName: strOrNull(d.family?.fatherName || d.fatherName),
      fatherOccupation: strOrNull(d.family?.fatherOccupation || d.fatherOccupation || d.fatherJob),
      motherName: strOrNull(d.family?.motherName || d.motherName),
      motherOccupation: strOrNull(d.family?.motherOccupation || d.motherOccupation || d.motherJob),
      siblings: numOrNull(d.family?.siblings || d.siblings),
      elderBrothers: numOrNull(d.family?.elderBrothers ?? d.elderBrothers ?? d.elderBrother) ?? 0,
      youngerBrothers: numOrNull(d.family?.youngerBrothers ?? d.youngerBrothers ?? d.youngerBrother) ?? 0,
      elderSisters: numOrNull(d.family?.elderSisters ?? d.elderSisters ?? d.elderSister) ?? 0,
      youngerSisters: numOrNull(d.family?.youngerSisters ?? d.youngerSisters ?? d.youngerSister) ?? 0,
      familyType: strOrNull(d.family?.familyType || d.familyType),
      familyStatus: strOrNull(d.family?.familyStatus || d.familyStatus),
      nativePlace: strOrNull(d.family?.nativePlace || d.nativePlace),
      propertyAssets: strOrNull(d.family?.propertyAssets || d.propertyAssets || d.propertyDetails || d.property),
    },

    horoscope: {
      rasi: strOrNull(d.horoscope?.rasi || d.rasi),
      nakshatra: strOrNull(d.horoscope?.nakshatra || d.horoscope?.star || d.nakshatra || d.star || d.natchathiram),
      starPadam: numOrNull(d.horoscope?.starPadam || d.starPadam || d.natchathiramPadham),
      lagnam: strOrNull(d.horoscope?.lagnam || d.lagnam),
      gothram: strOrNull(d.horoscope?.gothram || d.gothram),
      kuladeivam: strOrNull(d.horoscope?.kuladeivam || d.kuladeivam),
      dosham: strOrNull(d.horoscope?.dosham || d.dosham),
      chevvai: strOrNull(d.horoscope?.chevvai || d.chevvai),
      dasaBalance: strOrNull(d.horoscope?.dasaBalance || d.dasaBalance || d.dasaIrupu),
      birthPlace: strOrNull(d.horoscope?.birthPlace || d.birthPlace || d.placeOfBirth),
      birthTime: strOrNull(d.horoscope?.birthTime || d.birthTime || d.timeOfBirth),
      horoscopeDetails: strOrNull(d.horoscope?.horoscopeDetails || d.horoscopeDetails),
    },

    contact: {
      mobile: strOrNull(d.contact?.mobile || d.mobile || d.phone),
      email: strOrNull(d.contact?.email || d.email),
      address: strOrNull(d.contact?.address || d.address),
      currentCity: strOrNull(d.contact?.currentCity || d.currentCity || d.residencePlace || d.city),
      nativePlace: strOrNull(d.contact?.nativePlace || d.nativePlace),
    },

    expectations: strOrNull(d.expectations || d.aboutPartner || d.expectation),
  };
};

const parseGeminiResponse = (text: string): Record<string, any> => {
  // Strip markdown code fences if Gemini adds them despite instructions
  const clean = text
    .replace(/`json\s*/gi, '')
    .replace(/`\s*/g, '')
    .trim();

  // Find first { and last } to extract JSON robustly
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in Gemini response');

  const rawParsed = JSON.parse(clean.slice(start, end + 1));
  return normalizeCanonicalProfileJson(rawParsed);
};

/**
 * Analyze a biodata image (photo / scan) using Gemini Vision
 */
export const analyzeImageWithGemini = async (file: File): Promise<Record<string, any>> => {
  const base64Data = await fileToBase64(file);
  const mimeType = file.type || 'image/jpeg';

  const requestBody = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: buildPrompt('image') },
        ],
      },
    ],
    generationConfig: { temperature: 0.05, topK: 1, topP: 1, maxOutputTokens: 4096 },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    return parseGeminiResponse(text);
  } catch {
    throw new Error('Gemini returned invalid JSON. Please try a clearer image.');
  }
};

/**
 * Analyze a base64 image string (for pages that already have base64)
 */
export const analyzeBase64ImageWithGemini = async (
  base64DataUrl: string,
  mimeType: string = 'image/jpeg'
): Promise<Record<string, any>> => {
  const base64Data = base64DataUrl.includes(',')
    ? base64DataUrl.split(',')[1]
    : base64DataUrl;

  const requestBody = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: buildPrompt('image') },
        ],
      },
    ],
    generationConfig: { temperature: 0.05, topK: 1, topP: 1, maxOutputTokens: 4096 },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    return parseGeminiResponse(text);
  } catch {
    throw new Error('Gemini returned invalid JSON. Please try a clearer image.');
  }
};

/**
 * Analyze plain text biodata using Gemini (Tamil / English / Hindi)
 */
export const analyzeTextWithGemini = async (text: string): Promise<Record<string, any>> => {
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: buildPrompt('text') + `\n\nBIODATA TEXT:\n${text}`,
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.05, topK: 1, topP: 1, maxOutputTokens: 4096 },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    return parseGeminiResponse(responseText);
  } catch {
    throw new Error('Gemini returned invalid JSON. Please try again.');
  }
};
