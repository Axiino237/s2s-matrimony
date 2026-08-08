import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  LayoutDashboard, Users, UserCheck, Globe, Crown, CreditCard,
  FileText, Image as ImageIcon, AlertTriangle, Settings, LogOut,
  Bell, Sparkles, Shield, Heart, HelpCircle, FileQuestion,
  Star, ChevronDown, ChevronRight, BarChart2, MessageSquare,
  Megaphone, BookOpen, ScrollText
} from 'lucide-react';

interface NavItem {
  icon: any;
  label: string;
  href: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  icon: any;
  items: NavItem[];
  color?: string;
}

const AdminSidebar = ({ isOpen }: { isOpen: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    dashboard: true,
    users: true,
    membership: false,
    content: false,
    reports: false,
    system: false,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
      ],
    },
    {
      title: 'Users & Profiles',
      icon: Users,
      items: [
        { icon: Users, label: 'All Users', href: '/admin/users' },
        { icon: UserCheck, label: 'Profile Moderation', href: '/admin/profiles' },
        { icon: Globe, label: 'Communities', href: '/admin/communities' },
      ],
    },
    {
      title: 'Membership & Payments',
      icon: Crown,
      items: [
        { icon: Crown, label: 'Membership Plans', href: '/admin/plans' },
        { icon: CreditCard, label: 'Payments & Transactions', href: '/admin/payments' },
      ],
    },
    {
      title: 'Content Management',
      icon: FileText,
      items: [
        { icon: Heart, label: 'Success Stories', href: '/admin/success-stories' },
        { icon: BookOpen, label: 'Blogs & CMS', href: '/admin/blogs' },
        { icon: ImageIcon, label: 'Banners & Promotions', href: '/admin/banners' },
        { icon: HelpCircle, label: 'FAQ Management', href: '/admin/faq' },
        { icon: Star, label: 'Testimonials', href: '/admin/testimonials' },
        { icon: FileQuestion, label: 'Static Pages', href: '/admin/static-pages' },
      ],
    },
    {
      title: 'AI Engine & Tools',
      icon: Sparkles,
      items: [
        { icon: Sparkles, label: '✨ AI Biodata Parser', href: '/admin/ai-biodata' },
        { icon: FileText, label: 'Biodata Form Entry', href: '/admin/biodata-entry' },
        { icon: ScrollText, label: 'Biodata Records List', href: '/admin/biodata-list' },
      ],
    },
    {
      title: 'Reports & Analytics',
      icon: BarChart2,
      items: [
        { icon: AlertTriangle, label: 'User Reports', href: '/admin/reports' },
      ],
    },
    {
      title: 'System',
      icon: Settings,
      items: [
        { icon: FileText, label: 'Audit Logs', href: '/admin/logs' },
        { icon: Settings, label: 'Settings', href: '/admin/settings' },
      ],
    },
  ];

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
      <div className="p-5 border-b border-slate-100 flex-shrink-0">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/logo.png" alt="S2S Admin" className="w-12 h-12 object-contain rounded-xl shadow-md" />
          <div>
            <span className="font-display font-bold text-lg text-text-primary">S2S</span>
            <span className="text-primary font-bold text-lg"> Admin</span>
          </div>
        </Link>
      </div>

      {/* Admin Profile */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-800 text-xs font-semibold truncate">{user?.email || 'admin@s2s.com'}</p>
            <span className="inline-block text-[10px] mt-0.5 px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
              {user?.roles?.includes('SUPER_ADMIN') ? '⭐ Super Admin' :
                user?.roles?.includes('ADMIN') ? '🛡️ Admin' :
                  user?.roles?.includes('MODERATOR') ? 'Moderator' : 'Staff'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-3 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{group.title}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group
                      ${active
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-slate-100'
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="tracking-wide flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 flex-shrink-0 space-y-1">
        {user?.roles?.includes('SUPER_ADMIN') && (
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
        {/* Topbar */}
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
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold flex items-center justify-center text-xs shadow-md">
              A
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

export default AdminLayout;
