import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FileText, Search, Loader2, RefreshCw, Plus, Pencil, X, Trash2 } from 'lucide-react';
import { adminApi } from '../../services/admin.service';

type Blog = {
  id: string;
  title: string;
  slug: string;
  coverImage?: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
  tags?: string[];
  category?: { name: string };
};

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', coverImage: '/images/ceremony.png', content: '', tags: 'wedding, matrimony' });

  const [page, setPage] = useState(1);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBlogs(page, 10, search);
      const data = res.blogs || res.items || (Array.isArray(res) ? res : []);
      setBlogs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load blogs from database');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const handleOpenCreate = () => {
    setEditingBlog(null);
    setForm({ title: '', coverImage: '/images/ceremony.png', content: '', tags: 'wedding, matrimony' });
    setShowModal(true);
  };

  const handleOpenEdit = (b: Blog) => {
    setEditingBlog(b);
    setForm({
      title: b.title,
      coverImage: b.coverImage || '/images/ceremony.png',
      content: (b as any).content || (b as any).excerpt || b.title,
      tags: b.tags ? b.tags.join(', ') : 'wedding, matrimony',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Please enter a blog title');
    setSaving(true);
    try {
      const tagsArray = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (editingBlog) {
        setBlogs((prev) =>
          prev.map((b) =>
            b.id === editingBlog.id
              ? { ...b, title: form.title, coverImage: form.coverImage, tags: tagsArray }
              : b
          )
        );
        toast.success('Blog updated successfully! ✏️');
      } else {
        const newBlog = await adminApi.createBlog({
          title: form.title,
          coverImage: form.coverImage,
          content: form.content || form.title,
          tags: tagsArray,
        });
        setBlogs((prev) => [newBlog, ...prev]);
        toast.success('Blog created live in database! 🎉');
      }
      setShowModal(false);
      setEditingBlog(null);
      setForm({ title: '', coverImage: '/images/ceremony.png', content: '', tags: 'wedding, matrimony' });
    } catch {
      toast.error(editingBlog ? 'Failed to update blog' : 'Failed to create blog');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      toast.success('Blog deleted from database');
    } catch {
      toast.error('Failed to delete blog');
    }
  };

  const filtered = blogs.filter((b) => !search || b.title.toLowerCase().includes(search.toLowerCase()));
  const published = blogs.filter((b) => b.isPublished).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Blog Management
          </h1>
          <p className="text-text-secondary text-sm mt-1">{loading ? 'Loading...' : `${blogs.length} blogs • ${published} published`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchBlogs} className="btn btn-ghost btn-sm text-text-muted hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Blog
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-[10px] uppercase font-bold text-text-muted">Total Articles</p>
          <p className="text-xl font-bold text-text-primary mt-1">{blogs.length}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] uppercase font-bold text-text-muted">Published</p>
          <p className="text-xl font-bold text-success mt-1">{published}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] uppercase font-bold text-text-muted">Total Views</p>
          <p className="text-xl font-bold text-secondary mt-1">{blogs.reduce((acc, b) => acc + (b.viewCount || 0), 0)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search blogs by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 w-full"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-12 text-center text-text-muted flex justify-center items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading blogs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-text-muted">No blogs found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
              <div className="w-16 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {b.coverImage ? (
                  <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-semibold text-sm truncate">{b.title}</p>
                <p className="text-text-muted text-xs mt-0.5">
                  {b.category?.name ?? 'Wedding & Family'} • {b.viewCount || 0} views •{' '}
                  {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {b.tags && b.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {b.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge text-xs ${b.isPublished ? 'badge-active' : 'badge-pending'}`}>
                  {b.isPublished ? 'Published' : 'Draft'}
                </span>
                <button onClick={() => handleOpenEdit(b)} className="btn py-1 px-2 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100" title="Edit Blog">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(b.id)} className="btn py-1 px-2 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100" title="Delete Blog">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Blog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-display text-lg font-bold">{editingBlog ? 'Edit Blog Article' : 'Create New Blog'}</h2>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Blog Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Traditional Tamil Wedding Rituals Guide"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  placeholder="/images/ceremony.png"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="wedding, traditions, matrimony"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1">Content / Description</label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Enter full blog article content..."
                  className="input w-full py-2"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary btn-sm flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Publish Blog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogs;
