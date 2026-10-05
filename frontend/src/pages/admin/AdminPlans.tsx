import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Crown,
  Pencil,
  Plus,
  Loader2,
  RefreshCw,
  Phone,
  Trash2,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import api from '../../services/api';
import {
  PlanFormModal,
  Plan,
  TIER_COLORS,
  isFeatureAllowed,
} from '../../components/plans/PlanFormModal';

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalPlan, setModalPlan] = useState<Partial<Plan> | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/plans');
      const rawData = res.data?.data || res.data || [];
      if (Array.isArray(rawData) && rawData.length > 0) {
        const normalized: Plan[] = rawData.map((p: any) => {
          let tier = (p.tier || 'SILVER').toUpperCase();
          if (tier === 'DIAMOND') tier = 'ELITE';
          let name = p.name || 'Membership Plan';
          if (name === 'Diamond Plan') name = 'Elite Plan';
          else if (name === 'Diamond') name = 'Elite';

          const contacts =
            p.maxContacts !== undefined
              ? Number(p.maxContacts)
              : p.contactViewLimit !== undefined
              ? Number(p.contactViewLimit)
              : p.contactLimit !== undefined
              ? Number(p.contactLimit)
              : 0;

          const interests =
            p.maxInterests !== undefined ? Number(p.maxInterests) : 0;

          const rawFeatures = Array.isArray(p.features)
            ? p.features
            : typeof p.features === 'string'
            ? JSON.parse(p.features)
            : [];

          return {
            id: p.id,
            name,
            tier,
            price: Number(p.price ?? 0),
            durationMonths: p.durationMonths !== undefined ? Number(p.durationMonths) : 1,
            contactViewLimit: contacts,
            maxContacts: contacts,
            maxInterests: interests,
            hasChat: p.hasChat !== undefined ? Boolean(p.hasChat) : false,
            hasAiMatch: Boolean(p.hasAiMatch),
            hasVideoProfile: false,
            features: rawFeatures.filter(isFeatureAllowed),
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
          if (tier === 'ELITE' || name.includes('elite')) return 4;
          if (tier === 'PLATINUM' || name.includes('platinum')) return 5;
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
      } else {
        setPlans([]);
      }
    } catch {
      setPlans([]);
      toast.error('Failed to load membership plans from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSavePlan = async (data: Partial<Plan>) => {
    try {
      const payload = {
        ...data,
        maxContacts: data.contactViewLimit,
        contactLimit: data.contactViewLimit,
        hasVideoProfile: false,
        features: (data.features || []).filter(isFeatureAllowed),
      };

      if (data.id) {
        await api.put(`/admin/plans/${data.id}`, payload);
        toast.success(`Plan "${data.name}" updated successfully!`);
      } else {
        await api.post('/admin/plans', payload);
        toast.success(`New plan "${data.name}" created successfully!`);
      }
      fetchPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this membership plan?')) return;
    setDeleting(planId);
    try {
      await api.delete(`/admin/plans/${planId}`);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success('Plan deleted successfully!');
    } catch {
      toast.error('Failed to delete plan');
    } finally {
      setDeleting(null);
    }
  };

  const formatPrice = (plan: Plan) => {
    if (plan.tier === 'FREE' || Number(plan.price) === 0) return '₹0';
    const dur = plan.durationMonths > 0 ? `/${plan.durationMonths}mo` : '';
    return `₹${Number(plan.price).toLocaleString('en-IN')}${dur}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" /> Membership Plans Management
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Configure plan pricing, direct live chat, contact unlock quotas, and features
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlans}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh plans"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModalPlan({})}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Plan
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all relative overflow-hidden
                ${!plan.isActive ? 'opacity-60 border-slate-200' : plan.isPopular ? 'border-amber-300 shadow-amber-50' : 'border-slate-200'}`}
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

              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        TIER_COLORS[plan.tier] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {plan.tier}
                    </span>
                    <h3 className="text-text-primary font-bold text-base mt-2">{plan.name}</h3>
                  </div>
                </div>

                <p className="text-2xl font-bold text-primary font-display my-2">
                  {formatPrice(plan)}
                </p>

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
                          ? '0'
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
                          ? '0'
                          : plan.maxInterests}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Perks List */}
                <ul className="space-y-1.5 mb-4">
                  {(plan.features || []).slice(0, 5).map((f, i) => (
                    <li key={i} className="text-text-secondary text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="truncate">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 mt-auto">
                <button
                  onClick={() => setModalPlan(plan)}
                  className="flex items-center justify-center gap-1.5 btn btn-secondary btn-sm flex-1 text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Plan
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  disabled={deleting === plan.id}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete plan"
                >
                  {deleting === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shared Edit / Create Plan Modal */}
      {modalPlan !== undefined && (
        <PlanFormModal
          plan={modalPlan}
          onClose={() => setModalPlan(undefined)}
          onSave={handleSavePlan}
        />
      )}
    </div>
  );
};

export default AdminPlans;
