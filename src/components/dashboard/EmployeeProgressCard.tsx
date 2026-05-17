import { useMemo } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import type { Employee } from '@/types/employee.types';
import { formatCurrency } from '@/utils/format';
import { Card } from '@/components/common/Card';
import styles from './EmployeeProgressCard.module.scss';

type Props = {
  employees: Employee[];
};

export function EmployeeProgressCard({ employees }: Props) {
  const { t, locale } = useI18n();

  const maxAmount = useMemo(
    () => Math.max(...employees.map((e) => e.monthlyAmount), 1),
    [employees],
  );

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t('submittedEmployees')}</h2>
      </div>
      <ul className={styles.list}>
        {employees.map((emp) => {
          const ratio = emp.monthlyAmount / maxAmount;
          const barClass =
            ratio < 0.35 ? styles.barWarn : ratio < 0.65 ? styles.barMid : styles.barOk;

          return (
            <li key={emp.id} className={styles.row}>
              <div className={styles.rowTop}>
                <span className={styles.name}>{emp.fullName}</span>
                <span className={styles.amount}>
                  {formatCurrency(emp.monthlyAmount, locale)} {t('currency')}
                </span>
              </div>
              <div className={styles.track} aria-hidden>
                <div
                  className={`${styles.bar} ${barClass}`}
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
