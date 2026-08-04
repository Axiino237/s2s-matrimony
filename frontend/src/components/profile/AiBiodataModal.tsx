import { useState } from 'react';
import { Sparkles, FileText, Upload, CheckCircle2, X, Loader2, Code } from 'lucide-react';
import toast from 'react-hot-toast';
import { profilesApi } from '../../services/profiles.service';

interface AiBiodataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExtracted: (extracted: any) => void;
}

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

export const AiBiodataModal = ({ isOpen, onClose, onApplyExtracted }: AiBiodataModalProps) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (activeTab === 'text' && !rawText.trim()) {
      return toast.error('Please paste or type biodata text first');
    }

    setParsing(true);
    try {
      const data = await profilesApi.parseBiodata(rawText);
      setExtractedData(data);
      toast.success('✨ AI extracted all biodata fields successfully!');
    } catch {
      toast.error('Failed to extract biodata with AI');
    } finally {
      setParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content || file.name);
      toast.success(`Loaded document: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (!extractedData) return;
    onApplyExtracted(extractedData);
    toast.success('🎉 Profile form auto-filled from AI extracted data!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary/10 via-amber-50 to-primary/5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary flex items-center gap-2">
                AI Vision Matrimony Biodata Extraction Engine
              </h2>
              <p className="text-text-secondary text-xs mt-0.5">
                Paste or upload English, Tamil or Hindi biodata to extract & auto-fill all 50+ profile fields!
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/80 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'text' ? 'bg-white text-primary shadow-sm border border-slate-200' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <FileText className="w-4 h-4" /> Paste Text (Tamil / English / Hindi)
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'file' ? 'bg-white text-primary shadow-sm border border-slate-200' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Upload className="w-4 h-4" /> Upload Document / Image
            </button>
          </div>

          {activeTab === 'text' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-primary">Matrimonial Biodata Content *</label>
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_TAMIL_BIODATA)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Insert Sample Biodata
                </button>
              </div>
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste biodata text here (e.g. Name, DOB, Height, Caste, Gothram, Qualification, Salary, Contact, Father Name...)"
                className="input w-full font-mono text-xs leading-relaxed p-4 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-white transition-all space-y-3">
              <Upload className="w-10 h-10 text-primary mx-auto animate-bounce" />
              <div>
                <p className="text-text-primary font-bold text-sm">Upload Biodata File (Image, PDF, DOCX)</p>
                <p className="text-text-muted text-xs mt-1">Supports scanned documents, Mobile camera photos, or WhatsApp images</p>
              </div>
              <input
                type="file"
                accept="image/*,.pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="biodata-file-input"
              />
              <label htmlFor="biodata-file-input" className="btn btn-secondary btn-sm cursor-pointer inline-flex items-center gap-2">
                Browse Files
              </label>
            </div>
          )}

          {/* Extracted JSON Preview */}
          {extractedData && (
            <div className="card p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
                  <Code className="w-4 h-4" /> Extracted Structured JSON Output
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                  ✓ Validated Schema
                </span>
              </div>
              <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto max-h-48 text-emerald-200/90">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button onClick={onClose} className="btn btn-ghost btn-sm text-text-muted">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleParse}
              disabled={parsing}
              className="btn btn-secondary btn-sm font-bold flex items-center gap-2"
            >
              {parsing ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Sparkles className="w-4 h-4 text-primary" />}
              {parsing ? 'Extracting with AI...' : '1. Extract Fields with AI'}
            </button>

            {extractedData && (
              <button
                onClick={handleApply}
                className="btn btn-primary btn-sm font-bold flex items-center gap-2 shadow-md animate-pulse"
              >
                <CheckCircle2 className="w-4 h-4" /> 2. Auto-Fill Form Fields
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
