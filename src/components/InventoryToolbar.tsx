import { Search, LayoutGrid, Table, Upload, Download, Plus, X } from 'lucide-react';
import { ASSET_STATUSES, ASSET_CATEGORIES } from '@/types';

export type ViewMode = 'table' | 'card';

interface InventoryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  locationFilter: string;
  onLocationChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  locations: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onAddClick: () => void;
  canImport: boolean;
  canAdd: boolean;
  resultCount: number;
}

export default function InventoryToolbar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  locationFilter,
  onLocationChange,
  statusFilter,
  onStatusChange,
  locations,
  viewMode,
  onViewModeChange,
  onImportClick,
  onExportClick,
  onAddClick,
  canImport,
  canAdd,
  resultCount,
}: InventoryToolbarProps) {
  const hasFilters = search || categoryFilter || locationFilter || statusFilter;

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('');
    onLocationChange('');
    onStatusChange('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, tag, or user..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-2">
          {canImport && (
            <button
              onClick={onImportClick}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import CSV</span>
            </button>
          )}
          <button
            onClick={onExportClick}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {canAdd && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/30"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Asset</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors focus:border-indigo-400 focus:outline-none"
        >
          <option value="">All Categories</option>
          {ASSET_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => onLocationChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors focus:border-indigo-400 focus:outline-none"
        >
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors focus:border-indigo-400 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-rose-500"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-slate-400">{resultCount} result{resultCount !== 1 ? 's' : ''}</span>
          <div className="flex items-center rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => onViewModeChange('table')}
              className={`rounded-lg p-1.5 transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Table className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('card')}
              className={`rounded-lg p-1.5 transition-all ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
