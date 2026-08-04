import { useState } from 'react';
import { Star, Plus, Edit2, Trash2, Save, X, Loader2, Quote } from 'lucide-react';
import toast from 'react-hot-toast';

interface Testimonial { id: string; name: string; location: string; rating: number; message: string; avatar?: string; isActive: boolean; createdAt: string; }

const INITIAL: Testimonial[] = [
  { id: '1', name: 'Rajesh Kumar', location: 'Chennai', rating: 5, message: 'S2S Matrimony helped me find my life partner within 3 months. The profile quality and verification process gave me confidence.', isActive: true, createdAt: '2025-01-15' },
  { id: '2', name: 'Priya Devi', location: 'Coimbatore', rating: 5, message: 'Excellent platform! Found my husband here. The community-based matching is really accurate and helpful.', isActive: true, createdAt: '2025-02-20' },
  { id: '3', name: 'Suresh Rajan', location: 'Madurai', rating: 4, message: 'Good experience overall. The AI biodata feature saved a lot of time. Would recommend to everyone.', isActive: true, createdAt: '2025-03-10' },
];

const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <button key={s} type="button" onClick={() => onChange?.(s)} className="transition-transform hover:scale-110">
        <Star className={`w-5 h-5 ${s <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
      </button>
    ))}
  </div>
);

const AdminTestimonials = () => {
  const [items, setItems] = useState<Testimonial[]>(INITIAL);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);

  const DEFAULT: Testimonial = { id: '', name: '', location: '', rating: 5, message: '', isActive: true, createdAt: new Date().toISOString().split('T')[0] };

  const handleSave = async () => {
    if (!editing?.name || !editing.message) { toast.error('Name and message are required'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    if (editing.id) { setItems(prev => prev.map(t => t.id === editing.id ? editing : t)); }
    else { setItems(prev => [...prev, { ...editing, id: Date.now().toString() }]); }
    toast.success(editing.id ? 'Testimonial updated!' : 'Testimonial added!');
    setEditing(null);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Quote className="w-6 h-6 text-primary" /> Testimonials</h1>
          <p className="text-sm text-slate-500 mt-1">Manage member testimonials shown on the public homepage</p>
        </div>
        <button onClick={() => setEditing(DEFAULT)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-all">
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map(t => (
          <div key={t.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${!t.isActive ? 'opacity-60' : 'hover:shadow-md'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 text-white font-bold flex items-center justify-center text-sm">{t.name[0]}</div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.location}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(t)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm('Delete?')) setItems(prev => prev.filter(i => i.id !== t.id)); toast.success('Deleted'); }} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <StarRating value={t.rating} />
            <p className="text-sm text-slate-600 mt-3 leading-relaxed line-clamp-3">"{t.message}"</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400">{t.createdAt}</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={t.isActive} onChange={() => setItems(prev => prev.map(i => i.id === t.id ? { ...i, isActive: !i.isActive } : i))} className="w-3.5 h-3.5 accent-primary rounded" />
                <span className="text-[11px] text-slate-500">{t.isActive ? 'Visible' : 'Hidden'}</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">{editing.id ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Member Name *</label>
                  <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Full name" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Location</label>
                  <input value={editing.location} onChange={e => setEditing({ ...editing, location: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="City" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-2">Star Rating</label>
                <StarRating value={editing.rating} onChange={v => setEditing({ ...editing, rating: v })} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Testimonial Message *</label>
                <textarea rows={4} value={editing.message} onChange={e => setEditing({ ...editing, message: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Write the testimonial..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.isActive} onChange={e => setEditing({ ...editing, isActive: e.target.checked })} className="w-4 h-4 accent-primary rounded" />
                <span className="text-sm font-medium text-slate-700">Visible on public site</span>
              </label>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-rose-500 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
