import { apiFetch } from '@/api/client';
import type { AdminChecksResponse, ApiCheck, EmployeeChecksResponse } from '@/types/check.types';

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

function formatMonthQuery(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export async function fetchAdminChecks(
  year: number,
  month: number | null,
  token: string,
  status?: 'pending' | 'approved' | 'rejected',
): Promise<AdminChecksResponse> {
  const query = new URLSearchParams();
  if (month !== null) {
    query.set('month', formatMonthQuery(year, month));
  } else {
    query.set('year', String(year));
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

export type FetchEmployeeChecksOptions = {
  year: number;
  month: number;
};

export async function fetchEmployeeChecks(
  employeeId: string,
  token: string,
  options?: FetchEmployeeChecksOptions,
): Promise<EmployeeChecksResponse> {
  const suffix = options
    ? `?month=${formatMonthQuery(options.year, options.month)}`
    : '';
  const response = await apiFetch<ApiEnvelope<EmployeeChecksResponse>>(
    `/admin/checks/employee/${employeeId}${suffix}`,
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
