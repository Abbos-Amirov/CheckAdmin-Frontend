import { useMemo, useState } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { useReceipts } from '@/app/providers/ReceiptsProvider';
import {
  mockDashboardMeta,
  mockDashboardStats,
  mockEmployees,
} from '@/data/mockDashboard';
import { YearMonthToolbar } from '@/components/common/YearMonthToolbar';
import { EmployeeProgressCard } from '@/components/dashboard/EmployeeProgressCard';
import { PendingReceiptsCard } from '@/components/dashboard/PendingReceiptsCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatCompactMonthlySum, formatCurrency } from '@/utils/format';
import {
  DEMO_CALENDAR_DEFAULT_YEAR,
  DEMO_RECEIPTS_MONTH,
  receiptInYearMonth,
} from '@/utils/receiptMonthFilter';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  const { receipts, approveReceipt, rejectReceipt } = useReceipts();
  const { t, locale } = useI18n();
  const [selectedYear, setSelectedYear] = useState(DEMO_CALENDAR_DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(DEMO_RECEIPTS_MONTH);

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

  const { payrollInternalTotal, payrollExternalTotal } = useMemo(() => {
    let internal = 0;
    let external = 0;
    for (const emp of mockEmployees) {
      if (emp.workplace === 'INTERNAL') internal += emp.monthlyAmount;
      else external += emp.monthlyAmount;
    }
    return {
      payrollInternalTotal: internal,
      payrollExternalTotal: external,
    };
  }, []);

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
          value={`${formatCurrency(payrollInternalTotal, locale)}`}
          hint={`${t('payrollMonthHint')} · ${t('currency')}`}
        />
        <StatCard
          label={t('payrollExternal')}
          value={`${formatCurrency(payrollExternalTotal, locale)}`}
          hint={`${t('payrollMonthHint')} · ${t('currency')}`}
        />
      </section>

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
          onApprove={approveReceipt}
          onReject={rejectReceipt}
        />
      </section>
    </div>
  );
}
