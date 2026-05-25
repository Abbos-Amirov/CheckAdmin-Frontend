import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchEmployeeMealAllowances,
  saveEmployeeMealAllowance,
} from '@/api/employeeMealAllowances';
import { fetchAllUsers } from '@/api/users';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { ApiError } from '@/api/client';
import type {
  ApiUser,
  EmployeeMealAllowance,
  SaveEmployeeMealAllowanceRequest,
} from '@/types/employeeMealAllowance.types';
import { allowancesByEmployeeId } from '@/utils/employeeAllowance';

export function useEmployeeMealAllowances(year: number, month: number) {
  const { token } = useAuth();
  const { t } = useI18n();
  const [allowances, setAllowances] = useState<EmployeeMealAllowance[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowanceMap = useMemo(() => allowancesByEmployeeId(allowances), [allowances]);

  const resolveErrorMessage = useCallback(
    (err: unknown, fallbackKey: 'employeeAllowanceLoadError' | 'employeeAllowanceSaveError') => {
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
      setAllowances([]);
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [allowanceList, userList] = await Promise.all([
        fetchEmployeeMealAllowances(year, month, token),
        fetchAllUsers(token),
      ]);
      setAllowances(allowanceList);
      setUsers(userList);
      setError(null);
    } catch (err) {
      setError(resolveErrorMessage(err, 'employeeAllowanceLoadError'));
    } finally {
      setLoading(false);
    }
  }, [token, year, month, resolveErrorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveAllowance = useCallback(
    async (body: SaveEmployeeMealAllowanceRequest) => {
      if (!token) {
        throw new Error('Not authenticated');
      }

      setSaving(true);
      try {
        const saved = await saveEmployeeMealAllowance(body, token);
        setAllowances((prev) => {
          const next = prev.filter((item) => item.employeeId !== saved.employeeId);
          return [...next, saved];
        });
        setError(null);
        return saved;
      } catch (err) {
        const message = resolveErrorMessage(err, 'employeeAllowanceSaveError');
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [token, resolveErrorMessage],
  );

  return {
    allowanceMap,
    users,
    loading,
    saving,
    error,
    saveAllowance,
    reload: load,
  };
}
