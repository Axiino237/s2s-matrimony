import React, { useState, useMemo } from 'react';
import {
  Shield, CheckCircle2, Lock, Unlock, Search, Sparkles,
  Layers, ChevronRight, Check, X, Filter, SlidersHorizontal,
  ExternalLink, Info
} from 'lucide-react';
import { ScreenItem } from '../../../services/rbac.service';

interface ScreenMatrixViewProps {
  screens: ScreenItem[];
  selectedRole: string;
  rolePermissions: string[];
  onTogglePermission: (permKey: string) => void;
  onGrantScreen: (screen: ScreenItem) => void;
  onRevokeScreen: (screen: ScreenItem) => void;
  onGrantCategory: (category: string) => void;
  onRevokeCategory: (category: string) => void;
}

export const ScreenMatrixView: React.FC<ScreenMatrixViewProps> = ({
  screens,
  selectedRole,
  rolePermissions,
  onGrantScreen,
  onRevokeScreen,
  onGrantCategory,
  onRevokeCategory,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const isSuperAdmin = selectedRole === 'SUPER_ADMIN';

  const getScreenCategory = (screen: ScreenItem): string => {
    if (screen.category) return screen.category.toUpperCase();
    const route = screen.route || '';
    if (route.startsWith('/super-admin')) return 'SUPER_ADMIN';
    if (route.startsWith('/admin')) return 'ADMIN';
    if (route.startsWith('/member') || route.startsWith('/portal')) return 'MEMBER';
    return 'PUBLIC';
  };

  // Check if a screen is granted for this role
  const isScreenGranted = (screen: ScreenItem): boolean => {
    if (isSuperAdmin) return true;
    if (screen.isPublic) return true;
    const cat = getScreenCategory(screen);
    const reqPerms = screen.permissions?.map((p) => p.permission?.code || p.permission?.name) || [];
    if (reqPerms.length === 0) {
      if (cat === 'ADMIN' && selectedRole === 'ADMIN') return true;
      if (cat === 'MEMBER' && (selectedRole === 'MEMBER' || selectedRole === 'ADMIN')) return true;
      return false;
    }
    return reqPerms.every((code) => rolePermissions.includes(code));
  };

  // Group categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    screens.forEach((s) => {
      set.add(getScreenCategory(s));
    });
    return Array.from(set);
  }, [screens]);

  const filteredScreens = useMemo(() => {
    return screens.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.toLowerCase().includes(search.toLowerCase()) ||
        s.route.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedCategory === 'ALL') return true;
      return getScreenCategory(s) === selectedCategory.toUpperCase();
    });
  }, [screens, search, selectedCategory]);

  const grantedCount = useMemo(() => {
    return screens.filter(isScreenGranted).length;
  }, [screens, rolePermissions, selectedRole]);

  // Group filtered screens by module or category
  const groupedScreens = useMemo(() => {
    const map: Record<string, ScreenItem[]> = {};
    filteredScreens.forEach((s) => {
      const cat = getScreenCategory(s);
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });
    return map;
  }, [filteredScreens]);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Visual Screen Access Matrix for Role: <span className="text-primary">{selectedRole}</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Click any screen card to toggle access. Toggling a screen automatically manages its underlying action permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-indigo-200 shadow-2xs flex items-center gap-2">
            <Unlock className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-500">Unlocked Screens:</span>
            <span className="text-sm font-black text-primary">{grantedCount}</span>
            <span className="text-xs text-slate-400">/ {screens.length}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Screens ({screens.length})
          </button>
          {categories.map((cat) => {
            const count = screens.filter((s) => s.category === cat).length;
            const isSelected = selectedCategory.toUpperCase() === cat.toUpperCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, route, or slug..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Screen Categories Grid */}
      <div className="space-y-6">
        {Object.entries(groupedScreens).map(([category, catScreens]) => {
          const catGranted = catScreens.filter(isScreenGranted).length;
          const allCatGranted = catScreens.length > 0 && catGranted === catScreens.length;

          return (
            <div key={category} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{category}</h4>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {catGranted} of {catScreens.length} Accessible
                  </span>
                </div>

                {!isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onGrantCategory(category)}
                      disabled={allCatGranted}
                      className="text-xs font-bold text-primary hover:text-primary-focus hover:underline disabled:opacity-40"
                    >
                      Grant All in {category}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => onRevokeCategory(category)}
                      disabled={catGranted === 0}
                      className="text-xs font-bold text-slate-500 hover:text-rose-600 hover:underline disabled:opacity-40"
                    >
                      Revoke All
                    </button>
                  </div>
                )}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {catScreens.map((screen) => {
                  const granted = isScreenGranted(screen);

                  return (
                    <div
                      key={screen.id || screen.slug}
                      onClick={() => {
                        if (isSuperAdmin) return;
                        if (granted) {
                          onRevokeScreen(screen);
                        } else {
                          onGrantScreen(screen);
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between group ${
                        granted
                          ? 'bg-emerald-50/50 border-emerald-300/80 shadow-2xs hover:border-emerald-400 hover:bg-emerald-50'
                          : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-white border border-slate-200">
                                {screen.slug}
                              </span>
                              {screen.isPublic && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  Public
                                </span>
                              )}
                            </div>
                            <h5 className="text-sm font-bold text-slate-900 mt-1.5 truncate group-hover:text-primary transition-colors">
                              {screen.name}
                            </h5>
                            <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                              {screen.route}
                            </p>
                          </div>

                          {/* Toggle Visual */}
                          <div className="flex-shrink-0 mt-0.5">
                            <div
                              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                                granted ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                              }`}
                            >
                              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                            </div>
                          </div>
                        </div>

                        {/* Required Permissions tags */}
                        {screen.permissions && screen.permissions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-1">
                            {screen.permissions.map((sp) => {
                              const code = sp.permission?.code || sp.permission?.name;
                              const hasPerm = isSuperAdmin || rolePermissions.includes(code);

                              return (
                                <span
                                  key={code}
                                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                    hasPerm
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold'
                                      : 'bg-slate-100 text-slate-500 border-slate-200'
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
                        <span className="text-slate-400 text-[10px] font-medium">
                          {screen.module?.name || 'General Module'}
                        </span>
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            granted ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {granted ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Granted
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-slate-400" /> Locked
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScreenMatrixView;
