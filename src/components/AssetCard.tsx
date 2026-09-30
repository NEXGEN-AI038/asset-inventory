import { Pencil, History, Trash2, MapPin, User, Calendar, DollarSign } from 'lucide-react';
import type { Asset } from '@/types';
import { STATUS_STYLES, STATUS_DOT, CATEGORY_COLORS } from '@/lib/constants';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onLogUpdate: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  canEdit: boolean;
  canDelete: boolean;
  canLogUpdate: boolean;
}

export default function AssetCard({ asset, onEdit, onLogUpdate, onDelete, canEdit, canDelete, canLogUpdate }: AssetCardProps) {
  const hasActions = canEdit || canLogUpdate || canDelete;

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50">
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${CATEGORY_COLORS[asset.category] ?? 'bg-slate-400'}`}>
              <span className="text-[10px] font-bold text-white">{asset.category.slice(0, 2).toUpperCase()}</span>
            </span>
            <span className="font-mono text-xs font-medium text-slate-400">{asset.asset_tag}</span>
          </div>
          <h3 className="truncate text-base font-semibold text-slate-800">{asset.name}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[asset.status]}`}>
          <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[asset.status]}`} />
          {asset.status}
        </span>
      </div>

      <div className="mb-4 space-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span>{asset.assigned_to || 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span>{asset.location || 'No location'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'No date'}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-600">
            ${asset.purchase_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {hasActions && (
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          {canEdit && (
            <button
              onClick={() => onEdit(asset)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-50 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          {canLogUpdate && (
            <button
              onClick={() => onLogUpdate(asset)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-50 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-600"
            >
              <History className="h-3.5 w-3.5" /> Log
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(asset)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
