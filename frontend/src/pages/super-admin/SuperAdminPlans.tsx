import { useState, useEffect, useMemo } from 'react';
import { Crown, Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, Phone, Eye, Star, AlertCircle, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Plan {
  id: string;
  name: string;
  tier: string;
  price: number;
  durationMonths: number;
  contactViewLimit: number;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
  description?: string;
  createdAt?: string;
}

const TIERS = ['FREE', 'SILVER', 'ELITE', 'PLATINUM', 'DIAMOND'];
const TIER_COLORS: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-600 font-medium',
  SILVER: 'bg-slate-200 text-slate-700 font-medium',
  ELITE: 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-300',
  PLATINUM: 'bg-cyan-100 text-cyan-700 font-medium',
  DIAMOND: 'bg-blue-100 text-blue-700 font-medium',
};

const DEFAULT_PLAN: Omit<Plan, 'id' | 'createdAt'> = {
  name: '',
  tier: 'SILVER',
  price: 999,
  durationMonths: 3,
  contactViewLimit: 50,
  features: ['View contact details', 'Send interests', 'Chat messaging'],
  isActive: true,
  isPopular: false,
  description: '',
};

// ─── Plan Form Modal ───────────────────────────────────────────────────
const PlanFormModal = ({
  plan,
  onClose,
  onSave,
}: {
  plan: Partial<Plan> | null;
  onClose: () => void;
  onSave: (data: Partial<Plan>) => void;
}) => {
  const isNew = !plan?.id;

  const initialForm = useMemo(() => {
    if (!plan || !plan.id) return { ...DEFAULT_PLAN };
    const limit = plan.contactViewLimit !== undefined 
      ? plan.contactViewLimit 
      : (plan as any).contactLimit !== undefined 
      ? (plan as any).contactLimit 
      : (plan as any).maxContacts !== undefined 
      ? (plan as any).maxContacts 
      : 5;
    const dur = plan.durationMonths !== undefined ? plan.durationMonths : 0;
    return {
      ...DEFAULT_PLAN,
      ...plan,
      contactViewLimit: limit,
      durationMonths: dur,
    };
  }, [plan]);

  const [form, setForm] = useState(initialForm);
  const [featureInput, setFeatureInput] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field: string, val: any) => setForm(prev => ({ ...prev, [field]: val }));

  const addFeature = () => {
    if (!featureInput.trim()) return;
    set('features', [...(form.features || []), featureInput.trim()]);
    setFeatureInput('');
  };

  const removeFeature = (i: number) => {
    set('features', form.features.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!form.name || !form.tier || form.price === undefined || form.price === null) {
      toast.error('Please fill plan name, tier, and price');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        contactLimit: form.contactViewLimit,
      };
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            {isNew ? 'Create New Plan' : 'Edit Plan'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Plan Name */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Plan Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Elite 3 Months"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Tier */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Tier *</label>
            <select
              value={form.tier}
              onChange={(e) => set('tier', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
            >
              {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Price (₹) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => set('price', isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value))}
              min={0}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Duration (months) *</label>
            <select
              value={form.durationMonths}
              onChange={(e) => set('durationMonths', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
            >
              {[0, 1, 2, 3, 6, 9, 12, 18, 24].map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? 'Lifetime / Free (0 months)' : `${m} month${m > 1 ? 's' : ''}`}
                </option>
              ))}
            </select>
          </div>

          {/* Contact View Limit */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Contact View Limit</label>
            <input
              type="number"
              value={form.contactViewLimit}
              onChange={(e) => set('contactViewLimit', isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value))}
              min={0}
              placeholder="0 = Unlimited"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[11px] text-slate-400 mt-1">0 = Unlimited views (or set exact count e.g. 5, 50, 100)</p>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Brief description of this plan..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Features */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-2">Features</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                placeholder="Add a feature and press Enter..."
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.features?.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  {f}
                  <button onClick={() => removeFeature(i)} className="ml-1 text-primary/60 hover:text-rose-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-sm font-medium text-slate-700">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={(e) => set('isPopular', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-sm font-medium text-slate-700">⭐ Popular</span>
            </label>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Create Plan' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────
const SuperAdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalPlan, setModalPlan] = useState<Partial<Plan> | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Seed fallback data for display when backend not yet connected
  const FALLBACK_PLANS: Plan[] = [
    { id: '1', name: 'Free Plan', tier: 'FREE', price: 0, durationMonths: 0, contactViewLimit: 5, features: ['Browse profiles', 'Send interests (limited)'], isActive: true, isPopular: false },
    { id: '2', name: 'Silver 3 Months', tier: 'SILVER', price: 999, durationMonths: 3, contactViewLimit: 50, features: ['50 contact views', 'Send unlimited interests', 'Chat messaging', 'Profile highlighting'], isActive: true, isPopular: false },
    { id: '3', name: 'Elite 6 Months', tier: 'ELITE', price: 1999, durationMonths: 6, contactViewLimit: 100, features: ['100 contact views', 'Priority listing', 'Advanced search', 'Profile verification badge', 'Whatsapp connect'], isActive: true, isPopular: true },
    { id: '4', name: 'Platinum 12 Months', tier: 'PLATINUM', price: 3499, durationMonths: 12, contactViewLimit: 0, features: ['Unlimited contact views', 'Dedicated relationship manager', 'AI-match recommendations', 'All Elite features', 'Priority support'], isActive: true, isPopular: false },
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/admin/plans');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        const normalized: Plan[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          tier: (p.tier || 'SILVER').toUpperCase(),
          price: Number(p.price ?? 0),
          durationMonths: p.durationMonths !== undefined ? Number(p.durationMonths) : 0,
          contactViewLimit: Number(p.contactViewLimit ?? p.contactLimit ?? p.maxContacts ?? 5),
          features: Array.isArray(p.features) ? p.features : typeof p.features === 'string' ? JSON.parse(p.features) : [],
          isActive: p.isActive !== false,
          isPopular: p.isPopular === true,
          description: p.description || '',
        }));
        setPlans(normalized);
      } else {
        setPlans(FALLBACK_PLANS);
      }
    } catch {
      setPlans(FALLBACK_PLANS);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Partial<Plan>) => {
    try {
      if (data.id) {
        await api.put(`/admin/plans/${data.id}`, data);
        setPlans(prev => prev.map(p => p.id === data.id ? { ...p, ...data } as Plan : p));
        toast.success('Plan updated successfully!');
      } else {
        const res = await api.post('/admin/plans', data);
        const newPlan = res.data?.data || res.data;
        setPlans(prev => [...prev, newPlan || { ...data, id: Date.now().toString() } as Plan]);
        toast.success('Plan created successfully!');
      }
    } catch {
      // Update locally for demo
      if (data.id) {
        setPlans(prev => prev.map(p => p.id === data.id ? { ...p, ...data } as Plan : p));
      } else {
        setPlans(prev => [...prev, { ...data, id: Date.now().toString() } as Plan]);
      }
      toast.success('Plan saved (demo mode)');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/plans/${id}`);
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan deleted');
    } catch {
      setPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan removed (demo mode)');
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      await api.patch(`/admin/plans/${plan.id}`, { isActive: !plan.isActive });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
      toast.success(`Plan ${!plan.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: !p.isActive } : p));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" /> Membership Plans
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage all membership tiers, pricing, and contact view limits</p>
        </div>
        <button
          onClick={() => setModalPlan({})}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Plans', value: plans.length, icon: Crown, color: 'bg-primary-50 text-primary' },
          { label: 'Active Plans', value: plans.filter(p => p.isActive).length, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
          { label: 'Paid Plans', value: plans.filter(p => p.price > 0).length, icon: Star, color: 'bg-amber-50 text-amber-600' },
          { label: 'Free Plans', value: plans.filter(p => p.price === 0).length, icon: Eye, color: 'bg-blue-50 text-blue-600' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-2xl p-4 ${stat.color} border border-current/10`}>
              <Icon className="w-5 h-5 mb-2 opacity-70" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium opacity-70">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden
              ${!plan.isActive ? 'opacity-60 border-slate-200' : plan.isPopular ? 'border-amber-300 shadow-amber-100' : 'border-slate-200'}`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                ⭐ POPULAR
              </div>
            )}
            {!plan.isActive && (
              <div className="absolute top-0 left-0 bg-slate-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl">
                INACTIVE
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${TIER_COLORS[plan.tier] || 'bg-slate-100 text-slate-600'}`}>
                    {plan.tier}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{plan.name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">₹{plan.price.toLocaleString()}</p>
                  {plan.durationMonths > 0 && (
                    <p className="text-xs text-slate-500">/{plan.durationMonths}mo</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-slate-700">
                  {plan.contactViewLimit === 0 ? 'Unlimited' : plan.contactViewLimit} contact views
                </span>
              </div>

              <ul className="space-y-1.5 mb-5">
                {plan.features?.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.features?.length > 4 && (
                  <li className="text-xs text-slate-400">+{plan.features.length - 4} more features</li>
                )}
              </ul>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => toggleActive(plan)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${plan.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {plan.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {plan.isActive ? 'Active' : 'Inactive'}
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => setModalPlan(plan)}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Edit plan"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  disabled={deleting === plan.id}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete plan"
                >
                  {deleting === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Crown className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No Plans Yet</h3>
          <p className="text-sm text-slate-400 mb-4">Create your first membership plan to get started</p>
          <button
            onClick={() => setModalPlan({})}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> Create First Plan
          </button>
        </div>
      )}

      {/* Plan Form Modal */}
      {modalPlan !== undefined && (
        <PlanFormModal
          plan={modalPlan}
          onClose={() => setModalPlan(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default SuperAdminPlans;
