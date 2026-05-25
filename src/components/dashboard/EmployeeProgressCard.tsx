import { useMemo } from 'react';
import {
  PAYROLL_CAP_EXTERNAL_WON,
  PAYROLL_CAP_INTERNAL_WON,
} from '@/data/mockDashboard';
import { useI18n } from '@/app/providers/I18nProvider';
import type { Employee } from '@/types/employee.types';
import type { Receipt } from '@/types/receipt.types';
import { receiptInYearMonth } from '@/utils/receiptMonthFilter';
import { formatCurrency } from '@/utils/format';
import { Card } from '@/components/common/Card';
import styles from './EmployeeProgressCard.module.scss';

type Props = {
  employees: Employee[];
  receipts: Receipt[];
  year: number;
  month: number;
  internalBudget?: number | null;
  externalBudget?: number | null;
};

function payrollCap(
  emp: Employee,
  internalBudget: number | null | undefined,
  externalBudget: number | null | undefined,
): number {
  if (emp.workplace === 'INTERNAL') {
    return internalBudget ?? PAYROLL_CAP_INTERNAL_WON;
  }
  return externalBudget ?? PAYROLL_CAP_EXTERNAL_WON;
}

export function EmployeeProgressCard({
  employees,
  receipts,
  year,
  month,
  internalBudget,
  externalBudget,
}: Props) {
  const { t, locale } = useI18n();

  const rows = useMemo(
    () =>
      employees.map((emp) => {
        const cap = payrollCap(emp, internalBudget, externalBudget);
        const spent = receipts
          .filter(
            (r) =>
              r.employeeId === emp.id &&
              receiptInYearMonth(r.createdAt, year, month),
          )
          .reduce((sum, r) => sum + r.amount, 0);
        const utilization = cap > 0 ? spent / cap : 0;
        const pctFill = Math.min(100, Math.max(0, utilization * 100));
        const labelLeftPct = Math.min(96, Math.max(4, pctFill));

        const barClass =
          utilization >= 0.92 ? styles.barWarn : utilization >= 0.7 ? styles.barMid : styles.barOk;

        return { emp, cap, spent, pctFill, labelLeftPct, barClass };
      }),
    [employees, receipts, year, month, internalBudget, externalBudget],
  );

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t('submittedEmployees')}</h2>
      </div>
      <ul className={styles.list}>
        {rows.map(({ emp, cap, spent, pctFill, labelLeftPct, barClass }) => (
          <li key={emp.id} className={styles.row}>
            <div className={styles.rowTop}>
              <span className={styles.name}>{emp.fullName}</span>
              <span className={styles.cap} title={t('employeeProgressCapTitle')}>
                {formatCurrency(cap, locale)} {t('currency')}
              </span>
            </div>
            <div className={styles.barBlock}>
              <span
                className={styles.spentTag}
                style={{ left: `${labelLeftPct}%` }}
              >
                {formatCurrency(spent, locale)} {t('currency')}
              </span>
              <div className={styles.track} aria-hidden>
                <div
                  className={`${styles.bar} ${barClass}`}
                  style={{ width: `${Math.round(pctFill)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
