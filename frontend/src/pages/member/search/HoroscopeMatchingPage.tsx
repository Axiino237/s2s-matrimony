import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles, Crown, ArrowRight, ShieldCheck, Heart, Star,
  Compass, AlertTriangle, RefreshCw, Eye, ChevronDown,
  ChevronUp, CheckCircle2, XCircle, SlidersHorizontal,
  LayoutGrid, Table as TableIcon, MapPin, User, Moon, Sun
} from 'lucide-react';
import { profilesApi } from '../../../services/profiles.service';
import { useAuthStore } from '../../../store/auth.store';

interface PoruthamDetail {
  status: boolean;
  points?: number;
  max?: number;
  note?: string;
}

interface HoroscopeMatchItem {
  id: string;
  memberId: string;
  name: string;
  gender: string;
  age: number;
  location: string;
  photoUrl: string | null;
  rasi: string;
  star: string;
  starPadam?: number | null;
  lagnam?: string | null;
  dosham?: string | null;
  matchPercentage: number;
  status: string;
  calculatedAt?: string;
  factors?: {
    summary?: string;
    poruthamsMatched?: number;
    totalPoruthams?: number;
    rajjuCompatible?: boolean;
    doshamCompatible?: boolean;
    poruthamList?: Record<string, PoruthamDetail>;
  };
}

export const HoroscopeMatchingPage: React.FC = () => {
  const { user, isSuperAdmin, isAdmin } = useAuthStore();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Fetch pre-calculated matches (Pure DB read — 0 AI calls on read/refresh)
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['horoscopeMatches'],
    queryFn: async () => {
      return await profilesApi.getHoroscopeMatches();
    },
    retry: false,
    staleTime: 60 * 1000, // 1 minute
  });

  // Check if non-elite or unentitled 403 error
  const isForbidden =
    (error as any)?.response?.status === 403 ||
    (error as any)?.status === 403 ||
    (data && data.isElite === false);

  const errorMessage =
    (error as any)?.response?.data?.message ||
    (error as any)?.message ||
    '';

  const isEliteUser = Boolean(
    isSuperAdmin() ||
    user?.membershipCategory === 'ELITE' ||
    user?.entitlements?.category === 'ELITE' ||
    user?.entitlements?.isElite === true ||
    (data && data.isElite === true)
  );

  const planHasHoroscopeMatching = Boolean(
    isSuperAdmin() ||
    user?.entitlements?.canAccessHoroscopeMatching === true ||
    user?.entitlements?.hasHoroscopeReport === true ||
    user?.entitlements?.features?.some((f: string) =>
      typeof f === 'string' &&
      (f.toLowerCase().includes('horoscope matching') || f.toLowerCase().includes('horoscope report'))
    )
  );

  const canAccessMatching = Boolean(
    isSuperAdmin() ||
    (isEliteUser && planHasHoroscopeMatching)
  );

  const matches: HoroscopeMatchItem[] = useMemo(() => {
    if (!data?.matches || !Array.isArray(data.matches)) return [];
    return data.matches;
  }, [data]);

  // Filtered and sorted matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (m.matchPercentage < minScoreFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.name?.toLowerCase() || '';
        const matchId = m.memberId?.toLowerCase() || '';
        const matchLoc = m.location?.toLowerCase() || '';
        const matchStar = m.star?.toLowerCase() || '';
        const matchRasi = m.rasi?.toLowerCase() || '';
        if (
          !matchName.includes(q) &&
          !matchId.includes(q) &&
          !matchLoc.includes(q) &&
          !matchStar.includes(q) &&
          !matchRasi.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [matches, minScoreFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedMatchId((prev) => (prev === id ? null : id));
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (score >= 45) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Non-Elite Restriction Screen (General category members cannot access)
  // ─────────────────────────────────────────────────────────────────────────
  if (!isEliteUser && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 shadow-2xl border border-purple-500/20">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 backdrop-blur-md text-amber-300 text-xs sm:text-sm font-semibold tracking-wide">
              <Crown className="w-4 h-4 text-amber-400" />
              ELITE CATEGORY EXCLUSIVE
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Horoscope Matching Feature
            </h1>

            <p className="text-purple-100/90 text-sm sm:text-base leading-relaxed">
              Horoscope Matching is exclusively reserved for members in the <strong className="text-amber-300 font-semibold">Elite category</strong>. General category members (with financial qualification below the Elite threshold) cannot access or view this feature.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/premium"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-sm sm:text-base shadow-lg hover:from-amber-300 hover:to-yellow-400 transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Explore Elite Membership
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Vedic 10-Poruthams Match</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Rigorous analysis of Dina, Gana, Mahendra, Yoni, Rasi, Rasi Adhipathi, Rajju, and Vedhai factors.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Chevvai & Dosham Parity</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Automated Mars/Chevvai and Raagu/Kethu dosham balance checks for astrologically harmonious matches.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Elite Matchmaking</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Curated compatibility calculations between high-net-worth Elite members and verified profiles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Elite Plan Feature Upgrade Screen (when active plan does not include Horoscope Matching)
  // ─────────────────────────────────────────────────────────────────────────
  if (isForbidden || (!canAccessMatching && !isLoading)) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs sm:text-sm font-semibold tracking-wide">
              <Crown className="w-4 h-4 text-yellow-300" />
              PLAN FEATURE REQUIRED
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Horoscope Matching Feature
            </h1>

            <p className="text-amber-100 text-sm sm:text-base leading-relaxed">
              Your active membership plan does not have the Horoscope Matching feature enabled. Admin has not enabled this feature for your plan. Please choose an Elite plan with Horoscope Matching enabled.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/premium"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-amber-900 font-bold text-sm sm:text-base shadow-lg hover:bg-amber-50 transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Upgrade Membership Plan
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Vedic 10-Poruthams Match</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Rigorous analysis of Dina, Gana, Mahendra, Yoni, Rasi, Rasi Adhipathi, Rajju, and Vedhai factors.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Chevvai & Dosham Parity</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Automated Mars/Chevvai and Raagu/Kethu dosham balance checks so you only focus on astrologically harmonious matches.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Instant Database Speeds</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              All compatibilities are pre-computed and stored. Instantly view your matches with zero wait times.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Horoscope Matching View
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-6 space-y-6 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 text-white text-xs font-bold shadow-sm">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              ELITE MEMBER FEATURE
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60">
              Pre-calculated DB Matches
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-amber-500 flex-shrink-0" />
            Horoscope Matching
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Astrological compatibility calculated between your profile and verified opposite-gender members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition border border-slate-200/60 disabled:opacity-50"
            title="Refresh database matches"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-amber-500' : ''}`} />
            Refresh
          </button>

          {/* View Mode Toggle */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'grid'
                  ? 'bg-white text-amber-600 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table'
                  ? 'bg-white text-amber-600 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Viewer Horoscope Summary Card */}
      {data?.viewerHoroscope && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-amber-700 tracking-wider">
                Your Astrological Profile
              </div>
              <div className="text-sm sm:text-base font-semibold text-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <span>Rasi: <strong className="text-slate-900">{data.viewerHoroscope.rasi || 'Not set'}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Star: <strong className="text-slate-900">{data.viewerHoroscope.star || 'Not set'}</strong></span>
                {data.viewerHoroscope.starPadam && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>Pada: <strong className="text-slate-900">{data.viewerHoroscope.starPadam}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end text-xs font-medium text-slate-600">
            <span className="px-3 py-1.5 rounded-lg bg-white/80 border border-amber-200/60">
              Matching for: <strong className="text-amber-700">{data.viewerHoroscope.oppositeGender === 'FEMALE' ? 'Female Members' : 'Male Members'}</strong>
            </span>
            <Link
              to="/profile/edit"
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition shadow-sm"
            >
              Edit Horoscope
            </Link>
          </div>
        </div>
      )}

      {/* Warning if viewer has insufficient horoscope info (Rasi & Navamsam chart required) */}
      {data?.viewerHoroscope && !data.viewerHoroscope.hasSufficientData && (
        <div className="rounded-2xl p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-900 flex items-start gap-4 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <h4 className="font-bold text-sm sm:text-base text-amber-900">
              Required Horoscope Information Incomplete
            </h4>
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Vedic Horoscope Matching requires your complete horoscope details, including your Nakshatra/Star, Rasi, Rasi Chart, and Navamsam Chart.
            </p>
            {data.viewerHoroscope.missingFields && data.viewerHoroscope.missingFields.length > 0 && (
              <p className="text-xs sm:text-sm font-semibold text-amber-900">
                Missing required information: {data.viewerHoroscope.missingFields.join(', ')}.
              </p>
            )}
            <div className="pt-1.5">
              <Link
                to="/profile/edit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm transition shadow-sm"
              >
                Complete Horoscope Details &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, ID, star, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              aria-label="Filter by minimum horoscope compatibility"
              className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={0}>All Matches</option>
              <option value={60}>60%+ Compatibility</option>
              <option value={75}>75%+ High Match</option>
              <option value={85}>85%+ Excellent Match</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 whitespace-nowrap">
            Showing <strong>{filteredMatches.length}</strong> of {matches.length}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">
            Loading stored horoscope matches...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredMatches.length === 0 && (
        <div className="py-16 text-center rounded-3xl bg-white border border-slate-200 p-8 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <Star className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchQuery || minScoreFilter > 0 ? 'No matches match your filter criteria' : 'No Horoscope Matches Found'}
          </h3>
          <p className="max-w-md mx-auto text-xs sm:text-sm text-slate-500">
            {searchQuery || minScoreFilter > 0
              ? 'Try adjusting your search terms or lowering the minimum compatibility filter.'
              : 'Horoscope calculations are automatically pre-computed for active eligible profiles with registered Star/Rasi details.'}
          </p>
          {(searchQuery || minScoreFilter > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setMinScoreFilter(0);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* GRID VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!isLoading && viewMode === 'grid' && filteredMatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMatches.map((item) => {
            const isExpanded = expandedMatchId === item.id;
            const poruthams = item.factors?.poruthamList;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
              >
                {/* Profile Top Card */}
                <div className="p-4 sm:p-5 flex items-start gap-4">
                  {/* Photo with fallback */}
                  <Link to={`/profile/${item.id}`} className="relative flex-shrink-0 group">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 group-hover:opacity-90 transition"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-2xl flex items-center justify-center shadow-inner">
                        {item.name?.[0] || 'M'}
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                        {item.memberId}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {item.age} yrs • {item.gender}
                      </span>
                    </div>

                    <Link to={`/profile/${item.id}`} className="block mt-0.5">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate hover:text-amber-600 transition">
                        {item.name}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>

                    {/* Prominent Match Percentage */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-black shadow-xs ${getScoreBadgeColor(
                          item.matchPercentage
                        )}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Horoscope Match: {item.matchPercentage}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horoscope Details Bar */}
                <div className="px-4 py-3 bg-slate-50 border-t border-b border-slate-100 text-xs text-slate-700 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Rasi</span>
                    <strong className="text-slate-900">{item.rasi}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Nakshatra (Star)</span>
                    <strong className="text-slate-900">
                      {item.star} {item.starPadam ? `(Pada ${item.starPadam})` : ''}
                    </strong>
                  </div>
                </div>

                {/* Porutham Quick Summary & Expand Toggle */}
                <div className="p-3.5 bg-white flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">
                      {item.factors?.summary || `${item.factors?.poruthamsMatched ?? 'Multiple'} Poruthams Compatible`}
                    </span>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="text-amber-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      {isExpanded ? 'Hide Breakdown' : 'View Poruthams'}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expanded Breakdown Accordion */}
                  {isExpanded && poruthams && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(poruthams).map(([name, val]) => (
                          <div
                            key={name}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50"
                          >
                            <span className="text-slate-600 text-[11px] font-medium">{name}</span>
                            {val.status ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            )}
                          </div>
                        ))}
                      </div>

                      {item.factors?.doshamCompatible !== undefined && (
                        <div className="p-2 rounded-lg bg-amber-50 text-[11px] text-amber-900 flex items-center justify-between">
                          <span>Dosham / Chevvai Parity:</span>
                          <strong>{item.factors.doshamCompatible ? 'Harmonious' : 'Check Astrologer'}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Link
                      to={`/profile/${item.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Full Profile
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TABLE VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!isLoading && viewMode === 'table' && filteredMatches.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-3">Age / Gender</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Rasi</th>
                  <th className="py-3 px-3">Nakshatra</th>
                  <th className="py-3 px-4 text-center">Horoscope Match</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMatches.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt={item.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                            {item.name?.[0] || 'M'}
                          </div>
                        )}
                        <div>
                          <Link
                            to={`/profile/${item.id}`}
                            className="font-bold text-slate-900 hover:text-amber-600 transition"
                          >
                            {item.name}
                          </Link>
                          <div className="text-[10px] font-mono text-slate-400 uppercase">{item.memberId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {item.age} yrs • {item.gender}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.location}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.rasi}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {item.star} {item.starPadam ? `(${item.starPadam})` : ''}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-black ${getScoreBadgeColor(
                          item.matchPercentage
                        )}`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {item.matchPercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/profile/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoroscopeMatchingPage;
