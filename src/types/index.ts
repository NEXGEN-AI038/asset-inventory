export type AssetStatus =
  | 'Active'
  | 'In Use'
  | 'Under Maintenance'
  | 'Retired'
  | 'Lost';

export type AssetCategory =
  | 'Solar Panels'
  | 'Inverters'
  | 'Batteries'
  | 'Mounting Structures'
  | 'Cables & Wiring'
  | 'Meters & Protection'
  | 'Tools & Equipment'
  | 'Other';

export type ChangeType =
  | 'Status'
  | 'Location'
  | 'Reassignment'
  | 'Note';

export interface Asset {
  id: string;
  company_id?: string;
  asset_tag: string;
  name: string;
  category: string;
  assigned_to: string | null;
  project_name: string | null;
  assigned_by: string | null;
  location: string | null;
  purchase_date: string | null;
  purchase_price: number;
  status: AssetStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  company_id?: string;
  asset_id: string | null;
  asset_tag: string | null;
  asset_name: string | null;
  change_type: ChangeType;
  previous_value: string | null;
  new_value: string | null;
  updated_by: string;
  reported_to_management: boolean;
  created_at: string;
}

export interface AssetInput {
  asset_tag: string;
  name: string;
  category: string;
  assigned_to: string | null;
  project_name: string | null;
  assigned_by: string | null;
  location: string | null;
  purchase_date: string | null;
  purchase_price: number;
  status: AssetStatus;
  notes: string | null;
}

export const ASSET_STATUSES: AssetStatus[] = [
  'Active',
  'In Use',
  'Under Maintenance',
  'Retired',
  'Lost',
];

export const ASSET_CATEGORIES: AssetCategory[] = [
  'Solar Panels',
  'Inverters',
  'Batteries',
  'Mounting Structures',
  'Cables & Wiring',
  'Meters & Protection',
  'Tools & Equipment',
  'Other',
];

export const CHANGE_TYPES: ChangeType[] = [
  'Status',
  'Location',
  'Reassignment',
  'Note',
];
