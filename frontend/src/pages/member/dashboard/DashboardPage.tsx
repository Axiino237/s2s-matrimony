import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/auth.store';
import { dashboardService } from '../../../services/dashboard.service';
import { profilesApi } from '../../../services/profiles.service';
import { 
  Eye, Heart, Sparkles, MessageSquare, ArrowUpRight, ShieldCheck, 
  CheckCircle2, Crown, Edit3, Activity, Star 
} from 'lucide-react';

const DashboardPage = () => {
  const { user, isPremium } = useAuthStore();
  const navigate = useNavigate();

  // Fetch real profile data from backend database
  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: profilesApi.getMyProfile,
    retry: 1,
  });

  // Force Mandatory Profile Completion Guard
  useEffect(() => {
    if (profile && !user?.roles?.includes('ADMIN') && !user?.roles?.includes('SUPER_ADMIN')) {
      const isFilled = Boolean(profile.about && profile.heightCm && profile.maritalStatus);
      if (!isFilled) {
        toast.error('⚠️ Mandatory: Please fill your 50 profile details first before accessing the dashboard!', { id: 'profile-mandatory' });
        navigate('/profile/edit', { state: { isOnboarding: true }, replace: true });
      }
    }
  }, [profile, user, navigate]);

  // Fetch real dashboard stats
  const { data: dashStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    retry: 1,
  });

  // Fetch recommended profiles
  const { data: searchResult } = useQuery({
    queryKey: ['recommended-profiles', user?.id],
    queryFn: () => dashboardService.getRecommended(8, user?.id),
    retry: 1,
  });

  const completionPct = profile?.profileCompletionPercent 
    ?? dashStats?.profileCompletionPercent 
    ?? dashStats?.profileCompletion 
    ?? 0;

  const stats = [
    { icon: Eye, label: 'Profile Views', val: dashStats?.profileViews ?? 0, change: 'Total views received', color: 'bg-primary/10 text-primary border border-primary/20' },
    { icon: Heart, label: 'Interests Received', val: dashStats?.interestsReceived ?? 0, change: `${dashStats?.interestsAccepted ?? 0} accepted`, color: 'bg-rose-50 text-rose-600 border border-rose-100 bg-rose-50/50' },
    { icon: Sparkles, label: 'Interests Sent', val: dashStats?.interestsSent ?? 0, change: 'Profiles contacted', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
    { icon: MessageSquare, label: 'Profile Completion', val: `${completionPct}%`, change: completionPct >= 80 ? 'High compatibility ✓' : 'Pending details', color: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
  ];

  const rawRecommended = searchResult?.profiles || searchResult?.data || (Array.isArray(searchResult) ? searchResult : []);
  const recommendedMatches = rawRecommended
    .filter((m: any) => m.userId !== user?.id && m.id !== user?.id && m.id !== profile?.id)
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 card bg-gradient-to-r from-white via-primary/5 to-white border-primary/20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
            {profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'M'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-text-primary">
                Welcome back, {profile?.firstName || user?.email?.split('@')[0] || 'Member'}!
              </h1>
              {isPremium() ? (
                <span className="badge badge-premium text-xs">★ Premium</span>
              ) : (
                <span className="badge bg-slate-100 text-text-secondary border-slate-200 text-xs">Free Plan</span>
              )}
            </div>
            <p className="text-text-secondary text-sm mt-0.5">Here is your live database matrimony overview & partner activity</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/profile/edit" className="btn btn-secondary btn-sm flex items-center gap-1.5 border-slate-200 bg-white">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </Link>
          {!isPremium() && (
            <Link to="/premium" className="btn btn-gold btn-sm flex items-center gap-1.5 font-bold shadow-md">
              <Crown className="w-4 h-4" /> Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const IconComponent = s.icon;
          const isProfileViews = s.label === 'Profile Views';
          const CardWrapper = isProfileViews ? Link : 'div';
          const extraProps = isProfileViews ? { to: '/profile-viewers' } : {};
          return (
            <CardWrapper
              key={i}
              {...(extraProps as any)}
              className={`card p-5 flex items-center gap-4 hover:border-primary/20 transition-all bg-white ${
                isProfileViews ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-2xl font-bold font-display">{s.val}</p>
                <p className="text-text-muted text-xs truncate mt-0.5">{s.label}</p>
                <span className={`text-[10px] font-semibold mt-1 block ${
                  isProfileViews ? 'text-primary underline' : 'text-success'
                }`}>
                  {isProfileViews ? 'Click to see who viewed →' : s.change}
                </span>
              </div>
            </CardWrapper>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Recommended Matches */}
        <div className="lg:col-span-2 card p-6 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-text-primary font-bold text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" /> Recommended Matches For You
            </h2>
            <Link to="/search" className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
              View All Matches <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendedMatches.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-text-muted text-sm">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No recommendations yet — complete your profile to get matches!
              </div>
            ) : recommendedMatches.map((m: any) => {
              const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.displayName || '—';
              const avatar = m.photos?.[0]?.url ?? null;
              const city = m.city?.name ?? m.cityId ?? '—';
              const community = m.community?.name ?? '—';
              const occupation = m.occupation?.designation ?? m.occupation?.company ?? '—';
              return (
              <div key={m.id} className="card p-4 hover:border-primary/45 hover:-translate-y-1 transition-all duration-300 group cursor-pointer bg-slate-50/50">
                <div className="flex items-center gap-3 mb-3">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0 group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0">💑</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-bold truncate">{name}</p>
                    <p className="text-text-muted text-xs">{m.age} yrs • {city}</p>
                    <p className="text-text-secondary text-xs truncate mt-0.5">{occupation} ({community})</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-primary h-full rounded-full" style={{ width: `${m.matchScore ?? 75}%` }} />
                  </div>
                  <span className="text-primary text-xs font-extrabold">{m.matchScore ?? 75}% Match</span>
                </div>

                <Link to={`/profile/${m.id}`} className="btn btn-secondary btn-sm w-full mt-3 text-xs justify-center bg-white border-slate-200">
                  View Full Profile
                </Link>
              </div>
            );})}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="card p-6 border-gold/30 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-text-primary font-bold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold" /> Profile Strength
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold py-0.5 px-2.5 bg-emerald-600 text-white rounded-full shadow-xs">High compatibility</span>
            </div>

            <div className="text-center my-4">
              <span className="text-4xl font-extrabold text-gradient-gold">{completionPct}%</span>
              <p className="text-text-muted text-xs mt-1">Complete to get 3x more interest responses</p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
              <div className="bg-gradient-gold h-full rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>

            <div className="space-y-2.5 text-xs text-text-secondary">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Basic Information</span>
                <span className="text-success font-semibold">Done</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Verified Photos</span>
                <span className="text-success font-semibold">Done</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Education & Career</span>
                <span className="text-success font-semibold">Done</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-warning" /> Horoscope Details</span>
                <Link to="/profile/edit" className="text-primary hover:underline font-bold">Add Now</Link>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-white">
            <h2 className="text-text-primary font-bold text-sm mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-secondary" /> Recent Activity
            </h2>
            <div className="space-y-3 text-xs text-text-secondary">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <Heart className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-text-primary font-semibold">New interest from Kavitha Rajan</p>
                  <p className="text-text-muted text-[10px]">10 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <Eye className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-text-primary font-semibold">5 profiles viewed your profile</p>
                  <p className="text-text-muted text-[10px]">2 hours ago</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
