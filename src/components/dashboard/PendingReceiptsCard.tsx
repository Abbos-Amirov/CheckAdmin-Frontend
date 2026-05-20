import { useMemo } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import {
  EMPLOYEE_MONTHLY_ALLOCATION_EXTERNAL_WON,
  EMPLOYEE_MONTHLY_ALLOCATION_INTERNAL_WON,
  mockEmployees,
} from '@/data/mockDashboard';
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
  payrollDisbursedInternal: number;
  payrollDisbursedExternal: number;
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

/** Dashboard: har bir ishchi uchun faqat bitta kutilayotgan chek kartochkasi. */
function onePendingReceiptPerEmployee(list: Receipt[]): Receipt[] {
  const byEmployee = new Map<string, Receipt>();
  for (const receipt of list) {
    const existing = byEmployee.get(receipt.employeeId);
    if (
      !existing ||
      new Date(receipt.createdAt).getTime() > new Date(existing.createdAt).getTime()
    ) {
      byEmployee.set(receipt.employeeId, receipt);
    }
  }
  return [...byEmployee.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function PendingReceiptsCard({
  receipts,
  year,
  month,
  payrollDisbursedInternal,
  payrollDisbursedExternal,
  onApprove,
  onReject,
}: Props) {
  const { t, locale } = useI18n();

  const byId = useMemo(
    () => new Map(mockEmployees.map((e) => [e.id, e])),
    [],
  );

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
    return {
      internalList: onePendingReceiptPerEmployee(internal),
      externalList: onePendingReceiptPerEmployee(external),
    };
  }, [pending, byId]);

  const renderSection = (
    titleKey: 'payrollInternal' | 'payrollExternal',
    groupBudget: number,
    list: Receipt[],
    monthlyAllocation: number,
  ) => (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{t(titleKey)}</h3>
        <p className={styles.sectionBudget}>
          {t('pendingGroupBudget')}: {formatCurrency(groupBudget, locale)} {t('currency')}
        </p>
      </div>
      {list.length === 0 ? (
        <p className={styles.sectionEmpty}>{t('noPending')}</p>
      ) : (
        <ul className={styles.groupList}>
          {list.map((receipt) => {
            const emp = byId.get(receipt.employeeId);
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
          {renderSection(
            'payrollInternal',
            payrollDisbursedInternal,
            internalList,
            EMPLOYEE_MONTHLY_ALLOCATION_INTERNAL_WON,
          )}
          {renderSection(
            'payrollExternal',
            payrollDisbursedExternal,
            externalList,
            EMPLOYEE_MONTHLY_ALLOCATION_EXTERNAL_WON,
          )}
        </div>
      )}
    </Card>
  );
}
