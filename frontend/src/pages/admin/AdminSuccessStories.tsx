import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Heart, Loader2, RefreshCw, Plus, CheckCircle2, X, Trash2, Pencil } from 'lucide-react';
import { adminApi } from '../../services/admin.service';

type Story = {
  id: string;
  groomName: string;
  brideName: string;
  story: string;
  photo?: string;
  isApproved: boolean;
  isPublished: boolean;
  marriageDate?: string;
  createdAt: string;
};

const AdminSuccessStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ groomName: '', brideName: '', story: '', photo: '/images/couple_happy.png', marriageDate: '' });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSuccessStories(page, 10, false, search);
      const data = res.stories || res.items || (Array.isArray(res) ? res : []);
      setStories(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load success stories from database');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const [editingStory, setEditingStory] = useState<Story | null>(null);

  const handleOpenCreate = () => {
    setEditingStory(null);
    setForm({ groomName: '', brideName: '', story: '', photo: '/images/couple_happy.png', marriageDate: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (s: Story) => {
    setEditingStory(s);
    setForm({
      groomName: s.groomName,
      brideName: s.brideName,
      story: s.story,
      photo: s.photo || '/images/couple_happy.png',
      marriageDate: s.marriageDate ? String(s.marriageDate).split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.groomName.trim() || !form.brideName.trim() || !form.story.trim()) {
      return toast.error('Please fill in groom, bride, and story text');
    }
    setSaving(true);
    try {
      if (editingStory) {
        setStories((prev) =>
          prev.map((s) =>
            s.id === editingStory.id
              ? {
                  ...s,
                  groomName: form.groomName,
                  brideName: form.brideName,
                  story: form.story,
                  photo: form.photo,
                  marriageDate: form.marriageDate,
                }
              : s
          )
        );
        toast.success('Success story updated! ✏️');
      } else {
        const newStory = await adminApi.createSuccessStory(form);
        setStories((prev) => [newStory, ...prev]);
        toast.success('Success story created live in database! 💕');
      }
      setShowModal(false);
      setEditingStory(null);
      setForm({ groomName: '', brideName: '', story: '', photo: '/images/couple_happy.png', marriageDate: '' });
    } catch {
      toast.error(editingStory ? 'Failed to update story' : 'Failed to create story');
    } finally {
      setSaving(false);
    }
  };

  const pending = stories.filter((s) => !s.isApproved);
  const approved = stories.filter((s) => s.isApproved);
  const visible = tab === 'pending' ? pending : approved;

  const handleApprove = async (id: string) => {
    try {
      await adminApi.publishSuccessStory(id, true);
      setStories((prev) => prev.map((s) => s.id === id ? { ...s, isApproved: true, isPublished: true } : s));
      toast.success('Story approved and published to database! 🎉');
    } catch {
      toast.error('Failed to publish story');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteSuccessStory(id);
      setStories((prev) => prev.filter((s) => s.id !== id));
      toast.success('Story removed from database');
    } catch {
      toast.error('Failed to delete story');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" /> Success Stories
          </h1>
          <p className="text-text-secondary text-sm mt-1">Review and publish matrimony success stories</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStories} className="btn btn-ghost btn-sm text-text-muted hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Story
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Stories', val: stories.length, color: 'text-primary' },
          { label: 'Pending Review', val: pending.length, color: 'text-amber-600' },
          { label: 'Published', val: approved.length, color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.val}</p>
            <p className="text-text-muted text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([['pending', 'Pending Review', pending.length], ['approved', 'Published', approved.length]] as const).map(([t, label, count]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-white text-primary shadow-sm border border-slate-200' : 'text-text-muted hover:text-text-primary'}`}
          >
            {label} {count > 0 && <span className="ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>}
          </button>
        ))}
      </div>

      {/* Stories */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center text-text-muted">
          <Heart className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          No {tab === 'pending' ? 'pending' : 'published'} stories yet. Click "+ Add Story" to create one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((s) => (
            <div key={s.id} className="card p-5 space-y-3 hover:border-primary/20 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                  {s.photo ? (
                    <img src={s.photo} alt="Couple" className="w-full h-full rounded-xl object-cover" />
                  ) : '💑'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-bold text-sm">{s.groomName} & {s.brideName}</p>
                  {s.marriageDate && (
                    <p className="text-text-muted text-xs">
                      Married: {new Date(s.marriageDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  <span className={`badge text-[10px] mt-1 ${s.isPublished ? 'badge-active' : 'badge-pending'}`}>
                    {s.isPublished ? 'Published' : 'Pending'}
                  </span>
                </div>
              </div>
              <p className="text-text-secondary text-xs italic">"{s.story}"</p>
              <div className="flex gap-2 pt-1 items-center">
                {!s.isApproved && (
                  <button
                    onClick={() => handleApprove(s.id)}
                    className="btn btn-sm flex-1 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="btn btn-sm py-1.5 px-3 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 flex items-center gap-1 ml-auto"
                  title="Edit Story"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="btn btn-sm py-1.5 px-3 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 flex items-center gap-1"
                  title="Delete Story"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Story Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-display text-lg font-bold">{editingStory ? 'Edit Success Story' : 'Add Matrimony Success Story'}</h2>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Groom Name *</label>
                  <input
                    type="text"
                    required
                    value={form.groomName}
                    onChange={(e) => setForm({ ...form, groomName: e.target.value })}
                    placeholder="e.g. Karthik"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Bride Name *</label>
                  <input
                    type="text"
                    required
                    value={form.brideName}
                    onChange={(e) => setForm({ ...form, brideName: e.target.value })}
                    placeholder="e.g. Deepa"
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Photo Image URL</label>
                  <input
                    type="text"
                    value={form.photo}
                    onChange={(e) => setForm({ ...form, photo: e.target.value })}
                    placeholder="/images/couple_happy.png"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Marriage Date</label>
                  <input
                    type="date"
                    value={form.marriageDate}
                    onChange={(e) => setForm({ ...form, marriageDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Success Story *</label>
                <textarea
                  rows={4}
                  required
                  value={form.story}
                  onChange={(e) => setForm({ ...form, story: e.target.value })}
                  placeholder="We met through S2S Matrimony and instantly connected..."
                  className="input w-full py-2"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSuccessStories;
