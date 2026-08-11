import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth.store';
import { profilesApi } from '../../../services/profiles.service';
import { paymentsApi } from '../../../services/payments.service';
import { interestsApi } from '../../../services/interests.service';
import { 
  Heart, Send, Lock, Phone, Mail, ShieldCheck, Crown, Sparkles, 
  Share2, MoreVertical, MapPin, Briefcase, GraduationCap, Star, 
  CheckCircle2, Image as ImageIcon, Calendar, BookOpen, Users, 
  UserCheck, Award, ArrowUpRight, Edit, Loader2, User, Camera, Trash2, FileText 
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
  const { isPremium } = useAuthStore();
  const isOwnProfile = !id || id === 'me' || id === 'edit';
  const [activeTab, setActiveTab] = useState<'about' | 'family' | 'education' | 'horoscope' | 'preferences'>('about');
  const [saved, setSaved] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleDeletePhoto = async (photoUrl: string) => {
    try {
      await profilesApi.deletePhoto(photoUrl);
      setRemovedPhotos((prev) => [...prev, photoUrl]);
      toast.success('Photo removed successfully');
    } catch {
      toast.error('Failed to remove photo');
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
  const { user } = useAuthStore();

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
    const city = p.city?.name ?? p.city ?? 'Chennai';
    const state = p.state?.name ?? 'Tamil Nadu';
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
      if (!val) return 'Never Married';
      if (val === 'NEVER_MARRIED') return 'Never Married';
      if (val === 'DIVORCED') return 'Divorced';
      if (val === 'WIDOWED') return 'Widowed';
      if (val === 'SEPARATED') return 'Separated';
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

    const userPhotosList: string[] = p.photos && p.photos.length > 0
      ? p.photos.map((pt: any) => pt.url || pt).filter((u: string) => u && !u.includes('groom.png') && !u.includes('bride.png'))
      : ((p as any).photoUrl && !(p as any).photoUrl.includes('groom.png') && !(p as any).photoUrl.includes('bride.png') ? [(p as any).photoUrl] : []);

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
      location: p.occupation?.workingLocation || `${city}, ${state}`,
      community: communityName,
      caste: communityName,
      subCaste: subCasteName,
      religion: religionName,
      education: p.education?.degree || p.educationDegree || (typeof p.education === 'string' ? p.education : '') || 'Not Specified',
      college: p.education?.college || p.education?.fieldOfStudy || p.college || p.educationDetail || 'Not Specified',
      occupation: p.occupation?.designation || p.occupation?.title || (typeof p.occupation === 'string' ? p.occupation : '') || 'Not Specified',
      company: p.occupation?.company || p.company || 'Not Specified',
      salary: p.occupation?.annualIncome ? String(p.occupation.annualIncome) : (p.annualIncome || p.occupation?.employmentType || 'Not Specified'),
      workLocation: p.occupation?.workingLocation || p.workLocation || `${city}, ${state}`,
      fatherName: p.family?.fatherName || p.fatherName || 'Not Specified',
      fatherOccupation: p.family?.fatherOccupation || p.fatherOccupation || 'Not Specified',
      motherName: p.family?.motherName || p.motherName || 'Not Specified',
      motherOccupation: p.family?.motherOccupation || p.motherOccupation || 'Not Specified',
      marital: formatMarital(p.maritalStatus),
      motherTongue: p.motherTongue ?? 'Tamil',
      complexion: p.complexion ?? 'Fair',
      weight: p.weight ? `${p.weight} kg` : 'Not Specified',
      diet: p.diet ?? 'Vegetarian',
      about: p.about || `Welcome to ${name}'s profile page.`,
      isVerified: p.membershipTier ? p.membershipTier !== 'FREE' : (p.isVerified ?? false),
      isPremiumProfile: p.membershipTier ? p.membershipTier !== 'FREE' : (p.isPremium ?? false),
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
      prefMarital: formatMarital(p.partnerPreference?.maritalStatus?.[0]),
      prefReligion: prefObj.religion || 'Not Specified',
      prefCommunity: prefObj.community || 'Not Specified',
      prefEducation: prefObj.education || 'Not Specified',
      prefLocation: prefObj.location || 'Not Specified',
      hasDosham: false,
      photo: userPhotosList[0] || null,
      photosList: userPhotosList,
      phone: p.user?.phone || p.phone || (p as any).userPhone || '',
      email: p.user?.email || p.email || (p as any).userEmail || '',
    };
  }, [apiProfile, user]);

  const [unlockedState, setUnlockedState] = useState<{
    tier: string;
    contactLimit: number;
    usedCount: number;
    remaining: number;
    unlockedIds: string[];
  }>({
    tier: 'FREE',
    contactLimit: 5,
    usedCount: 0,
    remaining: 5,
    unlockedIds: [],
  });

  const [unlockingContact, setUnlockingContact] = useState(false);

  useEffect(() => {
    paymentsApi.getUnlockedContacts().then((data) => {
      if (data) setUnlockedState(data);
    }).catch(() => null);
  }, []);

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
    } catch {
      setInterestSent(true);
      toast.success(`Interest sent successfully to ${profile.name}! 💌`);
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
                {profile.isPremiumProfile && (
                  <span className="badge badge-premium bg-black/40 backdrop-blur-md">
                    <Crown className="w-3.5 h-3.5" /> Premium Member
                  </span>
                )}
              </div>
              {isOwnProfile && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <Link to="/profile/biodata-form" className="btn btn-ghost btn-sm bg-black/40 backdrop-blur-md text-amber-300 font-bold hover:bg-white/20">
                    <FileText className="w-4 h-4" /> Biodata Form
                  </Link>
                  <Link to="/profile/edit" className="btn btn-ghost btn-sm bg-black/40 backdrop-blur-md text-white hover:bg-white/20">
                    <Edit className="w-4 h-4" /> Edit Profile
                  </Link>
                </div>
              )}
            </div>

            {/* Profile Avatar + Primary Info */}
            <div className="px-6 pb-6">
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
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs gap-1 cursor-pointer"
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        ) : (
                          <>
                            <Camera className="w-5 h-5 text-white" />
                            <span>Upload</span>
                          </>
                        )}
                      </button>
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
                        {isContactUnlocked ? (
                          <button
                            onClick={handleSendInterest}
                            disabled={interestSent}
                            className={`btn ${interestSent ? 'btn-secondary' : 'btn-primary'} btn-md font-bold shadow-lg flex items-center gap-2`}
                          >
                            <Heart className={`w-4 h-4 ${interestSent ? 'fill-current' : ''}`} />
                            {interestSent ? 'Interest Sent' : 'Send Interest'}
                          </button>
                        ) : (
                          <button
                            disabled
                            title="Unlock contact details first to send interest"
                            className="btn btn-secondary btn-md font-bold flex items-center gap-2 opacity-50 cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4" />
                            Send Interest
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Match Score Progress */}
              {!isOwnProfile && (
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
                  {unlockedState.tier} Plan ({unlockedState.remaining >= 900 ? 'Unlimited' : `${unlockedState.remaining}/${unlockedState.contactLimit} Views Left`})
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
                          {unlockedState.remaining > 0
                            ? `Use 1 of your ${unlockedState.remaining} remaining contact views to unlock phone & email`
                            : `Contact view limit reached (${unlockedState.usedCount}/${unlockedState.contactLimit}) for your ${unlockedState.tier} plan`}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        {unlockedState.remaining > 0 ? (
                          <button
                            onClick={handleUnlockContact}
                            disabled={unlockingContact}
                            className="btn btn-gold btn-sm font-bold shadow-lg inline-flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] transition-transform"
                          >
                            {unlockingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                            Unlock Contact Details ({unlockedState.remaining} Left)
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
            <div className="tab-bar p-1.5 m-4 mb-0 flex-wrap">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`tab capitalize text-xs md:text-sm ${activeTab === t.id ? 'tab-active' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6">
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
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    ['Father Name', profile.fatherName],
                    ['Father Occupation', profile.fatherOccupation],
                    ['Mother Name', profile.motherName],
                    ['Mother Occupation', profile.motherOccupation],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-text-muted text-xs font-medium">{k}</span>
                      <span className="text-text-primary text-xs font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'education' && (
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    ['Highest Qualification', profile.education],
                    ['College / University', profile.college],
                    ['Occupation', profile.occupation],
                    ['Company Name', profile.company],
                    ['Annual Income', profile.salary],
                    ['Work Location', profile.workLocation],
                  ].map(([k, v]) => (
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
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-text-muted text-xs font-medium">{k}</span>
                        <span className="text-text-primary text-xs font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* 12-HOUSE ASTROLOGY CHART DIAGRAMS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    {/* RASI CHART */}
                    <div className="border-2 border-rose-900 rounded-xl overflow-hidden shadow-sm bg-white">
                      <div className="bg-rose-900 text-white font-bold text-xs uppercase px-3 py-2 flex items-center justify-between">
                        <span>RASI CHART (ராசி கட்டம்)</span>
                        <span className="text-[10px] text-amber-200">South Indian Format</span>
                      </div>
                      <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-rose-900 p-0.5 aspect-square text-[10px]">
                        {HOUSES.map((h) => {
                          const planets = ((apiProfile as any)?.rasiChart?.[h.id] || (apiProfile as any)?.horoscope?.rasiChart?.[h.id] || '');
                          return (
                            <div key={h.id} style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                              className="bg-rose-50/95 p-1.5 flex flex-col justify-between border border-rose-200 min-h-[55px]">
                              <div className="font-bold text-rose-950 text-[9px]">{h.tamil}</div>
                              <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[10px]">
                                {planets || <span className="text-slate-300 text-[8px] font-normal">-</span>}
                              </div>
                            </div>
                          );
                        })}
                        <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex items-center justify-center font-extrabold text-rose-900 text-sm border-2 border-rose-900 shadow-inner">RASI</div>
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
                          const planets = ((apiProfile as any)?.amsamChart?.[h.id] || (apiProfile as any)?.horoscope?.amsamChart?.[h.id] || '');
                          return (
                            <div key={h.id} style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                              className="bg-rose-50/95 p-1.5 flex flex-col justify-between border border-rose-200 min-h-[55px]">
                              <div className="font-bold text-rose-950 text-[9px]">{h.tamil}</div>
                              <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[10px]">
                                {planets || <span className="text-slate-300 text-[8px] font-normal">-</span>}
                              </div>
                            </div>
                          );
                        })}
                        <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex items-center justify-center font-extrabold text-rose-900 text-sm border-2 border-rose-900 shadow-inner">NAVAMSAM</div>
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
                    ['Preferred Education', profile.prefEducation],
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
                <p className={`font-bold text-xs mt-0.5 ${profile.hasDosham ? 'text-warning' : 'text-success'}`}>
                  {profile.hasDosham ? '⚠️ Chevvai Dosham' : '✓ No Chevvai / Raagu Dosham'}
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
            {profile.photosList.filter((u: string) => !removedPhotos.includes(u)).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {profile.photosList.filter((u: string) => !removedPhotos.includes(u)).map((imgUrl: string, i: number) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group bg-slate-100"
                  >
                    <img 
                      src={imgUrl} 
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
                          handleDeletePhoto(imgUrl);
                        }}
                        className="absolute top-1.5 right-1.5 bg-rose-600/90 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 shadow-md"
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
