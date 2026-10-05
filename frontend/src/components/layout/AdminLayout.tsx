import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  LayoutDashboard, Users, UserCheck, Globe, Crown, CreditCard,
  FileText, Image as ImageIcon, AlertTriangle, Settings, LogOut,
  Sparkles, Heart, HelpCircle, FileQuestion,
  Star, ChevronRight, BarChart2, BookOpen, ScrollText, X
} from 'lucide-react';

import { useSettingsStore } from '../../store/settings.store';

export interface NavItem {
  icon: any;
  label: string;
  href: string;
  badge?: string;
  requiredPermission?: string;
}

export interface NavGroup {
  title: string;
  icon: any;
  items: NavItem[];
  color?: string;
}

export const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin/dashboard': 'dashboard:view',
  '/admin/users': 'users:read',
  '/admin/profiles': 'profiles:read',
  '/admin/communities': 'communities:read',
  '/admin/plans': 'plans:read',
  '/admin/payments': 'payments:view',
  '/admin/success-stories': 'stories:read',
  '/admin/blogs': 'blogs:read',
  '/admin/faq': 'faq:read',
  '/admin/testimonials': 'testimonials:read',
  '/admin/static-pages': 'static_pages:read',
  '/admin/ai-biodata': 'ai_biodata:read',
  '/admin/biodata-entry': 'biodata_entry:create',
  '/admin/biodata-list': 'biodata_records:read',
  '/admin/reports': 'reports:view',
  '/admin/logs': 'audit:view',
  '/admin/settings': 'settings:read',
};

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', requiredPermission: 'dashboard:view' },
    ],
  },
  {
    title: 'Users & Profiles',
    icon: Users,
    items: [
      { icon: Users, label: 'All Users', href: '/admin/users', requiredPermission: 'users:read' },
      { icon: UserCheck, label: 'Profile Moderation', href: '/admin/profiles', requiredPermission: 'profiles:read' },
      { icon: Globe, label: 'Communities', href: '/admin/communities', requiredPermission: 'communities:read' },
    ],
  },
  {
    title: 'Membership & Payments',
    icon: Crown,
    items: [
      { icon: Crown, label: 'Membership Plans', href: '/admin/plans', requiredPermission: 'plans:read' },
      { icon: CreditCard, label: 'Payments & Transactions', href: '/admin/payments', requiredPermission: 'payments:view' },
    ],
  },
  {
    title: 'Content Management',
    icon: FileText,
    items: [
      { icon: Heart, label: 'Success Stories', href: '/admin/success-stories', requiredPermission: 'stories:read' },
      { icon: BookOpen, label: 'Blogs & CMS', href: '/admin/blogs', requiredPermission: 'blogs:read' },
      { icon: HelpCircle, label: 'FAQ Management', href: '/admin/faq', requiredPermission: 'faq:read' },
      { icon: Star, label: 'Testimonials', href: '/admin/testimonials', requiredPermission: 'testimonials:read' },
      { icon: FileQuestion, label: 'Static Pages', href: '/admin/static-pages', requiredPermission: 'static_pages:read' },
    ],
  },
  {
    title: 'AI Engine & Tools',
    icon: Sparkles,
    items: [
      { icon: Sparkles, label: '✨ AI Biodata Parser', href: '/admin/ai-biodata', requiredPermission: 'ai_biodata:read' },
      { icon: FileText, label: 'Biodata Form Entry', href: '/admin/biodata-entry', requiredPermission: 'biodata_entry:create' },
      { icon: ScrollText, label: 'Biodata Records List', href: '/admin/biodata-list', requiredPermission: 'biodata_records:read' },
    ],
  },
  {
    title: 'Reports & Analytics',
    icon: BarChart2,
    items: [
      { icon: AlertTriangle, label: 'User Reports', href: '/admin/reports', requiredPermission: 'reports:view' },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    items: [
      { icon: FileText, label: 'Audit Logs', href: '/admin/logs', requiredPermission: 'audit:view' },
      { icon: Settings, label: 'Settings', href: '/admin/settings', requiredPermission: 'settings:read' },
    ],
  },
];

/**
 * Resolves the authorized landing admin route dynamically based on permissions:
 * 1. If the user has permission for the Dashboard ('dashboard:view') or is Super Admin, return '/admin/dashboard'.
 * 2. If they do not have Dashboard permission, automatically find an existing admin route that the user IS authorized to access and redirect them there.
 * 3. Return null if no admin route is authorized at all.
 */
export const getAuthorizedAdminRoute = (
  hasPermissionFn: (perm: string) => boolean,
  isSuperAdmin = false,
): string | null => {
  if (isSuperAdmin || hasPermissionFn('dashboard:view')) {
    return '/admin/dashboard';
  }

  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (!item.requiredPermission || hasPermissionFn(item.requiredPermission)) {
        return item.href;
      }
    }
  }

  return null;
};

export const AdminLandingRedirect = () => {
  const { hasPermission, isSuperAdmin } = useAuthStore();
  const target = getAuthorizedAdminRoute(hasPermission, isSuperAdmin());
  if (target) {
    return <Navigate to={target} replace />;
  }
  return <Navigate to="/unauthorized" replace />;
};

const AdminSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission, isSuperAdmin } = useAuthStore();
  const logoUrl = useSettingsStore((s) => s.logoUrl);
  const [, setRefreshKey] = useState(0);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    dashboard: true,
    users: true,
    membership: false,
    content: false,
    reports: false,
    system: false,
  });

  useEffect(() => {
    const handlePermUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener('s2s_permissions_updated', handlePermUpdate);
    return () => window.removeEventListener('s2s_permissions_updated', handlePermUpdate);
  }, []);

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleNavGroups = ADMIN_NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (isSuperAdmin()) return true;
        if (!item.requiredPermission) return true;
        return hasPermission(item.requiredPermission);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (href: string) => {
    const currentUrl = location.pathname + location.search;

    if (href.includes('?')) {
      return currentUrl === href || currentUrl.startsWith(href + '&');
    }

    if (location.pathname === href) {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.has('tab')) {
        return false;
      }
      return true;
    }

    return location.pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50
      transition-transform duration-300 flex flex-col shadow-xl
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <Link to="/" onClick={onClose} className="flex items-center gap-3 min-w-0">
          <img src={logoUrl || "/images/logo.png"} alt="S2S Admin" className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl shadow-md flex-shrink-0" />
          <div className="truncate">
            <span className="font-display font-bold text-lg text-text-primary">S2S</span>
            <span className="text-primary font-bold text-lg"> Admin</span>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-800 text-xs font-semibold truncate">{user?.email || 'admin@s2smatrimony.com'}</p>
            <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold mt-0.5">
              {user?.role || 'ADMIN'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {visibleNavGroups.map((group, idx) => {
          const groupKey = `group_${idx}`;
          const isGroupOpen = openGroups[groupKey] ?? true;

          return (
            <div key={group.title} className="space-y-1">
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
              >
                <span>{group.title}</span>
              </button>

              {isGroupOpen && (
                <div className="space-y-0.5 pt-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          active
                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-100 flex-shrink-0 space-y-1">
        {isSuperAdmin() && (
          <Link
            to="/super-admin/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Super Admin Panel</span>
            <ChevronRight className="w-3 h-3 ml-auto" />
          </Link>
        )}
        <button
          onClick={() => {
            onClose?.();
            handleLogout();
          }}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-all text-left"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { hasPermission, isSuperAdmin, isAdmin } = useAuthStore();

  const currentReqPerm = ROUTE_PERMISSIONS[location.pathname];

  useEffect(() => {
    const refreshPermissions = () => {
      useAuthStore.getState().fetchMe().catch(() => null);
    };
    refreshPermissions();
    window.addEventListener('focus', refreshPermissions);
    return () => window.removeEventListener('focus', refreshPermissions);
  }, [location.pathname]);

  if (currentReqPerm && !isSuperAdmin() && !hasPermission(currentReqPerm)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const getPageTitle = () => {
    const titleMap: Record<string, string> = {
      '/admin/dashboard': 'Admin Dashboard',
      '/admin/users': 'User Management',
      '/admin/profiles': 'Profile Moderation',
      '/admin/communities': 'Communities',
      '/admin/plans': 'Membership Plans',
      '/admin/payments': 'Payments & Transactions',
      '/admin/blogs': 'Blogs & CMS',
      '/admin/success-stories': 'Success Stories',
      '/admin/reports': 'Reports & Analytics',
      '/admin/ai-biodata': 'AI Biodata Engine',
      '/admin/logs': 'Audit Logs',
      '/admin/settings': 'Admin Settings',
      '/admin/faq': 'FAQ Management',
      '/admin/testimonials': 'Testimonials',
      '/admin/static-pages': 'Static Pages',
    };
    return titleMap[location.pathname] || 'Admin Panel';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 w-full max-w-full">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 max-w-full w-full">
        {/* Fixed Topbar */}
        <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 h-16 flex items-center px-4 md:px-6 gap-4 shadow-sm w-full max-w-full">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-slate-900 font-bold text-base truncate">{getPageTitle()}</h1>
        </header>

        {/* Header spacer to prevent page content from hiding under fixed header */}
        <div className="h-16 flex-shrink-0" aria-hidden="true" />

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 min-w-0 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
