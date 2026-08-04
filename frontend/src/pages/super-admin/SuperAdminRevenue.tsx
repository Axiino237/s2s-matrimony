import { useState, useEffect } from 'react';
import { IndianRupee, Loader2, TrendingUp } from 'lucide-react';
import { superAdminService } from '../../services/super-admin.service';

const SuperAdminRevenue = () => {
  const [trend, setTrend] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      superAdminService.getRevenueTrend(6),
      superAdminService.getGlobalStats(),
    ])
      .then(([revData, statData]) => {
        setTrend(Array.isArray(revData) ? revData : revData.data ?? []);
        setStats(statData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` :
    n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

  const totalRevenue = trend.reduce((s: number, m: any) => s + Number(m.revenue ?? 0), 0);
  const lastMonth = trend[trend.length - 1]?.revenue ?? 0;
  const maxRevenue = Math.max(...trend.map((m: any) => Number(m.revenue ?? 0)), 1);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
          <IndianRupee className="w-6 h-6 text-primary" /> Global Revenue Reports
        </h1>
        <p className="text-text-secondary text-sm mt-1">Platform-wide revenue analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
          ))
        ) : [
          { label: 'Trend Period Total', val: fmt(totalRevenue), color: 'text-primary' },
          { label: 'Last Month', val: fmt(Number(lastMonth)), color: 'text-emerald-600' },
          { label: 'Total Platform Revenue', val: fmt(Number(stats?.totalRevenue ?? 0)), color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <p className={`text-3xl font-bold font-display ${s.color}`}>{s.val}</p>
            <p className="text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-6 md:p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-xl font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Monthly Revenue Trend
            </h2>
            <p className="text-text-secondary text-xs mt-0.5">Detailed monthly income breakdown</p>
          </div>
          <span className="badge bg-rose-50 text-primary border-rose-200 text-xs font-semibold px-3 py-1 flex items-center gap-1 shadow-sm">
            Total {fmt(totalRevenue)}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : trend.length === 0 ? (
          <div className="text-center text-text-muted py-16">No revenue data available</div>
        ) : (
          <div className="relative pt-6 pb-2">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 text-slate-400 text-[10px] font-medium border-b border-slate-200 pb-6">
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
            </div>

            <div className="flex items-end gap-3 md:gap-6 h-80 relative z-10">
              {trend.map((m: any, i: number) => {
                const numRev = Number(m.revenue ?? 0);
                const pct = Math.max(15, Math.min(100, (numRev / maxRevenue) * 100));

                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                    <span className="text-xs font-bold text-primary group-hover:scale-110 transition-transform bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 shadow-2xs">
                      {fmt(numRev)}
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
                      {m.month ?? `M${i + 1}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminRevenue;
