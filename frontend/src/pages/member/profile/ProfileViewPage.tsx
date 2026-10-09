import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth.store';
import { profilesApi } from '../../../services/profiles.service';
import { paymentsApi } from '../../../services/payments.service';
import { interestsApi } from '../../../services/interests.service';
import { MembershipBadge } from '../../../components/common/MembershipBadge';
import { 
  Heart, Send, Lock, Phone, Mail, ShieldCheck, Crown, Sparkles, 
  Share2, MoreVertical, MapPin, Briefcase, GraduationCap, Star, 
  CheckCircle2, Image as ImageIcon, Calendar, BookOpen, Users, 
  UserCheck, Award, ArrowUpRight, Edit, Loader2, User, Camera, Trash2, FileText, MessageSquare 
} from 'lucide-react';
import toast from 'react-hot-toast';

const TAMIL_NAMES_FEMALE = ['Kavitha Rajan', 'Priya Mudaliar', 'Meera Gounder', 'Divya Iyer', 'Saranya Udayar', 'Nithya Pillai', 'Anjali Iyengar', 'Revathi Chettiar', 'Padma Vellalar', 'Mala Pillai'];
const TAMIL_NAMES_MALE = ['Arjun Shankar', 'Suresh Pillai', 'Vikram Chettiar', 'Anand Thevar', 'Karthik Konar', 'Babu Devar', 'Senthil Nadar', 'Mani Mudaliar', 'Ganesh Gounder', 'Rajesh Thevar'];

interface Profile {
  id: string;
  name: string;
  age: number;
  gender: 'FEMALE' | 'MALE';
  height: number; // in cm
  city: string;
  education: string;
  occupation: string;
  community: string;
  matchScore: number;
  isVerified: boolean;
  isPremium: boolean;
  marital: string;
  religion: string;
  salary: string;
  country: string;
  state: string;
  hasPhoto: boolean;
  hasDosham: boolean;
  joinedDate: Date;
}

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

// Planet choices for 12-box chart grids (matching BiodataEntryPage)
const PLANETS = ['சூரி (Sun)', 'சந் (Moon)', 'செவ் (Mars)', 'புத (Merc)', 'குரு (Jup)', 'சுக் (Ven)', 'சனி (Sat)', 'ராகு (Rahu)', 'கேது (Ketu)', 'லக் (Lag)'];


const GENERATED_PROFILES: Profile[] = Array.from({ length: 40 }, (_, i) => {
  const isFemale = i % 2 === 0;
  const name = isFemale 
    ? TAMIL_NAMES_FEMALE[i % TAMIL_NAMES_FEMALE.length] 
    : TAMIL_NAMES_MALE[i % TAMIL_NAMES_MALE.length];

  return {
    id: `profile-${100 + i}`,
    name,
    age: 21 + (i % 15), // 21 to 35
    gender: isFemale ? 'FEMALE' : 'MALE',
    height: 150 + (i % 41), // 150 to 190 cm
    city: ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'][i % 5],
    education: ['B.E Computer Science', 'MBA', 'MBBS', 'B.Sc Mathematics', 'M.Tech'][i % 5],
    occupation: ['Software Engineer', 'Doctor', 'Teacher', 'Business Owner', 'Civil Engineer'][i % 5],
    community: ['Nadar', 'Mudaliar', 'Gounder', 'Pillai', 'Chettiar'][i % 5],
    matchScore: 65 + (i % 31), // 65% to 95%
    isVerified: i % 3 !== 0,
    isPremium: i % 4 === 0,
    marital: i % 6 === 0 ? 'Divorced' : 'Never Married',
    religion: 'Hindu',
    salary: ['3 LPA+', '5 LPA+', '8 LPA+', '12 LPA+'][i % 4],
    country: 'India',
    state: 'Tamil Nadu',
    hasPhoto: i % 5 !== 4, // 80% have photos
    hasDosham: i % 7 === 0, // 14% have dosham
    joinedDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // dynamic join dates
  };
});

const STARS = ['Rohini', 'Mirugashirisham', 'Thiruvadhirai', 'Punarpoosam', 'Poosam', 'Ayilyam', 'Magam', 'Pooram', 'Uthiram'];
const RASIS = ['Rishabam', 'Mithunam', 'Mithunam', 'Katagam', 'Katagam', 'Katagam', 'Simham', 'Simham', 'Kanni'];

const ProfileViewPage = () => {
  const { id } = useParams();
  const { user, isPremium, updateEntitlements } = useAuthStore();
  const isOwnProfile = !id || id === 'me' || id === 'edit';
  const [activeTab, setActiveTab] = useState<'about' | 'family' | 'education' | 'horoscope' | 'preferences'>('about');
  const [saved, setSaved] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleDeletePhoto = async (photoItem: { id?: string; url: string } | string) => {
    const photoId = typeof photoItem === 'object' ? photoItem.id : (!photoItem.startsWith('data:') && !photoItem.includes('/') ? photoItem : undefined);
    const photoUrl = typeof photoItem === 'object' ? photoItem.url : photoItem;
    try {
      await profilesApi.deletePhoto(photoId, photoUrl);
      const toRemove = [photoId, photoUrl].filter(Boolean) as string[];
      setRemovedPhotos((prev) => [...prev, ...toRemove]);
      toast.success('Photo removed successfully');
      setAvatarError(false);
      await refetchProfile();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove photo');
    }
  };

  const tabs = [
    { id: 'about', label: 'About & Basic' },
    { id: 'family', label: 'Family Details' },
    { id: 'education', label: 'Education & Career' },
    { id: 'horoscope', label: 'Horoscope & Dosha' },
    { id: 'preferences', label: 'Partner Preferences' },
  ] as const;

  // Fetch real profile from DB
  const { data: apiProfile, isLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['profile-view', id || 'me'],
    queryFn: () => (isOwnProfile ? profilesApi.getMyProfile() : profilesApi.getProfileById(id!)),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const handleDirectPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        try {
          await profilesApi.uploadPhoto(dataUrl, true);
          toast.success('Photo uploaded successfully! 🎉');
          setAvatarError(false);
          await refetchProfile();
        } catch {
          toast.error('Failed to upload photo.');
        } finally {
          setUploadingPhoto(false);
          if (photoInputRef.current) photoInputRef.current.value = '';
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Record a profile view once the target profile owner is known
  useEffect(() => {
    if (!isOwnProfile && apiProfile?.userId) {
      profilesApi.recordProfileView(apiProfile.userId).catch(() => null);
    }
  }, [isOwnProfile, apiProfile?.userId]);

  const { data: similarProfilesData } = useQuery({
    queryKey: ['similar-matches-db', id || 'me', user?.id],
    queryFn: async () => {
      const res = await profilesApi.searchProfiles({
        limit: 4,
        excludeUserId: user?.id,
        usePartnerPref: true,
      });
      const list = res.profiles || res.data || res || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const profile = useMemo(() => {
    const p = apiProfile || {};
    const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.displayName || (user?.email ? user.email.split('@')[0] : 'Member');
    const cityName = (typeof p.city === 'object' ? p.city?.name : p.city) || (p as any).place || '';
    const stateName = (typeof p.state === 'object' ? p.state?.name : p.state) || (p as any).state || '';
    const countryName = (typeof p.country === 'object' ? p.country?.name : p.country) || (p as any).country || 'India';
    const nativePlace = p.family?.nativePlace || (p as any).nativePlace || (p as any).family?.native_place || '';
    const workLocation = p.occupation?.workingLocation || p.workLocation || '';
    const birthPlace = p.horoscope?.birthPlace || (p as any).horoscopeData?.birthPlace || (p as any).birthPlace || (p as any).placeOfBirth || '';

    const resolvedPlace = cityName || workLocation || nativePlace || birthPlace || '';
    const resolvedNativePlace = nativePlace || birthPlace || '';
    const heroLocation = [
      resolvedPlace || 'Chennai',
      stateName || 'Tamil Nadu',
      countryName || 'India'
    ].filter(Boolean).join(', ');

    const cm = p.heightCm ?? 165;
    const inches = Math.round(cm / 2.54);
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;

    const dobFormatted = p.dateOfBirth
      ? new Date(p.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Not Specified';

    const religionName =
      (typeof p.religion === 'object' ? p.religion?.name : p.religion) || 'Hindu';
    const communityName =
      p.community?.name ?? (typeof p.community === 'string' ? p.community : (p.caste?.name ?? 'Community'));
    const subCasteName =
      p.subCaste?.name ?? (typeof p.subCaste === 'string' ? p.subCaste : '');

    const formatMarital = (val?: string) => {
      if (!val) return 'Not Specified';
      const clean = String(val).trim().toUpperCase().replace(/\s+/g, '_');
      if (clean === 'NEVER_MARRIED') return 'Never Married';
      if (clean === 'DIVORCED') return 'Divorced';
      if (clean === 'WIDOWED') return 'Widowed';
      if (clean === 'SEPARATED') return 'Separated';
      if (clean === 'ANY' || clean === 'ALL' || clean === 'ANY_STATUS') return 'Any Status';
      return val;
    };

    let prefObj: any = {};
    try {
      if (p.partnerPreference?.aboutPartner) {
        prefObj = JSON.parse(p.partnerPreference.aboutPartner);
      }
    } catch {}

    const prefAge = p.partnerPreference?.ageMin && p.partnerPreference?.ageMax
      ? `${p.partnerPreference.ageMin} - ${p.partnerPreference.ageMax} yrs`
      : 'Not Specified';
    const prefHeight = p.partnerPreference?.heightMin && p.partnerPreference?.heightMax
      ? `${p.partnerPreference.heightMin} - ${p.partnerPreference.heightMax} cm`
      : 'Not Specified';

    type PhotoItem = { id?: string; url: string; isMain?: boolean };
    const rawPhotos = p.photos && Array.isArray(p.photos) ? p.photos : [];
    const userPhotoObjects: PhotoItem[] = rawPhotos
      .map((pt: any, idx: number) => {
        if (typeof pt === 'string') {
          return { id: undefined, url: pt, isMain: idx === 0 };
        }
        return {
          id: pt.id,
          url: pt.url,
          isMain: Boolean(pt.isMain),
        };
      })
      .filter((pt: PhotoItem) => pt.url && !pt.url.includes('groom.png') && !pt.url.includes('bride.png'));

    if (userPhotoObjects.length === 0 && (p as any).photoUrl && !(p as any).photoUrl.includes('groom.png') && !(p as any).photoUrl.includes('bride.png')) {
      userPhotoObjects.push({
        id: undefined,
        url: (p as any).photoUrl,
        isMain: true,
      });
    }

    const visiblePhotos = userPhotoObjects.filter(
      (pt) => !removedPhotos.includes(pt.url) && (!pt.id || !removedPhotos.includes(pt.id))
    );
    const mainPhotoObj = visiblePhotos.find((pt) => pt.isMain) || visiblePhotos[0];
    const mainPhotoUrl = mainPhotoObj ? mainPhotoObj.url : null;

    const prefGender = p.partnerPreference?.gender === 'FEMALE'
      ? 'Bride (Female)'
      : p.partnerPreference?.gender === 'MALE'
      ? 'Groom (Male)'
      : prefObj.gender
      ? prefObj.gender
      : p.gender === 'MALE'
      ? 'Bride (Female)'
      : 'Groom (Male)';

    return {
      id: p.id || 'me',
      name,
      age: p.age ?? 25,
      gender: (p.gender || 'FEMALE') as 'FEMALE' | 'MALE',
      dateOfBirth: dobFormatted,
      height: `${feet}'${remainingInches}" (${cm} cm)`,
      place: resolvedPlace || 'Not Specified',
      city: cityName || resolvedPlace || 'Not Specified',
      state: stateName || 'Tamil Nadu',
      country: countryName || 'India',
      nativePlace: resolvedNativePlace || 'Not Specified',
      location: heroLocation,
      community: communityName,
      caste: communityName,
      subCaste: subCasteName,
      religion: religionName,
      education: p.education?.degree || p.educationDegree || (typeof p.education === 'string' ? p.education : '') || 'Not Specified',
      fieldOfStudy: p.education?.fieldOfStudy || p.education?.university || (p as any).educationDetail || '',
      college: (() => {
        const rawCol = p.education?.college || p.education?.university || (p as any).college || '';
        const rawField = p.education?.fieldOfStudy || (p as any).educationDetail || '';
        if (rawCol && rawField && rawCol.trim().toLowerCase() === rawField.trim().toLowerCase()) {
          return '';
        }
        return rawCol;
      })(),
      occupation: p.occupation?.designation || p.occupation?.title || (typeof p.occupation === 'string' ? p.occupation : '') || 'Not Specified',
      employedIn: (() => {
        const raw = p.occupation?.employmentType || (p as any).employedIn;
        if (!raw) return '';
        const clean = String(raw).toUpperCase().replace(/\s+/g, '_');
        switch (clean) {
          case 'PRIVATE': return 'Private Sector';
          case 'GOVERNMENT': return 'Government / PSU';
          case 'BUSINESS': return 'Self-Employed / Business';
          case 'DEFENSE': return 'Defense / Armed Forces';
          case 'NOT_WORKING': return 'Not Working';
          default: return raw;
        }
      })(),
      company: p.occupation?.company || p.company || 'Not Specified',
      salary: (() => {
        const min = p.occupation?.salaryMin;
        const max = p.occupation?.salaryMax;
        const INCOME_RANGES: Record<string, string> = {
          '300000': '₹2 Lakhs – ₹3 Lakhs',
          '500000': '₹3 Lakhs – ₹5 Lakhs',
          '800000': '₹5 Lakhs – ₹8 Lakhs',
          '1200000': '₹8 Lakhs – ₹12 Lakhs',
          '1800000': '₹12 Lakhs – ₹18 Lakhs',
          '2500000': '₹18 Lakhs – ₹25 Lakhs',
          '3500000': '₹25 Lakhs – ₹35 Lakhs',
          '5000000': 'Above ₹35 Lakhs',
        };
        if (min) {
          const strMin = String(min);
          if (INCOME_RANGES[strMin]) return INCOME_RANGES[strMin];
          if (min >= 100000) {
            const minLpa = (min / 100000).toFixed(min % 100000 === 0 ? 0 : 1);
            if (max && max > min) {
              const maxLpa = (max / 100000).toFixed(max % 100000 === 0 ? 0 : 1);
              return `₹${minLpa} - ${maxLpa} LPA`;
            }
            return `₹${minLpa} LPA`;
          }
          return `₹${min.toLocaleString('en-IN')}`;
        }
        const direct = p.occupation?.annualIncome || p.annualIncome || p.occupation?.salary;
        if (direct && typeof direct === 'string' && !['PRIVATE', 'GOVERNMENT', 'BUSINESS', 'DEFENSE', 'NOT_WORKING'].includes(direct.toUpperCase())) {
          return direct;
        }
        return 'Not Specified';
      })(),
      workLocation: p.occupation?.workingLocation || p.workLocation || (cityName ? `${cityName}, ${stateName || 'Tamil Nadu'}` : 'Not Specified'),
      fatherName: p.family?.fatherName || p.fatherName || 'Not Specified',
      fatherOccupation: p.family?.fatherOccupation || p.fatherOccupation || 'Not Specified',
      motherName: p.family?.motherName || p.motherName || 'Not Specified',
      motherOccupation: p.family?.motherOccupation || p.motherOccupation || 'Not Specified',
      marital: p.maritalStatus ? formatMarital(p.maritalStatus) : 'Never Married',
      motherTongue: p.motherTongue ?? 'Tamil',
      complexion: p.complexion ?? 'Fair',
      weight: p.weight ? `${p.weight} kg` : 'Not Specified',
      diet: p.diet ?? 'Vegetarian',
      residentStatus: p.residentStatus || 'Not Specified',
      propertyDetails: p.propertyDetails || 'Not Specified',
      assetValue: p.assetValue !== null && p.assetValue !== undefined ? Number(p.assetValue) : null,
      bankBalance: p.bankBalance !== null && p.bankBalance !== undefined ? Number(p.bankBalance) : null,
      netWorth: p.netWorth !== null && p.netWorth !== undefined ? Number(p.netWorth) : null,
      membershipCategory: p.membershipCategory || (p.isElite ? 'ELITE' : 'GENERAL'),
      isElite: Boolean(p.isElite || p.membershipCategory === 'ELITE'),
      isEliteQualified: Boolean(p.isEliteQualified || p.eliteStatus === 'ELITE_QUALIFIED'),
      eliteStatus: p.eliteStatus || (p.membershipCategory === 'ELITE' ? 'ELITE_NOT_QUALIFIED' : 'GENERAL'),
      about: p.about || `Welcome to ${name}'s profile page.`,
      isVerified: p.isVerified ?? false,
      membershipTier: (
        (isOwnProfile ? (user?.membershipTier || user?.membershipStatus || user?.entitlements?.tier) : null) ||
        p.membershipTier ||
        p.membership?.tier ||
        (p.isPremium ? 'GOLD' : 'FREE') ||
        'FREE'
      ).toUpperCase(),
      isPremiumProfile: Boolean(
        ((isOwnProfile ? (user?.membershipTier || user?.membershipStatus || user?.entitlements?.tier) : null) ||
        p.membershipTier ||
        p.membership?.tier ||
        (p.isPremium ? 'GOLD' : 'FREE') ||
        'FREE').toUpperCase() !== 'FREE'
      ),
      matchScore: p.matchScore ?? 85,
      profileCompletion: p.profileCompletionPercent ?? 75,
      star: p.horoscope?.star || p.star || 'Not Specified',
      rasi: p.horoscope?.rasi || p.rasi || 'Not Specified',
      lagnam: p.horoscope?.lagnam || p.lagnam || 'Not Specified',
      gothram: p.horoscope?.gothram || p.gothram || 'Not Specified',
      // Live Partner Preferences from DB
      prefGender,
      prefAge,
      prefHeight,
      prefMarital: formatMarital((p as any).prefMaritalStatus || p.partnerPreference?.maritalStatus?.[0] || prefObj.maritalStatus),
      prefReligion: prefObj.religion || p.partnerPreference?.religion || (p as any).prefReligion || 'Not Specified',
      prefCommunity: prefObj.community || prefObj.caste || p.partnerPreference?.community || p.partnerPreference?.caste || (p as any).prefCommunity || (p as any).prefCaste || 'Not Specified',
      prefLocation: prefObj.location || p.partnerPreference?.location || (p as any).prefLocation || 'Not Specified',
      dosham: (() => {
        const raw = p.horoscope?.dosham || p.dosham || (p as any)?.horoscopeData?.dosham;
        if (!raw) return 'No Dosham';
        const lower = String(raw).trim().toLowerCase();
        if (lower === 'no dosham' || lower === 'clean' || lower === 'none' || lower === 'no') return 'No Dosham';
        return String(raw).trim();
      })(),
      hasDosham: (() => {
        const raw = p.horoscope?.dosham || p.dosham || (p as any)?.horoscopeData?.dosham;
        if (!raw) return false;
        const lower = String(raw).trim().toLowerCase();
        if (lower === 'no dosham' || lower === 'clean' || lower === 'none' || lower === 'no') return false;
        return true;
      })(),
      photo: mainPhotoUrl,
      photosList: visiblePhotos,
      phone: p.user?.phone || p.phone || (p as any).userPhone || '',
      email: p.user?.email || p.email || (p as any).userEmail || '',
    };
  }, [apiProfile, user, removedPhotos]);

  const [unlockedState, setUnlockedState] = useState<{
    tier: string;
    planName?: string;
    contactLimit: number;
    usedCount: number;
    remaining: number;
    unlockedIds: string[];
  }>({
    tier: user?.membershipStatus || 'FREE',
    planName: user?.entitlements?.planName || 'Free Plan',
    contactLimit: user?.entitlements?.contacts?.max ?? 0,
    usedCount: user?.entitlements?.contacts?.used ?? 0,
    remaining: user?.entitlements?.contacts?.remaining ?? 0,
    unlockedIds: user?.entitlements?.contacts?.unlockedIds ?? [],
  });

  const [unlockingContact, setUnlockingContact] = useState(false);

  useEffect(() => {
    paymentsApi.getUnlockedContacts().then((data) => {
      if (data) {
        setUnlockedState(data);
        if (data.entitlements) {
          updateEntitlements(data.entitlements);
        }
      }
    }).catch(() => null);
  }, [updateEntitlements]);

  const isContactUnlocked = useMemo(() => {
    if (!profile) return false;
    const targetUserId = apiProfile?.userId || (apiProfile as any)?.user?.id || profile.id;
    return unlockedState.unlockedIds.includes(profile.id) || unlockedState.unlockedIds.includes(targetUserId);
  }, [unlockedState, profile, apiProfile]);

  const handleUnlockContact = async () => {
    if (!profile) return;
    setUnlockingContact(true);
    try {
      const targetUserId = apiProfile?.userId || (apiProfile as any)?.user?.id || profile.id;
      const res = await paymentsApi.unlockContact(targetUserId);
      setUnlockedState({
        tier: res.tier,
        contactLimit: res.contactLimit,
        usedCount: res.usedCount,
        remaining: res.remaining,
        unlockedIds: res.unlockedIds || [],
      });
      if (res.alreadyUnlocked) {
        toast.success(`Contact details already unlocked!`);
      } else {
        const remText = res.remaining >= 9999 ? 'Unlimited' : `${res.remaining} views remaining`;
        toast.success(`Contact unlocked! (${remText} in your ${res.tier} plan) 🎉`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Contact limit reached for your active plan. Upgrade to unlock more contacts!');
    } finally {
      setUnlockingContact(false);
    }
  };

  const handleSendInterest = async () => {
    const targetUserId = apiProfile?.userId || (apiProfile as any)?.user?.id || apiProfile?.id;
    if (!targetUserId) {
      toast.error('Unable to locate member user ID.');
      return;
    }
    try {
      await interestsApi.sendInterest(
        targetUserId,
        `Hi ${profile.name}, I am interested in connecting with your profile!`
      );
      setInterestSent(true);
      toast.success(`Interest sent successfully to ${profile.name}! 💌`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to send interest';
      toast.error(msg, { duration: 5000 });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-text-secondary">Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── Left Main Column (8 Cols) ── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Profile Header Card */}
          <div className="card overflow-hidden border-white/15 shadow-2xl">
            {/* Rich Gradient Banner */}
            <div className="h-44 bg-gradient-to-r from-primary-dark via-primary to-primary relative">
              <div className="absolute inset-0 bg-mesh opacity-40" />
              <div className="absolute top-4 left-4 flex gap-2">
                {profile.isVerified && (
                  <span className="badge badge-verified bg-black/40 backdrop-blur-md">
                    <ShieldCheck className="w-3.5 h-3.5" /> ID Verified
                  </span>
                )}
                {profile.isPremiumProfile ? (
                  <MembershipBadge tier={profile.membershipTier} size="sm" showIcon className="bg-black/40 backdrop-blur-md border-white/20" />
                ) : isOwnProfile ? (
                  <MembershipBadge tier="FREE" size="sm" className="bg-black/40 text-white/90 backdrop-blur-md border-white/20" />
                ) : null}
              </div>
              {isOwnProfile && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 sm:gap-2">
                  <Link
                    to="/profile/biodata-form"
                    aria-label="Traditional Biodata Form"
                    title="Traditional Biodata Form"
                    className="btn btn-ghost btn-sm bg-black/40 backdrop-blur-md text-amber-300 font-bold hover:bg-white/20 p-2 sm:px-3 sm:py-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Biodata Form</span>
                  </Link>
                  <Link
                    to="/profile/edit"
                    aria-label="Edit Profile"
                    title="Edit Profile"
                    className="btn btn-ghost btn-sm bg-black/40 backdrop-blur-md text-white hover:bg-white/20 p-2 sm:px-3 sm:py-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Profile</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Profile Avatar + Primary Info */}
            <div className="px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-16 mb-4 relative z-10">
                <div className="w-28 h-28 rounded-2xl border-4 border-white overflow-hidden shadow-xl flex-shrink-0 bg-gradient-to-tr from-rose-500 to-rose-700 relative group flex items-center justify-center">
                  {profile.photo && !avatarError ? (
                    <img 
                      src={profile.photo} 
                      alt={profile.name} 
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white p-2">
                      <User className="w-12 h-12 text-white/90" />
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-white/90 mt-0.5">
                        {profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'S2S'}
                      </span>
                    </div>
                  )}
                  {isOwnProfile && (
                    <>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleDirectPhotoUpload}
                      />
                      <div className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs gap-1.5 p-1 z-20">
                        {uploadingPhoto ? (
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => photoInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/25 hover:bg-white/35 transition-colors cursor-pointer text-xs"
                            >
                              <Camera className="w-3.5 h-3.5 text-white" />
                              <span>{profile.photo ? 'Change' : 'Upload'}</span>
                            </button>
                            {profile.photo && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const mainPt = profile.photosList.find((pt: any) => pt.url === profile.photo);
                                  handleDeletePhoto(mainPt || profile.photo);
                                }}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-rose-600/80 hover:bg-rose-700 text-white transition-colors cursor-pointer text-xs"
                                title="Delete Profile Picture"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary tracking-tight">{profile.name}</h1>
                        <CheckCircle2 className="w-5 h-5 text-secondary fill-secondary/20" />
                      </div>
                      <p className="text-text-secondary text-sm flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{profile.age} yrs • {profile.height} • {profile.location}</span>
                      </p>
                      <p className="text-text-muted text-xs flex items-center gap-2 mt-1">
                        <Briefcase className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                        <span>{profile.community} • {profile.education} • {profile.occupation}</span>
                      </p>
                    </div>

                    {!isOwnProfile && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={handleSendInterest}
                          disabled={interestSent || (user?.entitlements ? (!user.entitlements.interests.enabled || (user.entitlements.interests.max > 0 && user.entitlements.interests.remaining <= 0)) : false)}
                          className={`btn ${interestSent ? 'btn-secondary' : 'btn-primary'} btn-md font-bold shadow-lg flex items-center gap-2`}
                          title={user?.entitlements && (!user.entitlements.interests.enabled || (user.entitlements.interests.max > 0 && user.entitlements.interests.remaining <= 0)) ? 'Interest limit reached or disabled for your active plan' : undefined}
                        >
                          <Heart className={`w-4 h-4 ${interestSent ? 'fill-current' : ''}`} />
                          {interestSent ? 'Interest Sent' : 'Send Interest'}
                        </button>

                        {(user?.entitlements?.hasChat ?? true) ? (
                          <Link
                            to="/messages"
                            className="btn btn-secondary btn-md font-bold shadow-sm flex items-center gap-2 border-slate-200 hover:bg-slate-50"
                          >
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Direct Chat
                          </Link>
                        ) : (
                          <Link
                            to="/premium"
                            title="Direct Live Chat is disabled on your plan. Upgrade to unlock!"
                            className="btn btn-secondary btn-md font-bold flex items-center gap-2 opacity-70 border-slate-200"
                          >
                            <Lock className="w-4 h-4 text-amber-500" />
                            Chat (Upgrade Plan)
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Match Score Progress */}
              {!isOwnProfile && (
                (user?.entitlements?.hasAiMatch ?? true) ? (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-slate-50 to-secondary/10 border border-primary/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">AI Compatibility Match</span>
                        <span className="text-primary font-bold text-sm">{profile.matchScore}% Excellent Match</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${profile.matchScore}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-text-secondary font-medium">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span>AI Match Score is disabled on your plan.</span>
                    </div>
                    <Link to="/premium" className="text-primary font-bold hover:underline flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-500" /> Upgrade Plan
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Contact Details — Plan Limit Lock/Unlock Card */}
          {!isOwnProfile && (
            <div className="card p-6 border border-slate-200 bg-gradient-to-br from-amber-500/10 via-white to-emerald-500/10 shadow-xl text-slate-900">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-amber-600" />
                  <h2 className="text-slate-900 font-bold text-base">Contact Information</h2>
                </div>
                <div className="text-xs px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-extrabold shadow-sm">
                  {unlockedState.planName || unlockedState.tier} Plan ({unlockedState.remaining >= 900 || unlockedState.contactLimit === -1 ? 'Unlimited' : `${unlockedState.remaining}/${unlockedState.contactLimit} Views Left`})
                </div>
              </div>

              {isContactUnlocked ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center gap-3.5 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-emerald-800 text-xs font-bold uppercase tracking-wider">Verified Phone Number</p>
                      <p className="text-slate-900 font-black text-base tracking-wide select-all mt-0.5">{profile.phone || apiProfile?.user?.phone || '+91 93613 95699'}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 flex items-center gap-3.5 shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-blue-800 text-xs font-bold uppercase tracking-wider">Verified Email Address</p>
                      <p className="text-slate-900 font-black text-base tracking-wide select-all mt-0.5">{profile.email || apiProfile?.user?.email || 'axiino237@gmail.com'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center relative overflow-hidden min-h-[190px] flex flex-col justify-center">
                  <div className="blur-sm select-none text-text-muted text-sm space-y-1 mb-4">
                    <p>+91 98765 XXXXX • Verified Phone</p>
                    <p>contact****@gmail.com • Verified Email</p>
                  </div>
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">Unlock Contact Details</p>
                        <p className="text-slate-300 text-xs mt-0.5">
                          {unlockedState.remaining > 0 || unlockedState.contactLimit === -1
                            ? (unlockedState.contactLimit === -1
                                ? 'Unlock contact phone & email with your unlimited plan'
                                : `Use 1 of your ${unlockedState.remaining} remaining contact views to unlock phone & email`)
                            : `Contact view limit reached (${unlockedState.usedCount}/${unlockedState.contactLimit}) for your ${unlockedState.planName || unlockedState.tier} plan`}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        {unlockedState.remaining > 0 || unlockedState.contactLimit === -1 ? (
                          <button
                            onClick={handleUnlockContact}
                            disabled={unlockingContact}
                            className="btn btn-gold btn-sm font-bold shadow-lg inline-flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] transition-transform"
                          >
                            {unlockingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                            Unlock Contact Details ({unlockedState.contactLimit === -1 ? 'Unlimited' : `${unlockedState.remaining} Left`})
                          </button>
                        ) : (
                          <Link to="/premium" className="btn btn-gold btn-sm font-bold shadow-lg inline-flex items-center gap-1.5">
                            <Crown className="w-4 h-4" /> Upgrade Plan to Unlock
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabbed Profile Details */}
          <div className="card overflow-hidden">
            <div className="w-full max-w-full overflow-x-auto no-scrollbar p-3 sm:p-4 pb-0">
              <div className="tab-bar flex max-w-full">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`tab capitalize text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${activeTab === t.id ? 'tab-active font-bold' : ''}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-text-primary font-semibold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" /> About Me
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {profile.about}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      ['Gender', profile.gender === 'FEMALE' ? 'Female' : 'Male'],
                      ['Age / Height', `${profile.age} yrs / ${profile.height}`],
                      ['Date of Birth', profile.dateOfBirth],
                      ['Marital Status', profile.marital],
                      ['Mother Tongue', profile.motherTongue],
                      ['Religion / Caste', `${profile.religion} / ${profile.community}`],
                      ['Sub Caste', profile.subCaste || 'Not Specified'],
                      ['Place / Current Location', profile.place],
                      ['Native Place (சொந்த ஊர்)', profile.nativePlace],
                      ['Country', profile.country],
                      ['Complexion', profile.complexion],
                      ['Diet', profile.diet],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-text-muted text-xs font-medium">{k}</span>
                        <span className="text-text-primary text-xs font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'family' && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      ['Father Name', profile.fatherName],
                      ['Father Occupation', profile.fatherOccupation],
                      ['Mother Name', profile.motherName],
                      ['Mother Occupation', profile.motherOccupation],
                      ['Native Place (சொந்த ஊர்)', profile.nativePlace],
                      ['Place / Current City', profile.place],
                      ['Country', profile.country],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-text-muted text-xs font-medium">{k}</span>
                        <span className="text-text-primary text-xs font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Private Financial & Property Details - shown to profile owner */}
                  {isOwnProfile && (
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                          Property & Financial Assets
                        </h4>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200/50">
                          Private • Visible only to you
                        </span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-text-muted text-xs font-medium">Resident Status</span>
                          <span className="text-text-primary text-xs font-semibold">{profile.residentStatus}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-text-muted text-xs font-medium">Property Details</span>
                          <span className="text-text-primary text-xs font-semibold">{profile.propertyDetails}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-text-muted text-xs font-medium">Asset Value</span>
                          <span className="text-text-primary text-xs font-semibold">
                            {profile.assetValue !== null ? `₹ ${profile.assetValue.toLocaleString('en-IN')}` : 'Not Specified'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-text-muted text-xs font-medium">Bank Balance</span>
                          <span className="text-text-primary text-xs font-semibold">
                            {profile.bankBalance !== null ? `₹ ${profile.bankBalance.toLocaleString('en-IN')}` : 'Not Specified'}
                          </span>
                        </div>
                        <div className="sm:col-span-2 flex justify-between py-2.5 px-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                          <span className="text-emerald-800 text-xs font-bold">Net Worth</span>
                          <span className="text-emerald-700 text-sm font-extrabold">
                            {profile.netWorth !== null ? `₹ ${profile.netWorth.toLocaleString('en-IN')}` : 'Not Specified'}
                          </span>
                        </div>
                        <div className="sm:col-span-2 flex justify-between items-center py-2 px-3 bg-amber-50/70 rounded-lg border border-amber-200">
                          <div>
                            <span className="text-amber-900 text-xs font-bold block">Membership Category</span>
                            <span className="text-[11px] text-amber-700">
                              {profile.membershipCategory === 'ELITE' || profile.isElite ? 'Elite Member' : 'General Member'}
                            </span>
                          </div>
                          <div>
                            {profile.membershipCategory === 'ELITE' || profile.isElite ? (
                              profile.isEliteQualified || profile.eliteStatus === 'ELITE_QUALIFIED' ? (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  ✨ Elite — Qualified
                                </span>
                              ) : (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                  Elite — Not Qualified
                                </span>
                              )
                            ) : (
                              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                                Standard General Member
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'education' && (
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    ['Highest Qualification', profile.education],
                    ['Specialization / Department', profile.fieldOfStudy],
                    ['College / University', profile.college || (profile.fieldOfStudy ? 'Not Specified' : '')],
                    ['Occupation', profile.occupation],
                    ['Employed In / Sector', profile.employedIn],
                    ['Company Name', profile.company],
                    ['Annual Income', profile.salary],
                    ['Work Location', profile.workLocation],
                  ].filter(([_, v]) => v && v !== '—' && v !== '').map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-text-muted text-xs font-medium">{k}</span>
                      <span className="text-text-primary text-xs font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'horoscope' && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                    {[
                      ['Star (Nakshatra)', profile.star],
                      ['Rasi (Moon Sign)', profile.rasi],
                      ['Lagnam', profile.lagnam],
                      ['Gothram', profile.gothram],
                      ['Dosham (தோஷம்)', profile.dosham || 'No Dosham'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-text-muted text-xs font-medium">{k}</span>
                        <span className="text-text-primary text-xs font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* 12-HOUSE ASTROLOGY CHART DIAGRAMS (NON-EDITABLE DISPLAY) */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                      <h3 className="font-bold text-rose-950 text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-rose-600" />
                        Astrology & Horoscope Charts
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        South Indian Vedic astrology format. Planets are shown as configured in your profile.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* RASI CHART */}
                      <div className="border-2 border-rose-900 rounded-xl overflow-hidden shadow-sm bg-white">
                        <div className="bg-rose-900 text-white font-bold text-xs uppercase px-3 py-2 flex items-center justify-between">
                          <span>RASI CHART (ராசி கட்டம்)</span>
                          <span className="text-[10px] text-amber-200">South Indian Format</span>
                        </div>
                        <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-rose-900 p-0.5 aspect-square text-[10px]">
                          {HOUSES.map((h) => {
                            const planets = ((apiProfile as any)?.rasiChart?.[h.id] || (apiProfile as any)?.horoscope?.rasiChart?.[h.id] || (apiProfile as any)?.horoscope?.horoscopeData?.rasiChart?.[h.id] || '');

                            return (
                              <div
                                key={h.id}
                                style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                                className="bg-rose-50/95 p-1.5 flex flex-col justify-between border border-rose-200 min-h-[58px]"
                              >
                                <div className="font-bold text-rose-950 text-[10px]">{h.tamil}</div>
                                <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[11px]">
                                  {planets || <span className="text-slate-300 text-[9px] font-normal">-</span>}
                                </div>
                              </div>
                            );
                          })}
                          <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex items-center justify-center font-extrabold text-rose-900 text-sm border-2 border-rose-900 shadow-inner">
                            RASI
                          </div>
                        </div>
                      </div>

                      {/* NAVAMSAM CHART */}
                      <div className="border-2 border-rose-900 rounded-xl overflow-hidden shadow-sm bg-white">
                        <div className="bg-rose-900 text-white font-bold text-xs uppercase px-3 py-2 flex items-center justify-between">
                          <span>NAVAMSAM CHART (அம்ச கட்டம்)</span>
                          <span className="text-[10px] text-amber-200">South Indian Format</span>
                        </div>
                        <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-rose-900 p-0.5 aspect-square text-[10px]">
                          {HOUSES.map((h) => {
                            const planets = ((apiProfile as any)?.amsamChart?.[h.id] || (apiProfile as any)?.horoscope?.amsamChart?.[h.id] || (apiProfile as any)?.horoscope?.horoscopeData?.amsamChart?.[h.id] || (apiProfile as any)?.horoscope?.horoscopeData?.navamsamChart?.[h.id] || '');

                            return (
                              <div
                                key={h.id}
                                style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                                className="bg-rose-50/95 p-1.5 flex flex-col justify-between border border-rose-200 min-h-[58px]"
                              >
                                <div className="font-bold text-rose-950 text-[10px]">{h.tamil}</div>
                                <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[11px]">
                                  {planets || <span className="text-slate-300 text-[9px] font-normal">-</span>}
                                </div>
                              </div>
                            );
                          })}
                          <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex items-center justify-center font-extrabold text-rose-900 text-sm border-2 border-rose-900 shadow-inner">
                            NAVAMSAM
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    ['Preferred Gender', profile.prefGender],
                    ['Preferred Age Range', profile.prefAge],
                    ['Preferred Height', profile.prefHeight],
                    ['Preferred Marital Status', profile.prefMarital],
                    ['Preferred Religion', profile.prefReligion],
                    ['Preferred Community', profile.prefCommunity],
                    ['Preferred Location', profile.prefLocation],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-text-muted text-xs font-medium">{k}</span>
                      <span className="text-text-primary text-xs font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column (4 Cols) ── */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Horoscope Quick Summary Card */}
          <div className="card p-5 border-gold/30">
            <h3 className="text-text-primary font-semibold text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-gold fill-gold" /> Horoscope Quick View
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-text-muted text-[10px] uppercase font-bold">Star</p>
                <p className="text-gold font-bold text-sm mt-0.5">{profile.star}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-text-muted text-[10px] uppercase font-bold">Rasi</p>
                <p className="text-gold font-bold text-sm mt-0.5">{profile.rasi}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                <p className="text-text-muted text-[10px] uppercase font-bold">Dosham Status</p>
                <p className={`font-bold text-xs mt-0.5 ${profile.hasDosham ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {profile.hasDosham ? `⚠️ ${profile.dosham}` : '✓ No Dosham'}
                </p>
              </div>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-text-primary font-semibold text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Photo Gallery
              </h3>
              <span className="text-text-muted text-xs">{profile.photosList.length} Photo{profile.photosList.length === 1 ? '' : 's'}</span>
            </div>
            {profile.photosList.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {profile.photosList.map((photoItem: any, i: number) => (
                  <div
                    key={photoItem.id || i}
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group bg-slate-100"
                  >
                    <img 
                      src={photoItem.url} 
                      alt={`Photo ${i + 1}`} 
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {isOwnProfile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto(photoItem);
                        }}
                        className="absolute top-1.5 right-1.5 bg-rose-600/90 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 shadow-md cursor-pointer"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No Photos Uploaded Yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-3">Upload your profile photos to get 10x more responses</p>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    Upload Photo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Similar Verified Matches */}
          <div className="card p-5">
            <h3 className="text-text-primary font-semibold text-sm mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-secondary" /> Similar Matches
            </h3>
            <div className="space-y-3">
              {(similarProfilesData && similarProfilesData.length > 0 ? similarProfilesData : []).map((m: any) => {
                const matchName = `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.displayName || 'Member';
                const matchCity = typeof m.city === 'object' ? m.city?.name : m.city || 'Chennai';
                const matchEdu = m.education?.degree || m.occupation?.designation || 'Graduate';
                const matchPhoto = m.photos?.[0]?.url || (m.gender === 'FEMALE' ? '/images/bride.png' : '/images/groom.png');

                return (
                  <Link
                    key={m.id}
                    to={`/profile/${m.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-slate-100/80"
                  >
                    <img
                      src={matchPhoto}
                      alt={matchName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = m.gender === 'FEMALE' ? '/images/bride.png' : '/images/groom.png';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-xs font-semibold truncate group-hover:text-primary transition-colors">{matchName}</p>
                      <p className="text-text-muted text-[10px] truncate">{m.age ? `${m.age} yrs • ` : ''}{matchCity} • {matchEdu}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileViewPage;
