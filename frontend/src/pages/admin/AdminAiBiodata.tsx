import { useState } from 'react';
import { Sparkles, FileText, Upload, CheckCircle2, Code, Copy, RefreshCw, Database, ExternalLink, Image as ImageIcon, XCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { profilesApi } from '../../services/profiles.service';

const SAMPLE_TAMIL_BIODATA = `MATRIMONIAL BIODATA
Name: K. Ramasamy
DOB: 14/08/1997
Age: 28
Gender: Male
Height: 5 ft 10 in
Weight: 72 kg
Mother Tongue: Tamil
Religion: Hindu
Caste: Kongu Vellalar
Gothram: Siva Gothram
Rasi: Simmam (Leo)
Star: Moolam
Education: B.E. Computer Science Engineering
College: Anna University Chennai
Occupation: Senior Software Engineer
Company: Tata Consultancy Services (TCS)
Salary: ₹14,000,000 / Year (14 LPA)
Work Location: Chennai
Father Name: M. Kandasamy
Father Occupation: Business
Mother Name: K. Parvathi (Homemaker)
Mobile: 9876543210
Email: ramasamy.k@gmail.com
Address: No 45, Gandhi Street, T.Nagar, Chennai 600017
Horoscope: Suddha Jathagam, Chevvai: No`;

const AdminAiBiodata = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState(SAMPLE_TAMIL_BIODATA);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [savedResult, setSavedResult] = useState<any>(null);

  const handleParse = async () => {
    if (activeTab === 'text' && !rawText.trim()) {
      return toast.error('Please paste or type biodata text first');
    }
    if (activeTab === 'file' && !imagePreview && !rawText.trim()) {
      return toast.error('Please upload an image or document file first');
    }

    setParsing(true);
    setSavedResult(null);
    try {
      const data = await profilesApi.parseBiodata(
        activeTab === 'file' && imagePreview ? '' : rawText,
        imagePreview || undefined
      );
      setExtractedData(data);
      toast.success('✨ AI extracted all biodata & horoscope fields successfully!');
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

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImagePreview(base64);
        toast.success(`📸 Biodata Image Loaded: ${file.name}`);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setRawText(content || '');
        toast.success(`Loaded file: ${file.name}`);
      };
      reader.readAsText(file);
    }
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
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleCopyJson = () => {
    if (!extractedData) return;
    navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
    toast.success('Copied JSON schema to clipboard!');
  };

  const handleSaveToDb = async () => {
    if (!extractedData) return;
    setSaving(true);
    try {
      const payload = {
        ...extractedData,
        profile_photo: profilePicPreview || extractedData.profile_photo || extractedData.profile?.profile_photo,
      };
      const result = await profilesApi.saveParsedProfile(payload);
      setSavedResult(result);
      toast.success(`🎉 Profile & Photo successfully stored in Database! (ID: ${result.profileId})`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save profile to database');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
              Extract 50+ structured fields from English, Tamil, Hindi, or scanned document images & PDFs
            </p>
          </div>
        </div>

        <button
          onClick={handleParse}
          disabled={parsing}
          className="btn btn-primary btn-sm flex items-center gap-2 font-bold shadow-md bg-gradient-primary text-white"
        >
          {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {parsing ? 'Extracting...' : 'Extract with AI'}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column — Input */}
        <div className="card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'text' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Text Input
              </button>
              <button
                onClick={() => setActiveTab('file')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'file' ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Document / Photo
              </button>
            </div>

            <button
              onClick={() => { setActiveTab('text'); setRawText(SAMPLE_TAMIL_BIODATA); }}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Load Sample
            </button>
          </div>

          {activeTab === 'text' ? (
            <textarea
              rows={14}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste biodata here..."
              className="input w-full font-mono text-xs leading-relaxed p-4 bg-slate-50 border-slate-200 focus:bg-white"
            />
          ) : imagePreview ? (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-white space-y-3 relative group">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-400" /> {selectedFile?.name || 'Uploaded Image'}
                </span>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" /> Remove
                </button>
              </div>
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                <img src={imagePreview} alt="Biodata Preview" className="max-h-full max-w-full object-contain" />
              </div>
              <p className="text-[11px] text-slate-400 text-center font-mono">
                📸 Ready for AI Vision OCR extraction. Click "Run AI Extraction Engine"!
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-2xl p-12 text-center bg-slate-50/50 hover:bg-white transition-all space-y-3">
              <Upload className="w-12 h-12 text-primary mx-auto animate-bounce" />
              <div>
                <p className="text-text-primary font-bold text-sm">Upload Biodata Document or Image</p>
                <p className="text-text-muted text-xs mt-1">Supports JPG, PNG, WEBP, PDF, or TXT files</p>
              </div>
              <input
                type="file"
                accept="image/*,.pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="admin-biodata-file-input"
              />
              <label htmlFor="admin-biodata-file-input" className="btn btn-secondary btn-sm cursor-pointer inline-flex items-center gap-2 font-bold shadow-sm">
                <ImageIcon className="w-4 h-4 text-primary" /> Browse Image / File
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
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">{profilePicFile?.name || 'Profile Photo'}</p>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1 inline-block">
                    ✓ Photo ready to save with profile
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
                  <Upload className="w-4 h-4 text-rose-500" /> Upload Member Profile Photo (Picture)
                </label>
              </div>
            )}
          </div>

          <button
            onClick={handleParse}
            disabled={parsing}
            className="btn btn-primary w-full justify-center py-2.5 text-xs font-bold shadow-md"
          >
            {parsing ? 'Extracting with AI...' : '✨ Run AI Extraction Engine'}
          </button>
        </div>

        {/* Right Column — Output JSON */}
        <div className="card p-6 bg-slate-950 text-slate-100 border border-slate-900 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-emerald-400">Structured JSON Output</h3>
              </div>

              {extractedData && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="btn btn-ghost btn-xs text-xs text-slate-300 hover:text-white flex items-center gap-1 border border-slate-800"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy JSON
                  </button>

                  <button
                    onClick={handleSaveToDb}
                    disabled={saving}
                    className="btn bg-emerald-600 hover:bg-emerald-500 text-white btn-xs text-xs flex items-center gap-1 font-bold shadow-md border border-emerald-500"
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    {saving ? 'Saving to DB...' : '💾 Save Profile to DB'}
                  </button>
                </div>
              )}
            </div>

            {extractedData ? (
              <pre className="text-xs font-mono leading-relaxed text-emerald-300 overflow-x-auto max-h-[460px] p-4 bg-slate-900/90 rounded-2xl border border-slate-800">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            ) : (
              <div className="py-24 text-center text-slate-500 space-y-2">
                <Sparkles className="w-10 h-10 mx-auto opacity-30 animate-pulse text-emerald-500" />
                <p className="text-xs font-mono">No extraction executed yet. Click "Run AI Extraction Engine"!</p>
              </div>
            )}
          </div>

          {savedResult ? (
            <div className="p-3 bg-emerald-950/80 rounded-xl border border-emerald-600/80 flex items-center justify-between flex-wrap gap-2 animate-pulse">
              <span className="text-xs text-emerald-200 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Stored in DB! Profile: <strong>{savedResult.displayName}</strong> ({savedResult.profileId.slice(0, 8)}...)
              </span>
              <a
                href="/admin/profiles"
                className="text-xs text-emerald-300 hover:text-white underline font-bold flex items-center gap-1"
              >
                View Profiles <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : extractedData ? (
            <div className="p-3 bg-emerald-950/60 rounded-xl border border-emerald-800/80 flex items-center justify-between">
              <span className="text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Extracted 50+ matrimony fields successfully. Click "Save Profile to DB" to store in database.
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdminAiBiodata;
