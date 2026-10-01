/*
# Multi-company isolation

## Summary
Turns the single-tenant portal into a multi-company portal where each company
can only see and change its own data.

## How it works
- Every login is a real Supabase Auth user (created by `scripts/seed-users.mjs`).
- Each user carries `company_id` and `role` in `app_metadata` (server-controlled,
  users cannot edit it), which ends up inside their JWT.
- `assets` and `audit_logs` get a `company_id` column. It defaults to the
  caller's company, and Row Level Security only allows rows whose `company_id`
  matches the caller's JWT.
- The old open `anon` policies are removed: the public anon key alone can no
  longer read or write anything.

## Changes
- `assets.asset_tag` is now unique per company (not globally).
- Existing rows are assigned to company `gd-solutions`.
- Roles are enforced in the database as well as the UI:
  - insert assets: Superadmin, AssetManager
  - update assets / audit logs: any signed-in user of the company
  - delete assets: Superadmin only
*/

-- ─── Helper functions (read the caller's company/role from their JWT) ───
CREATE OR REPLACE FUNCTION public.jwt_company_id()
RETURNS text
LANGUAGE sql STABLE
AS $$ SELECT auth.jwt() -> 'app_metadata' ->> 'company_id' $$;

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql STABLE
AS $$ SELECT auth.jwt() -> 'app_metadata' ->> 'role' $$;

-- ─── company_id columns ───
ALTER TABLE assets     ADD COLUMN IF NOT EXISTS company_id text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS company_id text;

-- Existing data belongs to the original company
UPDATE assets     SET company_id = 'gd-solutions' WHERE company_id IS NULL;
UPDATE audit_logs SET company_id = 'gd-solutions' WHERE company_id IS NULL;

ALTER TABLE assets     ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE assets     ALTER COLUMN company_id SET DEFAULT public.jwt_company_id();
ALTER TABLE audit_logs ALTER COLUMN company_id SET DEFAULT public.jwt_company_id();

-- ─── asset_tag unique per company instead of globally ───
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_asset_tag_key;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_company_asset_tag_key;
ALTER TABLE assets ADD CONSTRAINT assets_company_asset_tag_key UNIQUE (company_id, asset_tag);

CREATE INDEX IF NOT EXISTS idx_assets_company     ON assets(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);

-- ─── Remove the old open policies ───
DROP POLICY IF EXISTS "anon_select_assets"     ON assets;
DROP POLICY IF EXISTS "anon_insert_assets"     ON assets;
DROP POLICY IF EXISTS "anon_update_assets"     ON assets;
DROP POLICY IF EXISTS "anon_delete_assets"     ON assets;
DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_update_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_delete_audit_logs" ON audit_logs;

ALTER TABLE assets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── assets policies ───
CREATE POLICY "company_select_assets" ON assets FOR SELECT
  TO authenticated
  USING (company_id = public.jwt_company_id());

CREATE POLICY "company_insert_assets" ON assets FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.jwt_company_id()
    AND public.jwt_role() IN ('Superadmin', 'AssetManager')
  );

CREATE POLICY "company_update_assets" ON assets FOR UPDATE
  TO authenticated
  USING (company_id = public.jwt_company_id())
  WITH CHECK (company_id = public.jwt_company_id());

CREATE POLICY "company_delete_assets" ON assets FOR DELETE
  TO authenticated
  USING (
    company_id = public.jwt_company_id()
    AND public.jwt_role() = 'Superadmin'
  );

-- ─── audit_logs policies ───
CREATE POLICY "company_select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated
  USING (company_id = public.jwt_company_id());

-- The asset an entry points to must also belong to the caller's company
-- (the sub-select is itself filtered by RLS on assets).
CREATE POLICY "company_insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.jwt_company_id()
    AND (
      asset_id IS NULL
      OR EXISTS (SELECT 1 FROM assets a WHERE a.id = audit_logs.asset_id)
    )
  );

CREATE POLICY "company_update_audit_logs" ON audit_logs FOR UPDATE
  TO authenticated
  USING (company_id = public.jwt_company_id())
  WITH CHECK (company_id = public.jwt_company_id());
