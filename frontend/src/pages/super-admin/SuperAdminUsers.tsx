import { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users, Search, Eye, Ban, CheckCircle2, X, Loader2, RefreshCw,
  Trash2, Crown, Shield, UserCheck, User, Phone, Mail, Calendar,
  TrendingUp, Activity, UserX, Download,
} from 'lucide-react';
import { adminApi } from '../../services/admin.service';

const PAGE_SIZE = 10;

type UserRecord = {
  id: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    photos?: { url: string }[];
    photoUrl?: string;
    community?: { name: string };
    verificationStatus?: string;
    profileCompletionPercent?: number;
    gender?: string;
    age?: number;
  };
  userRoles?: { role: { name: string } }[];
};

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: Crown },
  ADMIN:       { label: 'Admin',       color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Shield },
  MODERATOR:   { label: 'Moderator',   color: 'bg-amber-100 text-amber-700 border-amber-200', icon: UserCheck },
  SUPPORT_AGENT: { label: 'Support',   color: 'bg-teal-100 text-teal-700 border-teal-200', icon: User },
  MEMBER:      { label: 'Member',      color: 'bg-slate-100 text-slate-600 border-slate-200', icon: User },
};

const SuperAdminUsers = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState<UserRecord | null>(null);

  const fetchUsers = useCallback(async (pg = 1, q = '') => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(pg, PAGE_SIZE, q);
      const data = res.users || res.items || (Array.isArray(res) ? res : []);
      setUsers(Array.isArray(data) ? data : []);
      setTotalUsers(res.total ?? (Array.isArray(data) ? data.length : 0));
      setTotalPages(res.totalPages ?? Math.max(1, Math.ceil((res.total ?? 0) / PAGE_SIZE)));
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(page, search); }, [fetchUsers, page, search]);

  const getUserName = (u: UserRecord) =>
    u.profile ? `${u.profile.firstName ?? ''} ${u.profile.lastName ?? ''}`.trim() || u.email.split('@')[0] : u.email.split('@')[0];

  const getUserRole = (u: UserRecord): string => {
    const r = u.userRoles?.[0]?.role?.name;
    if (r) return r;
    if (u.email.includes('superadmin')) return 'SUPER_ADMIN';
    if (u.email.includes('admin')) return 'ADMIN';
    return 'MEMBER';
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const role = getUserRole(u);
      const status = u.isActive ? 'ACTIVE' : 'SUSPENDED';
      const matchStatus = statusFilter === 'All' || status === statusFilter;
      const matchRole = roleFilter === 'All' || role === roleFilter;
      return matchStatus && matchRole;
    });
  }, [users, statusFilter, roleFilter]);

  const handleBan = async (id: string, isActive: boolean, name: string) => {
    try {
      await adminApi.banUser(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !isActive } : u));
      toast.success(`${name} has been ${isActive ? 'suspended' : 'reactivated'}.`);
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotalUsers((n) => n - 1);
      toast.success(`"${name}" permanently deleted.`);
    } catch {
      toast.error('Failed to delete user');
    }
  };

  // Summary stats
  const activeCount  = users.filter((u) => u.isActive).length;
  const bannedCount  = users.filter((u) => !u.isActive).length;
  const memberCount  = users.filter((u) => getUserRole(u) === 'MEMBER').length;
  const adminCount   = users.filter((u) => ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(getUserRole(u))).length;

  const statCards = [
    { label: 'Total Users',   value: totalUsers,   icon: Users,    color: 'from-primary to-primary-dark', bg: 'bg-primary-50', text: 'text-primary-dark' },
    { label: 'Active',        value: activeCount,  icon: Activity, color: 'from-secondary to-secondary-dark', bg: 'bg-secondary-50', text: 'text-secondary-dark' },
    { label: 'Suspended',     value: bannedCount,  icon: UserX,    color: 'from-rose-500 to-rose-700', bg: 'bg-rose-50', text: 'text-rose-700' },
    { label: 'Members',       value: memberCount,  icon: User,     color: 'from-secondary-light to-secondary', bg: 'bg-teal-50', text: 'text-teal-700' },
    { label: 'Staff/Admins',  value: adminCount,   icon: Shield,   color: 'from-gold to-gold-dark', bg: 'bg-gold-50', text: 'text-gold-dark' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'Loading users…' : `${totalUsers.toLocaleString()} total registered users across all communities`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchUsers(page, search)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-2xl p-4 ${s.bg} border border-current/10`}>
              <Icon className={`w-5 h-5 mb-2 ${s.text}`} />
              <p className={`text-2xl font-bold ${s.text}`}>{s.value.toLocaleString()}</p>
              <p className={`text-xs font-medium ${s.text} opacity-70 mt-0.5`}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
            placeholder="Search by name, email, or phone…"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 min-w-[150px]"
        >
          <option value="All">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="MODERATOR">Moderator</option>
          <option value="SUPPORT_AGENT">Support Agent</option>
          <option value="MEMBER">Member</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 min-w-[140px]"
        >
          <option value="All">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['User', 'Contact', 'Role', 'Community', 'Joined', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-4 text-slate-500 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">No users found</p>
                    </td>
                  </tr>
                ) : filtered.map((u) => {
                  const name    = getUserName(u);
                  const role    = getUserRole(u);
                  const isActive = u.isActive;
                  const roleConf = ROLE_CONFIG[role] || ROLE_CONFIG.MEMBER;
                  const RoleIcon = roleConf.icon;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {u.profile?.photos?.[0]?.url || (u.profile as any)?.photoUrl ? (
                            <img
                              src={u.profile?.photos?.[0]?.url || (u.profile as any)?.photoUrl}
                              alt={name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {name[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-slate-900 text-sm font-semibold">{name}</p>
                            <p className="text-slate-400 text-[10px] font-mono">{u.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <p className="text-slate-800 text-xs font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                        </p>
                        <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {u.phone || '—'}
                        </p>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${roleConf.color}`}>
                          <RoleIcon className="w-3 h-3" />
                          {roleConf.label}
                        </span>
                      </td>

                      {/* Community */}
                      <td className="px-5 py-4 text-slate-600 text-sm font-medium">
                        {u.profile?.community?.name || '—'}
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4">
                        <p className="text-slate-500 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isActive ? <CheckCircle2 className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setViewUser(u)}
                            className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 border border-secondary/20 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleBan(u.id, u.isActive, name)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isActive
                                ? 'text-amber-600 hover:bg-amber-50 border-amber-200'
                                : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                            }`}
                            title={isActive ? 'Suspend User' : 'Reactivate User'}
                          >
                            {isActive ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, name)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                            title="Delete Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-5 py-3 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">
            Showing page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{totalPages}</span>
            <span className="text-slate-400 ml-1">({totalUsers.toLocaleString()} total)</span>
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`min-w-[32px] py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  page === p
                    ? 'bg-primary text-white border-primary'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
            {totalPages > 7 && <span className="px-2 text-slate-400 self-center">…</span>}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* View User Detail Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {viewUser.profile?.photos?.[0]?.url ? (
                  <img
                    src={viewUser.profile.photos[0].url}
                    alt={getUserName(viewUser)}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center text-lg font-bold border-2 border-white/30">
                    {getUserName(viewUser)[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="text-white font-bold">{getUserName(viewUser)}</p>
                  <p className="text-white/70 text-xs">{viewUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setViewUser(null)}
                className="text-white/70 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3">
              {[
                { label: 'User ID',      value: viewUser.id.slice(0, 16) + '…',   icon: User },
                { label: 'Email',        value: viewUser.email,                     icon: Mail },
                { label: 'Phone',        value: viewUser.phone || '—',              icon: Phone },
                { label: 'Role',         value: ROLE_CONFIG[getUserRole(viewUser)]?.label || getUserRole(viewUser), icon: Shield },
                { label: 'Community',    value: viewUser.profile?.community?.name || '—', icon: Users },
                { label: 'Status',       value: viewUser.isActive ? 'Active' : 'Suspended', icon: Activity },
                { label: 'Joined',       value: new Date(viewUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), icon: Calendar },
                ...(viewUser.profile?.profileCompletionPercent != null
                  ? [{ label: 'Profile Complete', value: `${viewUser.profile.profileCompletionPercent}%`, icon: TrendingUp }]
                  : []),
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 text-sm font-medium flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" /> {label}
                  </span>
                  <span className="text-slate-900 font-semibold text-sm text-right max-w-[55%]">{value}</span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-5 pt-0 flex gap-2">
              <button
                onClick={() => { handleBan(viewUser.id, viewUser.isActive, getUserName(viewUser)); setViewUser(null); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                  viewUser.isActive
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {viewUser.isActive ? '⛔ Suspend' : '✅ Reactivate'}
              </button>
              <button
                onClick={() => setViewUser(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUsers;
