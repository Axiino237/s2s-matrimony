import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Image, Loader2, RefreshCw, Plus, Pencil, Trash2, X } from 'lucide-react';
import { adminApi } from '../../services/admin.service';

type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  page: string;
  position?: string;
  isActive: boolean;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
};

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', imageUrl: '/images/couple.png', page: 'HOME', linkUrl: '#' });

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBanners(1, 50);
      const data = res.banners || res.items || (Array.isArray(res) ? res : []);
      setBanners(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load banners from database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Please enter banner title');
    setSaving(true);
    try {
      const newBanner = await adminApi.createBanner(form);
      setBanners((prev) => [newBanner, ...prev]);
      toast.success('Banner created live in database! 🎨');
      setShowModal(false);
      setForm({ title: '', imageUrl: '/images/couple.png', page: 'HOME', linkUrl: '#' });
    } catch {
      toast.error('Failed to create banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success('Banner removed from database');
    } catch {
      toast.error('Failed to delete banner');
    }
  };

  const active = banners.filter((b) => b.isActive).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <Image className="w-6 h-6 text-primary" /> Banner Management
          </h1>
          <p className="text-text-secondary text-sm mt-1">{loading ? 'Loading...' : `${banners.length} banners • ${active} active`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchBanners} className="btn btn-ghost btn-sm text-text-muted hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Banners', val: banners.length, color: 'text-primary' },
          { label: 'Active', val: active, color: 'text-emerald-600' },
          { label: 'Inactive', val: banners.length - active, color: 'text-slate-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.val}</p>
            <p className="text-text-muted text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Banner Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : banners.length === 0 ? (
        <div className="card p-12 text-center text-text-muted">
          <Image className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          No banners created yet. Click "+ Add Banner" to create your first banner!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((b) => (
            <div key={b.id} className="card p-0 overflow-hidden hover:border-primary/20 transition-all">
              {/* Banner Preview */}
              <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                {b.imageUrl ? (
                  <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-12 h-12 text-primary/30" />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`badge text-[10px] ${b.isActive ? 'badge-active' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-text-primary font-semibold text-sm truncate">{b.title}</p>
                <p className="text-text-muted text-xs mt-0.5">
                  Page: <span className="font-medium">{b.page}</span>
                  {b.position && ` • ${b.position}`}
                  {' '}• Order #{b.displayOrder}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="btn btn-ghost btn-sm text-xs py-1 flex items-center gap-1 text-rose-600 hover:bg-rose-50 border border-rose-200 w-full justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Banner
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Banner Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-display text-lg font-bold">Add Promotional Banner</h2>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Special Community Meetup 2026"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Image Path / URL *</label>
                <input
                  type="text"
                  required
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/images/couple.png"
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Target Page</label>
                  <select
                    value={form.page}
                    onChange={(e) => setForm({ ...form, page: e.target.value })}
                    className="input w-full"
                  >
                    <option value="HOME">Home Landing Page</option>
                    <option value="SEARCH">Search & Matches Page</option>
                    <option value="PRICING">Pricing & Plans Page</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1">Click Link URL</label>
                  <input
                    type="text"
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="/search"
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
