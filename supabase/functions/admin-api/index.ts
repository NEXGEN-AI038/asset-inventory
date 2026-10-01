// Edge Function: admin-api
// Handles everything that needs the service role: creating companies, inviting
// users, changing roles, removing users, and listing members.
//
// Every call is authorised here from the caller's own (server-verified) account:
//  • PlatformAdmin → can create companies, invite/manage anyone in any company
//  • CompanyAdmin  → can invite/manage AssetManager + User in THEIR company only
//  • everyone else → forbidden
//
// Optional secret: SITE_URL (e.g. https://your-app.vercel.app). If unset, the
// browser's Origin is used for the invite / reset links.

import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Role = 'CompanyAdmin' | 'AssetManager' | 'User';
const ASSIGNABLE: Role[] = ['CompanyAdmin', 'AssetManager', 'User'];
const COMPANY_ADMIN_MAY_ASSIGN: Role[] = ['AssetManager', 'User'];

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface Caller {
  id: string;
  role: string;
  companyId: string | null;
}

async function getCaller(req: Request): Promise<Caller> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Not signed in');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Session expired — please sign in again');
  const meta = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  return {
    id: data.user.id,
    role: String(meta.role ?? ''),
    companyId: typeof meta.company_id === 'string' ? meta.company_id : null,
  };
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function redirectUrl(req: Request, body: Record<string, unknown>) {
  return Deno.env.get('SITE_URL') || str(body.redirect_to, 300) || req.headers.get('origin') || undefined;
}

function slugify(name: string) {
  const s = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s.slice(0, 40) || 'company';
}

async function uniqueCompanyId(name: string) {
  const base = slugify(name);
  for (let i = 0; i < 50; i++) {
    const id = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await admin.from('companies').select('id').eq('id', id).maybeSingle();
    if (!data) return id;
  }
  throw new HttpError(500, 'Could not generate a company ID');
}

async function inviteInto(
  req: Request,
  body: Record<string, unknown>,
  caller: Caller,
  opts: { email: string; displayName: string; role: Role; companyId: string; companyName: string },
) {
  const { data, error } = await admin.auth.admin.inviteUserByEmail(opts.email, {
    redirectTo: redirectUrl(req, body),
    data: { display_name: opts.displayName },
  });
  if (error || !data.user) {
    const msg = error?.message ?? 'Invite failed';
    if (/already|registered|exists/i.test(msg)) {
      throw new HttpError(409, `${opts.email} already has an account. Remove it first or use a different email.`);
    }
    throw new HttpError(400, msg);
  }
  const userId = data.user.id;

  const { error: metaErr } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      role: opts.role,
      company_id: opts.companyId,
      company_name: opts.companyName,
      display_name: opts.displayName,
    },
  });
  const { error: profErr } = metaErr
    ? { error: metaErr }
    : await admin.from('profiles').upsert({
        user_id: userId,
        email: opts.email,
        display_name: opts.displayName,
        company_id: opts.companyId,
        role: opts.role,
        invited_by: caller.id,
      });
  if (metaErr || profErr) {
    await admin.auth.admin.deleteUser(userId); // roll back so no half-created account is left
    throw new HttpError(500, 'Could not finish setting up the invited user');
  }
  return userId;
}

// Loads a target user's profile and checks the caller is allowed to manage them.
async function loadManageable(caller: Caller, userId: string) {
  if (!userId) throw new HttpError(400, 'Missing user');
  if (userId === caller.id) throw new HttpError(400, 'You cannot change your own account here');
  const { data: profile } = await admin.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (!profile) throw new HttpError(404, 'User not found');
  if (caller.role === 'PlatformAdmin') return profile;
  if (caller.role === 'CompanyAdmin' && profile.company_id === caller.companyId && COMPANY_ADMIN_MAY_ASSIGN.includes(profile.role)) {
    return profile;
  }
  throw new HttpError(403, 'You do not have permission to manage this user');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed');
    const caller = await getCaller(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = str(body.action, 40);

    switch (action) {
      // ───────────── platform admin: new company + first admin ─────────────
      case 'create_company': {
        if (caller.role !== 'PlatformAdmin') throw new HttpError(403, 'Only the platform admin can create companies');
        const name = str(body.name, 100);
        const email = str(body.admin_email).toLowerCase();
        const adminName = str(body.admin_name, 100) || email.split('@')[0];
        if (!name) throw new HttpError(400, 'Company name is required');
        if (!isEmail(email)) throw new HttpError(400, 'A valid admin email is required');

        const id = await uniqueCompanyId(name);
        const { error } = await admin.from('companies').insert({ id, name });
        if (error) throw new HttpError(500, error.message);
        try {
          await inviteInto(req, body, caller, { email, displayName: adminName, role: 'CompanyAdmin', companyId: id, companyName: name });
        } catch (e) {
          await admin.from('companies').delete().eq('id', id); // undo the company if the invite failed
          throw e;
        }
        return json({ ok: true, company: { id, name } });
      }

      // ───────────── invite a user ─────────────
      case 'invite_user': {
        const email = str(body.email).toLowerCase();
        const displayName = str(body.display_name, 100) || email.split('@')[0];
        const role = str(body.role, 20) as Role;
        if (!isEmail(email)) throw new HttpError(400, 'A valid email is required');
        if (!ASSIGNABLE.includes(role)) throw new HttpError(400, 'Invalid role');

        let companyId: string;
        if (caller.role === 'PlatformAdmin') {
          companyId = str(body.company_id, 60);
          if (!companyId) throw new HttpError(400, 'Company is required');
        } else if (caller.role === 'CompanyAdmin' && caller.companyId) {
          companyId = caller.companyId;
          if (!COMPANY_ADMIN_MAY_ASSIGN.includes(role)) throw new HttpError(403, 'You can only invite Asset Managers and Users');
        } else {
          throw new HttpError(403, 'You do not have permission to invite users');
        }
        const { data: company } = await admin.from('companies').select('id,name').eq('id', companyId).maybeSingle();
        if (!company) throw new HttpError(404, 'Company not found');

        await inviteInto(req, body, caller, { email, displayName, role, companyId, companyName: company.name });
        return json({ ok: true });
      }

      // ───────────── re-send an invite that was never accepted ─────────────
      case 'resend_invite': {
        const profile = await loadManageable(caller, str(body.user_id, 60));
        const { data: u } = await admin.auth.admin.getUserById(profile.user_id);
        if (u.user?.email_confirmed_at) throw new HttpError(400, 'This user has already accepted their invite');
        const { data: company } = await admin.from('companies').select('id,name').eq('id', profile.company_id).single();
        await admin.auth.admin.deleteUser(profile.user_id); // profile cascades
        await inviteInto(req, body, caller, {
          email: profile.email,
          displayName: profile.display_name,
          role: profile.role,
          companyId: profile.company_id,
          companyName: company!.name,
        });
        return json({ ok: true });
      }

      // ───────────── change a role ─────────────
      case 'change_role': {
        const role = str(body.role, 20) as Role;
        if (!ASSIGNABLE.includes(role)) throw new HttpError(400, 'Invalid role');
        if (caller.role === 'CompanyAdmin' && !COMPANY_ADMIN_MAY_ASSIGN.includes(role)) {
          throw new HttpError(403, 'You can only assign Asset Manager or User');
        }
        const profile = await loadManageable(caller, str(body.user_id, 60));
        const { error } = await admin.from('profiles').update({ role }).eq('user_id', profile.user_id);
        if (error) throw new HttpError(500, error.message);
        const { error: metaErr } = await admin.auth.admin.updateUserById(profile.user_id, {
          app_metadata: { role, company_id: profile.company_id },
        });
        if (metaErr) throw new HttpError(500, metaErr.message);
        return json({ ok: true });
      }

      // ───────────── remove a user ─────────────
      case 'remove_user': {
        const profile = await loadManageable(caller, str(body.user_id, 60));
        const { error } = await admin.auth.admin.deleteUser(profile.user_id);
        if (error) throw new HttpError(500, error.message);
        return json({ ok: true });
      }

      // ───────────── list members ─────────────
      case 'list_members': {
        let q = admin.from('profiles').select('*').order('created_at', { ascending: true });
        if (caller.role === 'PlatformAdmin') {
          const cid = str(body.company_id, 60);
          if (cid) q = q.eq('company_id', cid);
        } else if (caller.role === 'CompanyAdmin' && caller.companyId) {
          q = q.eq('company_id', caller.companyId);
        } else {
          throw new HttpError(403, 'You do not have permission to view team members');
        }
        const { data: profiles, error } = await q;
        if (error) throw new HttpError(500, error.message);

        const wanted = new Set((profiles ?? []).map((p) => p.user_id));
        const auth = new Map<string, { confirmed: boolean; last: string | null }>();
        for (let page = 1; wanted.size > auth.size; page++) {
          const { data, error: lerr } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
          if (lerr) throw new HttpError(500, lerr.message);
          for (const u of data.users) {
            if (wanted.has(u.id)) auth.set(u.id, { confirmed: !!u.email_confirmed_at, last: u.last_sign_in_at ?? null });
          }
          if (data.users.length < 1000) break;
        }
        const members = (profiles ?? []).map((p) => ({
          user_id: p.user_id,
          email: p.email,
          display_name: p.display_name,
          role: p.role,
          company_id: p.company_id,
          created_at: p.created_at,
          status: auth.get(p.user_id)?.confirmed ? 'active' : 'invited',
          last_sign_in_at: auth.get(p.user_id)?.last ?? null,
        }));
        return json({ members });
      }

      default:
        throw new HttpError(400, 'Unknown action');
    }
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: 'Something went wrong' }, 500);
  }
});
