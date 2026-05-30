import { useCallback, useEffect, useState } from 'react';
import type { Receipt } from '@/types/receipt.types';
import {
  onePendingReceiptPerEmployee,
  readPendingReceiptsSession,
  type TrackedEmployeeEntry,
  writePendingReceiptsSession,
} from '@/utils/pendingReceiptsDashboard';

export function usePendingReceiptsTracker(
  receipts: Receipt[],
  year: number,
  month: number,
) {
  const [tracked, setTracked] = useState<Map<string, TrackedEmployeeEntry>>(() =>
    readPendingReceiptsSession(year, month),
  );

  useEffect(() => {
    setTracked(readPendingReceiptsSession(year, month));
  }, [year, month]);

  useEffect(() => {
    const pending = receipts.filter((receipt) => receipt.status === 'PENDING');

    setTracked((prev) => {
      const next = new Map(prev);
      let changed = false;

      for (const receipt of onePendingReceiptPerEmployee(pending)) {
        const key = receipt.employeeId;
        const existing = next.get(key);
        if (!existing) {
          next.set(key, { receipt, reviewStatus: 'PENDING' });
          changed = true;
        } else if (existing.reviewStatus === 'PENDING') {
          next.set(key, { receipt, reviewStatus: 'PENDING' });
          changed = true;
        }
      }

      if (changed) {
        writePendingReceiptsSession(year, month, next);
        return next;
      }
      return prev;
    });
  }, [receipts, year, month]);

  const markReviewed = useCallback(
    (receipt: Receipt, status: 'APPROVED' | 'REJECTED') => {
      setTracked((prev) => {
        const next = new Map(prev).set(receipt.employeeId, { receipt, reviewStatus: status });
        writePendingReceiptsSession(year, month, next);
        return next;
      });
    },
    [year, month],
  );

  const revertToPending = useCallback(
    (receipt: Receipt) => {
      setTracked((prev) => {
        const next = new Map(prev).set(receipt.employeeId, { receipt, reviewStatus: 'PENDING' });
        writePendingReceiptsSession(year, month, next);
        return next;
      });
    },
    [year, month],
  );

  return { tracked, markReviewed, revertToPending };
}
