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
  Trash2,
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

export const ALL_PERM_KEYS = OFFICIAL_PERMISSIONS.flatMap((g) => g.perms.map((p) => p.key));
export const ADMIN_PERM_KEYS = OFFICIAL_PERMISSIONS.filter(g => !g.category.includes('Member Portal')).flatMap((g) => g.perms.map((p) => p.key));
export const MEMBER_PERM_KEYS = OFFICIAL_PERMISSIONS.filter(g => g.category.includes('Member Portal')).flatMap((g) => g.perms.map((p) => p.key));

export const INITIAL_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ALL_PERM_KEYS,
  ADMIN: ADMIN_PERM_KEYS,
  MEMBER: MEMBER_PERM_KEYS,
};

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: 'bg-rose-100 text-rose-800 border-rose-200',
  ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  MODERATOR: 'bg-amber-100 text-amber-800 border-amber-200',
  SUPPORT_AGENT: 'bg-teal-100 text-teal-800 border-teal-200',
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

interface DbRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem?: boolean;
}

const DEFAULT_DB_ROLES: DbRole[] = [
  { id: 'r1', name: 'SUPER_ADMIN', displayName: 'Super Admin', description: 'Root System Owner', isSystem: true },
  { id: 'r2', name: 'ADMIN', displayName: 'Admin', description: 'Platform Administrator', isSystem: true },
  { id: 'r3', name: 'MEMBER', displayName: 'Member', description: 'Candidate User Portal', isSystem: true },
];

const SuperAdminAdmins = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'staff'>('roles');
  const [dbRoles, setDbRoles] = useState<DbRole[]>(DEFAULT_DB_ROLES);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', displayName: '', description: '' });

  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('s2s_role_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.SUPER_ADMIN = ALL_PERM_KEYS;
        return parsed;
      } catch { return INITIAL_ROLE_PERMISSIONS; }
    }
    return INITIAL_ROLE_PERMISSIONS;
  });

  const [selectedRole, setSelectedRole] = useState<string>('ADMIN');

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'ADMIN', community: 'Global' });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDbRoles = useCallback(async () => {
    try {
      const res = await superAdminService.getAllRoles();
      if (Array.isArray(res) && res.length > 0) {
        setDbRoles(res);
      }
    } catch {
      setDbRoles(DEFAULT_DB_ROLES);
    }
  }, []);

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
            const name = u.profile ? `${u.profile.firstName ?? ''} ${u.profile.lastName ?? ''}`.trim() : (rawRole === 'SUPER_ADMIN' ? 'Super Admin' : u.email.split('@')[0]);

            return {
              id: u.id,
              name: name || 'Admin User',
              email: u.email,
              role: rawRole as any,
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

  const [dbModules, setDbModules] = useState<any[]>([]);

  const fetchDbModules = useCallback(async () => {
    try {
      const mods = await superAdminService.getModulesWithPermissions();
      if (Array.isArray(mods) && mods.length > 0) {
        setDbModules(mods);
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchDbRoles();
    fetchDbModules();
    fetchAdmins();
    superAdminService.getRolePermissions().then((data) => {
      if (data && Object.keys(data).length > 0) {
        data.SUPER_ADMIN = ALL_PERM_KEYS;
        setRolePermissions(data);
        localStorage.setItem('s2s_role_permissions', JSON.stringify(data));
      }
    }).catch(() => null);
  }, [fetchAdmins, fetchDbRoles, fetchDbModules]);

  const handleCreateRole = async () => {
    if (!newRoleForm.name.trim() && !newRoleForm.displayName.trim()) {
      toast.error('Role name is required');
      return;
    }
    const nameToUse = newRoleForm.name.trim() || newRoleForm.displayName.trim();
    try {
      const created = await superAdminService.createRole({
        name: nameToUse,
        displayName: newRoleForm.displayName || nameToUse,
        description: newRoleForm.description,
      });

      toast.success(`New Role "${created.displayName || created.name}" created in Database! 🎉`);
      await fetchDbRoles();
      setSelectedRole(created.name);
      setShowCreateRoleModal(false);
      setNewRoleForm({ name: '', displayName: '', description: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (roleObj: DbRole, e: React.MouseEvent) => {
    e.stopPropagation();
    if (['SUPER_ADMIN', 'ADMIN', 'MEMBER'].includes(roleObj.name)) {
      toast.error('Core system roles (SUPER_ADMIN, ADMIN, MEMBER) cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete role "${roleObj.displayName}"?`)) return;

    try {
      await superAdminService.deleteRole(roleObj.id);
      toast.success(`Role "${roleObj.displayName}" deleted from Database.`);
      await fetchDbRoles();
      if (selectedRole === roleObj.name) {
        setSelectedRole('ADMIN');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete role');
    }
  };

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

  const handleToggleCategory = (categoryPermKeys: string[]) => {
    if (selectedRole === 'SUPER_ADMIN') {
      toast.error('Super Admin retains full system permissions at all times.');
      return;
    }
    const currentList = rolePermissions[selectedRole] || [];
    const allIncluded = categoryPermKeys.every((k) => currentList.includes(k));
    const updated = allIncluded
      ? currentList.filter((k) => !categoryPermKeys.includes(k))
      : Array.from(new Set([...currentList, ...categoryPermKeys]));

    const newMap = { ...rolePermissions, [selectedRole]: updated };
    setRolePermissions(newMap);
  };

  const handleSelectAllRolePerms = () => {
    if (selectedRole === 'SUPER_ADMIN') return;
    const newMap = { ...rolePermissions, [selectedRole]: ALL_PERM_KEYS };
    setRolePermissions(newMap);
  };

  const handleClearAllRolePerms = () => {
    if (selectedRole === 'SUPER_ADMIN') return;
    const newMap = { ...rolePermissions, [selectedRole]: [] };
    setRolePermissions(newMap);
  };

  const handleSaveRolePermissions = async () => {
    try {
      const currentList = rolePermissions[selectedRole] || [];
      const updatedMap = await superAdminService.updateRolePermissions(selectedRole, currentList);
      const finalMap = (updatedMap && Object.keys(updatedMap).length > 0)
        ? updatedMap
        : rolePermissions;
      
      setRolePermissions(finalMap);
      localStorage.setItem('s2s_role_permissions', JSON.stringify(finalMap));
      window.dispatchEvent(new Event('s2s_permissions_updated'));
      toast.success(`Role permissions updated & saved to Database for ${selectedRole.replace('_', ' ')}! 🎉`);
    } catch {
      localStorage.setItem('s2s_role_permissions', JSON.stringify(rolePermissions));
      window.dispatchEvent(new Event('s2s_permissions_updated'));
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
            <ShieldCheck className="w-6 h-6 text-primary" /> User Access Management (UAM & RBAC Matrix)
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Roles are fetched from the PostgreSQL <code>roles</code> table. Super Admin can create custom roles & configure screen access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateRoleModal(true)} className="btn btn-outline btn-sm flex items-center gap-2 border-primary text-primary hover:bg-primary/5">
            <Shield className="w-4 h-4" /> + Create New Role
          </button>
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
          <Shield className="w-4 h-4" /> 1. Database Role Permission Matrix ({dbRoles.length} Roles)
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
          {/* Role Cards Selector — Dynamic Roles from DB */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Database Roles ({dbRoles.length})</h2>
            <button onClick={() => setShowCreateRoleModal(true)} className="text-xs font-bold text-primary hover:underline">
              + Add Custom Role
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {dbRoles.map((rObj) => {
              const role = rObj.name;
              const title = rObj.displayName || role;
              const desc = rObj.description || `${title} Role`;
              const isSelected = selectedRole === role;
              const isSuperAdminRole = role === 'SUPER_ADMIN';
              const count = isSuperAdminRole ? ALL_PERM_KEYS.length : getRolePermCount(role);
              const canDelete = !['SUPER_ADMIN', 'ADMIN', 'MEMBER'].includes(role);

              return (
                <div
                  key={rObj.id || role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`badge text-[11px] font-bold ${roleBadge[role] || 'bg-indigo-100 text-indigo-800'}`}>{title}</span>
                      <div className="flex items-center gap-1">
                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRole(rObj, e)}
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{desc}</p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">ENABLED</span>
                    <span className="text-xs font-black text-primary">{count} / {ALL_PERM_KEYS.length}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Permissions Matrix for Selected Role */}
          <div className="card p-6 bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Screen Access Matrix for Role: <span className="text-primary">{selectedRole.replace('_', ' ')}</span>
                  </h2>
                  <span className={`badge text-xs font-bold ${roleBadge[selectedRole] || 'bg-slate-100'}`}>{selectedRole}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Tick screens/permissions to grant access to users with the <strong>{selectedRole}</strong> role. Ticked screens will be visible in their sidebar menu.
                </p>
              </div>

              {selectedRole !== 'SUPER_ADMIN' ? (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {dbRoles.find(r => r.name === selectedRole) && !['SUPER_ADMIN', 'ADMIN', 'MEMBER'].includes(selectedRole) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        const targetObj = dbRoles.find(r => r.name === selectedRole);
                        if (targetObj) handleDeleteRole(targetObj, e);
                      }}
                      className="btn btn-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Role
                    </button>
                  )}
                  <button type="button" onClick={handleSelectAllRolePerms} className="btn btn-ghost btn-xs text-xs text-primary border border-primary/20 hover:bg-primary/5">
                    Select All ({ALL_PERM_KEYS.length})
                  </button>
                  <button type="button" onClick={handleClearAllRolePerms} className="btn btn-ghost btn-xs text-xs text-slate-500 border border-slate-200 hover:bg-slate-100">
                    Clear All
                  </button>
                  <button onClick={handleSaveRolePermissions} className="btn btn-primary btn-sm font-bold shadow-md">
                    Save Role Permissions
                  </button>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Full Root Access Granted
                </div>
              )}
            </div>

            <div className="space-y-5">
              {OFFICIAL_PERMISSIONS.map((group) => {
                const categoryKeys = group.perms.map((p) => p.key);
                const rolePerms = rolePermissions[selectedRole] || [];
                const enabledInGroup = categoryKeys.filter((k) => rolePerms.includes(k)).length;
                const allGroupEnabled = categoryKeys.length > 0 && enabledInGroup === categoryKeys.length;

                return (
                  <div key={group.category} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{group.category}</h3>
                        <span className="text-[11px] font-bold text-slate-400">({enabledInGroup}/{categoryKeys.length})</span>
                      </div>
                      {selectedRole !== 'SUPER_ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleToggleCategory(categoryKeys)}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          {allGroupEnabled ? 'Deselect Category' : 'Select Category'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {group.perms.map((perm) => {
                        const isSuper = selectedRole === 'SUPER_ADMIN';
                        const active = isSuper || rolePerms.includes(perm.key);
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
                {dbRoles.map((r) => (
                  <option key={r.id || r.name} value={r.name}>
                    {r.displayName || r.name} ({r.description || r.name})
                  </option>
                ))}
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

      {/* Create New Role Modal */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-text-primary font-display text-lg font-bold">Create New Database Role</h2>
              <button onClick={() => setShowCreateRoleModal(false)} className="text-text-muted hover:text-text-primary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Role Identifier / Code</label>
                <input
                  type="text"
                  className="input border-slate-200 text-text-primary w-full uppercase font-mono"
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  placeholder="e.g. REGIONAL_MANAGER"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Display Title</label>
                <input
                  type="text"
                  className="input border-slate-200 text-text-primary w-full"
                  value={newRoleForm.displayName}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, displayName: e.target.value })}
                  placeholder="e.g. Regional Manager"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Role Scope / Description</label>
                <textarea
                  rows={2}
                  className="input border-slate-200 text-text-primary w-full py-2"
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  placeholder="e.g. Manages regional branch profiles, candidate approvals & verification"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowCreateRoleModal(false)} className="btn btn-ghost btn-sm flex-1 border border-slate-200">Cancel</button>
              <button onClick={handleCreateRole} className="btn btn-primary btn-sm flex-1 font-bold shadow-md">Create Role</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Staff Modal */}
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
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Assigned Role</label>
                <select className="input border-slate-200 text-text-primary w-full font-bold text-slate-800" value={newAdmin.role} onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}>
                  {dbRoles.map((r) => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.displayName || r.name}
                    </option>
                  ))}
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
