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
  monthReceiptsCount?: number;
  employeePhotoUrl: string;
  employeeInitial: string;
  reviewStatus?: ReviewStatus;
  approveLabel?: string;
  rejectLabel?: string;
  revertLabel?: string;
  actionsDisabled?: boolean;
  highlighted?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRevert: () => void;
  onViewChecks?: () => void;
  onAllocationClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RevertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12a9 9 0 1 0 3-6.7M3 12V5m0 7h7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReceiptStackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3h10a1 1 0 0 1 1 1v16l-2.5-1.5L13 20l-2.5-1.5L8 20l-2.5-1.5L3 20V8l4-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 9h6M9 13h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReceiptItem({
  receipt,
  workplace,
  monthlyAllocation,
  monthReceiptsTotal,
  monthReceiptsCount = 0,
  employeePhotoUrl,
  employeeInitial,
  reviewStatus = 'PENDING',
  approveLabel,
  rejectLabel,
  revertLabel,
  actionsDisabled = false,
  highlighted = false,
  onApprove,
  onReject,
  onRevert,
  onViewChecks,
  onAllocationClick,
}: Props) {
  const { t, locale } = useI18n();
  const isInternal = workplace === 'INTERNAL';
  const isApproved = reviewStatus === 'APPROVED';
  const isRejected = reviewStatus === 'REJECTED';
  const isReviewed = isApproved || isRejected;

  const allocationLabel =
    monthlyAllocation === null
      ? t('mealBudgetNotSet')
      : `${formatCurrency(monthlyAllocation, locale)} ${t('currency')}`;

  const cap = monthlyAllocation ?? 0;
  const spent = monthReceiptsTotal;
  const utilization = cap > 0 ? spent / cap : 0;
  const pctFill = Math.min(100, Math.max(0, utilization * 100));
  const labelLeftPct = Math.min(96, Math.max(4, pctFill));
  const isOverLimit = cap > 0 && utilization >= 1;
  const barClass =
    utilization >= 0.92 ? styles.barWarn : utilization >= 0.7 ? styles.barMid : styles.barOk;

  const rowClass = [
    styles.row,
    isInternal ? styles.rowInternal : styles.rowExternal,
    isApproved ? styles.rowApproved : '',
    isRejected ? styles.rowRejected : '',
    isOverLimit ? styles.rowOverLimit : '',
    highlighted ? styles.rowHighlighted : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClass}>
      <div className={styles.topRow}>
        <div className={styles.avatarCol}>
          {employeePhotoUrl ? (
            <img
              className={`${styles.avatar} ${isInternal ? styles.avatarIn : styles.avatarOut}`}
              src={employeePhotoUrl}
              alt=""
              width={52}
              height={52}
            />
          ) : (
            <div
              className={`${styles.avatarFallback} ${isInternal ? styles.avatarIn : styles.avatarOut}`}
              aria-hidden
            >
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
            {isOverLimit && (
              <span className={styles.overLimitBadge}>{t('pendingOverLimit')}</span>
            )}
          </div>
          {onViewChecks && (
            <button type="button" className={styles.checksCountBtn} onClick={onViewChecks}>
              <ReceiptStackIcon />
              <span>{t('pendingChecksCount', { count: monthReceiptsCount })}</span>
              <ChevronRightIcon />
            </button>
          )}
        </div>
        <div className={styles.actions}>
          {!isReviewed ? (
            <>
              <Button
                variant="outline"
                type="button"
                className={styles.approveBtn}
                onClick={onApprove}
                disabled={actionsDisabled}
              >
                <CheckIcon />
                {approveLabel ?? t('approve')}
              </Button>
              <Button
                variant="outline"
                type="button"
                className={styles.rejectBtn}
                onClick={onReject}
                disabled={actionsDisabled}
              >
                <CrossIcon />
                {rejectLabel ?? t('reject')}
              </Button>
            </>
          ) : (
            <>
              <span
                className={`${styles.statusBadge} ${isApproved ? styles.btnApprovedActive : styles.btnRejectedActive}`.trim()}
              >
                {isApproved ? <CheckIcon /> : <CrossIcon />}
                {isApproved ? t('pendingApprovedDone') : t('pendingRejectedDone')}
              </span>
              <Button
                variant="outline"
                type="button"
                className={styles.revertBtn}
                onClick={onRevert}
                disabled={actionsDisabled}
              >
                <RevertIcon />
                {revertLabel ?? t('receiptActionRevert')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={`${styles.progressBlock} ${isOverLimit ? styles.progressBlockWarn : ''}`}>
        <div className={styles.progressTop}>
          <span className={styles.progressLabel}>{t('receiptMonthlyAllocation')}</span>
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
            <span className={styles.cap}>{allocationLabel}</span>
          )}
        </div>
        <div className={styles.barBlock}>
          <span className={styles.spentTag} style={{ left: `${labelLeftPct}%` }}>
            {formatCurrency(spent, locale)} {t('currency')}
          </span>
          <div className={styles.track} aria-hidden>
            <div className={`${styles.bar} ${barClass}`} style={{ width: `${Math.round(pctFill)}%` }} />
          </div>
        </div>
        <div className={styles.progressFoot}>
          <span className={styles.progressCaption}>{t('pendingReceiptMonthTotal')}</span>
          <span className={`${styles.progressPct} ${isOverLimit ? styles.progressPctWarn : ''}`}>
            {Math.round(pctFill)}%
          </span>
        </div>
      </div>
    </div>
  );
}
