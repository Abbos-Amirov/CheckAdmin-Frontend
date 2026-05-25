import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import type { Locale } from '@/i18n';
import { useEmployeeMealAllowances } from '@/hooks/useEmployeeMealAllowances';
import type { Receipt } from '@/types/receipt.types';
import type { WorkplaceType } from '@/types/employee.types';
import { receiptInYearMonth } from '@/utils/receiptMonthFilter';
import { formatCurrency } from '@/utils/format';
import { resolveEmployeeForReceipt } from '@/utils/employeeAllowance';
import { Card } from '@/components/common/Card';
import { EmployeeAllowancePopover } from '@/components/dashboard/EmployeeAllowancePopover';
import { ReceiptItem } from '@/components/dashboard/ReceiptItem';
import styles from './PendingReceiptsCard.module.scss';

type Props = {
  receipts: Receipt[];
  year: number;
  month: number;
  payrollDisbursedInternal: number | null;
  payrollDisbursedExternal: number | null;
  loading?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
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

function formatBudgetLabel(
  amount: number | null,
  locale: Locale,
  currencyLabel: string,
  notSetLabel: string,
) {
  if (amount === null) return notSetLabel;
  return `${formatCurrency(amount, locale)} ${currencyLabel}`;
}

export function PendingReceiptsCard({
  receipts,
  year,
  month,
  payrollDisbursedInternal,
  payrollDisbursedExternal,
  loading = false,
  onApprove,
  onReject,
}: Props) {
  const { t, locale } = useI18n();
  const [editor, setEditor] = useState<AllowanceEditorState | null>(null);
  const [saveError, setSaveError] = useState('');

  const {
    allowanceMap,
    users,
    saving,
    saveAllowance,
  } = useEmployeeMealAllowances(year, month);

  const pending = receipts.filter((r) => r.status === 'PENDING');

  const { internalList, externalList } = useMemo(() => {
    const internal: Receipt[] = [];
    const external: Receipt[] = [];
    for (const r of pending) {
      const resolved = resolveEmployeeForReceipt(r, users);
      const wp: WorkplaceType = resolved?.workplace ?? r.employeeWorkplace ?? 'EXTERNAL';
      if (wp === 'INTERNAL') internal.push(r);
      else external.push(r);
    }
    return {
      internalList: onePendingReceiptPerEmployee(internal),
      externalList: onePendingReceiptPerEmployee(external),
    };
  }, [pending, users]);

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
    setSaveError('');
    setEditor({
      mongoId: resolved.mongoId,
      employeeName: resolved.employeeName,
      groupType: resolved.groupType,
      baseAmount: allowance?.baseAmount ?? 0,
      extraAmount: allowance?.extraAmount ?? 0,
      reason: allowance?.reason ?? '',
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

  const renderSection = (
    titleKey: 'payrollInternal' | 'payrollExternal',
    groupBudget: number | null,
    list: Receipt[],
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
          {list.map((receipt) => {
            const resolved = resolveEmployeeForReceipt(receipt, users);
            const workplace = resolved?.workplace ?? receipt.employeeWorkplace ?? 'EXTERNAL';
            const allowance = resolved ? allowanceMap.get(resolved.mongoId) : undefined;
            const monthReceiptsTotal = employeeMonthReceiptsTotal(
              receipts,
              receipt.employeeId,
              year,
              month,
            );
            const photoUrl = resolved?.avatarUrl ?? receipt.employeePhotoUrl ?? '';
            const initial = receipt.employeeName.trim().charAt(0).toUpperCase() || '?';

            return (
              <li key={receipt.id}>
                <ReceiptItem
                  receipt={receipt}
                  workplace={workplace}
                  monthlyAllocation={allowance?.totalAmount ?? null}
                  monthReceiptsTotal={monthReceiptsTotal}
                  employeePhotoUrl={photoUrl}
                  employeeInitial={initial}
                  onApprove={() => onApprove(receipt.id)}
                  onReject={() => onReject(receipt.id)}
                  onAllocationClick={
                    resolved
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

      {loading ? (
        <p className={styles.empty}>{t('loading')}</p>
      ) : pending.length === 0 ? (
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
    </Card>
  );
}
