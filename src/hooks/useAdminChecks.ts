import { useCallback, useEffect, useState } from 'react';
import { approveAdminCheck, fetchAdminChecks, rejectAdminCheck } from '@/api/checks';
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

  const resolveErrorMessage = useCallback(
    (err: unknown, fallbackKey: 'checksLoadError' | 'checksApproveError' | 'checksRejectError') => {
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

  const load = useCallback(async () => {
    if (!token) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchAdminChecks(year, month, token);
      setReceipts(data.checks.map(mapApiCheckToReceipt));
      setError(null);
    } catch (err) {
      setError(resolveErrorMessage(err, 'checksLoadError'));
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [token, year, month, resolveErrorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const approveReceipt = useCallback(
    async (id: string) => {
      if (!token) return;

      try {
        const updated = await approveAdminCheck(id, token);
        const mapped = mapApiCheckToReceipt(updated);
        setReceipts((prev) => prev.map((r) => (r.id === id ? mapped : r)));
        setActionError(null);
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'checksApproveError'));
      }
    },
    [token, resolveErrorMessage],
  );

  const rejectReceipt = useCallback(
    async (id: string) => {
      if (!token) return;

      try {
        const updated = await rejectAdminCheck(id, token);
        const mapped = mapApiCheckToReceipt(updated);
        setReceipts((prev) => prev.map((r) => (r.id === id ? mapped : r)));
        setActionError(null);
      } catch (err) {
        setActionError(resolveErrorMessage(err, 'checksRejectError'));
      }
    },
    [token, resolveErrorMessage],
  );

  return {
    receipts,
    loading,
    error,
    actionError,
    approveReceipt,
    rejectReceipt,
    reload: load,
  };
}
