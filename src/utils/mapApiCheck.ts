import type { ApiCheck } from '@/types/check.types';
import type { Receipt, ReceiptStatus } from '@/types/receipt.types';
import { resolveMediaUrl } from '@/utils/apiUser';
import { workTypeToWorkplace } from '@/utils/employeeAllowance';

function mapStatus(status: ApiCheck['status']): ReceiptStatus {
  return status.toUpperCase() as ReceiptStatus;
}

export function mapApiCheckToReceipt(check: ApiCheck): Receipt {
  const user = check.user;
  const employeeId = user?._id ?? String(check.userId);
  const employeeName = user?.fullName ?? '—';
  const idStr = check._id;

  const receiptCode = user?.employeeId
    ? `${user.employeeId}-${idStr.slice(-6).toUpperCase()}`
    : idStr.slice(-8).toUpperCase();

  const createdAt = check.createdAt
    ? new Date(check.createdAt).toISOString()
    : check.checkDate
      ? new Date(`${check.checkDate}T00:00:00.000Z`).toISOString()
      : new Date().toISOString();

  const lineItems = (check.items ?? []).map((item) => ({
    name: item.name,
    quantity: 1,
    unitPrice: item.price,
    lineTotal: item.price,
  }));

  return {
    id: idStr,
    receiptCode,
    storeName: check.storeName ?? '—',
    employeeId,
    employeeName,
    amount: check.amount,
    imageUrl: resolveMediaUrl(check.imageUrl),
    status: mapStatus(check.status),
    createdAt,
    month: check.month,
    rejectReason: check.rejectReason ?? null,
    lineItems,
    payment: {
      method: check.cardInfo ? '카드' : '—',
      cardIssuer: check.cardInfo ?? '—',
      maskedCardNumber: '—',
    },
    employeeWorkplace: user ? workTypeToWorkplace(user.workType) : undefined,
    employeePhotoUrl: user?.avatarUrl ? resolveMediaUrl(user.avatarUrl) : undefined,
    employeeCode: user?.employeeId,
  };
}
