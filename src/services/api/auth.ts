import { Role, User } from '../../types';
import { request, TOKEN_STORAGE_KEY } from './client';

export const AUTH_USER_KEY = 'sahkaarsetu_admin_auth_user';

export interface BackendAdminUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  assigned_pacs: string | null;
  is_active: boolean;
  last_login?: string | null;
}

export interface LoginResponseData {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: BackendAdminUser;
}

export const PRESET_DEV_CREDENTIALS: Record<Role, { email: string; password: string; name: string; role: Role }> = {
  ADMIN: {
    email: 'admin@sahkaarsetu.local',
    password: 'SahkaarSetu@Admin2026',
    name: 'SahkaarSetu Administrator',
    role: 'ADMIN',
  },
  STAFF: {
    email: 'staff@sahkaarsetu.local',
    password: 'SahkaarSetu@Staff2026',
    name: 'PACS Operations Staff',
    role: 'STAFF',
  },
};

export function mapBackendUserToUser(bUser: BackendAdminUser): User {
  const initials = bUser.full_name
    ? bUser.full_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : bUser.role === 'ADMIN'
    ? 'AD'
    : 'ST';

  return {
    id: bUser.id,
    name: bUser.full_name || (bUser.role === 'ADMIN' ? 'System Administrator' : 'PACS Staff'),
    email: bUser.email,
    role: bUser.role,
    assignedPacs: bUser.assigned_pacs || undefined,
    avatar: initials,
  };
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
}

export function setStoredUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch {
    // Ignore storage write error
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const res = await request<LoginResponseData>('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });

  if (res.data && res.data.access_token) {
    setStoredToken(res.data.access_token);
    const user = mapBackendUserToUser(res.data.user);
    setStoredUser(user);
    return { success: true, user };
  }

  return {
    success: false,
    error: res.error || 'Authentication failed. Please check credentials or backend connection.',
  };
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) {
    setStoredUser(null);
    return null;
  }

  const res = await request<BackendAdminUser>('/api/admin/auth/me');
  if (res.data && res.data.id) {
    const user = mapBackendUserToUser(res.data);
    setStoredUser(user);
    return user;
  }

  // Token is expired or invalid
  logout();
  return null;
}

export async function switchDevRole(role: Role): Promise<User | null> {
  const creds = PRESET_DEV_CREDENTIALS[role];
  const res = await login(creds.email, creds.password);
  return res.user || null;
}

export async function logout(): Promise<void> {
  try {
    await request('/api/admin/auth/logout', { method: 'POST' });
  } catch {
    // Ignore error on logout call
  } finally {
    setStoredToken(null);
    setStoredUser(null);
  }
}

