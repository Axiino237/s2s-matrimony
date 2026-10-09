import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Sparkles, AlertCircle, Heart } from 'lucide-react';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/auth.store';

type ProfileMatch = {
  id: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  age?: number;
  gender?: string;
  city?: { name: string } | string;
  photos?: { url: string }[];
  matchScore?: number;
  occupation?: { designation?: string };
  education?: { degree?: string };
  community?: { name: string };
};

const getDisplayName = (p: ProfileMatch) =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.displayName || 'Member';

const getCityName = (p: ProfileMatch) =>
  typeof p.city === 'object' ? p.city?.name : p.city || '—';

export const MatchesPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'Recommended' | 'Recently Joined' | 'Mutual' | 'Near You'>('Recommended');

  // Dynamically fetch matches using existing /search recommendation endpoint with React Query
  const {
    data: searchResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['recommended-matches', user?.id, activeTab],
    queryFn: async () => {
      const res = await api.get('/search', {
        params: {
          limit: 20,
          page: 1,
          excludeUserId: user?.id,
          tab: activeTab,
        },
      });
      return res.data;
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  const rawMatches = searchResult?.profiles ?? searchResult?.data ?? (Array.isArray(searchResult) ? searchResult : []);

  const userGender = user?.gender?.toUpperCase();
  const targetGender = userGender === 'MALE' ? 'FEMALE' : userGender === 'FEMALE' ? 'MALE' : null;

  // Filter matches consistently with dashboard recommendation rules
  const matches: ProfileMatch[] = useMemo(() => {
    if (!Array.isArray(rawMatches)) return [];
    return rawMatches.filter((p: any) => {
      if (p.userId === user?.id || p.id === user?.id) return false;
      if (targetGender && p.gender && p.gender.toUpperCase() !== targetGender) return false;
      const isAccountActive = p.user ? p.user.isActive !== false : p.isActive !== false;
      const isProfileVerified = p.isVerified === true && (!p.verificationStatus || p.verificationStatus === 'VERIFIED');
      const isProfileActive = !p.status || p.status === 'ACTIVE';
      return isAccountActive && isProfileVerified && isProfileActive;
    });
  }, [rawMatches, user?.id, targetGender]);

  return (
    <div className="animate-fade-in space-y-6 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2 truncate">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" /> Your Matches
          </h1>
          <p className="text-text-secondary text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">
            {isLoading ? 'Loading matches...' : `${matches.length} matches found from live database`}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn btn-ghost btn-sm text-text-muted hover:text-primary flex-shrink-0 transition disabled:opacity-50"
          aria-label="Refresh matches"
          title="Refresh matches"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="w-full max-w-full overflow-x-auto no-scrollbar pb-1">
        <div className="tab-bar flex max-w-full">
          {(['Recommended', 'Recently Joined', 'Mutual', 'Near You'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab text-xs whitespace-nowrap flex-shrink-0 ${tab === activeTab ? 'tab-active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content states */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="card p-8 text-center text-text-muted bg-white border border-rose-200 space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
          <p className="text-text-primary font-bold text-base">Failed to load matches</p>
          <p className="text-text-secondary text-xs">{(error as any)?.message || 'An error occurred while querying matches.'}</p>
          <button
            onClick={() => refetch()}
            className="btn btn-primary btn-sm mx-auto inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div className="card p-8 sm:p-16 text-center text-text-muted bg-white border border-slate-200 space-y-3">
          <Sparkles className="w-12 h-12 mx-auto text-slate-300" />
          <p className="text-text-primary font-bold text-lg">No matches found</p>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            No compatible profiles currently match your criteria in this category. You can browse all verified profiles in search.
          </p>
          <div className="pt-2">
            <Link to="/search" className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 border-slate-200">
              Explore All Profiles
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {matches.map((profile) => {
            const name = getDisplayName(profile);
            const city = getCityName(profile);
            const photo = profile.photos?.[0]?.url;
            const score = profile.matchScore ?? 75;
            const roleOrDegree = profile.occupation?.designation || profile.education?.degree;

            return (
              <div
                key={profile.id}
                className="card p-4 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-white border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square bg-slate-50 border border-slate-100 rounded-xl overflow-hidden mb-3 flex items-center justify-center relative group-hover:scale-105 transition-transform">
                    {photo ? (
                      <img src={photo} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl select-none">
                        {profile.gender === 'FEMALE' ? '👰' : '🤵'}
                      </span>
                    )}
                    {profile.community?.name && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
                        {profile.community.name}
                      </span>
                    )}
                  </div>

                  <p className="text-text-primary font-bold text-sm truncate">{name}</p>
                  <p className="text-text-muted text-xs truncate">
                    {profile.age ? `${profile.age} yrs • ` : ''}{city}
                  </p>
                  {roleOrDegree && (
                    <p className="text-slate-500 dark:text-slate-400 text-xs truncate mt-0.5" title={roleOrDegree}>
                      {roleOrDegree}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-primary"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-primary text-xs font-extrabold">{score}% Match</span>
                  </div>
                </div>

                <Link
                  to={`/profile/${profile.id}`}
                  className="btn btn-secondary btn-sm w-full mt-3.5 text-xs justify-center bg-white border-slate-200 hover:border-primary/30"
                >
                  View Full Profile
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
