import type { MouseEvent } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import type { WorkplaceType } from '@/types/employee.types';
import type { Receipt } from '@/types/receipt.types';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/common/Button';
import styles from './ReceiptItem.module.scss';

type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type Props = {
  receipt: Receipt;
  workplace: WorkplaceType;
  monthlyAllocation: number | null;
  monthReceiptsTotal: number;
  employeePhotoUrl: string;
  employeeInitial: string;
  reviewStatus?: ReviewStatus;
  approveLabel?: string;
  rejectLabel?: string;
  actionsDisabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onAllocationClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

export function ReceiptItem({
  receipt,
  workplace,
  monthlyAllocation,
  monthReceiptsTotal,
  employeePhotoUrl,
  employeeInitial,
  reviewStatus = 'PENDING',
  approveLabel,
  rejectLabel,
  actionsDisabled = false,
  onApprove,
  onReject,
  onAllocationClick,
}: Props) {
  const { t, locale } = useI18n();
  const isInternal = workplace === 'INTERNAL';
  const isApproved = reviewStatus === 'APPROVED';
  const isRejected = reviewStatus === 'REJECTED';
  const isReviewed = isApproved || isRejected;

  const rowClass = [
    styles.row,
    isApproved ? styles.rowApproved : '',
    isRejected ? styles.rowRejected : '',
  ]
    .filter(Boolean)
    .join(' ');

  const allocationLabel =
    monthlyAllocation === null
      ? t('mealBudgetNotSet')
      : `${formatCurrency(monthlyAllocation, locale)} ${t('currency')}`;

  return (
    <div className={rowClass}>
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
          <div className={`${styles.stat} ${onAllocationClick ? styles.statClickable : ''}`.trim()}>
            <dt>{t('receiptMonthlyAllocation')}</dt>
            <dd className={styles.statAllocation}>
              {onAllocationClick ? (
                <button
                  type="button"
                  className={styles.allocationBtn}
                  onClick={onAllocationClick}
                  aria-label={t('employeeAllowanceEditAria')}
                >
                  {allocationLabel}
                </button>
              ) : (
                allocationLabel
              )}
            </dd>
          </div>
        </dl>
      </div>
      <div className={styles.actions}>
        <Button
          variant="outline"
          type="button"
          className={`${isApproved ? styles.btnApprovedActive : ''}`.trim()}
          onClick={onApprove}
          disabled={actionsDisabled || isReviewed}
          aria-pressed={isApproved}
        >
          {isApproved ? t('pendingApprovedDone') : (approveLabel ?? t('approve'))}
        </Button>
        <Button
          variant="outline"
          type="button"
          className={`${isRejected ? styles.btnRejectedActive : ''}`.trim()}
          onClick={onReject}
          disabled={actionsDisabled || isReviewed}
          aria-pressed={isRejected}
        >
          {isRejected ? t('pendingRejectedDone') : (rejectLabel ?? t('reject'))}
        </Button>
      </div>
    </div>
  );
}
