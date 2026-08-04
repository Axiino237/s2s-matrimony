import { useState, useEffect } from 'react';
import { Globe, DollarSign, Users, Layers, Loader2, TrendingUp } from 'lucide-react';
import { superAdminService } from '../../services/super-admin.service';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminService.getGlobalStats()
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` :
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` :
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  const cards = [
    { icon: Globe,      label: 'Total Communities', value: loading ? '...' : String(stats?.totalCommunities ?? '—'),      color: 'bg-blue-100 text-blue-600 border-blue-200' },
    { icon: DollarSign, label: 'Total Revenue',     value: loading ? '...' : fmt(Number(stats?.totalRevenue ?? 0)),        color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
    { icon: Users,      label: 'Total Users',       value: loading ? '...' : fmt(Number(stats?.totalUsers ?? 0)),          color: 'bg-primary/10 text-primary border-primary/20' },
    { icon: Layers,     label: 'Total Admins',      value: loading ? '...' : String(stats?.totalAdmins ?? '—'),           color: 'bg-amber-100 text-amber-600 border-amber-200' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" /> Super Admin Dashboard
        </h1>
        <p className="text-text-secondary text-sm mt-1">Global platform overview and control center</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card">
              <div className={`w-12 h-12 rounded-xl ${s.color} border flex items-center justify-center flex-shrink-0`}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary font-display">{s.value}</p>
                <p className="text-text-secondary text-sm">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Revenue Trend */}
      {stats?.monthlyRevenue && (
        <div className="card p-6 md:p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Monthly Revenue Trend
              </h2>
              <p className="text-text-secondary text-xs mt-0.5">Platform growth performance over recent months</p>
            </div>
            <span className="badge bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold px-3 py-1 flex items-center gap-1 shadow-sm">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% YoY Growth
            </span>
          </div>

          <div className="relative pt-6 pb-2">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 text-slate-400 text-[10px] font-medium border-b border-slate-200 pb-6">
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
            </div>

            <div className="flex items-end gap-3 md:gap-6 h-80 relative z-10">
              {stats.monthlyRevenue.map((m: any, i: number) => {
                const numRev = Number(m.revenue || 0);
                const max = Math.max(...stats.monthlyRevenue.map((x: any) => Number(x.revenue || 0)), 1);
                const pct = Math.max(15, Math.min(100, (numRev / max) * 100));
                const fmtVal = numRev >= 100000 ? `₹${(numRev / 100000).toFixed(1)}L` : numRev >= 1000 ? `₹${(numRev / 1000).toFixed(0)}K` : `₹${numRev}`;

                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                    <span className="text-xs font-bold text-primary group-hover:scale-110 transition-transform bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 shadow-2xs">
                      {fmtVal}
                    </span>
                    <div className="w-full bg-slate-100 rounded-2xl relative h-64 overflow-hidden flex items-end p-1 shadow-inner">
                      <div
                        className="w-full bg-gradient-to-t from-primary via-rose-500 to-rose-400 rounded-xl group-hover:brightness-110 transition-all duration-700 shadow-md shadow-rose-500/20 group-hover:shadow-lg group-hover:shadow-rose-500/40 relative"
                        style={{ height: `${pct}%` }}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-text-secondary group-hover:text-primary transition-colors mt-1">
                      {m.month}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
