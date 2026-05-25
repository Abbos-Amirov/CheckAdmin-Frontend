import { useI18n } from '@/app/providers/I18nProvider';
import type { WorkplaceType } from '@/types/employee.types';
import type { Receipt } from '@/types/receipt.types';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/common/Button';
import styles from './ReceiptItem.module.scss';

type Props = {
  receipt: Receipt;
  workplace: WorkplaceType;
  monthlyAllocation: number | null;
  /** Shu oy (demo) barcha cheklar summasi — ishchi bo‘yicha. */
  monthReceiptsTotal: number;
  employeePhotoUrl: string;
  employeeInitial: string;
  onApprove: () => void;
  onReject: () => void;
};

export function ReceiptItem({
  receipt,
  workplace,
  monthlyAllocation,
  monthReceiptsTotal,
  employeePhotoUrl,
  employeeInitial,
  onApprove,
  onReject,
}: Props) {
  const { t, locale } = useI18n();
  const isInternal = workplace === 'INTERNAL';

  return (
    <div className={styles.row}>
      <div className={styles.avatarCol}>
        {employeePhotoUrl ? (
          <img
            className={styles.avatar}
            src={employeePhotoUrl}
            alt=""
            width={52}
            height={52}
          />
        ) : (
          <div className={styles.avatarFallback} aria-hidden>
            {employeeInitial}
          </div>
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{receipt.employeeName}</span>
          <span
            className={`${styles.typeBadge} ${isInternal ? styles.typeIn : styles.typeOut}`}
          >
            {isInternal ? t('workplaceInternalShort') : t('workplaceExternalShort')}
          </span>
        </div>

        <div className={styles.codeBlock}>
          <span className={styles.codeLabel}>{t('receiptTransactionCode')}</span>
          <span className={styles.codeValue}>{receipt.receiptCode}</span>
        </div>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>{t('pendingReceiptMonthTotal')}</dt>
            <dd className={styles.statHighlight}>
              {formatCurrency(monthReceiptsTotal, locale)} {t('currency')}
            </dd>
          </div>
          <div className={styles.stat}>
            <dt>{t('receiptMonthlyAllocation')}</dt>
            <dd className={styles.statAllocation}>
              {monthlyAllocation === null
                ? t('mealBudgetNotSet')
                : `${formatCurrency(monthlyAllocation, locale)} ${t('currency')}`}
            </dd>
          </div>
        </dl>
      </div>
      <div className={styles.actions}>
        <Button variant="outline" type="button" onClick={onApprove}>
          {t('approve')}
        </Button>
        <Button variant="outline" type="button" onClick={onReject}>
          {t('reject')}
        </Button>
      </div>
    </div>
  );
}
