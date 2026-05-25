import { apiFetch } from '@/api/client';
import type {
  AdminAuthResponse,
  AdminLoginRequest,
  AdminSignupRequest,
  AdminUser,
  AuthSession,
} from '@/types/auth.types';

type RawUser = Partial<AdminUser> & { name?: string; _id?: string };

function normalizeUser(raw: RawUser | undefined, employeeIdFallback: string): AdminUser {
  return {
    id: raw?.id ?? raw?._id ?? employeeIdFallback,
    employeeId: raw?.employeeId ?? employeeIdFallback,
    fullName: raw?.fullName ?? raw?.name ?? employeeIdFallback,
    phone: raw?.phone,
    email: raw?.email,
    role: raw?.role,
  };
}

function unwrapAuthPayload(response: AdminAuthResponse): AdminAuthResponse {
  if (!response.data) return response;

  return {
    ...response,
    accessToken: response.data.accessToken ?? response.accessToken,
    token: response.data.token ?? response.token,
    admin: response.data.admin ?? response.admin,
    user: response.data.user ?? response.user,
  };
}

export function parseAuthSession(
  response: AdminAuthResponse,
  employeeIdFallback: string,
): AuthSession {
  const payload = unwrapAuthPayload(response);
  const token = payload.accessToken ?? payload.token;
  if (!token) {
    throw new Error('Token missing in auth response');
  }

  const user = normalizeUser(payload.admin ?? payload.user, employeeIdFallback);
  return { token, user };
}

export async function adminLogin(body: AdminLoginRequest): Promise<AuthSession> {
  const response = await apiFetch<AdminAuthResponse>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseAuthSession(response, body.employeeId);
}

export async function adminSignup(body: AdminSignupRequest): Promise<AuthSession> {
  const response = await apiFetch<AdminAuthResponse>('/auth/admin/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseAuthSession(response, body.employeeId);
}

export async function adminLogout(token: string): Promise<void> {
  await apiFetch('/auth/admin/logout', { method: 'POST' }, token);
}
