import { apiFetch } from '@/api/client';

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

export type MonthlyReceiptStatus = 'APPROVED' | 'REJECTED' | 'PENDING';

export type PatchMonthlyReceiptStatusRequest = {
  employeeId: string;
  year: number;
  month: number;
  status: MonthlyReceiptStatus;
  rejectReason?: string;
};

export type PatchMonthlyReceiptStatusResponse = {
  employeeId: string;
  year: number;
  month: number;
  status: MonthlyReceiptStatus;
  updatedCount: number;
  totalAmount: number;
  notificationId: string;
};

export async function patchMonthlyReceiptStatus(
  body: PatchMonthlyReceiptStatusRequest,
  token: string,
): Promise<PatchMonthlyReceiptStatusResponse> {
  const response = await apiFetch<ApiEnvelope<PatchMonthlyReceiptStatusResponse>>(
    '/admin/receipts/monthly-status',
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
    token,
  );
  return unwrapEnvelope(response);
}
