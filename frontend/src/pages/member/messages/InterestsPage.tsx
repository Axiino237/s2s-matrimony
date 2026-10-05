import { useState, useEffect, useCallback } from 'react';
import { Heart, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

interface InterestItem {
  id: string;
  status: string;
  createdAt: string;
  message?: string;
  sender?: {
    id: string;
    profile?: {
      firstName: string;
      lastName: string;
      age: number;
      isVerified: boolean;
      community?: { name: string };
      occupation?: { designation?: string; company?: string };
      photos?: { url: string }[];
      city?: { name: string };
    };
  };
  receiver?: {
    id: string;
    profile?: {
      firstName: string;
      lastName: string;
      age: number;
      isVerified: boolean;
      community?: { name: string };
      occupation?: { designation?: string };
      photos?: { url: string }[];
      city?: { name: string };
    };
  };
}

const getProfileInfo = (item: InterestItem, type: 'received' | 'sent') => {
  const person = type === 'received' ? item.sender : item.receiver;
  const p = person?.profile || (person as any);
  const fullName = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || p?.displayName || (p as any)?.name || 'Member';
  return {
    name: fullName,
    age: p?.age ?? 0,
    city: typeof p?.city === 'object' ? p?.city?.name : p?.city || '—',
    occupation: typeof p?.occupation === 'object' ? (p?.occupation?.designation || p?.occupation?.title || p?.occupation?.company) : (p?.occupation || '—'),
    community: typeof p?.community === 'object' ? p?.community?.name : (p?.community || p?.caste || '—'),
    isVerified: p?.isVerified ?? false,
    avatar: p?.photos?.[0]?.url || (p as any)?.photoUrl || null,
    personId: person?.id,
  };
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

const InterestsPage = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [received, setReceived] = useState<InterestItem[]>([]);
  const [sent, setSent] = useState<InterestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterests = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, sentRes] = await Promise.all([
        api.get('/interests/received').catch(() => ({ data: [] })),
        api.get('/interests/sent').catch(() => ({ data: [] })),
      ]);

      const rawRec = Array.isArray(recRes.data)
        ? recRes.data
        : Array.isArray(recRes.data?.data)
        ? recRes.data.data
        : [];
      const rawSent = Array.isArray(sentRes.data)
        ? sentRes.data
        : Array.isArray(sentRes.data?.data)
        ? sentRes.data.data
        : [];

      setReceived(rawRec);
      setSent(rawSent);
    } catch {
      setReceived([]);
      setSent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterests();
    api.patch('/notifications/mark-read').catch(() => null);
  }, [fetchInterests]);

  const handleRespond = async (id: string, status: 'ACCEPTED' | 'REJECTED', name: string) => {
    try {
      await api.patch(`/interests/${id}/respond`, { status });
      setReceived((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
      toast.success(
        status === 'ACCEPTED'
          ? `Accepted interest from ${name}! 💌`
          : `Declined interest from ${name}`
      );
    } catch {
      toast.error('Failed to update interest');
    }
  };

  const items = activeTab === 'received' ? received : sent;
  const pending = received.filter((i) => i.status === 'PENDING');
  const accepted = received.filter((i) => i.status === 'ACCEPTED');
  const rejected = received.filter((i) => i.status === 'REJECTED');

  return (
    <div className="animate-fade-in space-y-6 w-full max-w-full min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2 truncate">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" /> Interests
          </h1>
          <p className="text-text-secondary text-xs sm:text-sm mt-0.5 truncate">Manage interest requests sent and received</p>
        </div>
        <button onClick={fetchInterests} className="btn btn-ghost btn-sm text-text-muted hover:text-primary flex-shrink-0" aria-label="Refresh interests">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Pending', value: pending.length, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Accepted', value: accepted.length, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          { label: 'Sent', value: sent.length, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        ].map((s) => (
          <div key={s.label} className={`card p-2.5 sm:p-3 text-center border ${s.color}`}>
            <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
            <p className="text-[11px] sm:text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="tab-bar w-full sm:max-w-xs">
        {(['received', 'sent'] as const).map((tab) => (
          <button
            key={tab}
            className={`tab flex-1 capitalize py-2 px-3 sm:px-4 rounded-lg text-xs font-semibold ${activeTab === tab ? 'tab-active font-bold shadow' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'received' ? `Received (${received.length})` : `Sent (${sent.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center text-text-muted bg-white border border-slate-200">
          <Heart className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-text-primary text-sm sm:text-base">No {activeTab} interests yet</p>
          <p className="text-xs text-text-secondary mt-1">They will appear here when you {activeTab === 'received' ? 'receive' : 'send'} interests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const info = getProfileInfo(item, activeTab);
            return (
              <div key={item.id} className="card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white border border-slate-200 hover:border-primary/20 transition-all">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 border border-slate-100 overflow-hidden">
                    {info.avatar ? (
                      <img src={info.avatar} alt={info.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>💑</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-text-primary font-bold text-sm truncate">{info.name}</p>
                      {info.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold py-0.5 px-2 bg-emerald-600 text-white rounded-full shadow-xs">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-text-secondary text-xs mt-0.5 font-medium truncate">
                      {[
                        info.age > 0 ? `${info.age} yrs` : null,
                        info.city && info.city !== '—' ? info.city : null,
                        info.occupation && info.occupation !== '—' ? info.occupation : null,
                        info.community && info.community !== '—' ? info.community : null,
                      ].filter(Boolean).join(' • ')}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        item.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        ✓ Read
                      </span>
                      <span className="text-text-muted text-[10px]">{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {activeTab === 'received' && item.status === 'PENDING' && (
                  <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => handleRespond(item.id, 'ACCEPTED', info.name)}
                      className="btn btn-primary btn-sm text-xs py-2 px-4 flex-1 sm:flex-initial flex items-center justify-center gap-1 shadow-sm font-semibold"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(item.id, 'REJECTED', info.name)}
                      className="btn btn-secondary btn-sm text-xs py-2 px-4 flex-1 sm:flex-initial flex items-center justify-center border-slate-200 bg-slate-50 text-text-secondary hover:bg-slate-100 font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InterestsPage;
