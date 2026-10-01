import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/auth';

export type MemberRole = Exclude<UserRole, 'PlatformAdmin'>;

export interface Member {
  user_id: string;
  email: string;
  display_name: string;
  role: MemberRole;
  company_id: string;
  created_at: string;
  status: 'active' | 'invited';
  last_sign_in_at: string | null;
}

export interface Company {
  id: string;
  name: string;
  created_at: string;
}

async function call<T = { ok: true }>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: { action, redirect_to: window.location.origin, ...payload },
  });
  if (error) {
    let message = error.message;
    try {
      const body = await (error as unknown as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      /* keep default message */
    }
    if (/Failed to send a request|NetworkError|fetch/i.test(message)) {
      message = 'Could not reach the server. Check that the admin-api function is deployed.';
    }
    throw new Error(message);
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(String(data.error));
  return data as T;
}

export const adminApi = {
  listMembers: async (companyId?: string) =>
    (await call<{ members: Member[] }>('list_members', companyId ? { company_id: companyId } : {})).members,
  createCompany: (name: string, adminName: string, adminEmail: string) =>
    call('create_company', { name, admin_name: adminName, admin_email: adminEmail }),
  inviteUser: (email: string, displayName: string, role: MemberRole, companyId?: string) =>
    call('invite_user', { email, display_name: displayName, role, company_id: companyId }),
  resendInvite: (userId: string) => call('resend_invite', { user_id: userId }),
  changeRole: (userId: string, role: MemberRole) => call('change_role', { user_id: userId, role }),
  removeUser: (userId: string) => call('remove_user', { user_id: userId }),
};
