import type { Receipt } from '@/types/receipt.types';
import { receiptInYearMonth } from '@/utils/receiptMonthFilter';

export type TrackedEmployeeEntry = {
  receipt: Receipt;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export type EmployeeCardEntry = {
  receipt: Receipt;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export function pendingReceiptsStorageKey(year: number, month: number): string {
  return `pns-dashboard-pending-${year}-${month}`;
}

export function readPendingReceiptsSession(
  year: number,
  month: number,
): Map<string, TrackedEmployeeEntry> {
  try {
    const raw = sessionStorage.getItem(pendingReceiptsStorageKey(year, month));
    if (!raw) return new Map();
    const entries = JSON.parse(raw) as [string, TrackedEmployeeEntry][];
    return new Map(entries);
  } catch {
    return new Map();
  }
}

export function writePendingReceiptsSession(
  year: number,
  month: number,
  map: Map<string, TrackedEmployeeEntry>,
): void {
  try {
    sessionStorage.setItem(
      pendingReceiptsStorageKey(year, month),
      JSON.stringify([...map.entries()]),
    );
  } catch {
    // sessionStorage to'lgan yoki mavjud emas — UI baribir state bilan ishlaydi
  }
}

export function receiptMatchesMonth(receipt: Receipt, year: number, month: number): boolean {
  if (receipt.month) {
    const [y, m] = receipt.month.split('-').map(Number);
    if (Number.isFinite(y) && Number.isFinite(m)) {
      return y === year && m === month;
    }
  }
  return receiptInYearMonth(receipt.createdAt, year, month);
}

/** Dashboard: har bir ishchi uchun faqat bitta kutilayotgan chek kartochkasi. */
export function onePendingReceiptPerEmployee(list: Receipt[]): Receipt[] {
  const byEmployee = new Map<string, Receipt>();
  for (const receipt of list) {
    const existing = byEmployee.get(receipt.employeeId);
    if (
      !existing ||
      new Date(receipt.createdAt).getTime() > new Date(existing.createdAt).getTime()
    ) {
      byEmployee.set(receipt.employeeId, receipt);
    }
  }
  return [...byEmployee.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function latestReceiptForEmployee(
  allReceipts: Receipt[],
  employeeId: string,
  year: number,
  month: number,
): Receipt | undefined {
  return allReceipts
    .filter(
      (receipt) =>
        receipt.employeeId === employeeId &&
        receiptMatchesMonth(receipt, year, month),
    )
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
}

export function buildCardsFromTracked(
  trackedEmployees: Map<string, TrackedEmployeeEntry>,
  allReceipts: Receipt[],
  year: number,
  month: number,
): EmployeeCardEntry[] {
  return [...trackedEmployees.entries()]
    .map(([employeeId, entry]) => ({
      receipt:
        latestReceiptForEmployee(allReceipts, employeeId, year, month) ?? entry.receipt,
      reviewStatus: entry.reviewStatus,
    }))
    .sort(
      (a, b) => new Date(b.receipt.createdAt).getTime() - new Date(a.receipt.createdAt).getTime(),
    );
}
