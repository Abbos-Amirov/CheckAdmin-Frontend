import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { mockReceipts } from '@/data/mockDashboard';
import type { Receipt } from '@/types/receipt.types';

type ReceiptsContextValue = {
  receipts: Receipt[];
  approveReceipt: (id: string) => void;
  rejectReceipt: (id: string) => void;
};

const ReceiptsContext = createContext<ReceiptsContextValue | null>(null);

export function ReceiptsProvider({ children }: { children: ReactNode }) {
  const [receipts, setReceipts] = useState<Receipt[]>(() => [...mockReceipts]);

  const approveReceipt = useCallback((id: string) => {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'APPROVED' as const } : r,
      ),
    );
  }, []);

  const rejectReceipt = useCallback((id: string) => {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'REJECTED' as const } : r,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({ receipts, approveReceipt, rejectReceipt }),
    [receipts, approveReceipt, rejectReceipt],
  );

  return (
    <ReceiptsContext.Provider value={value}>{children}</ReceiptsContext.Provider>
  );
}

export function useReceipts() {
  const ctx = useContext(ReceiptsContext);
  if (!ctx) {
    throw new Error('useReceipts must be used within ReceiptsProvider');
  }
  return ctx;
}
