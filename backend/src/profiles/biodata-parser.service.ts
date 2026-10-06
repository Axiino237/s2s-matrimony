import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MatrimonyBiodataSchema {
  profile: {
    profileFor: string | null;
    gender: string | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    dateOfBirth: string | null;
    age: number | null;
    maritalStatus: string | null;
    heightCm: number | null;
    weight: number | null;
    complexion: string | null;
    bodyType: string | null;
    diet: string | null;
    motherTongue: string | null;
    about: string | null;
    birthOrder: number | null;
    residentStatus: string | null;
    propertyDetails: string | null;
    religion: string | null;
    community: string | null;
    caste: string | null;
    subCaste: string | null;
    gothram: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
  };
  education: {
    degree: string | null;
    fieldOfStudy: string | null;
    university: string | null;
    yearCompleted: number | null;
    additionalInfo: string | null;
  };
  occupation: {
    designation: string | null;
    company: string | null;
    salaryMin: number | null;
    workingLocation: string | null;
    employmentType: string | null;
  };
  family: {
    fatherName: string | null;
    fatherOccupation: string | null;
    fatherAlive: boolean | null;
    motherName: string | null;
    motherOccupation: string | null;
    motherAlive: boolean | null;
    brothers: number | null;
    brothersMarried: number | null;
    elderBrothers: number | null;
    youngerBrothers: number | null;
    sisters: number | null;
    sistersMarried: number | null;
    elderSisters: number | null;
    youngerSisters: number | null;
    familyType: string | null;
    familyStatus: string | null;
    nativePlace: string | null;
    familyDescription: string | null;
  };
  horoscope: {
    star: string | null;
    starPadam: number | null;
    rasi: string | null;
    lagnam: string | null;
    gothram: string | null;
    kuladeivam: string | null;
    dosham: string | null;
    dasaBalance: string | null;
    birthTime: string | null;
    birthPlace: string | null;
    rasiChart: Record<string, string> | null;
    amsamChart: Record<string, string> | null;
  };
  partnerPreference: {
    ageMin: number | null;
    ageMax: number | null;
    heightMin: number | null;
    heightMax: number | null;
    maritalStatus: string[] | null;
    aboutPartner: string | null;
  };
  contact: {
    mobile: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  };
  rasiChart?: Record<string, string> | null;
  amsamChart?: Record<string, string> | null;
}

@Injectable()
export class BiodataParserService {
  private readonly logger = new Logger(BiodataParserService.name);

  constructor(private readonly configService: ConfigService) { }

  /**
   * Main entrypoint for biodata parsing: accepts image (base64) or text.
   * Leverages Gemini Multimodal Vision / NLP with graceful fallback to regex parser.
   */
  async parseBiodata(input: { text?: string; imageBase64?: string }): Promise<MatrimonyBiodataSchema> {
    const imageBase64 = input?.imageBase64?.trim();
    const text = input?.text?.trim();

    if (imageBase64) {
      let mimeType = 'image/jpeg';
      let base64Data = imageBase64;
      if (imageBase64.includes(';base64,')) {
        const parts = imageBase64.split(';base64,');
        const mimeMatch = parts[0].match(/data:(.*?)$/);
        if (mimeMatch) mimeType = mimeMatch[1];
        base64Data = parts[1];
      } else if (imageBase64.startsWith('data:')) {
        const commaIdx = imageBase64.indexOf(',');
        if (commaIdx !== -1) {
          const mimeMatch = imageBase64.substring(0, commaIdx).match(/data:(.*?);/);
          if (mimeMatch) mimeType = mimeMatch[1];
          base64Data = imageBase64.substring(commaIdx + 1);
        }
      }

      try {
        const aiResult = await this.extractWithGeminiVision(base64Data, mimeType);
        if (aiResult) {
          this.logger.log('✨ Gemini Vision extracted biodata fields successfully');
          return this.normalizeSchema(aiResult, text);
        }
      } catch (err: any) {
        this.logger.error('Gemini Vision extraction failed, falling back to text regex', err?.message || err);
      }
    }

    if (text) {
      try {
        const aiResult = await this.extractWithGeminiText(text);
        if (aiResult) {
          this.logger.log('✨ Gemini NLP extracted biodata fields from text successfully');
          return this.normalizeSchema(aiResult, text);
        }
      } catch (err: any) {
        this.logger.error('Gemini Text extraction failed, falling back to regex', err?.message || err);
      }
    }

    // Graceful fallback to regex-based extraction
    return this.parseText(text || '');
  }

  private getGeminiApiKey(): string {
    const key =
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY;

    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    return key as string;
  }

  private getSystemPrompt(): string {
    return `You are an expert AI vision and matrimony biodata parser for S2S Matrimony.
Extract details from this biodata document/text ONLY into fields that exist in the application's database schema.
Strictly return a JSON object with this structure:
{
  "profile": {
    "profileFor": "SELF" | "SON" | "DAUGHTER" | "BROTHER" | "SISTER" | null,
    "gender": "MALE" | "FEMALE" | null,
    "firstName": string | null,
    "lastName": string | null,
    "displayName": string | null,
    "dateOfBirth": string | null,
    "age": number | null,
    "maritalStatus": "NEVER_MARRIED" | "DIVORCED" | "WIDOWED" | "SEPARATED" | null,
    "heightCm": number | null,
    "weight": number | null,
    "complexion": string | null,
    "bodyType": string | null,
    "diet": string | null,
    "motherTongue": string | null,
    "about": string | null,
    "birthOrder": number | null,
    "residentStatus": string | null,
    "propertyDetails": string | null,
    "religion": string | null,
    "community": string | null,
    "caste": string | null,
    "subCaste": string | null,
    "gothram": string | null,
    "country": string | null,
    "state": string | null,
    "city": string | null
  },
  "education": {
    "degree": string | null,
    "fieldOfStudy": string | null,
    "university": string | null,
    "yearCompleted": number | null,
    "additionalInfo": string | null
  },
  "occupation": {
    "designation": string | null,
    "company": string | null,
    "salaryMin": number | null,
    "workingLocation": string | null,
    "employmentType": string | null
  },
  "family": {
    "fatherName": string | null,
    "fatherOccupation": string | null,
    "fatherAlive": boolean | null,
    "motherName": string | null,
    "motherOccupation": string | null,
    "motherAlive": boolean | null,
    "brothers": number | null,
    "brothersMarried": number | null,
    "elderBrothers": number | null,
    "youngerBrothers": number | null,
    "sisters": number | null,
    "sistersMarried": number | null,
    "elderSisters": number | null,
    "youngerSisters": number | null,
    "familyType": "NUCLEAR" | "JOINT" | null,
    "familyStatus": "RICH" | "UPPER_MIDDLE" | "MIDDLE" | "LOWER_MIDDLE" | null,
    "nativePlace": string | null,
    "familyDescription": string | null
  },
  "horoscope": {
    "star": string | null,
    "starPadam": number | null,
    "rasi": string | null,
    "lagnam": string | null,
    "gothram": string | null,
    "kuladeivam": string | null,
    "dosham": string | null,
    "dasaBalance": string | null,
    "birthTime": string | null,
    "birthPlace": string | null,
    "rasiChart": {
      "Meenam": string,
      "Mesham": string,
      "Rishabam": string,
      "Mithunam": string,
      "Kadagam": string,
      "Simmam": string,
      "Kanni": string,
      "Thulaam": string,
      "Viruchigam": string,
      "Dhanusu": string,
      "Magaram": string,
      "Kumbam": string
    } | null,
    "amsamChart": {
      "Meenam": string,
      "Mesham": string,
      "Rishabam": string,
      "Mithunam": string,
      "Kadagam": string,
      "Simmam": string,
      "Kanni": string,
      "Thulaam": string,
      "Viruchigam": string,
      "Dhanusu": string,
      "Magaram": string,
      "Kumbam": string
    } | null
  },
  "partnerPreference": {
    "ageMin": number | null,
    "ageMax": number | null,
    "heightMin": number | null,
    "heightMax": number | null,
    "maritalStatus": string[] | null,
    "aboutPartner": string | null
  },
  "contact": {
    "mobile": string | null,
    "email": string | null,
    "city": string | null,
    "state": string | null,
    "country": string | null
  }
}

Important Rules:
1. Return ONLY the raw valid JSON object. No markdown fences, no explanations.
2. Only map to existing fields listed above. Ignore non-existent fields such as College, Blood Group, Citizenship, Assets, QR Code, Barcode, etc.
3. If a field is not available or mentioned in the biodata, set it to null or leave it empty. Do not invent or guess information.
4. Detect gender accurately based on bride/groom, daughter/son, name, or photo if visible.
5. Parse dates into YYYY-MM-DD format if possible.
6. For phone/mobile numbers, extract only the real digits.

VEDIC ASTROLOGY & HOROSCOPE CHART RULES (CRITICAL):
- When an image contains Vedic / South Indian astrological charts (square grids):
  - In South Indian style, each chart is a 4x4 square grid representing 12 zodiac houses arranged fixedly clockwise:
    - Top row: Column 0 (top-left) = Meenam, Column 1 = Mesham, Column 2 = Rishabam, Column 3 (top-right) = Mithunam
    - Right side: Row 1, Col 3 = Kadagam; Row 2, Col 3 = Simmam; Row 3, Col 3 (bottom-right) = Kanni
    - Bottom row: Row 3, Col 2 = Thulaam; Row 3, Col 1 = Viruchigam; Row 3, Col 0 (bottom-left) = Dhanusu
    - Left side: Row 2, Col 0 (left mid) = Magaram; Row 1, Col 0 (left top) = Kumbam
    - Center 2x2 merged cells indicate the chart name: 'Rasi' (ராசி) or 'Navamsa' / 'Navamsam' / 'Amsam' (நவாம்சம் / அம்சம்).
  - Extract the planets in each house of the 'Rasi' chart into 'horoscope.rasiChart'.
  - Extract the planets in each house of the 'Navamsa' / 'Navamsam' / 'Amsam' chart into 'horoscope.amsamChart'.
  - Extract ONLY planet names/abbreviations. Omit degree/minute numbers (e.g. '22-53', '10-15', '23-48').
  - Standardize planet symbols to Tamil short names:
    - Sun / Suriyan / Surya / சூரியன் -> "சூரி"
    - Moon / Chandran / Chandra / சந்திரன் -> "சந்"
    - Mars / Chevvai / Sevvai / Mangal / செவ்வாய் -> "செவ்"
    - Merc / Mercury / Budhan / Budha / புதன் -> "புத"
    - Jup / Jupiter / Guru / Brihaspati -> "குரு"
    - Ven / Venus / Sukran / Shukra / சுக்கிரன் -> "சுக்"
    - Sat / Saturn / Sani / Shani / சனீஸ்வரன் -> "சனி"
    - Rahu -> "ராகு"
    - Ketu -> "கேது"
    - Ascdt / Asc / Lagnam / Lagna / Lag / லக்னம் -> "லக்"
    - Outer planets if present in English chart: URAN, NEPT, PLUT
  - Multiple planets in a house must be separated by commas (e.g. "சனி, சந்"). Empty houses must be "".
  - Derive Moon sign (Rasi) from the house containing Moon / சந் (e.g. if Moon is in Rishabam, rasi = "Taurus" or "Rishabam").
  - Derive Ascendant (Lagnam) from the house containing Ascdt / Asc / லக் (e.g. if Ascdt is in Kumbam, lagnam = "Aquarius" or "Kumbam").`;
  }

  private async callGeminiApi(payload: any): Promise<any> {
    const apiKey = this.getGeminiApiKey();
    if (!apiKey) return null;

    const models = ['gemini-flash-latest', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errText = await response.text();
          this.logger.warn(`Gemini (${model}) API error: ${response.status} - ${errText}`);
          continue;
        }

        const data: any = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            return JSON.parse(text);
          } catch {
            const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            return JSON.parse(cleaned);
          }
        }
      } catch (err: any) {
        this.logger.warn(`Gemini call error on ${model}:`, err?.message || err);
      }
    }
    return null;
  }

  private async extractWithGeminiVision(base64Data: string, mimeType: string): Promise<any> {
    const payload = {
      contents: [
        {
          parts: [
            { text: this.getSystemPrompt() },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    return this.callGeminiApi(payload);
  }

  private async extractWithGeminiText(text: string): Promise<any> {
    const payload = {
      contents: [
        {
          parts: [
            { text: `${this.getSystemPrompt()}\n\nHere is the biodata text content:\n\n${text}` },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    return this.callGeminiApi(payload);
  }

  private normalizeSchema(data: any, fallbackText?: string): MatrimonyBiodataSchema {
    const p = data.profile || {};
    const edu = data.education || {};
    const car = data.career || {};
    const fam = data.family || {};
    const con = data.contact || {};
    const prop = data.property || {};
    const pref = data.partner_preference || {};
    const horo = data.horoscope || {};
    const img = Array.isArray(data.images)
      ? { profile_photo_present: data.images.length > 0, photo_count: data.images.length }
      : (data.images || {});
    const doc = data.document || {};

    const fullName = p.name || (p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : null);
    let firstName = p.first_name || null;
    let lastName = p.last_name || null;
    if (fullName && (!firstName || !lastName)) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (!firstName) firstName = parts[0] || null;
      if (!lastName) lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
    }

    let age = p.age ?? null;
    if (age === null && (p.dob || p.date_of_birth)) {
      const dateStr = String(p.dob || p.date_of_birth);
      const yearMatch = dateStr.match(/\b(19\d\d|20\d\d)\b/);
      if (yearMatch) {
        age = new Date().getFullYear() - parseInt(yearMatch[1], 10);
      }
    }

    let birthDay: number | null = p.birth_day ?? null;
    let birthMonth: number | null = p.birth_month ?? null;
    let birthYear: number | null = p.birth_year ?? null;
    const dobStr = p.dob || p.date_of_birth;
    if (dobStr && (birthDay === null || birthYear === null)) {
      const parts = String(dobStr).split(/[\/\.\-]/).map((n) => parseInt(n, 10));
      if (parts.length === 3) {
        if (parts[0] <= 31 && parts[1] <= 12) {
          birthDay = parts[0];
          birthMonth = parts[1];
          birthYear = parts[2] < 100 ? 1900 + parts[2] : parts[2];
        } else if (parts[2] <= 31 && parts[1] <= 12) {
          birthYear = parts[0] < 100 ? 1900 + parts[0] : parts[0];
          birthMonth = parts[1];
          birthDay = parts[2];
        }
      }
    }

    let gender = p.gender ? String(p.gender).toUpperCase() : null;
    if (!gender && fallbackText) {
      if (/bride|female|daughter|girl/i.test(fallbackText)) gender = 'FEMALE';
      else if (/groom|male|son|boy/i.test(fallbackText)) gender = 'MALE';
    }

    const degreeList: string[] = Array.isArray(edu.degree)
      ? edu.degree
      : edu.degree
        ? [String(edu.degree)]
        : edu.highest_qualification || edu.qualification
          ? [String(edu.highest_qualification || edu.qualification)]
          : [];

    const mobileList: string[] = Array.isArray(con.mobile)
      ? con.mobile.map(String)
      : con.mobile || con.contact_number
        ? [String(con.mobile || con.contact_number)]
        : [];

    const photoPresent = Boolean(img.profile_photo_present || (img.photo_count && img.photo_count > 0));
    const photoCount = img.photo_count !== undefined && img.photo_count !== null
      ? Number(img.photo_count)
      : (photoPresent ? 1 : null);

    const pageCount = doc.page_count !== undefined && doc.page_count !== null
      ? Number(doc.page_count)
      : 1;

    let heightCm: number | null = null;
    const rawHeight = p.heightCm || p.height;
    if (rawHeight) {
      if (typeof rawHeight === 'number') {
        heightCm = rawHeight;
      } else {
        const feetMatch = String(rawHeight).match(/(\d+)\s*(?:ft\.?|feet|'|’)\s*(?:(\d+)\s*(?:in\.?|inch|inches|"|”|'')?)?/i);
        if (feetMatch && feetMatch[1]) {
          const feet = parseInt(feetMatch[1]);
          const inches = parseInt(feetMatch[2] || '0');
          heightCm = Math.round((feet * 12 + inches) * 2.54);
        } else {
          const cmMatch = String(rawHeight).match(/(\d+)/);
          if (cmMatch) heightCm = parseInt(cmMatch[1]);
        }
      }
    }

    let weightKg: number | null = null;
    const rawWeight = p.weight || p.weightKg;
    if (rawWeight) {
      const match = String(rawWeight).match(/(\d+)/);
      if (match) weightKg = parseInt(match[1]);
    }

    let salaryMin: number | null = null;
    const rawSal = car.salaryMin || car.salary || car.annual_income || car.annualIncome;
    if (rawSal) {
      if (typeof rawSal === 'number') {
        salaryMin = rawSal;
      } else {
        const lkMatch = String(rawSal).match(/(\d+(?:\.\d+)?)\s*(?:l|lk|lakh|lakhs)/i);
        if (lkMatch) {
          salaryMin = Math.round(parseFloat(lkMatch[1]) * 100000);
        } else {
          const numMatch = String(rawSal).match(/(\d[\d,]+)/);
          if (numMatch) salaryMin = parseInt(numMatch[1].replace(/,/g, ''));
        }
      }
    }

    const singleMobile = mobileList[0] || (typeof con.mobile === 'string' ? con.mobile : null) || null;

    const rawRasiChart = horo.rasiChart || horo.rasi_chart || data.rasiChart || data.rasi_chart || null;
    const rawAmsamChart = horo.amsamChart || horo.amsam_chart || data.amsamChart || data.amsam_chart || data.navamsamChart || null;

    const normalizedRasiChart = rawRasiChart ? normalizeChartHouses(rawRasiChart) : null;
    const normalizedAmsamChart = rawAmsamChart ? normalizeChartHouses(rawAmsamChart) : null;

    let derivedRasi = horo.rasi || p.rasi || null;
    let derivedLagnam = horo.lagnam || null;
    if (normalizedRasiChart) {
      for (const [house, planets] of Object.entries(normalizedRasiChart)) {
        if (!derivedRasi && (/\bசந்\b/i.test(planets) || /moon|chandran/i.test(planets))) {
          derivedRasi = house;
        }
        if (!derivedLagnam && (/\bலக்\b/i.test(planets) || /ascdt|asc|lagnam|lag/i.test(planets))) {
          derivedLagnam = house;
        }
      }
    }

    const normalized: MatrimonyBiodataSchema = {
      profile: {
        profileFor: p.profileFor || p.profile_type || 'SELF',
        gender,
        firstName: firstName || p.firstName || null,
        lastName: lastName || p.lastName || null,
        displayName: fullName || (firstName ? `${firstName} ${lastName || ''}`.trim() : null),
        dateOfBirth: dobStr || null,
        age,
        maritalStatus: p.maritalStatus || p.marital_status || null,
        heightCm,
        weight: weightKg,
        complexion: p.complexion || null,
        bodyType: p.bodyType || p.body_type || null,
        diet: p.diet || null,
        motherTongue: p.motherTongue || p.mother_tongue || null,
        about: p.about || null,
        birthOrder: p.birthOrder ? Number(p.birthOrder) : (birthDay ? null : null),
        residentStatus: p.residentStatus || p.resident_status || null,
        propertyDetails: p.propertyDetails || p.property_details || null,
        religion: p.religion || null,
        community: p.community || null,
        caste: p.caste || null,
        subCaste: p.subCaste || p.sub_caste || null,
        gothram: p.gothram || null,
        country: p.country || con.country || null,
        state: p.state || con.state || null,
        city: p.city || con.city || con.district || null,
      },
      education: {
        degree: degreeList.join(', ') || edu.highest_qualification || null,
        fieldOfStudy: edu.fieldOfStudy || edu.specialization || null,
        university: edu.university || null,
        yearCompleted: edu.yearCompleted ? Number(edu.yearCompleted) : null,
        additionalInfo: edu.additionalInfo || null,
      },
      occupation: {
        designation: car.designation || car.occupation || null,
        company: car.company || null,
        salaryMin,
        workingLocation: car.workingLocation || car.work_location || null,
        employmentType: car.employmentType || car.employment_type || null,
      },
      family: {
        fatherName: fam.fatherName || fam.father_name || null,
        fatherOccupation: fam.fatherOccupation || fam.father_occupation || null,
        fatherAlive: fam.fatherAlive !== undefined ? Boolean(fam.fatherAlive) : (fam.father_status ? !String(fam.father_status).toLowerCase().includes('late') : null),
        motherName: fam.motherName || fam.mother_name || null,
        motherOccupation: fam.motherOccupation || fam.mother_occupation || null,
        motherAlive: fam.motherAlive !== undefined ? Boolean(fam.motherAlive) : (fam.mother_status ? !String(fam.mother_status).toLowerCase().includes('late') : null),
        brothers: fam.brothers !== undefined && fam.brothers !== null ? Number(fam.brothers) : null,
        brothersMarried: fam.brothersMarried !== undefined ? Number(fam.brothersMarried) : null,
        elderBrothers: fam.elderBrothers !== undefined ? Number(fam.elderBrothers) : (fam.elder_brothers !== undefined ? Number(fam.elder_brothers) : null),
        youngerBrothers: fam.youngerBrothers !== undefined ? Number(fam.youngerBrothers) : (fam.younger_brothers !== undefined ? Number(fam.younger_brothers) : null),
        sisters: fam.sisters !== undefined && fam.sisters !== null ? Number(fam.sisters) : null,
        sistersMarried: fam.sistersMarried !== undefined ? Number(fam.sistersMarried) : null,
        elderSisters: fam.elderSisters !== undefined ? Number(fam.elderSisters) : (fam.elder_sisters !== undefined ? Number(fam.elder_sisters) : null),
        youngerSisters: fam.youngerSisters !== undefined ? Number(fam.youngerSisters) : (fam.younger_sisters !== undefined ? Number(fam.younger_sisters) : null),
        familyType: fam.familyType || fam.family_type || null,
        familyStatus: fam.familyStatus || fam.family_status || null,
        nativePlace: fam.nativePlace || fam.native_place || null,
        familyDescription: fam.familyDescription || fam.family_description || null,
      },
      horoscope: {
        star: horo.star || p.nakshatra || p.star || null,
        starPadam: horo.starPadam ? Number(horo.starPadam) : null,
        rasi: derivedRasi,
        lagnam: derivedLagnam,
        gothram: horo.gothram || p.gothram || null,
        kuladeivam: horo.kuladeivam || p.kuladeivam || null,
        dosham: horo.dosham || p.dosham || p.chevvai || null,
        dasaBalance: horo.dasaBalance || horo.dasa_balance || null,
        birthTime: horo.birthTime || horo.birth_time || p.birth_time || null,
        birthPlace: horo.birthPlace || horo.birth_place || p.birth_place || null,
        rasiChart: normalizedRasiChart,
        amsamChart: normalizedAmsamChart,
      },
      partnerPreference: {
        ageMin: pref.ageMin ? Number(pref.ageMin) : null,
        ageMax: pref.ageMax ? Number(pref.ageMax) : null,
        heightMin: pref.heightMin ? Number(pref.heightMin) : null,
        heightMax: pref.heightMax ? Number(pref.heightMax) : null,
        maritalStatus: Array.isArray(pref.maritalStatus) ? pref.maritalStatus : null,
        aboutPartner: pref.aboutPartner || pref.about_partner || pref.other || null,
      },
      contact: {
        mobile: singleMobile,
        email: con.email || p.email || null,
        city: con.city || p.city || null,
        state: con.state || p.state || null,
        country: con.country || p.country || null,
      },
      rasiChart: normalizedRasiChart,
      amsamChart: normalizedAmsamChart,
    };

    return cleanNullFields(normalized);
  }

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
        resident_status: residentStatusVal,
        property_details: propertyDetailsVal,
      },
      education: {
        highest_qualification: highestQualification,
        degree: highestQualification ? [highestQualification] : [],
        specialization: null,
        university: null,
      },
      career: {
        occupation,
        designation: occupation,
        company,
        work_location: workLocation,
        salary,
        annual_income: salary,
      },
      family: {
        father_name: fatherName,
        father_occupation: text.match(/(?:father occupation|அப்பா வேலை)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || null,
        father_status: fatherName ? 'Alive' : null,
        mother_name: motherName,
        mother_occupation: motherOccupation,
        native_place: text.match(/(?:native|native place|சொந்த ஊர்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || null,
        elder_brothers: ebMatch ? Number(ebMatch[1]) : null,
        younger_brothers: ybMatch ? Number(ybMatch[1]) : null,
        elder_sisters: esMatch ? Number(esMatch[1]) : null,
        younger_sisters: ysMatch ? Number(ysMatch[1]) : null,
        family_type: familyType,
        family_status: familyStatus,
      },
      contact: {
        mobile: mobiles,
        email,
        address,
        city,
        state,
        country,
      },
      partner_preference: {
        age: text.match(/(?:partner age|எதிர்பார்ப்பு வயது)\s*[:=\-]\s*([0-9\-\s]+)/i)?.[1]?.trim() || null,
        education: text.match(/(?:partner education|எதிர்பார்ப்பு படிப்பு)\s*[:=\-]\s*([A-Za-z0-9\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || null,
        religion,
        caste,
      },
      horoscope: {
        rasi: rasi || null,
        star: nakshatra || null,
        lagnam: lagnam || null,
        dosham: dosham || null,
        birth_time: text.match(/(?:time of birth|பிறந்த நேரம்)\s*[:=\-]\s*([0-9:APMapm\s.]+)/i)?.[1]?.trim() || null,
        birth_place: text.match(/(?:place of birth|பிறந்த இடம்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || null,
        rasi_chart: rasiChartObj,
        amsam_chart: amsamChartObj,
      },
    };

    return this.normalizeSchema(rawOutput, text);
  }
}

function cleanNullFields(obj: any): any {
  if (obj === undefined) return undefined;
  if (Array.isArray(obj)) {
    return obj.map(cleanNullFields).filter((v) => v !== undefined);
  }
  if (obj !== null && typeof obj === 'object') {
    const cleanedObj: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = cleanNullFields(obj[key]);
      if (val !== undefined) {
        cleanedObj[key] = val;
      }
    }
    return cleanedObj;
  }
  return obj;
}

const HOUSE_SYNONYMS: Record<string, string> = {
  meenam: 'Meenam', meena: 'Meenam', pisces: 'Meenam', 'மீனம்': 'Meenam',
  mesham: 'Mesham', mesha: 'Mesham', aries: 'Mesham', 'மேஷம்': 'Mesham',
  rishabam: 'Rishabam', rishaba: 'Rishabam', vrishabha: 'Rishabam', taurus: 'Rishabam', 'ரிஷபம்': 'Rishabam',
  mithunam: 'Mithunam', mithuna: 'Mithunam', gemini: 'Mithunam', 'மிதுனம்': 'Mithunam',
  kadagam: 'Kadagam', kadaga: 'Kadagam', karka: 'Kadagam', karkata: 'Kadagam', cancer: 'Kadagam', 'கடகம்': 'Kadagam',
  simmam: 'Simmam', simma: 'Simmam', simha: 'Simmam', leo: 'Simmam', 'சிம்மம்': 'Simmam',
  kanni: 'Kanni', kanya: 'Kanni', virgo: 'Kanni', 'கன்னி': 'Kanni',
  thulaam: 'Thulaam', thulam: 'Thulaam', tula: 'Thulaam', libra: 'Thulaam', 'துலாம்': 'Thulaam',
  viruchigam: 'Viruchigam', viruchiga: 'Viruchigam', vrishchika: 'Viruchigam', scorpio: 'Viruchigam', 'விருச்சிகம்': 'Viruchigam',
  dhanusu: 'Dhanusu', dhanus: 'Dhanusu', dhanu: 'Dhanusu', sagittarius: 'Dhanusu', 'தனுசு': 'Dhanusu',
  magaram: 'Magaram', magara: 'Magaram', makara: 'Magaram', capricorn: 'Magaram', 'மகரம்': 'Magaram',
  kumbam: 'Kumbam', kumba: 'Kumbam', kumbha: 'Kumbam', aquarius: 'Kumbam', 'கும்பம்': 'Kumbam',
};

const PLANET_TOKEN_MAP: Record<string, string> = {
  sun: 'சூரி', suriyan: 'சூரி', surya: 'சூரி', 'சூரி': 'சூரி', 'சூரியன்': 'சூரி',
  moon: 'சந்', chandran: 'சந்', chandra: 'சந்', mon: 'சந்', 'சந்': 'சந்', 'சந்திரன்': 'சந்',
  mars: 'செவ்', chevvai: 'செவ்', sevvai: 'செவ்', mangal: 'செவ்', kuja: 'செவ்', mar: 'செவ்', 'செவ்': 'செவ்', 'செவ்வாய்': 'செவ்',
  merc: 'புத', mercury: 'புத', budhan: 'புத', budha: 'புத', budh: 'புத', mer: 'புத', 'புத': 'புத', 'புதன்': 'புத',
  jup: 'குரு', jupiter: 'குரு', guru: 'குரு', brihaspati: 'குரு', 'குரு': 'குரு',
  ven: 'சுக்', venus: 'சுக்', sukran: 'சுக்', shukra: 'சுக்', suk: 'சுக்', 'சுக்': 'சுக்', 'சுக்கிரன்': 'சுக்',
  sat: 'சனி', saturn: 'சனி', sani: 'சனி', shani: 'சனி', 'சனி': 'சனி', 'சனீஸ்வரன்': 'சனி',
  rahu: 'ராகு', rah: 'ராகு', 'ராகு': 'ராகு',
  ketu: 'கேது', ket: 'கேது', 'கேது': 'கேது',
  ascdt: 'லக்', asc: 'லக்', lag: 'லக்', lagnam: 'லக்', lagna: 'லக்', 'லக்': 'லக்', 'லக்னம்': 'லக்',
};

function normalizePlanetTokens(planetsStr: string): string {
  if (!planetsStr || typeof planetsStr !== 'string') return '';
  // Remove degrees, minutes, or numbers like 22-53, 10-15, 23.48, or standalone digits
  const cleaned = planetsStr.replace(/\b\d+[-.:]\d+\b/g, '').replace(/\b\d+\b/g, '');
  const tokens = cleaned.split(/[,;\/\s]+/).map((t) => t.trim()).filter(Boolean);
  const normalized = tokens.map((t) => {
    const key = t.toLowerCase();
    return PLANET_TOKEN_MAP[key] || t.toUpperCase();
  });
  return Array.from(new Set(normalized)).join(', ');
}

function normalizeChartHouses(chart: any): Record<string, string> {
  const result: Record<string, string> = {
    Meenam: '',
    Mesham: '',
    Rishabam: '',
    Mithunam: '',
    Kadagam: '',
    Simmam: '',
    Kanni: '',
    Thulaam: '',
    Viruchigam: '',
    Dhanusu: '',
    Magaram: '',
    Kumbam: '',
  };
  if (!chart || typeof chart !== 'object') return result;

  for (const [key, val] of Object.entries(chart)) {
    const cleanedKey = key.trim().toLowerCase();
    const standardHouse = HOUSE_SYNONYMS[cleanedKey] || key;
    if (result[standardHouse] !== undefined) {
      const valStr = typeof val === 'string' ? val : (Array.isArray(val) ? val.join(', ') : String(val || ''));
      result[standardHouse] = normalizePlanetTokens(valStr);
    }
  }
  return result;
}
