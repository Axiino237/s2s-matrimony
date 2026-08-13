import { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee, Loader2, TrendingUp, Calendar, Download,
  RefreshCw, ArrowUpRight, ArrowDownRight, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { superAdminService } from '../../services/super-admin.service';

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const RevTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 min-w-[120px]">
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <p className="text-base font-bold text-primary">
        ₹{Number(payload[0]?.value || 0).toLocaleString('en-IN')}
      </p>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const SuperAdminRevenue = () => {
  const [trend,   setTrend]   = useState<any[]>([]);
  const [stats,   setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartType,       setChartType]       = useState<'area' | 'bar'>('area');
  const [selectedMonth,   setSelectedMonth]   = useState<string>('all');

  const fmt = (n: number) =>
    n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr` :
    n >= 100000   ? `₹${(n / 100000).toFixed(1)}L`    :
    n >= 1000     ? `₹${(n / 1000).toFixed(1)}K`      : `₹${n}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [revData, statData] = await Promise.all([
        superAdminService.getRevenueTrend(12).catch(() => []),
        superAdminService.getGlobalStats().catch(() => null),
      ]);
      setTrend(Array.isArray(revData) ? revData : revData?.data ?? []);
      setStats(statData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const chartData     = trend.map((m: any) => ({ month: m.month ?? '—', revenue: Number(m.revenue ?? 0) }));
  const filteredData  = selectedMonth === 'all' ? chartData : chartData.filter(d => d.month === selectedMonth);
  const totalRevenue  = chartData.reduce((s, m) => s + m.revenue, 0);
  const lastMonth     = chartData[chartData.length - 1]?.revenue ?? 0;
  const prevMonth     = chartData[chartData.length - 2]?.revenue ?? 0;
  const avgRevenue    = chartData.length ? Math.round(totalRevenue / chartData.length) : 0;
  const peakMonth     = chartData.reduce((best, m) => m.revenue > (best?.revenue ?? 0) ? m : best, chartData[0]);
  const momGrowth     = prevMonth > 0 ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100) : 0;
  const platformTotal = Number(stats?.totalRevenue ?? 0);

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const statCards = [
    {
      label:    'Total Platform Revenue',
      value:    fmt(platformTotal),
      sub:      'All time',
      icon:     IndianRupee,
      color:    'bg-primary/10 text-primary border-primary/20',
      badge:    null,
    },
    {
      label:    'This Month',
      value:    fmt(lastMonth),
      sub:      `vs ${fmt(prevMonth)} last month`,
      icon:     TrendingUp,
      color:    momGrowth >= 0 ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-rose-100 text-rose-600 border-rose-200',
      badge:    { val: `${momGrowth >= 0 ? '+' : ''}${momGrowth}%`, up: momGrowth >= 0 },
    },
    {
      label:    'Monthly Average',
      value:    fmt(avgRevenue),
      sub:      `Over ${chartData.length} months`,
      icon:     BarChart2,
      color:    'bg-violet-100 text-violet-600 border-violet-200',
      badge:    null,
    },
    {
      label:    'Peak Month',
      value:    peakMonth?.month ?? '—',
      sub:      peakMonth ? fmt(peakMonth.revenue) : '₹0',
      icon:     Calendar,
      color:    'bg-amber-100 text-amber-600 border-amber-200',
      badge:    null,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-primary" /> Revenue Reports
          </h1>
          <p className="text-text-secondary text-sm mt-1">Platform-wide revenue analytics and monthly breakdown</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors bg-white">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors bg-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="stat-card relative overflow-hidden">
              <div className={`w-12 h-12 rounded-xl ${s.color} border flex items-center justify-center flex-shrink-0`}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-text-primary font-display truncate">{loading ? '...' : s.value}</p>
                  {s.badge && !loading && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0 ${s.badge.up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {s.badge.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {s.badge.val}
                    </span>
                  )}
                </div>
                <p className="text-text-secondary text-xs">{s.label}</p>
                {s.sub && <p className="text-[11px] text-slate-400 mt-0.5">{loading ? '' : s.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── REVENUE CHART ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

        {/* Chart header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Monthly Revenue Trend
            </h2>
            <p className="text-text-secondary text-xs mt-0.5">Detailed monthly income breakdown</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Month filter */}
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none text-slate-600"
            >
              <option value="all">All Months</option>
              {chartData.map(d => (
                <option key={d.month} value={d.month}>{d.month}</option>
              ))}
            </select>

            {/* Chart type toggle */}
            <div className="flex border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${chartType === 'area' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${chartType === 'bar' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                Bar
              </button>
            </div>

            <span className="text-xs bg-rose-50 text-primary border border-rose-100 font-semibold px-3 py-1.5 rounded-xl">
              Total {fmt(filteredData.reduce((s, m) => s + m.revenue, 0))}
            </span>
          </div>
        </div>

        {/* Summary row for filtered data */}
        {!loading && filteredData.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-0.5">Period Total</p>
              <p className="text-lg font-bold text-slate-800">
                ₹{filteredData.reduce((s, m) => s + m.revenue, 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-0.5">Avg / Month</p>
              <p className="text-lg font-bold text-slate-800">
                ₹{Math.round(filteredData.reduce((s, m) => s + m.revenue, 0) / (filteredData.length || 1)).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
              <p className="text-[11px] text-rose-500 font-medium uppercase tracking-wide mb-0.5">Peak Month</p>
              <p className="text-lg font-bold text-rose-700">
                {filteredData.reduce((best, m) => m.revenue > (best?.revenue ?? 0) ? m : best, filteredData[0])?.month ?? '—'}
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        {loading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-slate-400 text-sm">No revenue data available</div>

        ) : selectedMonth !== 'all' ? (
          /* Single month — bar chart with all months, selected highlighted */
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="selGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#e11d48" stopOpacity={1} />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`}
              />
              <Tooltip content={<RevTooltip />} />
              <ReferenceLine
                y={avgRevenue} stroke="#94a3b8" strokeDasharray="4 4"
                label={{ value: 'Avg', position: 'right', fontSize: 10, fill: '#94a3b8' }}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={52} minPointSize={4}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.month === selectedMonth ? 'url(#selGrad)' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

        ) : chartType === 'bar' ? (
          /* All months — bar chart */
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={filteredData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#e11d48" stopOpacity={1} />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`}
              />
              <Tooltip content={<RevTooltip />} />
              <ReferenceLine
                y={avgRevenue} stroke="#94a3b8" strokeDasharray="4 4"
                label={{ value: 'Avg', position: 'right', fontSize: 10, fill: '#94a3b8' }}
              />
              <Bar dataKey="revenue" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={52} minPointSize={4} />
            </BarChart>
          </ResponsiveContainer>

        ) : (
          /* All months — area chart */
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={filteredData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e11d48" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`}
              />
              <Tooltip content={<RevTooltip />} />
              <ReferenceLine
                y={avgRevenue} stroke="#94a3b8" strokeDasharray="4 4"
                label={{ value: 'Avg', position: 'right', fontSize: 10, fill: '#94a3b8' }}
              />
              <Area
                type="monotone" dataKey="revenue"
                stroke="#e11d48" strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ fill: '#e11d48', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#e11d48', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── MONTHLY BREAKDOWN TABLE ── */}
      {!loading && chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" /> Monthly Breakdown
            </h3>
            <span className="text-xs text-slate-400">{chartData.length} months</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Month</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Revenue</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">vs Avg</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Share</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartData.map((m, i) => {
                  const share  = totalRevenue > 0 ? Math.round((m.revenue / totalRevenue) * 100) : 0;
                  const vsAvg  = avgRevenue > 0 ? Math.round(((m.revenue - avgRevenue) / avgRevenue) * 100) : 0;
                  const isPeak = m.month === peakMonth?.month;
                  return (
                    <tr key={i} className={`hover:bg-slate-50 transition-colors ${isPeak ? 'bg-rose-50/50' : ''}`}>
                      <td className="px-6 py-3 font-medium text-slate-700 flex items-center gap-2">
                        {m.month}
                        {isPeak && <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-full">Peak</span>}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-slate-800">
                        ₹{m.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`text-xs font-bold ${vsAvg >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {vsAvg >= 0 ? '+' : ''}{vsAvg}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-slate-500 text-xs font-medium">{share}%</td>
                      <td className="px-6 py-3 w-36">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-rose-400 rounded-full transition-all duration-500"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td className="px-6 py-3 font-bold text-slate-700">Total</td>
                  <td className="px-6 py-3 text-right font-bold text-primary">₹{totalRevenue.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3" />
                  <td className="px-6 py-3 text-right font-bold text-slate-700">100%</td>
                  <td className="px-6 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminRevenue;
