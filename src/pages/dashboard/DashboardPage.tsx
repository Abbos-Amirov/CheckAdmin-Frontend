import { useMemo } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { useReceipts } from '@/app/providers/ReceiptsProvider';
import {
  mockDashboardMeta,
  mockDashboardStats,
  mockEmployees,
} from '@/data/mockDashboard';
import { EmployeeProgressCard } from '@/components/dashboard/EmployeeProgressCard';
import { PendingReceiptsCard } from '@/components/dashboard/PendingReceiptsCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatCompactMonthlySum, formatCurrency } from '@/utils/format';
import styles from './DashboardPage.module.scss';

export function DashboardPage() {
  const { receipts, approveReceipt, rejectReceipt } = useReceipts();
  const { t, locale } = useI18n();

  const pendingCount = useMemo(
    () => receipts.filter((r) => r.status === 'PENDING').length,
    [receipts],
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
          value={`${formatCompactMonthlySum(mockDashboardStats.monthlyTotal, locale)}`}
          hint={t('currency')}
        />
        <StatCard
          label={t('approved')}
          value={mockDashboardStats.approvedReports}
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
        <EmployeeProgressCard employees={mockEmployees} />
        <PendingReceiptsCard
          receipts={receipts}
          onApprove={approveReceipt}
          onReject={rejectReceipt}
        />
      </section>
    </div>
  );
}
