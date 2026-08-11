import { useState, useEffect } from 'react';
import { Crown, CheckCircle2, Shield, Sparkles, Zap, Loader2, CreditCard, Lock, Check, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsApi } from '../../../services/payments.service';
import { useAuthStore } from '../../../store/auth.store';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PlanItem {
  id: string;
  name: string;
  price: string | number;
  duration?: string;
  tier: string;
  contactLimit?: number;
  features?: string[];
  isPopular?: boolean;
}

export const sortPlans = (plansList: PlanItem[]): PlanItem[] => {
  const getPlanRank = (plan: PlanItem): number => {
    const tier = (plan.tier || '').toUpperCase();
    const name = (plan.name || '').toLowerCase();

    if (tier === 'FREE' || name.includes('free')) return 1;
    if (tier === 'SILVER' || name.includes('silver')) return 2;
    if (tier === 'GOLD' || name.includes('gold')) return 3;
    if (tier === 'ELITE' || name.includes('elite')) return 4;
    if (tier === 'PLATINUM' || name.includes('platinum')) return 5;
    if (tier === 'DIAMOND' || name.includes('diamond')) return 6;
    return 100; // Newly added custom plans go to the end!
  };

  return [...plansList].sort((a, b) => {
    const rankA = getPlanRank(a);
    const rankB = getPlanRank(b);
    if (rankA !== rankB) return rankA - rankB;
    const pA = parseFloat(String(a.price).replace(/[^\d.]/g, '') || '0');
    const pB = parseFloat(String(b.price).replace(/[^\d.]/g, '') || '0');
    return pA - pB;
  });
};

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PremiumPage = () => {
  const { user, fetchMe } = useAuthStore();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    paymentsApi
      .getPlans()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setPlans(sortPlans(res));
        } else {
          setPlans(
            sortPlans([
              { id: 'plan-free', name: 'Free Plan', price: '0', duration: 'Lifetime', tier: 'FREE', contactLimit: 5, features: ['5 Daily Express Interests', 'Basic Profile Search Filters', '5 Verified Candidate Contact Views'] },
              { id: 'plan-silver', name: 'Silver Plan', price: '599', duration: '1 Month', tier: 'SILVER', contactLimit: 50, features: ['50 Daily Express Interests', 'Advanced Search Filters', '50 Contact Views', 'Direct Chat Access'] },
              { id: 'plan-gold', name: 'Gold Plan', price: '999', duration: '3 Months', tier: 'GOLD', isPopular: true, contactLimit: 100, features: ['Unlimited Express Interests', 'Advanced Search & Dosha Filters', '100 Contact Unlocks', 'Direct Chat Messaging', 'Priority Profile Ranking', 'AI Match Score'] },
              { id: 'plan-elite', name: 'Elite Plan', price: '1799', duration: '6 Months', tier: 'ELITE', contactLimit: 999, features: ['Everything in Gold +', 'Unlimited Contact Unlocks', 'Highlighted Profile Badge', 'Dedicated Relationship Manager', 'Direct Chat & Phone Access'] },
            ])
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (plan: PlanItem) => {
    if (plan.tier === 'FREE' || Number(plan.price) === 0) {
      toast.success('You are currently on the Free Tier.');
      return;
    }

    setProcessingPlanId(plan.id);
    const toastId = toast.loading('Initializing Razorpay Checkout...');

    try {
      const order = await paymentsApi.createOrder(plan.id);
      const isLoaded = await loadRazorpayScript();

      if (!isLoaded && !order.mock) {
        toast.error('Failed to load Razorpay SDK. Please check your network connection.', { id: toastId });
        setProcessingPlanId(null);
        return;
      }

      if (order.mock || !order.key || order.key.includes('XXXXXXXX')) {
        toast.dismiss(toastId);
        const confirmMock = window.confirm(
          `Razorpay Test Mode: Standard Checkout Notice.\n\nOrder ID: ${order.razorpayOrderId}\nAmount: ₹${Number(plan.price)}\n\nClick OK to simulate successful test payment verification.`
        );
        if (confirmMock) {
          const verifyRes = await paymentsApi.verifyPayment({
            razorpayOrderId: order.razorpayOrderId,
            razorpayPaymentId: `pay_test_sim_${Date.now()}`,
            razorpaySignature: `sig_sim_${Date.now()}`,
          });
          toast.success(verifyRes.message || 'Payment simulated successfully! Membership updated. 🎉');
          await fetchMe();
        }
        setProcessingPlanId(null);
        return;
      }

      toast.dismiss(toastId);
      const options: any = {
        key: order.key,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'S2S Community Matrimony',
        description: `${plan.name} Upgrade (${plan.duration || 'Standard'})`,
        image: '/images/logo.png',
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        handler: async (response: any) => {
          const verifyToast = toast.loading('Verifying Razorpay payment signature...');
          try {
            const verifyRes = await paymentsApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id || order.razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_test_${Date.now()}`,
              razorpaySignature: response.razorpay_signature || `sig_test_${Date.now()}`,
            });
            toast.success(verifyRes.message || 'Payment verified! Membership upgraded successfully 🎉', { id: verifyToast });
            await fetchMe();
          } catch (err: any) {
            toast.error(err?.message || 'Payment verification failed', { id: verifyToast });
          } finally {
            setProcessingPlanId(null);
          }
        },
        prefill: {
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#E11D48',
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanId(null);
            toast('Payment checkout cancelled');
          },
        },
      };

      if (order.razorpayOrderId && !order.razorpayOrderId.startsWith('order_mock_')) {
        options.order_id = order.razorpayOrderId;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error?.description || 'Transaction failed'}`);
        setProcessingPlanId(null);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to initiate Razorpay checkout', { id: toastId });
      setProcessingPlanId(null);
    }
  };

  const currentTier = user?.membershipStatus || 'FREE';

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6 px-4 animate-fade-in">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-200 rounded-full px-4 py-1.5 text-xs font-bold text-rose-700 shadow-xs">
          <Crown className="w-4 h-4 text-rose-600" />
          <span>S2S Community Verified Subscriptions</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Upgrade Your <span className="text-primary">Membership Plan</span>
        </h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto font-medium">
          Get direct access to candidate phone numbers, verified profiles, unlimited express interests, and AI match recommendations.
        </p>
      </div>

      {/* Active Subscription Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-200 uppercase tracking-widest">Your Active Subscription</p>
            <h3 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>{currentTier} Plan</span>
              <span className="text-xs px-3 py-0.5 rounded-full bg-emerald-500 text-white font-bold shadow-xs">
                Active Member
              </span>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-white bg-black/20 px-4 py-2 rounded-xl border border-white/20 shadow-xs">
          <Lock className="w-4 h-4 text-amber-300" />
          <span>Razorpay 256-bit SSL Secure Payment</span>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        /* Plans Grid - Strictly Ordered: Free -> Silver -> Gold -> Elite -> Custom Plans */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const isCurrent = currentTier.toUpperCase() === (plan.tier || '').toUpperCase();
            const isProcessing = processingPlanId === plan.id;
            const displayPrice = String(plan.price).startsWith('₹') ? plan.price : `₹${plan.price}`;

            // Brand Theme per tier
            const isGold = (plan.tier || '').toUpperCase() === 'GOLD' || plan.name.toLowerCase().includes('gold');
            const isPopular = plan.isPopular || isGold;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col bg-white rounded-3xl p-6 border transition-all duration-300 shadow-lg hover:shadow-2xl ${
                  isPopular
                    ? 'border-2 border-primary shadow-primary/20 scale-[1.02] lg:-translate-y-2'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-amber-500 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 z-10">
                    <Zap className="w-3.5 h-3.5 fill-white" /> Most Popular Choice
                  </div>
                )}

                <div className="mb-4 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-xl text-slate-900">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">{displayPrice}</span>
                    {plan.duration && <span className="text-xs text-slate-500 font-semibold">/ {plan.duration}</span>}
                  </div>

                  {plan.contactLimit && (
                    <p className="text-xs text-primary font-bold mt-1.5 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" /> Includes {plan.contactLimit} Phone/Contact Views
                    </p>
                  )}
                </div>

                <ul className="flex-1 space-y-3 mb-6 pt-4 border-t border-slate-100">
                  {plan.features?.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleCheckout(plan)}
                  disabled={isProcessing || isCurrent}
                  className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : isPopular
                      ? 'btn-primary shadow-primary/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : isCurrent ? (
                    'Active Plan'
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>{plan.tier === 'FREE' ? 'Free Tier' : `Choose ${plan.name}`}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <Shield className="w-8 h-8 text-primary flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Razorpay Verified Payment</h4>
            <p className="text-[11px] text-slate-500">Supports UPI, Credit/Debit Cards, NetBanking & Wallets</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <Zap className="w-8 h-8 text-amber-500 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Instant Plan Activation</h4>
            <p className="text-[11px] text-slate-500">Limits & features unlock immediately upon transaction</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <Lock className="w-8 h-8 text-secondary flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">100% Privacy Protection</h4>
            <p className="text-[11px] text-slate-500">Your financial information is 256-bit SSL encrypted</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
