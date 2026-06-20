import { useCallback, useEffect, useState } from 'react';
import { fetchAdminChecks } from '@/api/checks';
import { patchMonthlyReceiptStatus } from '@/api/receipts';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { ApiError } from '@/api/client';
import type { Receipt } from '@/types/receipt.types';
import { mapApiCheckToReceipt } from '@/utils/mapApiCheck';

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function applyMonthlyStatusToReceipts(
  receipts: Receipt[],
  employeeId: string,
  year: number,
  month: number,
  status: 'APPROVED' | 'REJECTED' | 'PENDING',
): Receipt[] {
  const key = monthKey(year, month);
  const fromStatuses = status === 'PENDING' ? ['APPROVED', 'REJECTED'] : ['PENDING'];
  return receipts.map((receipt) =>
    receipt.employeeId === employeeId &&
    receipt.month === key &&
    fromStatuses.includes(receipt.status)
      ? { ...receipt, status }
      : receipt,
  );
}

export function useAdminChecks(year: number, month: number) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSaving, setActionSaving] = useState(false);

  const resolveErrorMessage = useCallback(
    (
      err: unknown,
      fallbackKey:
        | 'checksLoadError'
        | 'checksMonthlyApproveError'
        | 'checksMonthlyRejectError'
        | 'checksMonthlyRevertError',
    ) => {
      if (err instanceof ApiError && err.status === 0) {
        return t('checksBackendOffline');
      }
      if (err instanceof ApiError && err.message !== 'NETWORK_ERROR') {
        return err.message;
      }
      return t(fallbackKey);
    },
    [t],
  );

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!token) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const data = await fetchAdminChecks(year, month, token);
      setReceipts(data.checks.map(mapApiCheckToReceipt));
      setError(null);
    } catch (err) {
      setError(resolveErrorMessage(err, 'checksLoadError'));
      if (!options?.silent) {
        setReceipts([]);
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [token, year, month, resolveErrorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const approveEmployeeMonth = useCallback(
    async (employeeId: string) => {
      if (!token) {
        throw new Error('Auth token missing');
      }

      setActionSaving(true);
      try {
        await patchMonthlyReceiptStatus(
          {
            employeeId,
            year,
            month,
            status: 'APPROVED',
          },
          token,
        );
        setActionError(null);
        setReceipts((prev) =>
          applyMonthlyStatusToReceipts(prev, employeeId, year, month, 'APPROVED'),
        );
        try {
          await load({ silent: true });
        } catch (loadErr) {
          console.warn('Checks reload after approve failed:', loadErr);
        }
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'checksMonthlyApproveError'));
        throw err;
      } finally {
        setActionSaving(false);
      }
    },
    [token, year, month, load, resolveErrorMessage],
  );

  const rejectEmployeeMonth = useCallback(
    async (employeeId: string, rejectReason: string) => {
      if (!token) {
        throw new Error('Auth token missing');
      }

      setActionSaving(true);
      try {
        await patchMonthlyReceiptStatus(
          {
            employeeId,
            year,
            month,
            status: 'REJECTED',
            rejectReason,
          },
          token,
        );
        setActionError(null);
        setReceipts((prev) =>
          applyMonthlyStatusToReceipts(prev, employeeId, year, month, 'REJECTED'),
        );
        try {
          await load({ silent: true });
        } catch (loadErr) {
          console.warn('Checks reload after reject failed:', loadErr);
        }
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'checksMonthlyRejectError'));
        throw err;
      } finally {
        setActionSaving(false);
      }
    },
    [token, year, month, load, resolveErrorMessage],
  );

  const revertEmployeeMonth = useCallback(
    async (employeeId: string) => {
      if (!token) {
        throw new Error('Auth token missing');
      }

      setActionSaving(true);
      try {
        await patchMonthlyReceiptStatus(
          {
            employeeId,
            year,
            month,
            status: 'PENDING',
          },
          token,
        );
        setActionError(null);
        setReceipts((prev) =>
          applyMonthlyStatusToReceipts(prev, employeeId, year, month, 'PENDING'),
        );
        try {
          await load({ silent: true });
        } catch (loadErr) {
          console.warn('Checks reload after revert failed:', loadErr);
        }
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'checksMonthlyRevertError'));
        throw err;
      } finally {
        setActionSaving(false);
      }
    },
    [token, year, month, load, resolveErrorMessage],
  );

  return {
    receipts,
    loading,
    error,
    actionError,
    actionSaving,
    approveEmployeeMonth,
    rejectEmployeeMonth,
    revertEmployeeMonth,
    reload: load,
  };
}
