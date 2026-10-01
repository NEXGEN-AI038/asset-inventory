-- Run ONCE in the Supabase SQL Editor, AFTER creating the user in
-- Authentication → Users → Add user → "Create new user"
-- (email below, choose a password, tick "Auto Confirm User").
--
-- Marks that account as the Platform Admin. It should report 1 row updated.
-- If you were already signed in on the site, sign out and back in afterwards.

UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'PlatformAdmin', 'display_name', 'Platform Admin')
WHERE lower(email) = lower('souravmukherjee038@gmail.com');
