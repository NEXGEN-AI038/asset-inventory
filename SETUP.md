# AssetHub – multi-company setup

1. **Database** – Supabase → SQL Editor → run, in this order:
   - `supabase/migrations/20260930150000_companies_profiles_invites.sql`
     (this also deletes the old dummy data)
2. **Platform admin** – Supabase → Authentication → Users → *Add user → Create new user*
   (`souravmukherjee038@gmail.com`, a password, tick *Auto Confirm User*), then run
   `supabase/bootstrap_platform_admin.sql` in the SQL Editor.
3. **Edge Function** – Supabase → Edge Functions → *Deploy a new function* → name it `admin-api`,
   paste `supabase/functions/admin-api/index.ts`, and turn **Verify JWT OFF**.
   (CLI alternative: `supabase functions deploy admin-api --no-verify-jwt`)
4. **Auth settings** – Supabase → Authentication:
   - URL Configuration → *Site URL* = your Vercel URL; add it to *Redirect URLs* too.
   - Sign In / Providers → turn **off** "Allow new users to sign up".
   - SMTP Settings → add your own email provider (the built-in sender is heavily rate-limited).
5. Push to GitHub → Vercel redeploys. Env vars stay `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
