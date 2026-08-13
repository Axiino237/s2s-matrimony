import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  Globe, Shield, DollarSign, Settings, LayoutDashboard,
  Sparkles, FileText, LogOut, ExternalLink, X, Menu,
  Users, UserCheck, Crown, CreditCard, AlertTriangle, Heart,
  BarChart2, BookOpen, Image as ImageIcon, ChevronDown, ChevronRight,
  ScrollText, Sliders, HelpCircle
} from 'lucide-react';

interface NavItem { icon: any; label: string; href: string; requiredPermission?: string; }
interface NavGroup { key: string; title: string; icon: any; items: NavItem[]; }

import { useSettingsStore } from '../../store/settings.store';
import { useEffect } from 'react';

const SuperAdminSidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuthStore();
  const logoUrl = useSettingsStore((s) => s.logoUrl);

  const [, setPermTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setPermTick((t) => t + 1);
    window.addEventListener('s2s_permissions_updated', handleUpdate);
    return () => window.removeEventListener('s2s_permissions_updated', handleUpdate);
  }, []);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    executive: true, platform: true, membership: false, content: false,
    administration: false, system: false,
  });

  const toggleGroup = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const navGroups: NavGroup[] = [
    {
      key: 'executive',
      title: 'Executive',
      icon: LayoutDashboard,
      items: [
        { icon: LayoutDashboard, label: 'Super Dashboard', href: '/super-admin/dashboard', requiredPermission: 'dashboard:view' },
        { icon: DollarSign, label: 'Revenue Reports', href: '/super-admin/revenue', requiredPermission: 'revenue:view' },
      ],
    },
    {
      key: 'platform',
      title: 'Platform',
      icon: Globe,
      items: [
        { icon: Globe, label: 'Communities', href: '/super-admin/communities', requiredPermission: 'communities:read' },
        { icon: Users, label: 'All Members', href: '/super-admin/users', requiredPermission: 'users:read' },
        { icon: UserCheck, label: 'Profile Moderation', href: '/super-admin/profiles', requiredPermission: 'profiles:read' },
      ],
    },
    {
      key: 'membership',
      title: 'Membership & Payments',
      icon: Crown,
      items: [
        { icon: Crown, label: 'Membership Plans', href: '/super-admin/plans', requiredPermission: 'plans:read' },
        { icon: CreditCard, label: 'Payments', href: '/super-admin/payments', requiredPermission: 'payments:view' },
        { icon: DollarSign, label: 'Banners', href: '/super-admin/banners', requiredPermission: 'banners:read' },
      ],
    },
    {
      key: 'content',
      title: 'Content & AI',
      icon: BookOpen,
      items: [
        { icon: Heart, label: 'Success Stories', href: '/super-admin/success-stories', requiredPermission: 'stories:read' },
        { icon: BookOpen, label: 'Blogs & CMS', href: '/super-admin/blogs', requiredPermission: 'blogs:read' },
        { icon: Sparkles, label: 'AI Biodata Engine', href: '/super-admin/ai-biodata', requiredPermission: 'ai_biodata:read' },
        { icon: FileText, label: 'Biodata Form Entry', href: '/super-admin/biodata-entry', requiredPermission: 'biodata_entry:create' },
        { icon: ScrollText, label: 'Biodata Records List', href: '/super-admin/biodata-list', requiredPermission: 'biodata_records:read' },
      ],
    },
    {
      key: 'administration',
      title: 'Administration',
      icon: Shield,
      items: [
        { icon: Shield, label: 'Admins & Roles (UAM)', href: '/super-admin/admins', requiredPermission: 'admins:manage' },
        { icon: ScrollText, label: 'Audit Logs', href: '/super-admin/audit-logs', requiredPermission: 'audit:view' },
      ],
    },
    {
      key: 'system',
      title: 'System',
      icon: Settings,
      items: [
        { icon: Sliders, label: 'System Settings', href: '/super-admin/system-settings', requiredPermission: 'settings:read' },
        { icon: Settings, label: 'Settings', href: '/super-admin/settings', requiredPermission: 'general_settings:read' },
        { icon: FileText, label: 'Legacy Logs', href: '/super-admin/logs', requiredPermission: 'legacy_logs:view' },
      ],
    },
  ];

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
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
      {/* Logo */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <Link to="/super-admin/dashboard" className="flex items-center gap-3">
          <img src={logoUrl || "/images/logo.png"} alt="S2S" className="w-10 h-10 object-contain rounded-xl shadow-md" />
          <div>
            <span className="font-display font-bold text-lg text-slate-900">S2S</span>
            <span className="text-primary font-bold text-lg"> Super Admin</span>
          </div>
        </Link>
        <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Super Admin Profile Card */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-md">
            {user?.email?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-800 text-xs font-semibold truncate">{user?.email || 'superadmin@s2s.com'}</p>
            <span className="inline-block text-[10px] mt-0.5 px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
              ⭐ Super Admin
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-3 overflow-y-auto">
        {visibleNavGroups.map((group) => (
          <div key={group.key}>
            <p className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{group.title}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group
                      ${active
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-slate-100'
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="tracking-wide flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 flex-shrink-0 space-y-1">
        <Link
          to="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View Public Site</span>
        </Link>
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

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const titleMap: Record<string, string> = {
      '/super-admin/dashboard': 'Executive Dashboard',
      '/super-admin/revenue': 'Revenue Reports',
      '/super-admin/admins': 'Admins & Roles (UAM)',
      '/super-admin/communities': 'Communities',
      '/super-admin/users': 'All Members',
      '/super-admin/profiles': 'Profile Moderation',
      '/super-admin/plans': 'Membership Plans',
      '/super-admin/payments': 'Payments',
      '/super-admin/banners': 'Banners & Promotions',
      '/super-admin/blogs': 'Blogs & CMS',
      '/super-admin/success-stories': 'Success Stories',
      '/super-admin/ai-biodata': 'AI Biodata Engine',
      '/super-admin/audit-logs': 'Audit Logs',

      '/super-admin/system-settings': 'System Settings',
      '/super-admin/settings': 'Settings',
      '/super-admin/logs': 'System Logs',
    };
    return titleMap[location.pathname] || 'Super Admin';
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      <SuperAdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-slate-200 h-16 flex items-center px-4 md:px-6 gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-slate-900 font-bold text-base">{getPageTitle()}</h1>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold flex items-center justify-center text-xs shadow-md">
              SA
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
