import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/auth.store';
import { dashboardService } from '../../../services/dashboard.service';
import { profilesApi } from '../../../services/profiles.service';
import { MembershipBadge } from '../../../components/common/MembershipBadge';
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
    ?? (user as any)?.profileCompletionPercent
    ?? dashStats?.profileCompletionPercent 
    ?? dashStats?.profileCompletion 
    ?? (user?.firstName ? 100 : 0);

  const hasBasicInfo = completionPct >= 25 || Boolean(profile?.firstName && profile?.gender && profile?.maritalStatus);
  const hasPhotos = completionPct >= 50 || Boolean(profile?.photos && profile.photos.length > 0) || Boolean(profile?.mainPhotoId);
  const hasEducationCareer = completionPct >= 75 || Boolean(profile?.education?.degree || profile?.occupation?.designation || (profile as any)?.educationDegree || (profile as any)?.occupation);
  const hasHoroscope = completionPct >= 100 
    || Boolean(profile?.hasHoroscope) 
    || Boolean(profile?.horoscope && (
        profile.horoscope.star || 
        profile.horoscope.rasi || 
        profile.horoscope.horoscopeFile || 
        profile.horoscope.horoscopeData || 
        profile.horoscope.gothram || 
        profile.horoscope.lagnam || 
        profile.horoscope.dosham || 
        profile.horoscope.birthPlace || 
        profile.horoscope.birthTime
       )) 
    || Boolean((profile as any)?.star || (profile as any)?.rasi);


  const stats = [
    { icon: Eye, label: 'Profile Views', val: dashStats?.profileViews ?? 0, change: 'Total views received', color: 'bg-primary/10 text-primary border border-primary/20' },
    { icon: Heart, label: 'Interests Received', val: dashStats?.interestsReceived ?? 0, change: `${dashStats?.interestsAccepted ?? 0} accepted`, color: 'bg-rose-50 text-rose-600 border border-rose-100 bg-rose-50/50' },
    { icon: Sparkles, label: 'Interests Sent', val: dashStats?.interestsSent ?? 0, change: 'Profiles contacted', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
    { icon: MessageSquare, label: 'Profile Completion', val: `${completionPct}%`, change: completionPct >= 80 ? 'High compatibility ✓' : 'Pending details', color: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
  ];

  const rawRecommended = searchResult?.profiles || searchResult?.data || (Array.isArray(searchResult) ? searchResult : []);
  const recommendedMatches = rawRecommended
    .filter((m: any) => {
      if (m.userId === user?.id || m.id === user?.id || m.id === profile?.id) return false;
      const isAccountActive = m.user ? m.user.isActive !== false : m.isActive !== false;
      const isProfileVerified = m.isVerified === true && (!m.verificationStatus || m.verificationStatus === 'VERIFIED');
      const isProfileActive = !m.status || m.status === 'ACTIVE';
      return isAccountActive && isProfileVerified && isProfileActive;
    })
    .slice(0, 4);

  const rawTier = (
    profile?.membershipTier ||
    (profile as any)?.membership?.tier ||
    user?.membershipTier ||
    user?.membershipStatus ||
    user?.entitlements?.tier ||
    'FREE'
  ).toUpperCase();
  const isPrem = isPremium() && rawTier !== 'FREE';
  const memberTier = isPrem ? rawTier : 'FREE';

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full min-w-0">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 card bg-gradient-to-r from-white via-primary/5 to-white border-primary/20 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg flex-shrink-0">
            {profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'M'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-lg sm:text-2xl font-bold text-text-primary truncate">
                Welcome back, {profile?.firstName || user?.email?.split('@')[0] || 'Member'}!
              </h1>
              <MembershipBadge tier={memberTier} size="sm" />
            </div>
            <p className="text-text-secondary text-xs sm:text-sm mt-0.5 line-clamp-1 sm:line-clamp-none">Here is your live database matrimony overview & partner activity</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Link to="/profile/edit" className="btn btn-secondary btn-sm flex items-center justify-center flex-1 sm:flex-initial gap-1.5 border-slate-200 bg-white text-xs sm:text-sm">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </Link>
          {!isPrem && (
            <Link to="/premium" className="btn btn-gold btn-sm flex items-center justify-center flex-1 sm:flex-initial gap-1.5 font-bold shadow-md text-xs sm:text-sm">
              <Crown className="w-4 h-4" /> Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              <div className="col-span-2 text-center py-8 text-text-muted text-sm space-y-3">
                <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-slate-600 text-xs sm:text-sm">
                  {completionPct >= 100
                    ? 'No recommendations found right now. Check back soon or broaden your partner preferences!'
                    : `No recommendations yet — complete your profile (${completionPct}% completed) to get matches!`}
                </p>
                {completionPct >= 100 ? (
                  <Link to="/search" className="btn btn-primary btn-sm inline-flex items-center gap-1.5 mx-auto">
                    <Sparkles className="w-3.5 h-3.5" /> Explore All Matches
                  </Link>
                ) : (
                  <Link to="/complete-profile" className="btn btn-primary btn-sm inline-flex items-center gap-1.5 mx-auto">
                    Complete Your Profile
                  </Link>
                )}
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
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold py-0.5 px-2.5 rounded-full shadow-xs ${completionPct >= 100 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                {completionPct >= 100 ? '100% Complete' : 'High compatibility'}
              </span>
            </div>

            <div className="text-center my-4">
              <span className="text-4xl font-extrabold text-gradient-gold">{completionPct}%</span>
              {completionPct >= 100 ? (
                <p className="text-emerald-600 font-semibold text-xs mt-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Profile is 100% complete & verified
                </p>
              ) : (
                <p className="text-text-muted text-xs mt-1">Complete to get 3x more interest responses</p>
              )}
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${completionPct >= 100 ? 'bg-emerald-500' : 'bg-gradient-gold'}`} style={{ width: `${completionPct}%` }} />
            </div>

            <div className="space-y-2.5 text-xs text-text-secondary">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  {hasBasicInfo ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Star className="w-3.5 h-3.5 text-warning" />}
                  Basic Information
                </span>
                {hasBasicInfo ? (
                  <span className="text-success font-semibold">Done</span>
                ) : (
                  <Link to="/profile/edit" state={{ section: 'basic' }} className="text-primary hover:underline font-bold">Add Now</Link>
                )}
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  {hasPhotos ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Star className="w-3.5 h-3.5 text-warning" />}
                  Verified Photos
                </span>
                {hasPhotos ? (
                  <span className="text-success font-semibold">Done</span>
                ) : (
                  <Link to="/profile/edit" state={{ section: 'photos' }} className="text-primary hover:underline font-bold">Add Now</Link>
                )}
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  {hasEducationCareer ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Star className="w-3.5 h-3.5 text-warning" />}
                  Education & Career
                </span>
                {hasEducationCareer ? (
                  <span className="text-success font-semibold">Done</span>
                ) : (
                  <Link to="/profile/edit" state={{ section: 'education' }} className="text-primary hover:underline font-bold">Add Now</Link>
                )}
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="flex items-center gap-1.5">
                  {hasHoroscope ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Star className="w-3.5 h-3.5 text-warning" />}
                  Horoscope Details
                </span>
                {hasHoroscope ? (
                  <span className="text-success font-semibold">Done</span>
                ) : (
                  <Link to="/profile/edit" state={{ section: 'horoscope' }} className="text-primary hover:underline font-bold">Add Now</Link>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-text-primary font-bold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" /> Recent Activity
              </h2>
              {dashStats?.recentActivities && dashStats.recentActivities.length > 0 && (
                <span className="text-[10px] bg-secondary/10 text-secondary-dark px-2 py-0.5 rounded-full font-bold">
                  Live
                </span>
              )}
            </div>

            {dashStats?.recentActivities && dashStats.recentActivities.length > 0 ? (
              <div className="max-h-[172px] overflow-y-auto pr-1.5 space-y-2.5 text-xs text-text-secondary custom-scrollbar overscroll-contain">
                {dashStats.recentActivities.map((act: any) => {
                  const ActivityIcon =
                    act.type === 'INTEREST_RECEIVED'
                      ? Heart
                      : act.type === 'INTEREST_ACCEPTED'
                      ? Sparkles
                      : act.type === 'PROFILE_VIEW'
                      ? Eye
                      : act.type === 'MESSAGE'
                      ? MessageSquare
                      : act.type === 'PAYMENT'
                      ? Crown
                      : act.type === 'VERIFICATION'
                      ? ShieldCheck
                      : Sparkles;

                  const iconColor =
                    act.type === 'INTEREST_RECEIVED'
                      ? 'text-rose-500'
                      : act.type === 'INTEREST_ACCEPTED'
                      ? 'text-emerald-500'
                      : act.type === 'PROFILE_VIEW'
                      ? 'text-primary'
                      : act.type === 'MESSAGE'
                      ? 'text-cyan-600'
                      : act.type === 'PAYMENT'
                      ? 'text-amber-500'
                      : act.type === 'VERIFICATION'
                      ? 'text-emerald-600'
                      : 'text-primary';

                  const Content = (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:bg-slate-100/70 hover:border-slate-300 transition-colors group">
                      <ActivityIcon className={`w-4 h-4 ${iconColor} mt-0.5 flex-shrink-0 ${act.type === 'INTEREST_RECEIVED' ? 'animate-pulse' : ''}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-text-primary font-semibold truncate group-hover:text-primary transition-colors">
                          {act.title}
                        </p>
                        {act.description && (
                          <p className="text-text-secondary text-[11px] truncate mt-0.5">
                            {act.description}
                          </p>
                        )}
                        <p className="text-text-muted text-[10px] mt-1 font-medium">
                          {act.timeAgo || 'Recently'}
                        </p>
                      </div>
                    </div>
                  );

                  return act.link ? (
                    <Link key={act.id} to={act.link} className="block">
                      {Content}
                    </Link>
                  ) : (
                    <div key={act.id}>{Content}</div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-text-muted">
                <Activity className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600 text-xs">No recent activity yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Explore matches to connect with prospective partners!</p>
                <Link to="/search" className="btn btn-primary btn-xs mt-3 inline-flex items-center gap-1 font-bold">
                  Search Matches
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
