import { useCallback, useEffect, useState } from 'react';
import { fetchAdminChecks } from '@/api/checks';
import { patchMonthlyReceiptStatus } from '@/api/receipts';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { ApiError } from '@/api/client';
import type { Receipt } from '@/types/receipt.types';
import { mapApiCheckToReceipt } from '@/utils/mapApiCheck';

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
        | 'checksMonthlyRejectError',
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
      if (!token) return;

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
        await load({ silent: true });
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
      if (!token) return;

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
        await load({ silent: true });
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'checksMonthlyRejectError'));
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
    reload: load,
  };
}
