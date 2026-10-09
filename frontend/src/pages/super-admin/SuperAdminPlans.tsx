import { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  Eye,
  Star,
  Save,
  X,
  MessageSquare,
  Sparkles,
  Video,
  Heart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

import { PlanFormModal, Plan, TIERS, TIER_COLORS, isFeatureAllowed, sanitizePlanFeatures } from '../../components/plans/PlanFormModal';

// ─── Main Page ─────────────────────────────────────────────────────────
const SuperAdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'GENERAL' | 'ELITE'>('GENERAL');
  const [loading, setLoading] = useState(true);
  const [modalPlan, setModalPlan] = useState<Partial<Plan> | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/admin/plans');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        const normalized: Plan[] = data.map((p: any) => {
          const tier = (p.tier || 'SILVER').toUpperCase();
          const category = ((p.category as string) || 'GENERAL').toUpperCase() as 'GENERAL' | 'ELITE';
          const contacts =
            p.maxContacts !== undefined
              ? Number(p.maxContacts)
              : p.contactViewLimit !== undefined
              ? Number(p.contactViewLimit)
              : 0;

          const interests =
            p.maxInterests !== undefined
              ? Number(p.maxInterests)
              : 0;

          const hasChat = p.hasChat !== undefined ? Boolean(p.hasChat) : false;
          const hasAiMatch = Boolean(p.hasAiMatch);
          const rawFeatures = Array.isArray(p.features)
            ? p.features
            : typeof p.features === 'string'
            ? JSON.parse(p.features)
            : [];

          return {
            id: p.id,
            name: p.name,
            tier,
            category,
            price: Number(p.price ?? 0),
            durationMonths: p.durationMonths !== undefined ? Number(p.durationMonths) : 0,
            contactViewLimit: contacts,
            maxContacts: contacts,
            maxInterests: interests,
            hasChat,
            hasAiMatch,
            hasVideoProfile: false,
            features: sanitizePlanFeatures(rawFeatures, interests, hasChat, hasAiMatch),
            isActive: p.isActive !== false,
            isPopular: p.isPopular === true,
            description: p.description || '',
          };
        });

        const getPlanRank = (plan: any): number => {
          const tier = (plan.tier || '').toUpperCase();
          const name = (plan.name || '').toLowerCase();

          if (tier === 'FREE' || name.includes('free')) return 1;
          if (tier === 'SILVER' || name.includes('silver')) return 2;
          if (tier === 'GOLD' || name.includes('gold')) return 3;
          if (tier === 'PLATINUM' || name.includes('platinum')) return 4;
          if (tier === 'ELITE' || name.includes('elite')) return 5;
          if (tier === 'DIAMOND' || name.includes('diamond')) return 6;
          return 100;
        };

        const sorted = normalized.sort((a, b) => {
          const rankA = getPlanRank(a);
          const rankB = getPlanRank(b);
          if (rankA !== rankB) return rankA - rankB;
          return a.price - b.price;
        });

        setPlans(sorted);
      }
    } catch {
      toast.error('Failed to load plans from server');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Partial<Plan>) => {
    try {
      const payload = {
        ...data,
        maxContacts: data.contactViewLimit,
        contactLimit: data.contactViewLimit,
      };

      if (data.id) {
        await api.put(`/admin/plans/${data.id}`, payload);
        toast.success('Plan configuration updated successfully!');
      } else {
        await api.post('/admin/plans', payload);
        toast.success('New plan created successfully!');
      }
      fetchPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/plans/${id}`);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast.success('Plan deleted');
    } catch {
      toast.error('Failed to delete plan');
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      await api.patch(`/admin/plans/${plan.id}`, { isActive: !plan.isActive });
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p)),
      );
      toast.success(`Plan ${!plan.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to toggle status');
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
            <Crown className="w-6 h-6 text-amber-500" /> Membership Tiers & Plan Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure tier features, direct live chat, contact unlock quotas, and interest expression rules
          </p>
        </div>
        <button
          onClick={() => setModalPlan({ category: selectedCategory })}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Plans', value: plans.length, icon: Crown, color: 'bg-primary-50 text-primary' },
          { label: 'Active Plans', value: plans.filter((p) => p.isActive).length, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
          { label: 'Paid Plans', value: plans.filter((p) => p.price > 0).length, icon: Star, color: 'bg-amber-50 text-amber-600' },
          { label: 'Free Plans', value: plans.filter((p) => p.price === 0).length, icon: Eye, color: 'bg-blue-50 text-blue-600' },
        ].map((stat) => {
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

      {/* Category Toggle (General | Elite) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Category:</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              id="superadmin-category-toggle-general"
              onClick={() => setSelectedCategory('GENERAL')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === 'GENERAL'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>General</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                selectedCategory === 'GENERAL' ? 'bg-rose-50 text-rose-600' : 'bg-slate-200 text-slate-600'
              }`}>
                {plans.filter((p) => (p.category || 'GENERAL').toUpperCase() === 'GENERAL').length}
              </span>
            </button>
            <button
              type="button"
              id="superadmin-category-toggle-elite"
              onClick={() => setSelectedCategory('ELITE')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === 'ELITE'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Elite</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                selectedCategory === 'ELITE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {plans.filter((p) => (p.category || 'GENERAL').toUpperCase() === 'ELITE').length}
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          {selectedCategory === 'GENERAL'
            ? 'General Membership Plans (Free, Silver, Gold, Platinum)'
            : 'Elite High-Net-Worth Membership Plans (Silver, Gold, Platinum — No Free Tier)'}
        </p>
      </div>

      {/* Plans Grid */}
      {plans.filter((p) => (p.category || 'GENERAL').toUpperCase() === selectedCategory).length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-sm font-medium">
            No {selectedCategory === 'ELITE' ? 'Elite' : 'General'} membership plans configured yet.
          </p>
          <button
            onClick={() => setModalPlan({ category: selectedCategory })}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow hover:bg-rose-700"
          >
            <Plus className="w-4 h-4" /> Create {selectedCategory === 'ELITE' ? 'Elite' : 'General'} Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans
            .filter((p) => (p.category || 'GENERAL').toUpperCase() === selectedCategory)
            .map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between
              ${!plan.isActive ? 'opacity-60 border-slate-200' : plan.isPopular ? 'border-amber-300 shadow-amber-100' : 'border-slate-200'}`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-xs">
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
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      TIER_COLORS[plan.tier] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {plan.tier}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{plan.name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">₹{plan.price.toLocaleString()}</p>
                  {plan.durationMonths > 0 ? (
                    <p className="text-xs text-slate-500">/{plan.durationMonths}mo</p>
                  ) : (
                    <p className="text-xs text-slate-500">Free / Lifetime</p>
                  )}
                </div>
              </div>

              {/* Core Feature Badges */}
              <div className="flex flex-wrap gap-1.5 my-3">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    plan.hasChat
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  {plan.hasChat ? 'Live Chat' : 'No Chat'}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    plan.hasAiMatch
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  {plan.hasAiMatch ? 'AI Match' : 'No AI'}
                </span>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl mb-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>
                    Contacts:{' '}
                    <strong>
                      {plan.contactViewLimit === -1
                        ? 'Unlimited'
                        : plan.contactViewLimit === 0
                        ? '0 (Paid Only)'
                        : plan.contactViewLimit}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>
                    Interests:{' '}
                    <strong>
                      {plan.maxInterests === -1
                        ? 'Unlimited'
                        : plan.maxInterests === 0
                        ? '0 (Paid Only)'
                        : plan.maxInterests}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Perks List */}
              <ul className="space-y-1.5 mb-2">
                {plan.features?.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.features?.length > 4 && (
                  <li className="text-xs text-slate-400">+{plan.features.length - 4} more perks</li>
                )}
              </ul>
            </div>

            <div className="flex items-center gap-2 p-4 pt-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => toggleActive(plan)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${
                    plan.isActive
                      ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
              >
                {plan.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {plan.isActive ? 'Active' : 'Inactive'}
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setModalPlan(plan)}
                className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Configure Tier Features"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                disabled={deleting === plan.id}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete plan"
              >
                {deleting === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
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
