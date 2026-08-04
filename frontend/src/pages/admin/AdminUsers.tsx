import { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Users, Search, Eye, Ban, CheckCircle2, X, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { adminApi } from '../../services/admin.service';
import { useAuthStore } from '../../store/auth.store';

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
  };
  userRoles?: { role: { name: string } }[];
};

const roleBadgeStyle: Record<string, string> = {
  SUPER_ADMIN: 'bg-primary/10 text-primary border border-primary/20 font-bold',
  ADMIN:       'bg-blue-100 text-blue-700 border border-blue-200 font-bold',
  MODERATOR:   'bg-amber-100 text-amber-700 border border-amber-200 font-bold',
  SUPPORT_AGENT: 'bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold',
  MEMBER:      'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
};

const AdminUsers = () => {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.roles?.includes('SUPER_ADMIN') || (currentUser as any)?.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState<UserRecord | null>(null);

  const fetchUsers = useCallback(async (pg = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(pg, PAGE_SIZE, searchQuery);
      const data = res.users || res.items || (Array.isArray(res) ? res : []);
      setUsers(Array.isArray(data) ? data : []);
      setTotalUsers(res.total || (Array.isArray(data) ? data.length : 0));
      setTotalPages(res.totalPages || Math.max(1, Math.ceil((res.total || (Array.isArray(data) ? data.length : 0)) / PAGE_SIZE)));
    } catch {
      toast.error('Failed to load users from database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(page, search); }, [fetchUsers, page, search]);

  const getUserName = (u: UserRecord) =>
    u.profile ? `${u.profile.firstName ?? ''} ${u.profile.lastName ?? ''}`.trim() : u.email.split('@')[0];

  const getUserStatus = (u: UserRecord) => u.isActive ? 'ACTIVE' : 'SUSPENDED';

  const getUserCommunity = (u: UserRecord) => u.profile?.community?.name ?? '—';

  const getUserJoined = (u: UserRecord) =>
    new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const getUserRole = (u: UserRecord) => {
    const roleName = u.userRoles?.[0]?.role?.name;
    if (roleName) return roleName;
    if (u.email.includes('superadmin')) return 'SUPER_ADMIN';
    if (u.email.includes('admin')) return 'ADMIN';
    return 'MEMBER';
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const role = getUserRole(u);

      // Admin role users cannot see SUPER_ADMIN or ADMIN accounts
      if (!isSuperAdmin && (role === 'SUPER_ADMIN' || role === 'ADMIN')) {
        return false;
      }

      const q = search.toLowerCase();
      const name = getUserName(u);
      const matchSearch = !q || name.toLowerCase().includes(q) || u.email.includes(q) || u.phone.includes(q);
      const matchStatus = statusFilter === 'All' || getUserStatus(u) === statusFilter;
      const matchRole = roleFilter === 'All' || role === roleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, search, statusFilter, roleFilter, isSuperAdmin]);

  const handleBan = async (id: string, isActive: boolean) => {
    try {
      await adminApi.banUser(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !isActive } : u));
      toast.success('User status updated live in database!');
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}" from the database?`)) {
      return;
    }
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success(`User "${name}" permanently deleted from database!`);
    } catch {
      toast.error('Failed to delete user from database');
    }
  };

  const statusBadge = (s: string) =>
    s === 'ACTIVE' ? 'badge-active font-bold' : 'badge-rejected font-bold';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between p-5 card bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> User Management
          </h1>
          <p className="text-text-secondary text-sm mt-1">{loading ? 'Loading...' : `${totalUsers} total users registered in system`}</p>
        </div>
          <button onClick={() => fetchUsers(page)} className="btn btn-ghost btn-sm flex items-center gap-1 text-text-muted hover:text-primary">
            <RefreshCw className="w-4 h-4" />
          </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9 py-2 w-full border-slate-200 text-text-primary"
            placeholder="Search name, email, phone..."
          />
        </div>
        <select className="input py-2 w-40 border-slate-200 text-text-primary" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="All">All Roles</option>
          {isSuperAdmin && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
          {isSuperAdmin && <option value="ADMIN">ADMIN</option>}
          <option value="MODERATOR">MODERATOR</option>
          <option value="SUPPORT_AGENT">SUPPORT AGENT</option>
          <option value="MEMBER">MEMBER</option>
        </select>
        <select className="input py-2 w-40 border-slate-200 text-text-primary" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="All">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0 bg-white border border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['User', 'Contact', 'Role', 'Community', 'Joined', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-text-muted text-xs font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-text-muted font-medium">No user records found in database</td></tr>
              ) : filtered.map((u) => {
                const name = getUserName(u);
                const role = getUserRole(u);
                const status = getUserStatus(u);
                const community = getUserCommunity(u);
                const joined = getUserJoined(u);

                const canBan = (!['SUPER_ADMIN', 'ADMIN'].includes(role) || isSuperAdmin) && u.id !== currentUser?.id && u.email !== currentUser?.email;

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.profile?.photos?.[0]?.url || (u.profile as any)?.photoUrl ? (
                          <img
                            src={u.profile?.photos?.[0]?.url || (u.profile as any)?.photoUrl}
                            alt={name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-primary text-white flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0">
                            {name[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary text-sm font-bold">{name}</p>
                          <p className="text-text-muted text-[10px] font-mono">{u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-text-primary text-xs font-semibold">{u.email}</p>
                      <p className="text-text-muted text-xs font-mono">{u.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${roleBadgeStyle[role] || 'bg-slate-100 text-slate-700'}`}>
                        {role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-sm font-medium">{community}</td>
                    <td className="px-4 py-3 text-text-muted text-xs font-medium">{joined}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${statusBadge(status)}`}>{status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setViewUser(u)} className="btn py-1 px-2.5 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1 font-semibold">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {canBan && (
                          <>
                            <button
                              onClick={() => handleBan(u.id, u.isActive)}
                              className={`btn py-1 px-2.5 text-xs rounded-lg flex items-center gap-1 font-semibold ${status === 'SUSPENDED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}
                            >
                              {status === 'SUSPENDED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                              {status === 'SUSPENDED' ? 'Unban' : 'Ban'}
                            </button>
                            <button
                              onClick={() => handleDelete(u.id, name)}
                              className="btn py-1 px-2.5 text-xs rounded-lg flex items-center gap-1 font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                              title="Delete user permanently from Database"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm font-medium">{totalUsers} total users</p>
        <div className="flex gap-1.5">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost btn-sm text-xs disabled:opacity-40">Prev</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`btn btn-sm text-xs min-w-[32px] ${page === p ? 'btn-primary' : 'btn-ghost'}`}>{p}</button>
          ))}
          {totalPages > 5 && <span className="text-text-muted px-1">...</span>}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-ghost btn-sm text-xs disabled:opacity-40">Next</button>
        </div>
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-display text-lg font-bold">User Details</h2>
              <button onClick={() => setViewUser(null)} className="text-text-muted hover:text-text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-text-muted font-medium">Name</span>
                <span className="font-bold text-text-primary">{getUserName(viewUser)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-text-muted font-medium">Email</span>
                <span className="font-bold text-text-primary">{viewUser.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-text-muted font-medium">Phone</span>
                <span className="font-bold text-text-primary">{viewUser.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-text-muted font-medium">Role</span>
                <span className={`badge text-xs ${roleBadgeStyle[getUserRole(viewUser)]}`}>
                  {getUserRole(viewUser).replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-text-muted font-medium">Status</span>
                <span className={`badge text-xs ${statusBadge(getUserStatus(viewUser))}`}>{getUserStatus(viewUser)}</span>
              </div>
            </div>
            <div className="pt-2">
              <button onClick={() => setViewUser(null)} className="btn btn-ghost btn-sm w-full border border-slate-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
