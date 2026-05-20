import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { useReceipts } from '@/app/providers/ReceiptsProvider';
import {
  DEFAULT_PAYROLL_DISBURSED_EXTERNAL_WON,
  DEFAULT_PAYROLL_DISBURSED_INTERNAL_WON,
  mockDashboardMeta,
  mockDashboardStats,
  mockEmployees,
} from '@/data/mockDashboard';
import { YearMonthToolbar } from '@/components/common/YearMonthToolbar';
import { EmployeeProgressCard } from '@/components/dashboard/EmployeeProgressCard';
import { PayrollDisbursementPopover } from '@/components/dashboard/PayrollDisbursementPopover';
import { PendingReceiptsCard } from '@/components/dashboard/PendingReceiptsCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatCompactMonthlySum, formatCurrency } from '@/utils/format';
import {
  DEMO_CALENDAR_DEFAULT_YEAR,
  DEMO_RECEIPTS_MONTH,
  receiptInYearMonth,
} from '@/utils/receiptMonthFilter';
import { payrollPeriodKey } from '@/utils/payrollDisbursement';
import styles from './DashboardPage.module.scss';

type PayrollDisbursementByPeriod = Record<
  string,
  { internal: number; external: number }
>;

type PayrollEditorKind = 'internal' | 'external';

type PayrollEditorState = {
  kind: PayrollEditorKind;
  anchorRect: DOMRect;
};

export function DashboardPage() {
  const { receipts, approveReceipt, rejectReceipt } = useReceipts();
  const { t, locale } = useI18n();
  const [selectedYear, setSelectedYear] = useState(DEMO_CALENDAR_DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(DEMO_RECEIPTS_MONTH);
  const [payrollByPeriod, setPayrollByPeriod] = useState<PayrollDisbursementByPeriod>({});
  const [payrollEditor, setPayrollEditor] = useState<PayrollEditorState | null>(null);

  const countsByMonth = useMemo(() => {
    const arr = Array.from({ length: 12 }, () => 0);
    for (const r of receipts) {
      const d = new Date(r.createdAt);
      if (d.getUTCFullYear() === selectedYear) {
        arr[d.getUTCMonth()] += 1;
      }
    }
    return arr;
  }, [receipts, selectedYear]);

  const periodReceipts = useMemo(
    () =>
      receipts.filter((r) =>
        receiptInYearMonth(r.createdAt, selectedYear, selectedMonth),
      ),
    [receipts, selectedYear, selectedMonth],
  );

  const pendingCount = useMemo(
    () => periodReceipts.filter((r) => r.status === 'PENDING').length,
    [periodReceipts],
  );

  const periodTotal = useMemo(
    () => periodReceipts.reduce((sum, r) => sum + r.amount, 0),
    [periodReceipts],
  );

  const approvedCount = useMemo(
    () => periodReceipts.filter((r) => r.status === 'APPROVED').length,
    [periodReceipts],
  );

  const periodKey = payrollPeriodKey(selectedYear, selectedMonth);

  const payrollDisbursedInternal = useMemo(
    () =>
      payrollByPeriod[periodKey]?.internal ?? DEFAULT_PAYROLL_DISBURSED_INTERNAL_WON,
    [payrollByPeriod, periodKey],
  );

  const payrollDisbursedExternal = useMemo(
    () =>
      payrollByPeriod[periodKey]?.external ?? DEFAULT_PAYROLL_DISBURSED_EXTERNAL_WON,
    [payrollByPeriod, periodKey],
  );

  const openPayrollEditor = (
    kind: PayrollEditorKind,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    setPayrollEditor({
      kind,
      anchorRect: event.currentTarget.getBoundingClientRect(),
    });
  };

  const closePayrollEditor = () => setPayrollEditor(null);

  const savePayrollDisbursement = (amount: number) => {
    if (!payrollEditor) return;

    setPayrollByPeriod((prev) => ({
      ...prev,
      [periodKey]: {
        internal:
          payrollEditor.kind === 'internal'
            ? amount
            : (prev[periodKey]?.internal ?? DEFAULT_PAYROLL_DISBURSED_INTERNAL_WON),
        external:
          payrollEditor.kind === 'external'
            ? amount
            : (prev[periodKey]?.external ?? DEFAULT_PAYROLL_DISBURSED_EXTERNAL_WON),
      },
    }));
    closePayrollEditor();
  };

  const payrollEditorLabel =
    payrollEditor?.kind === 'internal' ? t('payrollInternal') : t('payrollExternal');

  const payrollEditorInitialValue =
    payrollEditor?.kind === 'internal'
      ? payrollDisbursedInternal
      : payrollEditor?.kind === 'external'
        ? payrollDisbursedExternal
        : DEFAULT_PAYROLL_DISBURSED_INTERNAL_WON;

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

      <section className={styles.stats} aria-label={t('dashboard')}>
        <StatCard
          label={t('totalEmployees')}
          value={mockDashboardStats.totalEmployees}
          hint={t('newThisMonth', {
            count: mockDashboardMeta.newEmployeesThisMonth,
          })}
        />
        <StatCard
          label={t('pendingReceiptsStat')}
          value={pendingCount}
          hint={t('needConfirmation')}
          tone="warning"
        />
        <StatCard
          label={t('monthlyTotal')}
          value={`${formatCompactMonthlySum(periodTotal || mockDashboardStats.monthlyTotal, locale)}`}
          hint={t('currency')}
        />
        <StatCard
          label={t('approved')}
          value={approvedCount || mockDashboardStats.approvedReports}
          hint={t('reportsSent')}
          tone="success"
        />
        <StatCard
          label={t('payrollInternal')}
          value={`${formatCurrency(payrollDisbursedInternal, locale)}`}
          hint={`${t('payrollMonthHint')} · ${t('currency')}`}
          onClick={(event) => openPayrollEditor('internal', event)}
          clickAriaLabel={t('payrollDisbursementEditAria', { label: t('payrollInternal') })}
        />
        <StatCard
          label={t('payrollExternal')}
          value={`${formatCurrency(payrollDisbursedExternal, locale)}`}
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
        onSave={savePayrollDisbursement}
        onClose={closePayrollEditor}
      />

      <section className={styles.grid}>
        <EmployeeProgressCard
          employees={mockEmployees}
          receipts={receipts}
          year={selectedYear}
          month={selectedMonth}
        />
        <PendingReceiptsCard
          receipts={receipts}
          year={selectedYear}
          month={selectedMonth}
          payrollDisbursedInternal={payrollDisbursedInternal}
          payrollDisbursedExternal={payrollDisbursedExternal}
          onApprove={approveReceipt}
          onReject={rejectReceipt}
        />
      </section>
    </div>
  );
}
