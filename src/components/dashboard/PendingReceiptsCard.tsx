import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import type { Locale } from '@/i18n';
import { useEmployeeMealAllowances } from '@/hooks/useEmployeeMealAllowances';
import type { ApiUser } from '@/types/employeeMealAllowance.types';
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
  trackedEmployees: Map<string, TrackedEmployeeEntry>;
  onMarkReviewed: (receipt: Receipt, status: 'APPROVED' | 'REJECTED') => void;
  onRevertToPending: (receipt: Receipt) => void;
  loading?: boolean;
  onApproveEmployee: (employeeId: string) => void | Promise<void>;
  onRejectEmployee: (employeeId: string, rejectReason: string) => void | Promise<void>;
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

function employeeMonthReceiptsTotal(
  allReceipts: Receipt[],
  employeeId: string,
  year: number,
  month: number,
): number {
  return allReceipts
    .filter(
      (r) =>
        r.employeeId === employeeId && receiptMatchesMonth(r, year, month),
    )
    .reduce((sum, r) => sum + r.amount, 0);
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

function splitCardsByWorkplace(
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
  trackedEmployees,
  onMarkReviewed,
  onRevertToPending,
  loading = false,
  onApproveEmployee,
  onRejectEmployee,
  actionSaving = false,
}: Props) {
  const { t, locale } = useI18n();
  const [editor, setEditor] = useState<AllowanceEditorState | null>(null);
  const [saveError, setSaveError] = useState('');
  const [rejectModal, setRejectModal] = useState<RejectModalState | null>(null);
  const [rejectError, setRejectError] = useState('');
  const [savingEmployeeId, setSavingEmployeeId] = useState<string | null>(null);

  const {
    allowanceMap,
    users,
    saving,
    saveAllowance,
  } = useEmployeeMealAllowances(year, month);

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
      await saveAllowance({
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
    titleKey: 'payrollInternal' | 'payrollExternal',
    groupBudget: number | null,
    list: EmployeeCardEntry[],
  ) => (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{t(titleKey)}</h3>
        <p className={styles.sectionBudget}>
          {t('pendingGroupBudget')}:{' '}
          {formatBudgetLabel(groupBudget, locale, t('currency'), t('mealBudgetNotSet'))}
        </p>
      </div>
      {list.length === 0 ? (
        <p className={styles.sectionEmpty}>{t('noPending')}</p>
      ) : (
        <ul className={styles.groupList}>
          {list.map(({ receipt, reviewStatus }) => {
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
            const photoUrl = resolved?.avatarUrl ?? receipt.employeePhotoUrl ?? '';
            const initial = receipt.employeeName.trim().charAt(0).toUpperCase() || '?';
            const cardKey = receipt.employeeId;
            const isSaving = savingEmployeeId === cardKey;
            const isReviewed = reviewStatus !== 'PENDING';

            return (
              <li key={cardKey}>
                <ReceiptItem
                  receipt={receipt}
                  workplace={workplace}
                  monthlyAllocation={monthlyAllocation}
                  monthReceiptsTotal={monthReceiptsTotal}
                  employeePhotoUrl={photoUrl}
                  employeeInitial={initial}
                  reviewStatus={reviewStatus}
                  approveLabel={t('pendingApproveAll')}
                  rejectLabel={t('pendingRejectAll')}
                  actionsDisabled={actionSaving || isSaving || isReviewed}
                  onApprove={() => void handleApproveEmployee(receipt)}
                  onReject={() =>
                    openRejectModal(receipt.employeeId, receipt.employeeName, receipt)
                  }
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

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>{t('pendingReceipts')}</h2>
      </div>

      {saveError && !editor ? (
        <p className={styles.inlineError} role="alert">
          {saveError}
        </p>
      ) : null}

      {loading && !hasAnyCards ? (
        <p className={styles.empty}>{t('loading')}</p>
      ) : !hasAnyCards ? (
        <p className={styles.empty}>{t('noPending')}</p>
      ) : (
        <div className={styles.groups}>
          {renderSection('payrollInternal', payrollDisbursedInternal, internalList)}
          {renderSection('payrollExternal', payrollDisbursedExternal, externalList)}
        </div>
      )}

      <EmployeeAllowancePopover
        open={editor !== null}
        anchorRect={editor?.anchorRect ?? null}
        employeeName={editor?.employeeName ?? ''}
        initialBaseAmount={editor?.baseAmount ?? 0}
        initialExtraAmount={editor?.extraAmount ?? 0}
        initialReason={editor?.reason ?? ''}
        saving={saving}
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
    </Card>
  );
}
