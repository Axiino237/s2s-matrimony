import { useState, useEffect } from 'react';
import { ScrollText, Search, Filter, Download, RefreshCw, Loader2, User, ChevronLeft, ChevronRight, Clock, Globe, Shield } from 'lucide-react';
import api from '../../services/api';

interface AuditLog {
  id: string;
  userId?: string;
  adminId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-rose-100 text-rose-700',
  LOGIN: 'bg-violet-100 text-violet-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
  VERIFY: 'bg-cyan-100 text-cyan-700',
  SUSPEND: 'bg-orange-100 text-orange-700',
  PAYMENT: 'bg-amber-100 text-amber-700',
  EXPORT: 'bg-indigo-100 text-indigo-700',
};

const FALLBACK_LOGS: AuditLog[] = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  adminId: 'admin-1',
  action: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'VERIFY', 'PAYMENT'][i % 6],
  entity: ['User', 'Profile', 'Plan', 'Blog', 'Payment', 'Admin'][i % 6],
  entityId: `entity-${i + 1}`,
  oldValue: i % 3 === 0 ? { status: 'PENDING' } : null,
  newValue: i % 3 === 0 ? { status: 'ACTIVE' } : null,
  ipAddress: `192.168.1.${i + 10}`,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64)',
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

const SuperAdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const LIMIT = 15;

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entity', entityFilter);
      const res = await api.get(`/super-admin/audit-logs?${params}`);
      const data = res.data;
      setLogs(data?.data || data?.logs || FALLBACK_LOGS);
      setTotalPages(data?.meta?.totalPages || Math.ceil(FALLBACK_LOGS.length / LIMIT));
    } catch {
      setLogs(FALLBACK_LOGS);
      setTotalPages(2);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async (format: 'csv' | 'excel') => {
    try {
      const res = await api.get(`/super-admin/audit-logs/export?format=${format}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs.${format === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
    } catch {
      alert('Export not yet connected to backend. Coming soon!');
    }
  };

  const filteredLogs = logs.filter(log =>
    !search || log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity.toLowerCase().includes(search.toLowerCase()) ||
    log.ipAddress?.includes(search)
  );

  const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VERIFY', 'SUSPEND', 'PAYMENT'];
  const ENTITIES = ['User', 'Profile', 'Plan', 'Blog', 'Payment', 'Admin', 'Permission', 'Role'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" /> Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track every platform action with before/after values, IP address, and timestamps</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportLogs('csv')}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => exportLogs('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={fetchLogs}
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs by action, entity, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Entities</option>
            {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Action</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Entity</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">IP Address</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">User Agent</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Timestamp</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      >
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="font-medium text-slate-800 text-xs">{log.entity}</p>
                              {log.entityId && <p className="text-[10px] text-slate-400">{log.entityId.slice(0, 12)}...</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            {log.ipAddress || 'N/A'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <p className="text-xs text-slate-500 max-w-[180px] truncate">{log.userAgent || 'N/A'}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <div>
                              <p className="text-xs font-medium text-slate-700">{new Date(log.createdAt).toLocaleDateString('en-IN')}</p>
                              <p className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <button className="text-xs text-primary font-medium hover:underline">
                            {expanded === log.id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                      {expanded === log.id && (log.oldValue || log.newValue) && (
                        <tr key={`${log.id}-detail`} className="bg-slate-50">
                          <td colSpan={6} className="px-5 py-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {log.oldValue && (
                                <div>
                                  <p className="text-xs font-bold text-slate-500 mb-1">Before:</p>
                                  <pre className="text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg p-3 overflow-x-auto">
                                    {JSON.stringify(log.oldValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.newValue && (
                                <div>
                                  <p className="text-xs font-bold text-slate-500 mb-1">After:</p>
                                  <pre className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 overflow-x-auto">
                                    {JSON.stringify(log.newValue, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <ScrollText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No audit logs found</p>
              </div>
            )}

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-slate-700 px-2">{page}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SuperAdminAuditLogs;
