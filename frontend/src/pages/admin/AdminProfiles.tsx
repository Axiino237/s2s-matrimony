import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserCheck, CheckCircle2, X, Eye, Loader2, RefreshCw, User, Briefcase, GraduationCap, Users, Moon, Heart, MapPin, Phone, Mail, Award, Sparkles, Crown } from 'lucide-react';
import { adminApi } from '../../services/admin.service';
import { AiBiodataModal } from '../../components/profile/AiBiodataModal';

type ProfileRecord = {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  profileFor?: string;
  age: number;
  gender: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  heightCm?: number;
  weight?: number;
  complexion?: string;
  bodyType?: string;
  diet?: string;
  smoking?: boolean;
  drinking?: boolean;
  motherTongue?: string;
  about?: string;
  gothram?: string;
  residentStatus?: string;
  propertyDetails?: string;
  assetValue?: number;
  bankBalance?: number;
  netWorth?: number;
  membershipCategory?: 'GENERAL' | 'ELITE';
  membershipTier?: string;
  planTier?: string;
  planName?: string;
  isElite?: boolean;
  isEliteQualified?: boolean;
  eliteStatus?: 'GENERAL' | 'ELITE_QUALIFIED' | 'ELITE_NOT_QUALIFIED';
  verificationStatus: string;
  profileCompletionPercent?: number;
  createdAt: string;
  user?: { email: string; phone: string; createdAt: string };
  photos?: { id: string; url: string; isMain?: boolean }[];
  community?: { name: string };
  religion?: { name: string };
  caste?: { name: string };
  subCaste?: { name: string };
  country?: { name: string };
  state?: { name: string };
  city?: { name: string };
  education?: {
    degree?: string;
    fieldOfStudy?: string;
    college?: string;
    university?: string;
    yearCompleted?: number;
    additionalInfo?: string;
    educationMaster?: { name: string };
  };
  occupation?: {
    company?: string;
    designation?: string;
    salaryMin?: number;
    salaryMax?: number;
    workingLocation?: string;
    employmentType?: string;
    occupationMaster?: { name: string };
  };
  family?: {
    fatherName?: string;
    fatherOccupation?: string;
    fatherAlive?: boolean;
    motherName?: string;
    motherOccupation?: string;
    motherAlive?: boolean;
    brothers?: number;
    brothersMarried?: number;
    sisters?: number;
    sistersMarried?: number;
    familyType?: string;
    familyStatus?: string;
    familyValues?: string;
    nativePlace?: string;
    familyDescription?: string;
  };
  horoscope?: {
    star?: string;
    rasi?: string;
    lagnam?: string;
    gothram?: string;
    dosham?: string;
    birthTime?: string;
    birthPlace?: string;
  };
  partnerPreference?: {
    gender?: string;
    ageMin?: number;
    ageMax?: number;
    heightMin?: number;
    heightMax?: number;
    salaryMin?: number;
    aboutPartner?: string;
  };
};

const getName = (p: ProfileRecord) => `${p.firstName || ''} ${p.lastName || ''}`.trim() || (p as any).displayName || 'Member';
const getCity = (p: ProfileRecord) => p.city?.name ?? (p as any).cityName ?? '—';
const getCommunity = (p: ProfileRecord) => p.community?.name ?? (p as any).communityName ?? (p as any).caste ?? '—';
const getDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const getPhotoUrl = (p: any) => {
  if (!p) return null;
  if (p.photos && Array.isArray(p.photos) && p.photos.length > 0) {
    const first = p.photos[0];
    if (typeof first === 'string' && first.trim()) return first;
    if (first && typeof first === 'object' && first.url) return first.url;
  }
  if (p.photoUrl && typeof p.photoUrl === 'string' && p.photoUrl.trim()) return p.photoUrl;
  if (p.avatar && typeof p.avatar === 'string' && p.avatar.trim()) return p.avatar;
  if (p.photosList && Array.isArray(p.photosList) && p.photosList.length > 0) return p.photosList[0];
  return null;
};

const getFallbackAvatar = (gender?: string) =>
  gender === 'FEMALE' ? '/images/bride.png' : '/images/groom.png';

const getCategoryLabel = (p: ProfileRecord): 'Elite' | 'General' => {
  const cat = (p.membershipCategory || (p.isElite ? 'ELITE' : 'GENERAL')).toUpperCase();
  return cat === 'ELITE' ? 'Elite' : 'General';
};

const getPlanTierLabel = (p: ProfileRecord): string => {
  const t = (p.planTier || p.membershipTier || 'FREE').toUpperCase();
  switch (t) {
    case 'PLATINUM': return 'Platinum';
    case 'GOLD': return 'Gold';
    case 'SILVER': return 'Silver';
    case 'DIAMOND': return 'Diamond';
    default: return 'Free';
  }
};

const AdminProfiles = () => {
  const [searchParams] = useSearchParams();
  const initialTabParam = searchParams.get('tab');
  const [tab, setTab] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>(
    initialTabParam === 'verification' || initialTabParam === 'PENDING' ? 'PENDING' :
    initialTabParam === 'VERIFIED' ? 'VERIFIED' :
    initialTabParam === 'REJECTED' ? 'REJECTED' : 'PENDING'
  );

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'verification' || t === 'PENDING') setTab('PENDING');
    else if (t === 'VERIFIED') setTab('VERIFIED');
    else if (t === 'REJECTED') setTab('REJECTED');
  }, [searchParams]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewProfile, setViewProfile] = useState<ProfileRecord | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'basic' | 'religion' | 'education' | 'family' | 'horoscope' | 'partner'>('basic');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingProfiles(page, 10, search);
      const data = res.profiles || res.items || (Array.isArray(res) ? res : []);
      setProfiles(Array.isArray(data) ? data : []);
      setTotal(res.total || (Array.isArray(data) ? data.length : 0));
      setTotalPages(res.totalPages || Math.max(1, Math.ceil((res.total || (Array.isArray(data) ? data.length : 0)) / 10)));
    } catch {
      toast.error('Failed to load profiles from database');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const isPending = (status: string) => status === 'PENDING' || status === 'UNVERIFIED';

  const counts = {
    PENDING: profiles.filter((p) => isPending(p.verificationStatus)).length,
    VERIFIED: profiles.filter((p) => p.verificationStatus === 'VERIFIED').length,
    REJECTED: profiles.filter((p) => p.verificationStatus === 'REJECTED').length,
  };

  const visible = profiles.filter((p) => {
    if (tab === 'PENDING') return isPending(p.verificationStatus);
    return p.verificationStatus === tab;
  });

  const approve = async (id: string) => {
    try {
      await adminApi.verifyProfile(id, 'VERIFIED');
      setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, verificationStatus: 'VERIFIED' } : p));
      toast.success('Profile approved! ✅');
      if (viewProfile?.id === id) setViewProfile(null);
    } catch {
      toast.error('Failed to approve profile');
    }
  };

  const reject = async (id: string) => {
    try {
      await adminApi.verifyProfile(id, 'REJECTED');
      setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, verificationStatus: 'REJECTED' } : p));
      toast.error('Profile rejected');
      if (viewProfile?.id === id) setViewProfile(null);
    } catch {
      toast.error('Failed to reject profile');
    }
  };

  const statCards = [
    { label: 'Pending Review', val: counts.PENDING, color: 'text-amber-700' },
    { label: 'Verified', val: counts.VERIFIED, color: 'text-emerald-700' },
    { label: 'Rejected', val: counts.REJECTED, color: 'text-rose-700' },
    { label: 'Total', val: total, color: 'text-primary' },
  ];

  const [showAiModal, setShowAiModal] = useState(false);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" /> Profile Moderation & AI Entry
          </h1>
          <p className="text-text-secondary text-sm mt-1">Review, approve, and manage full member profiles with AI Extraction</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="btn btn-primary btn-sm flex items-center gap-2 font-bold shadow-md bg-gradient-primary text-white"
          >
            <Sparkles className="w-4 h-4 animate-pulse" /> AI Import Biodata
          </button>
          <button onClick={fetchProfiles} className="btn btn-ghost btn-sm text-text-muted hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.val}</p>
            <p className="text-text-muted text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['PENDING', 'VERIFIED', 'REJECTED'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-white text-primary shadow-sm border border-slate-200' : 'text-text-muted hover:text-text-primary'}`}
          >
            {t} {counts[t] > 0 && <span className="ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px]">{counts[t]}</span>}
          </button>
        ))}
      </div>

      {/* Profile Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-10 text-center text-text-muted">No profiles in this category</div>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => {
            const photo = getPhotoUrl(p);
            const fallback = getFallbackAvatar(p.gender);
            return (
              <div key={p.id} className="card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:border-primary/20 transition-all bg-white">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-sm overflow-hidden">
                    <img
                      src={photo || fallback}
                      alt={getName(p)}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-text-primary font-bold text-sm sm:text-base truncate">{getName(p)}</p>
                      <span className="text-[11px] sm:text-xs text-text-muted px-2 py-0.5 bg-slate-100 rounded-md font-mono flex-shrink-0">ID: {p.id.slice(0, 8)}</span>
                      {getCategoryLabel(p) === 'Elite' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 flex-shrink-0">
                          ✨ Elite
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                          General
                        </span>
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex-shrink-0 flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" />
                        {getPlanTierLabel(p)}
                        {p.planName && p.planName !== `${getPlanTierLabel(p)} Plan` && (
                          <span className="text-purple-400 font-normal">({p.planName})</span>
                        )}
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs sm:text-sm mt-0.5 font-medium truncate">
                      {p.age ? `${p.age} yrs • ` : ''}{p.gender} • {getCity(p)} • {getCommunity(p)}
                    </p>
                    <p className="text-text-muted text-[11px] sm:text-xs mt-1">Submitted {getDate(p.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:flex-shrink-0">
                  <button onClick={() => { setViewProfile(p); setActiveModalTab('basic'); }} className="btn bg-primary/10 text-primary hover:bg-primary/20 btn-sm text-xs flex items-center justify-center gap-1.5 font-semibold px-3 py-2 flex-1 sm:flex-initial">
                    <Eye className="w-3.5 h-3.5" /> <span>View Full Profile</span>
                  </button>
                  {isPending(p.verificationStatus) ? (
                    <>
                      <button onClick={() => approve(p.id)} className="btn py-2 px-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 flex items-center justify-center gap-1 font-semibold flex-1 sm:flex-initial">
                        <CheckCircle2 className="w-3.5 h-3.5" /> <span>Approve</span>
                      </button>
                      <button onClick={() => reject(p.id)} className="btn py-2 px-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 flex items-center justify-center gap-1 font-semibold flex-1 sm:flex-initial">
                        <X className="w-3.5 h-3.5" /> <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge text-xs self-center ${p.verificationStatus === 'VERIFIED' ? 'badge-active' : 'badge-rejected'}`}>
                        {p.verificationStatus}
                      </span>
                      {p.verificationStatus === 'VERIFIED' && (
                        <button onClick={() => reject(p.id)} className="btn py-1.5 px-2.5 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 font-semibold">
                          Reject
                        </button>
                      )}
                      {p.verificationStatus === 'REJECTED' && (
                        <button onClick={() => approve(p.id)} className="btn py-1.5 px-2.5 text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-semibold">
                          Approve
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Full Profile Modal */}
      {viewProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center font-bold text-2xl flex-shrink-0">
                  <img
                    src={getPhotoUrl(viewProfile) || getFallbackAvatar(viewProfile.gender)}
                    alt={getName(viewProfile)}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = getFallbackAvatar(viewProfile.gender); }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold font-display">{getName(viewProfile)}</h2>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${viewProfile.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                      {viewProfile.verificationStatus}
                    </span>
                    {getCategoryLabel(viewProfile) === 'Elite' ? (
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-400/25 text-amber-200 border border-amber-400/40 flex items-center gap-1">
                        ✨ Elite Member
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                        General Member
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-white/20 text-white border border-white/30 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-300" />
                      {getPlanTierLabel(viewProfile)} Plan
                      {viewProfile.planName && viewProfile.planName !== `${getPlanTierLabel(viewProfile)} Plan` && (
                        <span className="text-white/70">({viewProfile.planName})</span>
                      )}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1">
                    {viewProfile.age} Yrs • {viewProfile.gender} • {getCommunity(viewProfile)} • {getCity(viewProfile)}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewProfile(null)} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex overflow-x-auto bg-slate-100 p-2 gap-1 border-b border-slate-200 text-xs font-semibold">
              {[
                { id: 'basic', label: 'Personal & Basic', icon: User },
                { id: 'religion', label: 'Religion & Caste', icon: Award },
                { id: 'education', label: 'Education & Career', icon: Briefcase },
                { id: 'family', label: 'Family Details', icon: Users },
                { id: 'horoscope', label: 'Horoscope', icon: Moon },
                { id: 'partner', label: 'Partner Preferences', icon: Heart },
              ].map((tabItem) => {
                const Icon = tabItem.icon;
                return (
                  <button
                    key={tabItem.id}
                    onClick={() => setActiveModalTab(tabItem.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg whitespace-nowrap transition-all ${activeModalTab === tabItem.id ? 'bg-white text-primary shadow-sm font-bold border border-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                  >
                    <Icon className="w-4 h-4" /> {tabItem.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Content Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
              {/* Photo Gallery Banner */}
              {viewProfile.photos && viewProfile.photos.length > 0 && (
                <div className="card p-4 space-y-3 bg-white">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    📸 Photo Gallery ({viewProfile.photos.length})
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {viewProfile.photos.map((ph, idx) => (
                      <div key={ph.id || idx} className="relative w-24 h-28 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100">
                        <img src={ph.url} alt="Profile" className="w-full h-full object-cover" />
                        {ph.isMain && (
                          <span className="absolute top-1 left-1 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded font-bold">Main</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 1: Personal & Basic Info */}
              {activeModalTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-5 space-y-3 bg-white">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b pb-2 border-slate-100">
                      <User className="w-4 h-4" /> Personal Information
                    </h3>
                    <div className="space-y-2 text-xs">
                      {[
                        ['Full Name', getName(viewProfile)],
                        ['Profile Created For', viewProfile.profileFor || 'SELF'],
                        ['Membership Category', getCategoryLabel(viewProfile)],
                        ['Plan Tier', `${getPlanTierLabel(viewProfile)}${viewProfile.planName ? ` (${viewProfile.planName})` : ''}`],
                        ['Gender', viewProfile.gender],
                        ['Age', `${viewProfile.age} Yrs`],
                        ['Date of Birth', viewProfile.dateOfBirth ? new Date(viewProfile.dateOfBirth).toLocaleDateString() : '—'],
                        ['Marital Status', viewProfile.maritalStatus || '—'],
                        ['Mother Tongue', viewProfile.motherTongue || '—'],
                      ].map(([k, v]) => (
                        <div key={k as string} className="flex justify-between py-1.5 border-b border-slate-50">
                          <span className="text-slate-500 font-medium">{k as string}</span>
                          <span className="text-slate-900 font-semibold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card p-5 space-y-3 bg-white">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b pb-2 border-slate-100">
                      <MapPin className="w-4 h-4" /> Physical & Lifestyle Details
                    </h3>
                    <div className="space-y-2 text-xs">
                      {[
                        ['Height', viewProfile.heightCm ? `${viewProfile.heightCm} cm` : '—'],
                        ['Weight', viewProfile.weight ? `${viewProfile.weight} kg` : '—'],
                        ['Complexion', viewProfile.complexion || '—'],
                        ['Body Type', viewProfile.bodyType || '—'],
                        ['Diet', viewProfile.diet || '—'],
                        ['Smoking Habit', viewProfile.smoking ? 'Yes' : 'No'],
                        ['Drinking Habit', viewProfile.drinking ? 'Yes' : 'No'],
                        ['City / Location', viewProfile.city?.name || '—'],
                        ['State', viewProfile.state?.name || '—'],
                        ['Country', viewProfile.country?.name || '—'],
                      ].map(([k, v]) => (
                        <div key={k as string} className="flex justify-between py-1.5 border-b border-slate-50">
                          <span className="text-slate-500 font-medium">{k as string}</span>
                          <span className="text-slate-900 font-semibold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {viewProfile.about && (
                    <div className="card p-5 space-y-2 bg-white md:col-span-2">
                      <h3 className="text-sm font-bold text-slate-700">About Profile</h3>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{viewProfile.about}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Religion & Caste */}
              {activeModalTab === 'religion' && (
                <div className="card p-5 space-y-3 bg-white">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b pb-2 border-slate-100">
                    <Award className="w-4 h-4" /> Religious & Caste Background
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                    {[
                      ['Religion', viewProfile.religion?.name || '—'],
                      ['Community / Matrimony', viewProfile.community?.name || '—'],
                      ['Caste', viewProfile.caste?.name || '—'],
                      ['Sub-Caste', viewProfile.subCaste?.name || '—'],
                      ['Gothram', viewProfile.gothram || viewProfile.horoscope?.gothram || '—'],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">{k as string}</span>
                        <span className="text-slate-900 font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Education & Career */}
              {activeModalTab === 'education' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-5 space-y-3 bg-white">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b pb-2 border-slate-100">
                      <GraduationCap className="w-4 h-4" /> Education Details
                    </h3>
                    <div className="space-y-2 text-xs">
                      {[
                        ['Highest Qualification', viewProfile.education?.educationMaster?.name || '—'],
                        ['Degree', viewProfile.education?.degree || '—'],
                        ['Field of Study', viewProfile.education?.fieldOfStudy || '—'],
                        ['College / Institute', viewProfile.education?.college || '—'],
                        ['University', viewProfile.education?.university || '—'],
                        ['Year Completed', viewProfile.education?.yearCompleted || '—'],
                      ].map(([k, v]) => (
                        <div key={k as string} className="flex justify-between py-1.5 border-b border-slate-50">
                          <span className="text-slate-500 font-medium">{k as string}</span>
                          <span className="text-slate-900 font-semibold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card p-5 space-y-3 bg-white">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b pb-2 border-slate-100">
                      <Briefcase className="w-4 h-4" /> Career & Income Details
                    </h3>
                    <div className="space-y-2 text-xs">
                      {[
                        ['Occupation', viewProfile.occupation?.occupationMaster?.name || '—'],
                        ['Designation', viewProfile.occupation?.designation || '—'],
                        ['Company / Firm', viewProfile.occupation?.company || '—'],
                        ['Employment Type', viewProfile.occupation?.employmentType || '—'],
                        ['Annual Salary Range', viewProfile.occupation?.salaryMin ? ({
                          '300000': '₹2 Lakhs – ₹3 Lakhs',
                          '500000': '₹3 Lakhs – ₹5 Lakhs',
                          '800000': '₹5 Lakhs – ₹8 Lakhs',
                          '1200000': '₹8 Lakhs – ₹12 Lakhs',
                          '1800000': '₹12 Lakhs – ₹18 Lakhs',
                          '2500000': '₹18 Lakhs – ₹25 Lakhs',
                          '3500000': '₹25 Lakhs – ₹35 Lakhs',
                          '5000000': 'Above ₹35 Lakhs',
                        }[String(viewProfile.occupation.salaryMin)] || `₹${viewProfile.occupation.salaryMin.toLocaleString()}`) : '—'],
                        ['Annual Salary (Max)', viewProfile.occupation?.salaryMax ? `₹${viewProfile.occupation.salaryMax.toLocaleString()}` : '—'],
                      ].map(([k, v]) => (
                        <div key={k as string} className="flex justify-between py-1.5 border-b border-slate-50">
                          <span className="text-slate-500 font-medium">{k as string}</span>
                          <span className="text-slate-900 font-semibold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Family Details */}
              {activeModalTab === 'family' && (
                <div className="card p-5 space-y-4 bg-white">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b pb-2 border-slate-100">
                    <Users className="w-4 h-4" /> Family Background & Relatives
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                    {[
                      ['Father\'s Name', viewProfile.family?.fatherName || '—'],
                      ['Father\'s Occupation', viewProfile.family?.fatherOccupation || '—'],
                      ['Mother\'s Name', viewProfile.family?.motherName || '—'],
                      ['Mother\'s Occupation', viewProfile.family?.motherOccupation || '—'],
                      ['Brothers Count', viewProfile.family?.brothers !== undefined ? `${viewProfile.family.brothers} (${viewProfile.family.brothersMarried ?? 0} Married)` : '—'],
                      ['Sisters Count', viewProfile.family?.sisters !== undefined ? `${viewProfile.family.sisters} (${viewProfile.family.sistersMarried ?? 0} Married)` : '—'],
                      ['Family Type', viewProfile.family?.familyType || '—'],
                      ['Family Status', viewProfile.family?.familyStatus || '—'],
                      ['Family Values', viewProfile.family?.familyValues || '—'],
                      ['Native Place', viewProfile.family?.nativePlace || '—'],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">{k as string}</span>
                        <span className="text-slate-900 font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  {viewProfile.family?.familyDescription && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-slate-700">Family Description:</p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">{viewProfile.family.familyDescription}</p>
                    </div>
                  )}

                  {/* Property & Financial Assets */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Property & Financial Assets
                      </h4>
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                        Confidential Financial Data
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Resident Status</span>
                        <span className="text-slate-900 font-semibold">{viewProfile.residentStatus || '—'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Property Details</span>
                        <span className="text-slate-900 font-semibold">{viewProfile.propertyDetails || '—'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Asset Value</span>
                        <span className="text-slate-900 font-semibold">
                          {viewProfile.assetValue !== undefined && viewProfile.assetValue !== null
                            ? `₹ ${Number(viewProfile.assetValue).toLocaleString('en-IN')}`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Bank Balance</span>
                        <span className="text-slate-900 font-semibold">
                          {viewProfile.bankBalance !== undefined && viewProfile.bankBalance !== null
                            ? `₹ ${Number(viewProfile.bankBalance).toLocaleString('en-IN')}`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2.5 border-b border-slate-100 md:col-span-2 bg-emerald-50/70 px-3 rounded-lg border border-emerald-100">
                        <span className="text-emerald-800 font-bold">Net Worth</span>
                        <span className="text-emerald-700 font-extrabold text-sm">
                          {viewProfile.netWorth !== undefined && viewProfile.netWorth !== null
                            ? `₹ ${Number(viewProfile.netWorth).toLocaleString('en-IN')}`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-slate-100 md:col-span-2 bg-amber-50/70 px-3 rounded-lg border border-amber-200">
                        <div>
                          <span className="text-amber-900 font-bold block text-xs">Elite Qualification Status</span>
                          <span className="text-[11px] text-amber-700">
                            Category: {viewProfile.membershipCategory === 'ELITE' || viewProfile.isElite ? 'Elite' : 'General'}
                          </span>
                        </div>
                        <div>
                          {viewProfile.membershipCategory === 'ELITE' || viewProfile.isElite ? (
                            viewProfile.isEliteQualified || viewProfile.eliteStatus === 'ELITE_QUALIFIED' ? (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Qualified (Net Worth ≥ Threshold)
                              </span>
                            ) : (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                Not Qualified (Net Worth &lt; Threshold)
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
                </div>
              )}

              {/* TAB 5: Horoscope Details */}
              {activeModalTab === 'horoscope' && (
                <div className="card p-5 space-y-3 bg-white">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b pb-2 border-slate-100">
                    <Moon className="w-4 h-4" /> Horoscope & Astrological Info
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                    {[
                      ['Star (Nakshatra)', viewProfile.horoscope?.star || '—'],
                      ['Rasi (Moon Sign)', viewProfile.horoscope?.rasi || '—'],
                      ['Lagnam (Ascendant)', viewProfile.horoscope?.lagnam || '—'],
                      ['Gothram', viewProfile.horoscope?.gothram || viewProfile.gothram || '—'],
                      ['Dosham Details', viewProfile.horoscope?.dosham || 'No Dosham / Not Specified'],
                      ['Birth Time', viewProfile.horoscope?.birthTime || '—'],
                      ['Birth Place', viewProfile.horoscope?.birthPlace || '—'],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">{k as string}</span>
                        <span className="text-slate-900 font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: Partner Preferences */}
              {activeModalTab === 'partner' && (
                <div className="card p-5 space-y-3 bg-white">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2 border-b pb-2 border-slate-100">
                    <Heart className="w-4 h-4" /> Partner Preferences & Expectations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                    {[
                      ['Preferred Gender', viewProfile.partnerPreference?.gender || '—'],
                      ['Preferred Age Range', viewProfile.partnerPreference?.ageMin ? `${viewProfile.partnerPreference.ageMin} - ${viewProfile.partnerPreference.ageMax ?? 45} Yrs` : '—'],
                      ['Preferred Height Range', viewProfile.partnerPreference?.heightMin ? `${viewProfile.partnerPreference.heightMin} - ${viewProfile.partnerPreference.heightMax ?? 200} cm` : '—'],
                      ['Minimum Expected Salary', viewProfile.partnerPreference?.salaryMin ? `₹${viewProfile.partnerPreference.salaryMin.toLocaleString()}` : '—'],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">{k as string}</span>
                        <span className="text-slate-900 font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  {viewProfile.partnerPreference?.aboutPartner && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-slate-700">Partner Expectation Description:</p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">{viewProfile.partnerPreference.aboutPartner}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Account Contact Bar */}
              <div className="card p-4 bg-slate-900 text-white flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-amber-400" /> {viewProfile.user?.email || '—'}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> {viewProfile.user?.phone || '—'}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Profile Completion: <span className="text-amber-300 font-bold">{viewProfile.profileCompletionPercent || 100}%</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex gap-3 items-center justify-end">
              {isPending(viewProfile.verificationStatus) ? (
                <>
                  <button onClick={() => approve(viewProfile.id)} className="btn btn-sm px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> Approve Profile
                  </button>
                  <button onClick={() => reject(viewProfile.id)} className="btn btn-sm px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm">
                    <X className="w-4 h-4" /> Reject Profile
                  </button>
                </>
              ) : viewProfile.verificationStatus === 'VERIFIED' ? (
                <button onClick={() => reject(viewProfile.id)} className="btn btn-sm px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm">
                  <X className="w-4 h-4" /> Reject Profile
                </button>
              ) : (
                <button onClick={() => approve(viewProfile.id)} className="btn btn-sm px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Approve Profile
                </button>
              )}
              <button onClick={() => setViewProfile(null)} className="btn btn-ghost btn-sm px-4 text-slate-600 hover:text-slate-900 font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Biodata Extraction Modal */}
      <AiBiodataModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyExtracted={() => {
          toast.success('✨ AI extracted biodata fields successfully! Profile pre-populated for Admin management.');
        }}
      />
    </div>
  );
};

export default AdminProfiles;
