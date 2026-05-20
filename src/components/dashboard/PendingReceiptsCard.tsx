import { useMemo } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { mockEmployees } from '@/data/mockDashboard';
import type { Receipt } from '@/types/receipt.types';
import type { WorkplaceType } from '@/types/employee.types';
import { receiptInYearMonth } from '@/utils/receiptMonthFilter';
import { formatCurrency } from '@/utils/format';
import { Card } from '@/components/common/Card';
import { ReceiptItem } from '@/components/dashboard/ReceiptItem';
import styles from './PendingReceiptsCard.module.scss';

type Props = {
  receipts: Receipt[];
  year: number;
  month: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
};

function employeeMonthReceiptsTotal(
  allReceipts: Receipt[],
  employeeId: string,
  year: number,
  month: number,
): number {
  return allReceipts
    .filter(
      (r) =>
        r.employeeId === employeeId && receiptInYearMonth(r.createdAt, year, month),
    )
    .reduce((sum, r) => sum + r.amount, 0);
}

export function PendingReceiptsCard({
  receipts,
  year,
  month,
  onApprove,
  onReject,
}: Props) {
  const { t, locale } = useI18n();

  const { byId, internalBudget, externalBudget } = useMemo(() => {
    const map = new Map(mockEmployees.map((e) => [e.id, e]));
    let internal = 0;
    let external = 0;
    for (const e of mockEmployees) {
      if (e.workplace === 'INTERNAL') internal += e.monthlyAmount;
      else external += e.monthlyAmount;
    }
    return { byId: map, internalBudget: internal, externalBudget: external };
  }, []);

  const pending = receipts.filter(
    (r) =>
      r.status === 'PENDING' && receiptInYearMonth(r.createdAt, year, month),
  );

  const { internalList, externalList } = useMemo(() => {
    const internal: Receipt[] = [];
    const external: Receipt[] = [];
    for (const r of pending) {
      const emp = byId.get(r.employeeId);
      const wp: WorkplaceType = emp?.workplace ?? 'EXTERNAL';
      if (wp === 'INTERNAL') internal.push(r);
      else external.push(r);
    }
    return { internalList: internal, externalList: external };
  }, [pending, byId]);

  const renderSection = (
    titleKey: 'payrollInternal' | 'payrollExternal',
    budget: number,
    list: Receipt[],
  ) => (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{t(titleKey)}</h3>
        <p className={styles.sectionBudget}>
          {t('pendingGroupBudget')}: {formatCurrency(budget, locale)} {t('currency')}
        </p>
      </div>
      {list.length === 0 ? (
        <p className={styles.sectionEmpty}>{t('noPending')}</p>
      ) : (
        <ul className={styles.groupList}>
          {list.map((receipt) => {
            const emp = byId.get(receipt.employeeId);
            const monthlyAllocation = emp?.monthlyAmount ?? 0;
            const workplace = emp?.workplace ?? 'EXTERNAL';
            const monthReceiptsTotal = employeeMonthReceiptsTotal(
              receipts,
              receipt.employeeId,
              year,
              month,
            );
            const photoUrl = emp?.photoUrl ?? '';
            const initial = receipt.employeeName.trim().charAt(0).toUpperCase() || '?';

            return (
              <li key={receipt.id}>
                <ReceiptItem
                  receipt={receipt}
                  workplace={workplace}
                  monthlyAllocation={monthlyAllocation}
                  monthReceiptsTotal={monthReceiptsTotal}
                  employeePhotoUrl={photoUrl}
                  employeeInitial={initial}
                  onApprove={() => onApprove(receipt.id)}
                  onReject={() => onReject(receipt.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t('pendingReceipts')}</h2>
      </div>

      {pending.length === 0 ? (
        <p className={styles.empty}>{t('noPending')}</p>
      ) : (
        <div className={styles.groups}>
          {renderSection('payrollInternal', internalBudget, internalList)}
          {renderSection('payrollExternal', externalBudget, externalList)}
        </div>
      )}
    </Card>
  );
}
