import { Injectable } from '@nestjs/common';

export interface MatrimonyBiodataSchema {
  profile: {
    profile_type: string | null;
    gender: string | null;
    name: string | null;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    age: number | null;
    dob: string | null;
    birth_day: number | null;
    birth_month: number | null;
    birth_year: number | null;
    birth_time: string | null;
    birth_place: string | null;
    height: string | null;
    weight: string | null;
    blood_group: string | null;
    marital_status: string | null;
    mother_tongue: string | null;
    religion: string | null;
    caste: string | null;
    sub_caste: string | null;
    gothram: string | null;
    kuladeivam: string | null;
    rasi: string | null;
    nakshatra: string | null;
    dosham: string | null;
    sevvai_dosham: string | null;
    chevvai: string | null;
    star: string | null;
    citizenship: string | null;
    nationality: string | null;
  };
  education: {
    highest_qualification: string | null;
    degree: string[];
    specialization: string | null;
    college: string | null;
    university: string | null;
  };
  career: {
    occupation: string | null;
    designation: string | null;
    company: string | null;
    work_location: string | null;
    salary: string | null;
    annual_income: string | null;
    business: string | null;
  };
  family: {
    father_name: string | null;
    father_occupation: string | null;
    father_status: string | null;
    mother_name: string | null;
    mother_occupation: string | null;
    siblings: string[];
    family_type: string | null;
    family_status: string | null;
  };
  contact: {
    mobile: string[];
    alternate_mobile: string[];
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    district: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
  };
  property: {
    house: string | null;
    land: string | null;
    vehicle: string | null;
    assets: string | null;
  };
  partner_preference: {
    age: string | null;
    education: string | null;
    profession: string | null;
    salary: string | null;
    location: string | null;
    religion: string | null;
    caste: string | null;
    height: string | null;
    other: string | null;
  };
  horoscope: {
    rasi_chart_detected: boolean;
    amsam_chart_detected: boolean;
    rasi_chart: Record<string, any>;
    amsam_chart: Record<string, any>;
    planet_positions: string[];
    horoscope_notes: string | null;
  };
  images: {
    profile_photo_present: boolean;
    family_photo_present: boolean;
    photo_count: number;
    image_locations: string[];
  };
  document: {
    language: string[];
    page_count: number;
    document_quality: string | null;
    contains_qrcode: boolean;
    contains_barcode: boolean;
    contains_signature: boolean;
    contains_stamp: boolean;
  };
  extra_fields: Record<string, any>;
}

@Injectable()
export class BiodataParserService {
  /**
   * Parses matrimony biodata text or OCR payload in English, Tamil, Hindi or mixed languages.
   * Extracts every field strictly into the specified JSON Schema.
   */
  parseText(rawText: string): MatrimonyBiodataSchema {
    const text = rawText || '';

    // Extract Name
    const nameMatch =
      text.match(/(?:name|பெயர்|naam)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s.]+)/i) ||
      text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m);
    const fullName = nameMatch ? nameMatch[1].trim() : null;

    let firstName: string | null = null;
    let lastName: string | null = null;
    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      firstName = parts[0] || null;
      lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
    }

    // Gender
    let gender: string | null = null;
    if (/(?:female|bride|பெண்|மகள்|daughter|girl)/i.test(text)) {
      gender = 'FEMALE';
    } else if (/(?:male|groom|ஆண்|மகன்|son|boy)/i.test(text)) {
      gender = 'MALE';
    }

    // Date of Birth & Age
    const dobMatch =
      text.match(/(?:dob|date of birth|பிறந்த தேதி|b'day)\s*[:=\-]\s*([\d\/\.\-]+)/i) ||
      text.match(/(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/);
    const dob = dobMatch ? dobMatch[1].trim() : null;

    let birthDay: number | null = null;
    let birthMonth: number | null = null;
    let birthYear: number | null = null;
    if (dob) {
      const dobParts = dob.split(/[\/\.\-]/).map((p) => parseInt(p, 10));
      if (dobParts.length === 3) {
        if (dobParts[0] <= 31 && dobParts[1] <= 12) {
          birthDay = dobParts[0];
          birthMonth = dobParts[1];
          birthYear = dobParts[2] < 100 ? 1900 + dobParts[2] : dobParts[2];
        } else if (dobParts[2] <= 31 && dobParts[1] <= 12) {
          birthYear = dobParts[0] < 100 ? 1900 + dobParts[0] : dobParts[0];
          birthMonth = dobParts[1];
          birthDay = dobParts[2];
        }
      }
    }

    const ageMatch = text.match(/(?:age|வயது)\s*[:=\-]\s*(\d{2})/i);
    const age = ageMatch ? parseInt(ageMatch[1], 10) : (birthYear ? new Date().getFullYear() - birthYear : null);

    // Height & Weight
    const heightMatch = text.match(/(?:height|உயரம்)\s*[:=\-]\s*([0-9'\".\s\-a-zA-Zcmftin]+)/i);
    const height = heightMatch ? heightMatch[1].trim() : null;

    const weightMatch = text.match(/(?:weight|எடை)\s*[:=\-]\s*([0-9.\s\-a-zA-Zkg]+)/i);
    const weight = weightMatch ? weightMatch[1].trim() : null;

    // Religion, Caste, Sub-Caste, Gothram
    const religionMatch = text.match(/(?:religion|மதம்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF]+)/i);
    const religion = religionMatch ? religionMatch[1].trim() : (text.match(/hindu|christian|muslim|jain/i)?.[0] || null);

    const casteMatch = text.match(/(?:caste|சாதி|சமூகம்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const caste = casteMatch ? casteMatch[1].trim() : null;

    const subCasteMatch = text.match(/(?:sub\s*caste|உட்பிரிவு)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const subCaste = subCasteMatch ? subCasteMatch[1].trim() : null;

    const gothramMatch = text.match(/(?:gothram|கோத்திரம்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const gothram = gothramMatch ? gothramMatch[1].trim() : null;

    const kuladeivamMatch = text.match(/(?:kuladeivam|குலதெய்வம்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const kuladeivam = kuladeivamMatch ? kuladeivamMatch[1].trim() : null;

    // Horoscope (Rasi, Nakshatra, Dosham)
    // Horoscope (Rasi, Nakshatra, Lagnam, Dosham, Rasi Chart, Amsam Chart)
    const rasiMatch = text.match(/(?:rasi|ராசி)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const rasi = rasiMatch ? rasiMatch[1].trim() : null;

    const nakshatraMatch = text.match(/(?:star|nakshatra|நட்சத்திரம்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const nakshatra = nakshatraMatch ? nakshatraMatch[1].trim() : null;

    const lagnamMatch = text.match(/(?:lagnam|லக்னம்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const lagnam = lagnamMatch ? lagnamMatch[1].trim() : null;

    const chevvaiMatch = text.match(/(?:chevvai|sevvai|செவ்வாய்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const chevvai = chevvaiMatch ? chevvaiMatch[1].trim() : null;

    const doshamMatch = text.match(/(?:dosham|தோஷம்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const dosham = doshamMatch ? doshamMatch[1].trim() : (chevvai ? `Chevvai: ${chevvai}` : null);

    const jathagamMatch = text.match(/(?:jathagam|ஜாதகம்|horoscope)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s.,()\/\-]+)/i);
    const jathagamDetails = jathagamMatch ? jathagamMatch[1].trim() : (text.match(/suddha jathagam|சுத்த ஜாதகம்|செவ்வாய் தோஷம் இல்லை|chevvai: no/i)?.[0] || null);

    // Detect Rasi & Amsam Chart
    const rasiChartDetected = /(?:ராசி கட்டம்|rasi chart|ஜாதக கட்டம்|இராசி|ராசி)/i.test(text);
    const amsamChartDetected = /(?:அம்ச கட்டம்|amsam chart|அம்சம்)/i.test(text);

    // Planet Shortcodes & Tamil Horoscope Chart Extractor
    const planetShortMap: Record<string, string> = {
      'சந்': 'Chandran (Moon)',
      'பு': 'Budhan (Mercury)',
      'சு': 'Sukran (Venus)',
      'சூ': 'Suriyan (Sun)',
      'கே': 'Ketu',
      'ல': 'Lagnam',
      'செ': 'Chevvai (Mars)',
      'சனி': 'Sani (Saturn)',
      'ரா': 'Rahu',
      'குரு': 'Guru (Jupiter)',
      'வி': 'Vidhi / Guru',
      'கு': 'Guru (Jupiter)',
    };

    const rasiChartObj: Record<string, string> = {};
    const amsamChartObj: Record<string, string> = {};
    const planetPositionsList: string[] = [];

    const houses = ['Mesham', 'Rishabam', 'Mithunam', 'Kadagam', 'Simmam', 'Kanni', 'Thulaam', 'Viruchigam', 'Dhanusu', 'Magaram', 'Kumbam', 'Meenam'];
    const tamilHouses = ['மேஷம்', 'ரிஷபம்', 'மிதுனம்', 'கடகம்', 'சிம்மம்', 'கன்னி', 'துலாம்', 'விருச்சிகம்', 'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்'];

    // 1. Explicit House Match (e.g. மேஷம்: சூரியன், ரிஷபம்: கேது)
    houses.forEach((h, idx) => {
      const th = tamilHouses[idx];
      const regex = new RegExp(`(?:${h}|${th})\\s*[:=\\-]\\s*([A-Za-z\\u0B80-\\u0BFF\\s.,\\/]+)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        const planets = match[1].split(/[\n;]/)[0].trim();
        if (planets) {
          const expanded = planets.split(/[\s,\/.]+/).map(p => planetShortMap[p] || p).join(', ');
          rasiChartObj[h] = expanded;
          planetPositionsList.push(`${h}: ${expanded}`);
        }
      }
    });

    // 2. Tamil Chart Grid Shortcodes Extraction (e.g. சந்.பு.சு, சூ, கே, ல, செ, சனி, ரா, வி)
    if (Object.keys(rasiChartObj).length === 0 && rasiChartDetected) {
      const planetTokens = Array.from(text.matchAll(/(?:சந்|பு|சு|சூ|கே|ல|செ|சனி|ரா|குரு|வி|கு)+/gi)).map(m => m[0]);
      if (planetTokens.length > 0) {
        planetTokens.forEach((token, idx) => {
          const houseName = houses[idx % 12];
          // Split token parts (e.g. சந்.பு.சு -> சந், பு, சு)
          const parts = token.match(/சந்|பு|சு|சூ|கே|ல|செ|சனி|ரா|குரு|வி|கு/g) || [token];
          const expandedPlanets = parts.map(p => planetShortMap[p] || p).join(', ');
          if (expandedPlanets) {
            if (idx < 12) {
              rasiChartObj[houseName] = expandedPlanets;
              planetPositionsList.push(`${houseName}: ${expandedPlanets}`);
            } else {
              amsamChartObj[houses[(idx - 12) % 12]] = expandedPlanets;
            }
          }
        });
      } else {
        if (lagnam) rasiChartObj['Lagnam'] = lagnam;
        if (rasi) rasiChartObj['Rasi'] = rasi;
      }
    }

    // Marital Status & Mother Tongue
    const maritalMatch = text.match(/(?:marital status|marital|திருமண நிலை)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    let maritalStatus: string | null = null;
    if (maritalMatch) {
      const m = maritalMatch[1].trim().toUpperCase();
      if (m.includes('SINGLE') || m.includes('NEVER') || m.includes('UNMARRIED')) maritalStatus = 'NEVER_MARRIED';
      else if (m.includes('DIVORCED')) maritalStatus = 'DIVORCED';
      else if (m.includes('WIDOW')) maritalStatus = 'WIDOWED';
      else maritalStatus = maritalMatch[1].trim();
    } else if (/never married|unmarried|single/i.test(text)) {
      maritalStatus = 'NEVER_MARRIED';
    } else if (/divorced|widowed|மறுமணம்/i.test(text)) {
      maritalStatus = /divorced/i.test(text) ? 'DIVORCED' : 'WIDOWED';
    }

    const motherTongueMatch = text.match(/(?:mother tongue|தாய்மொழி)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const motherTongue = motherTongueMatch ? motherTongueMatch[1].trim() : (text.match(/tamil|telugu|kannada|malayalam|hindi|gujarati|marathi|bengali/i)?.[0] || null);

    // Citizenship & Nationality
    const citizenship = text.match(/(?:citizenship|குடியுரிமை)\s*[:=\-]\s*([A-Za-z\s]+)/i)?.[1]?.trim() || (/(?:indian|nri)/i.test(text) ? (text.match(/indian|nri/i)?.[0] || null) : null);
    const nationality = text.match(/(?:nationality|தேசியம்)\s*[:=\-]\s*([A-Za-z\s]+)/i)?.[1]?.trim() || (/(?:indian|nri)/i.test(text) ? (text.match(/indian|nri/i)?.[0] || null) : null);

    // Education
    const eduMatch = text.match(/(?:education|qualification|படிப்பு|கல்வி)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s.,()\/\-]+)/i);
    const highestQualification = eduMatch ? eduMatch[1].trim() : null;

    // Career & Income
    const occMatch = text.match(/(?:occupation|profession|job|வேலை|தொழில்)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s.,()\/\-]+)/i);
    const occupation = occMatch ? occMatch[1].trim() : null;

    const companyMatch = text.match(/(?:company|works at|நிறுவனம்)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s.,()\/\-]+)/i);
    const company = companyMatch ? companyMatch[1].trim() : null;

    const salaryMatch = text.match(/(?:salary|income|வருமானம்|சம்பளம்)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s.,₹$\-LPA]+)/i);
    const salary = salaryMatch ? salaryMatch[1].trim() : null;

    const workLocationMatch = text.match(/(?:work location|job location|வேலை பார்க்கும் இடம்)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s.,\-]+)/i);
    const workLocation = workLocationMatch ? workLocationMatch[1].trim() : null;

    // Family
    const fatherMatch = text.match(/(?:father|அப்பா|தந்தை)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s.]+)/i);
    const fatherName = fatherMatch ? fatherMatch[1].trim() : null;

    const motherMatch = text.match(/(?:mother|அம்மா|தாய்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s.]+)/i);
    const motherName = motherMatch ? motherMatch[1].trim() : null;

    const motherOccMatch = text.match(/(?:mother occupation|அம்மா வேலை)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const motherOccupation = motherOccMatch ? motherOccMatch[1].trim() : (/(?:homemaker|housewife|வீட்டுத் தலைவி)/i.test(text) ? (text.match(/homemaker|housewife|வீட்டுத் தலைவி/i)?.[0] || null) : null);

    const familyType = text.match(/(?:family type|குடும்ப வகை)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || (text.match(/nuclear|joint|கூட்டு குடும்பம்|தனி குடும்பம்/i)?.[0] || null);
    const familyStatus = text.match(/(?:family status|குடும்ப நிலை)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || (text.match(/middle class|upper middle|rich|high class|நடுத்தரம்|உயர் நடுத்தரம்/i)?.[0] || null);

    // Contact Numbers & Email
    const mobiles = Array.from(text.matchAll(/(?:\+91[\s\-]?)?[6-9]\d{9}/g)).map((m) => m[0]);
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : null;

    const addressMatch = text.match(/(?:address|முகவரி)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s.,\/\-]+)/i);
    const address = addressMatch ? addressMatch[1].trim() : null;

    const cityMatch = text.match(/(?:city|place|இடம்|ஊர்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : null;

    const state = text.match(/(?:state|மாநிலம்)\s*[:=\-]\s*([A-Za-z\s]+)/i)?.[1]?.trim() || (text.match(/tamil nadu|kerala|karnataka|andhra|telangana|maharashtra/i)?.[0] || null);
    const country = text.match(/(?:country|நாடு)\s*[:=\-]\s*([A-Za-z\s]+)/i)?.[1]?.trim() || (text.match(/india|usa|uk|uae|canada|singapore|australia/i)?.[0] || null);

    const birthOrderMatch = text.match(/(?:birth order|பிறப்பு வரிசை)\s*[:=\-]\s*([0-9]+)/i);
    const birthOrderVal = birthOrderMatch ? Number(birthOrderMatch[1]) : null;

    const starPadamMatch = text.match(/(?:padam|பாதம்)\s*[:=\-]?\s*([1-4])/i);
    const starPadamVal = starPadamMatch ? Number(starPadamMatch[1]) : null;

    const dasaBalanceMatch = text.match(/(?:dasa irupu|dasa balance|தசா இருப்பு)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s.,\-]+)/i);
    const dasaBalanceVal = dasaBalanceMatch ? dasaBalanceMatch[1].trim() : null;

    const residentMatch = text.match(/(?:resident|resident status|வீட்டு வகை)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s]+)/i);
    const residentStatusVal = residentMatch ? residentMatch[1].trim() : (text.match(/rent house|own house|lease|quarters|சொந்த வீடு|வாடகை வீடு/i)?.[0] || null);

    const propertyMatch = text.match(/(?:property|property details|சொத்து விவரம்|சொத்துக்கள்)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s.,\-]+)/i);
    const propertyDetailsVal = propertyMatch ? propertyMatch[1].trim() : null;

    const ebMatch = text.match(/(?:elder brother|elder brothers|மூத்த சகோதரன்)\s*[:=\-]\s*([0-9]+)/i);
    const ybMatch = text.match(/(?:younger brother|younger brothers|தம்பி)\s*[:=\-]\s*([0-9]+)/i);
    const esMatch = text.match(/(?:elder sister|elder sisters|அக்கா)\s*[:=\-]\s*([0-9]+)/i);
    const ysMatch = text.match(/(?:younger sister|younger sisters|தங்கை)\s*[:=\-]\s*([0-9]+)/i);

    const rawOutput = {
      profile: {
        profile_type: gender === 'FEMALE' ? 'BRIDAL' : (gender === 'MALE' ? 'GROOM' : null),
        gender,
        name: fullName,
        first_name: firstName,
        middle_name: null,
        last_name: lastName,
        age,
        dob,
        birth_order: birthOrderVal,
        birth_day: birthDay,
        birth_month: birthMonth,
        birth_year: birthYear,
        birth_time: text.match(/(?:time|நேரம்)\s*[:=\-]\s*([0-9:APMapm\s]+)/i)?.[1]?.trim() || null,
        birth_place: text.match(/(?:place of birth|பிறந்த இடம்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || city,
        height,
        weight,
        blood_group: text.match(/(?:blood group|ரத்த வகை)\s*[:=\-]\s*([A-B-O\-+\s]+)/i)?.[1]?.trim() || null,
        marital_status: maritalStatus,
        mother_tongue: motherTongue,
        religion,
        caste,
        sub_caste: subCaste,
        gothram,
        kuladeivam,
        rasi,
        nakshatra,
        dosham,
        sevvai_dosham: chevvai,
        chevvai,
        star: nakshatra,
        star_padam: starPadamVal,
        dasa_balance: dasaBalanceVal,
        citizenship,
        nationality,
        resident_status: residentStatusVal,
        property_details: propertyDetailsVal,
      },
      education: {
        highest_qualification: highestQualification,
        degree: highestQualification ? [highestQualification] : [],
        specialization: null,
        college: null,
        university: null,
      },
      career: {
        occupation,
        designation: occupation,
        company,
        work_location: workLocation,
        salary,
        annual_income: salary,
        business: text.match(/business|சொந்த தொழில்/i) ? occupation : null,
      },
      family: {
        father_name: fatherName,
        father_occupation: text.match(/(?:father occupation|அப்பா வேலை)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || null,
        father_status: fatherName ? 'Alive' : null,
        mother_name: motherName,
        mother_occupation: motherOccupation,
        native_place: text.match(/(?:native|native place|சொந்த ஊர்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || null,
        siblings: [],
        elder_brothers: ebMatch ? Number(ebMatch[1]) : 0,
        younger_brothers: ybMatch ? Number(ybMatch[1]) : 0,
        elder_sisters: esMatch ? Number(esMatch[1]) : 0,
        younger_sisters: ysMatch ? Number(ysMatch[1]) : 0,
        family_type: familyType,
        family_status: familyStatus,
      },
      contact: {
        mobile: mobiles,
        alternate_mobile: mobiles.slice(1),
        whatsapp: mobiles[0] || null,
        email,
        address,
        city,
        district: city,
        state,
        country,
        pincode: text.match(/\b\d{6}\b/)?.[0] || null,
      },
      property: {
        house: text.match(/own house|சொந்த வீடு/i) ? 'Own House' : null,
        land: text.match(/acre|ஏக்கர்/i)?.[0] || null,
        vehicle: null,
        assets: null,
      },
      partner_preference: {
        age: text.match(/(?:partner age|எதிர்பார்ப்பு வயது)\s*[:=\-]\s*([0-9\-\s]+)/i)?.[1]?.trim() || null,
        education: text.match(/(?:partner education|எதிர்பார்ப்பு படிப்பு)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || null,
        profession: null,
        salary: null,
        location: null,
        religion,
        caste,
        height: null,
        other: null,
      },
      horoscope: {
        rasi: rasi || null,
        star: nakshatra || null,
        lagnam: lagnam || null,
        dosham: dosham || null,
        jathagam_details: jathagamDetails || null,
        rasi_chart_detected: rasiChartDetected,
        amsam_chart_detected: amsamChartDetected,
        rasi_chart: rasiChartObj,
        amsam_chart: amsamChartObj,
        planet_positions: planetPositionsList,
      },
      images: {
        profile_photo_present: false,
        family_photo_present: false,
        photo_count: 0,
        image_locations: [],
      },
      document: {
        language: text.trim() ? ['English', 'Tamil'] : [],
        page_count: text.trim() ? 1 : 0,
        document_quality: text.trim() ? 'High' : null,
        contains_qrcode: false,
        contains_barcode: false,
        contains_signature: false,
        contains_stamp: false,
      },
      extra_fields: {},
    };

    return cleanNullFields(rawOutput) || {};
  }
}

function cleanNullFields(obj: any): any {
  if (obj === null || obj === undefined || obj === '') return undefined;
  if (typeof obj === 'boolean') {
    return obj ? true : undefined;
  }
  if (Array.isArray(obj)) {
    const cleanedArr = obj.map(cleanNullFields).filter((v) => v !== undefined);
    return cleanedArr.length > 0 ? cleanedArr : undefined;
  }
  if (typeof obj === 'object') {
    const cleanedObj: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = cleanNullFields(obj[key]);
      if (val !== undefined) {
        cleanedObj[key] = val;
      }
    }
    return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
  }
  return obj;
}
