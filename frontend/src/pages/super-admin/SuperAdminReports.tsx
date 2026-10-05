import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  Users,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  RefreshCw,
  PieChart,
  Activity,
  Phone,
  FileSpreadsheet,
  FileText,
  File,
  Check,
  X,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { superAdminService } from '../../services/super-admin.service';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  getExportTimestamp,
  ColumnDef,
} from '../../utils/export.utils';

// Simple bar chart component (CSS-based)
const BarChartSimple = ({ data, label }: { data: { name: string; value: number }[]; label: string }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
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

  let accumulated = 0;
  const slices = safeSegments.map((seg) => {
    const pct = rawTotal > 0 ? ((seg.value || 0) / total) * 100 : 0;
    const startAngle = (accumulated / 100) * 360;
    accumulated += pct;
    return { ...seg, pct: Math.round(pct), startAngle };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="5" />
          {slices.map((slice, i) => {
            const strokeDasharray = `${slice.pct * 0.88} ${100 - slice.pct * 0.88}`;
            const strokeDashoffset = -slices.slice(0, i).reduce((s, x) => s + x.pct * 0.88, 0);
            return (
              <circle
                key={slice.label}
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke={slice.color}
                strokeWidth="5"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-slate-800">{rawTotal.toLocaleString()}</span>
          <span className="text-[9px] text-slate-400 font-medium">Total</span>
        </div>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {safeSegments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-slate-600 truncate">{seg.label}</span>
            </div>
            <span className="font-semibold text-slate-700 ml-2">
              {rawTotal > 0 ? Math.round(((seg.value || 0) / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ExportTarget {
  id: 'summary' | 'registrations' | 'sales' | 'revenue' | 'contacts';
  title: string;
  subtitle: string;
}

const SuperAdminReports = () => {
  const [dateRange, setDateRange] = useState('30');
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<ExportTarget | null>(null);
  const [modalFormat, setModalFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminService.getReportsAnalytics();
      if (data) setLiveData(data);
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const registrationData = [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 0 },
    { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 },
    { name: 'Fri', value: 0 },
    { name: 'Sat', value: 0 },
    { name: 'Sun', value: liveData?.totalRegistrations ?? 0 },
  ];
  const revenueData = [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 0 },
    { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 },
    { name: 'Fri', value: 0 },
    { name: 'Sat', value: 0 },
    { name: 'Sun', value: liveData?.totalRevenue ?? 0 },
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

  /**
   * Main export handler
   */
  const handleExport = async (
    type: 'summary' | 'registrations' | 'sales' | 'revenue' | 'contacts',
    format: 'excel' | 'csv' | 'pdf'
  ) => {
    const key = `${type}_${format}`;
    setExportingKey(key);
    const dateStamp = getExportTimestamp();

    try {
      if (type === 'summary') {
        // Platform Analytics Summary
        const summaryRows = [
          { category: 'Executive KPI', metric: 'Total Registrations', value: liveData?.totalRegistrations ?? 0, notes: 'Registered platform users' },
          { category: 'Executive KPI', metric: 'Total Revenue', value: `₹${(liveData?.totalRevenue ?? 0).toLocaleString('en-IN')}`, notes: 'Verified successful payments' },
          { category: 'Executive KPI', metric: 'Active Members', value: liveData?.activeMembers ?? 0, notes: 'Active status member profiles' },
          { category: 'Executive KPI', metric: 'Paid Members', value: liveData?.paidMembers ?? 0, notes: 'Members with active paid plans' },
          { category: 'Executive KPI', metric: 'Contact Views', value: liveData?.contactViews ?? 0, notes: 'Contact profile unlock requests' },
          { category: 'Executive KPI', metric: 'Success Stories', value: liveData?.successStoriesCount ?? 0, notes: 'Published verified marriages' },
          { category: 'Demographics', metric: 'Male Members', value: liveData?.demographics?.male ?? 0, notes: 'Demographic breakdown' },
          { category: 'Demographics', metric: 'Female Members', value: liveData?.demographics?.female ?? 0, notes: 'Demographic breakdown' },
          { category: 'Membership Tier', metric: 'Free Tier Members', value: liveData?.membershipTiers?.free ?? 0, notes: 'Basic complimentary plan' },
          { category: 'Membership Tier', metric: 'Silver Tier Members', value: liveData?.membershipTiers?.silver ?? 0, notes: 'Standard premium plan' },
          { category: 'Membership Tier', metric: 'Gold Tier Members', value: liveData?.membershipTiers?.gold ?? 0, notes: 'Advanced matchmaking plan' },
          { category: 'Membership Tier', metric: 'Elite Tier Members', value: liveData?.membershipTiers?.elite ?? 0, notes: 'VIP personalized plan' },
          { category: 'Profile Completion', metric: '100% Complete', value: liveData?.profileCompletion?.c100 ?? 0, notes: 'Full verification readiness' },
          { category: 'Profile Completion', metric: '70–99% Complete', value: liveData?.profileCompletion?.c70 ?? 0, notes: 'Near completion' },
          { category: 'Profile Completion', metric: '40–69% Complete', value: liveData?.profileCompletion?.c40 ?? 0, notes: 'Partial completion' },
          { category: 'Profile Completion', metric: 'Below 40%', value: liveData?.profileCompletion?.cBelow40 ?? 0, notes: 'Needs onboarding follow-up' },
        ];

        const headers: Record<string, string> = {
          category: 'Metric Category',
          metric: 'Indicator / Metric Name',
          value: 'Report Value',
          notes: 'Context & Scope',
        };

        const filename = `s2s_platform_reports_summary_${dateRange}d_${dateStamp}`;

        if (format === 'csv') {
          exportToCSV(summaryRows, filename, headers);
          toast.success('Platform summary exported as CSV!');
        } else if (format === 'excel') {
          exportToExcel(summaryRows, filename, 'Platform Summary', headers);
          toast.success('Platform summary exported as Excel!');
        } else {
          const pdfCols: ColumnDef[] = [
            { header: 'Category', dataKey: 'category' },
            { header: 'Indicator / Metric Name', dataKey: 'metric' },
            { header: 'Value', dataKey: 'value' },
            { header: 'Context & Scope', dataKey: 'notes' },
          ];
          exportToPDF(
            'S2S Platform Analytics & Executive KPI Report',
            pdfCols,
            summaryRows,
            filename,
            { subtitle: `Reporting Window: Last ${dateRange} Days` }
          );
          toast.success('Platform summary exported as PDF!');
        }
        return;
      }

      // Fetch detailed report records from backend
      toast.loading(`Fetching ${type} report records...`, { id: 'report-fetch' });
      const rawData = await superAdminService.getReportExportData(type, Number(dateRange) || 30);
      toast.dismiss('report-fetch');

      const data = Array.isArray(rawData) ? rawData : [];

      if (data.length === 0) {
        toast.error(`No records found for ${type} in the selected period.`);
        return;
      }

      if (type === 'registrations') {
        const headers: Record<string, string> = {
          userId: 'User ID',
          name: 'Member Name',
          email: 'Email',
          phone: 'Phone',
          gender: 'Gender',
          maritalStatus: 'Marital Status',
          religion: 'Religion',
          caste: 'Caste',
          membershipTier: 'Plan Tier',
          profileStatus: 'Status',
          profileCompletion: 'Completion',
          emailVerified: 'Email Verified',
          phoneVerified: 'Phone Verified',
          registeredAt: 'Registered Date',
        };

        const filename = `user_registrations_report_${dateStamp}`;

        if (format === 'csv') {
          exportToCSV(data, filename, headers);
        } else if (format === 'excel') {
          exportToExcel(data, filename, 'Registrations', headers);
        } else {
          const pdfCols: ColumnDef[] = [
            { header: 'Member Name', dataKey: 'name' },
            { header: 'Email', dataKey: 'email' },
            { header: 'Phone', dataKey: 'phone' },
            { header: 'Gender', dataKey: 'gender' },
            { header: 'Religion/Caste', dataKey: 'religion' },
            { header: 'Plan', dataKey: 'membershipTier' },
            { header: 'Status', dataKey: 'profileStatus' },
            { header: 'Completion', dataKey: 'profileCompletion' },
          ];
          exportToPDF('User Registrations Audit Report', pdfCols, data, filename, {
            subtitle: `Total Registrations: ${data.length} • Window: Last ${dateRange} Days`,
            orientation: 'landscape',
          });
        }
        toast.success(`Exported ${data.length} user registrations as ${format.toUpperCase()}!`);
      } else if (type === 'sales') {
        const headers: Record<string, string> = {
          paymentId: 'Payment ID',
          orderId: 'Order ID',
          customerName: 'Customer Name',
          customerEmail: 'Email',
          customerPhone: 'Phone',
          planId: 'Plan Tier',
          amount: 'Amount (INR)',
          currency: 'Currency',
          status: 'Payment Status',
          method: 'Method',
          gatewayTxnId: 'Gateway Txn Ref',
          createdAt: 'Transaction Date',
        };

        const filename = `membership_sales_report_${dateStamp}`;

        if (format === 'csv') {
          exportToCSV(data, filename, headers);
        } else if (format === 'excel') {
          exportToExcel(data, filename, 'Membership Sales', headers);
        } else {
          const pdfCols: ColumnDef[] = [
            { header: 'Order Ref', dataKey: 'orderId' },
            { header: 'Customer', dataKey: 'customerName' },
            { header: 'Email', dataKey: 'customerEmail' },
            { header: 'Plan', dataKey: 'planId' },
            { header: 'Amount (₹)', dataKey: 'amount' },
            { header: 'Status', dataKey: 'status' },
            { header: 'Method', dataKey: 'method' },
          ];
          exportToPDF('Membership Sales & Orders Report', pdfCols, data, filename, {
            subtitle: `Total Transactions: ${data.length} • Window: Last ${dateRange} Days`,
            orientation: 'landscape',
          });
        }
        toast.success(`Exported ${data.length} membership sales orders as ${format.toUpperCase()}!`);
      } else if (type === 'revenue') {
        const headers: Record<string, string> = {
          transactionId: 'Transaction ID',
          date: 'Date & Time',
          customerName: 'Customer Name',
          plan: 'Membership Plan',
          grossRevenue: 'Gross Revenue (INR)',
          estimatedFee: 'Gateway Fee (INR)',
          netRevenue: 'Net Revenue (INR)',
          status: 'Status',
        };

        const filename = `revenue_analytics_report_${dateStamp}`;

        if (format === 'csv') {
          exportToCSV(data, filename, headers);
        } else if (format === 'excel') {
          exportToExcel(data, filename, 'Revenue Report', headers);
        } else {
          const pdfCols: ColumnDef[] = [
            { header: 'Customer', dataKey: 'customerName' },
            { header: 'Plan', dataKey: 'plan' },
            { header: 'Gross (₹)', dataKey: 'grossRevenue' },
            { header: 'Est. Fee (₹)', dataKey: 'estimatedFee' },
            { header: 'Net (₹)', dataKey: 'netRevenue' },
            { header: 'Status', dataKey: 'status' },
          ];
          exportToPDF('Financial Revenue Breakdown Report', pdfCols, data, filename, {
            subtitle: `Financial Window: Last ${dateRange} Days`,
          });
        }
        toast.success(`Exported revenue analytics as ${format.toUpperCase()}!`);
      } else if (type === 'contacts') {
        const headers: Record<string, string> = {
          id: 'Log ID',
          unlockedBy: 'Viewing Member',
          unlockedByEmail: 'Viewer Email',
          targetProfileName: 'Target Profile',
          targetProfileId: 'Target Profile ID',
          unlockedAt: 'Unlocked Date & Time',
          status: 'Status',
        };

        const filename = `contact_views_usage_report_${dateStamp}`;

        if (format === 'csv') {
          exportToCSV(data, filename, headers);
        } else if (format === 'excel') {
          exportToExcel(data, filename, 'Contact Unlocks', headers);
        } else {
          const pdfCols: ColumnDef[] = [
            { header: 'Log ID', dataKey: 'id' },
            { header: 'Viewing Member', dataKey: 'unlockedBy' },
            { header: 'Viewer Email', dataKey: 'unlockedByEmail' },
            { header: 'Target Member', dataKey: 'targetProfileName' },
            { header: 'Target ID', dataKey: 'targetProfileId' },
            { header: 'Status', dataKey: 'status' },
          ];
          exportToPDF('Contact View & Unlock Usage Report', pdfCols, data, filename, {
            subtitle: `Activity Window: Last ${dateRange} Days`,
          });
        }
        toast.success(`Exported contact usage logs as ${format.toUpperCase()}!`);
      }
    } catch (err: any) {
      console.error('Report export error:', err);
      toast.error('Failed to export report. Please try again.');
    } finally {
      setExportingKey(null);
      setModalTarget(null);
    }
  };

  const REPORT_CARDS: { id: 'registrations' | 'sales' | 'revenue' | 'contacts'; title: string }[] = [
    { id: 'registrations', title: 'User Registrations' },
    { id: 'sales', title: 'Membership Sales' },
    { id: 'revenue', title: 'Revenue Report' },
    { id: 'contacts', title: 'Contact View Usage' },
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
        <div className="flex items-center gap-2 relative">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 1 year</option>
          </select>

          {/* Top Export Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              {exportingKey?.startsWith('summary') ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <Download className="w-4 h-4 text-primary" />
              )}
              Export
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isHeaderMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Platform Summary
                </div>
                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    handleExport('summary', 'excel');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel Workbook (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    handleExport('summary', 'csv');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>CSV File (.csv)</span>
                </button>
                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    handleExport('summary', 'pdf');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  <File className="w-4 h-4 text-rose-600" />
                  <span>PDF Document (.pdf)</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={fetchReports}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors bg-white shadow-sm"
            title="Refresh Live DB Stats"
          >
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
          <BarChartSimple data={revenueData.map((d) => ({ ...d, value: Math.round(d.value / 1000) }))} label="Revenue in ₹ (Thousands)" />
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
                    <span className="font-bold text-slate-800">
                      {stat.count.toLocaleString()} ({stat.pct}%)
                    </span>
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

      {/* Export Reports Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" /> Export Reports
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REPORT_CARDS.map((card) => {
            const isCardBusy = exportingKey?.startsWith(card.id);
            return (
              <div
                key={card.id}
                className="flex flex-col p-4 border border-slate-200 rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group bg-gradient-to-b from-white to-slate-50/50"
              >
                {/* Card Title & Icon */}
                <div
                  onClick={() => setModalTarget({ id: card.id, title: card.title, subtitle: `Detailed ${card.title} report for last ${dateRange} days` })}
                  className="flex flex-col items-center gap-2 cursor-pointer mb-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {isCardBusy ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 text-center group-hover:text-primary transition-colors">
                    {card.title}
                  </span>
                  <span className="text-[10px] text-slate-400">Click to configure or export below</span>
                </div>

                {/* Direct 1-Click Format Badges */}
                <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-100 mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(card.id, 'excel');
                    }}
                    disabled={isCardBusy}
                    title="Export as Excel"
                    className="flex-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:scale-105 transition-all text-center"
                  >
                    Excel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(card.id, 'csv');
                    }}
                    disabled={isCardBusy}
                    title="Export as CSV"
                    className="flex-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 hover:scale-105 transition-all text-center"
                  >
                    CSV
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(card.id, 'pdf');
                    }}
                    disabled={isCardBusy}
                    title="Export as PDF"
                    className="flex-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 hover:scale-105 transition-all text-center"
                  >
                    PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Configuration Modal */}
      {modalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{modalTarget.title}</h3>
                  <p className="text-xs text-slate-500">Configure report generation parameters</p>
                </div>
              </div>
              <button
                onClick={() => setModalTarget(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">Reporting Window</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '7 Days', val: '7' },
                  { label: '30 Days', val: '30' },
                  { label: '90 Days', val: '90' },
                  { label: '1 Year', val: '365' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setDateRange(item.val)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      dateRange === item.val
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">Choose Format</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'excel' as const,
                    name: 'Excel',
                    ext: '.xlsx',
                    icon: FileSpreadsheet,
                    color: 'text-emerald-600',
                    borderActive: 'border-emerald-500 bg-emerald-50/50',
                  },
                  {
                    id: 'csv' as const,
                    name: 'CSV',
                    ext: '.csv',
                    icon: FileText,
                    color: 'text-blue-600',
                    borderActive: 'border-blue-500 bg-blue-50/50',
                  },
                  {
                    id: 'pdf' as const,
                    name: 'PDF',
                    ext: '.pdf',
                    icon: File,
                    color: 'text-rose-600',
                    borderActive: 'border-rose-500 bg-rose-50/50',
                  },
                ].map((fmt) => {
                  const Icon = fmt.icon;
                  const isActive = modalFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setModalFormat(fmt.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        isActive
                          ? `${fmt.borderActive} shadow-sm`
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${fmt.color}`} />
                      <span className="text-xs font-bold text-slate-800">{fmt.name}</span>
                      <span className="text-[10px] text-slate-400">{fmt.ext}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExport(modalTarget.id, modalFormat)}
                disabled={exportingKey !== null}
                className="flex-[2] py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exportingKey ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download {modalFormat.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminReports;
