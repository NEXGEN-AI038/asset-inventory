/*
# Create Asset Management Portal tables (single-tenant, no auth)

## Summary
Creates the core data model for a small-business Asset Management Portal:
an `assets` table for inventory tracking and an `audit_logs` table for
recording every change made to an asset. The audit log is designed to feed
into Make.com for weekly automation summary emails.

## New Tables

### assets
- `id` (uuid, PK) — unique row identifier
- `asset_tag` (text, unique, not null) — human-readable asset ID (e.g. AST-001)
- `name` (text, not null) — asset name
- `category` (text, not null) — Laptops, Mobile, Furniture, Software, Office Equipment, Other
- `assigned_to` (text) — person or department the asset is assigned to
- `location` (text) — physical location of the asset
- `purchase_date` (date) — when the asset was purchased
- `purchase_price` (numeric, default 0) — purchase price in USD
- `status` (text, not null, default 'Active') — Active, In Use, Under Maintenance, Retired, Lost
- `notes` (text) — free-form notes
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### audit_logs
- `id` (uuid, PK) — unique log entry identifier
- `asset_id` (uuid, FK to assets.id ON DELETE CASCADE) — which asset was changed
- `asset_tag` (text) — snapshot of asset tag at time of log (for display even if asset deleted)
- `asset_name` (text) — snapshot of asset name at time of log
- `change_type` (text, not null) — Status, Location, Reassignment, Note
- `previous_value` (text) — the value before the change
- `new_value` (text) — the value after the change
- `updated_by` (text, not null, default 'System') — who made the change
- `reported_to_management` (boolean, not null, default false) — whether this log has been included in a weekly summary
- `created_at` (timestamptz, default now())

## Security
- Both tables have RLS enabled.
- Since this is a single-tenant app with no sign-in screen, all policies use
  `TO anon, authenticated` so the anon-key frontend client can read and write its own data.
- `USING (true)` is acceptable here because the data is intentionally public/shared within this single-tenant app.

## Indexes
- Index on `assets.category` for filter performance
- Index on `assets.status` for filter performance
- Index on `assets.asset_tag` for search performance
- Index on `audit_logs.asset_id` for join performance
- Index on `audit_logs.reported_to_management` for filtering unreported logs
*/

-- ─── assets table ───
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  assigned_to text,
  location text,
  purchase_date date,
  purchase_price numeric(12, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_assets" ON assets;
CREATE POLICY "anon_select_assets" ON assets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_assets" ON assets;
CREATE POLICY "anon_insert_assets" ON assets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_assets" ON assets;
CREATE POLICY "anon_update_assets" ON assets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_assets" ON assets;
CREATE POLICY "anon_delete_assets" ON assets FOR DELETE
  TO anon, authenticated USING (true);

-- ─── audit_logs table ───
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  asset_tag text,
  asset_name text,
  change_type text NOT NULL DEFAULT 'Note',
  previous_value text,
  new_value text,
  updated_by text NOT NULL DEFAULT 'System',
  reported_to_management boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
CREATE POLICY "anon_select_audit_logs" ON audit_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_audit_logs" ON audit_logs;
CREATE POLICY "anon_update_audit_logs" ON audit_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_audit_logs" ON audit_logs;
CREATE POLICY "anon_delete_audit_logs" ON audit_logs FOR DELETE
  TO anon, authenticated USING (true);

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_asset_tag ON assets(asset_tag);

CREATE INDEX IF NOT EXISTS idx_audit_logs_asset_id ON audit_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_reported ON audit_logs(reported_to_management);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ─── updated_at trigger ───
DROP FUNCTION IF EXISTS update_updated_at_column();
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assets_updated_at ON assets;
CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();