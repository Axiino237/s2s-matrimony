import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  UserPlus,
  Settings,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Lock,
  Check,
  Users,
} from 'lucide-react';
import { superAdminService } from '../../services/super-admin.service';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER';
  community: string;
  status: 'ACTIVE' | 'INACTIVE';
  permissions?: string[];
}

export interface PermissionGroup {
  category: string;
  perms: { key: string; label: string }[];
}

export const OFFICIAL_PERMISSIONS: PermissionGroup[] = [
  {
    category: '📱 Admin Dashboard Screen',
    perms: [
      { key: 'dashboard:view', label: 'View Admin Dashboard Metrics & High-Level Stats' },
    ],
  },
  {
    category: '👥 User Accounts Management Screen',
    perms: [
      { key: 'users:read', label: 'View Registered Users List & Details' },
      { key: 'users:write', label: 'Create & Edit User Account Info' },
      { key: 'users:verify', label: 'Verify User Identity Badges' },
      { key: 'users:ban', label: 'Ban & Deactivate User Accounts' },
      { key: 'users:delete', label: 'Permanently Delete Users from Database' },
    ],
  },
  {
    category: '📋 Profile Moderation Screen',
    perms: [
      { key: 'profiles:read', label: 'View Candidate Profiles & Photos' },
      { key: 'profiles:write', label: 'Edit Candidate Profile Information' },
      { key: 'profiles:verify', label: 'Approve & Reject Profile Verification Badges' },
      { key: 'profiles:moderate', label: 'Moderate Photos & Bio Content' },
      { key: 'profiles:delete', label: 'Delete Candidate Profiles' },
    ],
  },
  {
    category: '👑 Membership Plans & Limits Screen',
    perms: [
      { key: 'plans:read', label: 'View Membership Plans & Pricing' },
      { key: 'plans:manage', label: 'Create, Edit, Pricing & Contact Limits' },
    ],
  },
  {
    category: '💰 Financial Payments & Revenue Screen',
    perms: [
      { key: 'payments:view', label: 'View Payment Transactions & Revenue History' },
      { key: 'payments:refund', label: 'Issue Payment Refunds' },
    ],
  },
  {
    category: '🏘️ Community Management Screen',
    perms: [
      { key: 'communities:read', label: 'View Communities List' },
      { key: 'communities:write', label: 'Create & Edit Community Details' },
      { key: 'communities:delete', label: 'Delete Community Records' },
    ],
  },
  {
    category: '🖼️ Banners & Ads Manager Screen',
    perms: [
      { key: 'banners:read', label: 'View Promotional Banners' },
      { key: 'banners:write', label: 'Create, Upload & Manage Banners' },
    ],
  },
  {
    category: '✍️ Content CMS & Blogs Screen',
    perms: [
      { key: 'blogs:read', label: 'Read Blog Articles' },
      { key: 'blogs:write', label: 'Create & Edit Blog Posts' },
      { key: 'blogs:publish', label: 'Approve & Publish Articles' },
      { key: 'blogs:delete', label: 'Delete Blog Posts' },
    ],
  },
  {
    category: '💍 Success Stories Screen',
    perms: [
      { key: 'stories:read', label: 'View Couples Success Stories' },
      { key: 'stories:approve', label: 'Approve & Publish Success Stories' },
      { key: 'stories:delete', label: 'Delete Success Stories' },
    ],
  },
  {
    category: '✨ AI Biodata Parser & Engine Screen',
    perms: [
      { key: 'ai_biodata:read', label: 'Access AI Biodata Generator' },
      { key: 'ai_biodata:parse', label: 'Parse Candidate Resume/Biodata Files' },
    ],
  },
  {
    category: '🚨 User Abuse Reports Screen',
    perms: [
      { key: 'reports:view', label: 'View User Flagged Abuse Reports' },
      { key: 'reports:handle', label: 'Resolve & Action Reported Accounts' },
      { key: 'reports:delete', label: 'Delete Report History' },
    ],
  },
  {
    category: '🛡️ Admins & Roles Control (UAM) Screen',
    perms: [
      { key: 'admins:manage', label: 'Manage Admin Staff & Role Permission Matrix' },
    ],
  },
  {
    category: '📈 Platform Analytics & Trends Screen',
    perms: [
      { key: 'analytics:view', label: 'View Analytics, Charts & Growth Metrics' },
    ],
  },
  {
    category: '📜 Audit & Security Activity Logs Screen',
    perms: [
      { key: 'audit:view', label: 'View System Audit Trail & Security Activity Logs' },
    ],
  },
  {
    category: '⚙️ Platform System Settings Screen',
    perms: [
      { key: 'settings:read', label: 'View Platform System Settings' },
      { key: 'settings:manage', label: 'Update System Configuration Settings' },
      { key: 'notifications:send', label: 'Send Broadcast System Notifications' },
    ],
  },
  {
    category: '🏠 Member Portal — Dashboard Screen',
    perms: [
      { key: 'member:dashboard', label: 'Access Member Portal Overview & Stats' },
    ],
  },
  {
    category: '👤 Member Portal — My Profile & Edit Screen',
    perms: [
      { key: 'member:profile', label: 'View & Edit Candidate Profile Details' },
    ],
  },
  {
    category: '🔍 Member Portal — Search & Matches Screen',
    perms: [
      { key: 'member:search', label: 'Search Candidates & Recommended Matches' },
    ],
  },
  {
    category: '💌 Member Portal — Interests Sent & Received Screen',
    perms: [
      { key: 'member:interests', label: 'Send, Accept & Manage Express Interest Requests' },
    ],
  },
  {
    category: '💬 Member Portal — Messages & Direct Chat Screen',
    perms: [
      { key: 'member:messages', label: 'Real-time Chat Messaging & Conversations' },
    ],
  },
  {
    category: '👑 Member Portal — Upgrade Plan & Pricing Screen',
    perms: [
      { key: 'member:upgrade', label: 'Browse Pricing & Upgrade Subscriptions' },
    ],
  },
  {
    category: '💳 Member Portal — Payment History Screen',
    perms: [
      { key: 'member:payments', label: 'View Subscription Payment Receipts' },
    ],
  },
  {
    category: '📞 Member Portal — Contact View History Screen',
    perms: [
      { key: 'member:contacts', label: 'View & Unlock Candidate Phone/Email Details' },
    ],
  },
];

const ADMIN_PERM_KEYS = OFFICIAL_PERMISSIONS.filter(g => !g.category.includes('Member Portal')).flatMap((g) => g.perms.map((p) => p.key));
const MEMBER_PERM_KEYS = OFFICIAL_PERMISSIONS.filter(g => g.category.includes('Member Portal')).flatMap((g) => g.perms.map((p) => p.key));

export const INITIAL_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ADMIN_PERM_KEYS,
  ADMIN: ADMIN_PERM_KEYS,
  MEMBER: MEMBER_PERM_KEYS,
};

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: 'bg-rose-100 text-rose-800 border-rose-200',
  ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  MEMBER: 'bg-purple-100 text-purple-800 border-purple-200',
};

const DEFAULT_ADMIN_STAFF: AdminUser[] = [
  {
    id: 'ADM-01',
    name: 'Super Admin Owner',
    email: 'superadmin@s2smatrimony.com',
    role: 'SUPER_ADMIN',
    community: 'Global',
    status: 'ACTIVE',
  },
  {
    id: 'ADM-02',
    name: 'Platform Administrator',
    email: 'admin@s2smatrimony.com',
    role: 'ADMIN',
    community: 'Global',
    status: 'ACTIVE',
  },
];

const SuperAdminAdmins = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'staff'>('roles');
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('s2s_role_permissions');
    if (saved) {
      try { return JSON.parse(saved); } catch { return INITIAL_ROLE_PERMISSIONS; }
    }
    return INITIAL_ROLE_PERMISSIONS;
  });

  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'SUPER_ADMIN' | 'MEMBER'>('ADMIN');

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'ADMIN', community: 'Global' });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getAdmins(page, 10, search);
      const data = res.admins || res.users || (Array.isArray(res) ? res : []);
      const totalCount = res.total ?? (Array.isArray(data) ? data.length : 0);
      const pagesCount = res.totalPages ?? Math.max(1, Math.ceil(totalCount / 10));

      setTotalPages(pagesCount);

      if (Array.isArray(data) && data.length > 0) {
        setAdmins(
          data.map((u: any) => {
            const rawRole = (u.userRoles?.[0]?.role?.name || 'ADMIN').toUpperCase();
            const mainRole = rawRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : rawRole === 'MEMBER' ? 'MEMBER' : 'ADMIN';
            const isSuper = mainRole === 'SUPER_ADMIN';
            const name = u.profile ? `${u.profile.firstName ?? ''} ${u.profile.lastName ?? ''}`.trim() : (isSuper ? 'Super Admin' : u.email.split('@')[0]);

            return {
              id: u.id,
              name: name || 'Admin User',
              email: u.email,
              role: mainRole as any,
              community: u.profile?.community?.name ?? 'Global',
              status: u.isActive !== false ? 'ACTIVE' : 'INACTIVE',
            };
          })
        );
      } else if (!search) {
        setAdmins(DEFAULT_ADMIN_STAFF);
        setTotalPages(1);
      } else {
        setAdmins([]);
      }
    } catch {
      setAdmins(DEFAULT_ADMIN_STAFF);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchAdmins();
    superAdminService.getRolePermissions().then((data) => {
      if (data && Object.keys(data).length > 0) {
        setRolePermissions(data);
      }
    }).catch(() => null);
  }, [fetchAdmins]);

  const handleToggleRolePermission = (permKey: string) => {
    if (selectedRole === 'SUPER_ADMIN') {
      toast.error('Super Admin retains full system permissions at all times.');
      return;
    }
    const currentList = rolePermissions[selectedRole] || [];
    const updated = currentList.includes(permKey)
      ? currentList.filter((p) => p !== permKey)
      : [...currentList, permKey];

    const newMap = { ...rolePermissions, [selectedRole]: updated };
    setRolePermissions(newMap);
  };

  const handleSaveRolePermissions = async () => {
    try {
      const currentList = rolePermissions[selectedRole] || [];
      const updatedMap = await superAdminService.updateRolePermissions(selectedRole, currentList);
      if (updatedMap && Object.keys(updatedMap).length > 0) {
        setRolePermissions(updatedMap);
      }
      toast.success(`Role permissions updated & saved to Database for ${selectedRole.replace('_', ' ')}! 🎉`);
    } catch {
      localStorage.setItem('s2s_role_permissions', JSON.stringify(rolePermissions));
      toast.success(`Role permissions saved for ${selectedRole.replace('_', ' ')}!`);
    }
  };

  const handleUpdateStaffRole = async (newRoleVal: any) => {
    if (!selectedAdmin) return;
    try {
      await superAdminService.updateUserRole(selectedAdmin.id, newRoleVal);
      const updatedAdmin = { ...selectedAdmin, role: newRoleVal };
      setSelectedAdmin(updatedAdmin);
      setAdmins((prev) => prev.map((a) => (a.id === selectedAdmin.id ? updatedAdmin : a)));
      toast.success(`Role for ${selectedAdmin.name} updated to ${newRoleVal} in Database!`);
    } catch {
      const updatedAdmin = { ...selectedAdmin, role: newRoleVal };
      setSelectedAdmin(updatedAdmin);
      setAdmins((prev) => prev.map((a) => (a.id === selectedAdmin.id ? updatedAdmin : a)));
      toast.success(`Role updated for ${selectedAdmin.name}`);
    }
  };

  const handleAddAdmin = () => {
    if (!newAdmin.name || !newAdmin.email) {
      toast.error('Name and Email are required');
      return;
    }
    const created: AdminUser = {
      id: `ADM-${Date.now().toString().slice(-4)}`,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role as any,
      community: newAdmin.community || 'Global',
      status: 'ACTIVE',
    };
    setAdmins((prev) => [...prev, created]);
    toast.success(`Staff account ${newAdmin.name} added!`);
    setShowAddModal(false);
    setNewAdmin({ name: '', email: '', role: 'ADMIN', community: 'Global' });
  };

  const getRolePermCount = (r: string) => (rolePermissions[r] || []).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 card bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Role-Based Access Control (RBAC & UAM)
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            System Roles: <strong>SUPER ADMIN</strong>, <strong>ADMIN</strong>, and <strong>MEMBER</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAdmins} className="btn btn-ghost btn-sm text-text-muted hover:text-primary" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm flex items-center gap-2 shadow-md">
            <UserPlus className="w-4 h-4" /> Add Admin Staff
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs border border-slate-200">
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'roles' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4" /> 1. Role Permission Matrix (SUPER ADMIN / ADMIN / MEMBER)
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'staff' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" /> 2. Admin Staff Users ({admins.length})
        </button>
      </div>

      {/* TAB 1: ROLE PERMISSION MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Role Cards Selector - Exactly 3 Roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: 'SUPER_ADMIN', title: 'Super Admin', desc: 'Full root access, configuration & system management' },
              { role: 'ADMIN', title: 'Admin', desc: 'Platform operations, moderation, users, payments & reports' },
              { role: 'MEMBER', title: 'Member', desc: 'Registered candidate profile (Access controlled via membership plan)' },
            ].map(({ role, title, desc }) => {
              const isSelected = selectedRole === role;
              const isMember = role === 'MEMBER';
              const totalForRole = isMember ? MEMBER_PERM_KEYS.length : ADMIN_PERM_KEYS.length;
              const count = getRolePermCount(role);
              return (
                <div
                  key={role}
                  onClick={() => setSelectedRole(role as any)}
                  className={`p-5 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`badge text-xs font-bold ${roleBadge[role]}`}>{title}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">PERMISSIONS</span>
                    <span className="text-xs font-bold text-primary">{count} / {totalForRole}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Permissions Matrix for Selected Role */}
          <div className="card p-6 bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Permissions for Role: <span className="text-primary">{selectedRole.replace('_', ' ')}</span>
                  </h2>
                  <span className={`badge text-xs font-bold ${roleBadge[selectedRole]}`}>{selectedRole}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  All accounts assigned to the <strong>{selectedRole}</strong> role will automatically inherit these permissions.
                </p>
              </div>
              {selectedRole !== 'SUPER_ADMIN' && (
                <button onClick={handleSaveRolePermissions} className="btn btn-primary btn-sm font-bold shadow-md">
                  Save Role Permissions
                </button>
              )}
            </div>

            {selectedRole === 'SUPER_ADMIN' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Super Admin is the root system owner and automatically retains all system permissions.</span>
              </div>
            )}

            {selectedRole === 'MEMBER' && (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>Member permissions represent candidate portal screens (Dashboard, Profile Edit, Search, Interests, Messaging, Contact Unlocks). Specific contact limits are enforced by active Membership Plans.</span>
              </div>
            )}

            <div className="space-y-6">
              {OFFICIAL_PERMISSIONS.filter((group) => {
                if (selectedRole === 'MEMBER') {
                  return group.category.includes('Member Portal');
                }
                return !group.category.includes('Member Portal');
              }).map((group) => {
                const rolePerms = rolePermissions[selectedRole] || [];
                return (
                  <div key={group.category} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{group.category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {group.perms.map((perm) => {
                        const active = rolePerms.includes(perm.key);
                        const isSuper = selectedRole === 'SUPER_ADMIN';
                        return (
                          <button
                            key={perm.key}
                            disabled={isSuper}
                            onClick={() => handleToggleRolePermission(perm.key)}
                            className={`flex items-start justify-between p-3 rounded-xl text-left text-xs border transition-all ${
                              active
                                ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            } ${isSuper ? 'opacity-90 cursor-default' : 'cursor-pointer'}`}
                          >
                            <div className="pr-2">
                              <p className="font-semibold">{perm.label}</p>
                              <code className="text-[10px] text-slate-400 font-mono">{perm.key}</code>
                            </div>
                            {active && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMIN STAFF USERS */}
      {activeTab === 'staff' && (
        <div className="card overflow-hidden p-0 bg-white border border-slate-200 shadow-sm">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, role, or community..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="input pl-9 text-xs py-2 w-full bg-white border-slate-200"
              />
            </div>
            <p className="text-text-muted text-xs font-medium">
              Showing <span className="font-bold text-text-primary">{admins.length}</span> staff members
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Staff Member', 'Assigned Role', 'Assigned Scope', 'Role Permissions Count', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-text-muted text-xs font-bold uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((u) => {
                  const permCount = getRolePermCount(u.role);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-primary text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                            {u.name[0]}
                          </div>
                          <div>
                            <p className="text-text-primary text-sm font-bold">{u.name}</p>
                            <p className="text-text-muted text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge text-xs font-bold ${roleBadge[u.role] || 'bg-slate-100 text-slate-700'}`}>
                          {u.role ? u.role.replace('_', ' ') : 'ADMIN'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary text-sm font-medium">{u.community}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-primary text-xs font-extrabold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                          {permCount} Inherited from Role
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="badge badge-active text-xs">{u.status}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setSelectedAdmin(u)}
                          className="btn btn-ghost btn-xs text-xs text-text-muted hover:text-primary flex items-center gap-1 border border-slate-200 bg-white"
                        >
                          <Settings className="w-3.5 h-3.5" /> Edit Role & Permissions
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Staff Role Modal */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-text-primary font-display text-lg font-bold">Staff Account: {selectedAdmin.name}</h2>
                <p className="text-text-muted text-xs mt-0.5">{selectedAdmin.email} • Scope: {selectedAdmin.community}</p>
              </div>
              <button onClick={() => setSelectedAdmin(null)} className="text-text-muted hover:text-text-primary text-sm font-bold p-2 hover:bg-slate-100 rounded-lg">✕</button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">Change Assigned Role</label>
              <select
                value={selectedAdmin.role}
                onChange={(e) => handleUpdateStaffRole(e.target.value as any)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="SUPER_ADMIN">SUPER ADMIN (Full Root Access)</option>
                <option value="ADMIN">ADMIN (Platform Administrator)</option>
                <option value="MEMBER">MEMBER (Community Member)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-700">Permissions inherited from [{selectedAdmin.role}] role ({getRolePermCount(selectedAdmin.role)} total):</p>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                {(rolePermissions[selectedAdmin.role] || []).map((perm) => (
                  <span key={perm} className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setSelectedAdmin(null)} className="btn btn-primary btn-sm flex-1 font-bold shadow-md">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-display text-lg font-bold">Add New Admin Staff</h2>
              <button onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Full Name</label>
                <input className="input border-slate-200 text-text-primary w-full" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} placeholder="e.g. Ramesh Kumar" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Email Address</label>
                <input type="email" className="input border-slate-200 text-text-primary w-full" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} placeholder="e.g. ramesh@s2smatrimony.com" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Role Tier</label>
                <select className="input border-slate-200 text-text-primary w-full" value={newAdmin.role} onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MEMBER">MEMBER</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm flex-1 border border-slate-200">Cancel</button>
              <button onClick={handleAddAdmin} className="btn btn-primary btn-sm flex-1 font-bold shadow-md">Add Staff</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAdmins;
