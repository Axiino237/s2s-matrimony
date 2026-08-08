import { useState, useEffect, useCallback } from 'react';
import { BarChart2, Users, TrendingUp, DollarSign, Download, Calendar, RefreshCw, PieChart, Activity, Phone } from 'lucide-react';
import { superAdminService } from '../../services/super-admin.service';

const REPORT_TYPES = [
  { id: 'registrations', label: 'User Registrations', icon: Users, color: 'from-primary to-primary-dark' },
  { id: 'revenue', label: 'Revenue & Payments', icon: DollarSign, color: 'from-amber-500 to-orange-500' },
  { id: 'active', label: 'Active Users', icon: Activity, color: 'from-emerald-500 to-teal-600' },
  { id: 'membership', label: 'Membership Sales', icon: TrendingUp, color: 'from-secondary to-secondary-dark' },
  { id: 'contacts', label: 'Contact View Usage', icon: Phone, color: 'from-rose-500 to-pink-600' },
  { id: 'distribution', label: 'Demographics', icon: PieChart, color: 'from-secondary-light to-secondary' },
];

// Simple bar chart component (CSS-based, no recharts dependency needed)
const BarChartSimple = ({ data, label }: { data: { name: string; value: number }[]; label: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{label}</p>
      <div className="flex items-end gap-2 h-32">
        {data.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] text-slate-500 font-medium">{item.value}</span>
            <div
              className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-md transition-all duration-500"
              style={{ height: `${(item.value / max) * 100}%`, minHeight: '4px' }}
            />
            <span className="text-[10px] text-slate-400 truncate max-w-full">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Donut chart SVG
const DonutChart = ({ segments }: { segments: { label: string; value: number; color: string }[] }) => {
  const safeSegments = Array.isArray(segments) ? segments : [];
  const rawTotal = safeSegments.reduce((s, seg) => s + (seg.value || 0), 0);
  const total = rawTotal || 1;
  let offset = 0;
  const r = 40;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        {rawTotal === 0 ? (
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="20" />
        ) : (
          safeSegments.map((seg, i) => {
            const pct = (seg.value || 0) / total;
            const dash = pct * circ;
            const el = (
              <circle
                key={i}
                cx="50" cy="50" r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })
        )}
      </svg>
      <div className="space-y-1.5">
        {safeSegments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs text-slate-600">{seg.label}</span>
            <span className="text-xs font-bold text-slate-800 ml-auto">
              {rawTotal > 0 ? `${Math.round(((seg.value || 0) / rawTotal) * 100)}%` : '0%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SuperAdminReports = () => {
  const [dateRange, setDateRange] = useState('30');
  const [activeReport, setActiveReport] = useState('registrations');
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminService.getReportsAnalytics();
      if (data) setLiveData(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const registrationData = [
    { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 }, { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 }, { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 }, { name: 'Sun', value: liveData?.totalRegistrations ?? 0 },
  ];
  const revenueData = [
    { name: 'Mon', value: 0 }, { name: 'Tue', value: 0 }, { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 }, { name: 'Fri', value: 0 }, { name: 'Sat', value: 0 }, { name: 'Sun', value: liveData?.totalRevenue ?? 0 },
  ];
  const genderSegments = [
    { label: 'Male', value: liveData?.demographics?.male ?? 0, color: '#7C3AED' },
    { label: 'Female', value: liveData?.demographics?.female ?? 0, color: '#EC4899' },
  ];
  const membershipSegments = [
    { label: 'Free', value: liveData?.membershipTiers?.free ?? 0, color: '#94a3b8' },
    { label: 'Silver', value: liveData?.membershipTiers?.silver ?? 0, color: '#64748b' },
    { label: 'Gold', value: liveData?.membershipTiers?.gold ?? 0, color: '#f59e0b' },
    { label: 'Elite', value: liveData?.membershipTiers?.elite ?? 0, color: '#06b6d4' },
  ];
  const religionSegments = [
    { label: 'Hindu', value: 1, color: '#f97316' },
    { label: 'Muslim', value: 0, color: '#10b981' },
    { label: 'Christian', value: 0, color: '#6366f1' },
    { label: 'Others', value: 0, color: '#94a3b8' },
  ];

  const kpis = [
    { label: 'Total Registrations', value: liveData ? String(liveData.totalRegistrations ?? 0) : '0', change: 'Live DB', up: true, icon: Users, color: 'bg-violet-50 text-violet-600' },
    { label: 'Total Revenue', value: liveData ? `₹${(liveData.totalRevenue ?? 0).toLocaleString('en-IN')}` : '₹0', change: 'Live DB', up: true, icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
    { label: 'Active Members', value: liveData ? String(liveData.activeMembers ?? 0) : '0', change: 'Live DB', up: true, icon: Activity, color: 'bg-green-50 text-green-600' },
    { label: 'Paid Members', value: liveData ? String(liveData.paidMembers ?? 0) : '0', change: 'Live DB', up: true, icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
    { label: 'Contact Views', value: liveData ? String(liveData.contactViews ?? 0) : '0', change: 'Live DB', up: true, icon: Phone, color: 'bg-rose-50 text-rose-600' },
    { label: 'Success Stories', value: liveData ? String(liveData.successStoriesCount ?? 0) : '0', change: 'Live DB', up: true, icon: BarChart2, color: 'bg-indigo-50 text-indigo-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary" /> Platform Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Complete platform analytics — registrations, revenue, demographics, and usage</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 1 year</option>
          </select>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={fetchReports} className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors" title="Refresh Live DB Stats">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`rounded-2xl p-4 border border-current/10 ${kpi.color}`}>
              <div className="flex items-start justify-between mb-2">
                <Icon className="w-5 h-5 opacity-70" />
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${kpi.up ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs font-medium opacity-70 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Registrations Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800">Daily Registrations</h3>
            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-medium">Last 7 days</span>
          </div>
          <BarChartSimple data={registrationData} label="New Users Per Day" />
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800">Daily Revenue (₹)</h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Last 7 days</span>
          </div>
          <BarChartSimple data={revenueData.map(d => ({ ...d, value: Math.round(d.value / 1000) }))} label="Revenue in ₹ (Thousands)" />
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Gender Distribution</h3>
          <DonutChart segments={genderSegments} />
        </div>

        {/* Membership Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Membership Tier Distribution</h3>
          <DonutChart segments={membershipSegments} />
        </div>

        {/* Religion Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Religion Distribution</h3>
          <DonutChart segments={religionSegments} />
        </div>

        {/* Profile Completion Stats */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Profile Completion</h3>
          <div className="space-y-3">
            {(() => {
              const comp100 = liveData?.profileCompletion?.c100 ?? 0;
              const comp70 = liveData?.profileCompletion?.c70 ?? 0;
              const comp40 = liveData?.profileCompletion?.c40 ?? 0;
              const compBelow40 = liveData?.profileCompletion?.cBelow40 ?? 0;
              const totalCompCount = comp100 + comp70 + comp40 + compBelow40;

              const stats = [
                { label: '100% Complete', count: comp100, pct: totalCompCount > 0 ? Math.round((comp100 / totalCompCount) * 100) : 0, color: 'bg-green-500' },
                { label: '70–99% Complete', count: comp70, pct: totalCompCount > 0 ? Math.round((comp70 / totalCompCount) * 100) : 0, color: 'bg-amber-400' },
                { label: '40–69% Complete', count: comp40, pct: totalCompCount > 0 ? Math.round((comp40 / totalCompCount) * 100) : 0, color: 'bg-orange-400' },
                { label: 'Below 40%', count: compBelow40, pct: totalCompCount > 0 ? Math.round((compBelow40 / totalCompCount) * 100) : 0, color: 'bg-rose-500' },
              ];

              return stats.map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{stat.label}</span>
                    <span className="font-bold text-slate-800">{stat.count.toLocaleString()} ({stat.pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${stat.color}`} style={{ width: `${stat.pct}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
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

export default SuperAdminReports;
