import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Asset } from '@/types';
import type { Permissions } from '@/lib/auth';
import AssetTable from './AssetTable';
import AssetCard from './AssetCard';
import InventoryToolbar, { type ViewMode } from './InventoryToolbar';

interface InventoryViewProps {
  assets: Asset[];
  permissions: Permissions;
  onEdit: (asset: Asset) => void;
  onLogUpdate: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onImportClick: () => void;
  onExportClick: () => void;
  onAddClick: () => void;
}

const PAGE_SIZE = 10;

export default function InventoryView({
  assets,
  permissions,
  onEdit,
  onLogUpdate,
  onDelete,
  onImportClick,
  onExportClick,
  onAddClick,
}: InventoryViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Asset>('asset_tag');
  const [sortAsc, setSortAsc] = useState(true);

  const locations = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets) {
      if (a.location) set.add(a.location);
    }
    return Array.from(set).sort();
  }, [assets]);

  const filtered = useMemo(() => {
    let result = assets;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.asset_tag.toLowerCase().includes(q) ||
          (a.assigned_to ?? '').toLowerCase().includes(q)
      );
    }
    if (categoryFilter) result = result.filter((a) => a.category === categoryFilter);
    if (locationFilter) result = result.filter((a) => a.location === locationFilter);
    if (statusFilter) result = result.filter((a) => a.status === statusFilter);

    result = [...result].sort((a, b) => {
      const av = a[sortField] ?? '';
      const bv = b[sortField] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortAsc ? av - bv : bv - av;
      }
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return result;
  }, [assets, search, categoryFilter, locationFilter, statusFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: keyof Asset) => {
    if (field === sortField) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-5">
      <InventoryToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        categoryFilter={categoryFilter}
        onCategoryChange={(v) => { setCategoryFilter(v); setPage(1); }}
        locationFilter={locationFilter}
        onLocationChange={(v) => { setLocationFilter(v); setPage(1); }}
        statusFilter={statusFilter}
        onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
        locations={locations}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onImportClick={onImportClick}
        onExportClick={onExportClick}
        onAddClick={onAddClick}
        canImport={permissions.canImport}
        canAdd={permissions.canAdd}
        resultCount={filtered.length}
      />

      {viewMode === 'table' ? (
        <AssetTable
          assets={paginated}
          onEdit={onEdit}
          onLogUpdate={onLogUpdate}
          onDelete={onDelete}
          sortField={sortField}
          sortAsc={sortAsc}
          onSort={handleSort}
          canEdit={permissions.canEdit}
          canDelete={permissions.canDelete}
          canLogUpdate={permissions.canLogUpdate}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onEdit={onEdit}
              onLogUpdate={onLogUpdate}
              onDelete={onDelete}
              canEdit={permissions.canEdit}
              canDelete={permissions.canDelete}
              canLogUpdate={permissions.canLogUpdate}
            />
          ))}
          {paginated.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
              No assets found. Try adjusting your search or filters.
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
