import React, { useState } from 'react';
import { X, Plus, Sparkles, Loader2, ScreenShare, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import rbacService, { CreateScreenDto, ScreenItem } from '../../../services/rbac.service';

interface ScreenRegisterModalProps {
  onClose: () => void;
  onCreated: (screen: ScreenItem) => void;
}

export const ScreenRegisterModal: React.FC<ScreenRegisterModalProps> = ({ onClose, onCreated }) => {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateScreenDto>({
    name: '',
    slug: '',
    route: '',
    category: 'ADMIN',
    icon: 'LayoutDashboard',
    description: '',
    isPublic: false,
    isActive: true,
    isCustom: true,
  });

  const handleNameChange = (val: string) => {
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const autoRoute = form.category === 'ADMIN'
      ? `/admin/${autoSlug}`
      : form.category === 'SUPER_ADMIN'
      ? `/super-admin/${autoSlug}`
      : `/portal/${autoSlug}`;

    setForm((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || prev.slug.startsWith('custom-') ? autoSlug : prev.slug,
      route: prev.route === '' ? autoRoute : prev.route,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.route) {
      toast.error('Name, Slug, and Route path are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        route: form.route.trim(),
        icon: form.icon || 'LayoutDashboard',
        description: form.description ? form.description.trim() : undefined,
        isActive: form.isActive ?? true,
      };
      const created = await rbacService.createScreen(payload);
      toast.success(`Screen "${form.name}" registered successfully! 🎉`);
      onCreated(created);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create screen');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary-300 border border-primary/30 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">Register New Screen</h3>
              <p className="text-xs text-slate-400">Add a new page or view to the RBAC Access System</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Screen Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Community Analytics & Reports"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                Slug identifier *
              </label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="e.g. community-analytics"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                Category Audience
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="MEMBER">MEMBER</option>
                <option value="PUBLIC">PUBLIC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Route Path *
            </label>
            <input
              type="text"
              required
              value={form.route}
              onChange={(e) => setForm((p) => ({ ...p, route: e.target.value }))}
              placeholder="e.g. /admin/community-analytics"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What this screen does..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm((p) => ({ ...p, isPublic: e.target.checked }))}
                className="checkbox checkbox-primary checkbox-sm"
              />
              <span className="text-xs font-bold text-slate-700">Public Screen (No login required)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="checkbox checkbox-primary checkbox-sm"
              />
              <span className="text-xs font-bold text-slate-700">Active Status</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-focus text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Register Screen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScreenRegisterModal;
