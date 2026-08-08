import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  LayoutDashboard, Users, UserCheck, Globe, Crown, CreditCard,
  FileText, Image as ImageIcon, AlertTriangle, Settings, LogOut,
  Sparkles, Heart, HelpCircle, FileQuestion,
  Star, ChevronRight, BarChart2, BookOpen, ScrollText
} from 'lucide-react';

interface NavItem {
  icon: any;
  label: string;
  href: string;
  badge?: string;
  requiredPermission?: string;
}

interface NavGroup {
  title: string;
  icon: any;
  items: NavItem[];
  color?: string;
}

const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin/dashboard': 'dashboard:view',
  '/admin/users': 'users:read',
  '/admin/profiles': 'profiles:read',
  '/admin/communities': 'communities:read',
  '/admin/plans': 'plans:read',
  '/admin/payments': 'payments:view',
  '/admin/success-stories': 'stories:read',
  '/admin/blogs': 'blogs:read',
  '/admin/banners': 'banners:read',
  '/admin/faq': 'settings:read',
  '/admin/testimonials': 'stories:read',
  '/admin/static-pages': 'settings:read',
  '/admin/ai-biodata': 'ai_biodata:read',
  '/admin/biodata-entry': 'ai_biodata:read',
  '/admin/biodata-list': 'ai_biodata:read',
  '/admin/reports': 'reports:view',
  '/admin/logs': 'audit:view',
  '/admin/settings': 'settings:read',
};

const AdminSidebar = ({ isOpen }: { isOpen: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission, isSuperAdmin } = useAuthStore();
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

  const navGroups: NavGroup[] = [
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
        { icon: ImageIcon, label: 'Banners & Promotions', href: '/admin/banners', requiredPermission: 'banners:read' },
        { icon: HelpCircle, label: 'FAQ Management', href: '/admin/faq', requiredPermission: 'settings:read' },
        { icon: Star, label: 'Testimonials', href: '/admin/testimonials', requiredPermission: 'stories:read' },
        { icon: FileQuestion, label: 'Static Pages', href: '/admin/static-pages', requiredPermission: 'settings:read' },
      ],
    },
    {
      title: 'AI Engine & Tools',
      icon: Sparkles,
      items: [
        { icon: Sparkles, label: '✨ AI Biodata Parser', href: '/admin/ai-biodata', requiredPermission: 'ai_biodata:read' },
        { icon: FileText, label: 'Biodata Form Entry', href: '/admin/biodata-entry', requiredPermission: 'ai_biodata:read' },
        { icon: ScrollText, label: 'Biodata Records List', href: '/admin/biodata-list', requiredPermission: 'ai_biodata:read' },
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

  const visibleNavGroups = navGroups
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
    <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-40
      transition-transform duration-300 flex flex-col shadow-xl
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      <div className="p-5 border-b border-slate-100 flex-shrink-0">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/logo.png" alt="S2S Admin" className="w-12 h-12 object-contain rounded-xl shadow-md" />
          <div>
            <span className="font-display font-bold text-lg text-text-primary">S2S</span>
            <span className="text-primary font-bold text-lg"> Admin</span>
          </div>
        </Link>
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
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Super Admin Panel</span>
            <ChevronRight className="w-3 h-3 ml-auto" />
          </Link>
        )}
        <button
          onClick={handleLogout}
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
  const { hasPermission, isSuperAdmin } = useAuthStore();

  const currentReqPerm = ROUTE_PERMISSIONS[location.pathname];
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
      '/admin/banners': 'Banners & Promotions',
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
    <div className="min-h-screen flex bg-slate-50">
      <AdminSidebar isOpen={sidebarOpen} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-slate-200 h-16 flex items-center px-4 md:px-6 gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-slate-900 font-bold text-base">{getPageTitle()}</h1>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
