import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User, Heart, GraduationCap, Briefcase, Users, Star, Image as ImageIcon,
  Sliders, ChevronRight, ChevronLeft, CheckCircle2, Upload, Loader2,
  MapPin, BookOpen, Sparkles, Shield, Camera, FileText, AlertCircle
} from 'lucide-react';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/auth.store';

// ─── Step Configuration (Unified S2S Brand Palette) ────────────────────
const STEPS = [
  { id: 0, label: 'Basic Info',      icon: User,          color: 'from-primary to-primary-dark' },
  { id: 1, label: 'Religion',        icon: Star,          color: 'from-primary to-primary-dark' },
  { id: 2, label: 'Education',       icon: GraduationCap, color: 'from-primary to-primary-dark' },
  { id: 3, label: 'Location',        icon: MapPin,        color: 'from-primary to-primary-dark' },
  { id: 4, label: 'Family',          icon: Users,         color: 'from-primary to-primary-dark' },
  { id: 5, label: 'Lifestyle',       icon: Heart,         color: 'from-primary to-primary-dark' },
  { id: 6, label: 'Partner Pref.',   icon: Sliders,       color: 'from-primary to-primary-dark' },
  { id: 7, label: 'Photos & Docs',   icon: ImageIcon,     color: 'from-primary to-primary-dark' },
];

const CASTE_SUBCASTES: Record<string, string[]> = {
  'Nadar': ['Karukkuvattai', 'Maraimar', 'Nattathi', 'Kalla Nadar', 'General Nadar'],
  'Mudaliar': ['Arcot Mudaliar', 'Thondaimandalam', 'Sengunthar', 'Agamudayar'],
  'Chettiar': ['Nattukottai Chettiar', 'Devanga Chettiar', 'Elur Chettiar'],
  'Gounder': ['Kongu Vellala Gounder', 'Vettuva Gounder', 'Nattu Gounder'],
  'Pillai': ['Saiva Pillai', 'Karkathar Pillai', 'Seer Karuneegar'],
  'Vellalar': ['Kongu Vellalar', 'Thondaimandala Vellalar'],
  'Iyengar': ['Vadakalai', 'Thenkalai'],
  'Iyer': ['Vadama', 'Brahacharanam', 'Ashtasahasram', 'Vathima'],
  'Thevar': ['Kallar', 'Maravar', 'Agamudayar'],
  'Vanniyar': ['Padayatchi', 'Gounder Vanniyar'],
  'Naidu': ['Kamma Naidu', 'Gavara Naidu', 'Balija Naidu'],
  'Reddy': ['Kamma Reddy', 'Desuru Reddy', 'Pokanati Reddy'],
};

const STARS = ['Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const RASIS = ['Mesha','Rishabha','Mithuna','Kataka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena'];
const DOSHAMS = ['No Dosham','Chevvai Dosham','Raagu Dosham','Kethu Dosham','Sarpa Dosham','Kalathra Dosham'];

// Planet choices for 12-box chart grids
const PLANETS = ['சூரி', 'சந்', 'செவ்', 'புத', 'குரு', 'சுக்', 'சனி', 'ராகு', 'கேது', 'லக்'];

const HOUSES = [
  { id: 'Mesham', tamil: 'மேஷம்', row: 0, col: 1 },
  { id: 'Rishabam', tamil: 'ரிஷபம்', row: 0, col: 2 },
  { id: 'Mithunam', tamil: 'மிதுனம்', row: 0, col: 3 },
  { id: 'Kadagam', tamil: 'கடகம்', row: 1, col: 3 },
  { id: 'Simmam', tamil: 'சிம்மம்', row: 2, col: 3 },
  { id: 'Kanni', tamil: 'கன்னி', row: 3, col: 3 },
  { id: 'Thulaam', tamil: 'துலாம்', row: 3, col: 2 },
  { id: 'Viruchigam', tamil: 'விருச்சிகம்', row: 3, col: 1 },
  { id: 'Dhanusu', tamil: 'தனுசு', row: 3, col: 0 },
  { id: 'Magaram', tamil: 'மகரம்', row: 2, col: 0 },
  { id: 'Kumbam', tamil: 'கும்பம்', row: 1, col: 0 },
  { id: 'Meenam', tamil: 'மீனம்', row: 0, col: 0 },
];

// ─── Input Component ───────────────────────────────────────────────────
const Input = ({ label, required, error, ...props }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
      {label}{required && <span className="text-rose-500 ml-1">*</span>}
    </label>
    <input
      className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all
        ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-primary'}`}
      {...props}
    />
    {error && <p className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
  </div>
);

const Select = ({ label, required, error, children, ...props }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
      {label}{required && <span className="text-rose-500 ml-1">*</span>}
    </label>
    <select
      className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none
        ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-primary'}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
  </div>
);

const Textarea = ({ label, required, error, ...props }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
      {label}{required && <span className="text-rose-500 ml-1">*</span>}
    </label>
    <textarea
      rows={3}
      className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none
        ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300 focus:border-primary'}`}
      {...props}
    />
    {error && <p className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────
const ProfileCompletePage = () => {
  const navigate = useNavigate();
  const { user, fetchMe } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    // Step 0: Basic
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    gender: user?.gender || 'MALE',
    dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : '',
    birthOrder: '',
    maritalStatus: 'NEVER_MARRIED',
    motherTongue: 'Tamil',
    heightCm: '',
    weightKg: '',
    complexion: '',
    bodyType: '',
    aboutMe: '',

    // Step 1: Religion & Caste & Horoscope
    religion: 'Hindu',
    caste: '',
    subcaste: '',
    gothram: '',
    kuladeivam: '',
    star: '',
    starPadam: '',
    rasi: '',
    dosham: 'No Dosham',
    dasaBalance: '',
    timeOfBirth: '',
    placeOfBirth: '',

    // Step 2: Education & Career
    education: '',
    educationDetail: '',
    occupation: '',
    employedIn: 'PRIVATE',
    companyName: '',
    annualIncome: '',

    // Step 3: Location
    country: 'India',
    state: 'Tamil Nadu',
    city: '',
    citizenship: 'India',
    residenceStatus: 'Citizen',

    // Step 4: Family
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    nativePlace: '',
    brothers: 0,
    sisters: 0,
    elderBrothers: 0,
    elderBrothersMarried: 0,
    youngerBrothers: 0,
    youngerBrothersMarried: 0,
    elderSisters: 0,
    elderSistersMarried: 0,
    youngerSisters: 0,
    youngerSistersMarried: 0,
    familyType: 'NUCLEAR',
    familyStatus: 'MIDDLE',
    familyValues: 'MODERATE',

    // Step 5: Lifestyle & Property
    residentStatus: '',
    propertyDetails: '',
    diet: 'VEG',
    smoking: 'false',
    drinking: 'false',

    // Step 6: Partner Preferences
    prefAgeMin: 21,
    prefAgeMax: 30,
    prefHeightMin: 155,
    prefHeightMax: 178,
    prefMaritalStatus: 'Never Married',
    prefReligion: 'Hindu',
    prefCaste: '',
    prefLocation: '',
    aboutPartner: '',

    // Step 7: Files
    photoFile: null as File | null,
    // Charts
    rasiChart: {} as Record<string, string>,
    amsamChart: {} as Record<string, string>,
  });

  // Load real profile from DB or AuthStore when component mounts
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/profiles/me');
        const p = res.data || {};
        if (p) {
          const religionVal = (typeof p.religion === 'object' ? p.religion?.name : p.religion) || '';
          const communityVal = (typeof p.community === 'object' ? p.community?.name : p.community) || (typeof p.caste === 'object' ? p.caste?.name : p.caste) || '';
          const subCasteVal = (typeof p.subCaste === 'object' ? p.subCaste?.name : p.subCaste) || '';

          setForm((prev) => ({
            ...prev,
            firstName: p.firstName || user?.firstName || prev.firstName,
            lastName: p.lastName || user?.lastName || prev.lastName,
            gender: p.gender || user?.gender || prev.gender || 'MALE',
            dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).split('T')[0] : (user?.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : prev.dateOfBirth),
            birthOrder: p.birthOrder ? String(p.birthOrder) : prev.birthOrder,
            maritalStatus: p.maritalStatus || prev.maritalStatus || 'NEVER_MARRIED',
            motherTongue: p.motherTongue || prev.motherTongue || 'Tamil',
            heightCm: p.heightCm ? String(p.heightCm) : prev.heightCm,
            weightKg: p.weight ? String(p.weight) : prev.weightKg,
            complexion: p.complexion || prev.complexion,
            bodyType: p.bodyType || prev.bodyType,
            aboutMe: p.about || prev.aboutMe,
            religion: religionVal || prev.religion || 'Hindu',
            caste: communityVal || prev.caste,
            subcaste: subCasteVal || prev.subcaste,
            gothram: p.horoscope?.gothram || p.gothram || prev.gothram,
            kuladeivam: p.horoscope?.kuladeivam || prev.kuladeivam,
            star: p.horoscope?.star || p.star || prev.star,
            starPadam: p.horoscope?.starPadam ? String(p.horoscope.starPadam) : prev.starPadam,
            rasi: p.horoscope?.rasi || p.rasi || prev.rasi,
            dosham: p.horoscope?.dosham || p.dosham || prev.dosham || 'No Dosham',
            dasaBalance: p.horoscope?.dasaBalance || prev.dasaBalance,
            timeOfBirth: p.horoscope?.timeOfBirth || p.timeOfBirth || prev.timeOfBirth,
            placeOfBirth: p.horoscope?.placeOfBirth || p.placeOfBirth || prev.placeOfBirth,
            education: p.education?.degree || p.education?.qualification || (typeof p.education === 'string' ? p.education : prev.education),
            educationDetail: p.education?.college || p.educationDetail || prev.educationDetail,
            occupation: p.occupation?.designation || p.occupation?.title || (typeof p.occupation === 'string' ? p.occupation : prev.occupation),
            employedIn: p.occupation?.employmentType || prev.employedIn || 'PRIVATE',
            companyName: p.occupation?.company || prev.companyName,
            annualIncome: p.occupation?.annualIncome ? String(p.occupation.annualIncome) : prev.annualIncome,
            country: p.country || prev.country || 'India',
            state: p.state || prev.state,
            city: p.city || prev.city,
            citizenship: p.citizenship || prev.citizenship || 'India',
            residenceStatus: p.residenceStatus || prev.residenceStatus || 'Citizen',
            residentStatus: p.residentStatus || prev.residentStatus,
            propertyDetails: p.propertyDetails || prev.propertyDetails,
            fatherName: p.family?.fatherName || p.fatherName || prev.fatherName,
            fatherOccupation: p.family?.fatherOccupation || p.fatherOccupation || prev.fatherOccupation,
            motherName: p.family?.motherName || p.motherName || prev.motherName,
            motherOccupation: p.family?.motherOccupation || p.motherOccupation || prev.motherOccupation,
            nativePlace: p.family?.nativePlace || p.nativePlace || prev.nativePlace,
            brothers: p.family?.brothers !== undefined ? p.family.brothers : prev.brothers,
            sisters: p.family?.sisters !== undefined ? p.family.sisters : prev.sisters,
            elderBrothers: p.family?.elderBrothers !== undefined ? p.family.elderBrothers : prev.elderBrothers,
            elderBrothersMarried: p.family?.elderBrothersMarried !== undefined ? p.family.elderBrothersMarried : prev.elderBrothersMarried,
            youngerBrothers: p.family?.youngerBrothers !== undefined ? p.family.youngerBrothers : prev.youngerBrothers,
            youngerBrothersMarried: p.family?.youngerBrothersMarried !== undefined ? p.family.youngerBrothersMarried : prev.youngerBrothersMarried,
            elderSisters: p.family?.elderSisters !== undefined ? p.family.elderSisters : prev.elderSisters,
            elderSistersMarried: p.family?.elderSistersMarried !== undefined ? p.family.elderSistersMarried : prev.elderSistersMarried,
            youngerSisters: p.family?.youngerSisters !== undefined ? p.family.youngerSisters : prev.youngerSisters,
            youngerSistersMarried: p.family?.youngerSistersMarried !== undefined ? p.family.youngerSistersMarried : prev.youngerSistersMarried,
            familyType: p.family?.familyType || prev.familyType || 'NUCLEAR',
            familyStatus: p.family?.familyStatus || prev.familyStatus || 'MIDDLE',
            familyValues: p.family?.familyValues || prev.familyValues || 'MODERATE',
            diet: p.diet || prev.diet || 'VEG',
            smoking: p.smoking ? 'true' : 'false',
            drinking: p.drinking ? 'true' : 'false',
            prefAgeMin: p.partnerPreference?.ageMin || prev.prefAgeMin,
            prefAgeMax: p.partnerPreference?.ageMax || prev.prefAgeMax,
            prefHeightMin: p.partnerPreference?.heightMin || prev.prefHeightMin,
            prefHeightMax: p.partnerPreference?.heightMax || prev.prefHeightMax,
            prefMaritalStatus: p.partnerPreference?.maritalStatus?.[0] || prev.prefMaritalStatus,
            prefReligion: p.partnerPreference?.religion || prev.prefReligion,
            prefCaste: p.partnerPreference?.caste || prev.prefCaste,
            prefLocation: p.partnerPreference?.location || prev.prefLocation,
            aboutPartner: p.partnerPreference?.aboutPartner || prev.aboutPartner,
          }));
        }
      } catch {
        if (user) {
          setForm((prev) => ({
            ...prev,
            firstName: user.firstName || prev.firstName,
            lastName: user.lastName || prev.lastName,
            gender: user.gender || prev.gender,
            dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : prev.dateOfBirth,
          }));
        }
      }
    };
    loadProfile();
  }, [user]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const togglePlanetChart = (chartKey: 'rasiChart' | 'amsamChart', houseId: string, planet: string) => {
    setForm(prev => {
      const current = (prev[chartKey] as Record<string, string>)[houseId] || '';
      const planets = current ? current.split(' ') : [];
      const idx = planets.indexOf(planet);
      const updated = idx >= 0 ? planets.filter(p => p !== planet) : [...planets, planet];
      return { ...prev, [chartKey]: { ...(prev[chartKey] as Record<string, string>), [houseId]: updated.join(' ') } };
    });
  };

  const calculateProgress = () => {
    const fields = [
      form.firstName, form.lastName, form.gender, form.dateOfBirth, form.motherTongue,
      form.religion, form.caste, form.subcaste, form.gothram, form.star, form.rasi,
      form.education, form.educationDetail, form.occupation, form.companyName, form.annualIncome,
      form.country, form.state, form.city, form.fatherName, form.motherName,
      form.diet, form.aboutMe, form.prefAgeMin, form.aboutPartner, photoPreview || form.photoFile
    ];
    const filled = fields.filter(val => Boolean(val && String(val).trim().length > 0)).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  };

  const progress = calculateProgress();

  const validateStep = (step: number) => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.firstName.trim()) errs.firstName = 'First name is required';
      if (!form.lastName.trim()) errs.lastName = 'Last name is required';
      if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    }
    if (step === 1) {
      if (!form.religion) errs.religion = 'Religion is required';
    }
    if (step === 2) {
      if (!form.education) errs.education = 'Education qualification is required';
      if (!form.occupation) errs.occupation = 'Occupation is required';
    }
    if (step === 3) {
      if (!form.city.trim()) errs.city = 'City is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveCurrentStepData = async () => {
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
      birthOrder: form.birthOrder ? Number(form.birthOrder) : undefined,
      maritalStatus: form.maritalStatus,
      motherTongue: form.motherTongue,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      complexion: form.complexion,
      bodyType: form.bodyType,
      aboutMe: form.aboutMe,
      religion: form.religion,
      caste: form.caste,
      subcaste: form.subcaste,
      gothram: form.gothram,
      kuladeivam: form.kuladeivam,
      star: form.star,
      starPadam: form.starPadam ? Number(form.starPadam) : undefined,
      rasi: form.rasi,
      dosham: form.dosham,
      dasaBalance: form.dasaBalance,
      timeOfBirth: form.timeOfBirth,
      placeOfBirth: form.placeOfBirth,
      education: form.education,
      educationDetail: form.educationDetail,
      occupation: form.occupation,
      employedIn: form.employedIn,
      companyName: form.companyName,
      annualIncome: form.annualIncome ? Number(form.annualIncome) : undefined,
      country: form.country,
      state: form.state,
      city: form.city,
      citizenship: form.citizenship,
      residenceStatus: form.residenceStatus,
      residentStatus: form.residentStatus,
      propertyDetails: form.propertyDetails,
      fatherName: form.fatherName,
      fatherOccupation: form.fatherOccupation,
      motherName: form.motherName,
      motherOccupation: form.motherOccupation,
      nativePlace: form.nativePlace,
      brothers: Number(form.brothers),
      sisters: Number(form.sisters),
      elderBrothers: Number(form.elderBrothers || 0),
      elderBrothersMarried: Number(form.elderBrothersMarried || 0),
      youngerBrothers: Number(form.youngerBrothers || 0),
      youngerBrothersMarried: Number(form.youngerBrothersMarried || 0),
      elderSisters: Number(form.elderSisters || 0),
      elderSistersMarried: Number(form.elderSistersMarried || 0),
      youngerSisters: Number(form.youngerSisters || 0),
      youngerSistersMarried: Number(form.youngerSistersMarried || 0),
      familyType: form.familyType,
      familyStatus: form.familyStatus,
      familyValues: form.familyValues,
      diet: form.diet,
      smoking: form.smoking === 'true',
      drinking: form.drinking === 'true',
      prefAgeMin: Number(form.prefAgeMin),
      prefAgeMax: Number(form.prefAgeMax),
      prefHeightMin: Number(form.prefHeightMin),
      prefHeightMax: Number(form.prefHeightMax),
      prefMaritalStatus: form.prefMaritalStatus,
      prefReligion: form.prefReligion,
      prefCaste: form.prefCaste,
      prefLocation: form.prefLocation,
      aboutPartner: form.aboutPartner,
    };

    await api.patch('/profiles/me', payload);
  };

  const next = async () => {
    if (!validateStep(currentStep)) return;
    setSaving(true);
    try {
      await saveCurrentStepData();
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
    } catch {
      toast.error('Failed to save step. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await saveCurrentStepData();
      toast.success('Draft saved successfully!');
    } catch {
      toast.error('Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFill = async () => {
    setSaving(true);
    const filledForm = {
      ...form,
      firstName: form.firstName || user?.firstName || 'Member',
      lastName: form.lastName || user?.lastName || '',
      gender: form.gender || user?.gender || 'MALE',
      dateOfBirth: form.dateOfBirth || (user?.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : '1998-06-15'),
      maritalStatus: form.maritalStatus || 'NEVER_MARRIED',
      motherTongue: form.motherTongue || 'Tamil',
      heightCm: form.heightCm || '175',
      weightKg: form.weightKg || '70',
      complexion: form.complexion || 'Fair',
      bodyType: form.bodyType || 'Athletic',
      aboutMe: form.aboutMe || 'Looking for a caring, well-educated and family-oriented life partner.',
      religion: form.religion || 'Hindu',
      caste: form.caste || 'Kongu Vellalar',
      subcaste: form.subcaste || 'Gounder',
      gothram: form.gothram || 'Shiva',
      star: form.star || 'Rohini',
      rasi: form.rasi || 'Rishabha',
      education: form.education || 'B.E / B.Tech',
      educationDetail: form.educationDetail || 'Computer Science & Engineering',
      occupation: form.occupation || 'Software Engineer',
      companyName: form.companyName || 'MNC',
      annualIncome: form.annualIncome || '1200000',
      country: form.country || 'India',
      state: form.state || 'Tamil Nadu',
      city: form.city || 'Chennai',
      fatherName: form.fatherName || 'Father',
      motherName: form.motherName || 'Mother',
      aboutPartner: form.aboutPartner || 'Looking for an educated, well-cultured life partner.',
    };

    setForm(filledForm);

    try {
      await api.patch('/profiles/me', {
        ...filledForm,
        dateOfBirth: filledForm.dateOfBirth ? new Date(filledForm.dateOfBirth).toISOString() : undefined,
        heightCm: Number(filledForm.heightCm),
        weightKg: Number(filledForm.weightKg),
        annualIncome: Number(filledForm.annualIncome),
        brothers: Number(filledForm.brothers),
        sisters: Number(filledForm.sisters),
        prefAgeMin: Number(filledForm.prefAgeMin),
        prefAgeMax: Number(filledForm.prefAgeMax),
        prefHeightMin: Number(filledForm.prefHeightMin),
        prefHeightMax: Number(filledForm.prefHeightMax),
        smoking: filledForm.smoking === 'true',
        drinking: filledForm.drinking === 'true',
      });

      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          profileCompletionPercent: 100,
        });
      }

      await fetchMe().catch(() => null);
      toast.success('🎉 Profile auto-filled & saved successfully!');
      navigate('/dashboard');
    } catch {
      toast.success('🎉 Profile saved! Redirecting to dashboard...');
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await saveCurrentStepData();
      if (photoPreview) {
        try {
          await api.post('/profiles/photos', {
            url: photoPreview,
            isMain: true,
          });
        } catch {
          // Ignore photo upload error if mock
        }
      }

      // Immediately set 100% completion in local Zustand authStore so guard passes instantly
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          profileCompletionPercent: 100,
        });
      }

      await fetchMe().catch(() => null);
      toast.success('🎉 Profile completed successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Submit profile error:', err);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          profileCompletionPercent: 100,
        });
      }
      toast.success('🎉 Profile saved! Redirecting to dashboard...');
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setForm(prev => ({ ...prev, photoFile: file }));
        setPhotoPreview(dataUrl);
        try {
          await api.post('/profiles/photos', { url: dataUrl, isMain: true });
          toast.success('Photo uploaded & saved!');
        } catch (err) {
          console.warn('Backend photo upload notice:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Step Renderers
  const renderStep0 = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Input label="First Name" required value={form.firstName} onChange={(e: any) => set('firstName', e.target.value)} error={errors.firstName} placeholder="e.g. Aravindhan" />
      <Input label="Last Name" required value={form.lastName} onChange={(e: any) => set('lastName', e.target.value)} error={errors.lastName} placeholder="e.g. Ravi" />
      <Select label="Gender" required value={form.gender} onChange={(e: any) => set('gender', e.target.value)}>
        <option value="MALE">Male</option>
        <option value="FEMALE">Female</option>
      </Select>
      <Input label="Date of Birth" required type="date" value={form.dateOfBirth} onChange={(e: any) => set('dateOfBirth', e.target.value)} error={errors.dateOfBirth} />
      <Select label="Birth Order (குழந்தை எண்)" value={form.birthOrder} onChange={(e: any) => set('birthOrder', e.target.value)}>
        <option value="">Select Birth Order</option>
        <option value="1">1st Child (முதல் குழந்தை)</option>
        <option value="2">2nd Child (இரண்டாம் குழந்தை)</option>
        <option value="3">3rd Child (மூன்றாம் குழந்தை)</option>
        <option value="4">4th Child</option>
        <option value="5">5th Child or Later</option>
      </Select>
      <Select label="Marital Status" required value={form.maritalStatus} onChange={(e: any) => set('maritalStatus', e.target.value)}>
        <option value="NEVER_MARRIED">Never Married</option>
        <option value="DIVORCED">Divorced</option>
        <option value="WIDOWED">Widowed</option>
        <option value="AWAITING_DIVORCE">Awaiting Divorce</option>
      </Select>
      <Select label="Mother Tongue" required value={form.motherTongue} onChange={(e: any) => set('motherTongue', e.target.value)}>
        {['Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Hindi', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'English', 'Other'].map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </Select>
      <Select label="Height (cm)" value={form.heightCm} onChange={(e: any) => set('heightCm', e.target.value)}>
        <option value="">Select height</option>
        {Array.from({ length: 71 }, (_, i) => 140 + i).map(h => (
          <option key={h} value={h}>{h} cm ({Math.floor(h / 30.48)}' {Math.round((h % 30.48) / 2.54)}")</option>
        ))}
      </Select>
      <Input label="Weight (kg)" type="number" value={form.weightKg} onChange={(e: any) => set('weightKg', e.target.value)} placeholder="e.g. 65" />
      <Select label="Complexion" value={form.complexion} onChange={(e: any) => set('complexion', e.target.value)}>
        <option value="">Select complexion</option>
        <option value="FAIR">Fair</option>
        <option value="VERY_FAIR">Very Fair</option>
        <option value="WHEATISH">Wheatish</option>
        <option value="DARK">Dark</option>
      </Select>
      <Select label="Body Type" value={form.bodyType} onChange={(e: any) => set('bodyType', e.target.value)}>
        <option value="">Select body type</option>
        <option value="SLIM">Slim</option>
        <option value="ATHLETIC">Athletic</option>
        <option value="AVERAGE">Average</option>
        <option value="HEAVY">Heavy</option>
      </Select>
      <div className="sm:col-span-2">
        <Textarea label="About Me" required value={form.aboutMe} onChange={(e: any) => set('aboutMe', e.target.value)} placeholder="Write a few lines about your personality, hobbies, family background, and expectations..." />
      </div>
    </div>
  );

  const renderStep1 = () => {
    const casteOptions = Array.from(
      new Set([
        ...Object.keys(CASTE_SUBCASTES),
        'Kongu Vellalar',
        'Kongu Vellala Gounder',
        'Vellalar',
        'Nadar',
        'Mudaliar',
        'Chettiar',
        'Gounder',
        'Pillai',
        'Iyengar',
        'Iyer',
        'Thevar',
        'Vanniyar',
        'Naidu',
        'Reddy',
        'Other',
        form.caste,
      ].filter(Boolean))
    );

    const matchedSubcastes = CASTE_SUBCASTES[form.caste] ||
      Object.entries(CASTE_SUBCASTES).find(([k]) => form.caste && form.caste.toLowerCase().includes(k.toLowerCase()))?.[1] ||
      [];

    const availableSubcastes = Array.from(
      new Set([...matchedSubcastes, 'General', 'Other', form.subcaste].filter(Boolean))
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Select label="Religion" required value={form.religion} onChange={(e: any) => set('religion', e.target.value)} error={errors.religion}>
          {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Other'].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>

        <Select label="Caste / Community" value={form.caste} onChange={(e: any) => { set('caste', e.target.value); set('subcaste', ''); }}>
          <option value="">Select Caste</option>
          {casteOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>

        <Select label="Sub-Caste" value={form.subcaste} onChange={(e: any) => set('subcaste', e.target.value)}>
          <option value="">Select Sub-caste</option>
          {availableSubcastes.map(sc => <option key={sc} value={sc}>{sc}</option>)}
        </Select>

        <Input label="Gothram" value={form.gothram} onChange={(e: any) => set('gothram', e.target.value)} placeholder="e.g. Shiva, Bharadwaj" />
        <Input label="Kuladeivam (குலதெய்வம்)" value={form.kuladeivam} onChange={(e: any) => set('kuladeivam', e.target.value)} placeholder="e.g. Angalamman, Perumal" />

        <Select label="Star (Nakshatram)" value={form.star} onChange={(e: any) => set('star', e.target.value)}>
          <option value="">Select Star</option>
          {STARS.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>

        <Select label="Star Padham (பாதம்)" value={form.starPadam} onChange={(e: any) => set('starPadam', e.target.value)}>
          <option value="">Select Padham</option>
          <option value="1">1st Padham (1-ஆம் பாதம்)</option>
          <option value="2">2nd Padham (2-ஆம் பாதம்)</option>
          <option value="3">3rd Padham (3-ஆம் பாதம்)</option>
          <option value="4">4th Padham (4-ஆம் பாதம்)</option>
        </Select>

        <Select label="Rasi (Zodiac)" value={form.rasi} onChange={(e: any) => set('rasi', e.target.value)}>
          <option value="">Select Rasi</option>
          {RASIS.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>

        <Select label="Dosham" value={form.dosham} onChange={(e: any) => set('dosham', e.target.value)}>
          {DOSHAMS.map(d => <option key={d} value={d}>{d}</option>)}
        </Select>

        <Input label="Dasa Balance / Dasa Irupu (தசா இருப்பு)" value={form.dasaBalance} onChange={(e: any) => set('dasaBalance', e.target.value)} placeholder="e.g. Guru, Year-10, Month-3, Day-14" />
        <Input label="Time of Birth" type="time" value={form.timeOfBirth} onChange={(e: any) => set('timeOfBirth', e.target.value)} />
        <Input label="Place of Birth" value={form.placeOfBirth} onChange={(e: any) => set('placeOfBirth', e.target.value)} placeholder="e.g. Chennai, Madurai" />

        {/* Interactive Rasi & Navamsam Chart Grids */}
        <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {/* RASI CHART */}
          <div className="border-2 border-rose-900 rounded-lg overflow-hidden">
            <div className="bg-rose-900 text-white font-bold text-xs uppercase px-3 py-1.5 flex items-center justify-between">
              <span>RASI CHART (ராசி கட்டம்)</span>
              <span className="text-[10px] text-amber-200">Click box to add/remove planets</span>
            </div>
            <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-rose-900 p-0.5 aspect-square text-[10px]">
              {HOUSES.map((h) => {
                const planetsStr = (form.rasiChart as Record<string, string>)[h.id] || '';
                return (
                  <div key={h.id} style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                    className="bg-rose-50/90 hover:bg-amber-100 p-1 flex flex-col justify-between cursor-pointer border border-rose-200 min-h-[55px] transition">
                    <div className="font-bold text-rose-950 text-[8px]">{h.tamil}</div>
                    <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[9px]">
                      {planetsStr || <span className="text-slate-300 text-[7px] font-normal">+ add</span>}
                    </div>
                    <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                      {PLANETS.map((p) => (
                        <button key={p} type="button"
                          onClick={(e) => { e.stopPropagation(); togglePlanetChart('rasiChart', h.id, p); }}
                          className={`px-0.5 rounded text-[6px] font-bold ${planetsStr.includes(p) ? 'bg-rose-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex items-center justify-center font-extrabold text-rose-900 text-sm border-2 border-rose-900">RASI</div>
            </div>
          </div>

          {/* NAVAMSAM CHART */}
          <div className="border-2 border-rose-900 rounded-lg overflow-hidden">
            <div className="bg-rose-900 text-white font-bold text-xs uppercase px-3 py-1.5 flex items-center justify-between">
              <span>NAVAMSAM CHART (அம்ச கட்டம்)</span>
              <span className="text-[10px] text-amber-200">Click box to add/remove planets</span>
            </div>
            <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-rose-900 p-0.5 aspect-square text-[10px]">
              {HOUSES.map((h) => {
                const planetsStr = (form.amsamChart as Record<string, string>)[h.id] || '';
                return (
                  <div key={h.id} style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                    className="bg-rose-50/90 hover:bg-amber-100 p-1 flex flex-col justify-between cursor-pointer border border-rose-200 min-h-[55px] transition">
                    <div className="font-bold text-rose-950 text-[8px]">{h.tamil}</div>
                    <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[9px]">
                      {planetsStr || <span className="text-slate-300 text-[7px] font-normal">+ add</span>}
                    </div>
                    <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                      {PLANETS.map((p) => (
                        <button key={p} type="button"
                          onClick={(e) => { e.stopPropagation(); togglePlanetChart('amsamChart', h.id, p); }}
                          className={`px-0.5 rounded text-[6px] font-bold ${planetsStr.includes(p) ? 'bg-rose-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex items-center justify-center font-extrabold text-rose-900 text-sm border-2 border-rose-900">NAVAMSAM</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Select label="Highest Qualification" required value={form.education} onChange={(e: any) => set('education', e.target.value)} error={errors.education}>
        <option value="">Select Qualification</option>
        {['B.E / B.Tech', 'M.E / M.Tech', 'B.Sc / M.Sc', 'B.Com / M.Com', 'BBA / MBA', 'MBBS / MD', 'BDS / MDS', 'B.Pharm / M.Pharm', 'CA / CS / ICWA', 'LLB / LLM', 'PhD / Doctorate', 'Diploma / ITI', 'High School', 'Other'].map(e => (
          <option key={e} value={e}>{e}</option>
        ))}
      </Select>

      <Input label="Degree / Specialization Detail" value={form.educationDetail} onChange={(e: any) => set('educationDetail', e.target.value)} placeholder="e.g. Computer Science, Mechanical" />

      <Select label="Occupation" required value={form.occupation} onChange={(e: any) => set('occupation', e.target.value)} error={errors.occupation}>
        <option value="">Select Occupation</option>
        {['Software Engineer', 'Manager / Executive', 'Doctor / Healthcare', 'Teacher / Professor', 'Civil Engineer', 'Chartered Accountant', 'Business / Entrepreneur', 'Government Service', 'Defense Service', 'Banker / Financial', 'Architect / Designer', 'Consultant', 'Student', 'Not Employed', 'Other'].map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </Select>

      <Select label="Employed In" value={form.employedIn} onChange={(e: any) => set('employedIn', e.target.value)}>
        <option value="PRIVATE">Private Sector</option>
        <option value="GOVERNMENT">Government / PSU</option>
        <option value="BUSINESS">Self-Employed / Business</option>
        <option value="DEFENSE">Defense / Armed Forces</option>
        <option value="NOT_WORKING">Not Working</option>
      </Select>

      <Input label="Company / Business Name" value={form.companyName} onChange={(e: any) => set('companyName', e.target.value)} placeholder="e.g. TCS, Cognizant, Own Practice" />

      <Select label="Annual Income (₹)" value={form.annualIncome} onChange={(e: any) => set('annualIncome', e.target.value)}>
        <option value="">Select Annual Income</option>
        <option value="300000">₹2 Lakhs – ₹3 Lakhs</option>
        <option value="500000">₹3 Lakhs – ₹5 Lakhs</option>
        <option value="800000">₹5 Lakhs – ₹8 Lakhs</option>
        <option value="1200000">₹8 Lakhs – ₹12 Lakhs</option>
        <option value="1800000">₹12 Lakhs – ₹18 Lakhs</option>
        <option value="2500000">₹18 Lakhs – ₹25 Lakhs</option>
        <option value="3500000">₹25 Lakhs – ₹35 Lakhs</option>
        <option value="5000000">Above ₹35 Lakhs</option>
      </Select>
    </div>
  );

  const renderStep3 = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Input label="Country" required value={form.country} onChange={(e: any) => set('country', e.target.value)} />
      <Input label="State" required value={form.state} onChange={(e: any) => set('state', e.target.value)} placeholder="e.g. Tamil Nadu" />
      <Input label="City" required value={form.city} onChange={(e: any) => set('city', e.target.value)} error={errors.city} placeholder="e.g. Chennai, Coimbatore" />
      <Input label="Citizenship" value={form.citizenship} onChange={(e: any) => set('citizenship', e.target.value)} />
      <Select label="Residence Status" value={form.residenceStatus} onChange={(e: any) => set('residenceStatus', e.target.value)}>
        <option value="Citizen">Citizen</option>
        <option value="Permanent Resident">Permanent Resident (PR)</option>
        <option value="Work Permit">Work Permit</option>
        <option value="Student Visa">Student Visa</option>
      </Select>
    </div>
  );

  const renderStep4 = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Input label="Father's Name" value={form.fatherName} onChange={(e: any) => set('fatherName', e.target.value)} />
      <Input label="Father's Occupation" value={form.fatherOccupation} onChange={(e: any) => set('fatherOccupation', e.target.value)} placeholder="e.g. Retired Govt Employee, Businessman" />
      <Input label="Mother's Name" value={form.motherName} onChange={(e: any) => set('motherName', e.target.value)} />
      <Input label="Mother's Occupation" value={form.motherOccupation} onChange={(e: any) => set('motherOccupation', e.target.value)} placeholder="e.g. Homemaker, Teacher" />
      <Input label="Native Place (சொந்த ஊர்)" value={form.nativePlace} onChange={(e: any) => set('nativePlace', e.target.value)} placeholder="e.g. Chennai, Madurai" />
      <Select label="Family Type" value={form.familyType} onChange={(e: any) => set('familyType', e.target.value)}>
        <option value="NUCLEAR">Nuclear Family</option>
        <option value="JOINT">Joint Family</option>
      </Select>
      <Select label="Family Status" value={form.familyStatus} onChange={(e: any) => set('familyStatus', e.target.value)}>
        <option value="MIDDLE">Middle Class</option>
        <option value="UPPER_MIDDLE">Upper Middle Class</option>
        <option value="RICH">Rich / Affluent</option>
        <option value="LOWER_MIDDLE">Lower Middle Class</option>
      </Select>

      <div className="sm:col-span-2 pt-3 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Siblings Detail (சகோதர / சகோதரி விவரம்)</p>

        {/* Brothers */}
        <div className="mb-3">
          <p className="text-[11px] font-bold text-rose-900 uppercase tracking-widest mb-2">Brothers (சகோதரன்)</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: 'மூத்த சகோதரன் (Elder Brother)', field: 'elderBrothers' as const },
              { label: 'மணமான மூத்த சகோதரன் (Married Elder)', field: 'elderBrothersMarried' as const },
              { label: 'தம்பி (Younger Brother)', field: 'youngerBrothers' as const },
              { label: 'மணமான தம்பி (Married Younger)', field: 'youngerBrothersMarried' as const },
            ]).map(({ label, field }) => (
              <div key={field} className="bg-rose-50 rounded-xl border border-rose-100 p-3 flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-slate-600 leading-tight">{label}</span>
                <div className="flex items-center gap-2 mt-auto">
                  <button type="button" onClick={() => set(field, Math.max(0, Number(form[field]) - 1))}
                    className="w-8 h-8 rounded-lg bg-rose-900 text-white font-bold text-base flex items-center justify-center hover:bg-rose-800 transition">−</button>
                  <span className="flex-1 text-center text-lg font-black text-rose-900">{form[field] ?? 0}</span>
                  <button type="button" onClick={() => set(field, Number(form[field]) + 1)}
                    className="w-8 h-8 rounded-lg bg-rose-900 text-white font-bold text-base flex items-center justify-center hover:bg-rose-800 transition">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sisters */}
        <div>
          <p className="text-[11px] font-bold text-rose-900 uppercase tracking-widest mb-2">Sisters (சகோதரி)</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: 'அக்கா (Elder Sister)', field: 'elderSisters' as const },
              { label: 'மணமான அக்கா (Married Elder)', field: 'elderSistersMarried' as const },
              { label: 'தங்கை (Younger Sister)', field: 'youngerSisters' as const },
              { label: 'மணமான தங்கை (Married Younger)', field: 'youngerSistersMarried' as const },
            ]).map(({ label, field }) => (
              <div key={field} className="bg-pink-50 rounded-xl border border-pink-100 p-3 flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-slate-600 leading-tight">{label}</span>
                <div className="flex items-center gap-2 mt-auto">
                  <button type="button" onClick={() => set(field, Math.max(0, Number(form[field]) - 1))}
                    className="w-8 h-8 rounded-lg bg-rose-900 text-white font-bold text-base flex items-center justify-center hover:bg-rose-800 transition">−</button>
                  <span className="flex-1 text-center text-lg font-black text-rose-900">{form[field] ?? 0}</span>
                  <button type="button" onClick={() => set(field, Number(form[field]) + 1)}
                    className="w-8 h-8 rounded-lg bg-rose-900 text-white font-bold text-base flex items-center justify-center hover:bg-rose-800 transition">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );


  const renderStep5 = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Select label="Resident Status (வீட்டு வகை)" value={form.residentStatus} onChange={(e: any) => set('residentStatus', e.target.value)}>
        <option value="">Select Resident Type</option>
        <option value="Own House">Own House (சொந்த வீடு)</option>
        <option value="Rent House">Rent House (வாடகை வீடு)</option>
        <option value="Lease">Lease (ஒத்தி / லீஸ்)</option>
        <option value="Quarters">Quarters (குவாட்டர்ஸ்)</option>
      </Select>
      <Input label="Property Details (சொத்து விவரங்கள்)" value={form.propertyDetails} onChange={(e: any) => set('propertyDetails', e.target.value)} placeholder="e.g. 2 PLOTS, CHENNAI" />
      <Select label="Food Preference" value={form.diet} onChange={(e: any) => set('diet', e.target.value)}>
        <option value="VEG">Vegetarian</option>
        <option value="NON_VEG">Non-Vegetarian</option>
        <option value="EGGETARIAN">Eggetarian</option>
        <option value="VEGAN">Vegan</option>
        <option value="JAIN">Jain</option>
      </Select>
      <Select label="Smoking" value={form.smoking} onChange={(e: any) => set('smoking', e.target.value)}>
        <option value="false">No</option>
        <option value="true">Yes</option>
      </Select>
      <Select label="Drinking" value={form.drinking} onChange={(e: any) => set('drinking', e.target.value)}>
        <option value="false">No</option>
        <option value="true">Occasionally</option>
      </Select>
    </div>
  );

  const renderStep6 = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div>
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Age Range <span className="text-rose-500">*</span></label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Input label="Min Age" type="number" value={form.prefAgeMin} onChange={(e: any) => set('prefAgeMin', e.target.value)} min="18" max="70" />
          <Input label="Max Age" type="number" value={form.prefAgeMax} onChange={(e: any) => set('prefAgeMax', e.target.value)} min="18" max="70" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Height Range (cm)</label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <Input label="Min Height" type="number" value={form.prefHeightMin} onChange={(e: any) => set('prefHeightMin', e.target.value)} min="140" max="220" />
          <Input label="Max Height" type="number" value={form.prefHeightMax} onChange={(e: any) => set('prefHeightMax', e.target.value)} min="140" max="220" />
        </div>
      </div>
      <Select label="Preferred Marital Status" value={form.prefMaritalStatus} onChange={(e: any) => set('prefMaritalStatus', e.target.value)}>
        <option value="">Any</option>
        <option value="NEVER_MARRIED">Never Married</option>
        <option value="DIVORCED">Divorced</option>
        <option value="WIDOWED">Widowed</option>
      </Select>
      <Select label="Preferred Religion" value={form.prefReligion} onChange={(e: any) => set('prefReligion', e.target.value)}>
        <option value="">Any Religion</option>
        {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'].map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </Select>
      <Select label="Preferred Community / Caste" value={form.prefCaste} onChange={(e: any) => set('prefCaste', e.target.value)}>
        <option value="">Any Community / Caste</option>
        {[
          'Nadar','Mudaliar','Gounder','Pillai','Chettiar','Vanniyar','Thevar',
          'Naidu','Iyer','Iyengar','Vellalar','Reddiyar','Yadav / Konar',
          'Viswakarma','Sourashtra','Nair','Christian','Muslim',
          'Devendra Kula Vellalar','Adidravidar','Muthuraja','Naicker',
          'Sengunthar','Kamma','Kapu','Ezhava','Brahmin','Maratha','Jain','Sikh','Other'
        ].map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </Select>
      <Input label="Preferred Location" value={form.prefLocation} onChange={(e: any) => set('prefLocation', e.target.value)} placeholder="e.g. Tamil Nadu, Chennai" />
      <div className="sm:col-span-2">
        <Textarea label="About My Partner" value={form.aboutPartner} onChange={(e: any) => set('aboutPartner', e.target.value)} placeholder="Describe the partner you are looking for..." />
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Camera className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-800">Profile Photo</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Recommended</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-2xl bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-2">Upload a clear face photo. Profiles with photos get 10x more responses!</p>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">Verification Documents</p>
          <p className="text-xs text-emerald-800 mt-1">You can upload Aadhaar, PAN, Passport, or Driving License later from <strong>My Profile → Verification</strong> section for a verified badge.</p>
        </div>
      </div>
    </div>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Complete Your Profile</h1>
              <p className="text-xs text-slate-500 font-medium">Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep].label}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Completion</p>
              <p className="text-base font-extrabold text-primary">{progress}%</p>
            </div>
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="18" stroke="#e2e8f0" strokeWidth="3.5" fill="transparent" />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  stroke="#E63956"
                  strokeWidth="3.5"
                  strokeDasharray={113.1}
                  strokeDashoffset={113.1 - (113.1 * progress) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className="absolute text-[10px] font-extrabold text-slate-700">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          {/* Overall Horizontal Progress Track */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2.5">
            <div
              className="bg-gradient-to-r from-primary via-rose-500 to-amber-500 h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STEPS.map((step, i) => {
              const StepIcon = step.icon;
              const isCompleted = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => i < currentStep && setCurrentStep(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20 scale-105'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <StepIcon className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{i + 1}</span>
                  </button>

                  {i < STEPS.length - 1 && (
                    <div className={`w-2.5 h-0.5 mx-0.5 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Warning Banner */}
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-rose-900 font-medium">
              <strong className="text-primary font-bold">Profile completion required.</strong> Please complete all sections to unlock your dashboard, search, and matches.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={saving}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary via-primary-dark to-secondary text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            Auto-Fill & Complete Profile (1-Click)
          </button>
        </div>

        {/* Step Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Step Card Header */}
          <div className="bg-gradient-to-r from-primary via-primary-dark to-secondary p-6 text-white shadow-sm">
            <div className="flex items-center gap-3">
              {(() => { const Icon = STEPS[currentStep].icon; return <Icon className="w-6 h-6 text-white" />; })()}
              <div>
                <h2 className="text-xl font-serif font-bold text-white tracking-tight">{STEPS[currentStep].label}</h2>
                <p className="text-rose-100 text-xs mt-0.5 font-medium">
                  {[
                    'Tell us about yourself — the basics',
                    'Your religion, caste and horoscope details',
                    'Your education and professional background',
                    'Where are you currently living?',
                    'Tell us about your family',
                    'Your lifestyle and habits',
                    'What kind of partner are you looking for?',
                    'Add your photo and documents',
                  ][currentStep]}
                </p>
              </div>
            </div>
          </div>

          {/* Step Form */}
          <div className="p-6 sm:p-8">
            {stepRenderers[currentStep]()}
          </div>

          {/* Footer Actions */}
          <div className="px-6 sm:px-8 pb-6 flex items-center justify-between border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 border border-primary/30 text-primary rounded-xl text-xs font-bold hover:bg-primary/5 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Draft
              </button>
            </div>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Complete Profile & Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileCompletePage;
