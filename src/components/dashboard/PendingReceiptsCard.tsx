import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/app/providers/I18nProvider';
import type { Locale } from '@/i18n';
import type {
  ApiUser,
  EmployeeMealAllowance,
  SaveEmployeeMealAllowanceRequest,
} from '@/types/employeeMealAllowance.types';
import type { Receipt } from '@/types/receipt.types';
import type { WorkplaceType } from '@/types/employee.types';
import { formatCurrency } from '@/utils/format';
import {
  groupBudgetForWorkplace,
  resolveAllowanceEditorDefaults,
  resolveEmployeeForReceipt,
  resolveEmployeeMonthlyAllocation,
} from '@/utils/employeeAllowance';
import {
  buildCardsFromTracked,
  receiptMatchesMonth,
  type EmployeeCardEntry,
  type TrackedEmployeeEntry,
} from '@/utils/pendingReceiptsDashboard';
import { Card } from '@/components/common/Card';
import { EmployeeAllowancePopover } from '@/components/dashboard/EmployeeAllowancePopover';
import { MonthlyRejectModal } from '@/components/dashboard/MonthlyRejectModal';
import { ReceiptItem } from '@/components/dashboard/ReceiptItem';
import styles from './PendingReceiptsCard.module.scss';

type Props = {
  receipts: Receipt[];
  year: number;
  month: number;
  payrollDisbursedInternal: number | null;
  payrollDisbursedExternal: number | null;
  allowanceMap: Map<string, EmployeeMealAllowance>;
  users: ApiUser[];
  allowanceSaving?: boolean;
  onSaveAllowance: (
    body: SaveEmployeeMealAllowanceRequest,
  ) => Promise<EmployeeMealAllowance>;
  trackedEmployees: Map<string, TrackedEmployeeEntry>;
  onMarkReviewed: (receipt: Receipt, status: 'APPROVED' | 'REJECTED') => void;
  onRevertToPending: (receipt: Receipt) => void;
  loading?: boolean;
  onApproveEmployee: (employeeId: string) => void | Promise<void>;
  onRejectEmployee: (employeeId: string, rejectReason: string) => void | Promise<void>;
  onRevertEmployee: (employeeId: string) => void | Promise<void>;
  actionSaving?: boolean;
};

type AllowanceEditorState = {
  mongoId: string;
  employeeName: string;
  groupType: 'INSIDE_FACTORY' | 'OUTSIDE_FACTORY';
  baseAmount: number;
  extraAmount: number;
  reason: string;
  anchorRect: DOMRect;
};

function employeeMonthReceipts(
  allReceipts: Receipt[],
  employeeId: string,
  year: number,
  month: number,
): Receipt[] {
  return allReceipts.filter(
    (r) => r.employeeId === employeeId && receiptMatchesMonth(r, year, month),
  );
}

function employeeMonthReceiptsTotal(
  allReceipts: Receipt[],
  employeeId: string,
  year: number,
  month: number,
): number {
  return employeeMonthReceipts(allReceipts, employeeId, year, month).reduce(
    (sum, r) => sum + r.amount,
    0,
  );
}

function formatBudgetLabel(
  amount: number | null,
  locale: Locale,
  currencyLabel: string,
  notSetLabel: string,
) {
  if (amount === null) return notSetLabel;
  return `${formatCurrency(amount, locale)} ${currencyLabel}`;
}

type RejectModalState = {
  employeeId: string;
  employeeName: string;
  receipt: Receipt;
};

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M4 21h16M12 21V9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12M8 8h0M8 12h0M8 16h0M16 12h0M16 16h0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 7h11v9H2zM13 11h4l4 3v2h-8zM5.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM17.5 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function splitCardsByWorkplace(
  cards: EmployeeCardEntry[],
  users: ApiUser[],
): { internalList: EmployeeCardEntry[]; externalList: EmployeeCardEntry[] } {
  const internal: EmployeeCardEntry[] = [];
  const external: EmployeeCardEntry[] = [];

  for (const card of cards) {
    const resolved = resolveEmployeeForReceipt(card.receipt, users);
    const wp: WorkplaceType = resolved?.workplace ?? card.receipt.employeeWorkplace ?? 'EXTERNAL';
    if (wp === 'INTERNAL') internal.push(card);
    else external.push(card);
  }

  return { internalList: internal, externalList: external };
}

export function PendingReceiptsCard({
  receipts,
  year,
  month,
  payrollDisbursedInternal,
  payrollDisbursedExternal,
  allowanceMap,
  users,
  allowanceSaving = false,
  onSaveAllowance,
  trackedEmployees,
  onMarkReviewed,
  onRevertToPending,
  loading = false,
  onApproveEmployee,
  onRejectEmployee,
  onRevertEmployee,
  actionSaving = false,
}: Props) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [editor, setEditor] = useState<AllowanceEditorState | null>(null);
  const [saveError, setSaveError] = useState('');
  const [rejectModal, setRejectModal] = useState<RejectModalState | null>(null);
  const [rejectError, setRejectError] = useState('');
  const [savingEmployeeId, setSavingEmployeeId] = useState<string | null>(null);
  const [openOverLimit, setOpenOverLimit] = useState<'internal' | 'external' | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const sectionRowId = (employeeId: string) => `pending-emp-${employeeId}`;

  const goToEmployee = (employeeId: string) => {
    setOpenOverLimit(null);
    const el = document.getElementById(sectionRowId(employeeId));
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedId(employeeId);
    window.setTimeout(() => {
      setHighlightedId((prev) => (prev === employeeId ? null : prev));
    }, 2000);
  };

  const goToEmployeeChecks = (employeeId: string) => {
    navigate(`/receipts?employeeId=${employeeId}&year=${year}&month=${month}`);
  };

  const employeeCards = useMemo(
    () => buildCardsFromTracked(trackedEmployees, receipts, year, month),
    [trackedEmployees, receipts, year, month],
  );

  const { internalList, externalList } = useMemo(
    () => splitCardsByWorkplace(employeeCards, users),
    [employeeCards, users],
  );

  const hasAnyCards = employeeCards.length > 0;

  const openAllowanceEditor = (
    receipt: Receipt,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const resolved = resolveEmployeeForReceipt(receipt, users);
    if (!resolved) {
      setSaveError(t('employeeAllowanceUnresolved'));
      return;
    }

    const allowance = allowanceMap.get(resolved.mongoId);
    const groupBudget = groupBudgetForWorkplace(
      resolved.workplace,
      payrollDisbursedInternal,
      payrollDisbursedExternal,
    );
    const defaults = resolveAllowanceEditorDefaults(allowance, groupBudget);
    setSaveError('');
    setEditor({
      mongoId: resolved.mongoId,
      employeeName: resolved.employeeName,
      groupType: resolved.groupType,
      baseAmount: defaults.baseAmount,
      extraAmount: defaults.extraAmount,
      reason: defaults.reason,
      anchorRect: event.currentTarget.getBoundingClientRect(),
    });
  };

  const closeAllowanceEditor = () => {
    setSaveError('');
    setEditor(null);
  };

  const handleSaveAllowance = async (payload: {
    baseAmount: number;
    extraAmount: number;
    reason: string;
  }) => {
    if (!editor) return;

    try {
      await onSaveAllowance({
        employeeId: editor.mongoId,
        employeeName: editor.employeeName,
        year,
        month,
        groupType: editor.groupType,
        baseAmount: payload.baseAmount,
        extraAmount: payload.extraAmount,
        reason: payload.reason || undefined,
      });
      closeAllowanceEditor();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('employeeAllowanceSaveError'));
    }
  };

  const openRejectModal = (employeeId: string, employeeName: string, receipt: Receipt) => {
    setRejectError('');
    setRejectModal({
      employeeId: receipt.employeeId || employeeId,
      employeeName,
      receipt,
    });
  };

  const closeRejectModal = () => {
    if (actionSaving || savingEmployeeId) return;
    setRejectError('');
    setRejectModal(null);
  };

  const handleRejectConfirm = async (rejectReason: string) => {
    if (!rejectModal) return;

    const { employeeId, receipt } = rejectModal;
    const key = receipt.employeeId;
    setSavingEmployeeId(key);
    onMarkReviewed(receipt, 'REJECTED');
    try {
      await onRejectEmployee(employeeId, rejectReason);
      setRejectModal(null);
      setRejectError('');
    } catch (err) {
      onRevertToPending(receipt);
      setRejectError(err instanceof Error ? err.message : t('checksMonthlyRejectError'));
    } finally {
      setSavingEmployeeId(null);
    }
  };

  const handleRevertEmployee = async (receipt: Receipt) => {
    const key = receipt.employeeId;
    setSavingEmployeeId(key);
    const previousStatus = trackedEmployees.get(key)?.reviewStatus ?? 'PENDING';
    onRevertToPending(receipt);
    try {
      setSaveError('');
      await onRevertEmployee(key);
    } catch (err) {
      if (previousStatus === 'APPROVED' || previousStatus === 'REJECTED') {
        onMarkReviewed(receipt, previousStatus);
      }
      setSaveError(err instanceof Error ? err.message : t('checksMonthlyRevertError'));
    } finally {
      setSavingEmployeeId(null);
    }
  };

  const handleApproveEmployee = async (receipt: Receipt) => {
    const key = receipt.employeeId;
    setSavingEmployeeId(key);
    onMarkReviewed(receipt, 'APPROVED');
    try {
      setSaveError('');
      await onApproveEmployee(key);
    } catch (err) {
      onRevertToPending(receipt);
      setSaveError(err instanceof Error ? err.message : t('checksMonthlyApproveError'));
    } finally {
      setSavingEmployeeId(null);
    }
  };

  const renderSection = (
    kind: 'internal' | 'external',
    titleKey: 'payrollInternal' | 'payrollExternal',
    groupBudget: number | null,
    list: EmployeeCardEntry[],
  ) => {
    const items = list.map(({ receipt, reviewStatus }) => {
      const resolved = resolveEmployeeForReceipt(receipt, users);
      const allowance = resolved ? allowanceMap.get(resolved.mongoId) : undefined;
      const workplace = resolved?.workplace ?? receipt.employeeWorkplace ?? 'EXTERNAL';
      const monthlyAllocation = resolveEmployeeMonthlyAllocation(
        allowance,
        workplace,
        payrollDisbursedInternal,
        payrollDisbursedExternal,
      );
      const monthReceiptsTotal = employeeMonthReceiptsTotal(
        receipts,
        receipt.employeeId,
        year,
        month,
      );
      const monthReceiptsCount = employeeMonthReceipts(
        receipts,
        receipt.employeeId,
        year,
        month,
      ).length;
      const cap = monthlyAllocation ?? 0;
      const isOverLimit = cap > 0 && monthReceiptsTotal >= cap;

      return {
        receipt,
        reviewStatus,
        resolved,
        workplace,
        monthlyAllocation,
        monthReceiptsTotal,
        monthReceiptsCount,
        isOverLimit,
      };
    });

    const overLimitItems = items.filter((item) => item.isOverLimit);
    const isOpen = openOverLimit === kind;

    return (
      <div>
        <div className={`${styles.sectionHead} ${kind === 'internal' ? styles.sectionHeadIn : styles.sectionHeadOut}`}>
          <div className={styles.sectionHeadTop}>
            <span className={`${styles.sectionIcon} ${kind === 'internal' ? styles.sectionIconIn : styles.sectionIconOut}`}>
              {kind === 'internal' ? <BuildingIcon /> : <TruckIcon />}
            </span>
            <div className={styles.sectionHeadText}>
              <h3 className={styles.sectionTitle}>{t(titleKey)}</h3>
              <span className={styles.sectionCount}>{t('pendingPeopleCount', { count: list.length })}</span>
            </div>
          </div>
          <div className={styles.sectionHeadRight}>
            {overLimitItems.length > 0 && (
              <div className={styles.overLimitWrap}>
                <button
                  type="button"
                  className={styles.overLimitCounter}
                  onClick={() => setOpenOverLimit(isOpen ? null : kind)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.overLimitCounterValue}>{overLimitItems.length}</span>
                  <span className={styles.overLimitCounterLabel}>{t('pendingOverLimit')}</span>
                </button>
                {isOpen && (
                  <>
                    <div className={styles.overLimitBackdrop} onClick={() => setOpenOverLimit(null)} />
                    <div className={styles.overLimitDropdown} role="menu">
                      {overLimitItems.map((item) => (
                        <button
                          key={item.receipt.employeeId}
                          type="button"
                          role="menuitem"
                          className={styles.overLimitDropdownItem}
                          onClick={() => goToEmployee(item.receipt.employeeId)}
                        >
                          <span className={styles.overLimitDropdownName}>
                            {item.receipt.employeeName}
                          </span>
                          <span className={styles.overLimitDropdownPct}>
                            {Math.round((item.monthReceiptsTotal / item.monthlyAllocation!) * 100)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className={styles.sectionBudgetPill}>
              <span className={styles.sectionBudgetLabel}>{t('pendingGroupBudget')}</span>
              <span className={styles.sectionBudgetValue}>
                {formatBudgetLabel(groupBudget, locale, t('currency'), t('mealBudgetNotSet'))}
              </span>
            </div>
          </div>
        </div>
        {items.length === 0 ? (
          <div className={styles.sectionEmpty}>
            <span className={styles.sectionEmptyEmoji} aria-hidden>✨</span>
            <p>{t('noPending')}</p>
          </div>
        ) : (
          <ul className={styles.groupList}>
            {items.map(({ receipt, reviewStatus, resolved, workplace, monthlyAllocation, monthReceiptsTotal, monthReceiptsCount }) => {
              const photoUrl = resolved?.avatarUrl ?? receipt.employeePhotoUrl ?? '';
              const initial = receipt.employeeName.trim().charAt(0).toUpperCase() || '?';
              const cardKey = receipt.employeeId;
              const isSaving = savingEmployeeId === cardKey;
              const isReviewed = reviewStatus !== 'PENDING';

              return (
                <li key={cardKey} id={sectionRowId(cardKey)}>
                  <ReceiptItem
                    receipt={receipt}
                    workplace={workplace}
                    monthlyAllocation={monthlyAllocation}
                    monthReceiptsTotal={monthReceiptsTotal}
                    monthReceiptsCount={monthReceiptsCount}
                    employeePhotoUrl={photoUrl}
                    employeeInitial={initial}
                    reviewStatus={reviewStatus}
                    approveLabel={t('pendingApproveAll')}
                    rejectLabel={t('pendingRejectAll')}
                    revertLabel={t('pendingRevertAll')}
                    actionsDisabled={actionSaving || isSaving}
                    highlighted={highlightedId === cardKey}
                    onApprove={() => void handleApproveEmployee(receipt)}
                    onReject={() =>
                      openRejectModal(receipt.employeeId, receipt.employeeName, receipt)
                    }
                    onRevert={() => void handleRevertEmployee(receipt)}
                    onViewChecks={() => goToEmployeeChecks(receipt.employeeId)}
                    onAllocationClick={
                      isReviewed
                        ? undefined
                        : resolved
                          ? (event) => openAllowanceEditor(receipt, event)
                          : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className={styles.groups}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t('pendingReceipts')}</h2>
        {hasAnyCards && (
          <span className={styles.headCount}>
            {t('pendingPeopleCount', { count: employeeCards.length })}
          </span>
        )}
      </div>

      {saveError && !editor ? (
        <p className={styles.inlineError} role="alert">
          {saveError}
        </p>
      ) : null}

      {loading && !hasAnyCards ? (
        <p className={styles.empty}>{t('loading')}</p>
      ) : (
        <div className={styles.sideBySide}>
          <Card className={styles.card}>
            {renderSection('internal', 'payrollInternal', payrollDisbursedInternal, internalList)}
          </Card>
          <Card className={styles.card}>
            {renderSection('external', 'payrollExternal', payrollDisbursedExternal, externalList)}
          </Card>
        </div>
      )}

      <EmployeeAllowancePopover
        open={editor !== null}
        anchorRect={editor?.anchorRect ?? null}
        employeeName={editor?.employeeName ?? ''}
        initialBaseAmount={editor?.baseAmount ?? 0}
        initialExtraAmount={editor?.extraAmount ?? 0}
        initialReason={editor?.reason ?? ''}
        saving={allowanceSaving}
        saveError={saveError}
        onSave={handleSaveAllowance}
        onClose={closeAllowanceEditor}
      />

      <MonthlyRejectModal
        open={rejectModal !== null}
        employeeName={rejectModal?.employeeName ?? ''}
        saving={actionSaving || savingEmployeeId !== null}
        error={rejectError}
        onConfirm={handleRejectConfirm}
        onClose={closeRejectModal}
      />
    </div>
  );
}
