import { useMemo } from 'react';
import {
  PAYROLL_CAP_EXTERNAL_WON,
  PAYROLL_CAP_INTERNAL_WON,
} from '@/data/mockDashboard';
import { useI18n } from '@/app/providers/I18nProvider';
import type { Employee } from '@/types/employee.types';
import { formatCurrency } from '@/utils/format';
import { Card } from '@/components/common/Card';
import styles from './EmployeeProgressCard.module.scss';

type Props = {
  employees: Employee[];
};

function payrollCap(emp: Employee): number {
  return emp.workplace === 'INTERNAL' ? PAYROLL_CAP_INTERNAL_WON : PAYROLL_CAP_EXTERNAL_WON;
}

export function EmployeeProgressCard({ employees }: Props) {
  const { t, locale } = useI18n();

  const rows = useMemo(
    () =>
      employees.map((emp) => {
        const cap = payrollCap(emp);
        /** Demo: ishchi kartasidagi oylik ovqat puli — limit bilan solishtiriladi. */
        const spent = emp.monthlyAmount;
        const utilization = cap > 0 ? spent / cap : 0;
        const pctFill = Math.min(100, Math.max(0, utilization * 100));
        const labelLeftPct = Math.min(96, Math.max(4, pctFill));

        const barClass =
          utilization >= 0.92 ? styles.barWarn : utilization >= 0.7 ? styles.barMid : styles.barOk;

        return { emp, cap, spent, pctFill, labelLeftPct, barClass };
      }),
    [employees],
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
