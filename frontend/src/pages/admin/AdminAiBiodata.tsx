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
  Download,
  Eye,
  Trash2,
  Star,
  Plus,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { profilesApi } from '../../services/profiles.service';
import {
  getEffectiveUploadLimits,
  validateFileBatch,
  serializeHoroscopeFiles,
  ALLOWED_UPLOAD_FORMATS,
} from '../../utils/upload-limits';

export interface BiodataFileItem {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

export interface ProfilePhotoItem {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  isMain: boolean;
}

function isValuePresent(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    if (
      lower === 'null' ||
      lower === 'undefined' ||
      lower === 'none' ||
      lower === 'n/a' ||
      lower === 'not specified' ||
      lower === 'unknown'
    ) {
      return false;
    }
    return true;
  }
  if (typeof val === 'number') {
    return !isNaN(val);
  }
  if (typeof val === 'boolean') {
    return true;
  }
  if (Array.isArray(val)) {
    return val.length > 0;
  }
  if (typeof val === 'object') {
    return Object.keys(val).length > 0 && Object.values(val).some(isValuePresent);
  }
  return false;
}

function mergeChartObjects(existingChart: any, incomingChart: any): Record<string, string> {
  const merged: Record<string, string> = { ...(existingChart || {}) };
  if (!incomingChart || typeof incomingChart !== 'object') return merged;

  for (const [house, incomingPlanets] of Object.entries(incomingChart)) {
    if (typeof incomingPlanets !== 'string') continue;
    const existingPlanets = merged[house] || '';
    if (!existingPlanets.trim()) {
      merged[house] = incomingPlanets.trim();
    } else {
      const existingList = existingPlanets.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean);
      const incomingList = incomingPlanets.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean);
      const combined = Array.from(new Set([...existingList, ...incomingList]));
      merged[house] = combined.join(', ');
    }
  }
  return merged;
}

function mergeBiodataObjects(base: any, incoming: any): any {
  if (!base && !incoming) return null;
  if (!base) return incoming;
  if (!incoming) return base;

  const result: any = { ...base };

  for (const key of Object.keys(incoming)) {
    const incVal = incoming[key];
    const baseVal = result[key];

    if (!isValuePresent(incVal)) {
      continue;
    }

    if (!isValuePresent(baseVal)) {
      result[key] = incVal;
      continue;
    }

    if (key === 'rasiChart' || key === 'amsamChart') {
      result[key] = mergeChartObjects(baseVal, incVal);
      continue;
    }

    if (Array.isArray(baseVal) && Array.isArray(incVal)) {
      result[key] = Array.from(new Set([...baseVal, ...incVal]));
      continue;
    }

    if (
      typeof baseVal === 'object' &&
      typeof incVal === 'object' &&
      !Array.isArray(baseVal) &&
      !Array.isArray(incVal)
    ) {
      result[key] = mergeBiodataObjects(baseVal, incVal);
      continue;
    }

    if (typeof baseVal === 'string' && typeof incVal === 'string') {
      if (baseVal.length < incVal.length && incVal.toLowerCase().includes(baseVal.toLowerCase())) {
        result[key] = incVal;
      }
    }
  }

  // Cross-synchronize top-level rasiChart / amsamChart with nested horoscope
  if (result.horoscope) {
    if (result.rasiChart) {
      result.horoscope.rasiChart = mergeChartObjects(result.horoscope.rasiChart, result.rasiChart);
      result.rasiChart = result.horoscope.rasiChart;
    } else if (result.horoscope.rasiChart) {
      result.rasiChart = result.horoscope.rasiChart;
    }

    if (result.amsamChart) {
      result.horoscope.amsamChart = mergeChartObjects(result.horoscope.amsamChart, result.amsamChart);
      result.amsamChart = result.horoscope.amsamChart;
    } else if (result.horoscope.amsamChart) {
      result.amsamChart = result.horoscope.amsamChart;
    }
  }

  return result;
}

const AdminAiBiodata = () => {
  const limits = getEffectiveUploadLimits();
  const [biodataFiles, setBiodataFiles] = useState<BiodataFileItem[]>([]);
  const [rawText, setRawText] = useState<string>('');
  const [profilePhotos, setProfilePhotos] = useState<ProfilePhotoItem[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [savedResult, setSavedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [parseProgress, setParseProgress] = useState<{
    currentIndex: number;
    totalFiles: number;
    currentFileName: string;
  } | null>(null);

  const [fileProcessStatus, setFileProcessStatus] = useState<
    Record<string, { status: 'idle' | 'processing' | 'success' | 'error'; error?: string }>
  >({});

  const handleParse = async () => {
    if (parsing) return;
    if (biodataFiles.length === 0 && !rawText.trim()) {
      return toast.error('Please upload at least one biodata document or enter text first');
    }

    setParsing(true);
    setSavedResult(null);

    // Initialize per-file status to idle
    const initialStatus: Record<
      string,
      { status: 'idle' | 'processing' | 'success' | 'error'; error?: string }
    > = {};
    biodataFiles.forEach((f) => {
      initialStatus[f.id] = { status: 'idle' };
    });
    setFileProcessStatus(initialStatus);

    let combinedData: any = null;
    let successCount = 0;
    let failedCount = 0;
    const totalItems = biodataFiles.length + (rawText.trim() ? 1 : 0);

    // 1. Process every uploaded file sequentially one by one
    for (let i = 0; i < biodataFiles.length; i++) {
      const fileItem = biodataFiles[i];

      // Add brief spacing between files to prevent provider rate limiting and connection pooling hangs
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      setParseProgress({
        currentIndex: i + 1,
        totalFiles: totalItems,
        currentFileName: fileItem.name,
      });

      setFileProcessStatus((prev) => ({
        ...prev,
        [fileItem.id]: { status: 'processing' },
      }));

      const fileStartTime = Date.now();
      try {
        const fileExtracted = await profilesApi.parseBiodata(
          '',
          fileItem.preview,
          fileItem.name
        );

        const elapsedSec = ((Date.now() - fileStartTime) / 1000).toFixed(1);
        console.log(
          `✅ [AI Biodata] File "${fileItem.name}" extracted successfully in ${elapsedSec}s (Stage: Vision/NLP Parsing)`
        );

        combinedData = mergeBiodataObjects(combinedData, fileExtracted);
        successCount++;

        setFileProcessStatus((prev) => ({
          ...prev,
          [fileItem.id]: { status: 'success' },
        }));
      } catch (err: any) {
        failedCount++;
        const elapsedSec = ((Date.now() - fileStartTime) / 1000).toFixed(1);
        const isTimeout =
          err?.code === 'ECONNABORTED' ||
          err?.message?.toLowerCase().includes('timeout') ||
          err?.response?.data?.message?.toLowerCase().includes('timeout');
        const errMsg = isTimeout
          ? 'Extraction timed out. You can retry this file.'
          : err?.response?.data?.message || err?.message || 'Extraction failed';

        console.error(
          `❌ [AI Biodata] File "${fileItem.name}" failed after ${elapsedSec}s | Stage: AI Extraction | Error:`,
          err
        );

        setFileProcessStatus((prev) => ({
          ...prev,
          [fileItem.id]: { status: 'error', error: errMsg },
        }));
        toast.error(`⚠️ "${fileItem.name}": ${errMsg}`);
      }
    }

    // 2. If rawText is provided as well, process and merge it
    if (rawText.trim()) {
      setParseProgress({
        currentIndex: biodataFiles.length + 1,
        totalFiles: totalItems,
        currentFileName: 'Manual Text Input',
      });

      try {
        const textExtracted = await profilesApi.parseBiodata(rawText);
        combinedData = mergeBiodataObjects(combinedData, textExtracted);
        successCount++;
      } catch (err: any) {
        failedCount++;
        const errMsg = err?.response?.data?.message || err?.message || 'Text parsing failed';
        toast.error(`⚠️ Manual text parsing: ${errMsg}`);
      }
    }

    setParsing(false);
    setParseProgress(null);

    if (combinedData) {
      setExtractedData(combinedData);
      if (failedCount > 0) {
        toast.success(
          `✨ Extracted & combined data from ${successCount} source(s). (${failedCount} file(s) had errors)`
        );
      } else {
        toast.success(
          `✨ Successfully processed all ${successCount} file(s) and combined into one consolidated profile!`
        );
      }
    } else {
      toast.error('Could not extract valid profile information from the uploaded files.');
    }
  };

  const handleRetrySingleFile = async (fileId: string) => {
    if (parsing) return;
    const fileItem = biodataFiles.find((b) => b.id === fileId);
    if (!fileItem) return;

    setParsing(true);
    setParseProgress({
      currentIndex: 1,
      totalFiles: 1,
      currentFileName: fileItem.name,
    });
    setFileProcessStatus((prev) => ({
      ...prev,
      [fileItem.id]: { status: 'processing' },
    }));

    const fileStartTime = Date.now();
    try {
      const fileExtracted = await profilesApi.parseBiodata(
        '',
        fileItem.preview,
        fileItem.name
      );
      const elapsedSec = ((Date.now() - fileStartTime) / 1000).toFixed(1);
      console.log(
        `✅ [AI Biodata Retry] File "${fileItem.name}" extracted successfully in ${elapsedSec}s`
      );

      const merged = mergeBiodataObjects(extractedData, fileExtracted);
      setExtractedData(merged);
      setFileProcessStatus((prev) => ({
        ...prev,
        [fileItem.id]: { status: 'success' },
      }));
      toast.success(`✨ Successfully extracted and merged "${fileItem.name}"!`);
    } catch (err: any) {
      const elapsedSec = ((Date.now() - fileStartTime) / 1000).toFixed(1);
      const isTimeout =
        err?.code === 'ECONNABORTED' ||
        err?.message?.toLowerCase().includes('timeout') ||
        err?.response?.data?.message?.toLowerCase().includes('timeout');
      const errMsg = isTimeout
        ? 'Extraction timed out. You can retry this file.'
        : err?.response?.data?.message || err?.message || 'Extraction failed';

      console.error(
        `❌ [AI Biodata Retry] File "${fileItem.name}" failed after ${elapsedSec}s | Stage: Retry Extraction | Error:`,
        err
      );

      setFileProcessStatus((prev) => ({
        ...prev,
        [fileItem.id]: { status: 'error', error: errMsg },
      }));
      toast.error(`⚠️ "${fileItem.name}": ${errMsg}`);
    } finally {
      setParsing(false);
      setParseProgress(null);
    }
  };

  const handleRetryFailedFiles = async () => {
    if (parsing) return;
    const failedFiles = biodataFiles.filter(
      (b) => fileProcessStatus[b.id]?.status === 'error'
    );
    if (failedFiles.length === 0) return;

    setParsing(true);
    let currentCombined = extractedData ? { ...extractedData } : null;
    let retriedSuccess = 0;

    for (let i = 0; i < failedFiles.length; i++) {
      const fileItem = failedFiles[i];

      // Add brief spacing between retried files
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      setParseProgress({
        currentIndex: i + 1,
        totalFiles: failedFiles.length,
        currentFileName: fileItem.name,
      });

      setFileProcessStatus((prev) => ({
        ...prev,
        [fileItem.id]: { status: 'processing' },
      }));

      const fileStartTime = Date.now();
      try {
        const fileExtracted = await profilesApi.parseBiodata(
          '',
          fileItem.preview,
          fileItem.name
        );
        const elapsedSec = ((Date.now() - fileStartTime) / 1000).toFixed(1);
        console.log(
          `✅ [AI Biodata Batch Retry] File "${fileItem.name}" extracted successfully in ${elapsedSec}s`
        );

        currentCombined = mergeBiodataObjects(currentCombined, fileExtracted);
        retriedSuccess++;
        setFileProcessStatus((prev) => ({
          ...prev,
          [fileItem.id]: { status: 'success' },
        }));
      } catch (err: any) {
        const elapsedSec = ((Date.now() - fileStartTime) / 1000).toFixed(1);
        const isTimeout =
          err?.code === 'ECONNABORTED' ||
          err?.message?.toLowerCase().includes('timeout') ||
          err?.response?.data?.message?.toLowerCase().includes('timeout');
        const errMsg = isTimeout
          ? 'Extraction timed out. You can retry this file.'
          : err?.response?.data?.message || err?.message || 'Extraction failed';

        console.error(
          `❌ [AI Biodata Batch Retry] File "${fileItem.name}" failed after ${elapsedSec}s | Stage: Batch Retry | Error:`,
          err
        );

        setFileProcessStatus((prev) => ({
          ...prev,
          [fileItem.id]: { status: 'error', error: errMsg },
        }));
        toast.error(`⚠️ "${fileItem.name}": ${errMsg}`);
      }
    }

    setParsing(false);
    setParseProgress(null);

    if (currentCombined) {
      setExtractedData(currentCombined);
    }
    if (retriedSuccess > 0) {
      toast.success(`✨ Retried and merged ${retriedSuccess} file(s) into member profile!`);
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    // Validate individually against limits & cumulative count
    const result = validateFileBatch(rawFiles, biodataFiles.length, 'biodata', limits);

    // Show clear error message for each rejected file
    result.rejectedFiles.forEach((rejected) => {
      toast.error(`"${rejected.file.name}": ${rejected.reason}`);
    });

    if (result.validFiles.length > 0) {
      const newItems: BiodataFileItem[] = [];
      for (const f of result.validFiles) {
        try {
          const preview = await readFileAsDataUrl(f);
          newItems.push({
            id: `biodata-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            file: f,
            preview,
            name: f.name,
            size: f.size,
            type: f.type,
          });
        } catch {
          toast.error(`Failed to read file ${f.name}`);
        }
      }

      if (newItems.length > 0) {
        setBiodataFiles((prev) => [...prev, ...newItems]);
        setFileProcessStatus((prev) => {
          const updated = { ...prev };
          newItems.forEach((item) => {
            updated[item.id] = { status: 'idle' };
          });
          return updated;
        });
        toast.success(
          `Added ${newItems.length} biodata document(s) (Total: ${biodataFiles.length + newItems.length}/${limits.maxBiodataFilesCount})`
        );
      }
    }

    e.target.value = '';
  };

  const handleRemoveBiodataFile = (id: string) => {
    setBiodataFiles((prev) => prev.filter((b) => b.id !== id));
    setFileProcessStatus((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    toast.success('Biodata file removed.');
  };

  const handleClearAllBiodata = () => {
    setBiodataFiles([]);
    setFileProcessStatus({});
    setRawText('');
    setParseProgress(null);
    toast.success('All biodata files cleared.');
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const result = validateFileBatch(rawFiles, profilePhotos.length, 'profilePhoto', limits);

    result.rejectedFiles.forEach((rejected) => {
      toast.error(`"${rejected.file.name}": ${rejected.reason}`);
    });

    if (result.validFiles.length > 0) {
      const newPhotos: ProfilePhotoItem[] = [];
      for (let i = 0; i < result.validFiles.length; i++) {
        const f = result.validFiles[i];
        try {
          const preview = await readFileAsDataUrl(f);
          newPhotos.push({
            id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            file: f,
            preview,
            name: f.name,
            size: f.size,
            isMain: profilePhotos.length === 0 && i === 0,
          });
        } catch {
          toast.error(`Failed to read ${f.name}`);
        }
      }

      if (newPhotos.length > 0) {
        setProfilePhotos((prev) => [...prev, ...newPhotos]);
        toast.success(
          `Added ${newPhotos.length} photo(s) (Total: ${profilePhotos.length + newPhotos.length}/${limits.maxProfilePhotosCount})`
        );
      }
    }

    e.target.value = '';
  };

  const handleRemoveProfilePhoto = (id: string) => {
    setProfilePhotos((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      if (remaining.length > 0 && !remaining.some((p) => p.isMain)) {
        remaining[0].isMain = true;
      }
      return remaining;
    });
    toast.success('Photo removed.');
  };

  const handleSetMainPhoto = (id: string) => {
    setProfilePhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isMain: p.id === id,
      }))
    );
    toast.success('Main profile photo updated.');
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

      const mainPhoto = profilePhotos.find((p) => p.isMain)?.preview || profilePhotos[0]?.preview;
      const allPhotoPreviews = profilePhotos.map((p) => p.preview);
      const horoDoc = biodataFiles.find((b) => /horoscope|jathag|kundal|graha|astrolog/i.test(b.name));
      const serializedHoro = horo.horoscopeFile || (horoDoc ? horoDoc.preview : null);

      const payload = {
        ...extractedData,
        rasiChart,
        amsamChart,
        horoscope: {
          ...horo,
          rasiChart,
          amsamChart,
          horoscopeFile: serializedHoro,
        },
        horoscopeFile: serializedHoro,
        profile_photo: mainPhoto || extractedData.profile_photo || extractedData.profile?.profile_photo,
        photos: allPhotoPreviews.length > 0 ? allPhotoPreviews : undefined,
        profile_photos: allPhotoPreviews.length > 0 ? allPhotoPreviews : undefined,
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
              disabled={parsing || (biodataFiles.length === 0 && !rawText.trim())}
              className="btn btn-primary btn-sm flex items-center gap-2 font-bold shadow-md bg-gradient-primary text-white disabled:opacity-50"
            >
              {parsing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {parsing
                ? parseProgress
                  ? `Extracting (${parseProgress.currentIndex}/${parseProgress.totalFiles})...`
                  : 'Extracting all files...'
                : biodataFiles.length > 1
                ? `Extract All (${biodataFiles.length} files)`
                : 'Extract with AI'}
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
            <div className="card p-6 bg-white border border-slate-200 shadow-sm space-y-5">
              {/* FIELD 1: Biodata Document / Photo Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Biodata Document / Photo Upload</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {biodataFiles.length} / {limits.maxBiodataFilesCount} files
                    </span>
                    {biodataFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllBiodata}
                        className="text-[11px] text-rose-500 font-bold hover:underline"
                        title="Remove all biodata documents"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Display Limits Banner */}
                <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] text-slate-600">
                  <span>Max {limits.maxBiodataFileSizeMb} MB per file • Up to {limits.maxBiodataFilesCount} files</span>
                  <span className="font-semibold text-slate-500">PDF, DOC, DOCX, JPEG, PNG</span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  multiple
                  accept={ALLOWED_UPLOAD_FORMATS.biodata.accept}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="admin-biodata-file-input"
                />

                {/* Retained Biodata Files List */}
                {biodataFiles.length > 0 && (
                  <div className="space-y-2">
                    {biodataFiles.map((b) => {
                      const statusInfo = fileProcessStatus[b.id] || { status: 'idle' };
                      const isPdf = b.type === 'application/pdf' || b.name.toLowerCase().endsWith('.pdf');
                      const isDoc = b.type.includes('word') || /\.(docx?)$/i.test(b.name);
                      const sizeKb = (b.size / 1024).toFixed(1);
                      const sizeMb = (b.size / (1024 * 1024)).toFixed(2);
                      const displaySize = b.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

                      return (
                        <div
                          key={b.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            statusInfo.status === 'processing'
                              ? 'bg-amber-50/80 border-amber-300 shadow-xs ring-1 ring-amber-200'
                              : statusInfo.status === 'success'
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : statusInfo.status === 'error'
                              ? 'bg-rose-50/50 border-rose-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isPdf ? (
                              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            ) : isDoc ? (
                              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            ) : (
                              <img
                                src={b.preview}
                                alt={b.name}
                                className="w-8 h-8 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate" title={b.name}>
                                {b.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-slate-500">{displaySize}</span>
                                {statusInfo.status === 'processing' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing...
                                  </span>
                                )}
                                {statusInfo.status === 'success' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5 text-emerald-700" /> Extracted
                                  </span>
                                )}
                                {statusInfo.status === 'error' && (
                                  <span
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1"
                                    title={statusInfo.error || 'Failed to extract'}
                                  >
                                    <AlertCircle className="w-2.5 h-2.5 text-rose-600" /> Failed
                                  </span>
                                )}
                                {statusInfo.status === 'idle' && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    Included in AI
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {statusInfo.status === 'error' && (
                              <button
                                type="button"
                                disabled={parsing}
                                onClick={() => handleRetrySingleFile(b.id)}
                                className="px-2 py-1 text-[10px] font-bold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition flex items-center gap-1 disabled:opacity-40"
                                title="Retry extracting this file"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span>Retry</span>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={parsing}
                              onClick={() => handleRemoveBiodataFile(b.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-40"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload Trigger / Dropzone */}
                {biodataFiles.length < limits.maxBiodataFilesCount ? (
                  <label
                    htmlFor="admin-biodata-file-input"
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center ${
                      biodataFiles.length > 0
                        ? 'border-slate-200 hover:border-primary/50 bg-slate-50/50 hover:bg-primary/5'
                        : 'border-slate-300 hover:border-primary/60 bg-slate-50/60 hover:bg-primary/5 p-6'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-primary">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {biodataFiles.length > 0
                          ? `+ Add More Biodata / Horoscope Files (${biodataFiles.length}/${limits.maxBiodataFilesCount})`
                          : 'Click to upload Biodata or Horoscope (PDF, DOC, DOCX, JPEG, PNG)'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Select multiple files • Biodata documents, horoscopes & images • Max {limits.maxBiodataFileSizeMb} MB per file
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="p-2.5 bg-slate-100 rounded-xl text-center text-xs text-slate-600 font-semibold border border-slate-200">
                    Maximum limit of {limits.maxBiodataFilesCount} biodata files reached.
                  </div>
                )}
              </div>

              {/* FIELD 2: Member Profile Photo (Profile Pic) */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> Member Profile Photo (Profile Pic)
                  </label>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {profilePhotos.length} / {limits.maxProfilePhotosCount} photos
                  </span>
                </div>

                {/* Display Limits Banner */}
                <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] text-slate-600">
                  <span>Max {limits.maxProfilePhotoSizeMb} MB per photo • Up to {limits.maxProfilePhotosCount} photos</span>
                  <span className="font-semibold text-slate-500">JPEG, PNG, WebP</span>
                </div>

                <input
                  type="file"
                  multiple
                  accept={ALLOWED_UPLOAD_FORMATS.profilePhoto.accept}
                  onChange={handleProfilePicUpload}
                  className="hidden"
                  id="admin-profile-pic-input"
                />

                {/* Retained Profile Photos Gallery */}
                {profilePhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {profilePhotos.map((p) => (
                      <div
                        key={p.id}
                        className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs"
                      >
                        <img src={p.preview} alt={p.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 text-white">
                          {!p.isMain && (
                            <button
                              type="button"
                              onClick={() => handleSetMainPhoto(p.id)}
                              className="px-2 py-0.5 rounded bg-primary text-white text-[9px] font-bold hover:bg-primary-dark"
                            >
                              Make Main
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveProfilePhoto(p.id)}
                            className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold hover:bg-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                        {p.isMain && (
                          <div className="absolute top-1 left-1 bg-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" /> Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {profilePhotos.length < limits.maxProfilePhotosCount ? (
                  <label
                    htmlFor="admin-profile-pic-input"
                    className="w-full flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-rose-200 hover:border-rose-400 rounded-xl bg-white text-xs font-bold text-rose-700 cursor-pointer transition-all hover:bg-rose-50/50"
                  >
                    <Upload className="w-3.5 h-3.5 text-rose-500" />
                    {profilePhotos.length > 0
                      ? `+ Add More Photos (${profilePhotos.length}/${limits.maxProfilePhotosCount})`
                      : 'Upload Profile Picture'}
                  </label>
                ) : (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-center text-xs text-rose-800 font-semibold">
                    Maximum limit of {limits.maxProfilePhotosCount} profile photos reached.
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleParse}
                disabled={parsing || (biodataFiles.length === 0 && !rawText.trim())}
                className="btn btn-primary w-full justify-center py-2.5 text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {parseProgress
                        ? `Extracting file ${parseProgress.currentIndex} of ${parseProgress.totalFiles}...`
                        : 'Extracting all files with AI...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {biodataFiles.length > 1
                        ? `✨ Extract All ${biodataFiles.length} Uploaded Files with AI`
                        : biodataFiles.length === 1
                        ? '✨ Extract Biodata with AI'
                        : '✨ Run AI Extraction Engine'}
                    </span>
                  </>
                )}
              </button>

              {/* Retry Failed Files Button (if any files failed) */}
              {biodataFiles.some((b) => fileProcessStatus[b.id]?.status === 'error') && !parsing && (
                <button
                  type="button"
                  onClick={handleRetryFailedFiles}
                  className="btn btn-sm w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 text-xs shadow-md flex items-center justify-center gap-1.5 rounded-xl transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    Retry {biodataFiles.filter((b) => fileProcessStatus[b.id]?.status === 'error').length} Failed File(s)
                  </span>
                </button>
              )}
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
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-base">
                      {parseProgress
                        ? `Processing File ${parseProgress.currentIndex} of ${parseProgress.totalFiles}`
                        : 'Extracting Files with Gemini AI...'}
                    </h3>
                    <p className="text-xs text-slate-600 font-mono font-medium max-w-sm truncate mx-auto">
                      {parseProgress?.currentFileName || 'Analyzing documents...'}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto pt-1">
                      Processing all files sequentially and combining extracted biodata & horoscope details into a single member profile.
                    </p>
                  </div>

                  {parseProgress && parseProgress.totalFiles > 0 && (
                    <div className="w-full max-w-xs space-y-1 pt-1">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className="bg-primary h-full transition-all duration-300 rounded-full"
                          style={{
                            width: `${Math.round(
                              (parseProgress.currentIndex / parseProgress.totalFiles) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {Math.round((parseProgress.currentIndex / parseProgress.totalFiles) * 100)}% complete
                      </span>
                    </div>
                  )}
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
              {savedResult.savedData?.hasHoroscopeFile && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
                  <span className="text-slate-500">Horoscope Document</span>
                  <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Attached to Profile
                  </span>
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
                    savedResult.savedData?.hasHoroscopeFile ? `Horoscope: Attached to Profile` : '',
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
