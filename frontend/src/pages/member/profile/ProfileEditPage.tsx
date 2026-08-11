import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User, Heart, GraduationCap, Briefcase, Users, Star, Image as ImageIcon,
  Sliders, Lock, Save, CheckCircle2, ShieldCheck, ChevronRight, Upload, Phone, Mail, Loader2, ArrowRight, Sparkles, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { profilesApi } from '../../../services/profiles.service';
import { useAuthStore } from '../../../store/auth.store';
import { AiBiodataModal } from '../../../components/profile/AiBiodataModal';

const SECTIONS = [
  { id: 'basic', label: 'Basic Information', icon: User },
  { id: 'personal', label: 'Personal & Lifestyle', icon: Heart },
  { id: 'education', label: 'Education Details', icon: GraduationCap },
  { id: 'career', label: 'Career & Work', icon: Briefcase },
  { id: 'family', label: 'Family Background', icon: Users },
  { id: 'horoscope', label: 'Horoscope & Astro', icon: Star },
  { id: 'photos', label: 'Photos & Avatar', icon: ImageIcon },
  { id: 'preferences', label: 'Partner Preferences', icon: Sliders },
  { id: 'privacy', label: 'Privacy Settings', icon: Lock },
];

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

const CASTE_SUBCASTES: Record<string, string[]> = {
  'Nadar': ['Karukkuvattai', 'Maraimar', 'Nattathi', 'Kalla Nadar', 'General Nadar'],
  'Mudaliar': ['Arcot Mudaliar', 'Thondaimandalam', 'Sengunthar', 'Agamudayar', 'General Mudaliar'],
  'Chettiar': ['Nattukottai Chettiar', 'Devanga Chettiar', 'Elur Chettiar', 'Vaniyar Chettiar'],
  'Gounder': ['Kongu Vellala Gounder', 'Vettuva Gounder', 'Nattu Gounder'],
  'Pillai': ['Saiva Pillai', 'Karkathar Pillai', 'Seer Karuneegar', 'Sozhia Pillai'],
  'Vellalar': ['Kongu Vellalar', 'Thondaimandala Vellalar', 'Solia Vellalar'],
  'Iyengar': ['Vadakalai', 'Thenkalai'],
  'Iyer': ['Vadama', 'Brahacharanam', 'Ashtasahasram', 'Vathima'],
  'Thevar': ['Kallar', 'Maravar', 'Agamudayar'],
  'Vanniyar': ['Padayatchi', 'Gounder Vanniyar'],
  'Naidu': ['Kamma Naidu', 'Gavara Naidu', 'Balija Naidu'],
  'Reddy': ['Kamma Reddy', 'Desuru Reddy', 'Pokanati Reddy'],
};

const formatComplexion = (val?: string) => {
  if (!val) return '';
  const upper = val.toUpperCase().replace(/\s+/g, '_');
  if (upper === 'VERY_FAIR') return 'Very Fair';
  if (upper === 'FAIR') return 'Fair';
  if (upper === 'WHEATISH') return 'Wheatish';
  if (upper === 'DARK') return 'Dark';
  return val;
};

const formatDiet = (val?: string) => {
  if (!val) return '';
  const upper = val.toUpperCase().replace(/[\s_\-]/g, '');
  if (upper === 'VEG' || upper === 'VEGETARIAN') return 'Vegetarian';
  if (upper === 'NONVEG' || upper === 'NONVEGETARIAN') return 'Non-Vegetarian';
  if (upper === 'EGGETARIAN') return 'Eggetarian';
  if (upper === 'VEGAN') return 'Vegan';
  return val;
};

const ProfileEditPage = () => {
  const [activeSection, setActiveSection] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userPhotos, setUserPhotos] = useState<{ id?: string; url: string }[]>([]);
  const [targetPhotoIndex, setTargetPhotoIndex] = useState<number | null>(null);

  const handleApplyExtracted = (extracted: any) => {
    if (!extracted) return;
    const p = extracted.profile || {};
    const e = extracted.education || {};
    const c = extracted.career || {};
    const f = extracted.family || {};

    setFormData((prev) => ({
      ...prev,
      firstName: p.first_name || prev.firstName,
      lastName: p.last_name || prev.lastName,
      gender: p.gender || prev.gender,
      dateOfBirth: p.dob || prev.dateOfBirth,
      birthOrder: p.birth_order ? String(p.birth_order) : prev.birthOrder,
      maritalStatus: p.marital_status || prev.maritalStatus,
      motherTongue: p.mother_tongue || prev.motherTongue,
      religion: p.religion || prev.religion,
      community: p.caste || prev.community,
      subCaste: p.sub_caste || prev.subCaste,
      heightCm: p.height ? (p.height.match(/\d{3}/)?.[0] || prev.heightCm) : prev.heightCm,
      weight: p.weight ? (p.weight.match(/\d{2}/)?.[0] || prev.weight) : prev.weight,
      residentStatus: p.resident_status || prev.residentStatus,
      propertyDetails: p.property_details || prev.propertyDetails,
      educationDegree: e.highest_qualification || prev.educationDegree,
      college: e.college || prev.college,
      occupation: c.occupation || prev.occupation,
      company: c.company || prev.company,
      annualIncome: c.salary || prev.annualIncome,
      workLocation: c.work_location || prev.workLocation,
      fatherName: f.father_name || prev.fatherName,
      fatherOccupation: f.father_occupation || prev.fatherOccupation,
      motherName: f.mother_name || prev.motherName,
      motherOccupation: f.mother_occupation || prev.motherOccupation,
      nativePlace: f.native_place || prev.nativePlace,
      elderBrothers: f.elder_brothers !== undefined ? String(f.elder_brothers) : prev.elderBrothers,
      youngerBrothers: f.younger_brothers !== undefined ? String(f.younger_brothers) : prev.youngerBrothers,
      elderSisters: f.elder_sisters !== undefined ? String(f.elder_sisters) : prev.elderSisters,
      youngerSisters: f.younger_sisters !== undefined ? String(f.younger_sisters) : prev.youngerSisters,
      star: extracted.horoscope?.star || p.star || p.nakshatra || prev.star,
      starPadam: p.star_padam ? String(p.star_padam) : prev.starPadam,
      rasi: extracted.horoscope?.rasi || p.rasi || prev.rasi,
      lagnam: extracted.horoscope?.lagnam || p.lagnam || prev.lagnam,
      gothram: p.gothram || prev.gothram,
      kuladeivam: p.kuladeivam || prev.kuladeivam,
      dasaBalance: p.dasa_balance || prev.dasaBalance,
      timeOfBirth: p.birth_time || prev.timeOfBirth,
      placeOfBirth: p.birth_place || prev.placeOfBirth,
    }));
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    birthOrder: '',
    maritalStatus: '',
    motherTongue: '',
    religion: '',
    community: '',
    subCaste: '',
    about: '',
    heightCm: '',
    weight: '',
    complexion: '',
    diet: '',
    residentStatus: '',
    propertyDetails: '',
    educationDegree: '',
    college: '',
    occupation: '',
    company: '',
    annualIncome: '',
    workLocation: '',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    nativePlace: '',
    elderBrothers: '0',
    elderBrothersMarried: '0',
    youngerBrothers: '0',
    youngerBrothersMarried: '0',
    elderSisters: '0',
    elderSistersMarried: '0',
    youngerSisters: '0',
    youngerSistersMarried: '0',
    star: '',
    starPadam: '',
    rasi: '',
    lagnam: '',
    gothram: '',
    kuladeivam: '',
    dosham: '',
    dasaBalance: '',
    timeOfBirth: '',
    placeOfBirth: '',
    rasiChart: {} as Record<string, string>,
    amsamChart: {} as Record<string, string>,
    // Partner Preferences
    prefGender: '',
    prefAgeMin: '',
    prefAgeMax: '',
    prefHeightMin: '',
    prefHeightMax: '',
    prefMaritalStatus: '',
    prefReligion: '',
    prefCommunity: '',
    prefEducation: '',
    prefLocation: '',
    // Privacy Settings
    photoPrivacy: 'ALL',
    phonePrivacy: 'ACCEPTED',
    publicVisibility: true,
  });

  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const navState = location.state as { isOnboarding?: boolean; firstName?: string; lastName?: string };
  const isOnboarding = navState?.isOnboarding || false;

  // Load Profile from Live Backend API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profilesApi.getMyProfile();
        console.log('🔍 [S2S PROFILE API DATA LOADED]:', data);
        if (data) {
          const navFirstName = navState?.firstName;
          const navLastName = navState?.lastName;

          let firstName = data.firstName || user?.firstName || navFirstName || '';
          let lastName = data.lastName || user?.lastName || navLastName || '';
          let gender = data.gender || user?.gender || '';
          let dateOfBirth = data.dateOfBirth
            ? String(data.dateOfBirth).split('T')[0]
            : user?.dateOfBirth
              ? String(user.dateOfBirth).split('T')[0]
              : '';

          // Use actual data or user data
          if (!firstName) firstName = user?.firstName || '';
          if (!lastName) lastName = user?.lastName || '';
          if (!gender) gender = user?.gender || '';
          if (!dateOfBirth && user?.dateOfBirth) dateOfBirth = String(user.dateOfBirth).split('T')[0];

          const religionVal =
            (typeof data.religion === 'object' ? data.religion?.name : data.religion) ||
            (data as any).religionName ||
            'Hindu';
          const communityVal =
            (typeof data.community === 'object' ? data.community?.name : data.community) ||
            (typeof data.caste === 'object' ? data.caste?.name : data.caste) ||
            (data as any).communityName ||
            (data as any).casteName ||
            '';
          const subCasteVal =
            (typeof data.subCaste === 'object' ? data.subCaste?.name : data.subCaste) ||
            (data as any).subCasteName ||
            (data as any).subcaste ||
            '';

          let aboutPartnerObj: any = {};
          try {
            if (data.partnerPreference?.aboutPartner) {
              aboutPartnerObj = JSON.parse(data.partnerPreference.aboutPartner);
            }
          } catch { }

          setFormData((prev) => ({
            ...prev,
            firstName: firstName || '',
            lastName: lastName || '',
            email: data.user?.email || user?.email || '',
            phone: data.user?.phone || user?.phone || '',
            gender: gender || 'MALE',
            dateOfBirth: dateOfBirth || '',
            birthOrder: data.birthOrder ? String(data.birthOrder) : prev.birthOrder || '',
            maritalStatus: data.maritalStatus || prev.maritalStatus || 'NEVER_MARRIED',
            motherTongue: data.motherTongue || prev.motherTongue || 'Tamil',
            religion: religionVal || prev.religion || 'Hindu',
            community: communityVal || prev.community || '',
            subCaste: subCasteVal || prev.subCaste || '',
            about: data.about || prev.about || '',
            heightCm: data.heightCm ? String(data.heightCm) : prev.heightCm,
            weight: data.weight ? String(data.weight) : prev.weight,
            complexion: formatComplexion(data.complexion || prev.complexion || ''),
            diet: formatDiet(data.diet || prev.diet || ''),
            residentStatus: data.residentStatus || prev.residentStatus || '',
            propertyDetails: data.propertyDetails || prev.propertyDetails || '',
            educationDegree: data.education?.degree || (data as any).educationDegree || prev.educationDegree || '',
            college: data.education?.college || (data as any).college || prev.college || '',
            occupation: data.occupation?.designation || data.occupation?.title || (data as any).occupation || prev.occupation || '',
            company: data.occupation?.company || (data as any).company || prev.company || '',
            annualIncome: data.occupation?.salaryMin ? String(data.occupation.salaryMin) : (data.occupation?.annualIncome || (data as any).annualIncome || prev.annualIncome || ''),
            workLocation: data.occupation?.workingLocation || data.occupation?.workLocation || (data as any).workLocation || prev.workLocation || '',
            fatherName: data.family?.fatherName || (data as any).fatherName || prev.fatherName || '',
            fatherOccupation: data.family?.fatherOccupation || (data as any).fatherOccupation || prev.fatherOccupation || '',
            motherName: data.family?.motherName || (data as any).motherName || prev.motherName || '',
            motherOccupation: data.family?.motherOccupation || (data as any).motherOccupation || prev.motherOccupation || '',
            nativePlace: data.family?.nativePlace || (data as any).nativePlace || prev.nativePlace || '',
            elderBrothers: data.family?.elderBrothers !== undefined ? String(data.family.elderBrothers) : prev.elderBrothers,
            elderBrothersMarried: data.family?.elderBrothersMarried !== undefined ? String(data.family.elderBrothersMarried) : prev.elderBrothersMarried,
            youngerBrothers: data.family?.youngerBrothers !== undefined ? String(data.family.youngerBrothers) : prev.youngerBrothers,
            youngerBrothersMarried: data.family?.youngerBrothersMarried !== undefined ? String(data.family.youngerBrothersMarried) : prev.youngerBrothersMarried,
            elderSisters: data.family?.elderSisters !== undefined ? String(data.family.elderSisters) : prev.elderSisters,
            elderSistersMarried: data.family?.elderSistersMarried !== undefined ? String(data.family.elderSistersMarried) : prev.elderSistersMarried,
            youngerSisters: data.family?.youngerSisters !== undefined ? String(data.family.youngerSisters) : prev.youngerSisters,
            youngerSistersMarried: data.family?.youngerSistersMarried !== undefined ? String(data.family.youngerSistersMarried) : prev.youngerSistersMarried,
            star: data.horoscope?.star || (data as any).star || prev.star || '',
            starPadam: data.horoscope?.starPadam ? String(data.horoscope.starPadam) : prev.starPadam || '',
            rasi: data.horoscope?.rasi || (data as any).rasi || prev.rasi || '',
            lagnam: data.horoscope?.lagnam || (data as any).lagnam || prev.lagnam || '',
            gothram: data.horoscope?.gothram || (data as any).gothram || data.gothram || prev.gothram || '',
            kuladeivam: data.horoscope?.kuladeivam || (data as any).kuladeivam || prev.kuladeivam || '',
            dosham: data.horoscope?.dosham || (data as any).dosham || prev.dosham || '',
            dasaBalance: data.horoscope?.dasaBalance || prev.dasaBalance || '',
            timeOfBirth: data.horoscope?.birthTime || (data as any).birthTime || prev.timeOfBirth || '',
            placeOfBirth: data.horoscope?.birthPlace || (data as any).birthPlace || prev.placeOfBirth || '',
            // Partner Preferences from DB
            prefGender: data.partnerPreference?.gender || aboutPartnerObj.gender || (gender === 'MALE' ? 'FEMALE' : 'MALE'),
            prefAgeMin: data.partnerPreference?.ageMin ? String(data.partnerPreference.ageMin) : '21',
            prefAgeMax: data.partnerPreference?.ageMax ? String(data.partnerPreference.ageMax) : '30',
            prefHeightMin: data.partnerPreference?.heightMin ? String(data.partnerPreference.heightMin) : '155',
            prefHeightMax: data.partnerPreference?.heightMax ? String(data.partnerPreference.heightMax) : '178',
            prefMaritalStatus: data.partnerPreference?.maritalStatus?.[0] || 'Never Married',
            prefReligion: aboutPartnerObj.religion || 'Hindu',
            prefCommunity: aboutPartnerObj.community || '',
            prefEducation: aboutPartnerObj.education || '',
            prefLocation: aboutPartnerObj.location || '',
            // Privacy Settings from DB
            photoPrivacy: data.privacySetting?.whoCanViewProfile || 'ALL',
            phonePrivacy: data.privacySetting?.showPhone ? 'ACCEPTED' : 'PREMIUM',
            publicVisibility: data.privacySetting?.showLastActive ?? true,
          }));
          if (data.photos && data.photos.length > 0) {
            const cleanPhotos = data.photos
              .map((p: any) => (typeof p === 'string' ? { url: p } : { id: p.id, url: p.url }))
              .filter((p: any) => p.url && !p.url.includes('bride.jpg') && !p.url.includes('bride.png') && !p.url.includes('groom.png'));
            setUserPhotos(cleanPhotos);
          } else {
            setUserPhotos([]);
          }
        }
      } catch {
        setFormData((prev) => ({
          ...prev,
          firstName: prev.firstName || user?.firstName || navState?.firstName || '',
          lastName: prev.lastName || user?.lastName || navState?.lastName || '',
          gender: prev.gender || user?.gender || 'MALE',
          dateOfBirth: prev.dateOfBirth || (user?.dateOfBirth ? String(user.dateOfBirth).split('T')[0] : ''),
          email: user?.email || '',
          phone: user?.phone || '',
          maritalStatus: prev.maritalStatus || 'NEVER_MARRIED',
          motherTongue: prev.motherTongue || 'Tamil',
          religion: prev.religion || 'Hindu',
          community: prev.community || '',
          subCaste: prev.subCaste || '',
          about: prev.about || '',
          heightCm: prev.heightCm || '',
          weight: prev.weight || '',
          complexion: prev.complexion || '',
          diet: prev.diet || 'VEG',
          educationDegree: prev.educationDegree || '',
          college: prev.college || '',
          occupation: prev.occupation || '',
          company: prev.company || '',
          annualIncome: prev.annualIncome || '',
          workLocation: prev.workLocation || '',
          fatherName: prev.fatherName || '',
          fatherOccupation: prev.fatherOccupation || '',
          motherName: prev.motherName || '',
          motherOccupation: prev.motherOccupation || '',
          star: prev.star || '',
          rasi: prev.rasi || '',
          lagnam: prev.lagnam || '',
          gothram: prev.gothram || '',
        }));
        setUserPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePlanetInChart = (chartKey: 'rasiChart' | 'amsamChart', houseId: string, planet: string) => {
    setFormData((prev) => {
      const current = (prev[chartKey] as Record<string, string>)[houseId] || '';
      const planets = current ? current.split(' ') : [];
      const idx = planets.indexOf(planet);
      const updated = idx >= 0
        ? planets.filter((p) => p !== planet)
        : [...planets, planet];
      return {
        ...prev,
        [chartKey]: { ...(prev[chartKey] as Record<string, string>), [houseId]: updated.join(' ') },
      };
    });
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      const res = await profilesApi.uploadPhoto(compressedDataUrl, userPhotos.length === 0);
      const newPhotoObj = { id: res?.id, url: res?.url || compressedDataUrl };
      setUserPhotos((prev) => {
        const updated = [...prev];
        const targetIdx = targetPhotoIndex !== null ? targetPhotoIndex : updated.length;
        updated[targetIdx] = newPhotoObj;
        return updated;
      });
      toast.success('Photo uploaded & saved to database!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save photo to database.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setTargetPhotoIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetMainPhoto = (index: number) => {
    setUserPhotos((prev) => {
      const updated = [...prev];
      const [selected] = updated.splice(index, 1);
      return [selected, ...updated];
    });
    toast.success('Main profile photo updated!');
  };

  const handleRemovePhoto = async (index: number) => {
    const targetPhoto = userPhotos[index];
    if (targetPhoto) {
      const photoIdOrUrl = targetPhoto.id || targetPhoto.url;
      try {
        await profilesApi.deletePhoto(photoIdOrUrl);
      } catch (err: any) {
        console.error('Failed to delete photo from DB:', err);
      }
    }
    setUserPhotos((prev) => prev.filter((_, i) => i !== index));
    toast.success('Photo removed');
  };

  const saveProfileData = async () => {
    const payload = {
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      gender: formData.gender || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      birthOrder: formData.birthOrder ? Number(formData.birthOrder) : undefined,
      maritalStatus: formData.maritalStatus || undefined,
      motherTongue: formData.motherTongue || undefined,
      religion: formData.religion || undefined,
      community: formData.community || undefined,
      subCaste: formData.subCaste || undefined,
      about: formData.about || undefined,
      heightCm: formData.heightCm ? Number(formData.heightCm) : undefined,
      weight: formData.weight ? Number(formData.weight) : undefined,
      complexion: formData.complexion || undefined,
      diet: formData.diet || undefined,
      residentStatus: formData.residentStatus || undefined,
      propertyDetails: formData.propertyDetails || undefined,
      educationDegree: formData.educationDegree || undefined,
      college: formData.college || undefined,
      occupation: formData.occupation || undefined,
      company: formData.company || undefined,
      annualIncome: formData.annualIncome || undefined,
      workLocation: formData.workLocation || undefined,
      fatherName: formData.fatherName || undefined,
      fatherOccupation: formData.fatherOccupation || undefined,
      motherName: formData.motherName || undefined,
      motherOccupation: formData.motherOccupation || undefined,
      nativePlace: formData.nativePlace || undefined,
      elderBrothers: formData.elderBrothers !== undefined ? Number(formData.elderBrothers) : undefined,
      elderBrothersMarried: formData.elderBrothersMarried !== undefined ? Number(formData.elderBrothersMarried) : undefined,
      youngerBrothers: formData.youngerBrothers !== undefined ? Number(formData.youngerBrothers) : undefined,
      youngerBrothersMarried: formData.youngerBrothersMarried !== undefined ? Number(formData.youngerBrothersMarried) : undefined,
      elderSisters: formData.elderSisters !== undefined ? Number(formData.elderSisters) : undefined,
      elderSistersMarried: formData.elderSistersMarried !== undefined ? Number(formData.elderSistersMarried) : undefined,
      youngerSisters: formData.youngerSisters !== undefined ? Number(formData.youngerSisters) : undefined,
      youngerSistersMarried: formData.youngerSistersMarried !== undefined ? Number(formData.youngerSistersMarried) : undefined,
      star: formData.star || undefined,
      starPadam: formData.starPadam ? Number(formData.starPadam) : undefined,
      rasi: formData.rasi || undefined,
      lagnam: formData.lagnam || undefined,
      gothram: formData.gothram || undefined,
      kuladeivam: formData.kuladeivam || undefined,
      dosham: formData.dosham || undefined,
      dasaBalance: formData.dasaBalance || undefined,
      timeOfBirth: formData.timeOfBirth || undefined,
      placeOfBirth: formData.placeOfBirth || undefined,
      rasiChart: formData.rasiChart,
      amsamChart: formData.amsamChart,
      // Partner Preferences
      prefGender: formData.prefGender || undefined,
      prefAgeMin: formData.prefAgeMin || undefined,
      prefAgeMax: formData.prefAgeMax || undefined,
      prefHeightMin: formData.prefHeightMin || undefined,
      prefHeightMax: formData.prefHeightMax || undefined,
      prefMaritalStatus: formData.prefMaritalStatus || undefined,
      prefReligion: formData.prefReligion || undefined,
      prefCommunity: formData.prefCommunity || undefined,
      prefEducation: formData.prefEducation || undefined,
      prefLocation: formData.prefLocation || undefined,
      // Privacy Settings
      photoPrivacy: formData.photoPrivacy || undefined,
      phonePrivacy: formData.phonePrivacy || undefined,
      publicVisibility: formData.publicVisibility,
    };
    console.log('💾 [S2S PROFILE UPDATE PAYLOAD]:', payload);
    await profilesApi.updateMyProfile(payload);
  };

  const validateMandatoryFields = () => {
    const missing: { name: string; section: string }[] = [];

    if (!formData.firstName.trim()) missing.push({ name: 'First Name', section: 'basic' });
    if (!formData.dateOfBirth.trim()) missing.push({ name: 'Date of Birth', section: 'basic' });
    if (!formData.maritalStatus.trim()) missing.push({ name: 'Marital Status', section: 'basic' });
    if (!formData.motherTongue.trim()) missing.push({ name: 'Mother Tongue', section: 'basic' });
    if (!formData.religion.trim()) missing.push({ name: 'Religion', section: 'basic' });
    if (!formData.community.trim()) missing.push({ name: 'Community / Caste', section: 'basic' });
    if (!formData.about.trim()) missing.push({ name: 'About Me', section: 'basic' });
    if (!formData.heightCm.trim()) missing.push({ name: 'Height (cm)', section: 'personal' });

    return missing;
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await saveProfileData();
      toast.success('Profile draft updated successfully!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndGoToDashboard = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    const missing = validateMandatoryFields();
    if (missing.length > 0) {
      const missingNames = missing.map((m) => m.name).join(', ');
      toast.error(`Please fill out mandatory fields: ${missingNames}`, {
        duration: 5000,
      });
      // Switch section tab to the first missing field's section so user sees it immediately
      setActiveSection(missing[0].section);
      return; // STOP! DO NOT RELOAD, DO NOT NAVIGATE
    }

    setSaving(true);
    try {
      await saveProfileData();
      toast.success('Profile details saved! Welcome to your dashboard.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile.';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  const calculateCompletionPercent = () => {
    const fieldsToTrack = [
      formData.firstName,
      formData.lastName,
      formData.dateOfBirth,
      formData.maritalStatus,
      formData.motherTongue,
      formData.religion,
      formData.community,
      formData.subCaste,
      formData.about,
      formData.heightCm,
      formData.weight,
      formData.complexion,
      formData.diet,
      formData.educationDegree,
      formData.college,
      formData.occupation,
      formData.company,
      formData.annualIncome,
      formData.fatherName,
      formData.motherName,
      formData.star,
      formData.rasi,
      userPhotos.length > 0 ? 'photo' : 'photo',
    ];

    const filledCount = fieldsToTrack.filter((val) => Boolean(val && String(val).trim().length > 0)).length;
    const computed = Math.round((filledCount / fieldsToTrack.length) * 100);
    return Math.max(0, Math.min(100, computed));
  };

  const completionPercent = calculateCompletionPercent();

  const communityOptions = Array.from(
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
      'Viswakarma',
      'Sengunthar',
      'Yadav',
      'Devendra Kula Vellalar',
      'Adidravidar',
      'Other',
      formData.community,
    ].filter(Boolean))
  );

  const matchedSubCastes = CASTE_SUBCASTES[formData.community] ||
    Object.entries(CASTE_SUBCASTES).find(([k]) => formData.community && formData.community.toLowerCase().includes(k.toLowerCase()))?.[1] ||
    [];

  const currentSubCastes = Array.from(
    new Set([...matchedSubCastes, 'General', 'Other', formData.subCaste].filter(Boolean))
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-fade-in">
      {/* Desktop Side Menu */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <div className="card p-2 sticky top-4 space-y-1 bg-white border border-slate-200 shadow-sm">
          <p className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Profile Sections</p>
          {SECTIONS.map((s) => {
            const IconComp = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                    ? 'bg-gradient-primary text-white shadow-md'
                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-100'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComp className="w-4 h-4 flex-shrink-0" />
                  <span>{s.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${isActive ? 'opacity-100' : ''}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Section Selector */}
      <div className="md:hidden w-full mb-2">
        <select
          className="input text-xs border-slate-200 text-text-primary w-full"
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value)}
        >
          {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Onboarding Welcome Banner */}
        {isOnboarding && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white shadow-lg space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>Step 2 of 2: Fill Your Important Profile Details</span>
            </div>
            <p className="text-xs text-rose-50">
              Please complete your 50 key profile details below (Basic Info, Personal & Lifestyle, Religion/Caste, Education, Career, Family & Horoscope). Once completed, click <strong>"Complete Profile & Go to Dashboard"</strong> to unlock your matches!
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 card bg-white border border-slate-200 shadow-sm">
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              {isOnboarding ? 'Complete Your Profile' : 'Edit Profile'}
            </h1>
            <p className="text-text-secondary text-xs mt-0.5 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Updating: {SECTIONS.find(s => s.id === activeSection)?.label}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/profile/biodata-form')}
              className="btn bg-rose-900 hover:bg-rose-950 text-white btn-sm flex items-center gap-1.5 shadow-md font-bold"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>📄 Traditional Biodata Form</span>
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-secondary btn-sm flex items-center gap-1.5 border border-slate-200 shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button onClick={handleSaveAndGoToDashboard} disabled={saving} className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md">
              <span>Save & Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Profile Completion Bar */}
        <div className="card p-4 border border-gold/30 bg-amber-50/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" /> Profile Completion Strength
            </span>
            <span className="text-amber-700 font-extrabold text-sm">{completionPercent}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completionPercent < 40
                  ? 'bg-rose-500'
                  : completionPercent < 75
                    ? 'bg-amber-500'
                    : 'bg-gradient-gold'
                }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="text-text-muted text-xs mt-2">
            {completionPercent < 80
              ? `Fill in your details above (${completionPercent}% completed). Complete profiles get 3x more match responses!`
              : '🎉 Excellent! Your profile is strong and ready for matching!'}
          </p>
        </div>

        {/* Basic Info */}
        {activeSection === 'basic' && (
          <div className="card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
            <h2 className="text-text-primary font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Basic Personal Details</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Account Details Pre-filled</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label flex items-center justify-between">
                  <span>First Name</span>
                  {formData.firstName ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-semibold">Required</span>
                  )}
                </label>
                <input className="input border-slate-200 text-text-primary w-full font-medium" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Enter your first name" />
              </div>
              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Last Name</span>
                  {formData.lastName ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Surname</span>
                  )}
                </label>
                <input className="input border-slate-200 text-text-primary w-full font-medium" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Enter your last name" />
              </div>

              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Registered
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    readOnly
                    className="input border-slate-200 text-slate-600 bg-slate-100/70 w-full pl-9 font-medium cursor-not-allowed"
                    value={formData.email || user?.email || ''}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Phone Number</span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    readOnly
                    className="input border-slate-200 text-slate-600 bg-slate-100/70 w-full pl-9 font-medium cursor-not-allowed"
                    value={formData.phone || user?.phone || ''}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Birth Order (குழந்தை எண்)</span>
                  <span className="text-[10px] text-slate-400">1st, 2nd, 3rd child</span>
                </label>
                <select className="input border-slate-200 text-text-primary w-full" value={formData.birthOrder} onChange={(e) => handleChange('birthOrder', e.target.value)}>
                  <option value="">-- Select Birth Order --</option>
                  <option value="1">1st Child (முதல் குழந்தை)</option>
                  <option value="2">2nd Child (இரண்டாம் குழந்தை)</option>
                  <option value="3">3rd Child (மூன்றாம் குழந்தை)</option>
                  <option value="4">4th Child</option>
                  <option value="5">5th Child or Later</option>
                </select>
              </div>

              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Gender <span className="text-rose-500 font-bold">*</span></span>
                  {formData.gender ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-semibold">Required</span>
                  )}
                </label>
                <select className="input border-slate-200 text-text-primary w-full font-medium" value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                  <option value="">-- Select Gender --</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Date of Birth <span className="text-rose-500 font-bold">*</span></span>
                  {formData.dateOfBirth ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-semibold">Required</span>
                  )}
                </label>
                <input type="date" className="input border-slate-200 text-text-primary w-full" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
              </div>

              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Marital Status <span className="text-rose-500 font-bold">*</span></span>
                  {formData.maritalStatus ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-semibold">Required</span>
                  )}
                </label>
                <select className="input border-slate-200 text-text-primary w-full" value={formData.maritalStatus} onChange={(e) => handleChange('maritalStatus', e.target.value)}>
                  <option value="">-- Select Marital Status --</option>
                  <option value="NEVER_MARRIED">Never Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                  <option value="SEPARATED">Separated</option>
                </select>
              </div>

              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Mother Tongue <span className="text-rose-500 font-bold">*</span></span>
                  {formData.motherTongue ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-semibold">Required</span>
                  )}
                </label>
                <select className="input border-slate-200 text-text-primary w-full" value={formData.motherTongue} onChange={(e) => handleChange('motherTongue', e.target.value)}>
                  <option value="">-- Select Mother Tongue --</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Religion <span className="text-rose-500 font-bold">*</span></span>
                  {formData.religion ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-semibold">Required</span>
                  )}
                </label>
                <select className="input border-slate-200 text-text-primary w-full" value={formData.religion} onChange={(e) => handleChange('religion', e.target.value)}>
                  <option value="">-- Select Religion --</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Jain">Jain</option>
                  <option value="Sikh">Sikh</option>
                </select>
              </div>

              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Community / Caste <span className="text-rose-500 font-bold">*</span></span>
                  {formData.community ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-semibold">Required</span>
                  )}
                </label>
                <select className="input border-slate-200 text-text-primary w-full" value={formData.community} onChange={(e) => handleChange('community', e.target.value)}>
                  <option value="">-- Select Community / Caste --</option>
                  {communityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Sub Caste</span>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </label>
                <select className="input border-slate-200 text-text-primary w-full" value={formData.subCaste} onChange={(e) => handleChange('subCaste', e.target.value)}>
                  <option value="">-- Select Sub Caste --</option>
                  {currentSubCastes.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="input-label flex items-center justify-between">
                <span>About Me <span className="text-rose-500 font-bold">*</span></span>
                {formData.about ? (
                  <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                ) : (
                  <span className="text-[10px] text-rose-500 font-semibold">Required</span>
                )}
              </label>
              <textarea placeholder="Write a few lines about your personality, hobbies, family values, and what you are looking for..." className="input border-slate-200 text-text-primary w-full h-24" value={formData.about} onChange={(e) => handleChange('about', e.target.value)} />
            </div>
          </div>
        )}

        {/* Personal & Lifestyle */}
        {activeSection === 'personal' && (
          <div className="card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
            <h2 className="text-text-primary font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Physical Attributes & Lifestyle</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Height (cm) <span className="text-rose-500 font-bold">*</span></span>
                  {formData.heightCm ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-semibold">Required</span>
                  )}
                </label>
                <input type="number" placeholder="e.g. 165" className="input border-slate-200 text-text-primary w-full font-medium" value={formData.heightCm} onChange={(e) => handleChange('heightCm', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Weight (kg)</label>
                <input type="number" placeholder="e.g. 60" className="input border-slate-200 text-text-primary w-full" value={formData.weight} onChange={(e) => handleChange('weight', e.target.value)} />
              </div>
              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Complexion</span>
                  {formData.complexion ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : null}
                </label>
                <select className="input border-slate-200 text-text-primary w-full font-medium" value={formData.complexion} onChange={(e) => handleChange('complexion', e.target.value)}>
                  <option value="">-- Select Complexion --</option>
                  <option value="Fair">Fair</option>
                  <option value="Very Fair">Very Fair</option>
                  <option value="Wheatish">Wheatish</option>
                  <option value="Dark">Dark</option>
                  {formData.complexion && !['Fair', 'Very Fair', 'Wheatish', 'Dark'].includes(formData.complexion) && (
                    <option value={formData.complexion}>{formData.complexion}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Diet</span>
                  {formData.diet ? (
                    <span className="text-[10px] text-emerald-600 font-semibold">✓ Provided</span>
                  ) : null}
                </label>
                <select className="input border-slate-200 text-text-primary w-full font-medium" value={formData.diet} onChange={(e) => handleChange('diet', e.target.value)}>
                  <option value="">-- Select Diet --</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Vegan">Vegan</option>
                  {formData.diet && !['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'].includes(formData.diet) && (
                    <option value={formData.diet}>{formData.diet}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="input-label flex items-center justify-between">
                  <span>Resident Status (வீட்டு வகை)</span>
                </label>
                <select className="input border-slate-200 text-text-primary w-full font-medium" value={formData.residentStatus} onChange={(e) => handleChange('residentStatus', e.target.value)}>
                  <option value="">-- Select Resident Type --</option>
                  <option value="Own House">Own House (சொந்த வீடு)</option>
                  <option value="Rent House">Rent House (வாடகை வீடு)</option>
                  <option value="Lease">Lease (ஒத்தி / லீஸ்)</option>
                  <option value="Quarters">Quarters (குவாட்டர்ஸ்)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="input-label">Property Details (சொத்து விவரங்கள்)</label>
                <input placeholder="e.g. 2 PLOTS, CHENNAI / Individual House" className="input border-slate-200 text-text-primary w-full" value={formData.propertyDetails} onChange={(e) => handleChange('propertyDetails', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Education */}
        {activeSection === 'education' && (
          <div className="card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
            <h2 className="text-text-primary font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Education Background</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Highest Degree</label>
                <input className="input border-slate-200 text-text-primary w-full" value={formData.educationDegree} onChange={(e) => handleChange('educationDegree', e.target.value)} />
              </div>
              <div>
                <label className="input-label">College / University</label>
                <input className="input border-slate-200 text-text-primary w-full" value={formData.college} onChange={(e) => handleChange('college', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Career & Work */}
        {activeSection === 'career' && (
          <div className="card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
            <h2 className="text-text-primary font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Professional Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Occupation</label>
                <input className="input border-slate-200 text-text-primary w-full" value={formData.occupation} onChange={(e) => handleChange('occupation', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Company Name</label>
                <input className="input border-slate-200 text-text-primary w-full" value={formData.company} onChange={(e) => handleChange('company', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Annual Salary Range</label>
                <input className="input border-slate-200 text-text-primary w-full" value={formData.annualIncome} onChange={(e) => handleChange('annualIncome', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Work Location</label>
                <input className="input border-slate-200 text-text-primary w-full" value={formData.workLocation} onChange={(e) => handleChange('workLocation', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Family */}
        {activeSection === 'family' && (
          <div className="card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
            <h2 className="text-text-primary font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Family Background & Siblings</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="input-label">Father's Name</label><input className="input border-slate-200 text-text-primary w-full" value={formData.fatherName} onChange={(e) => handleChange('fatherName', e.target.value)} /></div>
              <div><label className="input-label">Father's Occupation</label><input className="input border-slate-200 text-text-primary w-full" value={formData.fatherOccupation} onChange={(e) => handleChange('fatherOccupation', e.target.value)} /></div>
              <div><label className="input-label">Mother's Name</label><input className="input border-slate-200 text-text-primary w-full" value={formData.motherName} onChange={(e) => handleChange('motherName', e.target.value)} /></div>
              <div><label className="input-label">Mother's Occupation</label><input className="input border-slate-200 text-text-primary w-full" value={formData.motherOccupation} onChange={(e) => handleChange('motherOccupation', e.target.value)} /></div>
              <div><label className="input-label">Native Place (சொந்த ஊர்)</label><input className="input border-slate-200 text-text-primary w-full" value={formData.nativePlace} onChange={(e) => handleChange('nativePlace', e.target.value)} placeholder="e.g. Chennai, Madurai" /></div>

              {/* Sibling Detailed Breakdown — ± Stepper Pattern */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Siblings Detail (சகோதர / சகோதரி விவரம்)</p>

                {/* Brothers Row */}
                <div className="mb-3">
                  <p className="text-[11px] font-bold text-rose-900 uppercase tracking-widest mb-2">Brothers (சகோதரன்)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: 'மூத்த சகோதரன் (Elder Brother)', field: 'elderBrothers' },
                      { label: 'மணமான மூத்த சகோதரன் (Married Elder)', field: 'elderBrothersMarried' },
                      { label: 'தம்பி (Younger Brother)', field: 'youngerBrothers' },
                      { label: 'மணமான தம்பி (Married Younger)', field: 'youngerBrothersMarried' },
                    ] as const).map(({ label, field }) => (
                      <div key={field} className="bg-rose-50 rounded-xl border border-rose-100 p-3 flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-600 leading-tight">{label}</span>
                        <div className="flex items-center gap-2 mt-auto">
                          <button type="button" onClick={() => handleChange(field, String(Math.max(0, Number(formData[field]) - 1)))}
                            className="w-8 h-8 rounded-lg bg-rose-900 text-white font-bold text-base flex items-center justify-center hover:bg-rose-800 transition">−</button>
                          <span className="flex-1 text-center text-lg font-black text-rose-900">{formData[field] ?? 0}</span>
                          <button type="button" onClick={() => handleChange(field, String(Number(formData[field]) + 1))}
                            className="w-8 h-8 rounded-lg bg-rose-900 text-white font-bold text-base flex items-center justify-center hover:bg-rose-800 transition">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sisters Row */}
                <div>
                  <p className="text-[11px] font-bold text-rose-900 uppercase tracking-widest mb-2">Sisters (சகோதரி)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { label: 'அக்கா (Elder Sister)', field: 'elderSisters' },
                      { label: 'மணமான அக்கா (Married Elder)', field: 'elderSistersMarried' },
                      { label: 'தங்கை (Younger Sister)', field: 'youngerSisters' },
                      { label: 'மணமான தங்கை (Married Younger)', field: 'youngerSistersMarried' },
                    ] as const).map(({ label, field }) => (
                      <div key={field} className="bg-pink-50 rounded-xl border border-pink-100 p-3 flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-600 leading-tight">{label}</span>
                        <div className="flex items-center gap-2 mt-auto">
                          <button type="button" onClick={() => handleChange(field, String(Math.max(0, Number(formData[field]) - 1)))}
                            className="w-8 h-8 rounded-lg bg-rose-900 text-white font-bold text-base flex items-center justify-center hover:bg-rose-800 transition">−</button>
                          <span className="flex-1 text-center text-lg font-black text-rose-900">{formData[field] ?? 0}</span>
                          <button type="button" onClick={() => handleChange(field, String(Number(formData[field]) + 1))}
                            className="w-8 h-8 rounded-lg bg-rose-900 text-white font-bold text-base flex items-center justify-center hover:bg-rose-800 transition">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Horoscope */}
        {activeSection === 'horoscope' && (
          <div className="card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
            <h2 className="text-text-primary font-bold text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Horoscope & Astro Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="input-label">Star (Nakshatra / நட்சத்திரம்)</label><input className="input border-slate-200 text-text-primary w-full" value={formData.star} onChange={(e) => handleChange('star', e.target.value)} /></div>
              <div>
                <label className="input-label">Star Padham (பாதம்)</label>
                <select className="input border-slate-200 text-text-primary w-full" value={formData.starPadam} onChange={(e) => handleChange('starPadam', e.target.value)}>
                  <option value="">-- Select Padham --</option>
                  <option value="1">1st Padham (1-ஆம் பாதம்)</option>
                  <option value="2">2nd Padham (2-ஆம் பாதம்)</option>
                  <option value="3">3rd Padham (3-ஆம் பாதம்)</option>
                  <option value="4">4th Padham (4-ஆம் பாதம்)</option>
                </select>
              </div>
              <div><label className="input-label">Rasi (Moon Sign / ராசி)</label><input className="input border-slate-200 text-text-primary w-full" value={formData.rasi} onChange={(e) => handleChange('rasi', e.target.value)} /></div>
              <div><label className="input-label">Lagnam (லக்னம்)</label><input className="input border-slate-200 text-text-primary w-full" value={formData.lagnam} onChange={(e) => handleChange('lagnam', e.target.value)} /></div>
              <div><label className="input-label">Gothram (கோத்ரம்)</label><input className="input border-slate-200 text-text-primary w-full" value={formData.gothram} onChange={(e) => handleChange('gothram', e.target.value)} /></div>
              <div><label className="input-label">Kuladeivam (குலதெய்வம்)</label><input className="input border-slate-200 text-text-primary w-full" value={formData.kuladeivam} onChange={(e) => handleChange('kuladeivam', e.target.value)} placeholder="e.g. Angalamman, Perumal" /></div>
              <div><label className="input-label">Time of Birth (பிறந்த நேரம்)</label><input type="time" className="input border-slate-200 text-text-primary w-full" value={formData.timeOfBirth} onChange={(e) => handleChange('timeOfBirth', e.target.value)} /></div>
              <div><label className="input-label">Place of Birth (பிறந்த இடம்)</label><input className="input border-slate-200 text-text-primary w-full" value={formData.placeOfBirth} onChange={(e) => handleChange('placeOfBirth', e.target.value)} placeholder="e.g. Chennai" /></div>
              <div><label className="input-label">Dosham (தோஷம்)</label><input className="input border-slate-200 text-text-primary w-full" value={formData.dosham} onChange={(e) => handleChange('dosham', e.target.value)} placeholder="e.g. No Dosham / Chevvai / Rahu Ketu" /></div>
              <div className="sm:col-span-2">
                <label className="input-label">Dasa Balance / Dasa Irupu (தசா இருப்பு)</label>
                <input className="input border-slate-200 text-text-primary w-full" value={formData.dasaBalance} onChange={(e) => handleChange('dasaBalance', e.target.value)} placeholder="e.g. Guru, Year-10, Month-3, Day-14" />
              </div>
            </div>

            {/* Interactive Rasi & Navamsam Chart Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* RASI CHART */}
              <div className="border-2 border-rose-900 rounded-lg overflow-hidden">
                <div className="bg-rose-900 text-white font-bold text-xs uppercase px-3 py-1.5 flex items-center justify-between">
                  <span>RASI CHART (ராசி கட்டம்)</span>
                  <span className="text-[10px] text-amber-200">Click box to add/remove planets</span>
                </div>
                <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-rose-900 p-0.5 aspect-square text-[10px]">
                  {HOUSES.map((h) => {
                    const planetsStr = (formData.rasiChart as Record<string, string>)[h.id] || '';
                    return (
                      <div
                        key={h.id}
                        style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                        className="bg-rose-50/90 hover:bg-amber-100 p-1.5 flex flex-col justify-between cursor-pointer border border-rose-200 min-h-[60px] transition"
                      >
                        <div className="font-bold text-rose-950 text-[9px]">{h.tamil}</div>
                        <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[10px]">
                          {planetsStr || <span className="text-slate-300 text-[8px] font-normal">+ add</span>}
                        </div>
                        <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                          {PLANETS.map((p) => {
                            const active = planetsStr.includes(p);
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); togglePlanetInChart('rasiChart', h.id, p); }}
                                className={`px-1 rounded text-[7px] font-bold ${active ? 'bg-rose-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                              >{p}</button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex items-center justify-center font-extrabold text-rose-900 text-base border-2 border-rose-900">RASI</div>
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
                    const planetsStr = (formData.amsamChart as Record<string, string>)[h.id] || '';
                    return (
                      <div
                        key={h.id}
                        style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                        className="bg-rose-50/90 hover:bg-amber-100 p-1.5 flex flex-col justify-between cursor-pointer border border-rose-200 min-h-[60px] transition"
                      >
                        <div className="font-bold text-rose-950 text-[9px]">{h.tamil}</div>
                        <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[10px]">
                          {planetsStr || <span className="text-slate-300 text-[8px] font-normal">+ add</span>}
                        </div>
                        <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                          {PLANETS.map((p) => {
                            const active = planetsStr.includes(p);
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); togglePlanetInChart('amsamChart', h.id, p); }}
                                className={`px-1 rounded text-[7px] font-bold ${active ? 'bg-rose-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                              >{p}</button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex items-center justify-center font-extrabold text-rose-900 text-base border-2 border-rose-900">NAVAMSAM</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photos & Gallery */}
        {activeSection === 'photos' && (
          <div className="card p-6 space-y-4 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-text-primary font-semibold text-sm uppercase tracking-wider">Photos & Avatar Gallery</h2>
                <p className="text-text-secondary text-xs mt-0.5">Upload up to 6 high quality photos. Profiles with photos get 10x more responses!</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md"
              >
                <Upload className="w-4 h-4" /> Upload New Photo
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              {Array.from({ length: 6 }).map((_, i) => {
                const photoObj = userPhotos[i];
                const photoUrl = photoObj?.url;
                const isMain = i === 0;

                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (!photoUrl) {
                        setTargetPhotoIndex(i);
                        fileInputRef.current?.click();
                      }
                    }}
                    className={`group relative aspect-square rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300 border ${photoUrl
                        ? 'border-slate-200 bg-slate-100 shadow-md'
                        : 'border-2 border-dashed border-slate-300 bg-slate-50 hover:border-primary/50 hover:bg-slate-100/80 cursor-pointer'
                      }`}
                  >
                    {photoUrl ? (
                      <>
                        <img
                          src={photoUrl}
                          alt={`Uploaded Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 text-white">
                          {!isMain && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetMainPhoto(i);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary text-white text-[10px] font-bold shadow hover:bg-primary-dark"
                            >
                              Make Main
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(i);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold shadow hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        {isMain && (
                          <div className="absolute top-2 left-2 bg-gradient-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                            Main Photo
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-text-primary text-xs font-bold block">+ Add Photo</span>
                        <span className="text-text-muted text-[10px]">JPG or PNG</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Partner Preferences */}
        {activeSection === 'preferences' && (
          <div className="card p-6 space-y-5 bg-white border border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-bold text-xs uppercase tracking-wider">Partner Preferences</h2>
              <p className="text-text-secondary text-xs mt-0.5">Set your desired partner expectations to get personalized match suggestions.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="input-label">Preferred Gender</label>
                <select
                  className="input border-slate-200 text-text-primary w-full font-medium"
                  value={formData.prefGender}
                  onChange={(e) => handleChange('prefGender', e.target.value)}
                >
                  <option value="">-- Select Preferred Gender --</option>
                  <option value="FEMALE">Bride (Female)</option>
                  <option value="MALE">Groom (Male)</option>
                  <option value="ANY">Any Gender</option>
                </select>
              </div>

              <div>
                <label className="input-label">Preferred Age Range (Years)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="input border-slate-200 text-text-primary w-full"
                    value={formData.prefAgeMin}
                    onChange={(e) => handleChange('prefAgeMin', e.target.value)}
                  />
                  <span className="text-text-muted text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="input border-slate-200 text-text-primary w-full"
                    value={formData.prefAgeMax}
                    onChange={(e) => handleChange('prefAgeMax', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Preferred Height Range (cm)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min (e.g. 155)"
                    className="input border-slate-200 text-text-primary w-full"
                    value={formData.prefHeightMin}
                    onChange={(e) => handleChange('prefHeightMin', e.target.value)}
                  />
                  <span className="text-text-muted text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max (e.g. 185)"
                    className="input border-slate-200 text-text-primary w-full"
                    value={formData.prefHeightMax}
                    onChange={(e) => handleChange('prefHeightMax', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Preferred Marital Status</label>
                <select
                  className="input border-slate-200 text-text-primary w-full"
                  value={formData.prefMaritalStatus}
                  onChange={(e) => handleChange('prefMaritalStatus', e.target.value)}
                >
                  <option value="NEVER_MARRIED">Never Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                  <option value="ANY">Any Status</option>
                </select>
              </div>

              <div>
                <label className="input-label">Preferred Religion</label>
                <select
                  className="input border-slate-200 text-text-primary w-full"
                  value={formData.prefReligion}
                  onChange={(e) => handleChange('prefReligion', e.target.value)}
                >
                  <option value="Hindu">Hindu</option>
                  <option value="Christian">Christian</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Jain">Jain</option>
                  <option value="Any">Any Religion</option>
                </select>
              </div>

              <div>
                <label className="input-label">Preferred Community / Caste</label>
                <select
                  className="input border-slate-200 text-text-primary w-full"
                  value={formData.prefCommunity}
                  onChange={(e) => handleChange('prefCommunity', e.target.value)}
                >
                  <option value="">-- Select Preferred Community / Caste --</option>
                  <option value="Any">Any Community / Caste</option>
                  {[
                    'Nadar','Mudaliar','Gounder','Pillai','Chettiar','Vanniyar','Thevar',
                    'Naidu','Iyer','Iyengar','Vellalar','Reddiyar','Yadav / Konar',
                    'Viswakarma','Sourashtra','Nair','Menon','Christian','Muslim',
                    'Devendra Kula Vellalar','Adidravidar','Arunthathiyar','Muthuraja','Naicker',
                    'Boyar / Uppara','Parkavakulam','Sengunthar','Kamma','Kapu',
                    'Ezhava / Thiyya','Brahmin - Other','Maratha / Kshatriya','Jain','Sikh',
                    'Weaver / Saliyar','Fisherfolk','Vannar / Dhobi','Maruthuvar',
                    'Kulalar / Potter','Badaga','Tribal','Lingayat','Inter-Caste','Other'
                  ].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Preferred Education</label>
                <select
                  className="input border-slate-200 text-text-primary w-full"
                  value={formData.prefEducation}
                  onChange={(e) => handleChange('prefEducation', e.target.value)}
                >
                  <option value="">-- Select Preferred Education --</option>
                  <option value="Any Education">Any Education</option>
                  <option value="B.E / B.Tech">B.E / B.Tech</option>
                  <option value="M.E / M.Tech">M.E / M.Tech</option>
                  <option value="B.Sc / M.Sc">B.Sc / M.Sc</option>
                  <option value="B.Com / M.Com">B.Com / M.Com</option>
                  <option value="BBA / MBA">BBA / MBA</option>
                  <option value="BCA / MCA">BCA / MCA</option>
                  <option value="MBBS / MD / Medical">MBBS / MD / Medical</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Graduate & Above">Graduate & Above</option>
                  <option value="Post Graduate & Above">Post Graduate & Above</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="input-label">Preferred Location / State</label>
                <select
                  className="input border-slate-200 text-text-primary w-full"
                  value={formData.prefLocation}
                  onChange={(e) => handleChange('prefLocation', e.target.value)}
                >
                  <option value="">-- Select Preferred Location --</option>
                  <option value="Any Location">Any Location</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Madurai">Madurai</option>
                  <option value="Salem">Salem</option>
                  <option value="Tiruchirappalli">Tiruchirappalli</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Andhra Pradesh / Telangana">Andhra Pradesh / Telangana</option>
                  <option value="Anywhere in India">Anywhere in India</option>
                  <option value="Abroad / Overseas">Abroad / Overseas</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        {activeSection === 'privacy' && (
          <div className="card p-6 space-y-6 bg-white border border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-bold text-xs uppercase tracking-wider">Privacy & Profile Protection Settings</h2>
              <p className="text-text-secondary text-xs mt-0.5">Control who can view your photo, phone number, and profile details.</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 gap-3">
                <div>
                  <h4 className="text-text-primary font-bold text-sm">Photo Visibility</h4>
                  <p className="text-text-muted text-xs">Choose who can view your uploaded profile photos.</p>
                </div>
                <select
                  className="input border-slate-200 text-text-primary text-xs py-1.5 px-3 bg-white w-full sm:w-auto"
                  value={formData.photoPrivacy}
                  onChange={(e) => handleChange('photoPrivacy', e.target.value)}
                >
                  <option value="ALL">Visible to All Registered Members</option>
                  <option value="PREMIUM">Visible to Premium Members Only</option>
                  <option value="REQUEST">Visible Only on Request Approval</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 gap-3">
                <div>
                  <h4 className="text-text-primary font-bold text-sm">Phone Number & Contact Info</h4>
                  <p className="text-text-muted text-xs">Control visibility of your phone number and email.</p>
                </div>
                <select
                  className="input border-slate-200 text-text-primary text-xs py-1.5 px-3 bg-white w-full sm:w-auto"
                  value={formData.phonePrivacy}
                  onChange={(e) => handleChange('phonePrivacy', e.target.value)}
                >
                  <option value="ACCEPTED">Only Members Whose Interest You Accepted</option>
                  <option value="PREMIUM">Premium Members Only</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <h4 className="text-text-primary font-bold text-sm">Public Profile Indexing</h4>
                  <p className="text-text-muted text-xs">Allow your profile to appear in verified search engine results.</p>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                  checked={formData.publicVisibility}
                  onChange={(e) => setFormData((prev) => ({ ...prev, publicVisibility: e.target.checked }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save & Continue to Dashboard Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 card bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-xl">
          <div>
            <h3 className="font-bold text-sm">Finished editing your details?</h3>
            <p className="text-xs text-slate-300 mt-0.5">Save your profile to activate match recommendations on your dashboard.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving} className="btn btn-ghost btn-sm text-white hover:bg-white/10">
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={handleSaveAndGoToDashboard} disabled={saving} className="btn btn-primary btn-md flex items-center gap-2 shadow-lg">
              <span>Save & Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      <AiBiodataModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyExtracted={handleApplyExtracted}
      />
    </div>
  );
};

export default ProfileEditPage;
