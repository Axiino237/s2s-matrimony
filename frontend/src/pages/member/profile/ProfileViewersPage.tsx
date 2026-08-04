import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { profilesApi } from '../../../services/profiles.service';
import { Eye, User, ArrowUpRight, Loader2, Calendar, Briefcase, GraduationCap } from 'lucide-react';

const ProfileViewersPage = () => {
  const { data: viewers = [], isLoading } = useQuery({
    queryKey: ['profile-viewers'],
    queryFn: profilesApi.getProfileViewers,
    staleTime: 2 * 60 * 1000,
  });

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins || 1} min${mins !== 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-6 card bg-gradient-to-r from-white via-primary/5 to-white border-primary/20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg flex-shrink-0">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Who Viewed My Profile</h1>
            <p className="text-text-secondary text-sm mt-0.5">
              {isLoading ? 'Loading...' : `${viewers.length} profile view${viewers.length !== 1 ? 's' : ''} received`}
            </p>
          </div>
        </div>
        <Link to="/dashboard" className="btn btn-secondary btn-sm border-slate-200 bg-white">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm font-semibold text-text-secondary">Loading profile viewers...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && viewers.length === 0 && (
        <div className="card p-12 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Eye className="w-10 h-10 text-primary/40" />
          </div>
          <h2 className="text-text-primary font-bold text-lg">No Profile Views Yet</h2>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            When members view your profile, they'll appear here. Complete your profile to attract more views!
          </p>
          <Link to="/profile/edit" className="btn btn-primary btn-md mx-auto inline-flex">
            Complete Your Profile
          </Link>
        </div>
      )}

      {/* Viewers Grid */}
      {!isLoading && viewers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {viewers.map((v: any) => {
            const name = `${v.firstName || ''} ${v.lastName || ''}`.trim() || v.displayName || 'Member';
            const photo = v.photoUrl;
            const fallback = v.gender === 'FEMALE' ? '/images/bride.png' : '/images/groom.png';

            return (
              <div
                key={v.viewId}
                className="card p-4 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group bg-white"
              >
                {/* Profile Photo */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-100 flex-shrink-0 bg-slate-50 shadow-sm group-hover:border-primary/30 transition-colors">
                    {photo ? (
                      <img
                        src={photo}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = fallback; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <User className="w-7 h-7 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-bold truncate group-hover:text-primary transition-colors">
                      {name}
                    </p>
                    {v.age && (
                      <p className="text-text-muted text-xs mt-0.5">
                        {v.age} yrs{v.city ? ` • ${v.city}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-3">
                  {v.community && (
                    <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                      <User className="w-3 h-3 text-text-muted flex-shrink-0" />
                      <span className="truncate">{v.community}</span>
                    </div>
                  )}
                  {v.education && (
                    <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                      <GraduationCap className="w-3 h-3 text-text-muted flex-shrink-0" />
                      <span className="truncate">{v.education}</span>
                    </div>
                  )}
                  {v.occupation && (
                    <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                      <Briefcase className="w-3 h-3 text-text-muted flex-shrink-0" />
                      <span className="truncate">{v.occupation}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[10px] text-text-muted">
                    <Calendar className="w-3 h-3" />
                    <span>{formatTimeAgo(v.viewedAt)}</span>
                  </div>
                  {v.profileId ? (
                    <Link
                      to={`/profile/${v.profileId}`}
                      className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline"
                    >
                      View Profile <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-[10px] text-text-muted italic">Profile private</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileViewersPage;
