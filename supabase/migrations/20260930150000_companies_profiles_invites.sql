/*
# Companies, profiles and invitation-based roles

## Summary
Replaces the hardcoded logins with email accounts managed through invitations.

Roles (stored in each user's `app_metadata`, which users cannot edit):
- PlatformAdmin — no company. Creates companies and invites company admins.
  Has NO access to any company's assets or audit logs.
- CompanyAdmin  — full access to their own company; invites managers/users.
- AssetManager  — add / edit / import / log updates in their company.
- User          — view and log status/reassignment updates in their company.

## Changes
- New tables: `companies`, `profiles` (read-only from the browser; all writes go
  through the `admin-api` Edge Function using the service role).
- Removes the dummy GD Solutions data and the old hardcoded seed logins.
- Re-creates the asset / audit-log policies with the new role names.
- Safe to run whether or not the previous multi-company migration was applied.
*/

-- ─── Helpers ───
CREATE OR REPLACE FUNCTION public.jwt_company_id()
RETURNS text LANGUAGE sql STABLE
AS $$ SELECT auth.jwt() -> 'app_metadata' ->> 'company_id' $$;

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text LANGUAGE sql STABLE
AS $$ SELECT auth.jwt() -> 'app_metadata' ->> 'role' $$;

-- ─── Wipe dummy data and the old hardcoded logins ───
DELETE FROM audit_logs;
DELETE FROM assets;
DELETE FROM auth.users WHERE email LIKE '%@assethub.example.com';

-- ─── companies / profiles ───
CREATE TABLE IF NOT EXISTS companies (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9-]+$'),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('CompanyAdmin', 'AssetManager', 'User')),
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_select" ON companies;
CREATE POLICY "companies_select" ON companies FOR SELECT TO authenticated
  USING (public.jwt_role() = 'PlatformAdmin' OR id = public.jwt_company_id());

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.jwt_role() = 'PlatformAdmin'
    OR (public.jwt_role() = 'CompanyAdmin' AND company_id = public.jwt_company_id())
  );
-- (no INSERT/UPDATE/DELETE policies: only the Edge Function, via service role, writes these)

-- ─── assets / audit_logs: company scoping ───
ALTER TABLE assets     ADD COLUMN IF NOT EXISTS company_id text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS company_id text;
UPDATE assets     SET company_id = 'unassigned' WHERE company_id IS NULL;
UPDATE audit_logs SET company_id = 'unassigned' WHERE company_id IS NULL;
ALTER TABLE assets     ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE assets     ALTER COLUMN company_id SET DEFAULT public.jwt_company_id();
ALTER TABLE audit_logs ALTER COLUMN company_id SET DEFAULT public.jwt_company_id();

ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_asset_tag_key;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_company_asset_tag_key;
ALTER TABLE assets ADD CONSTRAINT assets_company_asset_tag_key UNIQUE (company_id, asset_tag);
CREATE INDEX IF NOT EXISTS idx_assets_company     ON assets(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);

-- Drop every earlier policy (open anon ones and the previous company_* ones)
DROP POLICY IF EXISTS "anon_select_assets"     ON assets;
DROP POLICY IF EXISTS "anon_insert_assets"     ON assets;
DROP POLICY IF EXISTS "anon_update_assets"     ON assets;
DROP POLICY IF EXISTS "anon_delete_assets"     ON assets;
DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_update_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_delete_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "company_select_assets"     ON assets;
DROP POLICY IF EXISTS "company_insert_assets"     ON assets;
DROP POLICY IF EXISTS "company_update_assets"     ON assets;
DROP POLICY IF EXISTS "company_delete_assets"     ON assets;
DROP POLICY IF EXISTS "company_select_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "company_insert_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "company_update_audit_logs" ON audit_logs;

ALTER TABLE assets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_select_assets" ON assets FOR SELECT TO authenticated
  USING (
    company_id = public.jwt_company_id()
    AND public.jwt_role() IN ('CompanyAdmin', 'AssetManager', 'User')
  );

CREATE POLICY "company_insert_assets" ON assets FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.jwt_company_id()
    AND public.jwt_role() IN ('CompanyAdmin', 'AssetManager')
  );

CREATE POLICY "company_update_assets" ON assets FOR UPDATE TO authenticated
  USING (
    company_id = public.jwt_company_id()
    AND public.jwt_role() IN ('CompanyAdmin', 'AssetManager', 'User')
  )
  WITH CHECK (company_id = public.jwt_company_id());

CREATE POLICY "company_delete_assets" ON assets FOR DELETE TO authenticated
  USING (
    company_id = public.jwt_company_id()
    AND public.jwt_role() = 'CompanyAdmin'
  );

CREATE POLICY "company_select_audit_logs" ON audit_logs FOR SELECT TO authenticated
  USING (
    company_id = public.jwt_company_id()
    AND public.jwt_role() IN ('CompanyAdmin', 'AssetManager', 'User')
  );

CREATE POLICY "company_insert_audit_logs" ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.jwt_company_id()
    AND public.jwt_role() IN ('CompanyAdmin', 'AssetManager', 'User')
    AND (asset_id IS NULL OR EXISTS (SELECT 1 FROM assets a WHERE a.id = audit_logs.asset_id))
  );

CREATE POLICY "company_update_audit_logs" ON audit_logs FOR UPDATE TO authenticated
  USING (
    company_id = public.jwt_company_id()
    AND public.jwt_role() IN ('CompanyAdmin', 'AssetManager', 'User')
  )
  WITH CHECK (company_id = public.jwt_company_id());

-- ─── Privileges: signed-in users only, never the anonymous key ───
REVOKE ALL ON assets, audit_logs, companies, profiles FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON assets, audit_logs TO authenticated;
GRANT SELECT ON companies, profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.jwt_company_id(), public.jwt_role() TO authenticated;
