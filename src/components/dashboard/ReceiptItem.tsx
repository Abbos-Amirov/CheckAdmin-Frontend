import { useI18n } from '@/app/providers/I18nProvider';
import type { WorkplaceType } from '@/types/employee.types';
import type { Receipt } from '@/types/receipt.types';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/common/Button';
import styles from './ReceiptItem.module.scss';

type Props = {
  receipt: Receipt;
  workplace: WorkplaceType;
  monthlyAllocation: number;
  onApprove: () => void;
  onReject: () => void;
};

export function ReceiptItem({
  receipt,
  workplace,
  monthlyAllocation,
  onApprove,
  onReject,
}: Props) {
  const { t, locale } = useI18n();
  const isInternal = workplace === 'INTERNAL';

  return (
    <div className={styles.row}>
      <div className={styles.icon} aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
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
        <div className={styles.lines}>
          <div className={styles.line}>
            <span className={styles.lineLabel}>{t('receiptChequeLine')}</span>
            <span className={styles.lineValue}>
              {formatCurrency(receipt.amount, locale)} {t('currency')}
            </span>
          </div>
          <div className={styles.line}>
            <span className={styles.lineLabel}>{t('receiptMonthlyAllocation')}</span>
            <span className={styles.lineValueEm}>
              {formatCurrency(monthlyAllocation, locale)} {t('currency')}
            </span>
          </div>
        </div>
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
