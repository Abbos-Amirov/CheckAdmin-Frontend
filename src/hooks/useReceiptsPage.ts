import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchEmployeeChecks, fetchAdminChecks, reviewAdminCheck, type CheckReviewStatus } from '@/api/checks';
import { fetchAllUsers } from '@/api/users';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { ApiError } from '@/api/client';
import type { ApiUser } from '@/types/employeeMealAllowance.types';
import type { Receipt } from '@/types/receipt.types';
import { filterWorkerUsers } from '@/utils/apiUser';
import { mapApiCheckToReceipt } from '@/utils/mapApiCheck';
import { useAdminCheckCountsByMonth } from '@/hooks/useAdminCheckCountsByMonth';

export type ReceiptWorkerGroup = {
  employeeId: string;
  employeeName: string;
  receipts: Receipt[];
};

export function groupReceiptsByEmployee(receipts: Receipt[]): ReceiptWorkerGroup[] {
  const map = new Map<string, ReceiptWorkerGroup>();
  for (const receipt of receipts) {
    const existing = map.get(receipt.employeeId);
    if (existing) {
      existing.receipts.push(receipt);
    } else {
      map.set(receipt.employeeId, {
        employeeId: receipt.employeeId,
        employeeName: receipt.employeeName,
        receipts: [receipt],
      });
    }
  }

  for (const group of map.values()) {
    group.receipts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return [...map.values()].sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName, undefined, { sensitivity: 'base' }),
  );
}

export function useReceiptsPage(
  year: number,
  month: number,
  initialEmployeeId?: string | null,
) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    initialEmployeeId ?? null,
  );
  const [workers, setWorkers] = useState<ApiUser[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingChecks, setLoadingChecks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { countsByMonth } = useAdminCheckCountsByMonth(year);

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

  const loadWorkers = useCallback(async () => {
    if (!token) {
      setWorkers([]);
      setLoadingWorkers(false);
      return;
    }

    setLoadingWorkers(true);
    try {
      const users = await fetchAllUsers(token, {
        year,
        month,
        role: 'worker',
        limit: 200,
      });
      const mapped = filterWorkerUsers(users).sort((a, b) =>
        a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }),
      );
      setWorkers(mapped);
    } catch (err) {
      setError(resolveErrorMessage(err));
      setWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  }, [token, year, month, resolveErrorMessage]);

  const loadChecks = useCallback(async () => {
    if (!token) {
      setReceipts([]);
      setLoadingChecks(false);
      return;
    }

    setLoadingChecks(true);
    try {
      if (selectedEmployeeId) {
        const data = await fetchEmployeeChecks(selectedEmployeeId, token, { year, month });
        setReceipts(data.checks.map(mapApiCheckToReceipt));
      } else {
        const data = await fetchAdminChecks(year, month, token);
        setReceipts(data.checks.map(mapApiCheckToReceipt));
      }
      setError(null);
    } catch (err) {
      setError(resolveErrorMessage(err));
      setReceipts([]);
    } finally {
      setLoadingChecks(false);
    }
  }, [token, year, month, selectedEmployeeId, resolveErrorMessage]);

  useEffect(() => {
    void loadWorkers();
  }, [loadWorkers]);

  useEffect(() => {
    void loadChecks();
  }, [loadChecks]);

  const isFirstYearMonth = useRef(true);
  useEffect(() => {
    if (isFirstYearMonth.current) {
      isFirstYearMonth.current = false;
      return;
    }
    setSelectedEmployeeId(null);
  }, [year, month]);

  const groups = useMemo(() => groupReceiptsByEmployee(receipts), [receipts]);

  const reload = useCallback(() => {
    void loadWorkers();
    void loadChecks();
  }, [loadWorkers, loadChecks]);

  const reviewCheck = useCallback(
    async (checkId: string, status: CheckReviewStatus, rejectReason?: string) => {
      if (!token) throw new Error('NO_TOKEN');
      const updated = await reviewAdminCheck(checkId, token, status, rejectReason);
      const mapped = mapApiCheckToReceipt(updated);
      setReceipts((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
      return mapped;
    },
    [token],
  );

  return {
    workers,
    receipts,
    groups,
    selectedEmployeeId,
    setSelectedEmployeeId,
    loading: loadingWorkers || loadingChecks,
    error,
    reload,
    countsByMonth,
    reviewCheck,
  };
}
