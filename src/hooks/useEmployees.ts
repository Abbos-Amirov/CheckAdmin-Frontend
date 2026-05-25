import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAllUsers } from '@/api/users';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { ApiError } from '@/api/client';
import type { Employee } from '@/types/employee.types';
import { filterWorkerUsers, mapApiUserToEmployee } from '@/utils/apiUser';

export function useEmployees() {
  const { token } = useAuth();
  const { t } = useI18n();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const users = await fetchAllUsers(token);
      const mapped = filterWorkerUsers(users)
        .map(mapApiUserToEmployee)
        .sort((a, b) =>
          a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }),
        );
      setEmployees(mapped);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        setError(t('mealBudgetBackendOffline'));
      } else if (err instanceof ApiError && err.message !== 'NETWORK_ERROR') {
        setError(err.message);
      } else {
        setError(t('employeesLoadError'));
      }
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const byId = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );

  const getEmployeeById = useCallback(
    (id: string) => byId.get(id),
    [byId],
  );

  return {
    employees,
    loading,
    error,
    reload: load,
    getEmployeeById,
  };
}
