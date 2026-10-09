import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
    salary?: string | null;
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
    address?: string | null;
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
   * Main entrypoint for biodata parsing: accepts image (base64), PDF (base64), or text.
   * Leverages Gemini Multimodal Vision / NLP with multi-language understanding.
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

      const isPdf = mimeType === 'application/pdf' || base64Data.startsWith('JVBERi');

      if (isPdf) {
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        this.logger.log('📄 PDF uploaded for AI extraction: inspecting for direct usable text...');

        const { text: pdfText, pageCount, hasVisualChartHint } = await this.extractTextFromPdf(pdfBuffer);
        const isUsableText = pdfText.length >= 60 && pdfText.split(/\s+/).length >= 8;

        if (isUsableText) {
          this.logger.log(`⚡ Usable text detected in PDF (${pdfText.length} chars, ${pageCount} pages). Running fast Gemini text extraction...`);
          try {
            const aiResult = await this.extractWithGeminiText(pdfText);
            if (aiResult) {
              const chartMissing = !aiResult.horoscope?.rasiChart || Object.keys(aiResult.horoscope.rasiChart).length === 0;
              if (hasVisualChartHint && chartMissing) {
                this.logger.log('🔭 Visual horoscope chart detected in PDF text. Falling back to Gemini Vision for astrological chart extraction...');
              } else {
                this.logger.log('✨ Gemini Text normalization successfully extracted biodata from direct PDF text');
                return this.normalizeSchema(aiResult, pdfText);
              }
            }
          } catch (textErr: any) {
            this.logger.warn(`Direct PDF text extraction failed with Gemini Text (${textErr?.message}), falling back to Gemini Vision...`);
          }
        } else {
          this.logger.log(`📸 PDF contains minimal/no embedded text (${pdfText.length} chars). Detected as scanned/image-only document.`);
        }

        // Fallback to Gemini Vision for scanned/image-based documents or visual horoscope charts
        this.logger.log('🖼️ Running Gemini Multimodal Vision fallback for PDF...');
        return this.extractPdfWithVision(pdfBuffer, text || pdfText);
      } else {
        // Direct image upload (JPG, PNG, WebP) - existing working path unchanged
        try {
          const aiResult = await this.extractWithGeminiVision(base64Data, mimeType);
          if (aiResult) {
            this.logger.log('✨ Gemini Vision extracted biodata fields successfully');
            return this.normalizeSchema(aiResult, text);
          }
          throw new Error('AI Vision model could not extract structured biodata from the image');
        } catch (err: any) {
          this.logger.error('Image Vision extraction failed:', err?.message || err);
          throw new BadRequestException(
            err?.message || 'Failed to extract biodata from the uploaded image. Please ensure the photo is clear and readable.'
          );
        }
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
      return this.parseText(text);
    }

    throw new BadRequestException('Please provide either biodata text or upload a document/photo to extract.');
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
    "dateOfBirth": string | null, // Format as YYYY-MM-DD (e.g. "1994-10-04" for "04-OCT-1994")
    "age": number | null,
    "maritalStatus": "NEVER_MARRIED" | "DIVORCED" | "WIDOWED" | "SEPARATED" | null,
    "heightCm": number | null, // Height in cm as integer (e.g. 180 for "180 cm")
    "weight": number | null,
    "complexion": "Fair" | "Very Fair" | "Wheatish" | "Dark" | null, // STRICTLY one of: "Fair", "Very Fair", "Wheatish", "Dark", or null. Map "Medium" or "Medium complexion" to "Wheatish". NEVER use "Medium", "Dusky", "Brown".
    "bodyType": string | null,
    "diet": string | null,
    "motherTongue": string | null,
    "about": string | null,
    "birthOrder": number | null,
    "residentStatus": string | null,
    "propertyDetails": string | null, // Preserve property/asset details verbatim (e.g. "House - 1, Plots - 3")
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
    "designation": string | null, // Job title/designation e.g. "Team Lead - A&D Engineer"
    "company": string | null, // Company name e.g. "HARTING Manufacturing India Pvt Ltd"
    "salary": string | null, // Existing application dropdown label e.g. "₹12 Lakhs – ₹18 Lakhs". If monthly income is given, calculate annual = monthly * 12 before mapping.
    "salaryMin": number | null, // Existing application dropdown value: 300000, 500000, 800000, 1200000, 1800000, 2500000, 3500000, or 5000000.
    "workingLocation": string | null, // Work city e.g. "Chennai"
    "employmentType": string | null
  },
  "family": {
    "fatherName": string | null, // Parent name without "(Late)" e.g. "Chakkarai K"
    "fatherOccupation": string | null,
    "fatherAlive": boolean | null, // false if (Late), deceased, or காலஞ்சென்ற; true if alive
    "motherName": string | null, // e.g. "Arulammal C"
    "motherOccupation": string | null, // e.g. "LIC Agent"
    "motherAlive": boolean | null,
    "brothers": number | null, // Total brothers count e.g. 1
    "brothersMarried": number | null, // Married brothers count e.g. 1
    "elderBrothers": number | null,
    "youngerBrothers": number | null,
    "sisters": number | null, // Total sisters count e.g. 2
    "sistersMarried": number | null, // Married sisters count e.g. 2
    "elderSisters": number | null,
    "youngerSisters": number | null,
    "familyType": "NUCLEAR" | "JOINT" | null,
    "familyStatus": "RICH" | "UPPER_MIDDLE" | "MIDDLE" | "LOWER_MIDDLE" | null,
    "nativePlace": string | null,
    "familyDescription": string | null
  },
  "horoscope": {
    "star": string | null, // Nakshatra name ONLY without pada e.g. "Uthiram"
    "starPadam": number | null, // Pada number as integer (1-4) e.g. 2 for "Uthiram – Pada 2"
    "rasi": string | null, // Canonical rasi e.g. "Kanni" for "Kanya/Virgo"
    "lagnam": string | null,
    "gothram": string | null,
    "kuladeivam": string | null,
    "dosham": string | null,
    "dasaBalance": string | null,
    "birthTime": string | null, // e.g. "6:15 AM"
    "birthPlace": string | null, // e.g. "Gudiyattam"
    "rasiChart": Record<string, string> | null, // STRICT: MUST BE null if document has NO visual chart grid!
    "amsamChart": Record<string, string> | null // STRICT: MUST BE null if document has NO visual chart grid!
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
    "mobile": string | null, // Digits only e.g. "9994070608"
    "email": string | null,
    "address": string | null, // Full street/postal address e.g. "No. 1218, P.J. Nehru Street, Amburpet, Vaniyambadi - 635751"
    "city": string | null, // City extracted from address or location e.g. "Vaniyambadi"
    "state": string | null,
    "country": string | null
  }
}

Important Rules:
1. Return ONLY the raw valid JSON object. No markdown fences, no explanations.
2. Only map to existing fields listed above. Do not invent missing information.
3. If a field is not available or mentioned in the biodata, set it to null. Never guess or fabricate information.
4. Correctly parse dates: Support "04-OCT-1994", "04/10/1994", "04-10-1994", etc., and map to ISO "YYYY-MM-DD" in profile.dateOfBirth. Calculate age based on dateOfBirth.
5. Annual Income / Salary Normalization:
   - Normalize salary into the application's existing annual-income format/dropdown.
   - If monthly income is provided: approximately convert to annual = monthly * 12 (e.g. "1 Lakh per month" -> approx 12L; "1.5 Lakhs per month" -> approx 18L; "2 Lakhs per month" -> approx 24L; "3 Lakhs per month" -> approx 36L; "₹1,00,000/month" -> approx 12L).
   - If annual income is already provided, normalize directly without multiplying by 12 (e.g. "14 LPA" -> 14L).
   - Map strictly to the application's existing options:
     * <= 3L: salaryMin = 300000, salary = "₹2 Lakhs – ₹3 Lakhs"
     * 3L to 5L: salaryMin = 500000, salary = "₹3 Lakhs – ₹5 Lakhs"
     * 5L to 8L: salaryMin = 800000, salary = "₹5 Lakhs – ₹8 Lakhs"
     * 8L to <12L: salaryMin = 1200000, salary = "₹8 Lakhs – ₹12 Lakhs"
     * 12L to 18L: salaryMin = 1800000, salary = "₹12 Lakhs – ₹18 Lakhs"
     * 18L to 25L: salaryMin = 2500000, salary = "₹18 Lakhs – ₹25 Lakhs"
     * 25L to 35L: salaryMin = 3500000, salary = "₹25 Lakhs – ₹35 Lakhs"
     * Above 35L: salaryMin = 5000000, salary = "Above ₹35 Lakhs"
   - If salary/income is not present, set occupation.salary = null and occupation.salaryMin = null. Never guess.
6. Split occupation: Extract designation ("Team Lead - A&D Engineer"), company ("HARTING Manufacturing India Pvt Ltd"), and workingLocation ("Chennai") when provided.
7. Parents: If a parent is marked "(Late)", "Late", or "காலஞ்சென்ற", clean the name to remove "(Late)" and set fatherAlive = false (or motherAlive = false).
8. Nakshatra & Pada: If text has "Uthiram – Pada 2" or "Uthiram - 2", set star = "Uthiram" and starPadam = 2.
9. Rasi: Map "Kanya/Virgo" to "Kanni" (Virgo).
10. Property & Assets: Preserve details like "House - 1, Plots - 3" in profile.propertyDetails instead of ignoring them.
11. Contact & Address: Extract full address, city, and mobile number.
12. Complexion Normalization:
    - Must be strictly one of: "Fair", "Very Fair", "Wheatish", "Dark", or null.
    - Normalize "Fair" -> "Fair", "Very Fair" -> "Very Fair", "Wheatish" -> "Wheatish", "Dark" -> "Dark".
    - Normalize "Medium", "Medium complexion", "Medium/Fair", "Dusky", "Brown", "மாநிறம்" -> "Wheatish".
    - Do NOT introduce "Medium", "Dusky", "Brown", or any unsupported option. If not mentioned, set to null.

CRITICAL HOROSCOPE CHART RULE (STRICT):
If the uploaded document or image does NOT contain a visual Vedic horoscope chart grid (a 4x4 square grid diagram):
- "horoscope.rasiChart" MUST BE null.
- "horoscope.amsamChart" MUST BE null.
- Do NOT generate, guess, or invent a chart.
- Do NOT copy horoscope chart labels, house names, or planet lists from this prompt.
- Do NOT treat UI instructions, field labels, or text mentions of Rasi/Star (e.g. "Rasi: Kanya") as chart data.
- ONLY when a South Indian 4x4 astrological square grid diagram is visibly drawn in the document, extract the planets placed inside each house into rasiChart and amsamChart using Tamil abbreviations:
  சூரி (Sun), சந் (Moon), செவ் (Mars), புத (Mercury), குரு (Jupiter), சுக் (Venus), சனி (Saturn), ராகு (Rahu), கேது (Ketu), லக் (Ascendant/Lagnam).
  Empty houses must be "".
  If no visual chart diagram exists, both rasiChart and amsamChart MUST BE null.`;
  }

  private async callGeminiApi(payload: any): Promise<any> {
    const apiKey = this.getGeminiApiKey();
    if (!apiKey) return null;

    // Verified active Gemini models supporting generateContent in current environment
    const models = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-pro-latest'];
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

  private async extractWithGeminiVision(images: string | string[], mimeType: string = 'image/jpeg'): Promise<any> {
    const imageList = Array.isArray(images) ? images : [images];
    const imageParts = imageList.map((img) => ({
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: img,
      },
    }));

    const payload = {
      contents: [
        {
          parts: [
            { text: this.getSystemPrompt() },
            ...imageParts,
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

  private async extractTextFromPdf(pdfBuffer: Buffer): Promise<{ text: string; pageCount: number; hasVisualChartHint: boolean }> {
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const doc = await pdfjs.getDocument({
        data: new Uint8Array(pdfBuffer),
        useSystemFonts: true,
      }).promise;

      let fullText = '';
      const numPages = Math.min(doc.numPages, 8);
      for (let i = 1; i <= numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => typeof item.str === 'string')
          .map((item: any) => item.str.trim())
          .filter(Boolean)
          .join(' ');
        if (pageText) {
          fullText += pageText + '\n';
        }
      }

      const cleanText = fullText.trim();
      const chartKeywords = /(ராசி\s*கட்டம்|நவாம்ச\s*கட்டம்|நவாம்சம்\s*கட்டம்|ஜாதக\s*கட்டம்|chart\s*attached|horoscope\s*chart|rasi\s*chart|navamsa\s*chart|amsam\s*chart)/i;
      const hasVisualChartHint = chartKeywords.test(cleanText);

      return {
        text: cleanText,
        pageCount: doc.numPages,
        hasVisualChartHint,
      };
    } catch (err: any) {
      this.logger.warn(`Direct PDF text extraction notice: ${err?.message || err}`);
      return { text: '', pageCount: 0, hasVisualChartHint: false };
    }
  }

  private async extractPdfWithVision(pdfBuffer: Buffer, fallbackText?: string): Promise<MatrimonyBiodataSchema> {
    try {
      const { pdf } = await import('pdf-to-img');
      const document = await pdf(pdfBuffer, { scale: 2 });
      const pageImages: string[] = [];
      for await (const pageBuffer of document) {
        pageImages.push(Buffer.from(pageBuffer).toString('base64'));
        // Support multi-page PDFs (up to 8 relevant pages)
        if (pageImages.length >= 8) break;
      }

      if (pageImages.length === 0) {
        throw new Error('PDF document contained no readable pages');
      }

      this.logger.log(`📄 Converted ${pageImages.length} PDF page(s) to PNG images for Gemini Vision extraction`);
      const aiResult = await this.extractWithGeminiVision(pageImages, 'image/png');
      if (aiResult) {
        this.logger.log('✨ Gemini Vision successfully extracted biodata & horoscope from PDF pages');
        return this.normalizeSchema(aiResult, fallbackText);
      }
      throw new Error('AI Vision model could not extract structured biodata from the PDF pages');
    } catch (err: any) {
      this.logger.error('PDF Vision extraction failed:', err?.message || err);
      throw new BadRequestException(
        err?.message || 'Failed to extract biodata from the uploaded PDF. Please ensure the document is clear and readable.'
      );
    }
  }

  private normalizeSchema(data: any, fallbackText?: string): MatrimonyBiodataSchema {
    const p = data.profile || {};
    const edu = data.education || {};
    const car = data.occupation || data.career || {};
    const fam = data.family || {};
    const con = data.contact || {};
    const prop = data.property || {};
    const pref = data.partnerPreference || data.partner_preference || {};
    const horo = data.horoscope || {};
    const img = Array.isArray(data.images)
      ? { profile_photo_present: data.images.length > 0, photo_count: data.images.length }
      : (data.images || {});
    const doc = data.document || {};

    const fullName = p.displayName || p.name || (p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : (p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : null));
    let firstName = p.firstName || p.first_name || null;
    let lastName = p.lastName || p.last_name || null;
    if (fullName && (!firstName || !lastName)) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (!firstName) firstName = parts[0] || null;
      if (!lastName) lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
    }

    // Comprehensive date parser supporting alpha months (e.g. 04-OCT-1994)
    const rawDob = p.dateOfBirth || p.dob || p.date_of_birth || null;
    const parsedDate = parseBiodataDate(rawDob);
    const dobIso = parsedDate.dobIso;
    const age = p.age ?? parsedDate.age;
    const birthDay = parsedDate.birthDay ?? p.birth_day ?? null;
    const birthMonth = parsedDate.birthMonth ?? p.birth_month ?? null;
    const birthYear = parsedDate.birthYear ?? p.birth_year ?? null;

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

    let combinedDegree = degreeList.join(', ') || edu.highest_qualification || null;
    const fieldOfStudy = edu.fieldOfStudy || edu.specialization || null;
    if (combinedDegree && fieldOfStudy && !combinedDegree.toLowerCase().includes(fieldOfStudy.toLowerCase())) {
      combinedDegree = `${combinedDegree} in ${fieldOfStudy}`;
    }

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
          const feet = parseInt(feetMatch[1], 10);
          const inches = parseInt(feetMatch[2] || '0', 10);
          heightCm = Math.round((feet * 12 + inches) * 2.54);
        } else {
          const cmMatch = String(rawHeight).match(/(\d+)/);
          if (cmMatch) heightCm = parseInt(cmMatch[1], 10);
        }
      }
    }

    let weightKg: number | null = null;
    const rawWeight = p.weight || p.weightKg;
    if (rawWeight) {
      const match = String(rawWeight).match(/(\d+)/);
      if (match) weightKg = parseInt(match[1], 10);
    }

    // Salary Normalization (Monthly x 12 -> application bracket)
    const rawSal = car.salary || car.salaryMin || car.annual_income || car.annualIncome;
    const parsedSal = parseAnnualIncome(rawSal);
    const salaryText = parsedSal.salaryText;
    const salaryMin = parsedSal.salaryMin;

    // Occupation Splitting (designation, company, workingLocation)
    let designation = car.designation || car.occupation || null;
    let company = car.company || null;
    let workingLocation = car.workingLocation || car.work_location || null;

    if (designation && !company) {
      const atMatch = designation.match(/(.+?)\s+(?:at|in|@)\s+(.+)/i);
      if (atMatch) {
        designation = atMatch[1].trim();
        company = atMatch[2].trim();
      }
    }
    if (company && !workingLocation) {
      const locMatch = company.match(/(.+?)[,\-]\s*([A-Za-z\s]+)$/);
      if (locMatch && !/pvt|ltd|limited|llc|inc|corp/i.test(locMatch[2].trim())) {
        company = locMatch[1].trim();
        workingLocation = locMatch[2].trim();
      }
    }

    // Parents (Late status handling & name cleaning)
    const fatherParsed = cleanParentNameAndStatus(fam.fatherName || fam.father_name, fam.fatherAlive);
    const motherParsed = cleanParentNameAndStatus(fam.motherName || fam.mother_name, fam.motherAlive);

    // Nakshatra and Pada cleaning
    const starParsed = cleanStarAndPadam(
      horo.star || p.nakshatra || p.star,
      horo.starPadam || horo.star_padam || p.star_padam
    );

    // Rasi normalization (e.g. Kanya/Virgo -> Kanni)
    const normalizedRasi = normalizeRasi(horo.rasi || p.rasi);

    // Contact & Address
    const singleMobile = mobileList[0] || (typeof con.mobile === 'string' ? con.mobile : null) || null;
    const address = con.address || p.address || null;
    let city = p.city || con.city || con.district || null;
    let state = p.state || con.state || null;

    if (!city && address) {
      const addrCityMatch = address.match(/([A-Za-z]+)\s*(?:-\s*\d{6}|\d{6})/);
      if (addrCityMatch) city = addrCityMatch[1].trim();
    }
    if (!state && (city?.toLowerCase() === 'vaniyambadi' || /635\d{3}|chennai|gudiyattam|madurai|coimbatore/i.test(address || city || ''))) {
      state = 'Tamil Nadu';
    }

    // Property Details preservation
    const propertyDetails = p.propertyDetails || p.property_details || prop.details || prop.property_details || null;

    // Horoscope Charts (Strictly null if no visual chart)
    const rawRasiChart = horo.rasiChart || horo.rasi_chart || data.rasiChart || data.rasi_chart || null;
    const rawAmsamChart = horo.amsamChart || horo.amsam_chart || data.amsamChart || data.amsam_chart || data.navamsamChart || null;

    const normalizedRasiChart = rawRasiChart ? normalizeChartHouses(rawRasiChart) : null;
    const normalizedAmsamChart = rawAmsamChart ? normalizeChartHouses(rawAmsamChart) : null;

    let derivedRasi = normalizedRasi;
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
        dateOfBirth: dobIso,
        age,
        maritalStatus: p.maritalStatus || p.marital_status || null,
        heightCm,
        weight: weightKg,
        complexion: normalizeComplexion(p.complexion || (data as any).complexion),
        bodyType: p.bodyType || p.body_type || null,
        diet: p.diet || null,
        motherTongue: p.motherTongue || p.mother_tongue || null,
        about: p.about || null,
        birthOrder: p.birthOrder ? Number(p.birthOrder) : (birthDay ? null : null),
        residentStatus: p.residentStatus || p.resident_status || null,
        propertyDetails,
        religion: p.religion || null,
        community: p.community || null,
        caste: p.caste || null,
        subCaste: p.subCaste || p.sub_caste || null,
        gothram: p.gothram || null,
        country: p.country || con.country || null,
        state,
        city,
      },
      education: {
        degree: combinedDegree,
        fieldOfStudy: fieldOfStudy || edu.specialization || null,
        university: edu.university || null,
        yearCompleted: edu.yearCompleted ? Number(edu.yearCompleted) : null,
        additionalInfo: edu.additionalInfo || null,
      },
      occupation: {
        designation,
        company,
        salary: salaryText,
        salaryMin,
        workingLocation,
        employmentType: car.employmentType || car.employment_type || null,
      },
      family: {
        fatherName: fatherParsed.cleanName,
        fatherOccupation: fam.fatherOccupation || fam.father_occupation || null,
        fatherAlive: fatherParsed.isAlive,
        motherName: motherParsed.cleanName,
        motherOccupation: fam.motherOccupation || fam.mother_occupation || null,
        motherAlive: motherParsed.isAlive,
        brothers: fam.brothers !== undefined && fam.brothers !== null ? Number(fam.brothers) : null,
        brothersMarried: fam.brothersMarried !== undefined && fam.brothersMarried !== null ? Number(fam.brothersMarried) : (fam.brothers_married !== undefined ? Number(fam.brothers_married) : null),
        elderBrothers: fam.elderBrothers !== undefined ? Number(fam.elderBrothers) : (fam.elder_brothers !== undefined ? Number(fam.elder_brothers) : null),
        youngerBrothers: fam.youngerBrothers !== undefined ? Number(fam.youngerBrothers) : (fam.younger_brothers !== undefined ? Number(fam.younger_brothers) : null),
        sisters: fam.sisters !== undefined && fam.sisters !== null ? Number(fam.sisters) : null,
        sistersMarried: fam.sistersMarried !== undefined && fam.sistersMarried !== null ? Number(fam.sistersMarried) : (fam.sisters_married !== undefined ? Number(fam.sisters_married) : null),
        elderSisters: fam.elderSisters !== undefined ? Number(fam.elderSisters) : (fam.elder_sisters !== undefined ? Number(fam.elder_sisters) : null),
        youngerSisters: fam.youngerSisters !== undefined ? Number(fam.youngerSisters) : (fam.younger_sisters !== undefined ? Number(fam.younger_sisters) : null),
        familyType: fam.familyType || fam.family_type || null,
        familyStatus: fam.familyStatus || fam.family_status || null,
        nativePlace: fam.nativePlace || fam.native_place || null,
        familyDescription: fam.familyDescription || fam.family_description || null,
      },
      horoscope: {
        star: starParsed.star,
        starPadam: starParsed.starPadam,
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
        address,
        city,
        state,
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
      text.match(/(?:name|பெயர்|naam)\s*[:=\-]\s*([^\r\n]+)/i) ||
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

    // Date of Birth & Age (Support alpha months like 04-OCT-1994)
    const dobMatch =
      text.match(/(?:dob|date of birth|பிறந்த தேதி|b'day|born on)\s*[:=\-]\s*([^\r\n]+)/i) ||
      text.match(/(\d{1,2}[\/\.\-][A-Za-z0-9]+[\/\.\-]\d{2,4})/);
    const rawDob = dobMatch ? dobMatch[1].trim() : null;
    const parsedDate = parseBiodataDate(rawDob);

    const ageMatch = text.match(/(?:age|வயது)\s*[:=\-]\s*(\d{2})/i);
    const age = ageMatch ? parseInt(ageMatch[1], 10) : parsedDate.age;

    // Birth Time & Place
    const birthTimeMatch = text.match(/(?:birth time|time of birth|time|பிறந்த நேரம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const birthTime = birthTimeMatch ? birthTimeMatch[1].trim() : null;

    const birthPlaceMatch = text.match(/(?:birth place|place of birth|பிறந்த இடம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const birthPlace = birthPlaceMatch ? birthPlaceMatch[1].trim() : null;

    // Height, Weight & Complexion
    const heightMatch = text.match(/(?:height|உயரம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const height = heightMatch ? heightMatch[1].trim() : null;

    const weightMatch = text.match(/(?:weight|எடை)\s*[:=\-]\s*([^\r\n]+)/i);
    const weight = weightMatch ? weightMatch[1].trim() : null;

    const complexionMatch = text.match(/(?:complexion|நிறம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const complexion = complexionMatch ? complexionMatch[1].trim() : null;

    // Religion, Caste, Sub-Caste, Gothram
    const religionMatch = text.match(/(?:religion|மதம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const religion = religionMatch ? religionMatch[1].trim() : (text.match(/hindu|christian|muslim|jain/i)?.[0] || null);

    const casteMatch = text.match(/(?:caste|சாதி|சமூகம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const caste = casteMatch ? casteMatch[1].trim() : null;

    const subCasteMatch = text.match(/(?:sub\s*caste|உட்பிரிவு)\s*[:=\-]\s*([^\r\n]+)/i);
    const subCaste = subCasteMatch ? subCasteMatch[1].trim() : null;

    const gothramMatch = text.match(/(?:gothram|கோத்திரம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const gothram = gothramMatch ? gothramMatch[1].trim() : null;

    const kuladeivamMatch = text.match(/(?:kuladeivam|குலதெய்வம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const kuladeivam = kuladeivamMatch ? kuladeivamMatch[1].trim() : null;

    // Horoscope (Rasi, Nakshatra, Dosham)
    const rasiMatch = text.match(/(?:rasi|ராசி)\s*[:=\-]\s*([^\r\n]+)/i);
    const rawRasi = rasiMatch ? rasiMatch[1].trim() : null;

    const nakshatraMatch = text.match(/(?:star|nakshatra|நட்சத்திரம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const rawNakshatra = nakshatraMatch ? nakshatraMatch[1].trim() : null;

    const lagnamMatch = text.match(/(?:lagnam|லக்னம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const lagnam = lagnamMatch ? lagnamMatch[1].trim() : null;

    const chevvaiMatch = text.match(/(?:chevvai|sevvai|செவ்வாய்)\s*[:=\-]\s*([^\r\n]+)/i);
    const chevvai = chevvaiMatch ? chevvaiMatch[1].trim() : null;

    const doshamMatch = text.match(/(?:dosham|தோஷம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const dosham = doshamMatch ? doshamMatch[1].trim() : (chevvai ? `Chevvai: ${chevvai}` : null);

    // Detect Rasi & Amsam Chart: ONLY if explicit chart indicator is found
    const rasiChartDetected = /(?:ராசி கட்டம்|rasi chart|ஜாதக கட்டம்)\s*[:=\-]/i.test(text);
    const amsamChartDetected = /(?:அம்ச கட்டம்|amsam chart|நவாம்ச கட்டம்)\s*[:=\-]/i.test(text);

    const rasiChartObj: Record<string, string> = {};
    const amsamChartObj: Record<string, string> = {};

    const houses = ['Mesham', 'Rishabam', 'Mithunam', 'Kadagam', 'Simmam', 'Kanni', 'Thulaam', 'Viruchigam', 'Dhanusu', 'Magaram', 'Kumbam', 'Meenam'];
    const tamilHouses = ['மேஷம்', 'ரிஷபம்', 'மிதுனம்', 'கடகம்', 'சிம்மம்', 'கன்னி', 'துலாம்', 'விருச்சிகம்', 'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்'];

    if (rasiChartDetected || amsamChartDetected) {
      houses.forEach((h, idx) => {
        const th = tamilHouses[idx];
        const regex = new RegExp(`(?:${h}|${th})\\s*[:=\\-]\\s*([A-Za-z\\u0B80-\\u0BFF\\s.,\\/]+)`, 'i');
        const match = text.match(regex);
        if (match && match[1]) {
          const planets = match[1].split(/[\n;]/)[0].trim();
          if (planets) {
            rasiChartObj[h] = normalizePlanetTokens(planets);
          }
        }
      });
    }

    // Marital Status & Mother Tongue
    const maritalMatch = text.match(/(?:marital status|marital|திருமண நிலை)\s*[:=\-]\s*([^\r\n]+)/i);
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

    const motherTongueMatch = text.match(/(?:mother tongue|தாய்மொழி)\s*[:=\-]\s*([^\r\n]+)/i);
    const motherTongue = motherTongueMatch ? motherTongueMatch[1].trim() : (text.match(/tamil|telugu|kannada|malayalam|hindi|gujarati|marathi|bengali/i)?.[0] || null);

    // Education
    const eduMatch = text.match(/(?:education|qualification|degree|highest degree|படிப்பு|கல்வி)\s*[:=\-]\s*([^\r\n]+)/i);
    const highestQualification = eduMatch ? eduMatch[1].trim() : null;

    // Career & Income
    const occMatch = text.match(/(?:occupation\/designation|occupation|designation|profession|job|வேலை|தொழில்)\s*[:=\-]\s*([^\r\n]+)/i);
    const occupation = occMatch ? occMatch[1].trim() : null;

    const companyMatch = text.match(/(?:company|works at|organisation|organization|நிறுவனம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const company = companyMatch ? companyMatch[1].trim() : null;

    const salaryMatch = text.match(/(?:salary|income|ctc|வருமானம்|சம்பளம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const salary = salaryMatch ? salaryMatch[1].trim() : null;

    const workLocationMatch = text.match(/(?:working location|work location|job location|வேலை பார்க்கும் இடம்)\s*[:=\-]\s*([^\r\n]+)/i);
    const workLocation = workLocationMatch ? workLocationMatch[1].trim() : null;

    // Family
    const fatherMatch = text.match(/(?:father|அப்பா|தந்தை)\s*[:=\-]\s*([^\r\n]+)/i);
    const fatherName = fatherMatch ? fatherMatch[1].trim() : null;

    const motherMatch = text.match(/(?:mother|அம்மா|தாய்)\s*[:=\-]\s*([^\r\n]+)/i);
    const motherName = motherMatch ? motherMatch[1].trim() : null;

    const motherOccMatch = text.match(/(?:mother occupation|mother's occupation|அம்மா வேலை)\s*[:=\-]\s*([^\r\n]+)/i);
    const motherOccupation = motherOccMatch ? motherOccMatch[1].trim() : (/(?:homemaker|housewife|வீட்டுத் தலைவி)/i.test(text) ? (text.match(/homemaker|housewife|வீட்டுத் தலைவி/i)?.[0] || null) : null);

    // Siblings
    let brothersCount: number | null = null;
    let brothersMarriedCount: number | null = null;
    const broMatch = text.match(/(?:brothers|brother|சகோதரன்)\s*[:=\-]\s*([0-9]+)(?:[,\s]+(?:married|திருமணம்)?\s*[:=\-]?\s*([0-9]+))?/i);
    if (broMatch) {
      brothersCount = Number(broMatch[1]);
      if (broMatch[2]) brothersMarriedCount = Number(broMatch[2]);
    }

    let sistersCount: number | null = null;
    let sistersMarriedCount: number | null = null;
    const sisMatch = text.match(/(?:sisters|sister|சகோதரி)\s*[:=\-]\s*([0-9]+)(?:[,\s]+(?:married|திருமணம்)?\s*[:=\-]?\s*([0-9]+))?/i);
    if (sisMatch) {
      sistersCount = Number(sisMatch[1]);
      if (sisMatch[2]) sistersMarriedCount = Number(sisMatch[2]);
    }

    const familyType = text.match(/(?:family type|குடும்ப வகை)\s*[:=\-]\s*([^\r\n]+)/i)?.[1]?.trim() || (text.match(/nuclear|joint|கூட்டு குடும்பம்|தனி குடும்பம்/i)?.[0] || null);
    const familyStatus = text.match(/(?:family status|குடும்ப நிலை)\s*[:=\-]\s*([^\r\n]+)/i)?.[1]?.trim() || (text.match(/middle class|upper middle|rich|high class|நடுத்தரம்|உயர் நடுத்தரம்/i)?.[0] || null);

    // Contact Numbers & Email
    const mobiles = Array.from(text.matchAll(/(?:\+91[\s\-]?)?[6-9]\d{9}/g)).map((m) => m[0]);
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : null;

    const addressMatch = text.match(/(?:address|permanent address|residential address|முகவரி)\s*[:=\-]\s*([^\r\n]+)/i);
    const address = addressMatch ? addressMatch[1].trim() : null;

    const cityMatch = text.match(/(?:city|place|இடம்|ஊர்)\s*[:=\-]\s*([^\r\n]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : null;

    const state = text.match(/(?:state|மாநிலம்)\s*[:=\-]\s*([^\r\n]+)/i)?.[1]?.trim() || (text.match(/tamil nadu|kerala|karnataka|andhra|telangana|maharashtra/i)?.[0] || null);
    const country = text.match(/(?:country|நாடு)\s*[:=\-]\s*([^\r\n]+)/i)?.[1]?.trim() || (text.match(/india|usa|uk|uae|canada|singapore|australia/i)?.[0] || null);

    const propertyMatch = text.match(/(?:property details|property|assets|சொத்து விவரம்|சொத்துக்கள்)\s*[:=\-]\s*([^\r\n]+)/i);
    const propertyDetailsVal = propertyMatch ? propertyMatch[1].trim() : null;

    const rawOutput = {
      profile: {
        profile_type: gender === 'FEMALE' ? 'BRIDAL' : (gender === 'MALE' ? 'GROOM' : null),
        gender,
        name: fullName,
        first_name: firstName,
        middle_name: null,
        last_name: lastName,
        age,
        dob: rawDob,
        date_of_birth: rawDob,
        birth_day: parsedDate.birthDay,
        birth_month: parsedDate.birthMonth,
        birth_year: parsedDate.birthYear,
        birth_time: birthTime,
        birth_place: birthPlace,
        height,
        weight,
        complexion,
        marital_status: maritalStatus,
        mother_tongue: motherTongue,
        religion,
        caste,
        sub_caste: subCaste,
        gothram,
        kuladeivam,
        rasi: rawRasi,
        nakshatra: rawNakshatra,
        dosham,
        property_details: propertyDetailsVal,
      },
      education: {
        highest_qualification: highestQualification,
        degree: highestQualification ? [highestQualification] : [],
        fieldOfStudy: null,
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
        father_status: fatherName ? (/\b(?:late|மறைந்த|காலஞ்சென்ற)\b/i.test(fatherName) ? 'Late' : 'Alive') : null,
        mother_name: motherName,
        mother_occupation: motherOccupation,
        native_place: text.match(/(?:native|native place|சொந்த ஊர்)\s*[:=\-]\s*([A-Za-z\u0B80-\u0BFF\s]+)/i)?.[1]?.trim() || null,
        brothers: brothersCount,
        brothers_married: brothersMarriedCount,
        sisters: sistersCount,
        sisters_married: sistersMarriedCount,
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
        rasi: rawRasi,
        star: rawNakshatra,
        lagnam,
        dosham,
        birth_time: birthTime,
        birth_place: birthPlace,
        rasi_chart: Object.keys(rasiChartObj).length > 0 ? rasiChartObj : null,
        amsam_chart: Object.keys(amsamChartObj).length > 0 ? amsamChartObj : null,
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

const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function parseBiodataDate(rawDate: any): { dobIso: string | null; age: number | null; birthDay: number | null; birthMonth: number | null; birthYear: number | null } {
  if (!rawDate) return { dobIso: null, age: null, birthDay: null, birthMonth: null, birthYear: null };
  const str = String(rawDate).trim();

  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  // 1. Check DD-MMM-YYYY or DD MMM YYYY (e.g. 04-OCT-1994, 04 Oct 1994, 4-OCTOBER-1994)
  const alphaMatch = str.match(/^(\d{1,2})[\s\-\/\.]([a-zA-Z]{3,9})[\s\-\/\.](\d{2,4})$/);
  if (alphaMatch) {
    day = parseInt(alphaMatch[1], 10);
    const mStr = alphaMatch[2].toLowerCase();
    month = MONTH_MAP[mStr] || MONTH_MAP[mStr.slice(0, 3)] || null;
    let y = parseInt(alphaMatch[3], 10);
    year = y < 100 ? (y > 30 ? 1900 + y : 2000 + y) : y;
  }

  // 2. Check YYYY-MM-DD
  if (!year) {
    const isoMatch = str.match(/^(\d{4})[\-\/\.](\d{1,2})[\-\/\.](\d{1,2})$/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10);
      day = parseInt(isoMatch[3], 10);
    }
  }

  // 3. Check DD-MM-YYYY or DD/MM/YYYY
  if (!year) {
    const numMatch = str.match(/^(\d{1,2})[\-\/\.](\d{1,2})[\-\/\.](\d{2,4})$/);
    if (numMatch) {
      const p1 = parseInt(numMatch[1], 10);
      const p2 = parseInt(numMatch[2], 10);
      let p3 = parseInt(numMatch[3], 10);
      if (p3 < 100) p3 = p3 > 30 ? 1900 + p3 : 2000 + p3;
      if (p1 <= 31 && p2 <= 12) {
        day = p1;
        month = p2;
        year = p3;
      }
    }
  }

  // 4. Fallback search for 4 digit year
  if (!year) {
    const yMatch = str.match(/\b(19\d\d|20\d\d)\b/);
    if (yMatch) year = parseInt(yMatch[1], 10);
  }

  let dobIso: string | null = null;
  let age: number | null = null;

  if (year && month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    dobIso = `${year}-${mm}-${dd}`;

    const now = new Date();
    age = now.getFullYear() - year;
    if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) {
      age--;
    }
  } else if (year) {
    age = new Date().getFullYear() - year;
  }

  return { dobIso: dobIso || str, age, birthDay: day, birthMonth: month, birthYear: year };
}

export const INCOME_OPTIONS = [
  { min: 300000, text: '₹2 Lakhs – ₹3 Lakhs' },
  { min: 500000, text: '₹3 Lakhs – ₹5 Lakhs' },
  { min: 800000, text: '₹5 Lakhs – ₹8 Lakhs' },
  { min: 1200000, text: '₹8 Lakhs – ₹12 Lakhs' },
  { min: 1800000, text: '₹12 Lakhs – ₹18 Lakhs' },
  { min: 2500000, text: '₹18 Lakhs – ₹25 Lakhs' },
  { min: 3500000, text: '₹25 Lakhs – ₹35 Lakhs' },
  { min: 5000000, text: 'Above ₹35 Lakhs' },
] as const;

export function normalizeComplexion(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str === '—' || str.toLowerCase() === 'not specified' || str.toLowerCase() === 'null') {
    return null;
  }

  const lower = str.toLowerCase();

  // 1. Very Fair
  if (
    lower.includes('very fair') ||
    lower.includes('veryfair') ||
    lower.includes('very_fair') ||
    lower.includes('மிகவும் சிகப்பு') ||
    lower.includes('milky white')
  ) {
    return 'Very Fair';
  }

  // 2. Dark
  if (
    /\bdark\b/.test(lower) ||
    lower.includes('black') ||
    lower.includes('கருப்பு') ||
    lower.includes('கருமை')
  ) {
    return 'Dark';
  }

  // 3. Wheatish & Synonyms (Medium, Dusky, Brown, Medium/Fair, etc.)
  if (
    /\bwheat(?:ish)?\b/.test(lower) ||
    lower.includes('medium') ||
    lower.includes('dusky') ||
    lower.includes('brown') ||
    lower.includes('tan') ||
    lower.includes('olive') ||
    lower.includes('மாநிறம்') ||
    lower.includes('மா நிறம்')
  ) {
    return 'Wheatish';
  }

  // 4. Fair
  if (
    /\bfair\b/.test(lower) ||
    lower.includes('light') ||
    lower.includes('white') ||
    lower.includes('சிகப்பு')
  ) {
    return 'Fair';
  }

  return null;
}

export function parseAnnualIncome(val: any): { salaryText: string | null; salaryMin: number | null } {
  if (val === undefined || val === null || val === '') return { salaryText: null, salaryMin: null };
  const str = String(val).trim();
  if (!str || str === '—' || str.toLowerCase() === 'not specified' || str.toLowerCase() === 'null') {
    return { salaryText: null, salaryMin: null };
  }

  // 1. Check exact match with existing dropdown values or labels
  const exactOption = INCOME_OPTIONS.find(
    (opt) => opt.min === Number(str) || opt.text.toLowerCase() === str.toLowerCase()
  );
  if (exactOption) {
    return { salaryText: exactOption.text, salaryMin: exactOption.min };
  }

  // 2. Range strings (e.g. "12 - 18L", "18-25 Lakhs", "₹12 Lakhs – ₹18 Lakhs")
  if (/12\s*[-–to]\s*18/i.test(str)) return { salaryMin: 1800000, salaryText: '₹12 Lakhs – ₹18 Lakhs' };
  if (/18\s*[-–to]\s*25/i.test(str)) return { salaryMin: 2500000, salaryText: '₹18 Lakhs – ₹25 Lakhs' };
  if (/25\s*[-–to]\s*35/i.test(str)) return { salaryMin: 3500000, salaryText: '₹25 Lakhs – ₹35 Lakhs' };
  if (/8\s*[-–to]\s*12/i.test(str)) return { salaryMin: 1200000, salaryText: '₹8 Lakhs – ₹12 Lakhs' };
  if (/5\s*[-–to]\s*8/i.test(str)) return { salaryMin: 800000, salaryText: '₹5 Lakhs – ₹8 Lakhs' };
  if (/3\s*[-–to]\s*5/i.test(str)) return { salaryMin: 500000, salaryText: '₹3 Lakhs – ₹5 Lakhs' };
  if (/2\s*[-–to]\s*3/i.test(str)) return { salaryMin: 300000, salaryText: '₹2 Lakhs – ₹3 Lakhs' };

  // 3. Explicit "Above 35" / "Above 25" strings without specific monthly figure
  if (/(?:above|over|>|\+)\s*35/i.test(str) || /35\s*(?:above|plus|\+)/i.test(str)) {
    return { salaryMin: 5000000, salaryText: 'Above ₹35 Lakhs' };
  }
  if (/(?:above|over|>|\+)\s*25/i.test(str) || /25\s*(?:above|plus|\+)/i.test(str)) {
    if (!/(?:per\s*month|\/\s*month|pm|மாதம்)/i.test(str)) {
      return { salaryMin: 3500000, salaryText: '₹25 Lakhs – ₹35 Lakhs' };
    }
  }

  // 4. Monthly vs Annual detection
  const isMonthly = /(?:per\s*month|\/\s*month|\b(?:p\.?m\.?|pm)\b|மாதம்|\/pm)/i.test(str);

  let calculatedAnnual = 0;

  if (isMonthly) {
    let monthlyRupees = 0;
    const lkMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:l|lk|lac|lakh|lakhs|லட்சம்)/i);
    if (lkMatch) {
      monthlyRupees = parseFloat(lkMatch[1]) * 100000;
    } else {
      const numMatch = str.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i);
      if (numMatch) {
        monthlyRupees = parseInt(numMatch[1].replace(/,/g, ''), 10);
      }
    }
    calculatedAnnual = Math.round(monthlyRupees * 12);
  } else {
    const lkMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:lpa|l|lk|lac|lakh|lakhs|லட்சம்)/i);
    if (lkMatch) {
      calculatedAnnual = Math.round(parseFloat(lkMatch[1]) * 100000);
    } else {
      const numMatch = str.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*)/i);
      if (numMatch) {
        const valNum = parseInt(numMatch[1].replace(/,/g, ''), 10);
        if (valNum >= 1 && valNum <= 100) {
          calculatedAnnual = valNum * 100000;
        } else {
          calculatedAnnual = valNum;
        }
      }
    }
  }

  if (!calculatedAnnual || isNaN(calculatedAnnual) || calculatedAnnual <= 0) {
    return { salaryText: null, salaryMin: null };
  }

  // 5. Map calculated annual income to existing application bracket
  if (calculatedAnnual <= 300000) {
    return { salaryMin: 300000, salaryText: '₹2 Lakhs – ₹3 Lakhs' };
  }
  if (calculatedAnnual <= 500000) {
    return { salaryMin: 500000, salaryText: '₹3 Lakhs – ₹5 Lakhs' };
  }
  if (calculatedAnnual <= 800000) {
    return { salaryMin: 800000, salaryText: '₹5 Lakhs – ₹8 Lakhs' };
  }
  if (calculatedAnnual < 1200000) {
    return { salaryMin: 1200000, salaryText: '₹8 Lakhs – ₹12 Lakhs' };
  }
  if (calculatedAnnual <= 1800000) {
    return { salaryMin: 1800000, salaryText: '₹12 Lakhs – ₹18 Lakhs' };
  }
  if (calculatedAnnual <= 2500000) {
    return { salaryMin: 2500000, salaryText: '₹18 Lakhs – ₹25 Lakhs' };
  }
  if (calculatedAnnual <= 3500000) {
    return { salaryMin: 3500000, salaryText: '₹25 Lakhs – ₹35 Lakhs' };
  }
  return { salaryMin: 5000000, salaryText: 'Above ₹35 Lakhs' };
}

function cleanParentNameAndStatus(rawName: any, defaultAlive?: boolean | null): { cleanName: string | null; isAlive: boolean | null } {
  if (!rawName) return { cleanName: null, isAlive: defaultAlive ?? null };
  let str = String(rawName).trim();
  let isAlive = defaultAlive !== undefined && defaultAlive !== null ? Boolean(defaultAlive) : null;

  if (/\b(?:late|மறைந்த|காலஞ்சென்ற)\b/i.test(str)) {
    isAlive = false;
    str = str.replace(/\(?(?:late|மறைந்த|காலஞ்சென்ற)\.?\)?/gi, '').trim();
    str = str.replace(/\s{2,}/g, ' ').replace(/^[-:\s]+|[-:\s]+$/g, '');
  } else if (isAlive === null) {
    isAlive = true;
  }

  return { cleanName: str || null, isAlive };
}

function cleanStarAndPadam(starVal: any, padamVal: any): { star: string | null; starPadam: number | null } {
  let star = starVal ? String(starVal).trim() : null;
  let starPadam = padamVal !== undefined && padamVal !== null && padamVal !== '' ? Number(padamVal) : null;

  if (star) {
    const padaMatch = star.match(/(?:[–\-:,]\s*)?(?:pada|padam|பாதம்|paadam)\s*[-:]?\s*([1-4])/i) ||
                      star.match(/\s*[-–]\s*([1-4])\s*$/);
    if (padaMatch) {
      if (!starPadam) {
        starPadam = parseInt(padaMatch[1], 10);
      }
      star = star.replace(padaMatch[0], '').trim();
    }
  }

  return { star, starPadam };
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

function normalizeRasi(rasiStr: any): string | null {
  if (!rasiStr || typeof rasiStr !== 'string') return null;
  const cleaned = rasiStr.trim();
  const parts = cleaned.split(/[\/\-,|]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  for (const part of parts) {
    if (HOUSE_SYNONYMS[part]) return HOUSE_SYNONYMS[part];
  }
  const direct = cleaned.toLowerCase();
  return HOUSE_SYNONYMS[direct] || cleaned;
}

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
  const trimmed = planetsStr.trim().toLowerCase();
  if (['string', 'null', 'undefined', 'none', '-', 'nil', 'empty'].includes(trimmed)) return '';

  const cleaned = planetsStr.replace(/\b\d+[-.:]\d+\b/g, '').replace(/\b\d+\b/g, '');
  const tokens = cleaned.split(/[,;\/\s]+/).map((t) => t.trim()).filter(Boolean);
  const normalized = tokens
    .map((t) => {
      const key = t.toLowerCase();
      return PLANET_TOKEN_MAP[key] || null;
    })
    .filter(Boolean);

  if (normalized.length === 0) return '';
  return Array.from(new Set(normalized)).join(', ');
}

function normalizeChartHouses(chart: any): Record<string, string> | null {
  if (!chart || typeof chart !== 'object') return null;

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

  let hasAnyPlanet = false;

  for (const [key, val] of Object.entries(chart)) {
    const cleanedKey = key.trim().toLowerCase();
    const standardHouse = HOUSE_SYNONYMS[cleanedKey] || key;
    if (result[standardHouse] !== undefined) {
      const valStr = typeof val === 'string' ? val : (Array.isArray(val) ? val.join(', ') : String(val || ''));
      const normalized = normalizePlanetTokens(valStr);
      if (normalized) {
        result[standardHouse] = normalized;
        hasAnyPlanet = true;
      }
    }
  }

  // If no house contains any real planet, return null!
  if (!hasAnyPlanet) {
    return null;
  }

  return result;
}
