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

export const DEMO_ADMIN_USER: User = {
  id: 'USR-DEMO-ADMIN-001',
  name: 'SahkaarSetu Operations Administrator',
  email: 'admin@sahkaarsetu.local',
  role: 'ADMIN',
  avatar: 'AD',
};

export function mapBackendUserToUser(bUser: BackendAdminUser): User {
  const initials = bUser.full_name
    ? bUser.full_name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  return {
    id: bUser.id,
    name: bUser.full_name || 'SahkaarSetu Operations Administrator',
    email: bUser.email || 'admin@sahkaarsetu.local',
    role: 'ADMIN',
    assignedPacs: bUser.assigned_pacs || undefined,
    avatar: initials || 'AD',
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

export function getStoredUser(): User {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEMO_ADMIN_USER,
          ...parsed,
          role: 'ADMIN', // Enforce Admin in demo mode
        };
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return DEMO_ADMIN_USER;
}

export function setStoredUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(DEMO_ADMIN_USER));
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

export async function fetchCurrentUser(): Promise<User> {
  const token = getStoredToken();
  try {
    const res = await request<BackendAdminUser>('/api/admin/auth/me');
    if (res.data && res.data.id) {
      const user = mapBackendUserToUser(res.data);
      setStoredUser(user);
      return user;
    }
  } catch {
    // Fall back to default admin in demo mode
  }

  // Token is expired, absent, or backend in demo mode
  setStoredUser(DEMO_ADMIN_USER);
  return DEMO_ADMIN_USER;
}

export async function switchDevRole(_role?: Role): Promise<User> {
  return DEMO_ADMIN_USER;
}

export async function logout(): Promise<void> {
  try {
    await request('/api/admin/auth/logout', { method: 'POST' });
  } catch {
    // Ignore error on logout call
  } finally {
    setStoredToken(null);
    setStoredUser(DEMO_ADMIN_USER);
  }
}


