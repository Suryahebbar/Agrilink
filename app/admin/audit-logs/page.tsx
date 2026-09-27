'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AuditLogEntry {
  _id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  module?: string;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  referenceId?: string;
  oldValue?: string;
  newValue?: string;
  remarks?: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  status: 'success' | 'failed' | 'pending';
  metadata?: Record<string, any>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const MODULE_COLORS: Record<string, string> = {
  Agreement:  'bg-blue-100 text-blue-800 border-blue-200',
  Blockchain: 'bg-purple-100 text-purple-800 border-purple-200',
  Security:   'bg-red-100 text-red-800 border-red-200',
  Land:       'bg-emerald-100 text-emerald-800 border-emerald-200',
  Financial:  'bg-amber-100 text-amber-800 border-amber-200',
  Document:   'bg-orange-100 text-orange-800 border-orange-200',
  System:     'bg-slate-100 text-slate-700 border-slate-200',
  Farmer:     'bg-teal-100 text-teal-800 border-teal-200',
  Admin:      'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const ACTION_ICONS: Record<string, string> = {
  login: '', login_failed: '', logout: '',
  agreement_opened: '', agreement_signed: '️',
  agreement_rejected: '', agreement_downloaded: '⬇️',
  blockchain_sealed: '️', contract_verified: '',
  upload: '', document_verified: '', document_rejected: '',
  land_added: '', polygon_uploaded: '️',
  pdf_generated: '', signature_captured: '️',
  otp_verify: '', password_change: '',
  create: '', update: '️', delete: '️',
};

function actionLabel(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmt(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function statusBadge(status: string) {
  if (status === 'success') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  if (status === 'failed')  return 'bg-rose-100 text-rose-800 border border-rose-200';
  return 'bg-amber-100 text-amber-800 border border-amber-200';
}

function statusDot(status: string) {
  if (status === 'success') return 'bg-emerald-500';
  if (status === 'failed')  return 'bg-rose-500';
  return 'bg-amber-500';
}

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 space-y-1  ${color}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ log, onClose }: { log: AuditLogEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white flex flex-col h-full overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-extrabold text-slate-900 text-sm">
              {ACTION_ICONS[log.action] ?? ''} {actionLabel(log.action)}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">{fmt(log.timestamp)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all text-lg font-bold">×</button>
        </div>

        <div className="p-6 space-y-5 text-[12px]">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${statusDot(log.status)}`} />
            <span className={`font-extrabold uppercase px-2 py-0.5 rounded-lg text-[10px] ${statusBadge(log.status)}`}>{log.status}</span>
            {log.module && (
              <span className={`font-bold px-2 py-0.5 rounded-lg text-[10px] border ${MODULE_COLORS[log.module] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                {log.module}
              </span>
            )}
          </div>

          {/* Actor */}
          <section className="space-y-2">
            <p className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Actor</p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 font-mono">
              {[
                ['Name', log.userName || ' - '],
                ['Email', log.userEmail || ' - '],
                ['Role', log.userRole || ' - '],
                ['User ID', log.userId || ' - '],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-400 flex-shrink-0">{k}:</span>
                  <span className="text-slate-700 text-right break-all">{v}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Resource */}
          <section className="space-y-2">
            <p className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Resource</p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 font-mono">
              {[
                ['Type', log.resourceType],
                ['Name', log.resourceName || ' - '],
                ['ID', log.resourceId],
                ['Reference ID', log.referenceId || ' - '],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-400 flex-shrink-0">{k}:</span>
                  <span className="text-slate-700 text-right break-all">{v}</span>
                </div>
              ))}
            </div>
          </section>

          {/* State Change */}
          {(log.oldValue || log.newValue) && (
            <section className="space-y-2">
              <p className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">State Change</p>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 font-mono">
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-lg">{log.oldValue || ' - '}</span>
                <span className="text-slate-400">→</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg">{log.newValue || ' - '}</span>
              </div>
            </section>
          )}

          {/* Remarks */}
          {log.remarks && (
            <section className="space-y-2">
              <p className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Remarks</p>
              <p className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-slate-700 leading-relaxed">{log.remarks}</p>
            </section>
          )}

          {/* Device / Network */}
          <section className="space-y-2">
            <p className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Device & Network</p>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 font-mono">
              {[
                ['IP Address', log.ipAddress || ' - '],
                ['Browser', log.browser || ' - '],
                ['OS', log.os || ' - '],
                ['Device', log.deviceType || ' - '],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-400 flex-shrink-0">{k}:</span>
                  <span className="text-slate-700 text-right break-all">{v}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <section className="space-y-2">
              <p className="font-extrabold text-slate-500 text-[10px] uppercase tracking-wider">Metadata</p>
              <pre className="bg-slate-900 text-emerald-300 rounded-xl p-4 text-[10px] overflow-auto max-h-48">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const ALL_MODULES = ['All', 'Agreement', 'Blockchain', 'Security', 'Land', 'Financial', 'Document', 'System', 'Farmer', 'Admin'];
const ALL_ROLES   = ['All', 'farmer', 'admin', 'system', 'fco', 'supplier'];
const ALL_STATUS  = ['All', 'success', 'failed', 'pending'];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  // Filters
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('All');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, todaySigned: 0, failedLogins: 0, blockchainSeals: 0 });

  // Selected log for drawer
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Read the admin Bearer token from localStorage (set by admin login)
  const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (module !== 'All') params.set('module', module);
      if (role !== 'All') params.set('userRole', role);
      if (status !== 'All') params.set('status', status);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) {
          console.warn('Admin audit logs: not authenticated');
          setLogs([]);
          setTotal(0);
          return;
        }
        throw new Error(`Failed to fetch logs (${res.status})`);
      }
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (e) {
      console.error('Audit logs fetch error:', e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, module, role, status, startDate, endDate, search]);

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const headers = getAuthHeaders();
      const [all, signed, failed, sealed] = await Promise.all([
        fetch('/api/admin/audit-logs?limit=1', { headers }).then(r => r.ok ? r.json() : {}),
        fetch(`/api/admin/audit-logs?action=agreement_signed&startDate=${today}&limit=1`, { headers }).then(r => r.ok ? r.json() : {}),
        fetch(`/api/admin/audit-logs?action=login_failed&startDate=${today}&limit=1`, { headers }).then(r => r.ok ? r.json() : {}),
        fetch(`/api/admin/audit-logs?action=blockchain_sealed&limit=1`, { headers }).then(r => r.ok ? r.json() : {}),
      ]) as any[];
      setStats({
        total: all.pagination?.total ?? 0,
        todaySigned: signed.pagination?.total ?? 0,
        failedLogins: failed.pagination?.total ?? 0,
        blockchainSeals: sealed.pagination?.total ?? 0,
      });
    } catch { /* stats are non-critical */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchLogs(); fetchStats(); }, [fetchLogs, fetchStats]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => fetchLogs(), 30000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchLogs]);

  const totalPages = Math.ceil(total / LIMIT);

  const exportCSV = () => {
    const header = ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Resource', 'Resource ID', 'Old Value', 'New Value', 'Status', 'IP', 'Browser', 'OS', 'Remarks'];
    const rows = logs.map(l => [
      fmt(l.timestamp), l.userName ?? '', l.userRole ?? '', l.module ?? '',
      actionLabel(l.action), l.resourceName ?? l.resourceType, l.resourceId,
      l.oldValue ?? '', l.newValue ?? '', l.status,
      l.ipAddress ?? '', l.browser ?? '', l.os ?? '', l.remarks ?? '',
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrilink-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#1f3b2c] tracking-tight flex items-center gap-2">
             Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete timestamped record of every system action  -  {total.toLocaleString()} total entries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(a => !a)}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              autoRefresh ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {autoRefresh ? ' Auto-refresh ON' : ' Auto-refresh OFF'}
          </button>
          <button
            onClick={fetchLogs}
            className="px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
          >
            ↺ Refresh
          </button>
          <button
            onClick={exportCSV}
            disabled={logs.length === 0}
            className="px-4 py-2 text-xs font-bold bg-[#1A9B9A] hover:bg-[#147878] text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            ⬇️ Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Logs" value={stats.total} icon="" color="border-slate-200" />
        <StatCard label="Signed Today" value={stats.todaySigned} icon="️" color="border-blue-200" />
        <StatCard label="Failed Logins Today" value={stats.failedLogins} icon="" color="border-rose-200" />
        <StatCard label="Blockchain Seals" value={stats.blockchainSeals} icon="️" color="border-purple-200" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by user, action, resource ID, remarks..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1A9B9A] transition-all"
            />
          </div>
          {/* Module */}
          <select
            value={module}
            onChange={e => { setModule(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1A9B9A]"
          >
            {ALL_MODULES.map(m => <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>)}
          </select>
          {/* Role */}
          <select
            value={role}
            onChange={e => { setRole(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1A9B9A]"
          >
            {ALL_ROLES.map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>)}
          </select>
          {/* Status */}
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1A9B9A]"
          >
            {ALL_STATUS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          {/* Date range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1A9B9A]"
            />
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1A9B9A]"
            />
          </div>
          <button
            onClick={() => { setSearch(''); setModule('All'); setRole('All'); setStatus('All'); setStartDate(''); setEndDate(''); setPage(1); }}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-all"
          >
             Clear filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-2">
            <div className="animate-spin text-2xl">⟳</div>
            <p className="text-slate-400 text-sm">Loading audit logs…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="text-3xl"></span>
            <p className="text-slate-500 font-medium">No logs found for the current filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Timestamp', 'User', 'Role', 'Module', 'Action', 'Resource', 'Old → New', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map(log => (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                        {fmt(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-bold text-slate-800">{log.userName || ' - '}</p>
                        <p className="text-slate-400 text-[10px]">{log.userEmail || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-500 capitalize">{log.userRole || ' - '}</span>
                      </td>
                      <td className="px-4 py-3">
                        {log.module ? (
                          <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] border ${MODULE_COLORS[log.module] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {log.module}
                          </span>
                        ) : ' - '}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <span>{ACTION_ICONS[log.action] ?? '•'}</span>
                          <span className="font-semibold text-slate-700">{actionLabel(log.action)}</span>
                        </span>
                        {log.remarks && (
                          <p className="text-slate-400 text-[10px] truncate max-w-[200px]">{log.remarks}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-semibold text-slate-700">{log.resourceName || log.resourceType}</p>
                        <p className="text-slate-400 text-[10px] font-mono">{log.resourceId?.slice(-8)}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono">
                        {(log.oldValue || log.newValue) ? (
                          <span className="flex items-center gap-1 text-[10px]">
                            <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">{log.oldValue || ' - '}</span>
                            <span className="text-slate-400">→</span>
                            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{log.newValue || ' - '}</span>
                          </span>
                        ) : ' - '}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase w-fit ${statusBadge(log.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot(log.status)}`} />
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-slate-300 hover:text-[#1A9B9A] transition-all text-base font-bold">›</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()} entries</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-40 transition-all"
                >
                  ← Prev
                </button>
                <span className="font-mono font-bold">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-40 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedLog && <DetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
