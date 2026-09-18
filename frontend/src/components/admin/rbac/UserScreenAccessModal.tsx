import React, { useState, useEffect } from 'react';
import {
  X, Shield, CheckCircle2, Lock, Unlock, Search, Globe,
  ExternalLink, Sparkles, Loader2, Filter
} from 'lucide-react';
import rbacService, { ScreenItem } from '../../../services/rbac.service';

interface UserScreenAccessModalProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    community?: string;
  } | null;
  rolePermissionsMap?: Record<string, string[]>;
  onClose: () => void;
}

export const UserScreenAccessModal: React.FC<UserScreenAccessModalProps> = ({
  user,
  rolePermissionsMap = {},
  onClose,
}) => {
  const [screens, setScreens] = useState<ScreenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    const loadScreens = async () => {
      setLoading(true);
      try {
        const allScreens = await rbacService.getAllScreens();
        if (isMounted) setScreens(allScreens);
      } catch (err) {
        console.error('Failed to load screens:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadScreens();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const userPerms = rolePermissionsMap[user.role] || [];

  const getScreenCategory = (screen: ScreenItem): string => {
    if (screen.category) return screen.category.toUpperCase();
    const route = screen.route || '';
    if (route.startsWith('/super-admin')) return 'SUPER_ADMIN';
    if (route.startsWith('/admin')) return 'ADMIN';
    if (route.startsWith('/member') || route.startsWith('/portal')) return 'MEMBER';
    return 'PUBLIC';
  };

  const checkScreenAccess = (screen: ScreenItem): boolean => {
    if (isSuperAdmin) return true;
    if (screen.isPublic) return true;
    if (!screen.isActive) return false;

    const cat = getScreenCategory(screen);
    const reqPerms = screen.permissions?.map((p) => p.permission?.code || p.permission?.name) || [];
    if (reqPerms.length === 0) {
      if (cat === 'ADMIN' && user.role === 'ADMIN') return true;
      if (cat === 'MEMBER' && (user.role === 'MEMBER' || user.role === 'ADMIN')) return true;
      return false;
    }
    return reqPerms.every((code) => userPerms.includes(code));
  };

  const filteredScreens = screens.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      s.route.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'GRANTED') return checkScreenAccess(s);
    if (filterCategory === 'RESTRICTED') return !checkScreenAccess(s);
    return getScreenCategory(s) === filterCategory.toUpperCase();
  });

  const accessibleCount = screens.filter(checkScreenAccess).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center font-bold text-lg text-white shadow-lg">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display tracking-tight text-white">{user.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary-200 border border-primary/30">
                  {user.role}
                </span>
                {user.community && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-400" />
                    {user.community}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email} • Screen Privilege Inspector</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access Score:</span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <Unlock className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-black text-slate-900">{accessibleCount}</span>
              <span className="text-xs text-slate-400 font-medium">/ {screens.length} Screens Unlocked</span>
            </div>
            {isSuperAdmin && (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Full Root Access
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search screen, slug or route..."
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="GRANTED">✅ Granted Only</option>
              <option value="RESTRICTED">🔒 Restricted Only</option>
              <option value="PUBLIC">Public</option>
              <option value="MEMBER">Member Portal</option>
              <option value="ADMIN">Admin Panel</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        </div>

        {/* Screen Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-medium">Querying screen access matrix...</p>
            </div>
          ) : filteredScreens.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <p className="text-sm font-semibold text-slate-600">No matching screens found</p>
              <p className="text-xs">Try adjusting your search query or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredScreens.map((screen) => {
                const canAccess = checkScreenAccess(screen);

                return (
                  <div
                    key={screen.id || screen.slug}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      canAccess
                        ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs hover:border-emerald-300'
                        : 'bg-slate-50/70 border-slate-200/80 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-500">
                              {screen.category || 'General'}
                            </span>
                            {screen.isPublic && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                Public
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-1 truncate" title={screen.name}>
                            {screen.name}
                          </h4>
                          <p className="text-[11px] font-mono text-slate-500 truncate">{screen.route}</p>
                        </div>

                        <div className="flex-shrink-0">
                          {canAccess ? (
                            <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                              <Unlock className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-xl bg-slate-200/80 text-slate-500 flex items-center justify-center">
                              <Lock className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Required Permissions tags */}
                      {screen.permissions && screen.permissions.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                          {screen.permissions.map((sp) => {
                            const code = sp.permission?.code || sp.permission?.name;
                            const hasPerm = isSuperAdmin || userPerms.includes(code);

                            return (
                              <span
                                key={code}
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                  hasPerm
                                    ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {code}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/40 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-400 text-[10px]">{screen.slug}</span>
                      <span className={`font-bold ${canAccess ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {canAccess ? 'Access Granted' : 'Locked'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Screen access is evaluated using the Role $\to$ Permission $\to$ Screen mapping chain.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserScreenAccessModal;
