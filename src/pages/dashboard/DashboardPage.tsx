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
import { StatCard } from '@/components/dashboard/StatCard';
import { formatCompactMonthlySum, formatCurrency } from '@/utils/format';
import {
  DEMO_CALENDAR_DEFAULT_YEAR,
  DEMO_RECEIPTS_MONTH,
} from '@/utils/receiptMonthFilter';
import styles from './DashboardPage.module.scss';

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

  const periodTotal = useMemo(
    () => periodReceipts.reduce((sum, r) => sum + r.amount, 0),
    [periodReceipts],
  );

  const approvedCount = useMemo(
    () => periodReceipts.filter((r) => r.status === 'APPROVED').length,
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
          label={t('totalEmployees')}
          value={employeesLoading ? '…' : employeeStats.total}
          hint={t('dashboardEmployeesBreakdown', {
            internal: employeeStats.internal,
            external: employeeStats.external,
          })}
        />
        <StatCard
          label={t('pendingReceiptsStat')}
          value={checksLoading ? '…' : pendingCount}
          hint={t('dashboardUploadedChecksHint', { count: uploadedChecksCount })}
          tone="warning"
        />
        <StatCard
          label={t('monthlyTotal')}
          value={`${formatCompactMonthlySum(periodTotal, locale)}`}
          hint={t('currency')}
        />
        <StatCard
          label={t('approved')}
          value={approvedCount}
          hint={t('reportsSent')}
          tone="success"
        />
        <StatCard
          label={t('payrollInternal')}
          value={formatBudgetValue(internalBudget)}
          hint={`${t('payrollMonthHint')} · ${t('currency')}`}
          onClick={(event) => openPayrollEditor('internal', event)}
          clickAriaLabel={t('payrollDisbursementEditAria', { label: t('payrollInternal') })}
        />
        <StatCard
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
