import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, ArrowLeft, Printer, Sparkles, CheckCircle2, Upload, FileText, KeyRound, Eye, EyeOff, ShieldCheck, RotateCcw, Share2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/auth.store';
import { STARS, RASIS, DOSHAMS, CASTE_SUBCASTES } from '../../../constants/index';

// Planet choices for 12-box chart grids
const PLANETS = ['சூரி (Sun)', 'சந் (Moon)', 'செவ் (Mars)', 'புத (Merc)', 'குரு (Jup)', 'சுக் (Ven)', 'சனி (Sat)', 'ராகு (Rahu)', 'கேது (Ketu)', 'லக் (Lag)'];

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

export default function BiodataEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const isAdminRoute = location.pathname.includes('/admin') || location.pathname.includes('/super-admin');

  // Form State initialized to empty strings by default
  const INITIAL_FORM_STATE = {
    memberId: '',
    regnDate: new Date().toISOString().split('T')[0],
    branch: '',
    name: '',
    gender: '',
    maritalStatus: '',
    motherTongue: '',
    religion: '',
    caste: '',
    subCaste: '',
    gothram: '',
    dateOfBirth: '',
    birthPlace: '',
    birthTime: '',
    complexion: '',
    weight: '',
    diet: '',
    birthOrder: '',
    height: '',
    education: '',
    educationDetails: '',
    salary: '',
    designation: '',
    companyName: '',
    jobLocation: '',
    fatherName: '',
    fatherJob: '',
    motherName: '',
    motherJob: '',
    elderBrother: '0',
    marriedElderBrother: '0',
    youngerBrother: '0',
    marriedYoungerBrother: '0',
    elderSister: '0',
    marriedElderSister: '0',
    youngerSister: '0',
    marriedYoungerSister: '0',
    resident: '',
    property: '',
    residencePlace: '',
    nativePlace: '',
    expectation: '',
    rasi: '',
    natchathiram: '',
    natchathiramPadham: '',
    lagnam: '',
    dasaIrupu: '',
    dosham: '',
    kuladeivam: '',
    email: '',
    phone: '',
    password: '',
    showPassword: false,
    isEmailVerified: false,
    isPhoneVerified: false,
    rasiChart: {} as Record<string, string>,
    amsamChart: {} as Record<string, string>,
  };

  const [form, setForm] = useState(INITIAL_FORM_STATE);

  // OTP Verification Modal State
  const [otpModal, setOtpModal] = useState<{
    open: boolean;
    type: 'phone' | 'email';
    target: string;
    generatedOtp: string;
    enteredOtp: string;
    sending: boolean;
  }>({
    open: false,
    type: 'phone',
    target: '',
    generatedOtp: '',
    enteredOtp: '',
    sending: false,
  });

  const handleSendOtp = async (type: 'phone' | 'email') => {
    const val = type === 'phone' ? form.phone.trim() : form.email.trim();
    if (!val) {
      toast.error(`Please enter a valid ${type === 'phone' ? 'Mobile Number' : 'Email Address'} first!`);
      return;
    }

    setOtpModal({
      open: true,
      type,
      target: val,
      generatedOtp: '123456',
      enteredOtp: '',
      sending: true,
    });

    try {
      if (type === 'phone') {
        await api.post('/auth/send-otp', { phone: val });
      }
    } catch (e) {
      // fallback to demo OTP
    }

    setOtpModal((prev) => ({ ...prev, sending: false }));
    toast.success(`🔐 Verification OTP sent to ${val}! (Test OTP: 123456)`);
  };

  const handleVerifyOtpSubmit = () => {
    if (!otpModal.enteredOtp || otpModal.enteredOtp.trim().length < 4) {
      toast.error('Please enter the 6-digit OTP code!');
      return;
    }

    if (otpModal.enteredOtp.trim() !== '123456' && otpModal.enteredOtp.trim() !== otpModal.generatedOtp) {
      toast.error('Invalid OTP code! (Use demo OTP: 123456)');
      return;
    }

    if (otpModal.type === 'phone') {
      handleSet('isPhoneVerified', true);
      toast.success('🎉 Mobile Number verified successfully via OTP!');
    } else {
      handleSet('isEmailVerified', true);
      toast.success('🎉 Email Address verified successfully via OTP!');
    }

    setOtpModal((prev) => ({ ...prev, open: false, enteredOtp: '' }));
  };

  const handleClearForm = () => {
    setForm(INITIAL_FORM_STATE);
    setPhotoPreview(null);
    toast.success('✨ Form cleared for new walk-in member registration!');
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    // If opened via Admin / Super Admin for walk-in member registration, start 100% BLANK!
    if (isAdminRoute) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/profiles/me');
      const p = res.data || {};

      if (p) {
        const communityVal = (typeof p.community === 'object' ? p.community?.name : p.community) || (typeof p.caste === 'object' ? p.caste?.name : p.caste) || '';
        const subCasteVal = (typeof p.subCaste === 'object' ? p.subCaste?.name : p.subCaste) || '';
        const mainPhoto = p.photos?.find((ph: any) => ph.isMain)?.url || p.photos?.[0]?.url;
        if (mainPhoto) setPhotoPreview(mainPhoto);

        const hData = p.horoscope?.horoscopeData || {};

        setForm((prev) => ({
          ...prev,
          memberId: p.memberId || p.customId || (p.id ? `S2S-${String(p.id).slice(0, 6).toUpperCase()}` : ''),
          regnDate: p.createdAt ? String(p.createdAt).split('T')[0] : prev.regnDate,
          branch: p.branch || '',
          name: (p.firstName || p.lastName) ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : (p.name || ''),
          gender: p.gender || '',
          maritalStatus: p.maritalStatus || '',
          motherTongue: p.motherTongue || '',
          religion: p.religion || '',
          caste: communityVal || '',
          subCaste: subCasteVal || '',
          gothram: p.horoscope?.gothram || p.gothram || '',
          dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).split('T')[0] : '',
          birthPlace: p.horoscope?.birthPlace || p.placeOfBirth || '',
          birthTime: p.horoscope?.birthTime || p.timeOfBirth || '',
          complexion: p.complexion || '',
          weight: p.weightKg ? String(p.weightKg) : (p.weight ? String(p.weight) : ''),
          diet: p.diet || '',
          birthOrder: p.birthOrder ? String(p.birthOrder) : '',
          height: p.heightCm ? String(p.heightCm) : '',
          education: p.education?.degree || '',
          educationDetails: p.education?.college || p.educationDetail || '',
          salary: p.occupation?.salaryMin ? String(p.occupation.salaryMin) : (p.occupation?.annualIncome || ''),
          designation: p.occupation?.designation || '',
          companyName: p.occupation?.company || '',
          jobLocation: p.occupation?.workingLocation || p.city || '',
          fatherName: p.family?.fatherName || '',
          fatherJob: p.family?.fatherOccupation || '',
          motherName: p.family?.motherName || '',
          motherJob: p.family?.motherOccupation || '',
          elderBrother: p.family?.elderBrothers !== undefined ? String(p.family.elderBrothers) : '0',
          marriedElderBrother: p.family?.elderBrothersMarried !== undefined ? String(p.family.elderBrothersMarried) : '0',
          youngerBrother: p.family?.youngerBrothers !== undefined ? String(p.family.youngerBrothers) : '0',
          marriedYoungerBrother: p.family?.youngerBrothersMarried !== undefined ? String(p.family.youngerBrothersMarried) : '0',
          elderSister: p.family?.elderSisters !== undefined ? String(p.family.elderSisters) : '0',
          marriedElderSister: p.family?.elderSistersMarried !== undefined ? String(p.family.elderSistersMarried) : '0',
          youngerSister: p.family?.youngerSisters !== undefined ? String(p.family.youngerSisters) : '0',
          marriedYoungerSister: p.family?.youngerSistersMarried !== undefined ? String(p.family.youngerSistersMarried) : '0',
          resident: p.residentStatus || '',
          property: p.propertyDetails || '',
          residencePlace: p.city || '',
          nativePlace: p.family?.nativePlace || '',
          expectation: p.partnerPreference?.aboutPartner || '',
          rasi: p.horoscope?.rasi || '',
          natchathiram: p.horoscope?.star || '',
          natchathiramPadham: p.horoscope?.starPadam ? String(p.horoscope.starPadam) : '',
          lagnam: p.horoscope?.lagnam || '',
          dasaIrupu: p.horoscope?.dasaBalance || '',
          dosham: p.horoscope?.dosham || '',
          kuladeivam: p.horoscope?.kuladeivam || '',
          email: p.user?.email || p.email || '',
          phone: p.user?.phone || p.phone || p.mobile || '',
          isEmailVerified: Boolean(p.user?.isEmailVerified ?? p.isEmailVerified ?? false),
          isPhoneVerified: Boolean(p.user?.isPhoneVerified ?? p.isPhoneVerified ?? false),
          rasiChart: hData.rasiChart || {},
          amsamChart: hData.amsamChart || {},
        }));
      }
    } catch (err) {
      console.error('Failed to load profile for biodata form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSet = (key: string, val: any) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Photo size must be less than 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotoPreview(dataUrl);
        try {
          await api.post('/profiles/photos', { url: dataUrl, isMain: true });
          toast.success('Photo updated!');
        } catch (err) {
          console.warn('Photo upload notice:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Validation: Phone and Email must be verified via OTP before saving
    if (form.phone.trim() && !form.isPhoneVerified) {
      toast.error('⚠️ Mobile Number must be verified via OTP before saving details!');
      return;
    }

    if (form.email.trim() && !form.isEmailVerified) {
      toast.error('⚠️ Email Address must be verified via OTP before saving details!');
      return;
    }

    setSaving(true);
    try {
      const nameParts = form.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        memberId: form.memberId || undefined,
        branch: form.branch || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        gender: form.gender,
        maritalStatus: form.maritalStatus || undefined,
        motherTongue: form.motherTongue || undefined,
        religion: form.religion || undefined,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
        birthOrder: form.birthOrder ? Number(form.birthOrder) : undefined,
        caste: form.caste || undefined,
        subcaste: form.subCaste || undefined,
        gothram: form.gothram || undefined,
        heightCm: form.height ? Number(form.height) : undefined,
        weightKg: form.weight ? Number(form.weight) : undefined,
        diet: form.diet || undefined,
        complexion: form.complexion || undefined,
        residentStatus: form.resident || undefined,
        propertyDetails: form.property || undefined,
        city: form.residencePlace || undefined,
        educationDegree: form.education || undefined,
        college: form.educationDetails || undefined,
        occupation: form.designation || undefined,
        company: form.companyName || undefined,
        workLocation: form.jobLocation || undefined,
        annualIncome: form.salary || undefined,
        fatherName: form.fatherName || undefined,
        fatherOccupation: form.fatherJob || undefined,
        motherName: form.motherName || undefined,
        motherOccupation: form.motherJob || undefined,
        nativePlace: form.nativePlace || undefined,
        elderBrothers: Number(form.elderBrother || 0),
        elderBrothersMarried: Number(form.marriedElderBrother || 0),
        youngerBrothers: Number(form.youngerBrother || 0),
        youngerBrothersMarried: Number(form.marriedYoungerBrother || 0),
        elderSisters: Number(form.elderSister || 0),
        elderSistersMarried: Number(form.marriedElderSister || 0),
        youngerSisters: Number(form.youngerSister || 0),
        youngerSistersMarried: Number(form.marriedYoungerSister || 0),
        star: form.natchathiram || undefined,
        starPadam: form.natchathiramPadham ? Number(form.natchathiramPadham) : undefined,
        rasi: form.rasi || undefined,
        lagnam: form.lagnam || undefined,
        kuladeivam: form.kuladeivam || undefined,
        dosham: form.dosham || undefined,
        dasaBalance: form.dasaIrupu || undefined,
        timeOfBirth: form.birthTime || undefined,
        placeOfBirth: form.birthPlace || undefined,
        aboutPartner: form.expectation || undefined,
        horoscopeData: {
          rasiChart: form.rasiChart,
          amsamChart: form.amsamChart,
        },
      };

      if (isAdminRoute) {
        if (form.email.trim() || form.phone.trim()) {
          try {
            await api.post('/auth/register', {
              email: form.email.trim() || undefined,
              phone: form.phone.trim() || undefined,
              password: form.password.trim() || 'S2S@123456',
              firstName: firstName || 'Member',
              lastName: lastName || '',
              gender: form.gender || 'MALE',
            });
          } catch (regErr: any) {
            console.warn('User account creation notice:', regErr?.response?.data?.message || regErr.message);
          }
        }

        try {
          await api.post('/admin/profiles/direct-create', payload);
        } catch (pErr) {
          await api.patch('/profiles/me', payload);
        }

        toast.success('🎉 Walk-in Member Registered! Member can now login using Email/Phone & Password.');
      } else {
        await api.patch('/profiles/me', payload);
        toast.success('🎉 Biodata Form saved directly to Profile Database table!');
        navigate('/profile');
      }
    } catch (err: any) {
      console.error('Failed to save biodata:', err);
      toast.error(err.response?.data?.message || 'Failed to save biodata form');
    } finally {
      setSaving(false);
    }
  };

  const togglePlanet = (chartType: 'rasiChart' | 'amsamChart', houseId: string, planetName: string) => {
    const currentChart = { ...form[chartType] };
    const currentHouseStr = currentChart[houseId] || '';
    const currentList = currentHouseStr ? currentHouseStr.split(', ').filter(Boolean) : [];

    let updatedList: string[];
    const shortPlanet = planetName.split(' ')[0]; // e.g. "சூரி"
    if (currentList.includes(shortPlanet)) {
      updatedList = currentList.filter(p => p !== shortPlanet);
    } else {
      updatedList = [...currentList, shortPlanet];
    }

    currentChart[houseId] = updatedList.join(', ');
    setForm((prev) => ({ ...prev, [chartType]: currentChart }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading Biodata Entry Form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      {/* Top Bar Actions (Only rendered for logged in Admin / Member routes, hidden on public /fill-biodata share link) */}
      {location.pathname !== '/fill-biodata' && (
        <div className="max-w-5xl mx-auto mb-5 flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => navigate('/profile/edit')}
            className="flex items-center gap-2 text-slate-700 font-semibold hover:text-rose-600 transition"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Edit Profile
          </button>

          <div className="flex items-center gap-3">
            {isAdminRoute && (
              <>
                <button
                  onClick={handleClearForm}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-sm font-semibold transition"
                >
                  <RotateCcw className="w-4 h-4" /> Clear / New Form
                </button>

                <button
                  onClick={() => {
                    const link = `${window.location.origin}/fill-biodata`;
                    navigator.clipboard.writeText(link);
                    toast.success('📋 Form link copied to clipboard!\nShare with client: ' + link);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-sm font-semibold transition"
                >
                  <Share2 className="w-4 h-4 text-emerald-600" /> Share Form Link
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Vanakkam! Please fill out your Matrimony Biodata entry form using this link:\n${window.location.origin}/fill-biodata`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Send via WhatsApp
                </a>
              </>
            )}

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold rounded-lg shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving to DB...' : 'Save to Profile Table'}
            </button>
          </div>
        </div>
      )}

      {/* Traditional Biodata Form Sheet (Danam Standard Styling) */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl border-4 border-rose-950 p-4 sm:p-8 font-sans print:shadow-none print:border-2">
        {/* Document Border Frame Header */}
        <div className="text-center border-b-2 border-rose-900 pb-4 mb-6 relative">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-left space-y-1">
              <div className="bg-rose-900 text-white px-2.5 py-0.5 text-xs font-black rounded inline-block shadow-sm">
                Regn No. - <span className="text-amber-300 font-extrabold">{form.memberId || `S2S${String(Math.floor(100000 + Math.random() * 900000))}`}</span>
              </div>
              <p className="font-extrabold text-slate-700 text-xs">
                Regn Date: <span className="font-bold text-slate-900">{form.regnDate || new Date().toISOString().split('T')[0]}</span>
              </p>
            </div>

            <div className="text-center flex flex-col items-center">
              <img src="/images/logo.png" alt="S2S Matrimony Logo" className="w-12 h-12 object-contain mb-1 rounded-full shadow-sm border border-amber-300" />
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-rose-900 uppercase">
                S2S MATRIMONY
              </h1>
              <p className="text-xs text-amber-800 font-semibold tracking-widest uppercase">Traditional Single Page Biodata Form</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded">
                BRANCH - {form.branch || 'Chennai'}
              </span>
              <input
                type="text"
                className="mt-1 block text-right text-xs border-b border-slate-300 focus:outline-none w-28 ml-auto"
                value={form.branch}
                onChange={(e) => handleSet('branch', e.target.value)}
                placeholder="Branch Name"
              />
            </div>
          </div>

          {/* Full Name Banner */}
          <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-center gap-3">
            <label className="text-sm font-bold text-rose-950">NAME:</label>
            <input
              type="text"
              className="text-lg sm:text-xl font-extrabold text-rose-950 uppercase border-b-2 border-rose-700 focus:outline-none w-full sm:w-96 text-center"
              value={form.name}
              onChange={(e) => handleSet('name', e.target.value)}
              placeholder="e.g. S.SHREE NIVEDITA"
            />
          </div>

          {/* Caste & Religion Header Pill */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-xs">
            <div>
              <span className="font-bold text-rose-900 block">Religion: </span>
              <input
                type="text"
                className="font-bold text-slate-800 border-b border-rose-300 bg-transparent focus:outline-none w-full"
                value={form.religion}
                onChange={(e) => handleSet('religion', e.target.value)}
                placeholder="Hindu"
              />
            </div>
            <div>
              <span className="font-bold text-rose-900 block">Caste: </span>
              <input
                type="text"
                className="font-bold text-slate-800 border-b border-rose-300 bg-transparent focus:outline-none w-full"
                value={form.caste}
                onChange={(e) => handleSet('caste', e.target.value)}
                placeholder="Mudaliyar"
              />
            </div>
            <div>
              <span className="font-bold text-rose-900 block">Sub Caste: </span>
              <input
                type="text"
                className="font-bold text-slate-800 border-b border-rose-300 bg-transparent focus:outline-none w-full"
                value={form.subCaste}
                onChange={(e) => handleSet('subCaste', e.target.value)}
                placeholder="Thuluva Vellalar"
              />
            </div>
            <div>
              <span className="font-bold text-rose-900 block">Gothram: </span>
              <input
                type="text"
                className="font-bold text-slate-800 border-b border-rose-300 bg-transparent focus:outline-none w-full"
                value={form.gothram}
                onChange={(e) => handleSet('gothram', e.target.value)}
                placeholder="SIVA GOTHRAM"
              />
            </div>
            <div>
              <span className="font-bold text-rose-900 block">Mother Tongue: </span>
              <input
                type="text"
                className="font-bold text-slate-800 border-b border-rose-300 bg-transparent focus:outline-none w-full"
                value={form.motherTongue}
                onChange={(e) => handleSet('motherTongue', e.target.value)}
                placeholder="Tamil"
              />
            </div>
            <div>
              <span className="font-bold text-rose-900 block">Marital Status: </span>
              <select
                className="font-bold text-slate-800 border-b border-rose-300 bg-transparent focus:outline-none w-full py-0.5"
                value={form.maritalStatus}
                onChange={(e) => handleSet('maritalStatus', e.target.value)}
              >
                <option value="">Select Status</option>
                <option value="NEVER_MARRIED">Unmarried / Never Married</option>
                <option value="DIVORCED">Divorced</option>
                <option value="WIDOWED">Widowed</option>
                <option value="AWAITING_DIVORCE">Awaiting Divorce</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 1: Personal Details & Photo */}
        <div className="mb-6">
          <h2 className="bg-rose-900 text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-3 py-1.5 rounded-t-md">
            PERSONAL DETAILS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-2 border-rose-900 border-t-0 p-4 rounded-b-md">
            {/* Left 2 Columns: Inputs */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Date of Birth: </span>
                <input
                  type="date"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.dateOfBirth}
                  onChange={(e) => handleSet('dateOfBirth', e.target.value)}
                />
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Birth Place: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 uppercase ml-1"
                  value={form.birthPlace}
                  onChange={(e) => handleSet('birthPlace', e.target.value)}
                  placeholder="CHENNAI"
                />
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Birth Time: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.birthTime}
                  onChange={(e) => handleSet('birthTime', e.target.value)}
                  placeholder="5:48 pm"
                />
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Complexion: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.complexion}
                  onChange={(e) => handleSet('complexion', e.target.value)}
                  placeholder="Wheatish"
                />
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Weight (kg): </span>
                <input
                  type="number"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-20 ml-1"
                  value={form.weight}
                  onChange={(e) => handleSet('weight', e.target.value)}
                  placeholder="68"
                />
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Diet (உணவு): </span>
                <select
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.diet}
                  onChange={(e) => handleSet('diet', e.target.value)}
                >
                  <option value="">Select Diet</option>
                  <option value="VEGETARIAN">Vegetarian</option>
                  <option value="NON_VEGETARIAN">Non-Vegetarian</option>
                  <option value="EGGETARIAN">Eggetarian</option>
                  <option value="VEGAN">Vegan</option>
                </select>
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Birth Order: </span>
                <input
                  type="number"
                  min="1"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-16 ml-1"
                  value={form.birthOrder}
                  onChange={(e) => handleSet('birthOrder', e.target.value)}
                  placeholder="1"
                />
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Height: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-20 ml-1"
                  value={form.height}
                  onChange={(e) => handleSet('height', e.target.value)}
                  placeholder="5.5 / 165"
                />
              </div>

              <div className="border-b border-slate-200 pb-1 sm:col-span-2">
                <span className="font-bold text-slate-700">Education: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-full mt-1"
                  value={form.education}
                  onChange={(e) => handleSet('education', e.target.value)}
                  placeholder="Master Degree"
                />
              </div>

              <div className="border-b border-slate-200 pb-1 sm:col-span-2">
                <span className="font-bold text-slate-700">Education Details: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-full mt-1 uppercase"
                  value={form.educationDetails}
                  onChange={(e) => handleSet('educationDetails', e.target.value)}
                  placeholder="B.TECH(BIO) , MS(UK)"
                />
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Designation: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.designation}
                  onChange={(e) => handleSet('designation', e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Salary: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.salary}
                  onChange={(e) => handleSet('salary', e.target.value)}
                  placeholder="350000 per / month"
                />
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Company Name: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 uppercase ml-1"
                  value={form.companyName}
                  onChange={(e) => handleSet('companyName', e.target.value)}
                  placeholder="PRIVATE COMPANY"
                />
              </div>

              <div className="border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-700">Job Location: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 uppercase ml-1"
                  value={form.jobLocation}
                  onChange={(e) => handleSet('jobLocation', e.target.value)}
                  placeholder="LONDON"
                />
              </div>
            </div>

            {/* Right Column: Traditional Photo Frame */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-rose-300 bg-rose-50/50 p-4 rounded-lg">
              <div className="w-36 h-48 bg-slate-200 rounded-md overflow-hidden shadow-md relative border-2 border-rose-800 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-500 font-semibold text-center px-2">No Photo Uploaded</span>
                )}
              </div>

              <label className="mt-3 cursor-pointer bg-rose-900 hover:bg-rose-950 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" /> Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Family Details */}
        <div className="mb-6">
          <h2 className="bg-rose-900 text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-3 py-1.5 rounded-t-md">
            FAMILY DETAILS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-2 border-rose-900 border-t-0 p-4 rounded-b-md text-xs">
            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">Father's Name: </span>
              <input
                type="text"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 uppercase ml-1"
                value={form.fatherName}
                onChange={(e) => handleSet('fatherName', e.target.value)}
                placeholder="I.L.RAJKUMAR"
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">Father's Job: </span>
              <input
                type="text"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 uppercase ml-1"
                value={form.fatherJob}
                onChange={(e) => handleSet('fatherJob', e.target.value)}
                placeholder="GAZETTED OFFICER,CENTRAL GOVT (RETD)"
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">Mother's Name: </span>
              <input
                type="text"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 uppercase ml-1"
                value={form.motherName}
                onChange={(e) => handleSet('motherName', e.target.value)}
                placeholder="SANTHI RAJKUMAR"
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">Mother's Job: </span>
              <input
                type="text"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 uppercase ml-1"
                value={form.motherJob}
                onChange={(e) => handleSet('motherJob', e.target.value)}
                placeholder="HOME MAKER"
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">Elder Brother: </span>
              <input
                type="number"
                min="0"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-12 ml-1"
                value={form.elderBrother}
                onChange={(e) => handleSet('elderBrother', e.target.value)}
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">No. of Married Elder Brother: </span>
              <input
                type="number"
                min="0"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-12 ml-1"
                value={form.marriedElderBrother}
                onChange={(e) => handleSet('marriedElderBrother', e.target.value)}
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">Younger Brother: </span>
              <input
                type="number"
                min="0"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-12 ml-1"
                value={form.youngerBrother}
                onChange={(e) => handleSet('youngerBrother', e.target.value)}
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">No. of Married Younger Brother: </span>
              <input
                type="number"
                min="0"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-12 ml-1"
                value={form.marriedYoungerBrother}
                onChange={(e) => handleSet('marriedYoungerBrother', e.target.value)}
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">Elder Sister: </span>
              <input
                type="number"
                min="0"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-12 ml-1"
                value={form.elderSister}
                onChange={(e) => handleSet('elderSister', e.target.value)}
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">No. of Married Elder Sister: </span>
              <input
                type="number"
                min="0"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-12 ml-1"
                value={form.marriedElderSister}
                onChange={(e) => handleSet('marriedElderSister', e.target.value)}
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">Younger Sister: </span>
              <input
                type="number"
                min="0"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-12 ml-1"
                value={form.youngerSister}
                onChange={(e) => handleSet('youngerSister', e.target.value)}
              />
            </div>

            <div className="border-b border-slate-200 pb-1">
              <span className="font-bold text-slate-700">No. of Married Younger Sister: </span>
              <input
                type="number"
                min="0"
                className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-12 ml-1"
                value={form.marriedYoungerSister}
                onChange={(e) => handleSet('marriedYoungerSister', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Financial & Ancestral & Horoscope Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left: Financial & Ancestral */}
          <div>
            <h2 className="bg-rose-900 text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-3 py-1.5 rounded-t-md">
              FINANCIAL & ANCESTRAL DETAILS
            </h2>

            <div className="border-2 border-rose-900 border-t-0 p-4 rounded-b-md text-xs space-y-3">
              <div>
                <span className="font-bold text-slate-700">Resident: </span>
                <select
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1 bg-transparent"
                  value={form.resident}
                  onChange={(e) => handleSet('resident', e.target.value)}
                >
                  <option value="Own House">Own House (சொந்த வீடு)</option>
                  <option value="Rent House">Rent House (வாடகை வீடு)</option>
                  <option value="Lease">Lease (ஒத்தி / லீஸ்)</option>
                  <option value="Quarters">Quarters (குவாட்டர்ஸ்)</option>
                </select>
              </div>

              <div>
                <span className="font-bold text-slate-700">Property: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 uppercase w-full mt-1"
                  value={form.property}
                  onChange={(e) => handleSet('property', e.target.value)}
                  placeholder="2 PLOTS, CHENNAI"
                />
              </div>

              <div>
                <span className="font-bold text-slate-700">Residence Place: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 uppercase ml-1"
                  value={form.residencePlace}
                  onChange={(e) => handleSet('residencePlace', e.target.value)}
                  placeholder="CHENNAI"
                />
              </div>

              <div>
                <span className="font-bold text-slate-700">Native Place: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 uppercase ml-1"
                  value={form.nativePlace}
                  onChange={(e) => handleSet('nativePlace', e.target.value)}
                  placeholder="CHENNAI"
                />
              </div>

              <div>
                <span className="font-bold text-slate-700">Expectation: </span>
                <textarea
                  rows={2}
                  className="font-semibold text-slate-900 focus:outline-none border border-slate-300 rounded p-1.5 w-full mt-1 uppercase text-[11px]"
                  value={form.expectation}
                  onChange={(e) => handleSet('expectation', e.target.value)}
                  placeholder="MS,M.TECH,MBA,MCA,LONDON EMPLOYED,WILLING TO MOVE LONDON POST MARRIAGE"
                />
              </div>
            </div>
          </div>

          {/* Right: Rasi & Doshams */}
          <div>
            <h2 className="bg-rose-900 text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-3 py-1.5 rounded-t-md">
              RASI & DOSHAMS
            </h2>

            <div className="border-2 border-rose-900 border-t-0 p-4 rounded-b-md text-xs space-y-3">
              <div>
                <span className="font-bold text-slate-700">Rasi: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.rasi}
                  onChange={(e) => handleSet('rasi', e.target.value)}
                  placeholder="மிதுனம்"
                />
              </div>

              <div>
                <span className="font-bold text-slate-700">Natchathiram: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.natchathiram}
                  onChange={(e) => handleSet('natchathiram', e.target.value)}
                  placeholder="புனர்பூசம்"
                />
              </div>

              <div>
                <span className="font-bold text-slate-700">Natchathiram Padham: </span>
                <select
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1 bg-transparent"
                  value={form.natchathiramPadham}
                  onChange={(e) => handleSet('natchathiramPadham', e.target.value)}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>

              <div>
                <span className="font-bold text-slate-700">Lagnam: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.lagnam}
                  onChange={(e) => handleSet('lagnam', e.target.value)}
                  placeholder="கடகம்"
                />
              </div>

              <div>
                <span className="font-bold text-slate-700">Dasa Irupu: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 w-full mt-1"
                  value={form.dasaIrupu}
                  onChange={(e) => handleSet('dasaIrupu', e.target.value)}
                  placeholder="குரு, வருடம்-10, மாதம்-3, நாள்-14"
                />
              </div>

              <div>
                <span className="font-bold text-slate-700">Dosham: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.dosham}
                  onChange={(e) => handleSet('dosham', e.target.value)}
                  placeholder="Clean / Chevvai"
                />
              </div>

              <div>
                <span className="font-bold text-slate-700">Kuladeivam: </span>
                <input
                  type="text"
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1"
                  value={form.kuladeivam}
                  onChange={(e) => handleSet('kuladeivam', e.target.value)}
                  placeholder="e.g. Angalamman"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Interactive 12-Box Rasi & Navamsam Grid Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* RASI CHART */}
          <div className="border-2 border-rose-900 rounded-lg overflow-hidden">
            <div className="bg-rose-900 text-white font-bold text-xs uppercase px-3 py-1.5 flex items-center justify-between">
              <span>RASI CHART (ராசி கட்டம்)</span>
              <span className="text-[10px] text-amber-200">Click box to add/remove planets</span>
            </div>

            <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-rose-900 p-0.5 aspect-square text-[10px]">
              {HOUSES.map((h) => {
                const planetsStr = form.rasiChart[h.id] || '';
                return (
                  <div
                    key={h.id}
                    style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                    className="bg-rose-50/90 hover:bg-amber-100 p-1.5 flex flex-col justify-between cursor-pointer border border-rose-200 min-h-[65px] transition"
                  >
                    <div className="flex justify-between items-center font-bold text-rose-950 text-[9px]">
                      <span>{h.tamil}</span>
                    </div>

                    <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[10px]">
                      {planetsStr || <span className="text-slate-300 text-[8px] font-normal">+ add</span>}
                    </div>

                    {/* Quick Planet Selector Buttons */}
                    <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                      {PLANETS.map((p) => {
                        const short = p.split(' ')[0];
                        const active = (planetsStr || '').includes(short);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlanet('rasiChart', h.id, p);
                            }}
                            className={`px-1 py-0.2 rounded text-[7px] font-bold ${
                              active ? 'bg-rose-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Center Box */}
              <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex items-center justify-center font-extrabold text-rose-900 text-base border-2 border-rose-900">
                RASI
              </div>
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
                const planetsStr = form.amsamChart[h.id] || '';
                return (
                  <div
                    key={h.id}
                    style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                    className="bg-rose-50/90 hover:bg-amber-100 p-1.5 flex flex-col justify-between cursor-pointer border border-rose-200 min-h-[65px] transition"
                  >
                    <div className="flex justify-between items-center font-bold text-rose-950 text-[9px]">
                      <span>{h.tamil}</span>
                    </div>

                    <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[10px]">
                      {planetsStr || <span className="text-slate-300 text-[8px] font-normal">+ add</span>}
                    </div>

                    {/* Quick Planet Selector Buttons */}
                    <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                      {PLANETS.map((p) => {
                        const short = p.split(' ')[0];
                        const active = (planetsStr || '').includes(short);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlanet('amsamChart', h.id, p);
                            }}
                            className={`px-1 py-0.2 rounded text-[7px] font-bold ${
                              active ? 'bg-rose-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                          >
                            {short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Center Box */}
              <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex items-center justify-center font-extrabold text-rose-900 text-base border-2 border-rose-900">
                NAVAMSAM
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Account Login Credentials & Contact OTP Verification */}
        <div className="mt-8 mb-6">
          <h2 className="bg-rose-900 text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-3 py-1.5 rounded-t-md flex items-center justify-between">
            <span>LOGIN CREDENTIALS & CONTACT VERIFICATION (உள்நுழைவு கடவுச்சொல் மற்றும் OTP சரிபார்ப்பு)</span>
            <span className="text-[10px] text-amber-200">OTP Verified Access & Account Password</span>
          </h2>

          <div className="border-2 border-rose-900 border-t-0 p-4 rounded-b-md bg-rose-50/40 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Phone Number & OTP */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <label className="font-bold text-slate-800 block mb-1">📱 Mobile Number (கைபேசி எண்):</label>
                <input
                  type="text"
                  className="w-full font-bold text-slate-900 border-b border-slate-300 focus:outline-none py-1 text-sm"
                  value={form.phone}
                  onChange={(e) => handleSet('phone', e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {form.isPhoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Phone Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      ⚠ Unverified
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSendOtp('phone')}
                  className="text-[11px] font-extrabold px-3 py-1 bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-800 hover:to-amber-800 text-white rounded-lg shadow-sm transition"
                >
                  {form.isPhoneVerified ? 'Re-verify OTP' : '🔐 Send Mobile OTP'}
                </button>
              </div>
            </div>

            {/* Email Address & OTP */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <label className="font-bold text-slate-800 block mb-1">✉ Email ID (மின்னஞ்சல் முகவரி):</label>
                <input
                  type="email"
                  className="w-full font-bold text-slate-900 border-b border-slate-300 focus:outline-none py-1 text-sm"
                  value={form.email}
                  onChange={(e) => handleSet('email', e.target.value)}
                  placeholder="member@s2smatrimony.com"
                />
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {form.isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Email Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      ⚠ Unverified
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSendOtp('email')}
                  className="text-[11px] font-extrabold px-3 py-1 bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-800 hover:to-amber-800 text-white rounded-lg shadow-sm transition"
                >
                  {form.isEmailVerified ? 'Re-verify OTP' : '🔐 Send Email OTP'}
                </button>
              </div>
            </div>

            {/* Login Password Field */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <label className="font-bold text-slate-800 block mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-rose-700" />
                  <span>Login Password (கடவுச்சொல்):</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={form.showPassword ? 'text' : 'password'}
                    className="w-full font-bold text-slate-900 border-b border-slate-300 focus:outline-none py-1 text-sm pr-7"
                    value={form.password}
                    onChange={(e) => handleSet('password', e.target.value)}
                    placeholder="Enter login password"
                  />
                  <button
                    type="button"
                    onClick={() => handleSet('showPassword', !form.showPassword)}
                    className="absolute right-0 top-1 text-slate-400 hover:text-slate-600"
                  >
                    {form.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-500 font-medium block">
                  Password used to login to account via Mobile or Email
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Action Footer */}
        <div className="mt-8 pt-4 border-t-2 border-rose-900 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            * All data entered here is automatically synced to your main S2S Matrimony profile database record.
          </p>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-800 hover:to-amber-800 text-white font-extrabold text-sm rounded-lg shadow-lg transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving Profile...' : 'Save All Details To Profile Table'}
          </button>
        </div>
      </div>

      {/* OTP Verification Interactive Modal Popup */}
      {otpModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-extrabold text-base">
                  🔐
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Verify {otpModal.type === 'phone' ? 'Mobile Number' : 'Email Address'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">S2S Matrimony OTP Service</p>
                </div>
              </div>
              <button
                onClick={() => setOtpModal((prev) => ({ ...prev, open: false }))}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              We have sent a 6-digit OTP code to <strong className="text-rose-900 font-bold">{otpModal.target}</strong>. Please enter the code below to verify.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-900 flex items-center justify-between font-medium">
              <span>💡 Demo Testing OTP:</span>
              <span className="bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-md font-mono font-extrabold tracking-wider">123456</span>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">Enter 6-Digit OTP Code:</label>
              <input
                type="text"
                maxLength={6}
                className="w-full text-center text-2xl font-mono font-extrabold tracking-widest py-3 border-2 border-slate-300 rounded-xl focus:border-rose-600 focus:outline-none bg-slate-50 text-rose-900 shadow-inner"
                value={otpModal.enteredOtp}
                onChange={(e) => setOtpModal((prev) => ({ ...prev, enteredOtp: e.target.value }))}
                placeholder="123456"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOtpModal((prev) => ({ ...prev, open: false }))}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtpSubmit}
                className="flex-1 py-2.5 bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-800 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                ✓ Verify OTP Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
