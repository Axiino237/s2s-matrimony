import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, ArrowLeft, Printer, Sparkles, CheckCircle2, Upload, FileText, KeyRound, Eye, EyeOff, ShieldCheck, RotateCcw, Share2, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { profilesApi } from '../../../services/profiles.service';
import { useAuthStore } from '../../../store/auth.store';
import { useSettingsStore } from '../../../store/settings.store';
import { STARS, RASIS, DOSHAMS, CASTE_SUBCASTES, BILINGUAL_STARS, BILINGUAL_RASIS, normalizeStar, normalizeRasi } from '../../../constants/index';

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
  const enableBiodataForm = useSettingsStore((s) => s.enableBiodataForm);
  const logoUrl = useSettingsStore((s) => s.logoUrl);

  if (enableBiodataForm === false) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Biodata Form Disabled</h2>
        <p className="text-slate-500 text-sm">
          Biodata Form entry has been disabled by the Administrator in System Settings.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary text-xs font-bold px-6 py-2.5 rounded-xl shadow-md"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
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
      generatedOtp: '',
      enteredOtp: '',
      sending: true,
    });

    try {
      const res = await profilesApi.sendVerificationOtp({
        type,
        value: val,
        name: form.name || 'Member',
      });
      const devOtp = res.devOtp || '';
      setOtpModal((prev) => ({
        ...prev,
        sending: false,
        generatedOtp: devOtp,
        enteredOtp: devOtp,
      }));
      toast.success(res.message || `OTP sent to ${val}!`);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to send OTP code.';
      setOtpModal((prev) => ({ ...prev, sending: false, generatedOtp: '123456', enteredOtp: '123456' }));
      toast.error(errMsg);
    }
  };

  const handleVerifyOtpSubmit = async () => {
    if (!otpModal.enteredOtp || otpModal.enteredOtp.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP code!');
      return;
    }

    try {
      await profilesApi.verifyContactOtp({
        type: otpModal.type,
        value: otpModal.target,
        otp: otpModal.enteredOtp.trim(),
      });

      if (otpModal.type === 'phone') {
        handleSet('isPhoneVerified', true);
        toast.success('🎉 Mobile Number verified successfully!');
      } else {
        handleSet('isEmailVerified', true);
        toast.success('🎉 Email Address verified successfully!');
      }

      setOtpModal((prev) => ({ ...prev, open: false, enteredOtp: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP code!');
    }
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
          elderBrother: String(Math.max(0, Number(p.family?.elderBrothers ?? 0))),
          marriedElderBrother: String(Math.max(0, Number(p.family?.elderBrothersMarried ?? 0))),
          youngerBrother: String(Math.max(0, Number(p.family?.youngerBrothers ?? 0))),
          marriedYoungerBrother: String(Math.max(0, Number(p.family?.youngerBrothersMarried ?? 0))),
          elderSister: String(Math.max(0, Number(p.family?.elderSisters ?? 0))),
          marriedElderSister: String(Math.max(0, Number(p.family?.elderSistersMarried ?? 0))),
          youngerSister: String(Math.max(0, Number(p.family?.youngerSisters ?? 0))),
          marriedYoungerSister: String(Math.max(0, Number(p.family?.youngerSistersMarried ?? 0))),
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
          rasiChart: p.rasiChart || p.horoscope?.rasiChart || hData.rasiChart || {},
          amsamChart: p.amsamChart || p.horoscope?.amsamChart || hData.amsamChart || (hData as any).navamsamChart || {},
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

  const siblingErrors = useMemo(() => {
    const eb = Number(form.elderBrother || 0);
    const ebm = Number(form.marriedElderBrother || 0);
    const yb = Number(form.youngerBrother || 0);
    const ybm = Number(form.marriedYoungerBrother || 0);
    const es = Number(form.elderSister || 0);
    const esm = Number(form.marriedElderSister || 0);
    const ys = Number(form.youngerSister || 0);
    const ysm = Number(form.marriedYoungerSister || 0);

    return {
      marriedElderBrother: ebm > eb ? 'Married elder brothers cannot be greater than elder brothers.' : '',
      marriedYoungerBrother: ybm > yb ? 'Married younger brothers cannot be greater than younger brothers.' : '',
      marriedElderSister: esm > es ? 'Married elder sisters cannot be greater than elder sisters.' : '',
      marriedYoungerSister: ysm > ys ? 'Married younger sisters cannot be greater than younger sisters.' : '',
    };
  }, [
    form.elderBrother,
    form.marriedElderBrother,
    form.youngerBrother,
    form.marriedYoungerBrother,
    form.elderSister,
    form.marriedElderSister,
    form.youngerSister,
    form.marriedYoungerSister,
  ]);

  const hasSiblingErrors = useMemo(() => {
    return Object.values(siblingErrors).some(Boolean);
  }, [siblingErrors]);

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
    // Validation: For regular members, Phone and Email must be verified via OTP before saving
    if (!isAdminRoute) {
      if (form.phone.trim() && !form.isPhoneVerified) {
        toast.error('⚠️ Mobile Number must be verified via OTP before saving details!');
        return;
      }

      if (form.email.trim() && !form.isEmailVerified) {
        toast.error('⚠️ Email Address must be verified via OTP before saving details!');
        return;
      }
    }

    if (isAdminRoute && !form.phone.trim() && !form.email.trim()) {
      toast.error('⚠️ Please provide the member\'s Mobile Number or Email ID in the Login Credentials section.');
      return;
    }

    if (hasSiblingErrors) {
      const firstError = Object.values(siblingErrors).find(Boolean);
      toast.error(firstError || 'Please correct sibling count errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const nameParts = form.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const payload = {
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        password: form.password.trim() || undefined,
        isPhoneVerified: form.isPhoneVerified || Boolean(form.phone.trim()),
        isEmailVerified: form.isEmailVerified || Boolean(form.email.trim()),
        photoUrl: photoPreview || undefined,
        memberId: form.memberId || undefined,
        branch: form.branch || undefined,
        name: form.name.trim() || undefined,
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
        birthTime: form.birthTime || undefined,
        birthPlace: form.birthPlace || undefined,
        aboutPartner: form.expectation || undefined,
        rasiChart: form.rasiChart,
        amsamChart: form.amsamChart,
        horoscopeData: {
          rasiChart: form.rasiChart,
          amsamChart: form.amsamChart,
        },
      };

      if (isAdminRoute) {
        const res = await api.post('/admin/profiles/direct-create', payload);
        const displayName = firstName ? `${firstName} ${lastName}`.trim() : (form.name || 'Member');
        const loginIdentifier = form.phone.trim() || form.email.trim();
        toast.success(
          `🎉 Member "${displayName}" saved to DB!\nMember can now login using: ${loginIdentifier}`,
          { duration: 7000 }
        );
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
    const currentList = currentHouseStr ? currentHouseStr.split(/[, ]+/).filter(Boolean) : [];

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
      {/* ── Print CSS: Continuous natural flow without giant forced gaps ── */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 5mm; }
          *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body, .min-h-screen { margin: 0 !important; padding: 0 !important; background: white !important; height: auto !important; overflow: visible !important; }
          .no-print, nav, header, button { display: none !important; }
          
          /* Hide all input and textarea placeholders in print preview & printing */
          input::placeholder,
          textarea::placeholder,
          ::placeholder {
            color: transparent !important;
            opacity: 0 !important;
            -webkit-text-fill-color: transparent !important;
          }

          .mb-6 { margin-bottom: 8px !important; }
          .mb-5 { margin-bottom: 6px !important; }
          .mb-4 { margin-bottom: 6px !important; }
          .p-4 { padding: 8px !important; }
          #biodata-print-form {
            display: block !important;
            margin: 0 auto !important;
            padding: 8px !important;
            border-width: 2px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            zoom: 0.78 !important;
          }
        }
      `}</style>
      {/* Top Bar Actions (Only rendered for logged in Admin / Member routes, hidden on public /fill-biodata share link) */}
      {location.pathname !== '/fill-biodata' && (
        <div className="no-print max-w-5xl mx-auto mb-5 flex items-center justify-between gap-2 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 min-w-0">
          <button
            onClick={() => navigate('/profile/edit')}
            aria-label="Back to Edit Profile"
            title="Back to Edit Profile"
            className="flex items-center gap-2 text-slate-700 font-semibold hover:text-rose-600 transition shrink-0"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="hidden sm:inline text-sm">Back to Edit Profile</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {isAdminRoute && (
              <>
                <button
                  onClick={handleClearForm}
                  aria-label="Clear / New Form"
                  title="Clear / New Form"
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl transition shadow-xs flex items-center justify-center shrink-0"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                </button>

                <button
                  onClick={() => {
                    const link = `${window.location.origin}/fill-biodata`;
                    navigator.clipboard.writeText(link);
                    toast.success('📋 Form link copied to clipboard!\nShare with client: ' + link);
                  }}
                  aria-label="Share Form Link"
                  title="Share Form Link"
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl transition shadow-xs flex items-center justify-center shrink-0"
                >
                  <Share2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Vanakkam! Please fill out your Matrimony Biodata entry form using this link:\n${window.location.origin}/fill-biodata`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Send via WhatsApp"
                  title="Send via WhatsApp"
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs flex items-center justify-center shrink-0"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                </a>
              </>
            )}

            <button
              onClick={() => window.print()}
              aria-label="Print / PDF"
              title="Print / PDF"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition shadow-xs flex items-center justify-center shrink-0"
            >
              <Printer className="w-4 h-4 shrink-0" />
            </button>

            <button
              onClick={handleSave}
              disabled={saving || hasSiblingErrors}
              aria-label={saving ? 'Saving to Profile Table...' : 'Save to Profile Table'}
              title={hasSiblingErrors ? 'Please fix sibling count errors' : (saving ? 'Saving to Profile Table...' : 'Save to Profile Table')}
              className="p-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Save className="w-4 h-4 shrink-0" />}
            </button>
          </div>
        </div>
      )}

      {/* Traditional Biodata Form Sheet (Danam Standard Styling) */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl border-2 sm:border-4 border-rose-950 p-3 sm:p-8 font-sans print:shadow-none print:border-2 relative overflow-hidden">
        {/* Background Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] z-0 overflow-hidden">
          <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Watermark" className="w-[300px] sm:w-[540px] h-[300px] sm:h-[540px] object-contain select-none" />
        </div>

        {/* Document Border Frame Header */}
        <div className="text-center border-b-2 border-rose-900 pb-4 mb-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex flex-col sm:items-start items-center space-y-1">
              <div className="bg-rose-900 text-white px-2.5 py-0.5 text-xs font-black rounded inline-block shadow-sm">
                Regn No. - <span className="text-amber-300 font-extrabold">{form.memberId || `S2S${String(Math.floor(100000 + Math.random() * 900000))}`}</span>
              </div>
              <p className="font-extrabold text-slate-700 text-xs">
                Regn Date: <span className="font-bold text-slate-900">{form.regnDate || new Date().toISOString().split('T')[0]}</span>
              </p>
            </div>

            <div className="text-center flex flex-col items-center">
              <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Logo" className="w-12 h-12 object-contain mb-1 rounded-full shadow-sm border border-amber-300 relative z-10" />
              <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-rose-900 uppercase">
                S2S MATRIMONY
              </h1>
              <p className="text-[10px] sm:text-xs text-amber-800 font-semibold tracking-widest uppercase">Traditional Single Page Biodata Form</p>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded inline-block">
                BRANCH - {form.branch || 'Chennai'}
              </span>
              <input
                type="text"
                className="mt-1 block text-center sm:text-right text-xs border-b border-slate-300 focus:outline-none w-28 mx-auto sm:ml-auto"
                value={form.branch}
                onChange={(e) => handleSet('branch', e.target.value)}
                placeholder="Branch Name"
              />
            </div>
          </div>

          {/* Full Name Banner */}
          <div className="mt-4 pt-3 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <label className="text-sm font-bold text-rose-950">NAME:</label>
            <input
              type="text"
              className="text-base sm:text-xl font-extrabold text-rose-950 uppercase border-b-2 border-rose-700 focus:outline-none w-full sm:w-96 text-center"
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
                className={`font-bold text-slate-800 border-b border-rose-300 bg-transparent focus:outline-none w-full py-0.5 ${!form.maritalStatus ? 'print:text-transparent' : ''}`}
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

          <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 border-2 border-rose-900 border-t-0 p-3 sm:p-4 rounded-b-md">
            {/* Mobile: Photo at Top / Desktop & Print: Right Column */}
            <div className="order-first md:order-last print:order-last col-span-1 flex flex-col items-center justify-center border-2 border-dashed border-rose-300 print:border-solid print:border-rose-900 bg-rose-50/40 print:bg-transparent p-4 rounded-lg min-h-[180px] sm:min-h-[220px]">
              <div className="w-28 h-36 bg-slate-100 rounded border-2 border-rose-900 overflow-hidden shadow-sm relative flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold text-center px-1 no-print">No Photo Uploaded</span>
                )}
              </div>

              <label className="no-print mt-2 cursor-pointer bg-rose-900 hover:bg-rose-950 text-white text-[11px] font-bold py-1 px-2.5 rounded shadow-sm transition flex items-center gap-1">
                <Upload className="w-3 h-3" /> Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              </label>
            </div>

            {/* Inputs: 1 column on mobile, 2 columns on tablet/desktop */}
            <div className="order-last md:order-first print:order-first col-span-1 md:col-span-2 print:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                <select
                  className={`font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1 bg-transparent ${!form.complexion ? 'print:text-transparent' : ''}`}
                  value={form.complexion}
                  onChange={(e) => handleSet('complexion', e.target.value)}
                >
                  <option value="">Select Complexion</option>
                  <option value="Very Fair">Very Fair</option>
                  <option value="Fair">Fair</option>
                  <option value="Wheatish">Wheatish</option>
                  <option value="Dark">Dark</option>
                  {form.complexion && !['Very Fair', 'Fair', 'Wheatish', 'Dark'].includes(form.complexion) && (
                    <option value={form.complexion}>{form.complexion}</option>
                  )}
                </select>
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
                <span className="font-bold text-slate-700">Diet: </span>
                <select
                  className={`font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1 ${!form.diet ? 'print:text-transparent' : ''}`}
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
                <select
                  className={`font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1 bg-transparent ${!form.salary ? 'print:text-transparent' : ''}`}
                  value={form.salary}
                  onChange={(e) => handleSet('salary', e.target.value)}
                >
                  <option value="">Select Salary</option>
                  <option value="20000 - 30000 per month">₹20,000 - ₹30,000 per month</option>
                  <option value="30000 - 50000 per month">₹30,000 - ₹50,000 per month</option>
                  <option value="50000 - 75000 per month">₹50,000 - ₹75,000 per month</option>
                  <option value="80000 per month">80000 per month</option>
                  <option value="75000 - 100000 per month">₹75,000 - ₹1,00,000 per month</option>
                  <option value="100000 - 150000 per month">₹1,00,000 - ₹1,50,000 per month</option>
                  <option value="150000 - 250000 per month">₹1,50,000 - ₹2,50,000 per month</option>
                  <option value="Above 250000 per month">Above ₹2,50,000 per month</option>
                  <option value="300000">₹2 Lakhs – ₹3 Lakhs per annum</option>
                  <option value="500000">₹3 Lakhs – ₹5 Lakhs per annum</option>
                  <option value="800000">₹5 Lakhs – ₹8 Lakhs per annum</option>
                  <option value="1200000">₹8 Lakhs – ₹12 Lakhs per annum</option>
                  <option value="1800000">₹12 Lakhs – ₹18 Lakhs per annum</option>
                  <option value="2500000">₹18 Lakhs – ₹25 Lakhs per annum</option>
                  <option value="3500000">₹25 Lakhs – ₹35 Lakhs per annum</option>
                  <option value="5000000">Above ₹35 Lakhs per annum</option>
                  {form.salary && ![
                    '20000 - 30000 per month',
                    '30000 - 50000 per month',
                    '50000 - 75000 per month',
                    '80000 per month',
                    '75000 - 100000 per month',
                    '100000 - 150000 per month',
                    '150000 - 250000 per month',
                    'Above 250000 per month',
                    '300000', '500000', '800000', '1200000', '1800000', '2500000', '3500000', '5000000'
                  ].includes(form.salary) && (
                    <option value={form.salary}>{form.salary}</option>
                  )}
                </select>
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

            <div className={`border-b pb-1 ${siblingErrors.marriedElderBrother ? 'border-red-400 bg-red-50/50 p-1.5 rounded' : 'border-slate-200'}`}>
              <span className="font-bold text-slate-700">No. of Married Elder Brother: </span>
              <input
                type="number"
                min="0"
                className={`font-semibold text-slate-900 focus:outline-none border-b w-12 ml-1 ${
                  siblingErrors.marriedElderBrother ? 'border-red-500 text-red-700 bg-white' : 'border-slate-300'
                }`}
                value={form.marriedElderBrother}
                onChange={(e) => handleSet('marriedElderBrother', e.target.value)}
              />
              {siblingErrors.marriedElderBrother && (
                <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1 leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
                  <span>{siblingErrors.marriedElderBrother}</span>
                </p>
              )}
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

            <div className={`border-b pb-1 ${siblingErrors.marriedYoungerBrother ? 'border-red-400 bg-red-50/50 p-1.5 rounded' : 'border-slate-200'}`}>
              <span className="font-bold text-slate-700">No. of Married Younger Brother: </span>
              <input
                type="number"
                min="0"
                className={`font-semibold text-slate-900 focus:outline-none border-b w-12 ml-1 ${
                  siblingErrors.marriedYoungerBrother ? 'border-red-500 text-red-700 bg-white' : 'border-slate-300'
                }`}
                value={form.marriedYoungerBrother}
                onChange={(e) => handleSet('marriedYoungerBrother', e.target.value)}
              />
              {siblingErrors.marriedYoungerBrother && (
                <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1 leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
                  <span>{siblingErrors.marriedYoungerBrother}</span>
                </p>
              )}
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

            <div className={`border-b pb-1 ${siblingErrors.marriedElderSister ? 'border-red-400 bg-red-50/50 p-1.5 rounded' : 'border-slate-200'}`}>
              <span className="font-bold text-slate-700">No. of Married Elder Sister: </span>
              <input
                type="number"
                min="0"
                className={`font-semibold text-slate-900 focus:outline-none border-b w-12 ml-1 ${
                  siblingErrors.marriedElderSister ? 'border-red-500 text-red-700 bg-white' : 'border-slate-300'
                }`}
                value={form.marriedElderSister}
                onChange={(e) => handleSet('marriedElderSister', e.target.value)}
              />
              {siblingErrors.marriedElderSister && (
                <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1 leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
                  <span>{siblingErrors.marriedElderSister}</span>
                </p>
              )}
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

            <div className={`border-b pb-1 ${siblingErrors.marriedYoungerSister ? 'border-red-400 bg-red-50/50 p-1.5 rounded' : 'border-slate-200'}`}>
              <span className="font-bold text-slate-700">No. of Married Younger Sister: </span>
              <input
                type="number"
                min="0"
                className={`font-semibold text-slate-900 focus:outline-none border-b w-12 ml-1 ${
                  siblingErrors.marriedYoungerSister ? 'border-red-500 text-red-700 bg-white' : 'border-slate-300'
                }`}
                value={form.marriedYoungerSister}
                onChange={(e) => handleSet('marriedYoungerSister', e.target.value)}
              />
              {siblingErrors.marriedYoungerSister && (
                <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1 leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-600" />
                  <span>{siblingErrors.marriedYoungerSister}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Financial & Ancestral & Horoscope Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 mb-4">
          {/* Left: Financial & Ancestral */}
          <div>
            <h2 className="bg-rose-900 text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-3 py-1.5 rounded-t-md">
              FINANCIAL & ANCESTRAL DETAILS
            </h2>

            <div className="border-2 border-rose-900 border-t-0 p-4 rounded-b-md text-xs space-y-3">
              <div>
                <span className="font-bold text-slate-700">Resident: </span>
                <select
                  className={`font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1 bg-transparent ${!form.resident ? 'print:text-transparent' : ''}`}
                  value={form.resident}
                  onChange={(e) => handleSet('resident', e.target.value)}
                >
                  <option value="">Select Resident</option>
                  <option value="Own House">Own House</option>
                  <option value="Rent House">Rent House</option>
                  <option value="Lease">Lease</option>
                  <option value="Quarters">Quarters</option>
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
                <select
                  className={`font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1 bg-transparent ${!form.rasi ? 'print:text-transparent' : ''}`}
                  value={normalizeRasi(form.rasi) || form.rasi}
                  onChange={(e) => handleSet('rasi', e.target.value)}
                >
                  <option value="">Select Rasi</option>
                  {BILINGUAL_RASIS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                  {form.rasi && !BILINGUAL_RASIS.some(r => r.value === normalizeRasi(form.rasi) || r.value === form.rasi) && (
                    <option value={form.rasi}>{form.rasi}</option>
                  )}
                </select>
              </div>

              <div>
                <span className="font-bold text-slate-700">Natchathiram: </span>
                <select
                  className={`font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1 bg-transparent ${!form.natchathiram ? 'print:text-transparent' : ''}`}
                  value={normalizeStar(form.natchathiram) || form.natchathiram}
                  onChange={(e) => handleSet('natchathiram', e.target.value)}
                >
                  <option value="">Select Star</option>
                  {BILINGUAL_STARS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                  {form.natchathiram && !BILINGUAL_STARS.some(s => s.value === normalizeStar(form.natchathiram) || s.value === form.natchathiram) && (
                    <option value={form.natchathiram}>{form.natchathiram}</option>
                  )}
                </select>
              </div>

              <div>
                <span className="font-bold text-slate-700">Natchathiram Padham: </span>
                <select
                  className={`font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1 bg-transparent ${!form.natchathiramPadham ? 'print:text-transparent' : ''}`}
                  value={form.natchathiramPadham}
                  onChange={(e) => handleSet('natchathiramPadham', e.target.value)}
                >
                  <option value="">Select Padham</option>
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

              <div className="flex items-center">
                <span className="font-bold text-slate-700 mr-1 flex-shrink-0">Dosham: </span>
                <select
                  className="font-semibold text-slate-900 focus:outline-none border-b border-slate-300 ml-1 bg-transparent py-0.5 text-xs flex-1"
                  value={form.dosham}
                  onChange={(e) => handleSet('dosham', e.target.value)}
                >
                  <option value="">-- Select Dosham --</option>
                  {DOSHAMS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  {form.dosham && !DOSHAMS.includes(form.dosham) && (
                    <option value={form.dosham}>{form.dosham} (Custom)</option>
                  )}
                </select>
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
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 mb-4">
          {/* RASI CHART */}
          <div className="border-2 border-rose-900 rounded-lg overflow-hidden">
            <div className="bg-rose-900 text-white font-bold text-xs uppercase px-3 py-1.5 flex items-center justify-between">
              <span>RASI CHART (ராசி கட்டம்)</span>
              <span className="text-[10px] text-amber-200 no-print">Click box to add/remove planets</span>
            </div>

            <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-rose-900 p-0.5 aspect-square text-[10px]">
              {HOUSES.map((h) => {
                const planetsStr = form.rasiChart[h.id] || '';
                return (
                  <div
                    key={h.id}
                    style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                    className="bg-rose-50/90 hover:bg-amber-100 p-1 flex flex-col justify-between cursor-pointer border border-rose-200 min-h-[38px] transition"
                  >
                    <div className="flex justify-between items-center font-bold text-rose-950 text-[9px]">
                      <span>{h.tamil}</span>
                    </div>

                    <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[10px]">
                      {planetsStr || <span className="text-slate-300 text-[8px] font-normal no-print">+ add</span>}
                    </div>

                    {/* Quick Planet Selector Buttons */}
                    <div className="flex flex-wrap gap-0.5 justify-center mt-1 no-print">
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
                            className={`px-1 py-0.2 rounded text-[7px] font-bold ${active ? 'bg-rose-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
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
              <span className="text-[10px] text-amber-200 no-print">Click box to add/remove planets</span>
            </div>

            <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-rose-900 p-0.5 aspect-square text-[10px]">
              {HOUSES.map((h) => {
                const planetsStr = form.amsamChart[h.id] || '';
                return (
                  <div
                    key={h.id}
                    style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                    className="bg-rose-50/90 hover:bg-amber-100 p-1 flex flex-col justify-between cursor-pointer border border-rose-200 min-h-[38px] transition"
                  >
                    <div className="flex justify-between items-center font-bold text-rose-950 text-[9px]">
                      <span>{h.tamil}</span>
                    </div>

                    <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[10px]">
                      {planetsStr || <span className="text-slate-300 text-[8px] font-normal no-print">+ add</span>}
                    </div>

                    {/* Quick Planet Selector Buttons */}
                    <div className="flex flex-wrap gap-0.5 justify-center mt-1 no-print">
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
                            className={`px-1 py-0.2 rounded text-[7px] font-bold ${active ? 'bg-rose-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
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

        {/* Section 5: Account Login Credentials & Contact OTP Verification (Hidden on Print) */}
        <div className="no-print mt-8 mb-6">
          <h2 className="bg-rose-900 text-white font-bold text-xs sm:text-sm tracking-wider uppercase px-3 py-1.5 rounded-t-md flex items-center justify-between">
            <span>LOGIN CREDENTIALS & CONTACT VERIFICATION</span>
            <span className="text-[10px] text-amber-200">OTP Verified Access & Account Password</span>
          </h2>

          <div className="border-2 border-rose-900 border-t-0 p-4 rounded-b-md bg-rose-50/40 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Phone Number & OTP */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <label className="font-bold text-slate-800 block mb-1">📱 Mobile Number:</label>
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
                <label className="font-bold text-slate-800 block mb-1">✉ Email ID:</label>
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
                  <span>Login Password:</span>
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

        {/* Bottom Save Action Footer (Hidden on Print) */}
        <div className="no-print mt-8 pt-4 border-t-2 border-rose-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
            * All data entered here is automatically synced to your main S2S Matrimony profile database record.
          </p>

          <button
            onClick={handleSave}
            disabled={saving || hasSiblingErrors}
            aria-label="Save All Details To Profile Table"
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-800 hover:to-amber-800 text-white font-extrabold text-sm rounded-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Save className="w-4 h-4 shrink-0" /> {saving ? 'Saving Profile...' : 'Save All Details To Profile Table'}
          </button>
        </div>
      </div>

      {/* OTP Verification Interactive Modal Popup */}
      {otpModal.open && (
        <div className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

            {/* Development OTP display directly below button */}
            {import.meta.env.DEV && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-center shadow-xs">
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-0.5">
                  Development OTP
                </p>
                <p className="text-lg font-mono font-black text-rose-600 tracking-widest">
                  {otpModal.generatedOtp || '123456'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
