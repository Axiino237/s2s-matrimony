import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, XCircle, ArrowUpRight, ShieldCheck, RefreshCw, Loader2, Sparkles, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paymentsApi } from '../../../services/payments.service';
import { useAuthStore } from '../../../store/auth.store';

export interface PaymentRecord {
  id: string;
  planName: string;
  tier?: string;
  amount: number | string;
  currency?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

const PaymentHistoryPage = () => {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await paymentsApi.getMyHistory();
      if (Array.isArray(res)) {
        setPayments(res);
      } else {
        setPayments([]);
      }
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const totalSpent = payments
    .filter((p) => (p.status || '').toUpperCase() === 'SUCCESS')
    .reduce((acc, p) => acc + (parseFloat(String(p.amount)) || 0), 0);

  const currentTier = user?.membershipStatus || 'FREE';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-6 px-3 sm:px-4 min-w-0 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
            <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" /> Payment & Transaction History
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Track all your membership upgrades, Razorpay transaction IDs, and active plan receipts.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Plan</p>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{currentTier} Plan</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                Active
              </span>
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Successful Transactions</p>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {payments.filter((p) => (p.status || '').toUpperCase() === 'SUCCESS').length} Completed
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Investment</p>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">₹{totalSpent.toLocaleString('en-IN')}</h3>
          </div>
        </div>
      </div>

      {/* Main Table / Records */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">Recent Transactions</h2>
          <Link
            to="/premium"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark transition-colors"
          >
            <span>Upgrade Plan</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Fetching payment history...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <CreditCard className="w-8 h-8" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="font-bold text-slate-800 text-base">No Transactions Found</h3>
              <p className="text-slate-500 text-xs">
                You haven't made any membership plan purchases yet. Upgrade your plan to view contacts and unlock features!
              </p>
            </div>
            <Link
              to="/premium"
              className="inline-flex items-center gap-2 btn-primary text-xs px-6 py-2.5 rounded-xl font-bold shadow-md"
            >
              <span>Explore Membership Plans</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Stacked Cards (below 768px) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {payments.map((item) => {
                const isSuccess = (item.status || '').toUpperCase() === 'SUCCESS';
                const isPending = (item.status || '').toUpperCase() === 'PENDING';

                return (
                  <div key={item.id} className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.planName}</h4>
                        <p className="text-[11px] text-slate-500 font-mono uppercase mt-0.5">
                          Tier: {item.tier || 'MEMBER'}
                        </p>
                      </div>
                      <span className="font-black text-slate-900 text-base">
                        ₹{Number(item.amount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-500 text-[11px]">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }) : 'Recent'}
                      </span>
                      {isSuccess ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Success
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Failed
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg font-mono text-[10px] text-slate-500 break-all space-y-0.5">
                      {item.razorpayPaymentId && item.razorpayPaymentId !== 'N/A' && item.razorpayPaymentId !== 'Pending Verification' && (
                        <div><span className="font-semibold text-slate-700">Pay ID:</span> {item.razorpayPaymentId}</div>
                      )}
                      <div><span className="font-semibold text-slate-700">Order ID:</span> {item.razorpayOrderId}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (768px and above) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-6">Date & Time</th>
                    <th className="py-4 px-6">Plan Details</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Razorpay Payment ID / Order ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {payments.map((item) => {
                    const isSuccess = (item.status || '').toUpperCase() === 'SUCCESS';
                    const isPending = (item.status || '').toUpperCase() === 'PENDING';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-slate-900 font-semibold whitespace-nowrap">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }) : 'Recent'}
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm">{item.planName}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 uppercase">
                            Tier: {item.tier || 'MEMBER'}
                          </div>
                        </td>

                        <td className="py-4 px-6 font-black text-slate-900 text-sm whitespace-nowrap">
                          ₹{Number(item.amount).toLocaleString('en-IN')}
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Success
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200 shadow-2xs">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Failed
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 font-mono text-slate-600 text-[11px]">
                          {item.razorpayPaymentId && item.razorpayPaymentId !== 'N/A' && item.razorpayPaymentId !== 'Pending Verification' ? (
                            <div className="text-slate-900 font-bold">{item.razorpayPaymentId}</div>
                          ) : null}
                          <div className="text-slate-400 text-[10px]">{item.razorpayOrderId}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
