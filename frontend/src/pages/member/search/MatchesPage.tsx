import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
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
  community?: { name: string };
};

const getDisplayName = (p: ProfileMatch) =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.displayName || 'Member';

const getCityName = (p: ProfileMatch) =>
  typeof p.city === 'object' ? p.city?.name : p.city || '—';

const MatchesPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'Recommended' | 'Recently Joined' | 'Mutual' | 'Near You'>('Recommended');
  const [matches, setMatches] = useState<ProfileMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/search', {
        params: {
          limit: 20,
          page: 1,
          excludeUserId: user?.id,
          usePartnerPref: true,
          tab: activeTab,
        },
      });
      const data = res.data?.profiles ?? res.data?.data ?? res.data ?? [];
      const list = Array.isArray(data) ? data : [];
      // Exclude logged in user profile and filter by opposite gender if user gender is known
      const userGender = user?.gender?.toUpperCase();
      const targetGender = userGender === 'MALE' ? 'FEMALE' : userGender === 'FEMALE' ? 'MALE' : null;

      const filtered = list.filter((p: any) => {
        if (p.userId === user?.id || p.id === user?.id) return false;
        if (targetGender && p.gender && p.gender.toUpperCase() !== targetGender) return false;
        return true;
      });
      setMatches(filtered);
    } catch {
      toast.error('Failed to load matches from database');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Your Matches
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {loading ? 'Loading matches...' : `${matches.length} matches found from live database`}
          </p>
        </div>
        <button onClick={fetchMatches} className="btn btn-ghost btn-sm text-text-muted hover:text-primary">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="tab-bar max-w-lg">
        {(['Recommended', 'Recently Joined', 'Mutual', 'Near You'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab text-xs ${tab === activeTab ? 'tab-active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : matches.length === 0 ? (
        <div className="card p-16 text-center text-text-muted bg-white border border-slate-200">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-text-primary font-bold text-lg">No matches found</p>
          <p className="text-text-secondary text-sm mt-1">Complete your partner preferences to discover compatible matches!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {matches.map((profile) => {
            const name = getDisplayName(profile);
            const city = getCityName(profile);
            const photo = profile.photos?.[0]?.url;
            const score = profile.matchScore ?? 75;

            return (
              <div
                key={profile.id}
                className="card p-4 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-white border border-slate-200"
              >
                <div className="aspect-square bg-slate-50 border border-slate-100 rounded-xl overflow-hidden mb-3 flex items-center justify-center relative group-hover:scale-105 transition-transform">
                  {photo ? (
                    <img src={photo} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl select-none">
                      {profile.gender === 'FEMALE' ? '👰' : '🤵'}
                    </span>
                  )}
                </div>
                <p className="text-text-primary font-bold text-sm truncate">{name}</p>
                <p className="text-text-muted text-xs">{profile.age ? `${profile.age} yrs • ` : ''}{city}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-primary"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="text-primary text-xs font-extrabold">{score}% Match</span>
                </div>
                <Link
                  to={`/profile/${profile.id}`}
                  className="btn btn-secondary btn-sm w-full mt-3 text-xs justify-center bg-white border-slate-200"
                >
                  View Profile
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
