import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Download, Search, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/admin.service';
import { exportToCSV, getExportTimestamp } from '../../utils/export.utils';

type Payment = {
  id: string;
  amount: number | string;
  currency: string;
  status: string;
  createdAt: string;
  user?: {
    email: string;
    profile?: { firstName?: string; lastName?: string };
  };
  plan?: { name: string; tier: string };
};

const getUserName = (p: Payment) => {
  const profile = p.user?.profile;
  return profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : (p.user?.email ?? '—');
};

const PAGE_SIZE = 8;

const AdminPayments = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchPayments = useCallback(async (pg = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const res = await adminApi.getPayments(pg, PAGE_SIZE, searchQuery);
      setPayments(res.payments || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || Math.max(1, Math.ceil((res.total || 0) / PAGE_SIZE)));
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(page, search); }, [fetchPayments, page, search]);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    const name = getUserName(p).toLowerCase();
    const matchQ = !q || p.id.toLowerCase().includes(q) || name.includes(q);
    const matchS = statusFilter === 'All' || p.status === statusFilter;
    return matchQ && matchS;
  });

  const totalRevenue = payments.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + Number(p.amount), 0);
  const failedCount = payments.filter((p) => p.status === 'FAILED').length;
  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;

  const statusBadge = (s: string) =>
    s === 'SUCCESS' ? 'badge-active' : s === 'PENDING' ? 'badge-pending' : 'badge-rejected';

  const tierBadge = (tier: string) =>
    tier === 'ELITE' || tier === 'DIAMOND' ? 'badge-verified' :
    tier === 'GOLD' ? 'bg-amber-100 text-amber-700 border-amber-200' :
    tier === 'SILVER' ? 'bg-blue-100 text-blue-700 border-blue-200' :
    'bg-slate-100 text-slate-600 border-slate-200';

  const handleExportPayments = () => {
    if (!payments || payments.length === 0) {
      toast.error('No payments to export');
      return;
    }
    setExporting(true);
    try {
      const dataToExport = filtered.length > 0 ? filtered : payments;
      const formatted = dataToExport.map((p) => ({
        id: p.id,
        customerName: getUserName(p),
        customerEmail: p.user?.email || 'N/A',
        plan: p.plan?.name || p.plan?.tier || 'Membership',
        amount: Number(p.amount),
        currency: p.currency || 'INR',
        status: p.status,
        date: new Date(p.createdAt).toLocaleDateString('en-IN'),
      }));

      const headers = {
        id: 'Payment ID',
        customerName: 'Customer Name',
        customerEmail: 'Email',
        plan: 'Membership Plan',
        amount: 'Amount',
        currency: 'Currency',
        status: 'Payment Status',
        date: 'Transaction Date',
      };

      const dateStamp = getExportTimestamp();
      exportToCSV(formatted, `s2s_payments_${dateStamp}`, headers);
      toast.success(`Exported ${formatted.length} payments as CSV!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export payments');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> Payment Reports
          </h1>
          <p className="text-text-secondary text-sm mt-1">{loading ? 'Loading...' : `${total} total transactions`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchPayments(page)} className="btn btn-ghost btn-sm text-text-muted hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPayments}
            disabled={exporting}
            className="btn btn-ghost btn-sm flex items-center gap-2 border border-slate-200"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Total Revenue (Page)', val: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-primary' },
          { label: 'Failed', val: failedCount, color: 'text-rose-600' },
          { label: 'Pending', val: pendingCount, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="card p-4 sm:p-5 text-center flex flex-col justify-center">
            <p className={`text-xl sm:text-2xl font-bold font-display leading-tight ${s.color}`}>{s.val}</p>
            <p className="text-text-muted text-xs sm:text-sm font-medium mt-1 leading-snug">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); }} className="input pl-9 py-2 w-full" placeholder="Search by ID or user..." />
        </div>
        <select className="input py-2 w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['#', 'User', 'Plan', 'Amount', 'Date', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-text-muted text-xs font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-text-muted">No payments found</td></tr>
                ) : filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-text-muted text-sm font-mono whitespace-nowrap">{p.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-text-primary text-sm font-medium whitespace-nowrap">{getUserName(p)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.plan && (
                        <span className={`badge text-xs ${tierBadge(p.plan.tier)}`}>
                          {p.plan.name === 'Diamond Plan' || p.plan.name === 'Diamond' ? 'Elite Plan' : p.plan.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-primary text-sm font-bold whitespace-nowrap">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-text-muted text-sm whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`badge text-xs ${statusBadge(p.status)}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <p className="text-text-muted text-sm">{total} total payments</p>
        <div className="flex gap-1.5 flex-wrap justify-center">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-sm text-xs disabled:opacity-40">Prev</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`btn btn-sm text-xs min-w-[32px] ${page === p ? 'btn-primary' : 'btn-ghost'}`}>{p}</button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost btn-sm text-xs disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
