import { useMemo } from 'react';
import type { Asset } from '@/types';
import { CATEGORY_COLORS } from '@/lib/constants';

interface CategoryChartProps {
  assets: Asset[];
}

export default function CategoryChart({ assets }: CategoryChartProps) {
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assets) {
      counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map((e) => e[1]), 1);
    return entries.map(([category, count]) => ({
      category,
      count,
      pct: (count / max) * 100,
      sharePct: assets.length > 0 ? (count / assets.length) * 100 : 0,
    }));
  }, [assets]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Category Distribution</h3>
          <p className="text-xs text-slate-400">Assets grouped by category</p>
        </div>
      </div>

      {distribution.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-400">
          No assets to display
        </div>
      ) : (
        <div className="space-y-4">
          {distribution.map((item) => {
            const color = CATEGORY_COLORS[item.category] ?? 'bg-slate-400';
            return (
              <div key={item.category}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">{item.category}</span>
                  <span className="text-slate-400">
                    {item.count} <span className="text-xs">({item.sharePct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-500 ease-out`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
