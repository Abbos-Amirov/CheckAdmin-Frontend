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

export async function fetchAllUsers(token: string): Promise<ApiUser[]> {
  const response = await apiFetch<ApiEnvelope<UsersAllResponse>>(
    '/admin/users/all',
    { method: 'GET' },
    token,
  );
  const data = unwrapEnvelope(response);
  return data.users ?? [];
}
