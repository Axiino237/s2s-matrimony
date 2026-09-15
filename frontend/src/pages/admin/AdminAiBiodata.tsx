import { useState } from 'react';
import { Sparkles, Upload, CheckCircle2, Code, Copy, RefreshCw, Database, ExternalLink, Image as ImageIcon, XCircle, User, FileText, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeMultipleFilesWithGemini } from '../../services/gemini.service';
import { profilesApi } from '../../services/profiles.service';

interface UploadedFileItem {
  file: File;
  previewUrl: string;
  isPdf: boolean;
}

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
Salary: ₹14,00,000 / Year (14 LPA)
Work Location: Chennai
Father Name: M. Kandasamy
Father Occupation: Business
Mother Name: K. Parvathi (Homemaker)
Mobile: 9876543210
Email: ramasamy.k@gmail.com
Address: No 45, Gandhi Street, T.Nagar, Chennai 600017
Horoscope: Suddha Jathagam, Chevvai: No`;

const AdminAiBiodata = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [savedResult, setSavedResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'charts' | 'json'>('charts');

  const handleParse = async () => {
    if (uploadedFiles.length === 0) {
      return toast.error('Please upload at least one biodata image or PDF document first');
    }

    setParsing(true);
    setSavedResult(null);
    try {
      toast.loading(`🔍 Gemini AI Vision reading ${uploadedFiles.length} file(s)...`, { id: 'g' });
      const rawFiles = uploadedFiles.map((item) => item.file);
      const data = await analyzeMultipleFilesWithGemini(rawFiles);
      toast.dismiss('g');
      setExtractedData(data);
      toast.success(`✨ Gemini AI extracted all biodata & horoscope fields from ${uploadedFiles.length} file(s)!`);
    } catch (err: any) {
      toast.dismiss('g');
      const msg = err?.message || 'Failed to extract biodata with Gemini AI';
      toast.error(msg);
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const newItems: UploadedFileItem[] = [];
    const filesArray = Array.from(fileList);

    filesArray.forEach((file) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      if (isPdf || isImage) {
        const previewUrl = URL.createObjectURL(file);
        newItems.push({ file, previewUrl, isPdf });
      } else {
        toast.error(`Unsupported format for ${file.name}. Please upload PDF, JPG, PNG, or WEBP.`);
      }
    });

    if (newItems.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newItems]);
      toast.success(`📄 ${newItems.length} file(s) attached successfully!`);
    }

    // Reset input value so same files can be re-selected if needed
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => {
      const updated = [...prev];
      const removed = updated.splice(index, 1)[0];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return updated;
    });
  };

  const handleClearAllFiles = () => {
    uploadedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setUploadedFiles([]);
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

      const rasiChartData = d.horoscope?.rasiChart || d.rasiChart || {};
      const amsamChartData = d.horoscope?.amsamChart || d.amsamChart || {};

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
        horoscope: {
          rasi: d.horoscope?.rasi || d.rasi || null,
          nakshatra: d.horoscope?.nakshatra || d.nakshatra || d.star || null,
          star: d.horoscope?.star || d.horoscope?.nakshatra || d.star || d.nakshatra || null,
          star_padam: d.horoscope?.starPadam || d.starPadam || null,
          lagnam: d.horoscope?.lagnam || d.lagnam || null,
          gothram: d.horoscope?.gothram || d.gothram || null,
          kuladeivam: d.horoscope?.kuladeivam || d.kuladeivam || null,
          dosham: d.horoscope?.dosham || d.dosham || null,
          chevvai: d.horoscope?.chevvai || d.chevvai || null,
          dasa_balance: d.horoscope?.dasaBalance || d.dasaBalance || null,
          birth_place: d.horoscope?.birthPlace || d.birthPlace || null,
          birth_time: d.horoscope?.birthTime || d.birthTime || null,
          horoscope_details: d.horoscopeDetails || d.horoscope?.horoscopeDetails || null,
          rasi_chart: rasiChartData,
          amsam_chart: amsamChartData,
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
          {uploadedFiles.length > 0 ? (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {uploadedFiles.length} File(s) Attached (PDF & Images)
                </span>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="admin-biodata-add-more-input"
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add More
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="admin-biodata-add-more-input"
                  />
                  <button
                    type="button"
                    onClick={handleClearAllFiles}
                    className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-800/40 hover:bg-rose-900/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                </div>
              </div>

              {/* Gallery of Uploaded Files */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto p-1">
                {uploadedFiles.map((item, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    {item.isPdf ? (
                      <div className="aspect-[4/3] flex flex-col items-center justify-center p-3 bg-gradient-to-br from-rose-950/60 to-slate-950 text-center">
                        <FileText className="w-8 h-8 text-rose-400 mb-1 animate-pulse" />
                        <span className="text-[10px] font-bold text-rose-200 bg-rose-900/50 px-1.5 py-0.5 rounded border border-rose-700/50">
                          PDF Document
                        </span>
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    )}

                    <div className="p-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 truncate max-w-[90px] font-medium" title={item.file.name}>
                        {item.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-rose-400 hover:text-rose-300 p-0.5 rounded hover:bg-rose-950 transition-colors"
                        title="Remove this file"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <span>📸 All pages will be merged by Gemini Vision AI into one profile</span>
                <span className="font-mono text-emerald-400 font-bold">{uploadedFiles.length} file(s) ready</span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-2xl p-12 text-center bg-slate-50/50 hover:bg-white transition-all space-y-3">
              <Upload className="w-12 h-12 text-primary mx-auto animate-bounce" />
              <div>
                <p className="text-text-primary font-bold text-sm">Upload Biodata Document(s), PDF or Images</p>
                <p className="text-text-muted text-xs mt-1">Supports PDF, JPG, PNG, WEBP — Multi-page & Multiple files supported</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1.5 bg-emerald-50 inline-block px-2 py-0.5 rounded-full">✦ Powered by Google Gemini 2.5 Flash Vision — reads Tamil, English, Hindi</p>
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="admin-biodata-file-input"
              />
              <label htmlFor="admin-biodata-file-input" className="btn btn-secondary btn-sm cursor-pointer inline-flex items-center gap-2 font-bold shadow-sm">
                <ImageIcon className="w-4 h-4 text-primary" /> Browse PDF / Images (Multi-File)
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

        {/* Right Column — Output Preview (Charts & JSON) */}
        <div className="card p-6 bg-slate-950 text-slate-100 border border-slate-900 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('charts')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'charts'
                      ? 'bg-rose-900/80 text-white shadow-sm border border-rose-700/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🪐</span> Rasi & Navamsam Charts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'json'
                      ? 'bg-emerald-950/80 text-emerald-300 shadow-sm border border-emerald-700/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" /> Full JSON Schema
                </button>
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
              activeTab === 'charts' ? (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {/* Horoscope Highlights Badge Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Rasi (ராசி)</span>
                      <span className="font-bold text-amber-300">{extractedData.horoscope?.rasi || extractedData.rasi || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Star (நட்சத்திரம்)</span>
                      <span className="font-bold text-amber-300">{extractedData.horoscope?.nakshatra || extractedData.nakshatra || extractedData.star || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Lagnam (லக்னம்)</span>
                      <span className="font-bold text-emerald-400">{extractedData.horoscope?.lagnam || extractedData.lagnam || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Chevvai / Dosham</span>
                      <span className="font-bold text-rose-400">{extractedData.horoscope?.chevvai || extractedData.chevvai || extractedData.dosham || 'None'}</span>
                    </div>
                  </div>

                  {/* 2 South Indian Horoscope Grids (Rasi Chart & Navamsam Chart) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* RASI CHART */}
                    <div className="border border-rose-900/80 bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
                      <div className="bg-gradient-to-r from-rose-950 to-rose-900 text-rose-200 font-bold text-xs uppercase px-3 py-2 text-center border-b border-rose-800/60">
                        RASI CHART (ராசி கட்டம்)
                      </div>
                      <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-rose-950/80 p-1 aspect-square text-[10px]">
                        {HOUSES.map((h) => {
                          const planets = extractedData.horoscope?.rasiChart?.[h.id] || extractedData.rasiChart?.[h.id] || '';
                          return (
                            <div
                              key={h.id}
                              style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                              className="bg-slate-950 p-1.5 flex flex-col justify-between border border-rose-900/40 rounded min-h-[42px]"
                            >
                              <span className="text-[8px] font-bold text-slate-400 truncate">{h.tamil}</span>
                              <div className="font-extrabold text-amber-300 text-center leading-tight my-auto text-[9px] break-words">
                                {planets ? (
                                  <span className="bg-amber-950/80 text-amber-200 px-1 py-0.5 rounded border border-amber-800/60">
                                    {planets}
                                  </span>
                                ) : (
                                  <span className="text-slate-700 text-[8px] font-mono">—</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {/* Center Label */}
                        <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-rose-950/40 flex items-center justify-center font-extrabold text-rose-400 text-sm tracking-widest border border-rose-800/40 rounded">
                          RASI
                        </div>
                      </div>
                    </div>

                    {/* NAVAMSAM CHART */}
                    <div className="border border-indigo-900/80 bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
                      <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 text-indigo-200 font-bold text-xs uppercase px-3 py-2 text-center border-b border-indigo-800/60">
                        NAVAMSAM CHART (நவாம்ச கட்டம்)
                      </div>
                      <div className="grid grid-cols-4 grid-rows-4 gap-0.5 bg-indigo-950/80 p-1 aspect-square text-[10px]">
                        {HOUSES.map((h) => {
                          const planets = extractedData.horoscope?.amsamChart?.[h.id] || extractedData.amsamChart?.[h.id] || '';
                          return (
                            <div
                              key={h.id}
                              style={{ gridRow: h.row + 1, gridColumn: h.col + 1 }}
                              className="bg-slate-950 p-1.5 flex flex-col justify-between border border-indigo-900/40 rounded min-h-[42px]"
                            >
                              <span className="text-[8px] font-bold text-slate-400 truncate">{h.tamil}</span>
                              <div className="font-extrabold text-cyan-300 text-center leading-tight my-auto text-[9px] break-words">
                                {planets ? (
                                  <span className="bg-cyan-950/80 text-cyan-200 px-1 py-0.5 rounded border border-cyan-800/60">
                                    {planets}
                                  </span>
                                ) : (
                                  <span className="text-slate-700 text-[8px] font-mono">—</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {/* Center Label */}
                        <div className="col-start-2 col-span-2 row-start-2 row-span-2 bg-indigo-950/40 flex items-center justify-center font-extrabold text-indigo-400 text-sm tracking-widest border border-indigo-800/40 rounded">
                          NAVAMSAM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <pre className="text-xs font-mono leading-relaxed text-emerald-300 overflow-x-auto max-h-[460px] p-4 bg-slate-900/90 rounded-2xl border border-slate-800">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              )
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
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Extracted 50+ fields & Horoscope 12-Box Charts. Click "Save Profile to DB" to store in database.
              </span>
            </div>
          ) : null}
        </div>
      </div>

    </div>
  );
};

export default AdminAiBiodata;
