import { Pencil, History, Trash2, ArrowUpDown } from 'lucide-react';
import type { Asset } from '@/types';
import { STATUS_STYLES, STATUS_DOT } from '@/lib/constants';

interface AssetTableProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onLogUpdate: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  sortField: keyof Asset;
  sortAsc: boolean;
  onSort: (field: keyof Asset) => void;
  canEdit: boolean;
  canDelete: boolean;
  canLogUpdate: boolean;
}

export default function AssetTable({
  assets,
  onEdit,
  onLogUpdate,
  onDelete,
  sortField,
  sortAsc,
  onSort,
  canEdit,
  canDelete,
  canLogUpdate,
}: AssetTableProps) {
  const columns: { key: keyof Asset; label: string; sortable: boolean }[] = [
    { key: 'asset_tag', label: 'Asset Tag', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'assigned_to', label: 'Assigned To', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'purchase_date', label: 'Purchase Date', sortable: true },
    { key: 'purchase_price', label: 'Price', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
  ];

  const hasActions = canEdit || canLogUpdate || canDelete;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-semibold text-slate-600 ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                onClick={() => col.sortable && onSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <ArrowUpDown
                      className={`h-3 w-3 transition-opacity ${
                        sortField === col.key ? 'text-indigo-500 opacity-100' : 'opacity-30'
                      }`}
                    />
                  )}
                  {sortField === col.key && (
                    <span className="text-[10px] text-indigo-500">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
            {hasActions && <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/60">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-slate-500">
                {asset.asset_tag}
              </td>
              <td className="px-4 py-3 font-medium text-slate-800">{asset.name}</td>
              <td className="px-4 py-3 text-slate-500">{asset.category}</td>
              <td className="px-4 py-3 text-slate-500">{asset.assigned_to || '—'}</td>
              <td className="px-4 py-3 text-slate-500">{asset.location || '—'}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                ${asset.purchase_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[asset.status]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[asset.status]}`} />
                  {asset.status}
                </span>
              </td>
              {hasActions && (
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {canEdit && (
                      <button
                        onClick={() => onEdit(asset)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canLogUpdate && (
                      <button
                        onClick={() => onLogUpdate(asset)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                        title="Log Update"
                      >
                        <History className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDelete(asset)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {assets.length === 0 && (
            <tr>
              <td colSpan={hasActions ? 9 : 8} className="py-12 text-center text-slate-400">
                No assets found. Try adjusting your search or filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
