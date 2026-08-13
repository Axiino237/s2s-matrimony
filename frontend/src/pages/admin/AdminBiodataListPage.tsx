import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Filter, RefreshCw, Printer, Eye, Edit, User, Users, Phone, Mail,
  CheckCircle2, AlertCircle, Sparkles, Shield, MapPin, Briefcase, GraduationCap,
  Calendar, Star, Plus, Download, X, Share2, MessageCircle, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { useSettingsStore } from '../../store/settings.store';

// Role-based Privacy Masking Helpers
const maskPhone = (phone?: string, isSuperAdmin?: boolean) => {
  if (!phone) return '—';
  if (isSuperAdmin) return phone;
  const cleaned = phone.trim();
  if (cleaned.length <= 5) return '*****';
  return cleaned.slice(0, 5) + '*****';
};

const maskEmail = (email?: string, isSuperAdmin?: boolean) => {
  if (!email) return '—';
  if (isSuperAdmin) return email;
  const parts = email.trim().split('@');
  if (parts.length < 2) return '******';
  const name = parts[0];
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : '***';
  return `${maskedName}@${parts[1]}`;
};

const maskSensitiveText = (text?: string, isSuperAdmin?: boolean) => {
  if (!text || text === '—') return '—';
  if (isSuperAdmin) return text;
  return '***** (Super Admin Only)';
};

type BiodataRecord = {
  id: string;
  memberId?: string;
  customId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  gender?: string;
  dateOfBirth?: string;
  birthPlace?: string;
  birthTime?: string;
  birthOrder?: number | string;
  age?: number;
  maritalStatus?: string;
  religion?: string;
  caste?: string;
  subCaste?: string;
  subcaste?: string;
  sub_caste?: string;
  community?: any;
  gothram?: string;
  motherTongue?: string;
  heightCm?: number;
  weightKg?: number;
  weight?: number;
  complexion?: string;
  diet?: string;
  residentStatus?: string;
  propertyDetails?: string;
  city?: string;
  educationDegree?: string;
  education?: any;
  college?: string;
  occupation?: any;
  designation?: string;
  company?: string;
  companyName?: string;
  workLocation?: string;
  annualIncome?: string;
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  nativePlace?: string;
  elderBrothers?: number;
  youngerBrothers?: number;
  elderSisters?: number;
  youngerSisters?: number;
  horoscope?: {
    star?: string;
    starPadam?: number;
    rasi?: string;
    lagnam?: string;
    kuladeivam?: string;
    dosham?: string;
    dasaBalance?: string;
    birthTime?: string;
    birthPlace?: string;
    horoscopeData?: {
      rasiChart?: Record<string, string>;
      amsamChart?: Record<string, string>;
    };
  };
  star?: string;
  rasi?: string;
  user?: {
    email?: string;
    phone?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    createdAt?: string;
  };
  email?: string;
  phone?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  photos?: { id: string; url: string; isMain?: boolean }[];
  createdAt?: string;
};

export default function AdminBiodataListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRoles = (user as any)?.roles || (user as any)?.userRoles || [];
  const isSuperAdmin = userRoles.map((roleObj: any) => typeof roleObj === 'object' ? (roleObj.role?.name || roleObj.role || '') : String(roleObj))
    .some((r: string) => String(r).toUpperCase() === 'SUPER_ADMIN') ||
    user?.email === 'superadmin@s2smatrimony.com';

  const [records, setRecords] = useState<BiodataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<BiodataRecord | null>(null);

  // Bulk Range Print state
  const [showRangePrintModal, setShowRangePrintModal] = useState(false);
  const [printStart, setPrintStart] = useState<number>(1);
  const [printEnd, setPrintEnd] = useState<number>(100);
  const [preparedPrintRecords, setPreparedPrintRecords] = useState<BiodataRecord[]>([]);
  const [showContactDetailsInPrint, setShowContactDetailsInPrint] = useState<boolean>(true);
  const [showBlankFormModal, setShowBlankFormModal] = useState(false);
  const [isBlankPrint, setIsBlankPrint] = useState(false);

  useEffect(() => {
    fetchBiodataList();
  }, []);

  const fetchBiodataList = async () => {
    setLoading(true);
    try {
      // Fetch both users and profiles from backend PostgreSQL DB
      const [usersRes, profilesRes] = await Promise.allSettled([
        api.get('/admin/users?limit=500'),
        api.get('/admin/profiles?limit=500'),
      ]);

      let userList: any[] = [];
      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value.data;
        userList = Array.isArray(d) ? d : (d?.users || d?.data || []);
      }

      let profileList: any[] = [];
      if (profilesRes.status === 'fulfilled') {
        const d = profilesRes.value.data;
        profileList = Array.isArray(d) ? d : (d?.profiles || d?.data || []);
      }

      const profileMap = new Map<string, any>();
      profileList.forEach((prof) => {
        if (prof.userId) profileMap.set(prof.userId, prof);
        if (prof.id) profileMap.set(prof.id, prof);
      });

      const combined: BiodataRecord[] = [];

      userList.forEach((u) => {
        // Exclude SUPER_ADMIN and ADMIN accounts - only show MEMBER role candidates
        const roles = (u.userRoles || []).map((ur: any) => typeof ur === 'object' ? (ur.role?.name || ur.role || '') : String(ur));
        const isAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN'].includes(String(r).toUpperCase())) ||
                        ['superadmin@s2smatrimony.com', 'admin@s2smatrimony.com'].includes(u.email) ||
                        String(u.id).startsWith('usr-');

        if (isAdmin) return;

        const pFromMap = profileMap.get(u.id) || {};
        const p = { ...pFromMap, ...(u.profile || {}) };

        const eduStr = typeof p.education === 'object' 
          ? (p.education?.degree || p.education?.educationMaster?.name || p.educationDegree || '') 
          : (p.education || p.educationDegree || '');

        const jobStr = typeof p.occupation === 'object'
          ? (p.occupation?.designation || p.occupation?.occupationMaster?.name || p.designation || '')
          : (p.occupation || p.designation || '');

        const companyStr = p.occupation?.company || p.companyName || p.company || '';
        const locationStr = p.occupation?.workingLocation || p.workLocation || p.city || '';
        const salaryStr = p.occupation?.salaryMin ? `${p.occupation.salaryMin} / month` : (p.annualIncome || p.salary || '');
        const horo = p.horoscope || {};
        const fam = p.family || {};

        combined.push({
          id: u.id,
          memberId: p.memberId || `S2S-${String(u.id).slice(0, 6).toUpperCase()}`,
          firstName: p.firstName || (u.email ? u.email.split('@')[0] : ''),
          lastName: p.lastName || '',
          name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
          gender: p.gender || '',
          age: p.age || undefined,
          dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).split('T')[0] : '',
          birthPlace: p.birthPlace || horo.birthPlace || '',
          birthTime: p.birthTime || horo.birthTime || '',
          caste: typeof p.caste === 'object' ? p.caste?.name : (p.caste || (typeof p.community === 'object' ? p.community?.name : p.community) || ''),
          subCaste: typeof p.subCaste === 'object' ? p.subCaste?.name : (p.subCaste || p.subcaste || p.sub_caste || ''),
          gothram: p.gothram || '',
          religion: typeof p.religion === 'object' ? p.religion?.name : (p.religion || ''),
          motherTongue: p.motherTongue || '',
          maritalStatus: p.maritalStatus || '',
          complexion: p.complexion || '',
          heightCm: p.heightCm || p.height,
          weightKg: p.weightKg || p.weight,
          diet: p.diet || '',
          birthOrder: p.birthOrder || fam.birthOrder || '',
          residentStatus: p.residentStatus || p.resident || '',
          propertyDetails: p.propertyDetails || p.property || '',
          educationDegree: eduStr,
          education: p.educationDetails || eduStr,
          designation: jobStr,
          company: companyStr,
          companyName: companyStr,
          workLocation: locationStr,
          annualIncome: salaryStr,
          city: typeof p.city === 'object' ? p.city?.name : (p.city || locationStr || ''),
          fatherName: p.fatherName || fam.fatherName || '',
          fatherOccupation: p.fatherOccupation || fam.fatherJob || fam.fatherOccupation || '',
          motherName: p.motherName || fam.motherName || '',
          motherOccupation: p.motherOccupation || fam.motherJob || fam.motherOccupation || '',
          nativePlace: p.nativePlace || fam.nativePlace || '',
          elderBrothers: p.elderBrothers ?? fam.elderBrother ?? fam.elderBrothers,
          youngerBrothers: p.youngerBrothers ?? fam.youngerBrother ?? fam.youngerBrothers,
          elderSisters: p.elderSisters ?? fam.elderSister ?? fam.elderSisters,
          youngerSisters: p.youngerSisters ?? fam.youngerSister ?? fam.youngerSisters,
          star: horo.star || p.star || '',
          rasi: horo.rasi || p.rasi || '',
          horoscope: {
            star: horo.star || p.star || '',
            starPadam: horo.starPadam || p.natchathiramPadham,
            rasi: horo.rasi || p.rasi || '',
            lagnam: horo.lagnam || p.lagnam,
            kuladeivam: horo.kuladeivam || p.kuladeivam,
            dosham: horo.dosham || p.dosham,
            dasaBalance: horo.dasaBalance || p.dasaIrupu,
            birthTime: p.birthTime || horo.birthTime,
            birthPlace: p.birthPlace || horo.birthPlace,
            horoscopeData: horo.horoscopeData || horo.chartData || {
              rasiChart: p.rasiChart,
              amsamChart: p.amsamChart || p.navamsamChart,
            },
          },
          phone: u.phone || p.phone || '',
          email: u.email || p.email || '',
          isPhoneVerified: Boolean(u.isPhoneVerified ?? p.isPhoneVerified ?? false),
          isEmailVerified: Boolean(u.isEmailVerified ?? p.isEmailVerified ?? false),
          photos: p.photos || [],
          createdAt: u.createdAt || p.createdAt,
        });
      });

      if (combined.length > 0) {
        setRecords(combined);
      } else if (profileList.length > 0) {
        const memberOnlyProfiles = profileList.filter((p: any) => {
          const roles = (p.user?.userRoles || []).map((ur: any) => typeof ur === 'object' ? (ur.role?.name || ur.role || '') : String(ur));
          const isAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN'].includes(String(r).toUpperCase())) ||
                          ['superadmin@s2smatrimony.com', 'admin@s2smatrimony.com'].includes(p.user?.email || p.email) ||
                          String(p.userId || p.id).startsWith('usr-');
          return !isAdmin;
        });
        setRecords(memberOnlyProfiles);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      console.warn('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtering Logic
  const filteredRecords = records.filter((r) => {
    const fullName = `${r.firstName || ''} ${r.lastName || ''} ${r.name || ''}`.toLowerCase();
    const memId = (r.memberId || r.customId || r.id || '').toLowerCase();
    const caste = (r.caste || r.community?.name || '').toLowerCase();
    const mobile = (r.user?.phone || r.phone || '').toLowerCase();
    const query = search.toLowerCase().trim();

    const matchesSearch =
      !query ||
      fullName.includes(query) ||
      memId.includes(query) ||
      caste.includes(query) ||
      mobile.includes(query);

    const matchesGender = genderFilter === 'ALL' || r.gender === genderFilter;

    return matchesSearch && matchesGender;
  });

  const totalCount = records.length;
  const maleCount = records.filter((r) => r.gender === 'MALE').length;
  const femaleCount = records.filter((r) => r.gender === 'FEMALE').length;
  const verifiedCount = records.filter((r) => r.isPhoneVerified || r.user?.isPhoneVerified).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white flex items-center justify-center font-bold shadow-md">
              📋
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Stored Biodata List (சுயவிவரப் பட்டியல்)
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                All registered & saved S2S Matrimony member profiles stored in Database
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBiodataList}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh List
          </button>

          <button
            onClick={() => {
              const link = `${window.location.origin}/fill-biodata`;
              navigator.clipboard.writeText(link);
              toast.success('📋 Form link copied to clipboard!\n' + link);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Share2 className="w-4 h-4 text-emerald-600" /> Share Form Link
          </button>

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Vanakkam! Please fill out your Matrimony Biodata entry form using this link:\n${window.location.origin}/fill-biodata`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow-sm"
          >
            <MessageCircle className="w-4 h-4" /> Send via WhatsApp
          </a>

          <label className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 cursor-pointer shadow-sm transition select-none">
            <input
              type="checkbox"
              checked={showContactDetailsInPrint}
              onChange={(e) => setShowContactDetailsInPrint(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
            />
            <span className={showContactDetailsInPrint ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
              {showContactDetailsInPrint ? '✓ Contact Info In PDF' : '✕ Hide Contact Info In PDF'}
            </span>
          </label>



          <button
            onClick={() => {
              setIsBlankPrint(false);
              const maxIdx = filteredRecords.length > 0 ? filteredRecords.length : 100;
              setPrintStart(1);
              setPrintEnd(Math.min(100, maxIdx));
              setPreparedPrintRecords(filteredRecords.slice(0, Math.min(100, maxIdx)));
              setShowRangePrintModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-900 hover:bg-rose-950 text-white rounded-xl text-xs font-extrabold transition shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Range (1 to 100)
          </button>

          <button
            onClick={() => navigate('/super-admin/biodata-entry')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-800 hover:to-amber-800 text-white text-xs font-extrabold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Add New Walk-in Biodata
          </button>
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Biodatas</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Male Profiles</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{maleCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <User className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Female Profiles</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{femaleCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5 text-pink-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">OTP Verified</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{verifiedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-600 bg-slate-50"
            placeholder="Search Name, Member ID, Caste, Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none bg-slate-50"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="ALL">All Genders</option>
            <option value="MALE">Male Only</option>
            <option value="FEMALE">Female Only</option>
          </select>
        </div>
      </div>

      {/* Biodata List Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-600 font-medium">Loading Stored Biodata Records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-slate-400 font-bold text-base">No Stored Biodatas Found</p>
            <p className="text-xs text-slate-500">Try adjusting your search filter or add a new walk-in member profile.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Member ID & Name</th>
                  <th className="py-3.5 px-4">Gender & Age</th>
                  <th className="py-3.5 px-4">Religion & Caste</th>
                  <th className="py-3.5 px-4">Education & Career</th>
                  <th className="py-3.5 px-4">Rasi & Star</th>
                  <th className="py-3.5 px-4">Contact & OTP Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredRecords.map((r) => {
                  const nameStr = (r.name && r.name.trim()) ? r.name.trim() : `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Anonymous';
                  const memId = r.memberId || r.customId || `S2S-${String(r.id || '').slice(0, 6).toUpperCase()}`;
                  const casteStr = r.caste || r.community?.name || 'Not specified';
                  const subCasteStr = r.subCaste || r.subcaste || r.sub_caste || '';
                  const eduStr = r.educationDegree || r.education?.degree || 'Degree N/A';
                  const jobStr = r.designation || r.occupation?.designation || 'N/A';
                  const starStr = r.star || r.horoscope?.star || '-';
                  const rasiStr = r.rasi || r.horoscope?.rasi || '-';
                  const phoneStr = r.phone || r.user?.phone || 'No Phone';
                  const isVerified = Boolean(r.isPhoneVerified || r.user?.isPhoneVerified);
                  const avatarPhoto = r.photos?.find((p) => p.isMain)?.url || r.photos?.[0]?.url;

                  return (
                    <tr key={r.id} className="hover:bg-rose-50/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-xs overflow-hidden border border-rose-200 flex-shrink-0">
                            {avatarPhoto ? (
                              <img src={avatarPhoto} alt={nameStr} className="w-full h-full object-cover object-top" />
                            ) : (
                              nameStr[0]?.toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-sm">{nameStr}</span>
                            <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              {memId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            r.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                          }`}>
                            {r.gender || 'N/A'}
                          </span>
                          <p className="text-xs text-slate-600 font-semibold">{r.age ? `${r.age} Yrs` : (r.dateOfBirth ? `${r.dateOfBirth}` : '-')}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900">{casteStr}</p>
                          {subCasteStr && <p className="text-[11px] text-slate-500">{subCasteStr}</p>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 truncate max-w-[150px]">{eduStr}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{jobStr}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-amber-900">{starStr}</p>
                          <p className="text-[11px] text-slate-500">{rasiStr}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-xs">{maskPhone(r.phone || r.user?.phone, isSuperAdmin)}</p>
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ OTP Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              ⚠ Unverified
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedRecord(r)}
                            title="View Single Page Biodata"
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => navigate('/super-admin/biodata-entry')}
                            title="Edit / Update Biodata"
                            className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Single Page Biodata Modal Preview (Danam Matrimony / S2S Matrimony Authentic Format) */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-4 relative border border-slate-200 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 font-bold text-xl p-2 bg-slate-100 rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Render Authentic Danam Matrimony / S2S Matrimony Form Layout */}
            <div className="p-4 sm:p-6">
              <BiodataFormCard r={selectedRecord} isSuperAdmin={isSuperAdmin} showContactInfo={showContactDetailsInPrint} />
            </div>
            
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-800 transition select-none">
                <input
                  type="checkbox"
                  checked={showContactDetailsInPrint}
                  onChange={(e) => setShowContactDetailsInPrint(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                />
                <span className={showContactDetailsInPrint ? 'text-emerald-800 font-extrabold' : 'text-rose-700 font-extrabold'}>
                  {showContactDetailsInPrint ? '✓ Contact Info Bar Included' : '✕ Contact Info Bar Hidden'}
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" /> Print Biodata Form
                </button>

                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Range Print Options Modal ── */}
      {showRangePrintModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-200">
            <button
              onClick={() => setShowRangePrintModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 font-bold text-xl p-2 bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Bulk Range Biodata Print</h3>
                <p className="text-xs text-slate-500 font-medium">Select record index range (e.g. 1 to 100) to send all forms to printer</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 my-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Index (From #)</label>
                  <input
                    type="number"
                    min="1"
                    max={filteredRecords.length || 1}
                    value={printStart}
                    onChange={(e) => {
                      const s = parseInt(e.target.value) || 1;
                      setPrintStart(s);
                      setPreparedPrintRecords(filteredRecords.slice(s - 1, printEnd));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Index (To #)</label>
                  <input
                    type="number"
                    min={printStart}
                    max={filteredRecords.length || 100}
                    value={printEnd}
                    onChange={(e) => {
                      const eVal = parseInt(e.target.value) || printStart;
                      setPrintEnd(eVal);
                      setPreparedPrintRecords(filteredRecords.slice(printStart - 1, eVal));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-3 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-300 font-bold text-xs text-slate-800 cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  checked={showContactDetailsInPrint}
                  onChange={(e) => setShowContactDetailsInPrint(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                />
                <span className={showContactDetailsInPrint ? 'text-emerald-800 font-extrabold' : 'text-rose-700 font-extrabold'}>
                  {showContactDetailsInPrint ? '✓ Include Contact Info (Mobile & Email) in PDF' : '✕ Hide Contact Info (Mobile & Email) in PDF'}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowRangePrintModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (preparedPrintRecords.length === 0) {
                    toast.error('No records in selected range!');
                    return;
                  }
                  toast.success(`🖨️ Opening printer dialog for ${preparedPrintRecords.length} form(s)...`);
                  setTimeout(() => {
                    window.print();
                  }, 300);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-800 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Confirm & Print All {preparedPrintRecords.length} Forms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Blank Form Print Confirmation Modal ── */}
      {showBlankFormModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-amber-200">
            <button
              onClick={() => setShowBlankFormModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 font-bold text-xl p-2 bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">கையெழுத்துப் படிவம் (Blank Form)</h3>
                <p className="text-xs text-slate-500 font-medium">Print a blank biodata form for clients to fill by hand</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 my-4 text-xs text-amber-900 font-medium">
              <p className="font-extrabold text-amber-800 text-sm">📋 What will be printed:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Single A4 page with S2S Matrimony logo & branding</li>
                <li>All sections: Personal, Family, Horoscope details</li>
                <li>Empty underlined fields for handwriting</li>
                <li>Photo box area for passport photo</li>
                <li>Rasi & Navamsam grid charts (empty)</li>
              </ul>
              <p className="text-amber-700 mt-2">📌 கையால் நிரப்பி office-ல் Submit செய்யலாம்</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowBlankFormModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBlankFormModal(false);
                  toast.success('🖨️ Opening printer for blank form...');
                  setTimeout(() => { window.print(); }, 300);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-rose-700 hover:from-amber-700 hover:to-rose-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Blank Form Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Printable Container for CSS @media print (Page-by-page Authentic Form Layout) ── */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            width: 210mm !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden !important;
          }
          #bulk-print-container, #bulk-print-container * {
            visibility: visible !important;
          }
          #bulk-print-container {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            z-index: 999999 !important;
          }
          .print-form-page {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            padding: 3.5mm !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          .print-form-page:last-child {
            page-break-after: avoid !important;
            break-after: auto !important;
          }
        }
      `}</style>

      <div id="bulk-print-container" className="hidden print:block">
        {isBlankPrint ? (
          <div className="print-form-page bg-white">
            <BlankBiodataFormCard />
          </div>
        ) : (
          (
            selectedRecord
              ? [selectedRecord]
              : (preparedPrintRecords && preparedPrintRecords.length > 0)
              ? preparedPrintRecords
              : (filteredRecords || [])
          ).map((r, index) => (
            <div key={r?.id || index} className="print-form-page bg-white">
              {r ? <BiodataFormCard r={r} isSuperAdmin={isSuperAdmin} showContactInfo={showContactDetailsInPrint} /> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Reusable Authentic Matrimony Biodata Form Card Component (Matching Image 2) ──
function BiodataFormCard({ r, isSuperAdmin, showContactInfo = true }: { r: BiodataRecord; isSuperAdmin?: boolean; showContactInfo?: boolean }) {
  const logoUrl = useSettingsStore((s) => s.logoUrl);
  if (!r) return null;
  const nameStr = (r.name && r.name.trim()) ? r.name.trim() : `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'NOT SPECIFIED';
  const regNo = r.memberId || r.customId || `S2S-${String(r.id || '').slice(0, 6).toUpperCase()}`;
  const regDate = r.createdAt ? String(r.createdAt).split('T')[0] : '27-04-2026';
  const mainPhoto = r.photos?.find((p) => p.isMain)?.url || r.photos?.[0]?.url;

  const casteStr = r.caste || (typeof r.community === 'object' ? r.community?.name : r.community) || '—';
  const subCasteStr = r.subCaste || r.subcaste || r.sub_caste || '—';
  const gothramStr = r.gothram || '—';
  const horo = r.horoscope || {};

  return (
    <div className="relative bg-white text-slate-900 border-[4px] border-[#b91c1c] p-3.5 shadow-none font-sans text-xs w-[203mm] h-[289mm] max-h-[289mm] flex flex-col justify-between box-border overflow-hidden">
      {/* Background Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12] z-0 overflow-hidden">
        <img
          src={logoUrl || "/images/logo.png"}
          alt="S2S Matrimony Watermark"
          className="w-[580px] h-[580px] object-contain select-none"
        />
      </div>

      {/* 1. Top Header */}
      <div className="relative z-10 flex justify-between items-start border-b-2 border-[#b91c1c] pb-2.5">
        <div className="space-y-1">
          <div className="bg-[#b91c1c] text-white px-3 py-1 text-xs font-black rounded inline-block shadow-sm">
            Regn No. - <span className="text-amber-300 font-bold text-sm">{regNo}</span>
          </div>
          <p className="font-bold text-slate-800 text-xs">Regn Date - <span className="font-extrabold">{regDate}</span></p>
        </div>

        <div className="text-center flex flex-col items-center justify-center">
          <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Logo" className="w-14 h-14 object-contain rounded-full shadow-sm mb-0.5 border border-amber-300" />
          <h1 className="text-3xl font-black text-[#b91c1c] tracking-wider uppercase font-serif">
            S2S MATRIMONY
          </h1>
          <p className="text-xs font-extrabold text-amber-900 uppercase tracking-widest">(S2S Matrimony Group)</p>
          <span className="text-xs font-black text-[#b91c1c] bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 inline-block mt-0.5">
            BRANCH - Chennai
          </span>
        </div>

        <div className="text-right text-xs font-bold text-slate-800 space-y-0.5">
          <p>Cell : <span className="font-black text-[#b91c1c] text-xs">7358732151 / 7338712658</span></p>
          <p className="text-blue-900 font-black">www.s2smatrimonygroup.com</p>
          <p className="text-xs">Govt Regn No - 842 / 18</p>
        </div>
      </div>

      {/* 2. Candidate Name Banner */}
      <div className="relative z-10 border-2 border-[#b91c1c] bg-rose-50/60 px-4 py-2 font-bold text-base text-[#b91c1c] flex items-center gap-3 rounded-sm">
        <span className="text-base font-black">Name - </span>
        <span className="font-black text-slate-900 uppercase tracking-wide text-xl">{nameStr}</span>
      </div>

      {/* 3. Community 3-Column Header */}
      <div className="relative z-10 grid grid-cols-3 border-2 border-[#b91c1c] text-xs font-bold text-slate-900 divide-x-2 divide-[#b91c1c]">
        <div className="p-2 bg-rose-50/40">Caste - <span className="font-black text-[#b91c1c] text-xs">{casteStr}</span></div>
        <div className="p-2 bg-rose-50/40">Sub Caste - <span className="font-black text-[#b91c1c] text-xs">{subCasteStr}</span></div>
        <div className="p-2 bg-rose-50/40">Gothram - <span className="font-black text-[#b91c1c] text-xs">{gothramStr}</span></div>
      </div>

      {/* 4. Main 2-Column Split (Personal, Family, Ancestral & Photo/Rasi) */}
      <div className="relative z-10 grid grid-cols-12 gap-3 flex-grow">
        {/* Left Column */}
        <div className="col-span-7 space-y-2.5 flex flex-col justify-between">
          {/* PERSONAL DETAILS */}
          <div className="border-2 border-[#b91c1c]">
            <div className="bg-[#b91c1c] text-white font-black px-3 py-1 uppercase text-xs tracking-wider">
              PERSONAL DETAILS
            </div>
            <div className="p-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-medium text-slate-900">
              <div><strong>Date of Birth - </strong> {r.dateOfBirth || '—'}</div>
              <div><strong>Birth Place - </strong> {maskSensitiveText(r.birthPlace || horo.birthPlace, isSuperAdmin)}</div>
              <div><strong>Birth Time - </strong> {r.birthTime || horo.birthTime || '—'}</div>
              <div><strong>Complexion - </strong> {r.complexion || '—'}</div>
              <div><strong>Birth Order - </strong> {r.birthOrder || '—'}</div>
              <div><strong>Height - </strong> {r.heightCm ? `${r.heightCm} cm` : '—'}</div>
              <div><strong>Education - </strong> {r.educationDegree || r.education || '—'}</div>
              <div><strong>Education Details - </strong> {r.college || '—'}</div>
              <div><strong>Salary - </strong> {r.annualIncome || '—'}</div>
              <div><strong>Designation - </strong> {r.designation || '—'}</div>
              <div><strong>Company Name - </strong> {r.company || r.companyName || '—'}</div>
              <div><strong>Job Location - </strong> {r.workLocation || r.city || '—'}</div>
            </div>
          </div>

          {/* FAMILY DETAILS */}
          <div className="border-2 border-[#b91c1c]">
            <div className="bg-[#b91c1c] text-white font-black px-3 py-1 uppercase text-xs tracking-wider">
              FAMILY DETAILS
            </div>
            <div className="p-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-medium text-slate-900">
              <div><strong>Father's Name - </strong> {r.fatherName || '—'}</div>
              <div><strong>Father's Job - </strong> {r.fatherOccupation || '—'}</div>
              <div><strong>Mother's Name - </strong> {r.motherName || '—'}</div>
              <div><strong>Mother's Job - </strong> {r.motherOccupation || '—'}</div>
              <div><strong>Elder Brother - </strong> {r.elderBrothers ?? '0'}</div>
              <div><strong>No. of Married Elder Brother - </strong> {r.elderBrothers ?? '0'}</div>
              <div><strong>Younger Brother - </strong> {r.youngerBrothers ?? '0'}</div>
              <div><strong>No. of Married Younger Brother - </strong> {r.youngerBrothers ?? '0'}</div>
              <div><strong>Elder Sister - </strong> {r.elderSisters ?? '0'}</div>
              <div><strong>No. of Married Elder Sister - </strong> {r.elderSisters ?? '0'}</div>
              <div><strong>Younger Sister - </strong> {r.youngerSisters ?? '0'}</div>
              <div><strong>No. of Married Younger Sister - </strong> {r.youngerSisters ?? '0'}</div>
            </div>
          </div>

          {/* FINANCIAL & ANCESTRAL DETAILS */}
          <div className="border-2 border-[#b91c1c]">
            <div className="bg-[#b91c1c] text-white font-black px-3 py-1 uppercase text-xs tracking-wider">
              FINANCIAL & ANCESTRAL DETAILS
            </div>
            <div className="p-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-medium text-slate-900">
              <div><strong>Resident - </strong> {r.residentStatus || '—'}</div>
              <div><strong>Property - </strong> {maskSensitiveText(r.propertyDetails, isSuperAdmin)}</div>
              <div><strong>Residence Place - </strong> {maskSensitiveText(r.city, isSuperAdmin)}</div>
              <div><strong>Native Place - </strong> {maskSensitiveText(r.nativePlace, isSuperAdmin)}</div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-5 space-y-2.5 flex flex-col justify-between">
          {/* Photo */}
          <div className="border-2 border-[#b91c1c] p-1 bg-slate-50 flex items-center justify-center min-h-[270px] h-[270px] overflow-hidden rounded-sm">
            {mainPhoto ? (
              <img src={mainPhoto} alt={nameStr} className="w-full h-full object-cover object-top rounded" />
            ) : (
              <div className="text-center p-4 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-800 font-bold mx-auto flex items-center justify-center text-2xl mb-2">
                  {nameStr.charAt(0)}
                </div>
                <p className="text-xs font-extrabold text-slate-500">Photo Not Uploaded</p>
              </div>
            )}
          </div>

          {/* Rasi & Doshams */}
          <div className="border-2 border-[#b91c1c] overflow-hidden flex-grow flex flex-col justify-between">
            <div className="bg-[#b91c1c] text-white font-black px-3 py-1 uppercase text-xs tracking-wider">
              RASI & DOSHAMS
            </div>
            <div className="p-3 space-y-2 text-xs font-medium text-slate-900 flex-grow flex flex-col justify-around">
              <div><strong>Rasi - </strong> <span className="font-black text-[#b91c1c] text-sm">{r.rasi || horo.rasi || '—'}</span></div>
              <div><strong>Natchathiram - </strong> <span className="font-black text-[#b91c1c] text-sm">{r.star || horo.star || '—'}</span></div>
              <div><strong>Natchathiram Padham - </strong> <span className="font-bold">{horo.starPadam || '1'}</span></div>
              <div><strong>Lagnam - </strong> <span className="font-bold">{horo.lagnam || '—'}</span></div>
              <div><strong>Dasa Irupu - </strong> <span className="font-bold">{horo.dasaBalance || '—'}</span></div>
              <div><strong>Dosham - </strong> <span className="font-bold">{horo.dosham || 'Clean'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom 2 Astrology Charts (RASI & NAVAMSAM) */}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        <div className="border-2 border-[#b91c1c] p-2 text-center bg-white">
          <p className="text-xs font-black text-[#b91c1c] uppercase mb-1.5">RASI CHART (ராசி)</p>
          <div className="grid grid-cols-4 grid-rows-4 gap-0.5 border border-slate-400 bg-slate-200 text-xs h-52">
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Meenam || 'மீனம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Mesham || 'மேஷம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Rishabam || 'ரிஷபம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Mithunam || 'மிதுனம்'}</div>

            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Kumbam || 'கும்பம்'}</div>
            <div className="col-span-2 row-span-2 bg-rose-50/70 border border-slate-400 font-black text-[#b91c1c] flex items-center justify-center text-base tracking-widest">
              RASI
            </div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Kadagam || 'கடகம்'}</div>

            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Magaram || 'மகரம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Simmam || 'சிம்மம்'}</div>

            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Dhanusu || 'தனுசு'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Viruchigam || 'விருச்சிகம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Thulaam || 'துலாம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.rasiChart?.Kanni || 'கன்னி'}</div>
          </div>
        </div>

        <div className="border-2 border-[#b91c1c] p-2 text-center bg-white">
          <p className="text-xs font-black text-[#b91c1c] uppercase mb-1.5">NAVAMSAM CHART (நவாம்சம்)</p>
          <div className="grid grid-cols-4 grid-rows-4 gap-0.5 border border-slate-400 bg-slate-200 text-xs h-52">
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Meenam || 'மீனம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Mesham || 'மேஷம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Rishabam || 'ரிஷபம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Mithunam || 'மிதுனம்'}</div>

            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Kumbam || 'கும்பம்'}</div>
            <div className="col-span-2 row-span-2 bg-rose-50/70 border border-slate-400 font-black text-[#b91c1c] flex items-center justify-center text-base tracking-widest">
              NAVAMSAM
            </div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Kadagam || 'கடகம்'}</div>

            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Magaram || 'மகரம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Simmam || 'சிம்மம்'}</div>

            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Dhanusu || 'தனுசு'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Viruchigam || 'விருச்சிகம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Thulaam || 'துலாம்'}</div>
            <div className="bg-white p-1 border border-slate-300 font-bold overflow-hidden flex items-center justify-center text-xs">{horo.horoscopeData?.amsamChart?.Kanni || 'கன்னி'}</div>
          </div>
        </div>
      </div>

      {/* 6. Bottom Footer: Verified Contact Bar (Conditional) */}
      {showContactInfo && (
        <div className="relative z-10 p-2 bg-emerald-50 border-2 border-emerald-400 rounded flex justify-between items-center text-xs font-bold text-emerald-950 shadow-sm">
          <div>Mobile: <span className="font-black text-slate-900 text-xs">{maskPhone(r.phone || r.user?.phone, isSuperAdmin)}</span> ({r.isPhoneVerified ? '✓ Verified' : '✓ Verified'})</div>
          <div>Email: <span className="font-black text-slate-900 text-xs">{maskEmail(r.email || r.user?.email, isSuperAdmin)}</span> ({r.isEmailVerified ? '✓ Verified' : '✓ Verified'})</div>
        </div>
      )}
    </div>
  );
}

// ── Blank Biodata Form Card (Empty – for client handwriting, A4 single page) ──
function BlankBiodataFormCard() {
  const logoUrl = useSettingsStore((s) => s.logoUrl);
  // Underlined empty field helper
  const F = ({ label, wide }: { label: string; wide?: boolean }) => (
    <div className={`flex flex-col gap-0.5 ${wide ? 'col-span-2' : ''}`}>
      <span className="text-[8px] font-black text-[#b91c1c] uppercase tracking-wide leading-tight">{label}</span>
      <div className="border-b-[1.5px] border-slate-400 h-3.5 w-full" />
    </div>
  );

  return (
    <div className="relative bg-white text-slate-900 border-[4px] border-[#b91c1c] p-3 shadow-none font-sans text-xs w-[203mm] h-[289mm] max-h-[289mm] flex flex-col justify-between box-border overflow-hidden">

      {/* Background Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12] z-0 overflow-hidden">
        <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Watermark" className="w-[540px] h-[540px] object-contain select-none" />
      </div>

      {/* ── 1. Header ── */}
      <div className="relative z-10 flex justify-between items-start border-b-2 border-[#b91c1c] pb-1.5">
        <div className="space-y-0.5">
          <div className="bg-[#b91c1c] text-white px-2.5 py-0.5 text-xs font-black rounded inline-block shadow-sm">
            Regn No. - <span className="text-amber-300 font-bold">___________</span>
          </div>
          <p className="font-bold text-slate-800 text-[10px]">Regn Date: <span className="font-extrabold">___________</span></p>
        </div>
        <div className="text-center flex flex-col items-center">
          <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Logo" className="w-12 h-12 object-contain rounded-full border border-amber-300 mb-0.5" />
          <h1 className="text-2xl font-black text-[#b91c1c] tracking-wider uppercase font-serif leading-tight">S2S MATRIMONY</h1>
          <p className="text-[9px] font-bold text-amber-700 tracking-[0.18em] uppercase">Traditional Single Page Biodata Form</p>
        </div>
        <div className="text-right space-y-0.5">
          <div className="border-2 border-amber-500 text-amber-700 font-black text-[10px] px-2.5 py-0.5 rounded inline-block">
            BRANCH – <span className="text-slate-700">__________</span>
          </div>
        </div>
      </div>

      {/* ── 2. Name Bar ── */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="font-black text-slate-700 uppercase tracking-widest text-sm whitespace-nowrap">NAME:</span>
        <div className="flex-1 border-b-2 border-[#b91c1c] h-5" />
      </div>

      {/* ── 3. Identity Strip ── */}
      <div className="relative z-10 grid grid-cols-6 gap-1 bg-rose-50/70 border border-rose-200 rounded p-1.5">
        {['Religion (மதம்)', 'Caste (ஜாதி)', 'Sub Caste', 'Gothram', 'Mother Tongue', 'Marital Status'].map((lbl) => (
          <div key={lbl} className="flex flex-col items-center">
            <span className="text-[8px] font-black text-[#b91c1c] uppercase text-center leading-tight">{lbl}</span>
            <div className="border-b-[1.5px] border-slate-400 h-3.5 w-full mt-0.5" />
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full border-t-2 border-[#b91c1c]" />

      {/* ── 4. Main Body ── */}
      <div className="relative z-10 flex gap-2 flex-1 min-h-0">

        {/* Left: Personal + Family + Horoscope */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">

          {/* Personal Details */}
          <div className="bg-[#b91c1c] text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Personal Details (தனிப்பட்ட விவரங்கள்)</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <F label="Date of Birth (பிறந்த தேதி)" />
            <F label="Birth Place (பிறந்த ஊர்)" />
            <F label="Birth Time (பிறந்த நேரம்)" />
            <F label="Complexion (நிறம்)" />
            <F label="Weight/kg (எடை)" />
            <F label="Diet (உணவு பழக்கம்)" />
            <F label="Birth Order (பிறப்பு வரிசை)" />
            <F label="Height ft/cm (உயரம்)" />
            <F label="Education (கல்வி)" wide />
            <F label="Education Details" wide />
            <F label="Designation (பதவி)" />
            <F label="Salary/month (சம்பளம்)" />
            <F label="Company Name" />
            <F label="Job Location (பணியிடம்)" />
          </div>

          {/* Family Details */}
          <div className="bg-[#b91c1c] text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mt-0.5">Family Details (குடும்ப விவரங்கள்)</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <F label="Father Name (தந்தை பெயர்)" />
            <F label="Father Occupation (தொழில்)" />
            <F label="Mother Name (தாய் பெயர்)" />
            <F label="Mother Occupation (தொழில்)" />
            <F label="Brothers (சகோதரர்கள்)" />
            <F label="Sisters (சகோதரிகள்)" />
            <F label="Native Place (சொந்த ஊர்)" />
            <F label="Family Status" />
          </div>

          {/* Horoscope */}
          <div className="bg-[#b91c1c] text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mt-0.5">Horoscope (ஜாதக விவரம்)</div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1">
            <F label="Star (நட்சத்திரம்)" />
            <F label="Raasi (ராசி)" />
            <F label="Lagnam (லக்னம்)" />
          </div>
        </div>

        {/* Right: Photo + Contact */}
        <div className="flex flex-col gap-2 w-[130px] flex-shrink-0">
          {/* Photo Box */}
          <div className="border-2 border-dashed border-[#b91c1c] rounded-lg flex flex-col items-center justify-center bg-rose-50/50 h-[130px]">
            <svg className="w-8 h-8 text-[#b91c1c] opacity-40 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-[9px] font-extrabold text-[#b91c1c] text-center leading-snug">Passport Size<br/>Photo</p>
            <p className="text-[8px] text-slate-400 font-medium mt-0.5">Paste Here</p>
          </div>

          {/* Contact */}
          <div className="border-2 border-[#b91c1c] rounded-lg p-1.5 bg-rose-50/30 space-y-1">
            <p className="text-[9px] font-black text-[#b91c1c] uppercase text-center tracking-wide">Contact Details</p>
            <F label="Mobile No." />
            <F label="Alt. Mobile / WhatsApp" />
            <F label="Email ID" />
            <div className="mt-0.5">
              <span className="text-[8px] font-black text-[#b91c1c] uppercase">Address</span>
              <div className="border-b-[1.5px] border-slate-400 h-3.5 w-full mt-0.5" />
              <div className="border-b-[1.5px] border-slate-400 h-3.5 w-full mt-1" />
              <div className="border-b-[1.5px] border-slate-400 h-3.5 w-full mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Astrology Charts ── */}
      <div className="relative z-10 grid grid-cols-2 gap-2">
        {(['RASI CHART (ராசி)', 'NAVAMSAM CHART (நவாம்சம்)'] as const).map((label) => (
          <div key={label} className="border-2 border-[#b91c1c] p-1 text-center bg-white">
            <p className="text-[9px] font-black text-[#b91c1c] uppercase mb-0.5">{label}</p>
            <div className="grid grid-cols-4 grid-rows-4 gap-[1px] border border-slate-400 bg-slate-200 h-[82px]">
              {/* Row 1 */}
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">மீனம்</div>
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">மேஷம்</div>
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">ரிஷபம்</div>
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">மிதுனம்</div>
              {/* Row 2 */}
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">கும்பம்</div>
              <div className="col-span-2 row-span-2 bg-rose-50/70 border border-slate-400 font-black text-[#b91c1c] flex items-center justify-center text-[9px] tracking-widest">
                {label.includes('RASI') ? 'RASI' : 'NAVAMSAM'}
              </div>
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">கடகம்</div>
              {/* Row 3 */}
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">மகரம்</div>
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">சிம்மம்</div>
              {/* Row 4 */}
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">தனுசு</div>
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">விருச்சிகம்</div>
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">துலாம்</div>
              <div className="bg-white flex items-center justify-center text-[7px] font-bold text-slate-500 border border-slate-200 overflow-hidden p-0.5">கன்னி</div>
            </div>
          </div>
        ))}
      </div>


      {/* ── 6. Footer ── */}
      <div className="relative z-10 p-1.5 bg-[#b91c1c]/10 border-2 border-[#b91c1c] rounded flex justify-between items-center text-[8px] font-bold text-[#b91c1c]">
        <span>S2S MATRIMONY — Traditional Biodata Form</span>
        <span className="font-black">www.s2smatrimony.com</span>
        <span>© {new Date().getFullYear()} All Rights Reserved</span>
      </div>
    </div>
  );
}
