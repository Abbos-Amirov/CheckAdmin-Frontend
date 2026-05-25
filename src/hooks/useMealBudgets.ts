import { useCallback, useEffect, useState } from 'react';
import { fetchMealBudgets, saveMealBudget } from '@/api/mealBudgets';
import { useAuth } from '@/app/providers/AuthProvider';
import { ApiError } from '@/api/client';
import type { MealBudgetGroupType } from '@/types/mealBudget.types';

export type MealBudgetKind = 'internal' | 'external';

function groupTypeForKind(kind: MealBudgetKind): MealBudgetGroupType {
  return kind === 'internal' ? 'INSIDE_FACTORY' : 'OUTSIDE_FACTORY';
}

export function useMealBudgets(year: number, month: number) {
  const { token } = useAuth();
  const [internalBudget, setInternalBudget] = useState<number | null>(null);
  const [externalBudget, setExternalBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setInternalBudget(null);
      setExternalBudget(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchMealBudgets(year, month, token);
      setInternalBudget(data.insideFactory?.totalBudget ?? null);
      setExternalBudget(data.outsideFactory?.totalBudget ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load meal budgets');
    } finally {
      setLoading(false);
    }
  }, [token, year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveBudget = useCallback(
    async (kind: MealBudgetKind, amount: number) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      setSaving(true);
      try {
        const saved = await saveMealBudget(
          {
            year,
            month,
            groupType: groupTypeForKind(kind),
            totalBudget: amount,
          },
          token,
        );

        if (kind === 'internal') {
          setInternalBudget(saved.totalBudget);
        } else {
          setExternalBudget(saved.totalBudget);
        }
        setError(null);
      } finally {
        setSaving(false);
      }
    },
    [token, year, month],
  );

  return {
    internalBudget,
    externalBudget,
    loading,
    saving,
    error,
    saveBudget,
    reload: load,
  };
}
