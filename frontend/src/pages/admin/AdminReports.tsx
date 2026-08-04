import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  AlertTriangle, Eye, CheckCircle2, X, Loader2, RefreshCw, BarChart2,
  Users, UserCheck, DollarSign, ShieldCheck, MessageSquare, TrendingUp,
  Activity, Crown, Lock
} from 'lucide-react';
import { adminApi } from '../../services/admin.service';
import { useAuthStore } from '../../store/auth.store';

type Report = {
  id: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  reportedBy?: {
    email: string;
    profile?: { firstName?: string; lastName?: string };
  };
  reportedProfile?: { firstName?: string; lastName?: string };
};

interface DashboardStats {
  totalUsers?: number;
  activeProfiles?: number;
  pendingVerifications?: number;
  totalRevenue?: { _sum?: { amount?: number } } | number;
  premiumMembers?: number;
  joinedToday?: number;
  activeChats?: number;
  successStories?: number;
  monthlyTrend?: Array<{ month: string; revenue: number; users: number }>;
}

const getName = (profile?: { firstName?: string; lastName?: string }) =>
  profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : '—';

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const AdminReports = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMainSection = searchParams.get('tab') === 'analytics' ? 'analytics' : 'reports';

  const { user } = useAuthStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportTab, setReportTab] = useState<'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'>('PENDING');
  const [viewReport, setViewReport] = useState<Report | null>(null);

  // Analytics Dashboard State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [search] = useState('');
  const [page] = useState(1);

  const fetchReports = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await adminApi.getReports(page, 10, search);
      setReports(res.reports || []);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setReportLoading(false);
    }
  }, [page, search]);

  const fetchAnalyticsStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminApi.getDashboardStats();
      setStats(res);
    } catch {
      toast.error('Failed to load analytics statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeMainSection === 'analytics') {
      fetchAnalyticsStats();
    } else {
      fetchReports();
    }
  }, [activeMainSection, fetchReports, fetchAnalyticsStats]);

  const handleStatus = async (id: string, status: string, label: string) => {
    try {
      await adminApi.updateReport(id, status);
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast.success(`Report ${label}`);
      if (viewReport?.id === id) setViewReport(null);
    } catch {
      toast.error('Failed to update report');
    }
  };

  const counts = {
    PENDING: reports.filter((r) => r.status === 'PENDING').length,
    REVIEWED: reports.filter((r) => r.status === 'REVIEWED').length,
    RESOLVED: reports.filter((r) => r.status === 'RESOLVED').length,
    DISMISSED: reports.filter((r) => r.status === 'DISMISSED').length,
  };

  const visibleReports = reports.filter((r) => r.status === reportTab);

  const statusBadge = (s: string) =>
    s === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
    s === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
    s === 'DISMISSED' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-blue-100 text-blue-700 border-blue-200';

  const revenueTotal = typeof stats?.totalRevenue === 'number'
    ? stats.totalRevenue
    : stats?.totalRevenue?._sum?.amount || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header & Main Navigation Section Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-slate-900">
              {activeMainSection === 'analytics' ? 'Enterprise Platform Analytics' : 'Reports & Abuse Moderation'}
            </h1>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-widest">
              UAM Enterprise Tier
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {activeMainSection === 'analytics' 
              ? 'Real-time system statistics, user growth, conversion metrics, and engagement analytics.'
              : 'Review, action, and resolve user abuse reports with audit trace.'}
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setSearchParams({ tab: 'reports' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMainSection === 'reports'
                ? 'bg-white text-rose-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>User Reports</span>
            {counts.PENDING > 0 && (
              <span className="bg-rose-500 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded-full">
                {counts.PENDING}
              </span>
            )}
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'analytics' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeMainSection === 'analytics'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-indigo-500" />
            <span>Platform Analytics</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 1: ANALYTICS DASHBOARD ── */}
      {activeMainSection === 'analytics' && (
        <div className="space-y-6">
          
          {statsLoading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-xs font-bold text-slate-600">Loading Enterprise Analytics...</span>
            </div>
          ) : (
            <>
              {/* Executive Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Members</span>
                    <span className="text-3xl font-extrabold font-display text-slate-900 mt-1 block">
                      {stats?.totalUsers ?? 0}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 mt-1 block flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +{stats?.joinedToday ?? 0} New Today
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Profiles</span>
                    <span className="text-3xl font-extrabold font-display text-slate-900 mt-1 block">
                      {stats?.activeProfiles ?? 0}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-600 mt-1 block">
                      {stats?.pendingVerifications ?? 0} Pending Moderation
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <UserCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Revenue</span>
                    <span className="text-3xl font-extrabold font-display text-emerald-600 mt-1 block">
                      ₹{revenueTotal.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                      {stats?.premiumMembers ?? 0} Active Subscriptions
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Engagements</span>
                    <span className="text-3xl font-extrabold font-display text-slate-900 mt-1 block">
                      {stats?.activeChats ?? 0}
                    </span>
                    <span className="text-[11px] font-semibold text-rose-500 mt-1 block">
                      {stats?.successStories ?? 0} Verified Matches
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* UAM Role & Access Scope Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400">
                    <Lock className="w-4 h-4 text-amber-400" />
                    UAM Enterprise Access Control Logged In As: <span className="text-white font-bold">{user?.email}</span>
                  </div>
                  <h3 className="text-lg font-bold">Role-Based Access Control Scope (RBAC)</h3>
                  <p className="text-xs text-slate-300">
                    Your account has full administrative permission to read platform statistics, filter users, and moderate profiles.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> USERS_READ
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> PAYMENTS_VIEW
                  </span>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> REPORTS_VIEW
                  </span>
                </div>
              </div>

              {/* Monthly Trend Analytics Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-indigo-600" /> Monthly Growth & Revenue Performance
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">7-Month rolling trajectory for registered users and gross transactions</p>
                  </div>

                  <button
                    onClick={fetchAnalyticsStats}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-300"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600" /> Refresh Stats
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {(stats?.monthlyTrend || [
                    { month: 'Jan', users: 120, revenue: 45000 },
                    { month: 'Feb', users: 180, revenue: 62000 },
                    { month: 'Mar', users: 240, revenue: 89000 },
                    { month: 'Apr', users: 310, revenue: 115000 },
                    { month: 'May', users: 410, revenue: 142000 },
                    { month: 'Jun', users: 530, revenue: 185000 },
                    { month: 'Jul', users: 680, revenue: 230000 },
                  ]).map((m, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-2">
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">{m.month}</span>
                      
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500 font-semibold">Users</div>
                        <div className="text-sm font-bold text-indigo-600">{m.users}</div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-1">
                        <div className="text-[10px] text-slate-500 font-semibold">Revenue</div>
                        <div className="text-xs font-extrabold text-emerald-600">₹{(m.revenue / 1000).toFixed(0)}k</div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </>
          )}

        </div>
      )}

      {/* ── SECTION 2: USER ABUSE REPORTS MODERATION ── */}
      {activeMainSection === 'reports' && (
        <div className="space-y-5">
          
          {/* Sub Stats Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([['PENDING', 'text-amber-700 bg-amber-50 border-amber-200'], ['REVIEWED', 'text-blue-700 bg-blue-50 border-blue-200'], ['RESOLVED', 'text-emerald-700 bg-emerald-50 border-emerald-200'], ['DISMISSED', 'text-slate-600 bg-slate-50 border-slate-200']] as const).map(([key, color]) => (
              <div key={key} className={`p-4 text-center rounded-2xl border ${color} shadow-sm`}>
                <p className="text-2xl font-bold font-display">{counts[key]}</p>
                <p className="text-xs font-extrabold tracking-wider mt-1 uppercase">{key}</p>
              </div>
            ))}
          </div>

          {/* Report Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setReportTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    reportTab === t
                      ? 'bg-white text-rose-600 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {t} {counts[t] > 0 && <span className="ml-1 bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full text-[10px]">{counts[t]}</span>}
                </button>
              ))}
            </div>

            <button
              onClick={fetchReports}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-rose-500" /> Refresh Reports
            </button>
          </div>

          {/* Reports List */}
          {reportLoading ? (
            <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
          ) : visibleReports.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-500 rounded-2xl border border-slate-200 shadow-sm">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-800 text-base">No {reportTab.toLowerCase()} reports</p>
              <p className="text-xs text-slate-500 mt-1">All user abuse reports in this category have been addressed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReports.map((r) => (
                <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex gap-4 items-start hover:border-rose-300 transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-900 font-bold text-sm">{r.reason.replace(/_/g, ' ')}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 font-medium">
                      Reported by: <span className="font-bold text-slate-800">{getName(r.reportedBy?.profile)}</span> against <span className="font-bold text-rose-600">{getName(r.reportedProfile)}</span>
                    </p>
                    {r.description && <p className="text-slate-500 text-xs mt-1 line-clamp-1 italic">"{r.description}"</p>}
                    <p className="text-slate-400 text-[10px] mt-1.5 font-semibold">{timeAgo(r.createdAt)}</p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setViewReport(r)} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 border border-slate-300 transition-colors">
                      <Eye className="w-3.5 h-3.5 text-indigo-600" /> View Details
                    </button>
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatus(r.id, 'RESOLVED', 'Resolved')}
                          className="py-1.5 px-3 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                        </button>
                        <button
                          onClick={() => handleStatus(r.id, 'DISMISSED', 'Dismissed')}
                          className="py-1.5 px-3 text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View Report Modal */}
          {viewReport && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-slate-900 font-display text-lg font-bold">Report Details</h2>
                  <button onClick={() => setViewReport(null)} className="text-slate-400 hover:text-slate-900 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ['Report ID', viewReport.id.slice(0, 12) + '...'],
                    ['Type', viewReport.reason.replace(/_/g, ' ')],
                    ['Reported By', getName(viewReport.reportedBy?.profile)],
                    ['Against', getName(viewReport.reportedProfile)],
                    ['Status', viewReport.status],
                    ['Time', timeAgo(viewReport.createdAt)],
                    ...(viewReport.description ? [['Description', viewReport.description]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium text-xs">{k}</span>
                      <span className="text-slate-900 font-bold text-xs text-right max-w-[60%]">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  {viewReport.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleStatus(viewReport.id, 'RESOLVED', 'Resolved')} className="py-2 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow">✓ Resolve</button>
                      <button onClick={() => handleStatus(viewReport.id, 'DISMISSED', 'Dismissed')} className="py-2 flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300">✕ Dismiss</button>
                    </>
                  )}
                  <button onClick={() => setViewReport(null)} className="py-2 flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300">Close</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default AdminReports;
