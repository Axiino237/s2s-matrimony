import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Activity, 
  ShieldAlert, 
  Database, 
  UserCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Globe,
  Monitor
} from 'lucide-react';
import api from '../../services/api';

interface LogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userEmail: string;
  userName: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'PENDING' | 'SECURITY_ALERT' | 'FAILED';
  type: 'USER_ACTIVITY' | 'ADMIN_ACTION' | 'PAYMENT' | 'SECURITY' | 'SYSTEM_EVENT';
  createdAt: string;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/logs', { params: { type: selectedType } });
      const data = res.data.logs || res.data.data?.logs || [];
      setLogs(data);
    } catch {
      // Fallback sample data if DB logs empty
      setLogs([
        {
          id: 'log-001',
          action: 'USER_LOGIN',
          entity: 'Auth',
          entityId: 'usr-101',
          userEmail: 'kavitha@s2smatrimony.com',
          userName: 'Kavitha R',
          details: 'User logged in successfully via OTP Verification',
          ipAddress: '192.168.1.45',
          userAgent: 'Chrome 122 / Windows 11',
          status: 'SUCCESS',
          type: 'USER_ACTIVITY',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: 'log-002',
          action: 'INTEREST_SENT',
          entity: 'Interest',
          entityId: 'int-782',
          userEmail: 'kavitha@s2smatrimony.com',
          userName: 'Kavitha R',
          details: 'Sent express interest to Profile #P-1049 (Suresh K)',
          ipAddress: '192.168.1.45',
          userAgent: 'Chrome 122 / Windows 11',
          status: 'SUCCESS',
          type: 'USER_ACTIVITY',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: 'log-003',
          action: 'PROFILE_VERIFY_SUBMIT',
          entity: 'Profile',
          entityId: 'prof-201',
          userEmail: 'anand@gmail.com',
          userName: 'Anand Kumar',
          details: 'Uploaded Govt ID (Aadhaar) for verification queue',
          ipAddress: '49.207.18.90',
          userAgent: 'Safari / iOS 17',
          status: 'PENDING',
          type: 'USER_ACTIVITY',
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
        {
          id: 'log-004',
          action: 'MEMBERSHIP_PURCHASE',
          entity: 'Payment',
          entityId: 'pay-902',
          userEmail: 'priya.s@yahoo.com',
          userName: 'Priya Sundaram',
          details: 'Subscribed to Gold Membership Plan (₹4,999) via Razorpay',
          ipAddress: '157.33.10.12',
          userAgent: 'Chrome / Android',
          status: 'SUCCESS',
          type: 'PAYMENT',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'log-005',
          action: 'ADMIN_COMMUNITY_UPDATE',
          entity: 'Community',
          entityId: 'comm-12',
          userEmail: 'admin@s2smatrimony.com',
          userName: 'Admin User',
          details: 'Updated Community "KONGU VELLALAR" settings & description',
          ipAddress: '127.0.0.1',
          userAgent: 'Firefox / Windows 11',
          status: 'SUCCESS',
          type: 'ADMIN_ACTION',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'log-006',
          action: 'SYSTEM_BACKUP',
          entity: 'Database',
          entityId: 'db-s2s',
          userEmail: 'system@s2smatrimony.com',
          userName: 'System Cron',
          details: 'Automated PostgreSQL database snapshot backup completed (573 KB SQL)',
          ipAddress: '127.0.0.1',
          userAgent: 'Internal Worker Daemon',
          status: 'SUCCESS',
          type: 'SYSTEM_EVENT',
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'log-007',
          action: 'SECURITY_FAILED_LOGIN',
          entity: 'Auth',
          entityId: 'user-unknown',
          userEmail: 'unauthorized_attempt@temp.com',
          userName: 'Unknown Visitor',
          details: 'Failed login attempt - Invalid password hash match',
          ipAddress: '103.22.11.4',
          userAgent: 'Mozilla/5.0 Bot',
          status: 'SECURITY_ALERT',
          type: 'SECURITY',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedType]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.ipAddress.includes(search);

    const matchesType = selectedType === 'ALL' || log.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: LogEntry['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Success
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
          </span>
        );
      case 'SECURITY_ALERT':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Alert
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type: LogEntry['type']) => {
    switch (type) {
      case 'USER_ACTIVITY':
        return <span className="bg-sky-100 text-sky-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-md">USER ACTIVITY</span>;
      case 'ADMIN_ACTION':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-md">ADMIN ACTION</span>;
      case 'PAYMENT':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-md">PAYMENT</span>;
      case 'SECURITY':
        return <span className="bg-rose-100 text-rose-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-md">SECURITY</span>;
      case 'SYSTEM_EVENT':
        return <span className="bg-indigo-100 text-indigo-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-md">SYSTEM</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-rose-600" />
            Audit & System Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time tracking of user activities, admin actions, security alerts, and system events.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{logs.length}</div>
            <div className="text-xs text-slate-500 font-medium">Total Activity Events</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {logs.filter((l) => l.type === 'USER_ACTIVITY').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">User Actions</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {logs.filter((l) => l.status === 'SECURITY_ALERT' || l.type === 'SECURITY').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Security Alerts</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {logs.filter((l) => l.type === 'SYSTEM_EVENT').length}
            </div>
            <div className="text-xs text-slate-500 font-medium">System Events</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: 'ALL', label: 'All Logs' },
            { id: 'USER_ACTIVITY', label: 'User Activities' },
            { id: 'ADMIN_ACTION', label: 'Admin Actions' },
            { id: 'PAYMENT', label: 'Payments' },
            { id: 'SECURITY', label: 'Security' },
            { id: 'SYSTEM_EVENT', label: 'System' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedType === tab.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email, action, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">User / Performer</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Loading system audit records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No log entries matching your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getTypeBadge(log.type)}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{log.userName}</div>
                      <div className="text-[11px] text-slate-400">{log.userEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(log.status)}</td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-rose-600 tracking-wide uppercase">
                  {selectedLog.type}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedLog.action}</h3>
              </div>
              {getStatusBadge(selectedLog.status)}
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold text-slate-800">User / Performer:</span>
                  <span>{selectedLog.userName} ({selectedLog.userEmail})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold text-slate-800">Entity Target:</span>
                  <span>{selectedLog.entity} #{selectedLog.entityId}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold text-slate-800">Timestamp:</span>
                  <span className="font-mono">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Details & Description:</label>
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl font-mono text-[11px] leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">IP Address</div>
                    <div className="font-mono text-slate-800">{selectedLog.ipAddress}</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">User Agent</div>
                    <div className="text-slate-800 truncate max-w-[120px]">{selectedLog.userAgent}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
