import { useMemo } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import type { Asset, AuditLog } from '@/types';
import { STATUS_STYLES, CATEGORY_COLORS } from '@/lib/constants';
import StatCards from './StatCards';
import CategoryChart from './CategoryChart';

interface DashboardProps {
  assets: Asset[];
  auditLogs: AuditLog[];
}

export default function Dashboard({ assets, auditLogs }: DashboardProps) {
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assets) {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    }
    return counts;
  }, [assets]);

  const recentLogs = useMemo(() => {
    return [...auditLogs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [auditLogs]);

  return (
    <div className="space-y-6">
      <StatCards assets={assets} auditLogs={auditLogs} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CategoryChart assets={assets} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <h3 className="text-base font-semibold text-slate-800">Status Breakdown</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? 'bg-slate-100 text-slate-600'}`}>
                  {status}
                </span>
                <span className="text-sm font-bold text-slate-700">{count}</span>
              </div>
            ))}
            {Object.keys(statusBreakdown).length === 0 && (
              <p className="text-sm text-slate-400">No assets yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-500" />
          <h3 className="text-base font-semibold text-slate-800">Recent Activity</h3>
        </div>
        {recentLogs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No recent changes logged</p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${CATEGORY_COLORS['Other']}`}>
                  <span className="text-[10px] font-bold text-white">{log.change_type[0]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-700">{log.asset_name ?? 'Unknown Asset'}</span>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{log.change_type}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {log.previous_value ?? '—'} → {log.new_value ?? '—'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-slate-500">{log.updated_by}</p>
                  <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
