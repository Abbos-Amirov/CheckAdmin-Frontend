import { useCallback, useEffect, useState } from 'react';
import { fetchMealBudgets, saveMealBudget } from '@/api/mealBudgets';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { ApiError } from '@/api/client';
import type { MealBudgetGroupType } from '@/types/mealBudget.types';

export type MealBudgetKind = 'internal' | 'external';

function groupTypeForKind(kind: MealBudgetKind): MealBudgetGroupType {
  return kind === 'internal' ? 'INSIDE_FACTORY' : 'OUTSIDE_FACTORY';
}

export function useMealBudgets(year: number, month: number) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [internalBudget, setInternalBudget] = useState<number | null>(null);
  const [externalBudget, setExternalBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveErrorMessage = useCallback(
    (err: unknown, fallbackKey: 'mealBudgetLoadError' | 'mealBudgetSaveError') => {
      if (err instanceof ApiError && err.status === 0) {
        return t('mealBudgetBackendOffline');
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
      setError(resolveErrorMessage(err, 'mealBudgetLoadError'));
    } finally {
      setLoading(false);
    }
  }, [token, year, month, resolveErrorMessage]);

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
      } catch (err) {
        const message = resolveErrorMessage(err, 'mealBudgetSaveError');
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [token, year, month, resolveErrorMessage],
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
