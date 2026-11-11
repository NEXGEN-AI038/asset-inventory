import { useMemo } from 'react';
import type { Asset } from '@/types';
import { CATEGORY_COLORS } from '@/lib/constants';
import { isAssigned, isAvailable } from '@/lib/stock';

interface CategoryChartProps {
  assets: Asset[];
}

export default function CategoryChart({ assets }: CategoryChartProps) {
  const distribution = useMemo(() => {
    const groups: Record<string, { total: number; available: number; assigned: number }> = {};
    for (const a of assets) {
      const g = (groups[a.category] ??= { total: 0, available: 0, assigned: 0 });
      g.total += 1;
      if (isAvailable(a)) g.available += 1;
      if (isAssigned(a)) g.assigned += 1;
    }
    const entries = Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
    const max = Math.max(...entries.map((e) => e[1].total), 1);
    return entries.map(([category, g]) => ({
      category,
      ...g,
      widthPct: (g.total / max) * 100,
      availablePct: g.total > 0 ? (g.available / g.total) * 100 : 0,
      assignedPct: g.total > 0 ? (g.assigned / g.total) * 100 : 0,
    }));
  }, [assets]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Stock by Category</h3>
          <p className="text-xs text-slate-400">Available vs assigned for each category</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Assigned</span>
        </div>
      </div>

      {distribution.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          No stock to display
        </div>
      ) : (
        <div className="space-y-4">
          {distribution.map((item) => (
            <div key={item.category}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-sm ${CATEGORY_COLORS[item.category] ?? 'bg-slate-400'}`} />
                  {item.category}
                </span>
                <span className="text-slate-400">
                  <span className="font-semibold text-slate-700">{item.available}</span> of {item.total} in stock
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="flex h-full overflow-hidden rounded-full transition-all duration-500 ease-out" style={{ width: `${item.widthPct}%` }}>
                  <div className="h-full bg-emerald-500" style={{ width: `${item.availablePct}%` }} />
                  <div className="h-full bg-sky-400" style={{ width: `${item.assignedPct}%` }} />
                  <div className="h-full flex-1 bg-slate-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
