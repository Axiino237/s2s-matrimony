import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  Upload,
  CheckCircle2,
  Code,
  Copy,
  RefreshCw,
  Database,
  ExternalLink,
  Image as ImageIcon,
  XCircle,
  User,
  GraduationCap,
  Briefcase,
  Users,
  Compass,
  Phone,
  Check,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { profilesApi } from '../../services/profiles.service';

type ReviewTab = 'personal' | 'religion' | 'education' | 'family' | 'contact';

const HOUSES = [
  { id: 'Mesham', tamil: 'à®®à¯‡à®·à®®à¯', row: 0, col: 1 },
  { id: 'Rishabam', tamil: 'à®°à®¿à®·à®ªà®®à¯', row: 0, col: 2 },
  { id: 'Mithunam', tamil: 'à®®à®¿à®¤à¯à®©à®®à¯', row: 0, col: 3 },
  { id: 'Kadagam', tamil: 'à®•à®Ÿà®•à®®à¯', row: 1, col: 3 },
  { id: 'Simmam', tamil: 'à®šà®¿à®®à¯à®®à®®à¯', row: 2, col: 3 },
  { id: 'Kanni', tamil: 'à®•à®©à¯à®©à®¿', row: 3, col: 3 },
  { id: 'Thulaam', tamil: 'à®¤à¯à®²à®¾à®®à¯', row: 3, col: 2 },
  { id: 'Viruchigam', tamil: 'à®µà®¿à®°à¯à®šà¯à®šà®¿à®•à®®à¯', row: 3, col: 1 },
  { id: 'Dhanusu', tamil: 'à®¤à®©à¯à®šà¯', row: 3, col: 0 },
  { id: 'Magaram', tamil: 'à®®à®•à®°à®®à¯', row: 2, col: 0 },
  { id: 'Kumbam', tamil: 'à®•à¯à®®à¯à®ªà®®à¯', row: 1, col: 0 },
  { id: 'Meenam', tamil: 'à®®à¯€à®©à®®à¯', row: 0, col: 0 },
];

const PLANETS = [
  { short: 'à®šà¯‚à®°à®¿', label: 'à®šà¯‚à®°à®¿ (Sun)' },
  { short: 'à®šà®¨à¯', label: 'à®šà®¨à¯ (Moon)' },
  { short: 'à®šà¯†à®µà¯', label: 'à®šà¯†à®µà¯ (Mars)' },
  { short: 'à®ªà¯à®¤', label: 'à®ªà¯à®¤ (Merc)' },
  { short: 'à®•à¯à®°à¯', label: 'à®•à¯à®°à¯ (Jup)' },
  { short: 'à®šà¯à®•à¯', label: 'à®šà¯à®•à¯ (Ven)' },
  { short: 'à®šà®©à®¿', label: 'à®šà®©à®¿ (Sat)' },
  { short: 'à®°à®¾à®•à¯', label: 'à®°à®¾à®•à¯ (Rahu)' },
  { short: 'à®•à¯‡à®¤à¯', label: 'à®•à¯‡à®¤à¯ (Ketu)' },
  { short: 'à®²à®•à¯', label: 'à®²à®•à¯ (Lag)' },
];

const AdminAiBiodata = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [savedResult, setSavedResult] = useState<any>(null);
  const [activeView, setActiveView] = useState<'review' | 'json'>('review');
  const [activeReviewTab, setActiveReviewTab] = useState<ReviewTab>('personal');

  // OTP Verification State
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [initialPassword, setInitialPassword] = useState('Welcome@123');
  const [showPassword, setShowPassword] = useState(false);

  // Phone Inline OTP State
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [phoneDevOtp, setPhoneDevOtp] = useState<string | null>(null);
  const [phoneTimer, setPhoneTimer] = useState(0);
  const phoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Email Inline OTP State
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailDevOtp, setEmailDevOtp] = useState<string | null>(null);
  const [emailTimer, setEmailTimer] = useState(0);
  const emailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPhoneTimer = () => {
    setPhoneTimer(60);
    if (phoneTimerRef.current) clearInterval(phoneTimerRef.current);
    phoneTimerRef.current = setInterval(() => {
      setPhoneTimer(prev => {
        if (prev <= 1) { clearInterval(phoneTimerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const startEmailTimer = () => {
    setEmailTimer(60);
    if (emailTimerRef.current) clearInterval(emailTimerRef.current);
    emailTimerRef.current = setInterval(() => {
      setEmailTimer(prev => {
        if (prev <= 1) { clearInterval(emailTimerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => {
    if (phoneTimerRef.current) clearInterval(phoneTimerRef.current);
    if (emailTimerRef.current) clearInterval(emailTimerRef.current);
  }, []);

  const handleParse = async () => {
    if (!selectedFile && !imagePreview && !rawText.trim()) {
      return toast.error('Please upload a biodata document or photo first');
    }

    setParsing(true);
    setSavedResult(null);
    try {
      const data = await profilesApi.parseBiodata(
        rawText,
        imagePreview || undefined
      );
      setExtractedData(data);
      setActiveView('review');
      toast.success('âœ¨ AI extracted biodata & horoscope fields successfully!');
    } catch {
      toast.error('Failed to extract biodata with AI');
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImagePreview(base64);
        setRawText('');
        toast.success(
          file.type === 'application/pdf'
            ? `ðŸ“„ Biodata PDF Loaded: ${file.name}`
            : `ðŸ“¸ Biodata Image Loaded: ${file.name}`
        );
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setRawText(content || '');
        toast.success(`ðŸ“„ Loaded Document: ${file.name}`);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProfilePicPreview(base64);
      toast.success(`ðŸ‘¤ Profile Photo Loaded: ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setRawText('');
  };

  const handleCopyJson = () => {
    if (!extractedData) return;
    navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
    toast.success('Copied JSON schema to clipboard!');
  };

  // Helper to edit nested fields inside extractedData
  const updateField = (section: string, key: string, value: any) => {
    setExtractedData((prev: any) => {
      if (!prev) return prev;
      if (section === 'root') {
        return { ...prev, [key]: value };
      }
      return {
        ...prev,
        [section]: {
          ...(prev[section] || {}),
          [key]: value,
        },
      };
    });
  };

  const togglePlanetInChart = (chartKey: 'rasiChart' | 'amsamChart', houseId: string, planetShort: string) => {
    setExtractedData((prev: any) => {
      if (!prev) return prev;
      const horo = prev.horoscope || {};
      const currentChart = horo[chartKey] || prev[chartKey] || {};
      const houseVal = currentChart[houseId] || '';
      const list = houseVal ? houseVal.split(/[, ]+/).filter(Boolean) : [];
      const idx = list.indexOf(planetShort);
      const updatedList = idx >= 0 ? list.filter((p: string) => p !== planetShort) : [...list, planetShort];
      const updatedChart = { ...currentChart, [houseId]: updatedList.join(', ') };

      return {
        ...prev,
        [chartKey]: updatedChart,
        horoscope: {
          ...horo,
          [chartKey]: updatedChart,
        },
      };
    });
  };

  const handleSendPhoneOtp = async () => {
    const phoneVal = (contact.phone || contact.mobile || '').trim();
    if (!phoneVal) {
      return toast.error('Please enter a contact mobile number first');
    }
    setSendingPhoneOtp(true);
    setPhoneDevOtp(null);
    try {
      const name = extractedData?.profile?.firstName || extractedData?.profile?.name || '';
      const res = await profilesApi.sendVerificationOtp({ type: 'phone', value: phoneVal, name });
      setPhoneOtpSent(true);
      if (res.devOtp) {
        setPhoneDevOtp(res.devOtp);
        setPhoneOtpCode(res.devOtp);
      }
      startPhoneTimer();
      toast.success(res.message || `OTP sent to ${phoneVal}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to send OTP to ${phoneVal}`);
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const phoneVal = (contact.phone || contact.mobile || '').trim();
    if (!phoneOtpCode || phoneOtpCode.trim().length !== 6) {
      return toast.error('Please enter the 6-digit OTP');
    }
    setVerifyingPhoneOtp(true);
    try {
      await profilesApi.verifyContactOtp({ type: 'phone', value: phoneVal, otp: phoneOtpCode.trim() });
      setIsPhoneVerified(true);
      setVerifiedPhone(phoneVal);
      setPhoneOtpSent(false);
      toast.success('Mobile number verified successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  const handleSendEmailOtp = async () => {
    const emailVal = (contact.email || '').trim();
    if (!emailVal) {
      return toast.error('Please enter a contact email address first');
    }
    setSendingEmailOtp(true);
    setEmailDevOtp(null);
    try {
      const name = extractedData?.profile?.firstName || extractedData?.profile?.name || '';
      const res = await profilesApi.sendVerificationOtp({ type: 'email', value: emailVal, name });
      setEmailOtpSent(true);
      if (res.devOtp) {
        setEmailDevOtp(res.devOtp);
        setEmailOtpCode(res.devOtp);
      }
      startEmailTimer();
      toast.success(res.message || `OTP sent to ${emailVal}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to send OTP to ${emailVal}`);
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const emailVal = (contact.email || '').trim();
    if (!emailOtpCode || emailOtpCode.trim().length !== 6) {
      return toast.error('Please enter the 6-digit OTP');
    }
    setVerifyingEmailOtp(true);
    try {
      await profilesApi.verifyContactOtp({ type: 'email', value: emailVal, otp: emailOtpCode.trim() });
      setIsEmailVerified(true);
      setVerifiedEmail(emailVal);
      setEmailOtpSent(false);
      toast.success('Email address verified successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired OTP code');
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleSaveToDb = async () => {
    if (!extractedData) return;
    if (!isPhoneVerified && !isEmailVerified) {
      toast.error('âš ï¸ Please verify the mobile number or email via OTP before saving.');
      setActiveReviewTab('contact');
      return;
    }
    setSaving(true);
    try {
      const horo = extractedData.horoscope || {};
      const rasiChart = horo.rasiChart || extractedData.rasiChart || {};
      const amsamChart = horo.amsamChart || extractedData.amsamChart || {};
      const payload = {
        ...extractedData,
        rasiChart,
        amsamChart,
        horoscope: { ...horo, rasiChart, amsamChart },
        profile_photo: profilePicPreview || extractedData.profile_photo || extractedData.profile?.profile_photo,
        isPhoneVerified,
        isEmailVerified,
        initialPassword,
      };
      const result = await profilesApi.saveParsedProfile(payload);
      setSavedResult(result);
      toast.success(`ðŸŽ‰ Member account created! ID: ${result.memberId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save profile to database');
    } finally {
      setSaving(false);
    }
  };

  // Safe accessors for extractedData sections
  const prof = extractedData?.profile || {};
  const edu = extractedData?.education || {};
  const occ = extractedData?.career || extractedData?.occupation || {};
  const fam = extractedData?.family || {};
  const horo = extractedData?.horoscope || {};
  const contact = extractedData?.contact || {};
  const rasiChart = horo?.rasiChart || extractedData?.rasiChart || {};
  const amsamChart = horo?.amsamChart || extractedData?.amsamChart || {};

  return (
    <>
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 card bg-gradient-to-r from-primary/10 via-amber-50 to-primary/5 border border-primary/20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary text-white font-bold flex items-center justify-center text-xl shadow-md flex-shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">
              AI Vision Matrimony Biodata Extraction & OCR Engine
            </h1>
            <p className="text-text-secondary text-sm mt-0.5">
              Upload scanned biodata documents or photos, review and edit extracted fields, and save to database.
            </p>
          </div>
        </div>

        <button
          onClick={handleParse}
          disabled={parsing || (!selectedFile && !imagePreview && !rawText.trim())}
          className="btn btn-primary btn-sm flex items-center gap-2 font-bold shadow-md bg-gradient-primary text-white disabled:opacity-50"
        >
          {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {parsing ? 'Extracting with AI...' : 'Extract with AI'}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols) â€” Document / Photo Upload */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-slate-800">Biodata Document / Photo Upload</h2>
              </div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              accept="image/*,.pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="admin-biodata-file-input"
            />

            {imagePreview ? (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-white space-y-3 relative group">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 truncate max-w-[280px]">
                    <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {selectedFile?.name || 'Uploaded Document'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                  </span>
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                  {selectedFile?.type === 'application/pdf' ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <FileText className="w-16 h-16 text-rose-400 animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400 mt-1">PDF Document ready for AI Vision & OCR extraction</p>
                      </div>
                    </div>
                  ) : (
                    <img src={imagePreview} alt="Biodata Preview" className="max-h-full max-w-full object-contain" />
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedFile?.type === 'application/pdf' ? 'ðŸ“„ PDF ready for AI extraction' : 'ðŸ“¸ Photo ready for AI extraction'}
                  </p>
                  <label
                    htmlFor="admin-biodata-file-input"
                    className="text-xs text-primary-light hover:underline font-bold cursor-pointer"
                  >
                    Change File
                  </label>
                </div>
              </div>
            ) : selectedFile ? (
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs text-slate-800 font-bold flex items-center gap-2 truncate max-w-[280px]">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" /> {selectedFile.name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Document loaded successfully!
                </p>
                <div className="flex justify-end pt-1">
                  <label
                    htmlFor="admin-biodata-file-input"
                    className="text-xs text-primary font-bold cursor-pointer hover:underline"
                  >
                    Change Document
                  </label>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-white transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-primary mx-auto flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-text-primary font-bold text-sm">Upload Biodata Document or Photo</p>
                  <p className="text-text-muted text-xs mt-1">Supports JPG, PNG, WEBP, PDF, or text files</p>
                </div>
                <label
                  htmlFor="admin-biodata-file-input"
                  className="btn btn-primary btn-sm cursor-pointer inline-flex items-center gap-2 font-bold shadow-md bg-gradient-primary text-white"
                >
                  <ImageIcon className="w-4 h-4" /> Browse Document / Photo
                </label>
              </div>
            )}

            {/* Member Profile Photo (Profile Pic) Upload Area */}
            <div className="p-4 border border-rose-200/80 rounded-2xl bg-rose-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-rose-500" /> Member Profile Photo (Profile Pic)
                </label>
                {profilePicPreview && (
                  <button
                    type="button"
                    onClick={() => { setProfilePicFile(null); setProfilePicPreview(null); }}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              {profilePicPreview ? (
                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-rose-200 shadow-sm">
                  <img src={profilePicPreview} alt="Member Profile Pic" className="w-14 h-14 rounded-full object-cover border-2 border-rose-400 shadow-sm flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{profilePicFile?.name || 'Profile Photo'}</p>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1 inline-block">
                      âœ“ Ready to save with profile
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    id="member-profile-pic-input"
                    className="hidden"
                    onChange={handleProfilePicUpload}
                  />
                  <label
                    htmlFor="member-profile-pic-input"
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-xl bg-white text-xs font-bold text-rose-700 cursor-pointer transition-all hover:bg-rose-50/50"
                  >
                    <Upload className="w-4 h-4 text-rose-500" /> Upload Profile Picture
                  </label>
                </div>
              )}
            </div>

            <button
              onClick={handleParse}
              disabled={parsing || (!selectedFile && !imagePreview && !rawText.trim())}
              className="btn btn-primary w-full justify-center py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
            >
              {parsing ? 'Extracting with AI...' : 'âœ¨ Run AI Extraction Engine'}
            </button>
          </div>
        </div>

        {/* Right Column (7 Cols) â€” Review & Edit Form or JSON Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            {/* Action Bar & View Switcher */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('review')}
                  className={`btn btn-xs px-3 py-1.5 font-bold rounded-lg transition-all ${
                    activeView === 'review'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1" />
                  Review & Edit Form
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('json')}
                  className={`btn btn-xs px-3 py-1.5 font-bold rounded-lg transition-all ${
                    activeView === 'json'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5 inline mr-1" />
                  Raw JSON
                </button>
              </div>

              {extractedData && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="btn btn-ghost btn-xs text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 border border-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy JSON
                  </button>

                  <button
                    onClick={handleSaveToDb}
                    disabled={saving || (!isPhoneVerified && !isEmailVerified)}
                    className={`btn btn-xs px-3 py-1.5 text-xs flex items-center gap-1.5 font-bold shadow-md rounded-lg ${
                      isPhoneVerified || isEmailVerified
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                    title={(!isPhoneVerified && !isEmailVerified) ? 'Go to Contact tab to verify mobile/email first' : ''}
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    {saving ? 'Saving...' : (isPhoneVerified || isEmailVerified) ? 'Save to DB' : 'Verify First'}
                  </button>
                </div>
              )}
            </div>

            {/* Saved Result Success Banner (inline top) */}
            {savedResult && !savedResult.credentials && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">
                        Member Account Created!
                      </h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Member ID: <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">{savedResult.memberId}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ACTIVE MEMBER
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-emerald-100">
                  â„¹ï¸ Stored as an <strong>Unverified / AI-Created Profile</strong> without fake credentials. When the actual member registers with their mobile or email, this profile and all extracted information will be linked seamlessly.
                </p>
              </div>
            )}

            {/* Main Content Area */}
            {!extractedData ? (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <Sparkles className="w-12 h-12 mx-auto text-primary/30 animate-pulse" />
                <p className="text-sm font-medium text-slate-600">No document extracted yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Upload a biodata photo, document, or PDF on the left and click "Run AI Extraction Engine".
                </p>
              </div>
            ) : activeView === 'json' ? (
              <div className="space-y-2">
                <pre className="text-xs font-mono leading-relaxed text-emerald-300 overflow-x-auto max-h-[500px] p-4 bg-slate-950 rounded-xl border border-slate-800">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </div>
            ) : (
              /* Review & Edit Tabs */
              <div className="space-y-4">
                {/* Category Navigation Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
                  {[
                    { id: 'personal', label: 'Personal', icon: User },
                    { id: 'religion', label: 'Religion & Horoscope', icon: Compass },
                    { id: 'education', label: 'Education & Career', icon: GraduationCap },
                    { id: 'family', label: 'Family', icon: Users },
                    { id: 'contact', label: 'Contact & Location', icon: Phone },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeReviewTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveReviewTab(tab.id as ReviewTab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-rose-50 text-primary border border-rose-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab 1: Personal Details */}
                {activeReviewTab === 'personal' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">First Name</label>
                      <input
                        type="text"
                        value={prof.firstName || prof.first_name || ''}
                        onChange={(e) => updateField('profile', 'firstName', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Arbin"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Last Name</label>
                      <input
                        type="text"
                        value={prof.lastName || prof.last_name || ''}
                        onChange={(e) => updateField('profile', 'lastName', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Modi"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Gender</label>
                      <select
                        value={String(prof.gender || prof.profile_type || 'MALE').toUpperCase().includes('FEMALE') ? 'FEMALE' : 'MALE'}
                        onChange={(e) => updateField('profile', 'gender', e.target.value)}
                        className="w-full select select-sm text-xs rounded-lg border-slate-300"
                      >
                        <option value="MALE">Male (Groom)</option>
                        <option value="FEMALE">Female (Bride)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Date of Birth</label>
                      <input
                        type="text"
                        value={prof.dateOfBirth || prof.dob || ''}
                        onChange={(e) => updateField('profile', 'dateOfBirth', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="YYYY-MM-DD or DD/MM/YYYY"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Marital Status</label>
                      <select
                        value={prof.maritalStatus || prof.marital_status || 'NEVER_MARRIED'}
                        onChange={(e) => updateField('profile', 'maritalStatus', e.target.value)}
                        className="w-full select select-sm text-xs rounded-lg border-slate-300"
                      >
                        <option value="NEVER_MARRIED">Never Married</option>
                        <option value="DIVORCED">Divorced</option>
                        <option value="WIDOWED">Widowed</option>
                        <option value="SEPARATED">Separated</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Mother Tongue</label>
                      <input
                        type="text"
                        value={prof.motherTongue || prof.mother_tongue || ''}
                        onChange={(e) => updateField('profile', 'motherTongue', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Tamil, Hindi, Telugu"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Height (cm / ft)</label>
                      <input
                        type="text"
                        value={prof.heightCm || prof.height || ''}
                        onChange={(e) => updateField('profile', 'heightCm', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. 175 or 5ft 9in"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Weight (kg)</label>
                      <input
                        type="text"
                        value={prof.weight || prof.weightKg || ''}
                        onChange={(e) => updateField('profile', 'weight', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. 70"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Complexion</label>
                      <input
                        type="text"
                        value={prof.complexion || ''}
                        onChange={(e) => updateField('profile', 'complexion', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Fair, Wheatish"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Diet</label>
                      <input
                        type="text"
                        value={prof.diet || ''}
                        onChange={(e) => updateField('profile', 'diet', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. VEG, NON_VEG"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-slate-700 block mb-1">About / Bio</label>
                      <textarea
                        rows={2}
                        value={prof.about || ''}
                        onChange={(e) => updateField('profile', 'about', e.target.value)}
                        className="w-full textarea textarea-sm text-xs rounded-lg border-slate-300"
                        placeholder="Brief summary extracted from biodata..."
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Religion & Horoscope */}
                {activeReviewTab === 'religion' && (
                  <div className="space-y-6 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Religion</label>
                        <input
                          type="text"
                          value={prof.religion || ''}
                          onChange={(e) => updateField('profile', 'religion', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. Hindu"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Caste / Community</label>
                        <input
                          type="text"
                          value={prof.caste || prof.community || ''}
                          onChange={(e) => {
                            updateField('profile', 'caste', e.target.value);
                            updateField('profile', 'community', e.target.value);
                          }}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. Nadar, Mudaliar, Brahmin"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Subcaste</label>
                        <input
                          type="text"
                          value={prof.subCaste || prof.sub_caste || ''}
                          onChange={(e) => updateField('profile', 'subCaste', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. Kongu, Vadama"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Gothram</label>
                        <input
                          type="text"
                          value={horo.gothram || prof.gothram || ''}
                          onChange={(e) => updateField('horoscope', 'gothram', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. Kashyapa, Bharadwaja"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Rasi (Moon Sign)</label>
                        <input
                          type="text"
                          value={horo.rasi || prof.rasi || ''}
                          onChange={(e) => updateField('horoscope', 'rasi', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. Mesha, Mithuna, Simha"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Star / Nakshatra</label>
                        <input
                          type="text"
                          value={horo.star || prof.star || prof.nakshatra || ''}
                          onChange={(e) => updateField('horoscope', 'star', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. Ashwini, Rohini, Revati"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Lagnam (Ascendant)</label>
                        <input
                          type="text"
                          value={horo.lagnam || ''}
                          onChange={(e) => updateField('horoscope', 'lagnam', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. Dhanu, Makara"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Dosham</label>
                        <input
                          type="text"
                          value={horo.dosham || prof.dosham || ''}
                          onChange={(e) => updateField('horoscope', 'dosham', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. No Dosham, Sevvai Dosham, Rahu-Kethu"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Time of Birth</label>
                        <input
                          type="text"
                          value={horo.birthTime || horo.birth_time || prof.birth_time || ''}
                          onChange={(e) => updateField('horoscope', 'birthTime', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. 06:12 AM"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Place of Birth</label>
                        <input
                          type="text"
                          value={horo.birthPlace || horo.birth_place || prof.birth_place || ''}
                          onChange={(e) => updateField('horoscope', 'birthPlace', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. Mumbai, Chennai"
                        />
                      </div>
                    </div>

                    {/* ASTROLOGY CHARTS (RASI & NAVAMSAM) */}
                    <div className="border-t border-slate-200 pt-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <h4 className="font-bold text-sm text-rose-950 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-rose-600" />
                            Astrology Charts (à®œà®¾à®¤à®• à®•à®Ÿà¯à®Ÿà®™à¯à®•à®³à¯)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            AI-extracted planetary positions in South Indian format. Click any planet tag to add or remove it from that house.
                          </p>
                        </div>
                      </div>

                      {/* Charts stacked one by one (Rasi Chart on top, Navamsam Chart below) */}
                      <div className="space-y-6">
                        {/* RASI CHART */}
                        <div className="border-2 border-rose-900 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div className="bg-rose-900 text-white font-bold text-xs uppercase px-4 py-2.5 flex items-center justify-between">
                            <span className="tracking-wide">RASI CHART (à®°à®¾à®šà®¿ à®•à®Ÿà¯à®Ÿà®®à¯)</span>
                            <span className="text-[10px] text-amber-200 font-semibold bg-rose-950/50 px-2.5 py-0.5 rounded">
                              Click tags to add/remove planets
                            </span>
                          </div>
                          <div className="grid grid-cols-4 grid-rows-4 gap-1 bg-rose-900 p-1 text-[10px]">
                            {HOUSES.map((h) => {
                              const planetsStr = rasiChart[h.id] || '';
                              const currentList = planetsStr ? planetsStr.split(/[, ]+/).filter(Boolean) : [];
                              return (
                                <div
                                  key={h.id}
                                  style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                                  className="bg-rose-50/95 hover:bg-amber-50/80 p-2 flex flex-col justify-between border border-rose-200 min-h-[105px] transition rounded-sm shadow-xs"
                                >
                                  <div className="font-bold text-rose-950 text-[10px] sm:text-[11px] border-b border-rose-200/50 pb-0.5 flex justify-between items-center">
                                    <span>{h.tamil}</span>
                                    <span className="text-[8.5px] text-rose-800/70 font-normal">{h.id}</span>
                                  </div>
                                  <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[11px] py-1 px-1">
                                    {planetsStr ? (
                                      <span className="text-rose-950 font-black tracking-tight">{planetsStr}</span>
                                    ) : (
                                      <span className="text-rose-400 font-normal text-[9px]">-</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 justify-center mt-1">
                                    {PLANETS.map((p) => {
                                      const active = currentList.includes(p.short);
                                      return (
                                        <button
                                          key={p.short}
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); togglePlanetInChart('rasiChart', h.id, p.short); }}
                                          title={p.label}
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                                            active
                                              ? 'bg-rose-900 text-white shadow-xs scale-105'
                                              : 'bg-white text-slate-700 hover:bg-rose-100 hover:text-rose-900 border border-slate-300'
                                          }`}
                                        >
                                          {p.short}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                            <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex flex-col items-center justify-center font-black text-rose-900 text-xl sm:text-2xl border-2 border-rose-900 shadow-inner">
                              <span>RASI</span>
                              <span className="text-[10px] text-rose-600 font-semibold tracking-wider mt-0.5">à®°à®¾à®šà®¿ à®•à®Ÿà¯à®Ÿà®®à¯</span>
                            </div>
                          </div>
                        </div>

                        {/* NAVAMSAM CHART (PLACED DOWN TO FIRST ONE) */}
                        <div className="border-2 border-rose-900 rounded-xl overflow-hidden shadow-sm bg-white">
                          <div className="bg-rose-900 text-white font-bold text-xs uppercase px-4 py-2.5 flex items-center justify-between">
                            <span className="tracking-wide">NAVAMSAM CHART (à®…à®®à¯à®š à®•à®Ÿà¯à®Ÿà®®à¯)</span>
                            <span className="text-[10px] text-amber-200 font-semibold bg-rose-950/50 px-2.5 py-0.5 rounded">
                              Click tags to add/remove planets
                            </span>
                          </div>
                          <div className="grid grid-cols-4 grid-rows-4 gap-1 bg-rose-900 p-1 text-[10px]">
                            {HOUSES.map((h) => {
                              const planetsStr = amsamChart[h.id] || '';
                              const currentList = planetsStr ? planetsStr.split(/[, ]+/).filter(Boolean) : [];
                              return (
                                <div
                                  key={h.id}
                                  style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                                  className="bg-rose-50/95 hover:bg-amber-50/80 p-2 flex flex-col justify-between border border-rose-200 min-h-[105px] transition rounded-sm shadow-xs"
                                >
                                  <div className="font-bold text-rose-950 text-[10px] sm:text-[11px] border-b border-rose-200/50 pb-0.5 flex justify-between items-center">
                                    <span>{h.tamil}</span>
                                    <span className="text-[8.5px] text-rose-800/70 font-normal">{h.id}</span>
                                  </div>
                                  <div className="font-extrabold text-slate-900 text-center leading-tight my-auto text-[11px] py-1 px-1">
                                    {planetsStr ? (
                                      <span className="text-rose-950 font-black tracking-tight">{planetsStr}</span>
                                    ) : (
                                      <span className="text-rose-400 font-normal text-[9px]">-</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 justify-center mt-1">
                                    {PLANETS.map((p) => {
                                      const active = currentList.includes(p.short);
                                      return (
                                        <button
                                          key={p.short}
                                          type="button"
                                          onClick={(e) => { e.stopPropagation(); togglePlanetInChart('amsamChart', h.id, p.short); }}
                                          title={p.label}
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                                            active
                                              ? 'bg-rose-900 text-white shadow-xs scale-105'
                                              : 'bg-white text-slate-700 hover:bg-rose-100 hover:text-rose-900 border border-slate-300'
                                          }`}
                                        >
                                          {p.short}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                            <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-white flex flex-col items-center justify-center font-black text-rose-900 text-xl sm:text-2xl border-2 border-rose-900 shadow-inner">
                              <span>NAVAMSAM</span>
                              <span className="text-[10px] text-rose-600 font-semibold tracking-wider mt-0.5">à®…à®®à¯à®š à®•à®Ÿà¯à®Ÿà®®à¯</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Education & Career */}
                {activeReviewTab === 'education' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Highest Degree / Qualification</label>
                      <input
                        type="text"
                        value={edu.degree || edu.highest_qualification || ''}
                        onChange={(e) => updateField('education', 'degree', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. B.Tech, MBA, MBBS"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy || edu.specialization || ''}
                        onChange={(e) => updateField('education', 'fieldOfStudy', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Computer Science, Finance"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">University / Institution</label>
                      <input
                        type="text"
                        value={edu.university || ''}
                        onChange={(e) => updateField('education', 'university', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Anna University, IIT"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Designation / Occupation</label>
                      <input
                        type="text"
                        value={occ.designation || occ.occupation || ''}
                        onChange={(e) => updateField('career', 'designation', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Software Engineer, Doctor"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Employment Type</label>
                      <input
                        type="text"
                        value={occ.employmentType || occ.employment_type || ''}
                        onChange={(e) => updateField('career', 'employmentType', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. PRIVATE, GOVT, BUSINESS"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={occ.company || ''}
                        onChange={(e) => updateField('career', 'company', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Infosys, TCS, Self"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Annual Income</label>
                      <input
                        type="text"
                        value={occ.annualIncome || occ.annual_income || occ.salary || occ.salaryMin || ''}
                        onChange={(e) => updateField('career', 'annualIncome', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. 12 Lakhs, 800000"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Work Location</label>
                      <input
                        type="text"
                        value={occ.workingLocation || occ.work_location || ''}
                        onChange={(e) => updateField('career', 'workingLocation', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Bangalore, Chennai"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 4: Family Details */}
                {activeReviewTab === 'family' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Father's Name</label>
                      <input
                        type="text"
                        value={fam.fatherName || fam.father_name || ''}
                        onChange={(e) => updateField('family', 'fatherName', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Rajesh Modi"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Father's Occupation</label>
                      <input
                        type="text"
                        value={fam.fatherOccupation || fam.father_occupation || ''}
                        onChange={(e) => updateField('family', 'fatherOccupation', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Businessman, Retired"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Mother's Name</label>
                      <input
                        type="text"
                        value={fam.motherName || fam.mother_name || ''}
                        onChange={(e) => updateField('family', 'motherName', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Sunita Modi"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Mother's Occupation</label>
                      <input
                        type="text"
                        value={fam.motherOccupation || fam.mother_occupation || ''}
                        onChange={(e) => updateField('family', 'motherOccupation', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Homemaker, Teacher"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Native Place</label>
                      <input
                        type="text"
                        value={fam.nativePlace || fam.native_place || ''}
                        onChange={(e) => updateField('family', 'nativePlace', e.target.value)}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                        placeholder="e.g. Madurai, Tirunelveli"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Family Type</label>
                      <select
                        value={fam.familyType || 'NUCLEAR'}
                        onChange={(e) => updateField('family', 'familyType', e.target.value)}
                        className="w-full select select-sm text-xs rounded-lg border-slate-300"
                      >
                        <option value="NUCLEAR">Nuclear Family</option>
                        <option value="JOINT">Joint Family</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Total Brothers</label>
                      <input
                        type="number"
                        min="0"
                        value={fam.brothers ?? 0}
                        onChange={(e) => updateField('family', 'brothers', Number(e.target.value))}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Married Brothers</label>
                      <input
                        type="number"
                        min="0"
                        value={fam.brothersMarried ?? fam.brothers_married ?? 0}
                        onChange={(e) => updateField('family', 'brothersMarried', Number(e.target.value))}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Total Sisters</label>
                      <input
                        type="number"
                        min="0"
                        value={fam.sisters ?? 0}
                        onChange={(e) => updateField('family', 'sisters', Number(e.target.value))}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Married Sisters</label>
                      <input
                        type="number"
                        min="0"
                        value={fam.sistersMarried ?? fam.sisters_married ?? 0}
                        onChange={(e) => updateField('family', 'sistersMarried', Number(e.target.value))}
                        className="w-full input input-sm text-xs rounded-lg border-slate-300"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 5: Contact & Location */}
                {activeReviewTab === 'contact' && (
                  <div className="space-y-4 text-xs">
                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      isPhoneVerified || isEmailVerified
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      {isPhoneVerified || isEmailVerified
                        ? <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        : <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />}
                      <div>
                        <p className={`font-bold text-xs ${ isPhoneVerified || isEmailVerified ? 'text-emerald-800' : 'text-amber-800' }`}>
                          {isPhoneVerified || isEmailVerified
                            ? 'Contact verified — ready to save to database'
                            : 'Verify mobile or email via OTP before saving'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          The member will use the verified contact + initial password to log in.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Contact Phone & Inline OTP */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-700 text-xs">Contact Mobile Number</label>
                          {isPhoneVerified && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={contact.phone || contact.mobile || ''}
                            onChange={(e) => {
                              updateField('contact', 'phone', e.target.value);
                              if (isPhoneVerified) setIsPhoneVerified(false);
                            }}
                            disabled={isPhoneVerified}
                            className={`flex-1 input input-sm text-xs rounded-lg ${
                              isPhoneVerified ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold' : 'border-slate-300'
                            }`}
                            placeholder="e.g. 9876543210"
                          />
                          {!isPhoneVerified && (
                            <button
                              type="button"
                              onClick={handleSendPhoneOtp}
                              disabled={sendingPhoneOtp || !(contact.phone || contact.mobile)?.trim()}
                              className="btn btn-sm px-3 bg-primary text-white text-xs font-bold rounded-lg whitespace-nowrap shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {sendingPhoneOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                              {phoneOtpSent ? 'Resend OTP' : 'Send OTP'}
                            </button>
                          )}
                        </div>

                        {/* Inline Phone OTP Field */}
                        {!isPhoneVerified && (
                          <div className="p-2.5 bg-slate-50/80 border border-slate-200 hover:border-primary/30 rounded-xl space-y-2 transition-colors">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Key className="w-3.5 h-3.5 text-primary" /> Enter Mobile OTP
                              </span>
                              {phoneDevOtp && (
                                <button
                                  type="button"
                                  onClick={() => setPhoneOtpCode(phoneDevOtp)}
                                  className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded transition-colors"
                                  title="Click to auto-fill"
                                >
                                  Dev OTP: {phoneDevOtp} (click to fill)
                                </button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={phoneOtpCode}
                                onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyPhoneOtp(); }}
                                placeholder="Enter 6-digit OTP"
                                className="flex-1 input input-sm text-xs text-center font-mono font-bold tracking-widest rounded-lg border-slate-300 bg-white focus:border-primary"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyPhoneOtp}
                                disabled={verifyingPhoneOtp || phoneOtpCode.length !== 6}
                                className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg px-3 whitespace-nowrap shadow-sm disabled:opacity-50 flex items-center gap-1"
                              >
                                {verifyingPhoneOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                Verify
                              </button>
                            </div>
                            {phoneTimer > 0 && (
                              <p className="text-[10px] text-slate-400">Resend OTP available in {phoneTimer}s</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Contact Email & Inline OTP */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-700 text-xs">Contact Email Address</label>
                          {isEmailVerified && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={contact.email || ''}
                            onChange={(e) => {
                              updateField('contact', 'email', e.target.value);
                              if (isEmailVerified) setIsEmailVerified(false);
                            }}
                            disabled={isEmailVerified}
                            className={`flex-1 input input-sm text-xs rounded-lg ${
                              isEmailVerified ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold' : 'border-slate-300'
                            }`}
                            placeholder="e.g. member@example.com"
                          />
                          {!isEmailVerified && (
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={sendingEmailOtp || !contact.email?.trim()}
                              className="btn btn-sm px-3 bg-primary text-white text-xs font-bold rounded-lg whitespace-nowrap shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {sendingEmailOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                              {emailOtpSent ? 'Resend OTP' : 'Send OTP'}
                            </button>
                          )}
                        </div>

                        {/* Inline Email OTP Field */}
                        {!isEmailVerified && (
                          <div className="p-2.5 bg-slate-50/80 border border-slate-200 hover:border-primary/30 rounded-xl space-y-2 transition-colors">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-700 flex items-center gap-1">
                                <Key className="w-3.5 h-3.5 text-primary" /> Enter Email OTP
                              </span>
                              {emailDevOtp && (
                                <button
                                  type="button"
                                  onClick={() => setEmailOtpCode(emailDevOtp)}
                                  className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded transition-colors"
                                  title="Click to auto-fill"
                                >
                                  Dev OTP: {emailDevOtp} (click to fill)
                                </button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={emailOtpCode}
                                onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyEmailOtp(); }}
                                placeholder="Enter 6-digit OTP"
                                className="flex-1 input input-sm text-xs text-center font-mono font-bold tracking-widest rounded-lg border-slate-300 bg-white focus:border-primary"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyEmailOtp}
                                disabled={verifyingEmailOtp || emailOtpCode.length !== 6}
                                className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg px-3 whitespace-nowrap shadow-sm disabled:opacity-50 flex items-center gap-1"
                              >
                                {verifyingEmailOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                Verify
                              </button>
                            </div>
                            {emailTimer > 0 && (
                              <p className="text-[10px] text-slate-400">Resend OTP available in {emailTimer}s</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Initial Login Password */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                          <Key className="w-3.5 h-3.5 text-primary" />
                          Initial Login Password
                        </label>
                        <div className="flex gap-2">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={initialPassword}
                            onChange={(e) => setInitialPassword(e.target.value)}
                            className="flex-1 input input-sm text-xs rounded-lg border-slate-300"
                            placeholder="e.g. Welcome@123"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(p => !p)}
                            className="btn btn-sm btn-ghost border border-slate-200 rounded-lg"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">Member will use this password along with their mobile/email to log in.</p>
                      </div>

                      {/* City / State / Country */}
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 text-xs">City</label>
                        <input
                          type="text"
                          value={contact.city || prof.city || ''}
                          onChange={(e) => updateField('contact', 'city', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. Chennai, Mumbai"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1 text-xs">State</label>
                        <input
                          type="text"
                          value={contact.state || prof.state || ''}
                          onChange={(e) => updateField('contact', 'state', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. Tamil Nadu"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-semibold text-slate-700 block mb-1 text-xs">Country</label>
                        <input
                          type="text"
                          value={contact.country || prof.country || 'India'}
                          onChange={(e) => updateField('contact', 'country', e.target.value)}
                          className="w-full input input-sm text-xs rounded-lg border-slate-300"
                          placeholder="e.g. India"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Save Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isPhoneVerified && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Phone âœ“
                      </span>
                    )}
                    {isEmailVerified && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Email âœ“
                      </span>
                    )}
                    {!isPhoneVerified && !isEmailVerified && (
                      <span className="text-[10px] font-medium text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Verify contact in the Contact tab first
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveToDb}
                    disabled={saving || (!isPhoneVerified && !isEmailVerified)}
                    className="btn bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white btn-sm px-4 font-bold shadow-md rounded-xl flex items-center gap-2"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    {saving ? 'Creating Account...' : 'Save & Create Member Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>



    {/* Member Credentials Card (shown after successful save) */}
    {savedResult?.credentials && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Member Account Created!</h3>
              <p className="text-xs text-slate-500">Share these credentials with the member</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Member ID</span>
              <span className="font-bold text-slate-900">{savedResult.memberId}</span>
            </div>
            {savedResult.credentials.phone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Mobile</span>
                <span className="font-bold text-slate-900">{savedResult.credentials.phone}</span>
              </div>
            )}
            {savedResult.credentials.email && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Email</span>
                <span className="font-bold text-slate-900 text-xs">{savedResult.credentials.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-slate-500 text-xs">Password</span>
              <span className="font-bold text-primary tracking-wide">{savedResult.credentials.password}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            The member can log in using their <strong>mobile number or email</strong> and the password above.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                const text = [
                  `S2S Matrimony â€” Member Login`,
                  `Member ID: ${savedResult.memberId}`,
                  savedResult.credentials.phone ? `Mobile: ${savedResult.credentials.phone}` : '',
                  savedResult.credentials.email ? `Email: ${savedResult.credentials.email}` : '',
                  `Password: ${savedResult.credentials.password}`,
                  `Login at: ${window.location.origin}/login`,
                ].filter(Boolean).join('\n');
                navigator.clipboard.writeText(text);
                toast.success('Credentials copied to clipboard!');
              }}
              className="btn flex-1 bg-primary text-white font-bold rounded-xl"
            >
              <Copy className="w-4 h-4 mr-1" /> Copy Credentials
            </button>
            <button
              onClick={() => setSavedResult(null)}
              className="btn btn-ghost border border-slate-200 rounded-xl flex-1"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default AdminAiBiodata;
