import { useState, useEffect, useCallback } from 'react';
import {
  Globe, DollarSign, Users, Layers, Loader2, TrendingUp,
  BarChart2, Download, RefreshCw, Activity, Phone, CheckCircle2, Crown
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { superAdminService } from '../../services/super-admin.service';

// ─── Custom Tooltip for Revenue Area Chart ────────────────────────────────────
const RevTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs font-bold text-slate-700 mb-1">{label}</p>
      <p className="text-sm font-bold text-primary">₹{Number(payload[0]?.value || 0).toLocaleString('en-IN')}</p>
    </div>
  );
};

// ─── Custom Tooltip for Bar Charts ───────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs font-bold text-slate-700 mb-1">{label}</p>
      <p className="text-sm font-bold text-violet-600">{payload[0]?.value} users</p>
    </div>
  );
};

// ─── Custom Tooltip for Pie Charts ───────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs font-bold text-slate-700">{payload[0]?.name}</p>
      <p className="text-sm font-bold" style={{ color: payload[0]?.payload?.fill }}>
        {payload[0]?.value} ({payload[0]?.payload?.pct}%)
      </p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SuperAdminDashboard = () => {
  const [stats,     setStats]     = useState<any>(null);
  const [liveData,  setLiveData]  = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [revenueMonthFilter, setRevenueMonthFilter] = useState('all');

  const fmt = (n: number) =>
    n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` :
    n >= 100000   ? `₹${(n / 100000).toFixed(1)}L`    :
    n >= 1000     ? `${(n / 1000).toFixed(1)}K`        : String(n);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        superAdminService.getGlobalStats().catch(() => null),
        superAdminService.getReportsAnalytics().catch(() => null),
      ]);
      if (s) setStats(s);
      if (r) setLiveData(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Section 1: Top overview cards ──────────────────────────────────────────
  const overviewCards = [
    { icon: Globe,      label: 'Total Communities', value: loading ? '...' : String(stats?.totalCommunities ?? '—'), color: 'bg-blue-100 text-blue-600 border-blue-200' },
    { icon: DollarSign, label: 'Total Revenue',     value: loading ? '...' : fmt(Number(stats?.totalRevenue ?? 0)), color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
    { icon: Users,      label: 'Total Users',       value: loading ? '...' : fmt(Number(stats?.totalUsers ?? 0)),   color: 'bg-primary/10 text-primary border-primary/20' },
    { icon: Layers,     label: 'Total Admins',      value: loading ? '...' : String(stats?.totalAdmins ?? '—'),     color: 'bg-amber-100 text-amber-600 border-amber-200' },
  ];

  // ── Section 3: Breakdown cards (no Revenue duplicate) ──────────────────────
  const analyticsCards = [
    { icon: Activity,     label: 'Active Members',  value: liveData ? String(liveData.activeMembers   ?? 0) : '—', color: 'bg-green-100 text-green-600 border-green-200' },
    { icon: Crown,        label: 'Paid Members',    value: liveData ? String(liveData.paidMembers     ?? 0) : '—', color: 'bg-violet-100 text-violet-600 border-violet-200' },
    { icon: Phone,        label: 'Contact Views',   value: liveData ? String(liveData.contactViews    ?? 0) : '—', color: 'bg-rose-100 text-rose-600 border-rose-200' },
    { icon: CheckCircle2, label: 'Success Stories', value: liveData ? String(liveData.successStoriesCount ?? 0) : '—', color: 'bg-teal-100 text-teal-600 border-teal-200' },
  ];

  // ── Monthly Revenue AreaChart data ─────────────────────────────────────────
  const monthlyChartData = (stats?.monthlyRevenue ?? []).map((m: any) => ({
    month: m.month,
    revenue: Number(m.revenue || 0),
  }));

  // Filtered by selected month (or all)
  const filteredMonthlyData = revenueMonthFilter === 'all'
    ? monthlyChartData
    : monthlyChartData.filter((m: any) => m.month === revenueMonthFilter);

  // ── Daily Registrations BarChart data ──────────────────────────────────────
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const registrationData = days.map((name, i) => ({
    name,
    users: i === 6 ? (liveData?.totalRegistrations ?? 0) : 0,
  }));

  // ── Daily Revenue BarChart data ────────────────────────────────────────────
  const revenueBarData = days.map((name, i) => ({
    name,
    revenue: i === 6 ? Number(liveData?.totalRevenue ?? 0) : 0,
  }));

  // ── PieChart data helpers ──────────────────────────────────────────────────
  const makePie = (segs: { label: string; value: number; color: string }[]) => {
    const total = segs.reduce((s, x) => s + x.value, 0) || 1;
    return segs.map(s => ({
      name: s.label, value: s.value, fill: s.color,
      pct: Math.round((s.value / total) * 100),
    }));
  };

  const genderPie = makePie([
    { label: 'Male',   value: liveData?.demographics?.male   ?? 0, color: '#7C3AED' },
    { label: 'Female', value: liveData?.demographics?.female ?? 0, color: '#EC4899' },
  ]);
  const membershipPie = makePie([
    { label: 'Free',   value: liveData?.membershipTiers?.free   ?? 0, color: '#94a3b8' },
    { label: 'Silver', value: liveData?.membershipTiers?.silver ?? 0, color: '#64748b' },
    { label: 'Gold',   value: liveData?.membershipTiers?.gold   ?? 0, color: '#f59e0b' },
    { label: 'Elite',  value: liveData?.membershipTiers?.elite  ?? 0, color: '#06b6d4' },
  ]);
  const religionPie = makePie([
    { label: 'Hindu',     value: 1, color: '#f97316' },
    { label: 'Muslim',    value: 0, color: '#10b981' },
    { label: 'Christian', value: 0, color: '#6366f1' },
    { label: 'Others',    value: 0, color: '#94a3b8' },
  ]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7 animate-fade-in">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" /> Super Admin Dashboard
          </h1>
          <p className="text-text-secondary text-sm mt-1">Global platform overview, analytics, and control center</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 1 year</option>
          </select>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors bg-white">
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={fetchAll}
            title="Refresh"
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors bg-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── SECTION 1: OVERVIEW STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((s, i) => {
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

      {/* ── SECTION 2: MONTHLY REVENUE AREA CHART ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Monthly Revenue Trend
            </h2>
            <p className="text-text-secondary text-xs mt-0.5">Platform revenue performance over recent months</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Month filter */}
            <select
              value={revenueMonthFilter}
              onChange={e => setRevenueMonthFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none text-slate-600"
            >
              <option value="all">All Months</option>
              {(stats?.monthlyRevenue ?? []).map((m: any) => (
                <option key={m.month} value={m.month}>{m.month}</option>
              ))}
            </select>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4% YoY
            </span>
          </div>
        </div>

        {/* Total / Avg / Peak summary row */}
        {!loading && filteredMonthlyData.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-0.5">Total Revenue</p>
              <p className="text-lg font-bold text-slate-800">
                ₹{filteredMonthlyData.reduce((s: number, m: any) => s + Number(m.revenue || 0), 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-0.5">Avg / Month</p>
              <p className="text-lg font-bold text-slate-800">
                ₹{Math.round(filteredMonthlyData.reduce((s: number, m: any) => s + Number(m.revenue || 0), 0) / (filteredMonthlyData.length || 1)).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
              <p className="text-[11px] text-rose-500 font-medium uppercase tracking-wide mb-0.5">Peak Month</p>
              <p className="text-lg font-bold text-rose-700">
                {filteredMonthlyData.reduce((best: any, m: any) => Number(m.revenue) > Number(best?.revenue ?? 0) ? m : best, filteredMonthlyData[0])?.month ?? '—'}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>

        ) : filteredMonthlyData.length === 1 ? (
          /* ── Single month: Bar chart with all months, selected one highlighted ── */
          (() => {
            const selectedMonth = filteredMonthlyData[0].month;
            const rev           = Number(filteredMonthlyData[0].revenue || 0);
            const allTotal      = monthlyChartData.reduce((s: number, x: any) => s + Number(x.revenue || 0), 0);
            const allAvg        = Math.round(allTotal / (monthlyChartData.length || 1));
            const vsAvg         = allAvg > 0 ? Math.round(((rev - allAvg) / allAvg) * 100) : 0;

            return (
              <div>
                {/* Mini stat row */}
                <div className="flex items-center justify-center gap-8 mb-4 pb-4 border-b border-slate-100">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-0.5">{selectedMonth}</p>
                    <p className="text-xl font-bold text-primary">₹{rev.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Platform Avg</p>
                    <p className="text-xl font-bold text-slate-600">₹{allAvg.toLocaleString('en-IN')}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${vsAvg >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                    <TrendingUp className={`w-3.5 h-3.5 ${vsAvg < 0 ? 'rotate-180' : ''}`} />
                    {vsAvg >= 0 ? '+' : ''}{vsAvg}% vs avg
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-0.5">Share of Total</p>
                    <p className="text-xl font-bold text-slate-600">
                      {allTotal > 0 ? Math.round((rev / allTotal) * 100) : 0}%
                    </p>
                  </div>
                </div>

                {/* Bar chart — all months shown, selected month highlighted in red */}
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48} minPointSize={4}>
                      {monthlyChartData.map((entry: any, i: number) => (
                        <Cell
                          key={i}
                          fill={entry.month === selectedMonth ? 'url(#selGrad)' : '#e2e8f0'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()

        ) : (
          /* ── Multiple months: show Area Chart ── */
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={filteredMonthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e11d48" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`}
              />
              <Tooltip content={<RevTooltip />} />
              <Area
                type="monotone" dataKey="revenue"
                stroke="#e11d48" strokeWidth={2.5}
                fill="url(#revGradient)"
                dot={{ fill: '#e11d48', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#e11d48', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── SECTION 3: BREAKDOWN STAT CARDS ── */}
      <div>
        <h2 className="font-display text-base font-bold text-text-primary flex items-center gap-2 mb-3">
          <BarChart2 className="w-4 h-4 text-primary" /> Platform Breakdown
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsCards.map((s, i) => {
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
      </div>

      {/* ── SECTION 4: ACTIVITY CHARTS ── */}
      <div>
        <h2 className="font-display text-base font-bold text-text-primary flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" /> Activity & Demographics
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Daily Registrations Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-sm">Daily Registrations</h3>
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-medium">Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={registrationData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#7C3AED" stopOpacity={1} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="users" fill="url(#regGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Revenue Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-sm">Daily Revenue (₹)</h3>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueBarData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="revBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f59e0b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}`}
                />
                <Tooltip
                  formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  cursor={{ fill: '#fefce8' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="url(#revBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Distribution Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-5">Gender Distribution</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={genderPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    dataKey="value" stroke="none" paddingAngle={2}>
                    {genderPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {genderPie.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.fill }} />
                    <span className="text-sm text-slate-600 flex-1">{seg.name}</span>
                    <span className="text-sm font-bold text-slate-800">{seg.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Membership Tier Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-5">Membership Tier Distribution</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={membershipPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    dataKey="value" stroke="none" paddingAngle={2}>
                    {membershipPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {membershipPie.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.fill }} />
                    <span className="text-sm text-slate-600 flex-1">{seg.name}</span>
                    <span className="text-sm font-bold text-slate-800">{seg.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Religion Distribution Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-5">Religion Distribution</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={religionPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    dataKey="value" stroke="none" paddingAngle={2}>
                    {religionPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {religionPie.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.fill }} />
                    <span className="text-sm text-slate-600 flex-1">{seg.name}</span>
                    <span className="text-sm font-bold text-slate-800">{seg.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Completion Progress Bars */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-5">Profile Completion</h3>
            <div className="space-y-4">
              {(() => {
                const c100  = liveData?.profileCompletion?.c100     ?? 0;
                const c70   = liveData?.profileCompletion?.c70      ?? 0;
                const c40   = liveData?.profileCompletion?.c40      ?? 0;
                const cLow  = liveData?.profileCompletion?.cBelow40 ?? 0;
                const total = c100 + c70 + c40 + cLow || 1;
                return [
                  { label: '100% Complete',   count: c100, pct: Math.round((c100 / total) * 100), color: 'bg-green-500' },
                  { label: '70–99% Complete', count: c70,  pct: Math.round((c70  / total) * 100), color: 'bg-amber-400' },
                  { label: '40–69% Complete', count: c40,  pct: Math.round((c40  / total) * 100), color: 'bg-orange-400' },
                  { label: 'Below 40%',       count: cLow, pct: Math.round((cLow / total) * 100), color: 'bg-rose-500' },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 font-medium">{stat.label}</span>
                      <span className="font-bold text-slate-800">{stat.count.toLocaleString()} <span className="text-slate-400 font-normal">({stat.pct}%)</span></span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${stat.color}`} style={{ width: `${stat.pct}%` }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

        </div>
      </div>

      {/* ── SECTION 5: EXPORT ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" /> Export Reports
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['User Registrations', 'Membership Sales', 'Revenue Report', 'Contact View Usage'].map(r => (
            <button
              key={r}
              className="flex flex-col items-center gap-2 p-4 border border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <Download className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-slate-600 text-center">{r}</span>
              <span className="text-[10px] text-slate-400">CSV / Excel / PDF</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboard;
