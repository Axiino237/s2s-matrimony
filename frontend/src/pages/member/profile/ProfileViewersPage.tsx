import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { profilesApi } from '../../../services/profiles.service';
import {
  Eye,
  User,
  Users,
  ArrowUpRight,
  Loader2,
  Clock,
  Briefcase,
  GraduationCap,
  History,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';

interface HistoryItem {
  id: string;
  viewedAt: string;
}

interface GroupedViewer {
  viewerKey: string;
  viewerId: string;
  profileId: string | null;
  name: string;
  photoUrl: string | null;
  gender: string | null;
  age: number | null;
  city: string | null;
  community: string | null;
  education: string | null;
  occupation: string | null;
  viewCount: number;
  lastViewedAt: string;
  history: HistoryItem[];
}

const formatDateOnly = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTimeOnly = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatFullDateTime = (dateStr: string) => {
  const date = formatDateOnly(dateStr);
  const time = formatTimeOnly(dateStr);
  return `${date}, ${time}`;
};

const ProfileViewersPage = () => {
  const [selectedViewer, setSelectedViewer] = useState<GroupedViewer | null>(null);
  const { user } = useAuthStore();

  const { data: myProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: profilesApi.getMyProfile,
    staleTime: 5 * 60 * 1000,
  });

  const profileCompletion =
    myProfile?.profileCompletionPercent ??
    (user as any)?.profileCompletionPercent ??
    (user?.firstName ? 100 : 0);
  const isProfileComplete = profileCompletion >= 100;

  const { data: rawViewers = [], isLoading } = useQuery({
    queryKey: ['profile-viewers'],
    queryFn: profilesApi.getProfileViewers,
    staleTime: 2 * 60 * 1000,
  });

  // Group raw views by unique viewer
  const { totalViews, groupedViewers } = useMemo(() => {
    const total = rawViewers.length;
    const map = new Map<string, GroupedViewer>();

    for (const v of rawViewers) {
      const key = v.viewerId || v.profileId || v.viewId;
      const name = `${v.firstName || ''} ${v.lastName || ''}`.trim() || v.displayName || 'Member';

      if (!map.has(key)) {
        map.set(key, {
          viewerKey: key,
          viewerId: v.viewerId,
          profileId: v.profileId,
          name,
          photoUrl: v.photoUrl,
          gender: v.gender,
          age: v.age,
          city: v.city || 'Other',
          community: v.community,
          education: v.education,
          occupation: v.occupation,
          viewCount: 1,
          lastViewedAt: v.viewedAt,
          history: [{ id: v.viewId, viewedAt: v.viewedAt }],
        });
      } else {
        const existing = map.get(key)!;
        existing.viewCount += 1;
        existing.history.push({ id: v.viewId, viewedAt: v.viewedAt });
        if (new Date(v.viewedAt).getTime() > new Date(existing.lastViewedAt).getTime()) {
          existing.lastViewedAt = v.viewedAt;
        }
      }
    }

    const list = Array.from(map.values()).map((item) => ({
      ...item,
      history: [...item.history].sort(
        (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
      ),
    }));

    list.sort(
      (a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime()
    );

    return { totalViews: total, groupedViewers: list };
  }, [rawViewers]);

  // Handle modal escape key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedViewer(null);
      }
    };
    if (selectedViewer) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedViewer]);

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 card bg-gradient-to-r from-white via-primary/5 to-white border-primary/20 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg flex-shrink-0">
            <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary truncate">
              Who Viewed My Profile
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm mt-0.5 truncate">
              See the members who viewed your profile.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="btn btn-secondary btn-sm border-slate-200 bg-white text-xs sm:text-sm w-full sm:w-auto justify-center"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Top Summary: Total Views & Unique Visitors */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Views Card */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Total Views
              </p>
              <p className="text-3xl font-extrabold text-text-primary tracking-tight">
                {totalViews}
              </p>
              <p className="text-xs text-text-muted truncate">
                Profile was viewed {totalViews} time{totalViews === 1 ? '' : 's'} in total.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 shadow-inner">
              <Eye className="w-6 h-6" />
            </div>
          </div>

          {/* Unique Visitors Card */}
          <div className="card p-5 bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Unique Visitors
              </p>
              <p className="text-3xl font-extrabold text-secondary tracking-tight">
                {groupedViewers.length}
              </p>
              <p className="text-xs text-text-muted truncate">
                {groupedViewers.length} different member{groupedViewers.length === 1 ? '' : 's'} viewed the profile.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-text-secondary">Loading profile viewers...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && groupedViewers.length === 0 && (
        <div className="card p-8 sm:p-12 text-center space-y-4 bg-white border border-slate-200/80 shadow-xs">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${isProfileComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary/40'}`}>
            {isProfileComplete ? <Sparkles className="w-10 h-10" /> : <Eye className="w-10 h-10" />}
          </div>
          <div className="space-y-1.5">
            <h2 className="text-text-primary font-bold text-lg">No Profile Views Yet</h2>
            {isProfileComplete && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Profile is 100% Complete & Active</span>
              </div>
            )}
          </div>
          {isProfileComplete ? (
            <>
              <p className="text-text-secondary text-sm max-w-md mx-auto leading-relaxed">
                Your profile is 100% complete and actively visible to compatible matches across your community. Explore recommended profiles and send express interests to get noticed!
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link to="/search" className="btn btn-primary btn-md inline-flex items-center gap-2 shadow-sm">
                  <Sparkles className="w-4 h-4" /> Explore Matches
                </Link>
                <Link to="/profile/view" className="btn btn-secondary btn-md inline-flex items-center gap-2 border-slate-200 bg-white hover:bg-slate-50">
                  <User className="w-4 h-4 text-primary" /> View My Profile
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-text-secondary text-sm max-w-sm mx-auto">
                When members view your profile, they'll appear here. Complete your profile ({profileCompletion}% completed) to attract more views and boost your visibility!
              </p>
              <Link to="/complete-profile" className="btn btn-primary btn-md mx-auto inline-flex items-center gap-2 shadow-sm">
                Complete Your Profile ({profileCompletion}%)
              </Link>
            </>
          )}
        </div>
      )}

      {/* Unique Members Grid */}
      {!isLoading && groupedViewers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {groupedViewers.map((viewer) => {
            const fallback = viewer.gender === 'FEMALE' ? '/images/bride.png' : '/images/groom.png';

            return (
              <div
                key={viewer.viewerKey}
                className="card p-5 bg-white border border-slate-200/80 hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Photo, Name & View Count Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-100 flex-shrink-0 bg-slate-50 shadow-xs">
                        {viewer.photoUrl ? (
                          <img
                            src={viewer.photoUrl}
                            alt={viewer.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallback;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <User className="w-7 h-7 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-text-primary text-base font-bold truncate">
                          {viewer.name}
                        </h3>
                        <p className="text-text-muted text-xs mt-0.5 truncate">
                          {viewer.age ? `${viewer.age} yrs • ` : ''}
                          {viewer.city || viewer.community || 'Other'}
                        </p>
                      </div>
                    </div>

                    {/* View Count Badge */}
                    <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {viewer.viewCount} {viewer.viewCount === 1 ? 'view' : 'views'}
                    </span>
                  </div>

                  {/* Profile Details: Education & Occupation */}
                  <div className="space-y-1.5 mb-4 pl-0.5">
                    {viewer.education && (
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <GraduationCap className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                        <span className="truncate">{viewer.education}</span>
                      </div>
                    )}
                    {viewer.occupation && (
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <Briefcase className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                        <span className="truncate">{viewer.occupation}</span>
                      </div>
                    )}
                    {!viewer.education && !viewer.occupation && viewer.community && (
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <User className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                        <span className="truncate">{viewer.community}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Viewed */}
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 mb-4">
                    <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                    <span className="truncate">
                      <strong className="font-semibold text-text-primary">Last viewed:</strong>{' '}
                      {formatFullDateTime(viewer.lastViewedAt)}
                    </span>
                  </div>
                </div>

                {/* Actions: View Profile & View History */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  {viewer.profileId ? (
                    <Link
                      to={`/profile/${viewer.profileId}`}
                      className="btn btn-secondary btn-sm flex-1 text-xs justify-center font-semibold"
                    >
                      View Profile <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="btn btn-secondary btn-sm flex-1 text-xs justify-center opacity-60 cursor-not-allowed"
                    >
                      Profile Private
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedViewer(viewer)}
                    className="btn btn-primary btn-sm flex-1 text-xs justify-center font-semibold"
                  >
                    View History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View History Modal */}
      {selectedViewer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedViewer(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-white flex-shrink-0 shadow-xs">
                  {selectedViewer.photoUrl ? (
                    <img
                      src={selectedViewer.photoUrl}
                      alt={selectedViewer.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          selectedViewer.gender === 'FEMALE' ? '/images/bride.png' : '/images/groom.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-text-primary text-base truncate">
                    {selectedViewer.name} — {selectedViewer.viewCount}{' '}
                    {selectedViewer.viewCount === 1 ? 'View' : 'Views'}
                  </h3>
                  <p className="text-xs text-text-muted truncate">
                    {selectedViewer.age ? `${selectedViewer.age} yrs • ` : ''}
                    {selectedViewer.city || selectedViewer.community || 'Member'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedViewer(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-slate-200/60 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section Header */}
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-primary" /> View History
                </span>
                <span className="text-xs text-text-muted font-medium">
                  {selectedViewer.history.length} visit{selectedViewer.history.length === 1 ? '' : 's'} recorded
                </span>
              </div>
            </div>

            {/* History List */}
            <div className="px-5 py-2 overflow-y-auto flex-1 divide-y divide-slate-100">
              {selectedViewer.history.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="py-3 flex items-center justify-between text-sm hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                >
                  <span className="font-semibold text-text-primary">
                    {formatDateOnly(item.viewedAt)}
                  </span>
                  <span className="text-text-secondary font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 font-medium">
                    {formatTimeOnly(item.viewedAt)}
                  </span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              {selectedViewer.profileId ? (
                <Link
                  to={`/profile/${selectedViewer.profileId}`}
                  className="btn btn-primary btn-sm flex-1 justify-center"
                  onClick={() => setSelectedViewer(null)}
                >
                  View Profile <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              ) : (
                <span className="text-xs text-text-muted italic">Profile is private</span>
              )}
              <button
                type="button"
                onClick={() => setSelectedViewer(null)}
                className="btn btn-secondary btn-sm px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileViewersPage;
