import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, UserCheck, Crown, IndianRupee, UserPlus, AlertCircle, 
  MessageSquare, Heart, Bell, CheckCircle2, XCircle, ArrowUpRight,
  Sparkles, Layers, ShieldCheck, Loader2
} from 'lucide-react';
import { adminApi } from '../../services/admin.service';

interface DashboardStats {
  totalUsers: number;
  activeProfiles: number;
  pendingVerifications: number;
  totalRevenue: number;
  premiumMembers: number;
  joinedToday: number;
  activeChats: number;
  successStories: number;
  monthlyStats: { month: string; revenue: number; users: number }[];
  recentRegistrations: { id: string; name: string; community: string; status: string; createdAt: string }[];
  pendingVerificationsList: { id: string; name: string; type: string; createdAt: string }[];
}

const StatCard = ({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string; color: string;
}) => (
  <div className="stat-card hover:border-primary/40 transition-all group cursor-pointer">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center transition-transform group-hover:scale-110`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1">
      <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-text-primary text-2xl font-bold font-display">{value}</p>
      <p className="text-xs mt-1 font-medium text-emerald-600">
        Live DB Data
      </p>
    </div>
  </div>
);

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return 'Just now';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeProfiles: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    premiumMembers: 0,
    joinedToday: 0,
    activeChats: 0,
    successStories: 0,
    monthlyStats: [],
    recentRegistrations: [],
    pendingVerificationsList: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboardStats()
      .then((data) => {
        if (data) setStats(data);
      })
      .catch((err) => console.error('Failed to load DB stats', err))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid - Member Count Focus */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={loading ? '...' : fmt(stats.totalUsers)} color="bg-blue-100 text-blue-600 border border-blue-200" />
        <StatCard icon={UserCheck} label="Active Profiles" value={loading ? '...' : fmt(stats.activeProfiles)} color="bg-primary/10 text-primary border border-primary/20" />
        <StatCard icon={Crown} label="Premium Members" value={loading ? '...' : String(stats.premiumMembers)} color="bg-amber-100 text-amber-600 border border-amber-200" />
        <StatCard icon={UserPlus} label="Joined Today" value={loading ? '...' : String(stats.joinedToday)} color="bg-violet-100 text-violet-600 border border-violet-200" />
      </div>

      {/* Member Growth Chart */}
      <div className="grid grid-cols-1 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" /> User Registrations & Member Growth (DB Records)
            </h2>
            <span className="badge badge-active">Live DB</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.monthlyStats && stats.monthlyStats.length > 0 ? stats.monthlyStats : [{ month: 'Current', revenue: stats.totalRevenue, users: stats.totalUsers }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', color: '#0F172A' }} />
              <Bar dataKey="users" fill="#1A7080" radius={[6, 6, 0, 0]} name="Members" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity + Pending Verifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Recent Registrations (Database)
            </h2>
            <a href="/admin/users" className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="py-6 text-center text-text-muted text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading registrations...
              </div>
            ) : stats.recentRegistrations && stats.recentRegistrations.length > 0 ? (
              stats.recentRegistrations.map((user, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 border border-primary/20">
                    {(user.name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{user.name}</p>
                    <p className="text-text-muted text-xs">{user.community} • {formatTimeAgo(user.createdAt)}</p>
                  </div>
                  <span className={`badge text-xs ${user.status === 'active' ? 'badge-active' : 'badge-pending'}`}>
                    {user.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-text-muted text-sm">
                No recent user registrations in database.
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text-primary font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-warning" /> Pending Verifications (Database)
            </h2>
            <a href="/admin/profiles" className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
              Review All <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="py-6 text-center text-text-muted text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading verifications...
              </div>
            ) : stats.pendingVerificationsList && stats.pendingVerificationsList.length > 0 ? (
              stats.pendingVerificationsList.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-sm flex-shrink-0 border border-amber-200">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{item.name}</p>
                    <p className="text-text-muted text-xs">{item.type} • {formatTimeAgo(item.createdAt)}</p>
                  </div>
                  <a href="/admin/profiles" className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 border border-primary/20 transition-colors">
                    Review
                  </a>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-text-muted text-sm">
                No pending verifications in database.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-text-primary font-semibold mb-4 text-base flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Manage Users', href: '/admin/users', color: 'bg-primary/10 text-primary border border-primary/20' },
            { icon: Bell, label: 'Send Notification', href: '#', color: 'bg-violet-100 text-violet-600 border border-violet-200' },
            { icon: Crown, label: 'Manage Plans', href: '/admin/plans', color: 'bg-amber-100 text-amber-600 border border-amber-200' },
            { icon: Layers, label: 'View Reports', href: '/admin/payments', color: 'bg-emerald-100 text-emerald-600 border border-emerald-200' },
          ].map((a, i) => {
            const ActionIcon = a.icon;
            return (
              <a
                key={i}
                href={a.href}
                className="card p-5 text-center hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-2xl ${a.color} mx-auto mb-3 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                  <ActionIcon className="w-6 h-6" />
                </div>
                <p className="text-text-primary text-sm font-semibold">{a.label}</p>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
