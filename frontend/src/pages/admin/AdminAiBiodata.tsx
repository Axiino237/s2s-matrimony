import { useState } from 'react';
import { Sparkles, Upload, CheckCircle2, Code, Copy, RefreshCw, Database, ExternalLink, Image as ImageIcon, XCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeImageWithGemini, analyzeBase64ImageWithGemini } from '../../services/gemini.service';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [savedResult, setSavedResult] = useState<any>(null);

  const handleParse = async () => {
    if (!imagePreview) {
      return toast.error('Please upload a biodata image or document first');
    }

    setParsing(true);
    setSavedResult(null);
    try {
      let data: Record<string, any>;
      toast.loading('🔍 Gemini Vision reading Tamil/English biodata image...', { id: 'g' });
      if (selectedFile) {
        data = await analyzeImageWithGemini(selectedFile);
      } else {
        data = await analyzeBase64ImageWithGemini(imagePreview);
      }
      toast.dismiss('g');
      setExtractedData(data);
      toast.success('✨ Gemini AI extracted all biodata & horoscope fields successfully!');
    } catch (err: any) {
      toast.dismiss('g');
      toast.error(err?.message || 'Failed to extract biodata with Gemini AI');
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
      toast.error('Please upload an image file (JPG, PNG, WEBP). Text/PDF not supported in image mode.');
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
      const d = extractedData;

      // Support both structured and flat objects
      const eduDegree = d.education?.degree || d.education?.highestQualification || d.education || null;
      const eduCollege = d.education?.college || d.college || null;
      const occ = d.career?.occupation || d.career?.designation || d.occupation || d.designation || null;
      const comp = d.career?.company || d.company || null;
      const loc = d.career?.workLocation || d.workLocation || d.currentCity || null;
      const inc = d.career?.annualIncome || d.annualIncome || d.salary || null;
      const fatName = d.family?.fatherName || d.fatherName || null;
      const fatJob = d.family?.fatherOccupation || d.fatherOccupation || null;
      const motName = d.family?.motherName || d.motherName || null;
      const motJob = d.family?.motherOccupation || d.motherOccupation || null;
      const mob = d.contact?.mobile || d.mobile || null;
      const em = d.contact?.email || d.email || null;
      const addr = d.contact?.address || d.address || null;
      const city = d.contact?.currentCity || d.currentCity || null;
      const exp = d.expectations || d.aboutPartner || null;

      const nested = {
        profile: {
          name: d.name || d.fullName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || null,
          first_name: d.firstName || (d.name ? String(d.name).split(' ')[0] : null),
          last_name: d.lastName || (d.name ? String(d.name).split(' ').slice(1).join(' ') : null),
          gender: d.gender || null,
          dob: d.dateOfBirth || d.dob || null,
          age: d.age || null,
          height: d.height || (d.heightCm ? `${d.heightCm} cm` : null),
          height_cm: d.heightCm || null,
          weight: d.weight || (d.weightKg ? `${d.weightKg} kg` : null),
          complexion: d.complexion || null,
          blood_group: d.bloodGroup || null,
          mother_tongue: d.motherTongue || 'Tamil',
          religion: d.religion || null,
          caste: d.caste || null,
          sub_caste: d.subCaste || null,
          gothram: d.gothram || null,
          rasi: d.horoscope?.rasi || d.rasi || null,
          nakshatra: d.horoscope?.nakshatra || d.nakshatra || d.star || null,
          chevvai: d.horoscope?.chevvai || d.chevvai || d.dosham || null,
          marital_status: d.maritalStatus || null,
          disability: d.disability || null,
          about: d.about || null,
          birth_place: d.birthPlace || d.horoscope?.birthPlace || null,
          birth_time: d.birthTime || d.horoscope?.birthTime || null,
          horoscope_details: d.horoscopeDetails || d.horoscope?.horoscopeDetails || null,
          member_id: d.memberId || null,
          profile_photo: profilePicPreview || d.profilePhotoUrl || null,
        },
        education: {
          highest_qualification: eduDegree,
          degree: eduDegree ? [eduDegree] : [],
          college: eduCollege,
          university: eduCollege,
        },
        career: {
          occupation: occ,
          designation: occ,
          company: comp,
          work_location: loc,
          annual_income: inc,
        },
        family: {
          father_name: fatName,
          father_occupation: fatJob,
          mother_name: motName,
          mother_occupation: motJob,
          siblings: d.family?.siblings ?? d.siblings ?? null,
          elder_brothers: d.family?.elderBrothers ?? d.elderBrothers ?? 0,
          younger_brothers: d.family?.youngerBrothers ?? d.youngerBrothers ?? 0,
          elder_sisters: d.family?.elderSisters ?? d.elderSisters ?? 0,
          younger_sisters: d.family?.youngerSisters ?? d.youngerSisters ?? 0,
          family_type: d.family?.familyType || d.familyType || null,
          family_status: d.family?.familyStatus || d.familyStatus || null,
          native_place: d.family?.nativePlace || d.nativePlace || null,
          property_assets: d.family?.propertyAssets || d.propertyAssets || d.propertyDetails || null,
        },
        contact: {
          mobile: mob ? [String(mob).replace(/[^\d,]/g, '').split(',')[0]] : [],
          email: em,
          address: addr,
          current_city: city,
        },
        expectations: exp,
      };

      const result = await profilesApi.saveParsedProfile(nested);
      setSavedResult(result);
      toast.success(`🎉 Profile saved to Database successfully! (ID: ${result.profileId || result.id || 'saved'})`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile to database';
      toast.error(msg);
      console.error('Save error:', err?.response?.data || err);
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
          {imagePreview ? (
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
                <p className="text-[10px] text-emerald-600 font-bold mt-1.5 bg-emerald-50 inline-block px-2 py-0.5 rounded-full">✦ Powered by Google Gemini 1.5 Flash Vision — reads Tamil, English, Hindi</p>
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
