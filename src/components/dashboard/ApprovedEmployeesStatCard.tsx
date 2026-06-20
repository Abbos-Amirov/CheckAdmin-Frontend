import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { Card } from '@/components/common/Card';
import type { Receipt } from '@/types/receipt.types';
import styles from './StatCard.module.scss';

type Props = {
  receipts: Receipt[];
  loading?: boolean;
  icon?: ReactNode;
};

type ApprovedEmployee = {
  employeeId: string;
  employeeName: string;
  checksCount: number;
};

export function ApprovedEmployeesStatCard({ receipts, loading = false, icon }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const approvedEmployees = useMemo(() => {
    const map = new Map<string, ApprovedEmployee>();
    for (const r of receipts) {
      if (r.status !== 'APPROVED') continue;
      const existing = map.get(r.employeeId);
      if (existing) {
        existing.checksCount += 1;
      } else {
        map.set(r.employeeId, { employeeId: r.employeeId, employeeName: r.employeeName, checksCount: 1 });
      }
    }
    return [...map.values()].sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName, undefined, { sensitivity: 'base' }),
    );
  }, [receipts]);

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        {icon ? <span className={`${styles.iconBadge} ${styles.success}`}>{icon}</span> : null}
        <div className={styles.label}>{t('approvedEmployeesLabel')}</div>
      </div>
      {approvedEmployees.length > 0 ? (
        <button
          type="button"
          className={styles.valueBtn}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          {loading ? '…' : approvedEmployees.length}
        </button>
      ) : (
        <div className={styles.value}>{loading ? '…' : 0}</div>
      )}
      <div className={styles.hintPill}>{t('approvedEmployeesHint')}</div>

      {open && approvedEmployees.length > 0 && (
        <>
          <div className={styles.dropdownBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.dropdown} role="menu">
            {approvedEmployees.map((emp) => (
              <div key={emp.employeeId} className={styles.dropdownItem} role="menuitem">
                <span className={styles.dropdownName}>{emp.employeeName}</span>
                <span className={styles.dropdownCount}>
                  {t('pendingChecksCount', { count: emp.checksCount })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
