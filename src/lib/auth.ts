export type UserRole = 'Superadmin' | 'AssetManager' | 'User';

export interface AuthUser {
  username: string;
  role: UserRole;
  displayName: string;
}

const VALID_USERS: Record<string, { password: string; user: AuthUser }> = {
  Superadmin: {
    password: 'P@ssw0d#123456',
    user: { username: 'Superadmin', role: 'Superadmin', displayName: 'Superadmin' },
  },
  AssetManager: {
    password: 'M@n@ger$123456',
    user: { username: 'AssetManager', role: 'AssetManager', displayName: 'Asset Manager' },
  },
  user: {
    password: 'u$er##123456',
    user: { username: 'user', role: 'User', displayName: 'User' },
  },
};

const STORAGE_KEY = 'assethub_auth';

export function authenticate(username: string, password: string): AuthUser | null {
  const entry = VALID_USERS[username];
  if (!entry) return null;
  if (entry.password !== password) return null;
  return entry.user;
}

export function saveSession(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function loadSession(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
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
    case 'Superadmin':
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
