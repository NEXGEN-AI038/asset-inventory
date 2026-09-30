import { useState, useMemo } from 'react';
import { Mail, Eye, Check, Search, Filter, Clock } from 'lucide-react';
import type { AuditLog } from '@/types';
import { CHANGE_TYPE_STYLES } from '@/lib/constants';
import WeeklySummaryModal from './WeeklySummaryModal';

interface AuditLogViewerProps {
  logs: AuditLog[];
  onMarkReported: (logIds: string[]) => void;
}

export default function AuditLogViewer({ logs, onMarkReported }: AuditLogViewerProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [reportedFilter, setReportedFilter] = useState('unreported');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSummary, setShowSummary] = useState(false);

  const filtered = useMemo(() => {
    let result = logs;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          (l.asset_name ?? '').toLowerCase().includes(q) ||
          (l.asset_tag ?? '').toLowerCase().includes(q) ||
          (l.updated_by ?? '').toLowerCase().includes(q) ||
          (l.previous_value ?? '').toLowerCase().includes(q) ||
          (l.new_value ?? '').toLowerCase().includes(q)
      );
    }
    if (typeFilter) result = result.filter((l) => l.change_type === typeFilter);
    if (reportedFilter === 'unreported') result = result.filter((l) => !l.reported_to_management);
    if (reportedFilter === 'reported') result = result.filter((l) => l.reported_to_management);

    return [...result].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [logs, search, typeFilter, reportedFilter]);

  const unreportedLogs = useMemo(() => filtered.filter((l) => !l.reported_to_management), [filtered]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === unreportedLogs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unreportedLogs.map((l) => l.id)));
    }
  };

  const handleSummaryConfirm = (logIds: string[]) => {
    onMarkReported(logIds);
    setSelected(new Set());
    setShowSummary(false);
  };

  const selectedLogs = logs.filter((l) => selected.has(l.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by asset, user, or value..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSummary(true)}
            disabled={unreportedLogs.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Mail className="h-4 w-4" />
            Trigger Weekly Summary
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Filter className="h-3.5 w-3.5" />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors focus:border-indigo-400 focus:outline-none"
        >
          <option value="">All Change Types</option>
          <option value="Status">Status</option>
          <option value="Location">Location</option>
          <option value="Reassignment">Reassignment</option>
          <option value="Note">Note</option>
        </select>

        <select
          value={reportedFilter}
          onChange={(e) => setReportedFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors focus:border-indigo-400 focus:outline-none"
        >
          <option value="unreported">Unreported Only</option>
          <option value="reported">Reported Only</option>
          <option value="all">All Logs</option>
        </select>

        <span className="ml-auto text-sm text-slate-400">{filtered.length} log entries</span>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <span className="text-sm font-medium text-indigo-700">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSummary(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <Eye className="h-3.5 w-3.5" /> Preview & Report Selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {unreportedLogs.length > 0 && reportedFilter === 'unreported' && (
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <input
                type="checkbox"
                checked={selected.size === unreportedLogs.length && unreportedLogs.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
              />
              Select All Unreported
            </label>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 font-semibold text-slate-600">Log ID</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Asset</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Change Type</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Previous</th>
                <th className="px-4 py-3 font-semibold text-slate-600">New</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Updated By</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Timestamp</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Reported</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    {!log.reported_to_management && (
                      <input
                        type="checkbox"
                        checked={selected.has(log.id)}
                        onChange={() => toggleSelect(log.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                      />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                    {log.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{log.asset_name ?? '—'}</div>
                    <div className="font-mono text-xs text-slate-400">{log.asset_tag ?? ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${CHANGE_TYPE_STYLES[log.change_type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {log.change_type}
                    </span>
                  </td>
                  <td className="max-w-[120px] truncate px-4 py-3 text-slate-500" title={log.previous_value ?? ''}>
                    {log.previous_value || '—'}
                  </td>
                  <td className="max-w-[120px] truncate px-4 py-3 font-medium text-slate-700" title={log.new_value ?? ''}>
                    {log.new_value || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{log.updated_by}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {log.reported_to_management ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <Check className="h-3 w-3" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                        <Clock className="h-3 w-3" /> No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No audit log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showSummary && (
        <WeeklySummaryModal
          logs={selectedLogs.length > 0 ? selectedLogs : unreportedLogs}
          onClose={() => setShowSummary(false)}
          onConfirm={handleSummaryConfirm}
        />
      )}
    </div>
  );
}
