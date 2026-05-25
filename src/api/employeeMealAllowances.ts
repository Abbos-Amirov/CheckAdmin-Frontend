import { apiFetch } from '@/api/client';
import type {
  AllowanceGroupType,
  AllowanceSummary,
  EmployeeMealAllowance,
  PatchEmployeeMealAllowanceExtraRequest,
  SaveEmployeeMealAllowanceRequest,
} from '@/types/employeeMealAllowance.types';

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

export async function fetchEmployeeMealAllowances(
  year: number,
  month: number,
  token: string,
  groupType?: AllowanceGroupType,
): Promise<EmployeeMealAllowance[]> {
  const query = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  if (groupType) {
    query.set('groupType', groupType);
  }

  const response = await apiFetch<ApiEnvelope<EmployeeMealAllowance[]>>(
    `/admin/employee-meal-allowances?${query.toString()}`,
    { method: 'GET' },
    token,
  );
  return unwrapEnvelope(response);
}

export async function fetchEmployeeMealAllowanceSummary(
  year: number,
  month: number,
  token: string,
): Promise<AllowanceSummary> {
  const query = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const response = await apiFetch<ApiEnvelope<AllowanceSummary>>(
    `/admin/employee-meal-allowances/summary?${query.toString()}`,
    { method: 'GET' },
    token,
  );
  return unwrapEnvelope(response);
}

export async function fetchEmployeeMealAllowanceByEmployee(
  employeeId: string,
  year: number,
  month: number,
  token: string,
): Promise<EmployeeMealAllowance> {
  const query = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const response = await apiFetch<ApiEnvelope<EmployeeMealAllowance>>(
    `/admin/employee-meal-allowances/${employeeId}?${query.toString()}`,
    { method: 'GET' },
    token,
  );
  return unwrapEnvelope(response);
}

export async function saveEmployeeMealAllowance(
  body: SaveEmployeeMealAllowanceRequest,
  token: string,
): Promise<EmployeeMealAllowance> {
  const response = await apiFetch<ApiEnvelope<EmployeeMealAllowance>>(
    '/admin/employee-meal-allowances',
    {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        extraAmount: body.extraAmount ?? 0,
      }),
    },
    token,
  );
  return unwrapEnvelope(response);
}

export async function patchEmployeeMealAllowanceExtra(
  employeeId: string,
  body: PatchEmployeeMealAllowanceExtraRequest,
  token: string,
): Promise<EmployeeMealAllowance> {
  const response = await apiFetch<ApiEnvelope<EmployeeMealAllowance>>(
    `/admin/employee-meal-allowances/${employeeId}/extra`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
    token,
  );
  return unwrapEnvelope(response);
}
