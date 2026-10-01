import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'PlatformAdmin' | 'CompanyAdmin' | 'AssetManager' | 'User';

export const ROLE_LABELS: Record<UserRole, string> = {
  PlatformAdmin: 'Platform Admin',
  CompanyAdmin: 'Company Admin',
  AssetManager: 'Asset Manager',
  User: 'User',
};

export interface AuthUser {
  email: string;
  role: UserRole;
  displayName: string;
  companyId: string;
  companyName: string;
}

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

// Who the person is comes from their Supabase account (app_metadata is set
// server-side by the admin-api function and cannot be edited by the user).
export function userFromSession(session: Session | null): AuthUser | null {
  const user = session?.user;
  if (!session || !user) return null;
  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const role = meta.role as UserRole;
  if (!ROLES.includes(role)) return null;
  const companyId = typeof meta.company_id === 'string' ? meta.company_id : '';
  if (role !== 'PlatformAdmin' && !companyId) return null;
  const email = user.email ?? '';
  return {
    email,
    role,
    displayName: typeof meta.display_name === 'string' && meta.display_name ? meta.display_name : email,
    companyId,
    companyName:
      role === 'PlatformAdmin' ? 'Platform Admin' : typeof meta.company_name === 'string' ? meta.company_name : companyId,
  };
}

export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error || !data.session) return null;
  const user = userFromSession(data.session);
  if (!user) {
    await supabase.auth.signOut();
    return null;
  }
  return user;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function sendPasswordReset(email: string): Promise<void> {
  await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: window.location.origin });
}

export async function setPassword(password: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password });
  return error ? error.message : null;
}

export interface Permissions {
  canDelete: boolean;
  canImport: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canLogUpdate: boolean;
  canExport: boolean;
  allowedChangeTypes: ChangeType[];
}

import type { ChangeType } from '@/types';

export function getPermissions(role: UserRole): Permissions {
  switch (role) {
    case 'CompanyAdmin':
      return {
        canDelete: true,
        canImport: true,
        canAdd: true,
        canEdit: true,
        canLogUpdate: true,
        canExport: true,
        allowedChangeTypes: ['Status', 'Location', 'Reassignment', 'Note'],
      };
    case 'AssetManager':
      return {
        canDelete: false,
        canImport: true,
        canAdd: true,
        canEdit: true,
        canLogUpdate: true,
        canExport: true,
        allowedChangeTypes: ['Status', 'Location', 'Reassignment', 'Note'],
      };
    case 'PlatformAdmin':
      return {
        canDelete: false,
        canImport: false,
        canAdd: false,
        canEdit: false,
        canLogUpdate: false,
        canExport: false,
        allowedChangeTypes: [],
      };
    case 'User':
      return {
        canDelete: false,
        canImport: false,
        canAdd: false,
        canEdit: false,
        canLogUpdate: true,
        canExport: true,
        allowedChangeTypes: ['Status', 'Reassignment'],
      };
  }
}
