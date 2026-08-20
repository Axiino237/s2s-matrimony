/**
 * Canonical Profile JSON Formatter
 * Formats every user profile (manual, form, or AI extracted) into a complete,
 * strictly defined JSON schema where any missing/unfilled field is explicitly null.
 */

export function buildCanonicalProfileJson(
  profile: any = {},
  inputData: any = {},
  source: 'AI_OCR' | 'FORM_ENTRY' | 'MANUAL_EDIT' | 'PROFILE_UPDATE' = 'PROFILE_UPDATE'
) {
  const p = profile || {};
  const inp = inputData || {};

  // Extract nested or flat structures
  const prof = inp.profile || inp;
  const edu = inp.education || p.education || {};
  const car = inp.career || inp.occupation || p.occupation || {};
  const fam = inp.family || p.family || {};
  const horo = inp.horoscope || p.horoscope || {};
  const pref = inp.partnerPreference || p.partnerPreference || {};
  const con = inp.contact || {};

  // Helper for non-empty string or null
  const strOrNull = (val: any): string | null => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    return s.length > 0 && s !== 'undefined' && s !== 'null' ? s : null;
  };

  // Helper for number or null
  const numOrNull = (val: any): number | null => {
    if (val === undefined || val === null || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  // Helper for boolean or null
  const boolOrNull = (val: any): boolean | null => {
    if (val === undefined || val === null) return null;
    if (typeof val === 'boolean') return val;
    const s = String(val).toLowerCase().trim();
    if (s === 'true' || s === 'yes' || s === '1') return true;
    if (s === 'false' || s === 'no' || s === '0') return false;
    return null;
  };

  const firstName = strOrNull(prof.first_name || prof.firstName || p.firstName || (prof.name ? String(prof.name).split(' ')[0] : null));
  const lastName = strOrNull(prof.last_name || prof.lastName || p.lastName || (prof.name ? String(prof.name).split(' ').slice(1).join(' ') : null));
  const displayName = strOrNull(prof.name || prof.displayName || p.displayName || [firstName, lastName].filter(Boolean).join(' ') || null);

  const religionName = strOrNull(
    prof.religion || (typeof p.religion === 'object' ? p.religion?.name : p.religion) || p.religionText
  );
  const communityName = strOrNull(
    prof.caste || prof.community || (typeof p.community === 'object' ? p.community?.name : p.community) || (typeof p.caste === 'object' ? p.caste?.name : p.caste) || p.casteText
  );
  const subCasteName = strOrNull(
    prof.sub_caste || prof.subCaste || prof.subcaste || (typeof p.subCaste === 'object' ? p.subCaste?.name : p.subCaste) || p.subCasteText
  );

  const mainPhoto = strOrNull(
    inp.profile_photo ||
    prof.profile_photo ||
    prof.profilePhotoUrl ||
    p.profilePhotoUrl ||
    p.photos?.find((ph: any) => ph.isMain)?.url ||
    p.photos?.[0]?.url
  );

  const mobileNumber = strOrNull(
    (Array.isArray(con.mobile) ? con.mobile[0] : con.mobile) ||
    inp.mobile ||
    inp.phone ||
    p.user?.phone ||
    p.phone
  );

  const emailAddress = strOrNull(
    con.email ||
    inp.email ||
    p.user?.email ||
    p.email
  );

  return {
    id: strOrNull(p.id),
    userId: strOrNull(p.userId || p.user?.id),
    memberId: strOrNull(prof.member_id || prof.memberId || inp.memberId || p.memberId),
    regnDate: strOrNull(prof.regnDate || inp.regnDate || (p.createdAt ? String(p.createdAt).split('T')[0] : null)),
    branch: strOrNull(prof.branch || inp.branch || p.branch),
    name: displayName,
    firstName,
    lastName,
    displayName,
    gender: strOrNull(prof.gender || p.gender),
    dateOfBirth: strOrNull(prof.dob || prof.dateOfBirth || inp.dateOfBirth || (p.dateOfBirth ? String(p.dateOfBirth).split('T')[0] : null)),
    age: numOrNull(prof.age || inp.age || p.age),
    birthPlace: strOrNull(prof.birth_place || prof.birthPlace || horo.birthPlace || inp.birthPlace || inp.placeOfBirth || p.birthPlace),
    birthTime: strOrNull(prof.birth_time || prof.birthTime || horo.birthTime || inp.birthTime || inp.timeOfBirth || p.birthTime),
    birthOrder: numOrNull(prof.birthOrder || inp.birthOrder || p.birthOrder),
    maritalStatus: strOrNull(prof.marital_status || prof.maritalStatus || inp.maritalStatus || p.maritalStatus),
    motherTongue: strOrNull(prof.mother_tongue || prof.motherTongue || inp.motherTongue || p.motherTongue),
    religion: religionName,
    caste: communityName,
    subCaste: subCasteName,
    gothram: strOrNull(prof.gothram || horo.gothram || inp.gothram || p.gothram),
    height: strOrNull(prof.height || (p.heightCm ? `${p.heightCm} cm` : null)),
    heightCm: numOrNull(prof.heightCm || inp.heightCm || p.heightCm),
    weight: strOrNull(prof.weight || (p.weight ? `${p.weight} kg` : null)),
    weightKg: numOrNull(prof.weightKg || inp.weightKg || p.weight),
    complexion: strOrNull(prof.complexion || inp.complexion || p.complexion),
    bodyType: strOrNull(prof.bodyType || inp.bodyType || p.bodyType),
    bloodGroup: strOrNull(prof.blood_group || prof.bloodGroup || inp.bloodGroup || p.bloodGroup),
    diet: strOrNull(prof.diet || inp.diet || p.diet),
    smoking: boolOrNull(prof.smoking ?? inp.smoking ?? p.smoking) ?? false,
    drinking: boolOrNull(prof.drinking ?? inp.drinking ?? p.drinking) ?? false,
    disability: strOrNull(prof.disability || inp.disability || p.disability),
    about: strOrNull(prof.about || inp.about || inp.aboutMe || p.about),
    profilePhotoUrl: mainPhoto,
    residentStatus: strOrNull(prof.residentStatus || inp.residentStatus || inp.resident || p.residentStatus),
    propertyDetails: strOrNull(prof.propertyDetails || inp.propertyDetails || inp.property || fam.property_assets || fam.propertyAssets || p.propertyDetails),
    nativePlace: strOrNull(prof.nativePlace || fam.native_place || fam.nativePlace || inp.nativePlace || p.nativePlace),
    currentCity: strOrNull(prof.currentCity || con.current_city || inp.currentCity || inp.city || inp.residencePlace || p.currentCity),
    address: strOrNull(prof.address || con.address || inp.address),
    mobile: mobileNumber,
    email: emailAddress,

    education: {
      highestQualification: strOrNull(edu.highest_qualification || edu.highestQualification || edu.degree || inp.educationDegree || inp.education),
      degree: strOrNull(Array.isArray(edu.degree) ? edu.degree.join(', ') : (edu.degree || edu.highest_qualification || inp.educationDegree || inp.education)),
      fieldOfStudy: strOrNull(edu.fieldOfStudy || edu.field_of_study || inp.fieldOfStudy),
      college: strOrNull(edu.college || inp.college || inp.educationDetails),
      university: strOrNull(edu.university || edu.college || inp.university),
      yearCompleted: numOrNull(edu.yearCompleted || edu.year_completed || inp.yearCompleted),
      additionalInfo: strOrNull(edu.additionalInfo || edu.additional_info || inp.additionalInfo),
    },

    career: {
      occupation: strOrNull(car.occupation || car.designation || inp.occupation || inp.designation),
      designation: strOrNull(car.designation || car.occupation || inp.designation || inp.occupation),
      company: strOrNull(car.company || inp.company || inp.companyName),
      annualIncome: strOrNull(car.annual_income || car.annualIncome || car.salary || inp.annualIncome || inp.salary || (car.salaryMin ? String(car.salaryMin) : null)),
      salaryMin: numOrNull(car.salaryMin || car.salary_min || (car.annualIncome && !isNaN(Number(car.annualIncome)) ? Number(car.annualIncome) : null)),
      salaryMax: numOrNull(car.salaryMax || car.salary_max),
      workLocation: strOrNull(car.work_location || car.workingLocation || car.workLocation || inp.workLocation || inp.jobLocation),
      employmentType: strOrNull(car.employmentType || car.employment_type || inp.employmentType),
    },

    family: {
      fatherName: strOrNull(fam.father_name || fam.fatherName || inp.fatherName),
      fatherOccupation: strOrNull(fam.father_occupation || fam.fatherOccupation || inp.fatherOccupation || inp.fatherJob),
      fatherAlive: boolOrNull(fam.father_alive ?? fam.fatherAlive ?? inp.fatherAlive) ?? true,
      motherName: strOrNull(fam.mother_name || fam.motherName || inp.motherName),
      motherOccupation: strOrNull(fam.mother_occupation || fam.motherOccupation || inp.motherOccupation || inp.motherJob),
      motherAlive: boolOrNull(fam.mother_alive ?? fam.motherAlive ?? inp.motherAlive) ?? true,
      siblings: numOrNull(fam.siblings || inp.siblings),
      elderBrothers: numOrNull(fam.elder_brothers ?? fam.elderBrothers ?? inp.elderBrothers ?? inp.elderBrother) ?? 0,
      elderBrothersMarried: numOrNull(fam.elderBrothersMarried ?? inp.elderBrothersMarried ?? inp.marriedElderBrother) ?? 0,
      youngerBrothers: numOrNull(fam.younger_brothers ?? fam.youngerBrothers ?? inp.youngerBrothers ?? inp.youngerBrother) ?? 0,
      youngerBrothersMarried: numOrNull(fam.youngerBrothersMarried ?? inp.youngerBrothersMarried ?? inp.marriedYoungerBrother) ?? 0,
      elderSisters: numOrNull(fam.elder_sisters ?? fam.elderSisters ?? inp.elderSisters ?? inp.elderSister) ?? 0,
      elderSistersMarried: numOrNull(fam.elderSistersMarried ?? inp.elderSistersMarried ?? inp.marriedElderSister) ?? 0,
      youngerSisters: numOrNull(fam.younger_sisters ?? fam.youngerSisters ?? inp.youngerSisters ?? inp.youngerSister) ?? 0,
      youngerSistersMarried: numOrNull(fam.youngerSistersMarried ?? inp.youngerSistersMarried ?? inp.marriedYoungerSister) ?? 0,
      familyType: strOrNull(fam.family_type || fam.familyType || inp.familyType),
      familyStatus: strOrNull(fam.family_status || fam.familyStatus || inp.familyStatus),
      familyValues: strOrNull(fam.family_values || fam.familyValues || inp.familyValues),
      familyDescription: strOrNull(fam.familyDescription || fam.family_description || inp.familyDescription),
      nativePlace: strOrNull(fam.native_place || fam.nativePlace || inp.nativePlace),
      propertyAssets: strOrNull(fam.property_assets || fam.propertyAssets || inp.propertyAssets || inp.propertyDetails || inp.property),
    },

    horoscope: {
      rasi: strOrNull(horo.rasi || prof.rasi || inp.rasi),
      nakshatra: strOrNull(horo.star || horo.nakshatra || prof.nakshatra || prof.star || inp.nakshatra || inp.natchathiram || inp.star),
      star: strOrNull(horo.star || horo.nakshatra || prof.star || prof.nakshatra || inp.star || inp.natchathiram),
      starPadam: numOrNull(horo.starPadam || inp.starPadam || inp.natchathiramPadham),
      lagnam: strOrNull(horo.lagnam || prof.lagnam || inp.lagnam),
      gothram: strOrNull(horo.gothram || prof.gothram || inp.gothram),
      kuladeivam: strOrNull(horo.kuladeivam || prof.kuladeivam || inp.kuladeivam),
      dosham: strOrNull(horo.dosham || prof.dosham || inp.dosham),
      chevvai: strOrNull(horo.chevvai || prof.chevvai || inp.chevvai),
      dasaBalance: strOrNull(horo.dasaBalance || inp.dasaBalance || inp.dasaIrupu),
      birthPlace: strOrNull(horo.birthPlace || prof.birth_place || inp.birthPlace || inp.placeOfBirth),
      birthTime: strOrNull(horo.birthTime || prof.birth_time || inp.birthTime || inp.timeOfBirth),
      horoscopeDetails: strOrNull(horo.horoscopeDetails || prof.horoscope_details || inp.horoscopeDetails),
      rasiChart: horo.rasiChart || horo.horoscopeData?.rasiChart || inp.horoscopeData?.rasiChart || inp.rasiChart || {},
      amsamChart: horo.amsamChart || horo.horoscopeData?.amsamChart || inp.horoscopeData?.amsamChart || inp.amsamChart || {},
    },

    partnerPreference: {
      ageMin: numOrNull(pref.ageMin || inp.prefAgeMin),
      ageMax: numOrNull(pref.ageMax || inp.prefAgeMax),
      heightMin: numOrNull(pref.heightMin || inp.prefHeightMin),
      heightMax: numOrNull(pref.heightMax || inp.prefHeightMax),
      maritalStatus: strOrNull(pref.maritalStatus || inp.prefMaritalStatus),
      religion: strOrNull(pref.religion || inp.prefReligion),
      caste: strOrNull(pref.caste || inp.prefCaste),
      education: strOrNull(pref.education || inp.prefEducation),
      occupation: strOrNull(pref.occupation || inp.prefOccupation),
      annualIncome: strOrNull(pref.annualIncome || inp.prefAnnualIncome),
      location: strOrNull(pref.location || inp.prefLocation),
      diet: strOrNull(pref.diet || inp.prefDiet),
      aboutPartner: strOrNull(pref.aboutPartner || inp.aboutPartner || inp.expectation),
    },

    metadata: {
      source,
      updatedAt: new Date().toISOString(),
      completionPercent: numOrNull(p.profileCompletionPercent || inp.profileCompletionPercent) ?? 0,
    },
  };
}
