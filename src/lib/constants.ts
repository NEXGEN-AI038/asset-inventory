import type { AssetStatus } from '@/types';

export const STATUS_STYLES: Record<AssetStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'In Use': 'bg-sky-100 text-sky-700 border border-sky-200',
  'Under Maintenance': 'bg-amber-100 text-amber-700 border border-amber-200',
  Retired: 'bg-slate-200 text-slate-600 border border-slate-300',
  Lost: 'bg-rose-100 text-rose-700 border border-rose-200',
};

export const STATUS_DOT: Record<AssetStatus, string> = {
  Active: 'bg-emerald-500',
  'In Use': 'bg-sky-500',
  'Under Maintenance': 'bg-amber-500',
  Retired: 'bg-slate-400',
  Lost: 'bg-rose-500',
};

export const CATEGORY_COLORS: Record<string, string> = {
  Laptops: 'bg-indigo-500',
  Mobile: 'bg-sky-500',
  Furniture: 'bg-amber-500',
  Software: 'bg-emerald-500',
  'Office Equipment': 'bg-rose-500',
  Other: 'bg-slate-400',
};

export const CHANGE_TYPE_STYLES: Record<string, string> = {
  Status: 'bg-violet-100 text-violet-700 border border-violet-200',
  Location: 'bg-sky-100 text-sky-700 border border-sky-200',
  Reassignment: 'bg-amber-100 text-amber-700 border border-amber-200',
  Note: 'bg-slate-100 text-slate-600 border border-slate-200',
};
