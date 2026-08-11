import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Crown, Pencil, Eye, Plus, X, Save, Loader2, RefreshCw, PhoneCall, Trash2 } from 'lucide-react';
import { paymentsApi } from '../../services/payments.service';

interface Plan {
  id: string;
  name: string;
  price: string;
  duration: string;
  members: string;
  tier: 'FREE' | 'SILVER' | 'GOLD' | 'ELITE';
  contactLimit: number;
  features: string[];
  isActive: boolean;
}

const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan-free',
    name: 'Free',
    price: '0',
    duration: 'Lifetime',
    members: '43,540',
    tier: 'FREE',
    contactLimit: 5,
    features: ['Basic profile', 'Search profiles', 'Send 5 interests/day', '5 Contact Views'],
    isActive: true,
  },
  {
    id: 'plan-silver',
    name: 'Silver',
    price: '599',
    duration: '1 month',
    members: '3,240',
    tier: 'SILVER',
    contactLimit: 50,
    features: ['Unlimited interests', 'Chat access', '50 Contacts', 'Priority listing'],
    isActive: true,
  },
  {
    id: 'plan-elite',
    name: 'Elite',
    price: '999',
    duration: '3 months',
    members: '4,180',
    tier: 'ELITE',
    contactLimit: 100,
    features: ['All Silver features', '100 Contacts', 'Photo verification badge', 'Horoscope match'],
    isActive: true,
  },
  {
    id: 'plan-platinum',
    name: 'Platinum',
    price: '1799',
    duration: '6 months',
    members: '1,520',
    tier: 'ELITE',
    contactLimit: 999,
    features: ['All Elite features', 'Unlimited Contacts', 'Personal matchmaker', 'Background verification'],
    isActive: true,
  },
];

const tierColors: Record<string, string> = {
  FREE:    'bg-slate-100 text-slate-600 border-slate-200 font-medium',
  SILVER:  'bg-blue-100 text-blue-700 border-blue-200 font-medium',
  ELITE:   'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold shadow-sm',
};

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
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
          if (name === 'Diamond Plan') name = 'Elite Plan';
          else if (name === 'Diamond') name = 'Elite';

          const cLimit = p.contactLimit ?? (tier === 'FREE' ? 5 : tier === 'SILVER' ? 50 : tier === 'ELITE' ? 100 : 999);

          return {
            id: p.id || `plan-${Math.random()}`,
            name,
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
    name: '', price: '', duration: '1 month', tier: 'SILVER', contactLimit: 50, features: [''], isActive: true,
  });

  const openEdit = (plan: Plan) => setEditPlan({ ...plan });

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
      await paymentsApi.updatePlan(createdId, created);
      setPlans(prev => [...prev, created]);
      toast.success(`Plan "${created.name}" created!`);
      setShowAdd(false);
      setNewPlan({ name: '', price: '', duration: '1 month', tier: 'SILVER', contactLimit: 50, features: [''], isActive: true });
    } catch {
      toast.error('Failed to add plan');
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

  const formatPrice = (plan: Plan) => {
    if (plan.tier === 'FREE' || Number(plan.price) === 0) return '₹0';
    const dur = plan.duration || '1 month';
    return `₹${Number(plan.price).toLocaleString('en-IN')}/${dur === '1 month' ? 'mo' : dur.replace(' months', 'mo')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <Crown className="w-6 h-6 text-primary" /> Membership Plans Management
          </h1>
          <p className="text-text-secondary text-sm mt-1">Configure plan pricing, features, and contact views limit</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPlans} className="btn btn-ghost btn-sm text-text-muted hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-sm flex items-center gap-2">
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
            <div key={plan.id} className="card p-5 flex flex-col gap-3 hover:border-primary/30 transition-all shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`badge text-xs mb-2 ${tierColors[plan.tier] || 'bg-slate-100 text-slate-600'}`}>{plan.tier}</span>
                  <h3 className="text-text-primary font-bold text-base">{plan.name}</h3>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full mt-1 ${plan.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} title={plan.isActive ? 'Active' : 'Inactive'} />
              </div>

              <p className="text-2xl font-bold text-primary font-display">{formatPrice(plan)}</p>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-semibold">
                <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                <span>Contact Limit: <strong>{plan.contactLimit >= 999 ? 'Unlimited' : `${plan.contactLimit} Contacts`}</strong></span>
              </div>

              <p className="text-text-muted text-xs">{plan.members} active members</p>

              <ul className="space-y-1 flex-1">
                {(plan.features || []).map((f, i) => (
                  <li key={i} className="text-text-secondary text-xs flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEdit(plan)}
                  className="flex items-center justify-center gap-1.5 btn btn-secondary btn-sm flex-1 text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Plan
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Plan Modal */}
      {editPlan && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-scale-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-text-primary font-display text-lg font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" /> Edit Plan — {editPlan.name}
              </h2>
              <button onClick={() => setEditPlan(null)} className="text-text-muted hover:text-text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Plan Name</label>
                <input className="input" value={editPlan.name} onChange={e => setEditPlan({ ...editPlan, name: e.target.value })} />
              </div>

              <div>
                <label className="input-label">Tier</label>
                <select className="input" value={editPlan.tier} onChange={e => setEditPlan({ ...editPlan, tier: e.target.value as any })}>
                  <option value="FREE">FREE</option>
                  <option value="SILVER">SILVER</option>
                  <option value="GOLD">GOLD</option>
                  <option value="ELITE">ELITE</option>
                </select>
              </div>

              <div>
                <label className="input-label">Price (₹)</label>
                <input className="input" type="number" value={editPlan.price} onChange={e => setEditPlan({ ...editPlan, price: e.target.value })} placeholder="0" />
              </div>

              <div>
                <label className="input-label">Duration</label>
                <select className="input" value={editPlan.duration} onChange={e => setEditPlan({ ...editPlan, duration: e.target.value })}>
                  <option value="Lifetime">Lifetime (Free)</option>
                  <option value="1 month">1 Month</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="12 months">12 Months</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="input-label flex items-center gap-1.5 text-amber-700">
                  <PhoneCall className="w-4 h-4 text-amber-600" />
                  Allowed Contact Views Limit (Number of Phone/Email Unlocks)
                </label>
                <input
                  className="input font-bold border-amber-300 focus:border-amber-500"
                  type="number"
                  value={editPlan.contactLimit}
                  onChange={e => setEditPlan({ ...editPlan, contactLimit: Number(e.target.value) })}
                  placeholder="e.g. 5 for Free, 50 for Silver, 100 for Gold, 999 for Unlimited"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Members with this plan can view phone numbers & email addresses up to this limit (Use 999 for Unlimited).
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0">Features List</label>
                <button onClick={() => handleAddFeature('edit')} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Feature
                </button>
              </div>
              <div className="space-y-2">
                {editPlan.features.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="input flex-1 text-sm"
                      value={f}
                      onChange={e => handleFeatureChange(i, e.target.value, 'edit')}
                      placeholder={`Feature ${i + 1}`}
                    />
                    <button onClick={() => handleRemoveFeature(i, 'edit')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-text-primary text-sm font-medium flex-1">Plan Active Status</label>
              <button
                onClick={() => setEditPlan({ ...editPlan, isActive: !editPlan.isActive })}
                className={`w-12 h-6 rounded-full relative transition-all duration-200 ${editPlan.isActive ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${editPlan.isActive ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => setEditPlan(null)} className="btn btn-ghost btn-sm">Cancel</button>
              <button onClick={handleSaveEdit} className="btn btn-primary btn-sm flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-scale-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-text-primary font-display text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> New Membership Plan
              </h2>
              <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Plan Name</label>
                <input className="input" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="e.g. Platinum" />
              </div>
              <div>
                <label className="input-label">Tier</label>
                <select className="input" value={newPlan.tier} onChange={e => setNewPlan({ ...newPlan, tier: e.target.value as any })}>
                  <option value="SILVER">SILVER</option>
                  <option value="GOLD">GOLD</option>
                  <option value="ELITE">ELITE</option>
                </select>
              </div>
              <div>
                <label className="input-label">Price (₹)</label>
                <input className="input" type="number" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} placeholder="999" />
              </div>
              <div>
                <label className="input-label">Duration</label>
                <select className="input" value={newPlan.duration} onChange={e => setNewPlan({ ...newPlan, duration: e.target.value })}>
                  <option value="1 month">1 Month</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="12 months">12 Months</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="input-label">Allowed Contact Views Limit</label>
                <input
                  className="input"
                  type="number"
                  value={newPlan.contactLimit}
                  onChange={e => setNewPlan({ ...newPlan, contactLimit: Number(e.target.value) })}
                  placeholder="50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0">Features</label>
                <button onClick={() => handleAddFeature('add')} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Feature
                </button>
              </div>
              <div className="space-y-2">
                {newPlan.features.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="input flex-1 text-sm"
                      value={f}
                      onChange={e => handleFeatureChange(i, e.target.value, 'add')}
                      placeholder={`Feature ${i + 1}`}
                    />
                    <button onClick={() => handleRemoveFeature(i, 'add')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-sm">Cancel</button>
              <button onClick={handleAddPlan} className="btn btn-primary btn-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlans;
