import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { useAdminChecks } from '@/hooks/useAdminChecks';
import { useAdminCheckCountsByMonth } from '@/hooks/useAdminCheckCountsByMonth';
import { useEmployeeMealAllowances } from '@/hooks/useEmployeeMealAllowances';
import { useEmployees } from '@/hooks/useEmployees';
import { useMealBudgets } from '@/hooks/useMealBudgets';
import { usePendingReceiptsTracker } from '@/hooks/usePendingReceiptsTracker';
import { YearMonthToolbar } from '@/components/common/YearMonthToolbar';
import { PayrollDisbursementPopover } from '@/components/dashboard/PayrollDisbursementPopover';
import { PendingReceiptsCard } from '@/components/dashboard/PendingReceiptsCard';
import { ApprovedEmployeesStatCard } from '@/components/dashboard/ApprovedEmployeesStatCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatCompactMonthlySum, formatCurrency } from '@/utils/format';
import {
  DEMO_CALENDAR_DEFAULT_YEAR,
  DEMO_RECEIPTS_MONTH,
} from '@/utils/receiptMonthFilter';
import styles from './DashboardPage.module.scss';

function PeopleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 5 18.5V20M21 20v-1.5a3.2 3.2 0 0 0-2.5-3.12M15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM16 4.16a3.5 3.5 0 0 1 0 6.68"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 2h12M6 22h12M7 2c0 5 10 5 10 10s-10 5-10 10M17 2c0 5-10 5-10 10s10 5 10 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 14h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 11.5v.5a9 9 0 1 1-5.3-8.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9 11 3 3 9-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeopleCheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-3A3.5 3.5 0 0 0 1 18.5V20M9.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m15 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M4 21h16M12 21V9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12M8 8h0M8 12h0M8 16h0M16 12h0M16 16h0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 7h11v9H2zM13 11h4l4 3v2h-8zM5.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PayrollEditorKind = 'internal' | 'external';

type PayrollEditorState = {
  kind: PayrollEditorKind;
  anchorRect: DOMRect;
};

export function DashboardPage() {
  const { t, locale } = useI18n();
  const [selectedYear, setSelectedYear] = useState(DEMO_CALENDAR_DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(DEMO_RECEIPTS_MONTH);
  const [payrollEditor, setPayrollEditor] = useState<PayrollEditorState | null>(null);
  const [saveError, setSaveError] = useState('');

  const {
    internalBudget,
    externalBudget,
    saving,
    error: loadError,
    saveBudget,
    reload,
  } = useMealBudgets(selectedYear, selectedMonth);

  const {
    receipts: periodReceipts,
    loading: checksLoading,
    error: checksLoadError,
    actionError: checksActionError,
    actionSaving: checksActionSaving,
    approveEmployeeMonth,
    rejectEmployeeMonth,
    revertEmployeeMonth,
    reload: reloadChecks,
  } = useAdminChecks(selectedYear, selectedMonth);

  const {
    tracked: trackedPendingEmployees,
    markReviewed: markPendingEmployeeReviewed,
    revertToPending: revertPendingEmployeeToPending,
  } = usePendingReceiptsTracker(periodReceipts, selectedYear, selectedMonth);

  const { countsByMonth } = useAdminCheckCountsByMonth(selectedYear);

  const {
    employees,
    loading: employeesLoading,
    error: employeesLoadError,
    reload: reloadEmployees,
  } = useEmployees();

  const {
    allowanceMap,
    users: allowanceUsers,
    saving: allowanceSaving,
    saveAllowance,
    error: allowancesLoadError,
    reload: reloadAllowances,
  } = useEmployeeMealAllowances(selectedYear, selectedMonth);

  const pendingCount = useMemo(
    () => periodReceipts.filter((r) => r.status === 'PENDING').length,
    [periodReceipts],
  );

  const uploadedChecksCount = useMemo(
    () => periodReceipts.filter((r) => r.status !== 'REJECTED').length,
    [periodReceipts],
  );

  const employeeStats = useMemo(() => {
    let internal = 0;
    let external = 0;
    for (const employee of employees) {
      if (employee.workplace === 'INTERNAL') internal += 1;
      else external += 1;
    }
    return { total: employees.length, internal, external };
  }, [employees]);

  const approvedCount = useMemo(
    () => periodReceipts.filter((r) => r.status === 'APPROVED').length,
    [periodReceipts],
  );

  const periodTotal = useMemo(
    () => periodReceipts.reduce((sum, r) => sum + r.amount, 0),
    [periodReceipts],
  );

  const openPayrollEditor = (
    kind: PayrollEditorKind,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    setSaveError('');
    setPayrollEditor({
      kind,
      anchorRect: event.currentTarget.getBoundingClientRect(),
    });
  };

  const closePayrollEditor = () => {
    setSaveError('');
    setPayrollEditor(null);
  };

  const savePayrollDisbursement = async (amount: number) => {
    if (!payrollEditor) return;

    try {
      await saveBudget(payrollEditor.kind, amount);
      closePayrollEditor();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('mealBudgetSaveError'));
    }
  };

  const payrollEditorLabel =
    payrollEditor?.kind === 'internal' ? t('payrollInternal') : t('payrollExternal');

  const payrollEditorInitialValue =
    payrollEditor?.kind === 'internal'
      ? internalBudget
      : payrollEditor?.kind === 'external'
        ? externalBudget
        : null;

  const formatBudgetValue = (amount: number | null) =>
    amount === null
      ? t('mealBudgetNotSet')
      : `${formatCurrency(amount, locale)}`;

  return (
    <div className={styles.page}>
      <YearMonthToolbar
        className={styles.monthToolbar}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        countsByMonth={countsByMonth}
      />

      {loadError ? (
        <div className={styles.apiError} role="alert">
          <p>{loadError}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void reload()}>
            {t('retry')}
          </button>
        </div>
      ) : null}

      {checksLoadError ? (
        <div className={styles.apiError} role="alert">
          <p>{checksLoadError}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void reloadChecks()}>
            {t('retry')}
          </button>
        </div>
      ) : null}

      {checksActionError ? (
        <div className={styles.apiError} role="alert">
          <p>{checksActionError}</p>
        </div>
      ) : null}

      {employeesLoadError ? (
        <div className={styles.apiError} role="alert">
          <p>{employeesLoadError}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void reloadEmployees()}>
            {t('retry')}
          </button>
        </div>
      ) : null}

      {allowancesLoadError ? (
        <div className={styles.apiError} role="alert">
          <p>{allowancesLoadError}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void reloadAllowances()}>
            {t('retry')}
          </button>
        </div>
      ) : null}

      <section className={styles.stats} aria-label={t('dashboard')}>
        <StatCard
          icon={<PeopleIcon />}
          label={t('totalEmployees')}
          value={employeesLoading ? '…' : employeeStats.total}
          hint={t('dashboardEmployeesBreakdown', {
            internal: employeeStats.internal,
            external: employeeStats.external,
          })}
        />
        <StatCard
          icon={<HourglassIcon />}
          label={t('pendingReceiptsStat')}
          value={checksLoading ? '…' : pendingCount}
          hint={t('dashboardUploadedChecksHint', { count: uploadedChecksCount })}
          tone="warning"
        />
        <StatCard
          icon={<WalletIcon />}
          label={t('monthlyTotal')}
          value={`${formatCompactMonthlySum(periodTotal, locale)}`}
          hint={t('currency')}
        />
        <StatCard
          icon={<CheckCircleIcon />}
          label={t('approvedChecksLabel')}
          value={checksLoading ? '…' : approvedCount}
          hint={t('reportsSent')}
          tone="success"
        />
        <ApprovedEmployeesStatCard
          icon={<PeopleCheckIcon />}
          receipts={periodReceipts}
          loading={checksLoading}
        />
        <StatCard
          icon={<BuildingIcon />}
          label={t('payrollInternal')}
          value={formatBudgetValue(internalBudget)}
          hint={`${t('payrollMonthHint')} · ${t('currency')}`}
          onClick={(event) => openPayrollEditor('internal', event)}
          clickAriaLabel={t('payrollDisbursementEditAria', { label: t('payrollInternal') })}
        />
        <StatCard
          icon={<TruckIcon />}
          label={t('payrollExternal')}
          value={formatBudgetValue(externalBudget)}
          hint={`${t('payrollMonthHint')} · ${t('currency')}`}
          onClick={(event) => openPayrollEditor('external', event)}
          clickAriaLabel={t('payrollDisbursementEditAria', { label: t('payrollExternal') })}
        />
      </section>

      <PayrollDisbursementPopover
        open={payrollEditor !== null}
        anchorRect={payrollEditor?.anchorRect ?? null}
        label={payrollEditorLabel}
        initialValue={payrollEditorInitialValue}
        saving={saving}
        saveError={saveError}
        onSave={savePayrollDisbursement}
        onClose={closePayrollEditor}
      />

      <section className={styles.grid}>
        <PendingReceiptsCard
          receipts={periodReceipts}
          year={selectedYear}
          month={selectedMonth}
          payrollDisbursedInternal={internalBudget}
          payrollDisbursedExternal={externalBudget}
          allowanceMap={allowanceMap}
          users={allowanceUsers}
          allowanceSaving={allowanceSaving}
          onSaveAllowance={saveAllowance}
          trackedEmployees={trackedPendingEmployees}
          onMarkReviewed={markPendingEmployeeReviewed}
          onRevertToPending={revertPendingEmployeeToPending}
          loading={checksLoading}
          actionSaving={checksActionSaving}
          onApproveEmployee={approveEmployeeMonth}
          onRejectEmployee={rejectEmployeeMonth}
          onRevertEmployee={revertEmployeeMonth}
        />
      </section>
    </div>
  );
}
