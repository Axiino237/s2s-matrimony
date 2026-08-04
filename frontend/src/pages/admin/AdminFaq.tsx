import { useState } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Save, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Faq { id: string; question: string; answer: string; order: number; isActive: boolean; }

const INITIAL_FAQS: Faq[] = [
  { id: '1', question: 'How do I create a matrimony profile?', answer: 'Register with your mobile number, verify OTP, then complete the 8-step profile wizard. Your profile will be reviewed within 24 hours.', order: 1, isActive: true },
  { id: '2', question: 'How can I view contact details?', answer: 'Contact details are available only to paid members. Purchase any membership plan (Silver, Gold, or Platinum) to unlock contact views based on your plan limits.', order: 2, isActive: true },
  { id: '3', question: 'Is my information safe on S2S Matrimony?', answer: 'Yes, we use enterprise-grade security with SSL encryption. Your personal information is never sold to third parties. You control what is visible in your privacy settings.', order: 3, isActive: true },
  { id: '4', question: 'How does profile verification work?', answer: 'Upload your Aadhaar, PAN, or Passport in the verification section. Our team reviews it within 24-48 hours and awards a verified badge to your profile.', order: 4, isActive: true },
];

const AdminFaq = () => {
  const [faqs, setFaqs] = useState<Faq[]>(INITIAL_FAQS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [saving, setSaving] = useState(false);

  const DEFAULT_FAQ: Faq = { id: '', question: '', answer: '', order: faqs.length + 1, isActive: true };

  const handleSave = async () => {
    if (!editing?.question || !editing?.answer) { toast.error('Question and answer are required'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    if (editing.id) {
      setFaqs(prev => prev.map(f => f.id === editing.id ? editing : f));
    } else {
      setFaqs(prev => [...prev, { ...editing, id: Date.now().toString() }]);
    }
    toast.success(editing.id ? 'FAQ updated!' : 'FAQ added!');
    setEditing(null);
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    setFaqs(prev => prev.filter(f => f.id !== id));
    toast.success('FAQ deleted');
  };

  const toggleActive = (id: string) => setFaqs(prev => prev.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><HelpCircle className="w-6 h-6 text-primary" /> FAQ Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage frequently asked questions displayed on the public site</p>
        </div>
        <button onClick={() => setEditing(DEFAULT_FAQ)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all">
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      <div className="space-y-3">
        {faqs.sort((a, b) => a.order - b.order).map((faq) => (
          <div key={faq.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${!faq.isActive ? 'opacity-60 border-slate-200' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-3 p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}>
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">{faq.order}</span>
              <p className="font-semibold text-slate-800 flex-1">{faq.question}</p>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={faq.isActive} onChange={() => toggleActive(faq.id)} className="w-3.5 h-3.5 accent-primary rounded" />
                  <span className="text-xs text-slate-500">{faq.isActive ? 'Active' : 'Hidden'}</span>
                </label>
                <button onClick={() => setEditing(faq)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(faq.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              {expandedId === faq.id ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
            </div>
            {expandedId === faq.id && (
              <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{editing.id ? 'Edit FAQ' : 'Add New FAQ'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Question *</label>
                <input type="text" value={editing.question} onChange={e => setEditing({ ...editing, question: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Enter the question..." />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Answer *</label>
                <textarea rows={4} value={editing.answer} onChange={e => setEditing({ ...editing, answer: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Write the answer..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Display Order</label>
                  <input type="number" value={editing.order} onChange={e => setEditing({ ...editing, order: parseInt(e.target.value) })} min={1} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.isActive} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} className="w-4 h-4 accent-primary rounded" />
                    <span className="text-sm font-medium text-slate-700">Active / Visible</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-rose-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing.id ? 'Update' : 'Add FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFaq;
