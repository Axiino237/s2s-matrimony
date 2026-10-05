import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart, ShieldCheck, Star, X, Check, ArrowRight, Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { paymentsApi } from '../../../services/payments.service';
import { useAuthStore } from '../../../store/auth.store';
import { communitiesApi, CommunityData } from '../../../services/communities.service';

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

const PAGE_SIZE = 8;

// Helper to map real profile API shape to display-friendly values
const getProfileDisplay = (p: any) => {
  const locParts = [
    p.city?.name ?? (typeof p.city === 'string' ? p.city : null),
    p.state?.name ?? (typeof p.state === 'string' ? p.state : null),
    p.country?.name ?? (typeof p.country === 'string' ? p.country : null),
  ].filter(Boolean);
  const displayLocation = locParts.length > 0 ? locParts.join(', ') : 'India';

  const occTitle = p.occupation?.designation || p.occupation?.title || (typeof p.occupation === 'string' ? p.occupation : '') || (p.occupation?.company ? p.occupation.company : '—');
  const occSalary = (() => {
    const min = p.occupation?.salaryMin;
    if (min) {
      if (min >= 100000) {
        return `₹${(min / 100000).toFixed(min % 100000 === 0 ? 0 : 1)} LPA`;
      }
      return `₹${min.toLocaleString('en-IN')}`;
    }
    return '';
  })();
  const occupationDisplay = occSalary && occTitle !== '—' ? `${occTitle} • ${occSalary}` : (occTitle || '—');

  return {
    id: p.id,
    name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.displayName || '—',
    age: p.age ?? 0,
    gender: p.gender ?? 'MALE',
    heightCm: p.heightCm ?? 165,
    city: displayLocation,
    education: p.education?.degree ?? '—',
    occupation: occupationDisplay,
    community: p.community?.name ?? '—',
    matchScore: p.matchScore ?? 75,
    isVerified: p.isVerified ?? false,
    isPremium: p.isPremium ?? (p as any).isPremiumProfile ?? false,
    maritalStatus: p.maritalStatus ?? 'NEVER_MARRIED',
    avatar: p.photos?.[0]?.url ?? null,
    createdAt: p.createdAt,
  };
};


const ProfileCard = ({ profile: rawProfile, showMatchScore = false }: { profile: any; showMatchScore?: boolean; isContactUnlocked?: boolean }) => {
  const profile = getProfileDisplay(rawProfile);
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(false);
  const [interestSent, setInterestSent] = useState(false);

  const canSendInterest = user?.entitlements ? (user.entitlements.interests.enabled && (user.entitlements.interests.max === -1 || user.entitlements.interests.remaining > 0)) : true;
  const canAiMatch = user?.entitlements ? (user.entitlements.hasAiMatch || user.entitlements.isStaff) : true;

  const handleInterest = async () => {
    if (interestSent) {
      setInterestSent(false);
      toast.success('Interest cancelled');
      return;
    }
    try {
      const receiverUserId = rawProfile.userId || rawProfile.id;
      await api.post('/interests/send', {
        receiverUserId,
        message: `Hi ${profile.name}, I am interested in connecting with your profile!`,
      });
      setInterestSent(true);
      toast.success(`Interest sent to ${profile.name}! 💌`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to send interest';
      toast.error(msg);
    }
  };

  const handleLike = () => {
    setLiked((prev) => !prev);
    toast.success(liked ? 'Removed from favorites' : `Added ${profile.name} to favorites! ♡`);
  };

  const formattedHeight = (cm: number) => {
    const inches = Math.round(cm / 2.54);
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return `${feet}'${remainingInches}"`;
  };

  return (
    <div className="card group hover:border-primary/40 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full">
      {/* Photo Container */}
      <Link to={`/profile/${profile.id}`} className="aspect-[3/4] bg-slate-50 relative flex items-center justify-center text-6xl overflow-hidden border-b border-slate-100 block">
        {profile.avatar ? (
          <img 
            src={profile.avatar} 
            alt={profile.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-4xl text-slate-300 select-none">
            {profile.gender === 'FEMALE' ? '👰' : '🤵'}
          </div>
        )}
        
        {profile.isVerified && (
          <span className="absolute top-2.5 right-2.5 badge badge-verified text-[11px] py-1 px-2.5 bg-emerald-600 text-white border-emerald-500 shadow-md flex items-center gap-1 font-bold z-10">
            <ShieldCheck className="w-3.5 h-3.5 text-white" /> Verified
          </span>
        )}
        {profile.isPremium && (
          <span className="absolute top-2.5 left-2.5 badge badge-premium text-[11px] py-1 px-2.5 bg-amber-500 text-white border-amber-400 shadow-md flex items-center gap-1 font-bold z-10">
            <Star className="w-3.5 h-3.5 fill-current text-white" /> Premium
          </span>
        )}

        {/* Hover Overlay Button */}
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3 pointer-events-none">
          <span className="btn btn-primary btn-sm w-full text-xs shadow-md text-center flex items-center justify-center">
            View Full Profile
          </span>
        </div>
      </Link>

      {/* Info Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/profile/${profile.id}`} className="hover:text-primary transition-colors block">
            <h3 className="text-text-primary font-bold text-sm truncate hover:text-primary">{profile.name}</h3>
          </Link>
          <p className="text-text-secondary text-xs mt-0.5">{profile.age} yrs • {formattedHeight(profile.heightCm)} • {profile.city}</p>
          <p className="text-text-muted text-xs truncate mt-0.5">{profile.occupation} • {profile.community}</p>
          
          {/* Match Score — ONLY rendered when showMatchScore is true AND plan allows AI Match */}
          {showMatchScore && canAiMatch && (
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-primary h-full rounded-full" style={{ width: `${profile.matchScore}%` }} />
              </div>
              <span className="text-primary text-xs font-extrabold flex-shrink-0">{profile.matchScore}% Match</span>
            </div>
          )}
        </div>

        {/* Actions Button */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
          {canSendInterest ? (
            <button
              onClick={handleInterest}
              className={`btn btn-sm flex-1 text-xs py-2 font-semibold ${
                interestSent ? 'bg-slate-100 text-slate-500 border-slate-200' : 'btn-primary'
              }`}
            >
              {interestSent ? '💌 Sent' : '💌 Interest'}
            </button>
          ) : (
            <button
              disabled
              title="Interest sending is disabled or limit reached for your active plan"
              className="btn btn-sm flex-1 text-xs py-2 font-semibold bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3 h-3" />
              Interest
            </button>
          )}
          <button
            onClick={handleLike}
            className={`btn btn-secondary btn-sm p-2 flex items-center justify-center border-slate-200 ${
              liked ? 'bg-rose-50 text-rose-500 border-rose-200' : 'text-text-secondary hover:bg-slate-50'
            }`}
          >
            {liked ? '❤️' : '♡'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SearchPage = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  // Fetch unlocked contact IDs on mount
  useEffect(() => {
    paymentsApi.getUnlockedContacts().then((data) => {
      if (data?.unlockedIds) setUnlockedIds(data.unlockedIds);
    }).catch(() => null);
  }, []);
  
  // Tab and Sort State
  const [activeTab, setActiveTab] = useState<'All' | 'Recommended' | 'Recently Joined' | 'Verified' | 'Premium'>('All');
  const [sortOption, setSortOption] = useState<'Newest First' | 'Match Score' | 'Last Active'>('Newest First');
  const [currentPage, setCurrentPage] = useState(1);

  // Search Results from API
  const [profiles, setProfiles] = useState<any[]>([]);
  const [totalFromApi, setTotalFromApi] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to determine default opposite gender for member
  const getOppositeGender = useCallback((u: any) => {
    const ug = (u?.gender || (u as any)?.profile?.gender || '')?.toUpperCase();
    if (ug === 'MALE') return 'FEMALE'; // Default for groom members is Bride
    if (ug === 'FEMALE') return 'MALE';  // Default for bride members is Groom
    return 'ALL';
  }, []);

  const [hasUserChangedGender, setHasUserChangedGender] = useState(false);
  const [gender, setGender] = useState<string>(() => {
    const p = searchParams.get('gender')?.toUpperCase();
    if (p) return p;
    return getOppositeGender(user);
  });

  // Keep default gender updated when user auth loads if not explicitly customized or passed in URL
  useEffect(() => {
    if (!hasUserChangedGender && !searchParams.get('gender') && user) {
      const opp = getOppositeGender(user);
      if (opp !== 'ALL') {
        setGender(opp);
      }
    }
  }, [user, searchParams, hasUserChangedGender, getOppositeGender]);

  const [minAge, setMinAge] = useState<number | ''>(() => {
    const p = searchParams.get('minAge');
    return p && !isNaN(Number(p)) ? Number(p) : '';
  });
  const [maxAge, setMaxAge] = useState<number | ''>(() => {
    const p = searchParams.get('maxAge');
    return p && !isNaN(Number(p)) ? Number(p) : '';
  });
  const [minHeight, setMinHeight] = useState<number | ''>('');
  const [maxHeight, setMaxHeight] = useState<number | ''>('');
  const [marital, setMarital] = useState(() => searchParams.get('maritalStatus') || searchParams.get('marital') || '');
  const [religion, setReligion] = useState(() => searchParams.get('religion') || '');
  const [community, setCommunity] = useState(() => searchParams.get('community') || '');
  const [education, setEducation] = useState(() => searchParams.get('education') || '');
  const [occupation, setOccupation] = useState(() => searchParams.get('occupation') || '');
  const [salary, setSalary] = useState('');
  const [country, setCountry] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [withPhoto, setWithPhoto] = useState(false);
  const [noDosham, setNoDosham] = useState(false);

  // Dynamic Countries & States
  const [countriesList, setCountriesList] = useState<Array<{ id: string; name: string; code?: string; flag?: string }>>([]);
  const [statesList, setStatesList] = useState<Array<{ id: string; name: string; countryId?: string }>>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  // Fetch dynamic countries list on mount
  useEffect(() => {
    api.get('/search/locations/countries')
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setCountriesList(data);
        }
      })
      .catch(() => {
        setCountriesList([
          { id: 'in', name: 'India', code: 'IN', flag: '🇮🇳' },
          { id: 'us', name: 'United States', code: 'US', flag: '🇺🇸' },
          { id: 'ae', name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
          { id: 'sg', name: 'Singapore', code: 'SG', flag: '🇸🇬' },
          { id: 'my', name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
          { id: 'uk', name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
          { id: 'ca', name: 'Canada', code: 'CA', flag: '🇨🇦' },
          { id: 'au', name: 'Australia', code: 'AU', flag: '🇦🇺' },
        ]);
      });
  }, []);

  // Fetch states dynamically whenever selected country changes
  useEffect(() => {
    let isCurrent = true;
    setLoadingStates(true);
    const params: any = {};
    if (country && country !== 'ANY') {
      params.country = country;
    }

    api.get('/search/locations/states', { params })
      .then((res) => {
        if (!isCurrent) return;
        const data = res.data;
        if (Array.isArray(data)) {
          setStatesList(data);
          // If previous stateVal is not in the new country's states list, clear it
          if (stateVal && stateVal !== 'ANY' && !data.some((s: any) => s.name?.toLowerCase() === stateVal.toLowerCase())) {
            setStateVal('');
          }
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        if (!country || country === 'India') {
          setStatesList([
            { id: 'tn', name: 'Tamil Nadu' },
            { id: 'kl', name: 'Kerala' },
            { id: 'ka', name: 'Karnataka' },
            { id: 'ap', name: 'Andhra Pradesh' },
            { id: 'ts', name: 'Telangana' },
            { id: 'mh', name: 'Maharashtra' },
          ]);
        } else {
          setStatesList([]);
        }
      })
      .finally(() => {
        if (isCurrent) setLoadingStates(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [country]);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setStateVal('');
    setCurrentPage(1);
  };

  const [dbCommunities, setDbCommunities] = useState<CommunityData[]>([]);

  useEffect(() => {
    communitiesApi.getCommunities().then((comms) => {
      if (Array.isArray(comms) && comms.length > 0) {
        setDbCommunities(comms);
      }
    }).catch(() => {});
  }, []);

  const communityList = useMemo(() => {
    const parents = dbCommunities.filter((c) => !c.parentId && c.isActive !== false);
    if (parents.length === 0) {
      return [
        { value: 'Nadar', label: 'Nadar Matrimony' },
        { value: 'Mudaliar', label: 'Mudaliar Matrimony' },
        { value: 'Gounder', label: 'Gounder Matrimony' },
        { value: 'Pillai', label: 'Pillai Matrimony' },
        { value: 'Chettiar', label: 'Chettiar Matrimony' },
        { value: 'Vanniyar', label: 'Vanniyar Matrimony' },
        { value: 'Thevar', label: 'Thevar / Mukkulathor' },
        { value: 'Naidu', label: 'Naidu Matrimony' },
        { value: 'Iyer', label: 'Iyer Matrimony' },
        { value: 'Iyengar', label: 'Iyengar Matrimony' },
        { value: 'Vellalar', label: 'Vellalar Matrimony' },
        { value: 'Reddiyar', label: 'Reddiyar Matrimony' },
        { value: 'Yadav', label: 'Yadav / Konar Matrimony' },
        { value: 'Viswakarma', label: 'Viswakarma Matrimony' },
        { value: 'Sourashtra', label: 'Sourashtra Matrimony' },
        { value: 'Christian', label: 'Christian Matrimony' },
        { value: 'Muslim', label: 'Muslim Matrimony' },
        { value: 'Devendra Kula Vellalar', label: 'Devendra Kula Vellalar' },
      ];
    }
    const items = parents.map((c) => {
      const clean = c.name.replace(/\s+Matrimony$/i, '').trim();
      return { value: clean, label: c.name };
    });
    items.sort((a, b) => a.label.localeCompare(b.label));
    return items;
  }, [dbCommunities]);

  // Compute active filters count
  const activeFilterCount = useMemo(() => {
    const isCustomGender = gender && gender !== 'ALL' && gender !== getOppositeGender(user);
    return [
      isCustomGender ? gender : null,
      minAge !== '' ? minAge : null,
      maxAge !== '' ? maxAge : null,
      minHeight !== '' ? minHeight : null,
      maxHeight !== '' ? maxHeight : null,
      marital,
      religion,
      community,
      education,
      occupation,
      salary,
      country,
      stateVal,
      verifiedOnly ? true : null,
      withPhoto ? true : null,
      noDosham ? true : null,
    ].filter(Boolean).length;
  }, [gender, user, getOppositeGender, minAge, maxAge, minHeight, maxHeight, marital, religion, community, education, occupation, salary, country, stateVal, verifiedOnly, withPhoto, noDosham]);

  // Sync URL search parameters on change
  useEffect(() => {
    const genderParam = searchParams.get('gender');
    const minAgeParam = searchParams.get('minAge');
    const maxAgeParam = searchParams.get('maxAge');
    const religionParam = searchParams.get('religion');
    const communityParam = searchParams.get('community');
    const maritalParam = searchParams.get('maritalStatus') || searchParams.get('marital');
    const educationParam = searchParams.get('education');
    const occupationParam = searchParams.get('occupation');

    if (genderParam !== null) {
      setHasUserChangedGender(true);
      setGender(genderParam.toUpperCase());
    }
    if (minAgeParam !== null && !isNaN(Number(minAgeParam))) setMinAge(Number(minAgeParam));
    if (maxAgeParam !== null && !isNaN(Number(maxAgeParam))) setMaxAge(Number(maxAgeParam));
    if (religionParam !== null) setReligion(religionParam);
    if (communityParam !== null) setCommunity(communityParam);
    if (maritalParam !== null) setMarital(maritalParam);
    if (educationParam !== null) setEducation(educationParam);
    if (occupationParam !== null) setOccupation(occupationParam);
  }, [searchParams]);

  const searchProfiles = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page: pg,
        limit: PAGE_SIZE,
        sort: sortOption,
        tab: activeTab,
      };
      if (minAge !== '') params.minAge = minAge;
      if (maxAge !== '') params.maxAge = maxAge;
      if (minHeight !== '') params.minHeight = minHeight;
      if (maxHeight !== '') params.maxHeight = maxHeight;
      if (user?.id) params.excludeUserId = user.id;
      if (gender && gender !== 'ALL' && gender !== 'ANY') {
        params.gender = gender;
      } else {
        params.gender = 'ALL';
      }
      if (marital && marital !== 'ANY') params.maritalStatus = marital;
      if (religion && religion !== 'ANY') params.religion = religion;
      if (community && community !== 'ANY') params.community = community;
      if (education && education !== 'ANY') params.education = education;
      if (occupation && occupation !== 'ANY') params.occupation = occupation;
      if (salary && salary !== 'ANY') params.salary = salary;
      if (country && country !== 'ANY') params.country = country;
      if (stateVal && stateVal !== 'ANY') params.state = stateVal;
      if (verifiedOnly) params.isVerified = true;
      if (withPhoto) params.withPhoto = true;
      if (noDosham) params.noDosham = true;
      if (activeTab === 'Verified') params.isVerified = true;

      const res = await api.get('/search', { params });
      const data = res.data?.profiles ?? res.data?.data ?? res.data ?? [];
      setProfiles(Array.isArray(data) ? data : []);
      setTotalFromApi(res.data?.total ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      toast.error('Failed to load search results');
    } finally {
      setLoading(false);
    }
  }, [user, gender, minAge, maxAge, minHeight, maxHeight, marital, religion, community, education, occupation, salary, country, stateVal, verifiedOnly, withPhoto, noDosham, activeTab, sortOption]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProfiles(currentPage), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchProfiles, currentPage]);


  const resetAllFilters = () => {
    setHasUserChangedGender(false);
    setGender(getOppositeGender(user));
    setMinAge('');
    setMaxAge('');
    setMinHeight('');
    setMaxHeight('');
    setMarital('');
    setReligion('');
    setCommunity('');
    setEducation('');
    setOccupation('');
    setSalary('');
    setCountry('');
    setStateVal('');
    setVerifiedOnly(false);
    setWithPhoto(false);
    setNoDosham(false);
    setCurrentPage(1);
    toast.success('Filters reset to default');
  };

  // Instant client-side tab & safety filter
  const filteredProfiles = useMemo(() => {
    let list = profiles.filter((p: any) => {
      if (!user) return true;
      if (p.userId === user.id || p.id === user.id) return false;
      if ((user as any).profile?.id && p.id === (user as any).profile.id) return false;
      return true;
    });

    // Enforce visibility criteria: Only Active account + Verified profile are visible to other members
    list = list.filter((p: any) => {
      const isAccountActive = p.user ? p.user.isActive !== false : p.isActive !== false;
      const isProfileVerified = p.isVerified === true && (!p.verificationStatus || p.verificationStatus === 'VERIFIED');
      const isProfileActive = !p.status || p.status === 'ACTIVE';
      return isAccountActive && isProfileVerified && isProfileActive;
    });

    // Client-side gender filtering:
    // If 'ALL' or empty, both Bride and Groom members are shown!
    const gUpper = (gender || '').toUpperCase();
    if (gUpper === 'FEMALE') {
      list = list.filter((p: any) => p.gender?.toUpperCase() === 'FEMALE');
    } else if (gUpper === 'MALE') {
      list = list.filter((p: any) => p.gender?.toUpperCase() === 'MALE');
    }

    if (activeTab === 'Verified') {
      list = list.filter((p: any) => p.isVerified);
    } else if (activeTab === 'Premium') {
      list = list.filter((p: any) => p.isPremium);
    } else if (activeTab === 'Recommended') {
      list = [...list].sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (activeTab === 'Recently Joined') {
      list = [...list].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return list;
  }, [profiles, user, gender, activeTab]);

  const totalPages = Math.max(1, Math.ceil(totalFromApi / PAGE_SIZE));
  const paginatedProfiles = filteredProfiles;


  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Helper to render filter controls for both Desktop Sidebar and Mobile Drawer
  const renderFilterControls = (isMobile = false, onClose?: () => void) => (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-text-primary font-bold text-base flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" /> Filters
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={resetAllFilters} 
            className="text-primary text-xs font-semibold hover:underline"
          >
            Reset All
          </button>
          {isMobile && onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Gender Filter Dropdown */}
      <div className="space-y-1.5">
        <label className="input-label text-xs">Looking For (Gender)</label>
        <select 
          className="input py-2 text-sm font-medium w-full" 
          value={gender} 
          onChange={e => {
            setHasUserChangedGender(true);
            setGender(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Genders (Both Bride & Groom)</option>
          <option value="FEMALE">Bride (Female)</option>
          <option value="MALE">Groom (Male)</option>
        </select>
      </div>

      {/* Age Range Slider Inputs */}
      <div className="space-y-1.5">
        <label className="input-label text-xs">Age Range (Yrs)</label>
        <div className="flex gap-2 items-center">
          <input 
            type="number" 
            className="input py-2 px-3 text-sm flex-1 min-w-0" 
            placeholder="Min"
            value={minAge} 
            onChange={e => { setMinAge(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} 
            min={18} 
            max={maxAge !== '' ? maxAge : 60}
          />
          <span className="text-text-muted text-xs flex-shrink-0">to</span>
          <input 
            type="number" 
            className="input py-2 px-3 text-sm flex-1 min-w-0" 
            placeholder="Max"
            value={maxAge} 
            onChange={e => { setMaxAge(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} 
            min={minAge !== '' ? minAge : 18} 
            max={60}
          />
        </div>
      </div>

      {/* Height Slider Inputs */}
      <div className="space-y-1.5">
        <label className="input-label text-xs">Height (cm)</label>
        <div className="flex gap-2 items-center">
          <input 
            type="number" 
            className="input py-2 px-3 text-sm flex-1 min-w-0" 
            placeholder="Min"
            value={minHeight} 
            onChange={e => { setMinHeight(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} 
            min={130} 
            max={maxHeight !== '' ? maxHeight : 220}
          />
          <span className="text-text-muted text-xs flex-shrink-0">to</span>
          <input 
            type="number" 
            className="input py-2 px-3 text-sm flex-1 min-w-0" 
            placeholder="Max"
            value={maxHeight} 
            onChange={e => { setMaxHeight(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} 
            min={minHeight !== '' ? minHeight : 130} 
            max={220}
          />
        </div>
      </div>

      {/* Marital Status Dropdown */}
      <div className="space-y-1.5">
        <label className="input-label text-xs">Marital Status</label>
        <select className="input py-2 text-sm w-full" value={marital} onChange={e => { setMarital(e.target.value); setCurrentPage(1); }}>
          <option value="">Any</option>
          <option value="Never Married">Never Married</option>
          <option value="Divorced">Divorced</option>
          <option value="Widowed">Widowed</option>
        </select>
      </div>

      {/* Religion Dropdown */}
      <div className="space-y-1.5">
        <label className="input-label text-xs">Religion</label>
        <select className="input py-2 text-sm w-full" value={religion} onChange={e => { setReligion(e.target.value); setCurrentPage(1); }}>
          <option value="">Any</option>
          <option value="Hindu">Hindu</option>
          <option value="Muslim">Muslim</option>
          <option value="Christian">Christian</option>
        </select>
      </div>

      {/* Community Dropdown */}
      <div className="space-y-1.5">
        <label className="input-label text-xs">Community</label>
        <select className="input py-2 text-sm w-full" value={community} onChange={e => { setCommunity(e.target.value); setCurrentPage(1); }}>
          <option value="">Any Community</option>
          {communityList.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Education Dropdown */}
      <div className="space-y-1.5">
        <label className="input-label text-xs">Education</label>
        <select className="input py-2 text-sm w-full" value={education} onChange={e => { setEducation(e.target.value); setCurrentPage(1); }}>
          <option value="">Any</option>
          <option value="B.E Computer Science">B.E Computer Science</option>
          <option value="MBA">MBA</option>
          <option value="MBBS">MBBS</option>
          <option value="B.Sc Mathematics">B.Sc Mathematics</option>
          <option value="M.Tech">M.Tech</option>
        </select>
      </div>

      {/* Occupation Dropdown */}
      <div className="space-y-1.5">
        <label className="input-label text-xs">Occupation</label>
        <select className="input py-2 text-sm w-full" value={occupation} onChange={e => { setOccupation(e.target.value); setCurrentPage(1); }}>
          <option value="">Any</option>
          <option value="Software Engineer">Software Engineer</option>
          <option value="Doctor">Doctor</option>
          <option value="Teacher">Teacher</option>
          <option value="Business Owner">Business Owner</option>
          <option value="Civil Engineer">Civil Engineer</option>
        </select>
      </div>

      {/* Salary Dropdown */}
      <div className="space-y-1.5">
        <label className="input-label text-xs">Annual Income / Salary</label>
        <select
          className="input py-2 text-sm w-full"
          value={salary}
          onChange={(e) => {
            setSalary(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Any Salary</option>
          <option value="3 LPA+">₹3 Lakhs+ (3 LPA+)</option>
          <option value="5 LPA+">₹5 Lakhs+ (5 LPA+)</option>
          <option value="8 LPA+">₹8 Lakhs+ (8 LPA+)</option>
          <option value="12 LPA+">₹12 Lakhs+ (12 LPA+)</option>
          <option value="18 LPA+">₹18 Lakhs+ (18 LPA+)</option>
          <option value="25 LPA+">₹25 Lakhs+ (25 LPA+)</option>
          <option value="35 LPA+">₹35 Lakhs+ (35 LPA+)</option>
        </select>
      </div>

      {/* Country Dropdown */}
      <div className="space-y-1.5">
        <label className="input-label text-xs">Country</label>
        <select
          className="input py-2 text-sm w-full"
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
        >
          <option value="">Any Country</option>
          {countriesList.map((c) => (
            <option key={c.id || c.name} value={c.name}>
              {c.flag ? `${c.flag} ` : ''}{c.name}
            </option>
          ))}
        </select>
      </div>

      {/* State Dropdown */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="input-label text-xs">State</label>
          {loadingStates && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
        </div>
        <select
          className="input py-2 text-sm w-full"
          value={stateVal}
          onChange={(e) => {
            setStateVal(e.target.value);
            setCurrentPage(1);
          }}
          disabled={loadingStates}
        >
          <option value="">{loadingStates ? 'Loading states...' : 'Any State'}</option>
          {statesList.map((s) => (
            <option key={s.id || s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary" 
            checked={verifiedOnly} 
            onChange={e => { setVerifiedOnly(e.target.checked); setCurrentPage(1); }}
          />
          <span className="text-text-secondary text-sm font-medium">Verified Only</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary" 
            checked={withPhoto} 
            onChange={e => { setWithPhoto(e.target.checked); setCurrentPage(1); }}
          />
          <span className="text-text-secondary text-sm font-medium">With Photo</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary" 
            checked={noDosham} 
            onChange={e => { setNoDosham(e.target.checked); setCurrentPage(1); }}
          />
          <span className="text-text-secondary text-sm font-medium">No Dosham</span>
        </label>
      </div>
    </>
  );

  return (
    <div className="animate-fade-in space-y-5 w-full max-w-full min-w-0">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 w-full max-w-full">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary truncate">Search Profiles</h1>
          <p className="text-text-secondary text-xs sm:text-sm">
            Showing {filteredProfiles.length} profiles matching your criteria
          </p>
        </div>

        {/* Filter Toggle Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile Filter Button */}
          <button 
            onClick={() => setMobileFiltersOpen(true)} 
            className="lg:hidden btn btn-secondary btn-sm flex items-center gap-1.5 border-slate-200 shadow-xs"
            aria-label="Open search filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center -mr-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Desktop Filter Toggle Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="hidden lg:flex btn btn-secondary btn-sm items-center gap-1.5 border-slate-200 shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center -mr-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Filters Slide-Over Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
            onClick={() => setMobileFiltersOpen(false)} 
          />
          {/* Slide-in Drawer Panel */}
          <div 
            className="fixed inset-y-0 right-0 w-full max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col z-50 animate-slide-in-right"
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {renderFilterControls(true, () => setMobileFiltersOpen(false))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={resetAllFilters} 
                className="btn btn-secondary btn-sm flex-1 py-2.5 font-medium"
              >
                Reset All
              </button>
              <button 
                onClick={() => setMobileFiltersOpen(false)} 
                className="btn btn-primary btn-sm flex-1 py-2.5 shadow-md font-bold"
              >
                Show ({filteredProfiles.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-full min-w-0">
        {/* Left Desktop Sidebar Filters */}
        {showFilters && (
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 sticky top-24 bg-white rounded-2xl border border-slate-200 p-5 space-y-5 max-h-[calc(100vh-120px)] overflow-y-auto shadow-sm">
            {renderFilterControls(false)}
          </aside>
        )}

        {/* Results Content Column */}
        <div className="flex-1 min-w-0 w-full max-w-full">
          {/* Top Sort and Tab Bar - horizontally scrollable on mobile */}
          <div className="w-full max-w-full overflow-x-auto pb-1 mb-5 no-scrollbar scroll-smooth">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
              {(['All', 'Recommended', 'Recently Joined', 'Verified', 'Premium'] as const).map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => handleTabChange(tab)}
                  className={`whitespace-nowrap text-xs py-2 px-3.5 rounded-lg font-medium transition-all ${
                    tab === activeTab 
                      ? 'bg-white text-slate-900 font-bold shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Profiles Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : paginatedProfiles.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-16 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-text-primary font-bold text-base mb-1">No profiles match your filters</h3>
              <p className="text-text-secondary text-sm max-w-sm mx-auto">Try resetting or broadening your age, height, and community filters to see more profiles.</p>
              <button onClick={resetAllFilters} className="btn btn-primary btn-sm mt-5">Reset All Filters</button>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${showFilters ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-4 xl:grid-cols-5'}`}>
              {paginatedProfiles.map((profile) => {
                const targetUserId = profile.userId || profile.id;
                const isUnlocked = unlockedIds.includes(profile.id) || unlockedIds.includes(targetUserId);
                return (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    showMatchScore={activeTab === 'Recommended'}
                    isContactUnlocked={isUnlocked}
                  />
                );
              })}
            </div>
          )}

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8 flex-wrap">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="btn btn-ghost btn-sm text-xs border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button 
                  key={p} 
                  onClick={() => setCurrentPage(p)} 
                  className={`btn btn-sm text-xs min-w-[32px] ${p === currentPage ? 'btn-primary' : 'btn-ghost border border-transparent hover:border-slate-200'}`}
                >
                  {p}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="btn btn-ghost btn-sm text-xs border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
