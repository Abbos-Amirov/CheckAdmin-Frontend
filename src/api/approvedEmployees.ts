import { apiFetch } from '@/api/client';
import type {
  ApprovedEmployeesList,
  ApprovedEmployeesSummary,
} from '@/types/approvedEmployees.types';

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

export async function fetchApprovedEmployeesSummary(
  year: number,
  token: string,
): Promise<ApprovedEmployeesSummary> {
  const response = await apiFetch<ApiEnvelope<ApprovedEmployeesSummary>>(
    `/admin/receipts/approved-employees/summary?year=${year}`,
    { method: 'GET' },
    token,
  );
  return unwrapEnvelope(response);
}

export async function fetchApprovedEmployees(
  year: number,
  month: number,
  token: string,
  workType?: 'inside' | 'outside',
): Promise<ApprovedEmployeesList> {
  const query = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  if (workType) {
    query.set('workType', workType);
  }

  const response = await apiFetch<ApiEnvelope<ApprovedEmployeesList>>(
    `/admin/receipts/approved-employees?${query.toString()}`,
    { method: 'GET' },
    token,
  );
  return unwrapEnvelope(response);
}
