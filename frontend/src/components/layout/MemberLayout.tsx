import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { profilesApi } from '../../services/profiles.service';
import { MembershipBadge } from '../common/MembershipBadge';
import {
  LayoutDashboard, User, Search, Heart, Mail, MessageSquare,
  Crown, Settings, LogOut, Bell, Sparkles, ExternalLink,
  Star, BookOpen, CheckCircle2, AlertCircle, CreditCard,
  Shield, ChevronRight, Users, BarChart2, X
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
  requiredPermission?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const MEMBER_ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard': 'member:dashboard',
  '/profile': 'member:profile',
  '/profile/edit': 'member:profile',
  '/search': 'member:search',
  '/matches': 'member:search',
  '/interests': 'member:interests',
  '/messages': 'member:messages',
  '/premium': 'member:upgrade',
  '/payment-history': 'member:payments',
  '/profile-viewers': 'member:viewers',
  '/blog': 'blogs:read',
  '/success-stories': 'stories:read',
};

import { useSettingsStore } from '../../store/settings.store';

// ─── MemberSidebar ─────────────────────────────────────────────────────
const MemberSidebar = ({
  isOpen,
  unreadCount,
  onClose,
  myProfile,
}: {
  isOpen: boolean;
  unreadCount: number;
  onClose?: () => void;
  myProfile?: any;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isPremium, logout, hasPermission, isSuperAdmin } = useAuthStore();
  const logoUrl = useSettingsStore((s) => s.logoUrl);
  const [, setRefreshKey] = useState(0);

  const profileCompletion = myProfile?.profileCompletionPercent ?? (user as any)?.profileCompletionPercent ?? 0;
  const isProfileComplete = profileCompletion >= 100;

  const rawTier = (
    myProfile?.membershipTier ||
    myProfile?.membership?.tier ||
    user?.membershipTier ||
    user?.membershipStatus ||
    user?.entitlements?.tier ||
    'FREE'
  ).toUpperCase();
  const isPrem = isPremium() && rawTier !== 'FREE';
  const memberTier = isPrem ? rawTier : 'FREE';

  const resolvedFirstName = myProfile?.firstName || user?.firstName || '';
  const resolvedLastName = myProfile?.lastName || user?.lastName || '';
  const displayName = resolvedFirstName
    ? `${resolvedFirstName} ${resolvedLastName}`.trim()
    : user?.displayName || user?.email?.split('@')[0] || 'Member';

  const avatarPhoto =
    myProfile?.photos?.find((p: any) => p.isMain && p.status !== 'REJECTED')?.url ||
    myProfile?.photos?.[0]?.url;
  const initialChar = resolvedFirstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'M';

  useEffect(() => {
    const handlePermUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener('s2s_permissions_updated', handlePermUpdate);
    return () => window.removeEventListener('s2s_permissions_updated', handlePermUpdate);
  }, []);

  const navGroups: NavGroup[] = [
    {
      title: 'Main',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', locked: !isProfileComplete, requiredPermission: 'member:dashboard' },
        { icon: User, label: 'My Profile', href: '/profile', locked: !isProfileComplete, requiredPermission: 'member:profile' },
      ],
    },
    {
      title: 'Discover',
      items: [
        { icon: Search, label: 'Search Profiles', href: '/search', locked: !isProfileComplete, requiredPermission: 'member:search' },
        { icon: Star, label: 'Recommended Matches', href: '/matches', locked: !isProfileComplete, requiredPermission: 'member:search' },
      ],
    },
    {
      title: 'Connect',
      items: [
        { icon: Heart, label: 'Interests', href: '/interests', locked: !isProfileComplete, badge: unreadCount > 0 ? String(unreadCount) : undefined, badgeColor: 'bg-rose-500', requiredPermission: 'member:interests' },
        { icon: MessageSquare, label: 'Messages', href: '/messages', locked: !isProfileComplete, requiredPermission: 'member:messages' },
        { icon: Users, label: 'Who Viewed Me', href: '/profile-viewers', locked: !isProfileComplete, requiredPermission: 'member:viewers' },
      ],
    },
    {
      title: 'Membership',
      items: [
        { icon: Crown, label: 'Upgrade Plan', href: '/premium', badge: !isPrem ? 'Upgrade' : undefined, badgeColor: 'bg-gradient-to-r from-amber-400 to-yellow-500', requiredPermission: 'member:upgrade' },
        { icon: CreditCard, label: 'Payment History', href: '/payment-history', locked: !isProfileComplete, requiredPermission: 'member:payments' },
      ],
    },
    {
      title: 'Discover More',
      items: [
        { icon: BookOpen, label: 'Blogs', href: '/blog', requiredPermission: 'blogs:read' },
        { icon: Heart, label: 'Success Stories', href: '/success-stories', requiredPermission: 'stories:read' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: Settings, label: 'Edit Profile', href: '/profile/edit', requiredPermission: 'member:profile' },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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

  const displayNavGroups = visibleNavGroups;

  const isActive = (href: string) =>
    location.pathname === href || (location.pathname.startsWith(href) && href.length > 1 && href !== '/dashboard');

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50
        transition-transform duration-300 flex flex-col shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      {/* Logo + Mobile Close */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <Link to="/" onClick={onClose} className="flex items-center gap-3 min-w-0">
          <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony" className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl shadow-md flex-shrink-0" />
          <div className="truncate">
            <span className="font-display font-bold text-lg text-text-primary">S2S</span>
            <span className="text-primary font-bold text-lg"> Matrimony</span>
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

      {/* Member Profile Card */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100/80 rounded-2xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold flex items-center justify-center text-sm flex-shrink-0 shadow-md overflow-hidden">
              {avatarPhoto ? (
                <img src={avatarPhoto} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                initialChar
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary text-xs font-bold truncate">
                {displayName}
              </p>
              <div className="mt-0.5">
                <MembershipBadge tier={memberTier} size="xs" />
              </div>
            </div>
          </div>

          {/* Profile Completion Progress Bar */}
          {!isProfileComplete && (
            <Link to="/complete-profile" onClick={onClose} className="block mt-3">
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
        {displayNavGroups.map((group) => (
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
                    onClick={onClose}
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
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all"
          >
            <BarChart2 className="w-4 h-4 text-amber-600" />
            <span>Admin Panel</span>
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

// ─── MemberLayout ──────────────────────────────────────────────────────
const MemberLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const location = useLocation();
  const { user } = useAuthStore();

  const { data: myProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: profilesApi.getMyProfile,
    staleTime: 30000,
    retry: false,
  });

  const resolvedFirstName = myProfile?.firstName || user?.firstName || '';
  const resolvedLastName = myProfile?.lastName || user?.lastName || '';
  const displayName = resolvedFirstName
    ? `${resolvedFirstName} ${resolvedLastName}`.trim()
    : user?.displayName || user?.email?.split('@')[0] || 'Member';

  const avatarPhoto =
    myProfile?.photos?.find((p: any) => p.isMain && p.status !== 'REJECTED')?.url ||
    myProfile?.photos?.[0]?.url;
  const initialChar = resolvedFirstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'M';

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

    const completion = myProfile?.profileCompletionPercent ?? (user as any)?.profileCompletionPercent ?? 0;
    const hasBeenRedirected = sessionStorage.getItem('onboarding_auto_redirected');

    if (completion < 100 && !hasBeenRedirected && location.pathname !== '/complete-profile') {
      sessionStorage.setItem('onboarding_auto_redirected', 'true');
      navigate('/complete-profile', { replace: true });
    }
  }, [user, myProfile, location.pathname, navigate]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Refresh user permissions from DB on layout mount, route change, and window focus
  useEffect(() => {
    const refreshPermissions = () => {
      useAuthStore.getState().fetchMe().catch(() => null);
    };
    refreshPermissions();
    window.addEventListener('focus', refreshPermissions);
    return () => window.removeEventListener('focus', refreshPermissions);
  }, [location.pathname]);

  // Auto-mark notifications as read when opening Interests, Notifications, or Messages pages
  useEffect(() => {
    if (['/interests', '/notifications', '/messages', '/profile-viewers'].includes(location.pathname)) {
      handleMarkAllRead();
    }
  }, [location.pathname]);

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
      '/profile-viewers': 'Profile Visitors',
      '/settings': 'Privacy & Settings',
      '/blog': 'Blogs',
      '/success-stories': 'Success Stories',
    };
    return titleMap[location.pathname] || 'S2S Matrimony';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-text-primary w-full max-w-full">
      <MemberSidebar
        isOpen={sidebarOpen}
        unreadCount={unreadCount}
        onClose={() => setSidebarOpen(false)}
        myProfile={myProfile}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
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

          <h1 className="text-text-primary font-bold text-base truncate">{getPageTitle()}</h1>
          <div className="flex-1" />

          <div className="flex items-center gap-2 flex-shrink-0">
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
                <div className="absolute right-0 mt-2 w-[calc(100vw-32px)] max-w-sm sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50">
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
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              n.isRead ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-500 text-white'
                            }`}>
                              {n.isRead ? 'Read' : 'New'}
                            </span>
                          </div>
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
            <Link
              to="/profile"
              aria-label="My Profile"
              className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 text-white font-bold flex items-center justify-center text-xs shadow-md hover:scale-110 transition-transform flex-shrink-0 overflow-hidden"
            >
              {avatarPhoto ? (
                <img src={avatarPhoto} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                initialChar
              )}
            </Link>
          </div>
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

export default MemberLayout;
