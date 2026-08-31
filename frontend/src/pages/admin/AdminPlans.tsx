import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Crown, Pencil, Plus, X, Save, Loader2, RefreshCw, PhoneCall, Trash2, CheckCircle2, Sparkles, Star } from 'lucide-react';
import { paymentsApi } from '../../services/payments.service';

interface Plan {
  id: string;
  name: string;
  category?: 'GENERAL' | 'ELITE';
  price: string;
  duration: string;
  members: string;
  tier: 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'ELITE';
  contactLimit: number;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
}

const INITIAL_PLANS: Plan[] = [
  // General Plans
  {
    id: 'gen-free',
    name: 'Free Starter',
    category: 'GENERAL',
    price: '0',
    duration: 'Lifetime',
    members: '43,540',
    tier: 'FREE',
    contactLimit: 5,
    features: ['5 Daily Expressed Interests', 'Basic Search (Age, Religion, Community)', '5 Profile Views per Day', 'Basic Compatibility Score'],
    isActive: true,
    isPopular: false,
  },
  {
    id: 'gen-silver',
    name: 'Silver Plan',
    category: 'GENERAL',
    price: '599',
    duration: '1 month',
    members: '3,240',
    tier: 'SILVER',
    contactLimit: 50,
    features: ['50 Daily Expressed Interests', 'Advanced Search & Education Filters', '50 Contact Number & Phone Unlocks', 'Direct Instant Messaging & Live Chat'],
    isActive: true,
    isPopular: false,
  },
  {
    id: 'gen-gold',
    name: 'Gold Plan',
    category: 'GENERAL',
    price: '1199',
    duration: '3 months',
    members: '4,180',
    tier: 'GOLD',
    contactLimit: 150,
    features: ['UNLIMITED Expressed Interests', '150 Direct Contact & Phone Unlocks', 'Unlimited Direct Messaging & Chat', 'Full Horoscope & Porutham Match Reports'],
    isActive: true,
    isPopular: true,
  },
  {
    id: 'gen-platinum',
    name: 'Platinum Plan',
    category: 'GENERAL',
    price: '1999',
    duration: '6 months',
    members: '1,520',
    tier: 'PLATINUM',
    contactLimit: 300,
    features: ['UNLIMITED Expressed Interests', '300 Direct Contact & Phone Unlocks', 'Unlimited Chat & Priority Messaging', 'TOP 5 Featured Profile Placement'],
    isActive: true,
    isPopular: false,
  },

  // Elite Plans
  {
    id: 'elite-silver',
    name: 'Elite Silver',
    category: 'ELITE',
    price: '4999',
    duration: '3 months',
    members: '840',
    tier: 'SILVER',
    contactLimit: 500,
    features: ['Dedicated Matchmaking Advisor', '15 Curated & Handpicked Introductions', 'Personal Profile Screening & Verification', 'Full Astrological & Horoscope Matching'],
    isActive: true,
    isPopular: false,
  },
  {
    id: 'elite-gold',
    name: 'Elite Gold',
    category: 'ELITE',
    price: '9999',
    duration: '6 months',
    members: '1,120',
    tier: 'GOLD',
    contactLimit: 1000,
    features: ['Senior Personal Relationship Manager', '35 Handpicked & Pre-Screened Matches', 'Family Meeting Setup & Facilitation', 'In-Depth Background & Horoscope Verification'],
    isActive: true,
    isPopular: true,
  },
  {
    id: 'elite-platinum',
    name: 'Elite Platinum',
    category: 'ELITE',
    price: '18999',
    duration: '12 months (Till Marriage)',
    members: '460',
    tier: 'PLATINUM',
    contactLimit: 9999,
    features: ['Senior Director & Dedicated Matchmaking Team', 'UNLIMITED Curated & Vetted Introductions', 'End-to-End Family Coordination & Scheduling', 'Strict NDA & Total Privacy Protection'],
    isActive: true,
    isPopular: false,
  },
];

const tierColors: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
  SILVER: 'bg-teal-50 text-teal-800 border-teal-200 font-bold',
  GOLD: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
  PLATINUM: 'bg-rose-50 text-rose-800 border-rose-200 font-black',
  ELITE: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-black',
};

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'ALL' | 'GENERAL' | 'ELITE'>('ALL');
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.getPlans();
      const rawData = Array.isArray(res) ? res : (res.plans || res.data || []);
      if (rawData.length > 0) {
        const normalized: Plan[] = rawData.map((p: any) => {
          let tier = (p.tier || 'SILVER').toUpperCase();
          if (tier === 'DIAMOND') tier = 'ELITE';
          let name = p.name || 'Membership Plan';
          const cat = p.category || (name.toLowerCase().includes('elite') || tier === 'ELITE' ? 'ELITE' : 'GENERAL');
          const cLimit = p.contactLimit ?? (tier === 'FREE' ? 5 : tier === 'SILVER' ? 50 : tier === 'GOLD' ? 150 : 300);

          return {
            id: p.id || `plan-${Math.random()}`,
            name,
            category: cat,
            price: String(p.price ?? 0),
            duration: p.duration || (p.durationMonths ? `${p.durationMonths} month${p.durationMonths > 1 ? 's' : ''}` : '1 month'),
            members: p.members || '1,240',
            tier: tier as any,
            contactLimit: Number(cLimit),
            features: Array.isArray(p.features)
              ? p.features
              : typeof p.features === 'string'
              ? JSON.parse(p.features)
              : [`${cLimit >= 999 ? 'Unlimited' : cLimit} Contacts`, 'Direct Chat'],
            isActive: p.isActive !== false,
            isPopular: p.isPopular === true,
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
          const pA = parseFloat(String(a.price).replace(/[^\d.]/g, '') || '0');
          const pB = parseFloat(String(b.price).replace(/[^\d.]/g, '') || '0');
          return pA - pB;
        });

        setPlans(sorted);
      } else {
        setPlans(INITIAL_PLANS);
      }
    } catch {
      setPlans(INITIAL_PLANS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const [newPlan, setNewPlan] = useState<Omit<Plan, 'id' | 'members'>>({
    name: '',
    category: 'GENERAL',
    price: '',
    duration: '1 month',
    tier: 'SILVER',
    contactLimit: 50,
    features: [''],
    isActive: true,
    isPopular: false,
  });

  const openEdit = (plan: Plan) => setEditPlan({ ...plan, category: plan.category || (plan.name.toLowerCase().includes('elite') ? 'ELITE' : 'GENERAL') });

  const handleSaveEdit = async () => {
    if (!editPlan) return;
    try {
      await paymentsApi.updatePlan(editPlan.id, editPlan);
      setPlans(prev => prev.map(p => p.id === editPlan.id ? editPlan : p));
      toast.success(`Plan "${editPlan.name}" updated successfully!`);
      setEditPlan(null);
    } catch {
      toast.error('Failed to update plan');
    }
  };

  const handleAddFeature = (target: 'edit' | 'add') => {
    if (target === 'edit' && editPlan) {
      setEditPlan({ ...editPlan, features: [...editPlan.features, ''] });
    } else {
      setNewPlan({ ...newPlan, features: [...newPlan.features, ''] });
    }
  };

  const handleFeatureChange = (idx: number, val: string, target: 'edit' | 'add') => {
    if (target === 'edit' && editPlan) {
      const updated = editPlan.features.map((f, i) => i === idx ? val : f);
      setEditPlan({ ...editPlan, features: updated });
    } else {
      const updated = newPlan.features.map((f, i) => i === idx ? val : f);
      setNewPlan({ ...newPlan, features: updated });
    }
  };

  const handleRemoveFeature = (idx: number, target: 'edit' | 'add') => {
    if (target === 'edit' && editPlan) {
      setEditPlan({ ...editPlan, features: editPlan.features.filter((_, i) => i !== idx) });
    } else {
      setNewPlan({ ...newPlan, features: newPlan.features.filter((_, i) => i !== idx) });
    }
  };

  const handleAddPlan = async () => {
    if (!newPlan.name || !newPlan.price) {
      toast.error('Enter plan name and price');
      return;
    }
    const createdId = `plan-${Date.now()}`;
    const created: Plan = {
      id: createdId,
      members: '0',
      ...newPlan,
      features: newPlan.features.filter(f => f.trim()),
    };
    try {
      await paymentsApi.createPlan(created);
      setPlans(prev => [...prev, created]);
      toast.success(`Plan "${created.name}" created!`);
      setShowAdd(false);
      setNewPlan({ name: '', category: 'GENERAL', price: '', duration: '1 month', tier: 'SILVER', contactLimit: 50, features: [''], isActive: true, isPopular: false });
    } catch {
      setPlans(prev => [...prev, created]);
      toast.success(`Plan "${created.name}" created!`);
      setShowAdd(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this membership plan?')) return;
    try {
      await paymentsApi.deletePlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success('Plan deleted successfully!');
    } catch {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success('Plan removed');
    }
  };

  const generalCount = plans.filter(p => (p.category || (p.name.toLowerCase().includes('elite') ? 'ELITE' : 'GENERAL')) === 'GENERAL').length;
  const eliteCount = plans.filter(p => (p.category || (p.name.toLowerCase().includes('elite') ? 'ELITE' : 'GENERAL')) === 'ELITE').length;

  const filteredPlans = plans.filter(p => {
    const cat = p.category || (p.name.toLowerCase().includes('elite') ? 'ELITE' : 'GENERAL');
    if (selectedCategoryTab === 'GENERAL') return cat === 'GENERAL';
    if (selectedCategoryTab === 'ELITE') return cat === 'ELITE';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" /> Membership Plans Management
          </h1>
          <p className="text-text-secondary text-sm mt-1">Configure pricing, durations, contact limits, and category tier features</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPlans} className="btn btn-ghost btn-sm text-text-muted hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setNewPlan(prev => ({ ...prev, category: selectedCategoryTab === 'ELITE' ? 'ELITE' : 'GENERAL' }));
              setShowAdd(true);
            }}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Plan
          </button>
        </div>
      </div>

      {/* Category Filter Toggle Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('ALL')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedCategoryTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Plans ({plans.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('GENERAL')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedCategoryTab === 'GENERAL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌟 General Plans ({generalCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('ELITE')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              selectedCategoryTab === 'ELITE'
                ? 'bg-gradient-gold text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👑 Elite VIP Plans ({eliteCount})
          </button>
        </div>

        <p className="text-xs text-slate-500 font-medium px-2">
          Showing {filteredPlans.length} plans
        </p>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlans.map((plan) => {
            const isElite = (plan.category || (plan.name.toLowerCase().includes('elite') ? 'ELITE' : 'GENERAL')) === 'ELITE';
            return (
              <div
                key={plan.id}
                className={`card p-6 flex flex-col justify-between relative transition-all duration-300 rounded-2xl bg-white ${
                  isElite
                    ? 'border-2 border-amber-300 shadow-md ring-1 ring-amber-200'
                    : 'border border-slate-200 hover:border-primary/40 shadow-sm'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                    ⭐ POPULAR
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      isElite ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {isElite ? '👑 ELITE VIP' : '🌟 GENERAL'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierColors[plan.tier] || 'bg-slate-100 text-slate-600'}`}>
                      {plan.tier}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-slate-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2 mb-4">
                    <span className="font-sans text-2xl font-black text-slate-900">₹{Number(plan.price).toLocaleString('en-IN')}</span>
                    <span className="text-slate-500 text-xs font-semibold">/ {plan.duration}</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl mb-4 border border-slate-100 flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold text-slate-700">{plan.contactLimit >= 9999 ? 'Unlimited' : plan.contactLimit} Contact Views</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => openEdit(plan)}
                    className="flex-1 btn btn-secondary btn-sm flex items-center justify-center gap-1.5 text-xs font-bold"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50 p-2 rounded-lg"
                    title="Delete Plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" /> Edit Membership Plan
              </h3>
              <button onClick={() => setEditPlan(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Plan Category *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEditPlan({ ...editPlan, category: 'GENERAL' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      editPlan.category === 'GENERAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌟 General Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPlan({ ...editPlan, category: 'ELITE' })}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                      editPlan.category === 'ELITE' ? 'bg-gradient-gold text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👑 Elite VIP Plan
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={editPlan.name}
                  onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={editPlan.price}
                    onChange={(e) => setEditPlan({ ...editPlan, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Duration *</label>
                  <input
                    type="text"
                    value={editPlan.duration}
                    onChange={(e) => setEditPlan({ ...editPlan, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Tier Level</label>
                  <select
                    value={editPlan.tier}
                    onChange={(e) => setEditPlan({ ...editPlan, tier: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    <option value="FREE">FREE</option>
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="PLATINUM">PLATINUM</option>
                    <option value="ELITE">ELITE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Contact View Limit</label>
                  <input
                    type="number"
                    value={editPlan.contactLimit}
                    onChange={(e) => setEditPlan({ ...editPlan, contactLimit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Features</label>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {editPlan.features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={f}
                        onChange={(e) => handleFeatureChange(i, e.target.value, 'edit')}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        onClick={() => handleRemoveFeature(i, 'edit')}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleAddFeature('edit')}
                  className="mt-2 text-xs font-bold text-primary hover:underline"
                >
                  + Add Feature
                </button>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editPlan.isActive}
                    onChange={(e) => setEditPlan({ ...editPlan, isActive: e.target.checked })}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editPlan.isPopular}
                    onChange={(e) => setEditPlan({ ...editPlan, isPopular: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>⭐ Popular</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setEditPlan(null)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="btn btn-primary btn-sm flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Create New Plan
              </h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Plan Category *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewPlan({ ...newPlan, category: 'GENERAL' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      newPlan.category === 'GENERAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌟 General Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPlan({ ...newPlan, category: 'ELITE' })}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                      newPlan.category === 'ELITE' ? 'bg-gradient-gold text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👑 Elite VIP Plan
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder={newPlan.category === 'ELITE' ? 'e.g. Elite Gold Plan' : 'e.g. Gold Plan'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                    placeholder="999"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Duration *</label>
                  <input
                    type="text"
                    value={newPlan.duration}
                    onChange={(e) => setNewPlan({ ...newPlan, duration: e.target.value })}
                    placeholder="3 months"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Tier Level</label>
                  <select
                    value={newPlan.tier}
                    onChange={(e) => setNewPlan({ ...newPlan, tier: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
                  >
                    <option value="FREE">FREE</option>
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="PLATINUM">PLATINUM</option>
                    <option value="ELITE">ELITE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Contact View Limit</label>
                  <input
                    type="number"
                    value={newPlan.contactLimit}
                    onChange={(e) => setNewPlan({ ...newPlan, contactLimit: parseInt(e.target.value) || 0 })}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">Features</label>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {newPlan.features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={f}
                        placeholder="Feature description"
                        onChange={(e) => handleFeatureChange(i, e.target.value, 'add')}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                      {newPlan.features.length > 1 && (
                        <button
                          onClick={() => handleRemoveFeature(i, 'add')}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleAddFeature('add')}
                  className="mt-2 text-xs font-bold text-primary hover:underline"
                >
                  + Add Feature
                </button>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newPlan.isActive}
                    onChange={(e) => setNewPlan({ ...newPlan, isActive: e.target.checked })}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={newPlan.isPopular}
                    onChange={(e) => setNewPlan({ ...newPlan, isPopular: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>⭐ Popular</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button onClick={handleAddPlan} className="btn btn-primary btn-sm flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
