import React, { useState, useMemo } from 'react';
import { Crown, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface Plan {
  id: string;
  name: string;
  tier: string;
  price: number;
  durationMonths: number;
  contactViewLimit: number;
  maxContacts?: number;
  maxInterests?: number;
  hasChat: boolean;
  hasAiMatch: boolean;
  hasVideoProfile?: boolean;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
  description?: string;
  createdAt?: string;
}

export const TIERS = ['FREE', 'SILVER', 'GOLD', 'ELITE', 'PLATINUM'];

export const TIER_COLORS: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-600 font-medium border border-slate-200',
  SILVER: 'bg-slate-200 text-slate-700 font-medium border border-slate-300',
  GOLD: 'bg-amber-100 text-amber-800 font-bold border border-amber-300',
  ELITE: 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-300',
  PLATINUM: 'bg-purple-100 text-purple-800 font-bold border border-purple-300',
};

// Excluded features per requirements:
// 1. whatsapp connect
// 2. dedicated manager
// 3. video profile
// 4. advanced search
export const PREDEFINED_FEATURES = [
  'View contact details',
  'Send interests',
  'Chat messaging',
  'Profile highlighting',
  'Priority listing',
  'Profile verification badge',
  'AI-match recommendations',
  'Priority support',
  'Horoscope matching',
];

export const isFeatureAllowed = (feat: string): boolean => {
  if (!feat || typeof feat !== 'string') return false;
  const lower = feat.toLowerCase().trim();
  const forbidden = [
    'whatsapp connect',
    'dedicated manager',
    'dedicated match manager',
    'dedicated relationship manager',
    'video profile',
    'video profile highlight',
    'video highlight',
    'advanced search',
  ];
  return !forbidden.some((k) => lower.includes(k) || k.includes(lower));
};

const DEFAULT_PLAN: Omit<Plan, 'id' | 'createdAt'> = {
  name: '',
  tier: 'SILVER',
  price: 599,
  durationMonths: 1,
  contactViewLimit: 50,
  maxContacts: 50,
  maxInterests: 50,
  hasChat: true,
  hasAiMatch: false,
  hasVideoProfile: false,
  features: ['View contact details', 'Send interests', 'Chat messaging'],
  isActive: true,
  isPopular: false,
  description: '',
};

export interface PlanFormModalProps {
  plan: Partial<Plan> | null;
  onClose: () => void;
  onSave: (data: Partial<Plan>) => Promise<void> | void;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({ plan, onClose, onSave }) => {
  const isNew = !plan?.id;

  const initialForm = useMemo(() => {
    if (!plan || !plan.id) return { ...DEFAULT_PLAN };
    const limit =
      plan.contactViewLimit !== undefined
        ? Number(plan.contactViewLimit)
        : (plan as any).contactLimit !== undefined
        ? Number((plan as any).contactLimit)
        : (plan as any).maxContacts !== undefined
        ? Number((plan as any).maxContacts)
        : 0;

    const interests =
      plan.maxInterests !== undefined ? Number(plan.maxInterests) : 0;

    const dur = plan.durationMonths !== undefined ? plan.durationMonths : 0;

    const cleanedFeatures = (Array.isArray(plan.features) ? plan.features : []).filter(isFeatureAllowed);

    return {
      ...DEFAULT_PLAN,
      ...plan,
      contactViewLimit: limit,
      maxContacts: limit,
      maxInterests: interests,
      hasChat: plan.hasChat !== undefined ? Boolean(plan.hasChat) : false,
      hasAiMatch: Boolean(plan.hasAiMatch),
      hasVideoProfile: false,
      features: cleanedFeatures,
      durationMonths: dur,
    };
  }, [plan]);

  const [form, setForm] = useState(initialForm);
  const [featureInput, setFeatureInput] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field: string, val: any) => setForm((prev) => ({ ...prev, [field]: val }));

  const toggleFeature = (feat: string) => {
    const current = form.features || [];
    if (current.includes(feat)) {
      set('features', current.filter((f) => f !== feat));
    } else {
      set('features', [...current, feat]);
    }
  };

  const addCustomFeature = () => {
    if (!featureInput.trim()) return;
    const feat = featureInput.trim();
    if (!isFeatureAllowed(feat)) {
      toast.error('This feature is not permitted in membership plans');
      return;
    }
    if (!form.features?.includes(feat)) {
      set('features', [...(form.features || []), feat]);
    }
    setFeatureInput('');
  };

  const allFeatureOptions = useMemo(() => {
    const set = new Set([...PREDEFINED_FEATURES, ...(form.features || []).filter(isFeatureAllowed)]);
    return Array.from(set);
  }, [form.features]);

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
        maxContacts: form.contactViewLimit,
        hasVideoProfile: false,
        features: (form.features || []).filter(isFeatureAllowed),
      };
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            {isNew ? 'Create New Plan' : 'Edit Plan Configuration'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Plan Name */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Silver 1 Month, Elite 3 Months, Platinum VIP"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Tier */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">
              Tier Category *
            </label>
            <select
              value={form.tier}
              onChange={(e) => {
                const newTier = e.target.value;
                set('tier', newTier);
                if (newTier === 'FREE') {
                  set('hasChat', false);
                  set('contactViewLimit', 0);
                  set('maxInterests', 0);
                } else if (form.contactViewLimit === 0) {
                  set('contactViewLimit', 50);
                  set('hasChat', true);
                  set('maxInterests', 50);
                }
              }}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">
              Price (₹) *
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                set('price', isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value))
              }
              min={0}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">
              Duration (months) *
            </label>
            <select
              value={form.durationMonths}
              onChange={(e) => set('durationMonths', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">
              Contact View Limit
            </label>
            <input
              type="number"
              value={form.contactViewLimit}
              onChange={(e) =>
                set(
                  'contactViewLimit',
                  isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value),
                )
              }
              min={-1}
              placeholder="0 = Disabled (Free), -1 = Unlimited"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              0 = Disabled (Free users), -1 = Unlimited, or set count (50, 100)
            </p>
          </div>

          {/* Interest Expression Limit */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">
              Interest Expression Limit
            </label>
            <input
              type="number"
              value={form.maxInterests}
              onChange={(e) =>
                set(
                  'maxInterests',
                  isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value),
                )
              }
              min={-1}
              placeholder="0 = Disabled (Free), -1 = Unlimited"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              0 = Cannot send interests (Free), -1 = Unlimited, or set limit
            </p>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Brief description of this plan..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Core Tier Feature Switches */}
          <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Core Tier Capability Switches
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={form.hasChat}
                  onChange={(e) => set('hasChat', e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">💬 Direct Live Chat</span>
                  <span className="text-[10px] text-slate-500">Enable 1-to-1 messaging</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={form.hasAiMatch}
                  onChange={(e) => set('hasAiMatch', e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">✨ AI Match Score</span>
                  <span className="text-[10px] text-slate-500">AI algorithm ranking</span>
                </div>
              </label>
            </div>
          </div>

          {/* Features - Checkbox selection */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Perks & Benefits ({form.features?.length || 0} selected)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/50">
              {allFeatureOptions.map((feat) => {
                const isSelected = form.features?.includes(feat);
                return (
                  <label
                    key={feat}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFeature(feat);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 accent-primary rounded cursor-pointer pointer-events-none"
                    />
                    <span className="flex-1 truncate">{feat}</span>
                  </label>
                );
              })}
            </div>

            {/* Add Custom Feature */}
            <div className="flex gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFeature())}
                placeholder="Add custom perk..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={addCustomFeature}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium hover:bg-slate-900 transition-colors"
              >
                + Add Perk
              </button>
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
              <span className="text-sm font-medium text-slate-700">Active Status</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={(e) => set('isPopular', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-sm font-medium text-slate-700">⭐ Popular Badge</span>
            </label>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isNew ? 'Create Plan' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
