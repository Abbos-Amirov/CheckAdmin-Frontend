import { useMemo } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import type { Employee } from '@/types/employee.types';
import type { EmployeeMealAllowance } from '@/types/employeeMealAllowance.types';
import type { Receipt } from '@/types/receipt.types';
import { resolveEmployeeMonthlyAllocation } from '@/utils/employeeAllowance';
import { formatCurrency } from '@/utils/format';
import { Card } from '@/components/common/Card';
import styles from './EmployeeProgressCard.module.scss';

type Props = {
  employees: Employee[];
  receipts: Receipt[];
  internalBudget?: number | null;
  externalBudget?: number | null;
  allowanceMap?: Map<string, EmployeeMealAllowance>;
  loading?: boolean;
};

function payrollCap(
  emp: Employee,
  allowanceMap: Map<string, EmployeeMealAllowance> | undefined,
  internalBudget: number | null | undefined,
  externalBudget: number | null | undefined,
): number {
  const allowance = allowanceMap?.get(emp.id);
  const resolved = resolveEmployeeMonthlyAllocation(
    allowance,
    emp.workplace,
    internalBudget,
    externalBudget,
  );
  return resolved ?? 0;
}

function employeeSpent(receipts: Receipt[], employeeId: string): number {
  return receipts
    .filter((r) => r.employeeId === employeeId && r.status !== 'REJECTED')
    .reduce((sum, r) => sum + r.amount, 0);
}

export function EmployeeProgressCard({
  employees,
  receipts,
  internalBudget,
  externalBudget,
  allowanceMap,
  loading = false,
}: Props) {
  const { t, locale } = useI18n();

  const rows = useMemo(() => {
    const submittedIds = new Set(
      receipts
        .filter((r) => r.status !== 'REJECTED')
        .map((r) => r.employeeId),
    );

    return employees
      .filter((emp) => submittedIds.has(emp.id))
      .map((emp) => {
        const cap = payrollCap(emp, allowanceMap, internalBudget, externalBudget);
        const spent = employeeSpent(receipts, emp.id);
        const utilization = cap > 0 ? spent / cap : 0;
        const pctFill = Math.min(100, Math.max(0, utilization * 100));
        const labelLeftPct = Math.min(96, Math.max(4, pctFill));

        const barClass =
          utilization >= 0.92 ? styles.barWarn : utilization >= 0.7 ? styles.barMid : styles.barOk;

        return { emp, cap, spent, pctFill, labelLeftPct, barClass };
      })
      .sort((a, b) => b.spent - a.spent);
  }, [employees, receipts, internalBudget, externalBudget, allowanceMap]);

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t('submittedEmployees')}</h2>
      </div>
      {loading ? (
        <p className={styles.empty}>{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>{t('submittedEmployeesEmpty')}</p>
      ) : (
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
      )}
    </Card>
  );
}
