import { useCallback, useEffect, useState } from 'react';
import {
  fetchApprovedEmployees,
  fetchApprovedEmployeesSummary,
} from '@/api/approvedEmployees';
import { fetchEmployeeChecks } from '@/api/checks';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { ApiError } from '@/api/client';
import type {
  ApprovedEmployeesList,
  ApprovedEmployeesSummary,
} from '@/types/approvedEmployees.types';
import type { EmployeeChecksResponse } from '@/types/check.types';

export function useApprovedEmployeesReports(year: number) {
  const { token } = useAuth();
  const { t } = useI18n();

  const [summary, setSummary] = useState<ApprovedEmployeesSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [monthData, setMonthData] = useState<ApprovedEmployeesList | null>(null);
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState<string | null>(null);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [checksData, setChecksData] = useState<EmployeeChecksResponse | null>(null);
  const [checksLoading, setChecksLoading] = useState(false);
  const [checksError, setChecksError] = useState<string | null>(null);

  const resolveErrorMessage = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 0) {
        return t('checksBackendOffline');
      }
      if (err instanceof ApiError && err.message !== 'NETWORK_ERROR') {
        return err.message;
      }
      return t('reportsLoadError');
    },
    [t],
  );

  const loadSummary = useCallback(async () => {
    if (!token) {
      setSummary(null);
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    try {
      const data = await fetchApprovedEmployeesSummary(year, token);
      setSummary(data);
      setSummaryError(null);
    } catch (err) {
      setSummaryError(resolveErrorMessage(err));
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [token, year, resolveErrorMessage]);

  const loadMonthEmployees = useCallback(
    async (month: number) => {
      if (!token) return;

      setMonthLoading(true);
      setSelectedEmployeeId(null);
      setChecksData(null);
      setChecksError(null);

      try {
        const data = await fetchApprovedEmployees(year, month, token);
        setMonthData(data);
        setMonthError(null);
      } catch (err) {
        setMonthError(resolveErrorMessage(err));
        setMonthData(null);
      } finally {
        setMonthLoading(false);
      }
    },
    [token, year, resolveErrorMessage],
  );

  const loadEmployeeChecks = useCallback(
    async (employeeId: string, month: number) => {
      if (!token) return;

      setChecksLoading(true);
      try {
        const data = await fetchEmployeeChecks(employeeId, token, { year, month });
        setChecksData(data);
        setChecksError(null);
      } catch (err) {
        setChecksError(resolveErrorMessage(err));
        setChecksData(null);
      } finally {
        setChecksLoading(false);
      }
    },
    [token, year, resolveErrorMessage],
  );

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (selectedMonth === null) {
      setMonthData(null);
      setMonthError(null);
      setSelectedEmployeeId(null);
      setChecksData(null);
      return;
    }
    void loadMonthEmployees(selectedMonth);
  }, [selectedMonth, loadMonthEmployees]);

  useEffect(() => {
    if (!selectedEmployeeId || selectedMonth === null) {
      setChecksData(null);
      setChecksError(null);
      return;
    }
    void loadEmployeeChecks(selectedEmployeeId, selectedMonth);
  }, [selectedEmployeeId, selectedMonth, loadEmployeeChecks]);

  const selectMonth = useCallback((month: number | null) => {
    setSelectedMonth(month);
    setSelectedEmployeeId(null);
  }, []);

  const selectEmployee = useCallback((employeeId: string | null) => {
    setSelectedEmployeeId(employeeId);
  }, []);

  const getMonthApprovedCount = useCallback(
    (month: number) => {
      return summary?.months.find((m) => m.month === month)?.approvedCount ?? 0;
    },
    [summary],
  );

  return {
    summary,
    summaryLoading,
    summaryError,
    reloadSummary: loadSummary,
    selectedMonth,
    selectMonth,
    monthData,
    monthLoading,
    monthError,
    selectedEmployeeId,
    selectEmployee,
    checksData,
    checksLoading,
    checksError,
    getMonthApprovedCount,
  };
}
