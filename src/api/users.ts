import { apiFetch } from '@/api/client';
import type { ApiUser } from '@/types/employeeMealAllowance.types';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
};

function unwrapEnvelope<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && payload.data !== undefined) {
    return payload.data;
  }
  return payload as T;
}

type UsersAllResponse = {
  users: ApiUser[];
};

export type FetchUsersOptions = {
  year?: number;
  month?: number;
  role?: 'worker' | 'admin';
  limit?: number;
};

export async function fetchAllUsers(
  token: string,
  options?: FetchUsersOptions,
): Promise<ApiUser[]> {
  const query = new URLSearchParams();
  if (options?.year !== undefined) {
    query.set('year', String(options.year));
  }
  if (options?.month !== undefined) {
    query.set('month', String(options.month));
  }
  if (options?.role) {
    query.set('role', options.role);
  }
  if (options?.limit !== undefined) {
    query.set('limit', String(options.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await apiFetch<ApiEnvelope<UsersAllResponse>>(
    `/admin/users/all${suffix}`,
    { method: 'GET' },
    token,
  );
  const data = unwrapEnvelope(response);
  return data.users ?? [];
}
