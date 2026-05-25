import { useCallback, useEffect, useState } from 'react';
import { fetchAdminChecks } from '@/api/checks';
import { useAuth } from '@/app/providers/AuthProvider';

export function useAdminCheckCountsByMonth(year: number) {
  const { token } = useAuth();
  const [countsByMonth, setCountsByMonth] = useState<number[]>(() =>
    Array.from({ length: 12 }, () => 0),
  );

  const load = useCallback(async () => {
    if (!token) {
      setCountsByMonth(Array.from({ length: 12 }, () => 0));
      return;
    }

    try {
      const data = await fetchAdminChecks(year, null, token);
      const arr = Array.from({ length: 12 }, () => 0);
      for (const check of data.checks) {
        const monthPart = check.month.split('-')[1];
        const monthIndex = Number(monthPart) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          arr[monthIndex] += 1;
        }
      }
      setCountsByMonth(arr);
    } catch {
      setCountsByMonth(Array.from({ length: 12 }, () => 0));
    }
  }, [token, year]);

  useEffect(() => {
    void load();
  }, [load]);

  return { countsByMonth, reload: load };
}
