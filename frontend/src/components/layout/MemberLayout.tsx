import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import {
  LayoutDashboard, User, Search, Heart, Mail, MessageSquare,
  Crown, Settings, LogOut, Bell, Sparkles, ExternalLink,
  Star, BookOpen, CheckCircle2, AlertCircle, CreditCard,
  Phone, Shield, ChevronRight, FileText, Users, BarChart2
} from 'lucide-react';
import api from '../../services/api';

// ─── Nav Group Type ────────────────────────────────────────────────────
interface NavItem {
  icon: any;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
  locked?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// ─── MemberSidebar ─────────────────────────────────────────────────────
const MemberSidebar = ({ isOpen, unreadCount }: { isOpen: boolean; unreadCount: number }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isPremium, logout } = useAuthStore();

  const profileCompletion = (user as any)?.profileCompletionPercent ?? 0;
  const isProfileComplete = profileCompletion >= 100;
  const memberTier = user?.membershipStatus || 'FREE';
  const isPrem = isPremium();

  const tierColors: Record<string, string> = {
    FREE: 'bg-slate-200 text-slate-600',
    SILVER: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
    GOLD: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
    ELITE: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white',
    PLATINUM: 'bg-gradient-to-r from-cyan-400 to-teal-500 text-white',
    DIAMOND: 'bg-gradient-to-r from-blue-400 to-indigo-600 text-white',
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Main',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', locked: !isProfileComplete },
        { icon: User, label: 'My Profile', href: '/profile', locked: !isProfileComplete },
      ],
    },
    {
      title: 'Discover',
      items: [
        { icon: Search, label: 'Search Profiles', href: '/search', locked: !isProfileComplete },
        { icon: Star, label: 'Recommended Matches', href: '/matches', locked: !isProfileComplete },
      ],
    },
    {
      title: 'Connect',
      items: [
        { icon: Heart, label: 'Interests', href: '/interests', locked: !isProfileComplete, badge: unreadCount > 0 ? String(unreadCount) : undefined, badgeColor: 'bg-rose-500' },
        { icon: MessageSquare, label: 'Messages', href: '/messages', locked: !isProfileComplete },
      ],
    },
    {
      title: 'Membership',
      items: [
        { icon: Crown, label: 'Upgrade Plan', href: '/premium', badge: !isPrem ? 'Upgrade' : undefined, badgeColor: 'bg-gradient-to-r from-amber-400 to-yellow-500' },
        { icon: CreditCard, label: 'Payment History', href: '/payment-history', locked: !isProfileComplete },
        { icon: Phone, label: 'Contact View History', href: '/contact-history', locked: !isProfileComplete },
      ],
    },
    {
      title: 'Discover More',
      items: [
        { icon: BookOpen, label: 'Blogs', href: '/blog' },
        { icon: Heart, label: 'Success Stories', href: '/success-stories' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: Settings, label: 'Edit Profile', href: '/profile/edit' },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isStaffAdmin = user?.roles?.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r)) || (user as any)?.role === 'SUPER_ADMIN' || (user as any)?.role === 'ADMIN';

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!isStaffAdmin) {
          if (
            item.href === '/payment-history' ||
            item.href === '/contact-history' ||
            item.href === '/blog' ||
            item.href === '/success-stories'
          ) {
            return false;
          }
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const isActive = (href: string) =>
    location.pathname === href || (location.pathname.startsWith(href) && href.length > 1 && href !== '/dashboard');

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-40
        transition-transform duration-300 flex flex-col shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      {/* Logo */}
      <div className="p-5 border-b border-slate-100 flex-shrink-0">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/logo.png" alt="S2S Matrimony" className="w-12 h-12 object-contain rounded-xl shadow-md" />
          <div>
            <span className="font-display font-bold text-lg text-text-primary">S2S</span>
            <span className="text-primary font-bold text-lg"> Matrimony</span>
          </div>
        </Link>
      </div>

      {/* Member Profile Card */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100/80 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-md">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-xs font-bold truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'Member'}
              </p>
              <span className={`inline-block text-[10px] mt-0.5 px-2 py-0.5 rounded-full font-semibold ${tierColors[memberTier] || tierColors.FREE}`}>
                {isPrem ? `★ ${memberTier}` : 'Free Member'}
              </span>
            </div>
          </div>

          {/* Profile Completion Progress Bar */}
          {!isProfileComplete && (
            <Link to="/complete-profile" className="block mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-primary">Profile Completion</span>
                <span className="text-[10px] font-bold text-primary">{profileCompletion}%</span>
              </div>
              <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-light to-primary rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Complete to unlock all features
              </p>
            </Link>
          )}

          {isProfileComplete && (
            <div className="mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span className="text-[10px] text-green-600 font-medium">Profile Complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-3 overflow-y-auto">
        {visibleNavGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{group.title}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.locked ? '/complete-profile' : item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group
                      ${active
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                        : item.locked
                          ? 'text-slate-400 hover:bg-slate-50 cursor-not-allowed'
                          : 'text-text-secondary hover:text-text-primary hover:bg-slate-100'
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="tracking-wide flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full flex-shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.locked && !active && (
                      <Shield className="w-3 h-3 text-slate-300 flex-shrink-0" />
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
        {/* Admin panel shortcut */}
        {user?.roles?.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r)) && (
          <Link
            to={user.roles.includes('SUPER_ADMIN') ? '/super-admin/dashboard' : '/admin/dashboard'}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all"
          >
            <BarChart2 className="w-4 h-4 text-amber-600" />
            <span>Admin Panel</span>
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

// ─── MemberLayout ──────────────────────────────────────────────────────
const MemberLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const location = useLocation();
  const { user } = useAuthStore();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const data = res.data?.notifications || res.data || [];
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {}
  };

  const navigate = useNavigate();

  // First-time MEMBER onboarding auto-redirect (ONLY for MEMBER role, NOT for Admins)
  useEffect(() => {
    if (!user) return;

    const isMember =
      user.roles?.includes('MEMBER') ||
      (user as any).role === 'MEMBER' ||
      (!user.roles?.includes('ADMIN') && !user.roles?.includes('SUPER_ADMIN'));

    if (!isMember) return;

    const completion = (user as any)?.profileCompletionPercent ?? 0;
    const hasBeenRedirected = sessionStorage.getItem('onboarding_auto_redirected');

    if (completion < 100 && !hasBeenRedirected && location.pathname !== '/complete-profile') {
      sessionStorage.setItem('onboarding_auto_redirected', 'true');
      navigate('/complete-profile', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const getPageTitle = () => {
    const titleMap: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/profile': 'My Profile',
      '/profile/edit': 'Edit Profile',
      '/complete-profile': 'Complete Profile',
      '/search': 'Search Profiles',
      '/matches': 'Recommended Matches',
      '/interests': 'Interests',
      '/messages': 'Messages',
      '/notifications': 'Notifications',
      '/premium': 'Membership Plans',
      '/payment-history': 'Payment History',
      '/contact-history': 'Contact View History',
      '/profile-viewers': 'Profile Visitors',
      '/settings': 'Privacy & Settings',
      '/blog': 'Blogs',
      '/success-stories': 'Success Stories',
    };
    return titleMap[location.pathname] || 'S2S Matrimony';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-text-primary">
      <MemberSidebar isOpen={sidebarOpen} unreadCount={unreadCount} />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-slate-200 h-16 flex items-center px-4 md:px-6 gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-text-primary font-bold text-base">{getPageTitle()}</h1>
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* View Public Site */}
            <Link
              to="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            >
              Public Site <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (unreadCount > 0) handleMarkAllRead();
                }}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold bg-primary text-white rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" /> Notifications
                    </h3>
                    <button onClick={handleMarkAllRead} className="text-[11px] font-semibold text-primary hover:underline">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                    {notifications.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-400">No notifications yet</p>
                    ) : (
                      notifications.map((n: any) => (
                        <button
                          key={n.id}
                          onClick={() => setShowNotifications(false)}
                          className={`w-full text-left block p-3 rounded-xl transition-colors border
                            ${n.isRead ? 'bg-white border-slate-100' : 'bg-rose-50 border-rose-100'}`}
                        >
                          <p className="text-xs font-bold text-slate-800">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block text-center text-xs font-semibold text-primary hover:underline"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <Link to="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 text-white font-bold flex items-center justify-center text-xs shadow-md hover:scale-110 transition-transform flex-shrink-0">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;
