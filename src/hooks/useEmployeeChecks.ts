import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchEmployeeChecks } from '@/api/checks';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { ApiError } from '@/api/client';
import type { Receipt } from '@/types/receipt.types';
import { mapApiCheckToReceipt } from '@/utils/mapApiCheck';

export type MonthReceiptStats = {
  count: number;
  total: number;
};

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function buildStatsByMonth(receipts: Receipt[], year: number): MonthReceiptStats[] {
  const totals = Array.from({ length: 12 }, () => ({ count: 0, total: 0 }));
  for (const receipt of receipts) {
    if (!receipt.month?.startsWith(`${year}-`)) continue;
    const monthPart = Number(receipt.month.split('-')[1]);
    if (!Number.isInteger(monthPart) || monthPart < 1 || monthPart > 12) continue;
    const index = monthPart - 1;
    totals[index].count += 1;
    totals[index].total += receipt.amount;
  }
  return totals;
}

export function useEmployeeChecks(employeeId: string | undefined, year: number) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveErrorMessage = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 0) {
        return t('checksBackendOffline');
      }
      if (err instanceof ApiError && err.message !== 'NETWORK_ERROR') {
        return err.message;
      }
      return t('checksLoadError');
    },
    [t],
  );

  const load = useCallback(async () => {
    if (!token || !employeeId) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchEmployeeChecks(employeeId, token);
      const mapped = data.checks
        .map(mapApiCheckToReceipt)
        .filter((receipt) => receipt.month?.startsWith(`${year}-`));
      setReceipts(mapped);
      setError(null);
    } catch (err) {
      setError(resolveErrorMessage(err));
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [token, employeeId, year, resolveErrorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const statsByMonth = useMemo(
    () => buildStatsByMonth(receipts, year),
    [receipts, year],
  );

  const getReceiptsForMonth = useCallback(
    (month: number) =>
      receipts
        .filter((receipt) => receipt.month === monthKey(year, month))
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [receipts, year],
  );

  return {
    receipts,
    statsByMonth,
    getReceiptsForMonth,
    loading,
    error,
    reload: load,
  };
}
