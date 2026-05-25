import { apiFetch } from '@/api/client';
import type { AdminChecksResponse, ApiCheck } from '@/types/check.types';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function unwrapEnvelope<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && payload.data !== undefined) {
    return payload.data;
  }
  return payload as T;
}

export async function fetchAdminChecks(
  year: number,
  month: number | null,
  token: string,
  status?: 'pending' | 'approved' | 'rejected',
): Promise<AdminChecksResponse> {
  const query = new URLSearchParams({
    year: String(year),
  });
  if (month !== null) {
    query.set('month', String(month));
  }
  if (status) {
    query.set('status', status);
  }

  const response = await apiFetch<ApiEnvelope<AdminChecksResponse>>(
    `/admin/checks?${query.toString()}`,
    { method: 'GET' },
    token,
  );
  return unwrapEnvelope(response);
}

export async function approveAdminCheck(id: string, token: string): Promise<ApiCheck> {
  const response = await apiFetch<ApiEnvelope<{ check: ApiCheck }>>(
    `/admin/checks/${id}/approve`,
    { method: 'PATCH' },
    token,
  );
  return unwrapEnvelope(response).check;
}

export async function rejectAdminCheck(
  id: string,
  token: string,
  adminNote?: string,
): Promise<ApiCheck> {
  const response = await apiFetch<ApiEnvelope<{ check: ApiCheck }>>(
    `/admin/checks/${id}/reject`,
    {
      method: 'PATCH',
      body: JSON.stringify(adminNote ? { adminNote } : {}),
    },
    token,
  );
  return unwrapEnvelope(response).check;
}
