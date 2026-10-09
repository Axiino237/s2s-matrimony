import { useState } from 'react';
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
  ShieldCheck,
  Check,
  Lock,
  Mail,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { profilesApi } from '../../services/profiles.service';

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
  const [copied, setCopied] = useState(false);

  const handleParse = async () => {
    if (!selectedFile && !imagePreview && !rawText.trim()) {
      return toast.error('Please upload a biodata document or photo first');
    }

    setParsing(true);
    setSavedResult(null);
    try {
      const data = await profilesApi.parseBiodata(
        rawText,
        imagePreview || undefined,
        selectedFile?.name
      );
      setExtractedData(data);
      toast.success('✨ AI extracted structured biodata successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to extract biodata with AI');
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nameLower = file.name.toLowerCase();
    const isJpeg = /\.(jpe?g)$/i.test(nameLower) || file.type === 'image/jpeg' || file.type === 'image/jpg';
    const isPng = /\.png$/i.test(nameLower) || file.type === 'image/png';
    const isPdf = /\.pdf$/i.test(nameLower) || file.type === 'application/pdf';
    const isDocx =
      /\.docx$/i.test(nameLower) ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword';

    if (!isJpeg && !isPng && !isPdf && !isDocx) {
      toast.error('Unsupported file format. Please upload a PDF, DOCX, JPEG, or PNG biodata file.');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setRawText('');

      if (isPdf) {
        toast.success(`📄 Biodata PDF Loaded: ${file.name}`);
      } else if (isDocx) {
        toast.success(`📄 Biodata DOCX Loaded: ${file.name}`);
      } else {
        toast.success(`📸 Biodata Image Loaded: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
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
      toast.success(`👤 Profile Photo Loaded: ${file.name}`);
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
    setCopied(true);
    toast.success('Copied structured JSON to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToDb = async () => {
    if (!extractedData) return;
    setSaving(true);
    try {
      const horo = extractedData.horoscope || {};
      const rasiChart = horo.rasiChart || extractedData.rasiChart || null;
      const amsamChart = horo.amsamChart || extractedData.amsamChart || null;

      const payload = {
        ...extractedData,
        rasiChart,
        amsamChart,
        horoscope: { ...horo, rasiChart, amsamChart },
        profile_photo: profilePicPreview || extractedData.profile_photo || extractedData.profile?.profile_photo,
      };

      const result = await profilesApi.saveParsedProfile(payload);
      setSavedResult(result);
      toast.success(`🎉 Profile saved & member account activated! ID: ${result.memberId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save profile to database');
    } finally {
      setSaving(false);
    }
  };

  // Profile details shortcuts and credentials generation
  const prof = extractedData?.profile || {};
  const contact = extractedData?.contact || {};
  const displayName = prof.displayName || prof.name || `${prof.firstName || ''} ${prof.lastName || ''}`.trim() || 'Member';

  // First name rules: lowercase for email, normal capitalization for password
  const nameParts = (prof.name || prof.displayName || '').trim().split(/\s+/).filter(Boolean);
  let firstNameToken = (prof.firstName || prof.first_name || '').trim().split(/\s+/)[0] || '';
  if (!firstNameToken || (firstNameToken.replace(/[^a-zA-Z]/g, '').length <= 2 && nameParts.length > 1)) {
    const nonInitial = nameParts.find((part: string) => part.replace(/[^a-zA-Z]/g, '').length > 2);
    if (nonInitial) firstNameToken = nonInitial;
  }
  if (!firstNameToken && nameParts.length > 0) firstNameToken = nameParts[0];
  if (!firstNameToken) firstNameToken = 'Member';

  const cleanFirstName = firstNameToken.replace(/[^a-zA-Z]/g, '') || 'Member';
  const capitalizedFirstName = cleanFirstName.charAt(0).toUpperCase() + cleanFirstName.slice(1).toLowerCase();
  const lowercaseFirstName = cleanFirstName.toLowerCase();

  // Mobile number rules
  const rawMobile = contact.mobile || contact.phone || prof.mobile || prof.phone || '';
  const mobileDigits = String(rawMobile).replace(/\D/g, '');
  const hasValidMobile = mobileDigits.length >= 10;
  const last4Digits = mobileDigits.length >= 4 ? mobileDigits.slice(-4) : '0000';
  const loginPhone = hasValidMobile
    ? (mobileDigits.startsWith('91') && mobileDigits.length === 12 ? `+${mobileDigits}` : `+91${mobileDigits.slice(-10)}`)
    : null;

  // Login Email & Password rules:
  // If email present: use extracted email. Otherwise: firstname + last4Digits + @gmail.com
  const rawExtractedEmail = contact.email || prof.email;
  const hasExtractedEmail = Boolean(rawExtractedEmail && typeof rawExtractedEmail === 'string' && rawExtractedEmail.includes('@'));
  const loginEmail = hasExtractedEmail
    ? String(rawExtractedEmail).trim().toLowerCase()
    : `${lowercaseFirstName}${last4Digits}@gmail.com`;

  const initialPassword = `${capitalizedFirstName}@${last4Digits}`;

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
                AI Biodata Direct Import & Database Saver
              </h1>
              <p className="text-text-secondary text-sm mt-0.5">
                Extract structured JSON from biodata images or documents with Gemini AI and save directly to the database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleParse}
              disabled={parsing || (!selectedFile && !imagePreview && !rawText.trim())}
              className="btn btn-primary btn-sm flex items-center gap-2 font-bold shadow-md bg-gradient-primary text-white disabled:opacity-50"
            >
              {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {parsing ? 'Extracting with AI...' : 'Extract with AI'}
            </button>

            {extractedData && (
              <button
                onClick={handleSaveToDb}
                disabled={saving}
                className="btn btn-sm px-4 flex items-center gap-2 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save to Database'}
              </button>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column (5 Cols) — Document / Photo Upload */}
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
                accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,image/jpeg,image/png"
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
                    {selectedFile?.name?.toLowerCase().endsWith('.docx') ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <FileText className="w-16 h-16 text-blue-400 animate-pulse" />
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{selectedFile.name}</p>
                          <p className="text-xs text-slate-400 mt-1">DOCX Word Document ready for AI extraction</p>
                        </div>
                      </div>
                    ) : selectedFile?.type === 'application/pdf' || selectedFile?.name?.toLowerCase().endsWith('.pdf') ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <FileText className="w-16 h-16 text-rose-400 animate-pulse" />
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{selectedFile.name}</p>
                          <p className="text-xs text-slate-400 mt-1">PDF Document ready for multi-page AI extraction</p>
                        </div>
                      </div>
                    ) : (
                      <img src={imagePreview} alt="Biodata Preview" className="max-h-full max-w-full object-contain" />
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-400 font-mono">
                      {selectedFile?.name?.toLowerCase().endsWith('.docx')
                        ? '📄 DOCX ready for AI extraction'
                        : selectedFile?.type === 'application/pdf' || selectedFile?.name?.toLowerCase().endsWith('.pdf')
                        ? '📄 PDF ready for multi-page extraction'
                        : '📸 Photo ready for AI extraction'}
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
                  <p className="text-xs text-slate-600">Biodata ready for AI extraction.</p>
                  <label
                    htmlFor="admin-biodata-file-input"
                    className="text-xs text-primary font-bold hover:underline cursor-pointer inline-block"
                  >
                    Change File
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="admin-biodata-file-input"
                  className="border-2 border-dashed border-slate-300 hover:border-primary/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 hover:bg-primary/5 transition-all cursor-pointer group text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6 text-primary group-hover:text-primary-dark transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload Biodata (PDF, DOCX, JPEG, PNG)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports multi-page PDF, DOCX Word documents, JPEG, and PNG images
                    </p>
                  </div>
                </label>
              )}

              {/* Profile Photo (Optional) */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> Member Profile Photo (Profile Pic)
                  </label>
                  {profilePicPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePicFile(null);
                        setProfilePicPreview(null);
                      }}
                      className="text-[11px] text-rose-500 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  className="hidden"
                  id="admin-profile-pic-input"
                />

                {profilePicPreview ? (
                  <div className="flex items-center gap-3 p-3 bg-rose-50/50 border border-rose-100 rounded-xl">
                    <img
                      src={profilePicPreview}
                      alt="Profile Pic"
                      className="w-12 h-12 rounded-xl object-cover border border-rose-200 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {profilePicFile?.name || 'Profile Photo'}
                      </p>
                      <p className="text-[10px] text-slate-500">Will be saved as main profile picture</p>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="admin-profile-pic-input"
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-xl bg-white text-xs font-bold text-rose-700 cursor-pointer transition-all hover:bg-rose-50/50"
                  >
                    <Upload className="w-4 h-4 text-rose-500" /> Upload Profile Picture
                  </label>
                )}
              </div>

              <button
                onClick={handleParse}
                disabled={parsing || (!selectedFile && !imagePreview && !rawText.trim())}
                className="btn btn-primary w-full justify-center py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
              >
                {parsing ? 'Extracting with AI...' : '✨ Run AI Extraction Engine'}
              </button>
            </div>
          </div>

          {/* Right Column (7 Cols) — Raw Structured JSON Output */}
          <div className="lg:col-span-7 space-y-4">
            <div className="card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
              {/* Action Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm">
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Raw Structured JSON</span>
                  </div>
                  {extractedData && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready to Save
                    </span>
                  )}
                </div>

                {extractedData && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyJson}
                      className="btn btn-ghost btn-xs text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 border border-slate-200"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </button>

                    <button
                      onClick={handleSaveToDb}
                      disabled={saving}
                      className="btn btn-xs px-3 py-1.5 text-xs flex items-center gap-1.5 font-bold shadow-md rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                    >
                      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                      {saving ? 'Saving...' : 'Save Directly to Database'}
                    </button>
                  </div>
                )}
              </div>

              {/* Extraction Content */}
              {parsing ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Extracting Biodata with Gemini AI...</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Analyzing document text, personal details, education, occupation, and family background.
                  </p>
                </div>
              ) : extractedData ? (
                <div className="space-y-4">
                  {/* Summary Banner */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Member Name</span>
                      <span className="font-bold text-slate-900 truncate block">{displayName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Login Email</span>
                      <span className="font-medium text-slate-800 truncate block">
                        <span className="text-primary font-bold">{loginEmail}</span>
                        <span className="text-[9px] text-slate-400 block">{hasExtractedEmail ? '(from biodata)' : '(auto-generated)'}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Initial Password</span>
                      <span className="font-mono font-bold text-emerald-700 truncate block" title="Firstname@Last4">
                        {initialPassword}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Mobile</span>
                      <span className={`font-medium truncate block ${!hasValidMobile ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                        {loginPhone || 'Not Mentioned (Default 0000)'}
                      </span>
                    </div>
                  </div>

                  {!hasValidMobile && (
                    <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-medium flex items-start justify-between gap-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-base flex-shrink-0">⚠️</span>
                        <div>
                          <p className="font-bold text-rose-900">Mobile number is not mentioned in this biodata.</p>
                          <p className="text-rose-700 text-[11px] mt-0.5">
                            You can save anyway! An account will be created with default credentials using 0s (Email: <strong>{loginEmail}</strong>, Password: <strong>{initialPassword}</strong>). The mobile number can be updated later in Member Management.
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 rounded-md border border-rose-300 whitespace-nowrap">
                        Not Mentioned
                      </span>
                    </div>
                  )}

                  {/* JSON Editor / Code Block */}
                  <div className="relative group">
                    <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-auto max-h-[560px] leading-relaxed border border-slate-800 selection:bg-emerald-900 shadow-inner">
                      {JSON.stringify(extractedData, null, 2)}
                    </pre>
                  </div>

                  {/* Direct Save Action */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      💡 Click below to save this extracted profile directly to the database.
                    </p>
                    <button
                      type="button"
                      onClick={handleSaveToDb}
                      disabled={saving}
                      className="btn bg-emerald-600 hover:bg-emerald-700 text-white btn-sm px-5 font-bold shadow-md rounded-xl flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      {saving ? 'Saving...' : 'Save Profile to Database'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Code className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">No Extracted Data Yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Upload a biodata photo or document on the left and click <strong>Extract with AI</strong>. The structured JSON will appear here and can be saved directly to the database.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Member Credentials Modal (shown after successful save) */}
      {savedResult?.credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-scale-up border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Member Profile Saved to Database!</h3>
                <p className="text-xs text-slate-500">Account activated with initial login credentials</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Member ID</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{savedResult.memberId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-xs">Member Name</span>
                <span className="font-bold text-slate-900">{savedResult.displayName || displayName}</span>
              </div>
              {savedResult.credentials.loginEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Login Email</span>
                  <span className="font-bold text-primary text-xs">{savedResult.credentials.loginEmail}</span>
                </div>
              )}
              {savedResult.credentials.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-xs">Login Mobile</span>
                  <span className="font-bold text-slate-900">{savedResult.credentials.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-slate-500 text-xs">Initial Password</span>
                <span className="font-bold text-emerald-700 tracking-wide bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {savedResult.credentials.password || initialPassword}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Password has been securely stored using bcrypt hashing. The member can log in using their{' '}
              <strong>{savedResult.credentials.loginEmail ? 'email or mobile' : 'mobile number / Member ID'}</strong> and the password above.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  const text = [
                    `S2S Matrimony — Member Credentials`,
                    `Member ID: ${savedResult.memberId}`,
                    `Name: ${savedResult.displayName || displayName}`,
                    savedResult.credentials.loginEmail ? `Login Email: ${savedResult.credentials.loginEmail}` : '',
                    savedResult.credentials.phone ? `Login Mobile: ${savedResult.credentials.phone}` : '',
                    `Initial Password: ${savedResult.credentials.password || initialPassword}`,
                    `Login at: ${window.location.origin}/login`,
                  ].filter(Boolean).join('\n');
                  navigator.clipboard.writeText(text);
                  toast.success('Credentials copied to clipboard!');
                }}
                className="btn flex-1 bg-primary text-white font-bold rounded-xl text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4" /> Copy Credentials
              </button>
              <button
                onClick={() => setSavedResult(null)}
                className="btn btn-ghost border border-slate-200 rounded-xl px-4 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminAiBiodata;
