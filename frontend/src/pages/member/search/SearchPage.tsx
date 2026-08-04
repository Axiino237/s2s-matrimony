import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Heart, ShieldCheck, Star, X, Check, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/auth.store';

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
const getProfileDisplay = (p: any) => ({
  id: p.id,
  name: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.displayName || '—',
  age: p.age ?? 0,
  gender: p.gender ?? 'MALE',
  heightCm: p.heightCm ?? 165,
  city: p.city?.name ?? '—',
  education: p.education?.degree ?? '—',
  occupation: p.occupation?.designation ?? p.occupation?.company ?? '—',
  community: p.community?.name ?? '—',
  matchScore: p.matchScore ?? 75,
  isVerified: p.isVerified ?? false,
  isPremium: p.isPremium ?? (p as any).isPremiumProfile ?? false,
  maritalStatus: p.maritalStatus ?? 'NEVER_MARRIED',
  avatar: p.photos?.[0]?.url ?? null,
  createdAt: p.createdAt,
});


const ProfileCard = ({ profile: rawProfile, showMatchScore = false }: { profile: any; showMatchScore?: boolean }) => {
  const profile = getProfileDisplay(rawProfile);
  const [liked, setLiked] = useState(false);
  const [interestSent, setInterestSent] = useState(false);

  const handleInterest = async () => {
    if (interestSent) {
      setInterestSent(false);
      toast.success('Interest cancelled');
      return;
    }
    setInterestSent(true);
    toast.success(`Interest sent to ${profile.name}! 💌`);
    try {
      const receiverUserId = rawProfile.userId || rawProfile.id;
      await api.post('/interests/send', {
        receiverUserId,
        message: `Hi ${profile.name}, I am interested in connecting with your profile!`,
      });
    } catch {
      // Ignored in dev fallback
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
      <div className="aspect-[3/4] bg-slate-50 relative flex items-center justify-center text-6xl overflow-hidden border-b border-slate-100">
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
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
          <Link to={`/profile/${profile.id}`} className="btn btn-primary btn-sm w-full text-xs shadow-md text-center flex items-center justify-center">
            View Full Profile
          </Link>
        </div>
      </div>

      {/* Info Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/profile/${profile.id}`} className="hover:text-primary transition-colors block">
            <h3 className="text-text-primary font-bold text-sm truncate hover:text-primary">{profile.name}</h3>
          </Link>
          <p className="text-text-secondary text-xs mt-0.5">{profile.age} yrs • {formattedHeight(profile.heightCm)} • {profile.city}</p>
          <p className="text-text-muted text-xs truncate mt-0.5">{profile.occupation} • {profile.community}</p>
          
          {/* Match Score — ONLY rendered when showMatchScore is true (e.g. Recommended Matches) */}
          {showMatchScore && (
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
          <button 
            onClick={handleInterest} 
            className={`btn btn-sm flex-1 text-xs py-2 font-semibold ${interestSent ? 'bg-slate-100 text-slate-500 border-slate-200' : 'btn-primary'}`}
          >
            {interestSent ? '💌 Sent' : '💌 Interest'}
          </button>
          <button 
            onClick={handleLike} 
            className={`btn btn-secondary btn-sm p-2 flex items-center justify-center border-slate-200 ${liked ? 'bg-rose-50 text-rose-500 border-rose-200' : 'text-text-secondary hover:bg-slate-50'}`}
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
  
  // Tab and Sort State
  const [activeTab, setActiveTab] = useState<'All' | 'Recommended' | 'Recently Joined' | 'Verified' | 'Premium'>('All');
  const [sortOption, setSortOption] = useState<'Newest First' | 'Match Score' | 'Last Active'>('Newest First');
  const [currentPage, setCurrentPage] = useState(1);

  // Search Results from API
  const [profiles, setProfiles] = useState<any[]>([]);
  const [totalFromApi, setTotalFromApi] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filters State - initialized directly from URL searchParams
  const defaultGender = ''; // By default show All (Both Grooms & Brides)
  const [gender, setGender] = useState<string>(() => searchParams.get('gender')?.toUpperCase() || defaultGender);
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

    if (genderParam !== null) setGender(genderParam.toUpperCase());
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
      if (gender && gender !== 'ANY') params.gender = gender;
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
    setGender(defaultGender);
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

    if (activeTab === 'Verified') {
      list = list.filter((p: any) => p.isVerified);
    } else if (activeTab === 'Premium') {
      list = list.filter((p: any) => p.isPremium || (p as any).isVerified);
    } else if (activeTab === 'Recommended') {
      list = [...list].sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (activeTab === 'Recently Joined') {
      list = [...list].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return list;
  }, [profiles, user, activeTab]);

  const totalPages = Math.max(1, Math.ceil(totalFromApi / PAGE_SIZE));
  const paginatedProfiles = filteredProfiles;


  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Search Profiles</h1>
          <p className="text-text-secondary text-sm">Showing {filteredProfiles.length} profiles matching your criteria</p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="btn btn-secondary btn-sm flex items-center gap-1.5 border-slate-200"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left Sidebar Filters */}
        {showFilters && (
          <div className="w-64 flex-shrink-0 sticky top-24 bg-white rounded-2xl border border-slate-200 p-5 space-y-5 max-h-[calc(100vh-120px)] overflow-y-auto shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-bold text-base">Filters</h2>
              <button 
                onClick={resetAllFilters} 
                className="text-primary text-xs font-semibold hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Gender Filter Dropdown */}
            <div className="space-y-1.5">
              <label className="input-label">Looking For (Gender)</label>
              <select 
                className="input py-2 text-sm font-medium" 
                value={gender} 
                onChange={e => { setGender(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Genders (Both Bride & Groom)</option>
                <option value="FEMALE">Bride (Female)</option>
                <option value="MALE">Groom (Male)</option>
              </select>
            </div>

            {/* Age Range Slider Inputs */}
            <div className="space-y-1.5">
              <label className="input-label">Age Range (Yrs)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  className="input py-2 px-3 text-sm" 
                  placeholder="Min"
                  value={minAge} 
                  onChange={e => { setMinAge(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} 
                  min={18} 
                  max={maxAge !== '' ? maxAge : 60}
                />
                <span className="self-center text-text-muted text-xs">to</span>
                <input 
                  type="number" 
                  className="input py-2 px-3 text-sm" 
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
              <label className="input-label">Height (cm)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  className="input py-2 px-3 text-sm" 
                  placeholder="Min"
                  value={minHeight} 
                  onChange={e => { setMinHeight(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} 
                  min={130} 
                  max={maxHeight !== '' ? maxHeight : 220}
                />
                <span className="self-center text-text-muted text-xs">to</span>
                <input 
                  type="number" 
                  className="input py-2 px-3 text-sm" 
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
              <label className="input-label">Marital Status</label>
              <select className="input py-2 text-sm" value={marital} onChange={e => { setMarital(e.target.value); setCurrentPage(1); }}>
                <option value="">Any</option>
                <option value="Never Married">Never Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>

            {/* Religion Dropdown */}
            <div className="space-y-1.5">
              <label className="input-label">Religion</label>
              <select className="input py-2 text-sm" value={religion} onChange={e => { setReligion(e.target.value); setCurrentPage(1); }}>
                <option value="">Any</option>
                <option value="Hindu">Hindu</option>
                <option value="Muslim">Muslim</option>
                <option value="Christian">Christian</option>
              </select>
            </div>

            {/* Community Dropdown */}
            <div className="space-y-1.5">
              <label className="input-label">Community</label>
              <select className="input py-2 text-sm" value={community} onChange={e => { setCommunity(e.target.value); setCurrentPage(1); }}>
                <option value="">Any Community</option>
                <option value="Nadar">Nadar Matrimony</option>
                <option value="Mudaliar">Mudaliar Matrimony</option>
                <option value="Gounder">Gounder Matrimony</option>
                <option value="Pillai">Pillai Matrimony</option>
                <option value="Chettiar">Chettiar Matrimony</option>
                <option value="Vanniyar">Vanniyar Matrimony</option>
                <option value="Thevar">Thevar / Mukkulathor</option>
                <option value="Naidu">Naidu Matrimony</option>
                <option value="Iyer">Iyer Matrimony</option>
                <option value="Iyengar">Iyengar Matrimony</option>
                <option value="Vellalar">Vellalar Matrimony</option>
                <option value="Reddiyar">Reddiyar Matrimony</option>
                <option value="Yadav">Yadav / Konar Matrimony</option>
                <option value="Viswakarma">Viswakarma Matrimony</option>
                <option value="Sourashtra">Sourashtra Matrimony</option>
                <option value="Christian">Christian Matrimony</option>
                <option value="Muslim">Muslim Matrimony</option>
                <option value="Devendra Kula Vellalar">Devendra Kula Vellalar</option>
                <option value="Adidravidar">Adidravidar Matrimony</option>
              </select>
            </div>

            {/* Education Dropdown */}
            <div className="space-y-1.5">
              <label className="input-label">Education</label>
              <select className="input py-2 text-sm" value={education} onChange={e => { setEducation(e.target.value); setCurrentPage(1); }}>
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
              <label className="input-label">Occupation</label>
              <select className="input py-2 text-sm" value={occupation} onChange={e => { setOccupation(e.target.value); setCurrentPage(1); }}>
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
              <label className="input-label">Salary</label>
              <select className="input py-2 text-sm" value={salary} onChange={e => { setSalary(e.target.value); setCurrentPage(1); }}>
                <option value="">Any</option>
                <option value="3 LPA+">3 LPA+</option>
                <option value="5 LPA+">5 LPA+</option>
                <option value="8 LPA+">8 LPA+</option>
                <option value="12 LPA+">12 LPA+</option>
              </select>
            </div>

            {/* Country Dropdown */}
            <div className="space-y-1.5">
              <label className="input-label">Country</label>
              <select className="input py-2 text-sm" value={country} onChange={e => { setCountry(e.target.value); setCurrentPage(1); }}>
                <option value="">Any</option>
                <option value="India">India</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Australia">Australia</option>
              </select>
            </div>

            {/* State Dropdown */}
            <div className="space-y-1.5">
              <label className="input-label">State</label>
              <select className="input py-2 text-sm" value={stateVal} onChange={e => { setStateVal(e.target.value); setCurrentPage(1); }}>
                <option value="">Any</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Kerala">Kerala</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
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
          </div>
        )}

        {/* Results Content Column */}
        <div className="flex-1 min-w-0">
          {/* Top Sort and Tab Bar */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="tab-bar flex-1 min-w-[280px]">
              {(['All', 'Recommended', 'Recently Joined', 'Verified', 'Premium'] as const).map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => handleTabChange(tab)}
                  className={`tab text-xs py-2 px-3 rounded-lg ${tab === activeTab ? 'tab-active font-bold shadow' : ''}`}
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
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-text-primary font-bold text-base mb-1">No profiles match your filters</h3>
              <p className="text-text-secondary text-sm max-w-sm mx-auto">Try resetting or broadening your age, height, and community filters to see more profiles.</p>
              <button onClick={resetAllFilters} className="btn btn-primary btn-sm mt-5">Reset All Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} showMatchScore={activeTab === 'Recommended'} />
              ))}
            </div>
          )}

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-8">
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
