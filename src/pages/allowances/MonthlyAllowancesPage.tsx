import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { Card } from '@/components/common/Card';
import { YearMonthToolbar } from '@/components/common/YearMonthToolbar';
import { EmployeeAllowancePopover } from '@/components/dashboard/EmployeeAllowancePopover';
import { PayrollDisbursementPopover } from '@/components/dashboard/PayrollDisbursementPopover';
import { useAdminCheckCountsByMonth } from '@/hooks/useAdminCheckCountsByMonth';
import { useEmployeeMealAllowances } from '@/hooks/useEmployeeMealAllowances';
import { useEmployees } from '@/hooks/useEmployees';
import { useMealBudgets, type MealBudgetKind } from '@/hooks/useMealBudgets';
import type { Employee } from '@/types/employee.types';
import { formatCurrency } from '@/utils/format';
import {
  groupBudgetForWorkplace,
  resolveEmployeeMonthlyAllocation,
  workplaceToGroupType,
} from '@/utils/employeeAllowance';
import {
  DEMO_CALENDAR_DEFAULT_YEAR,
  DEMO_RECEIPTS_MONTH,
} from '@/utils/receiptMonthFilter';
import styles from './MonthlyAllowancesPage.module.scss';

type AllowanceEditorState = {
  employee: Employee;
  baseAmount: number;
  extraAmount: number;
  reason: string;
  anchorRect: DOMRect;
};

type PayrollEditorState = {
  kind: MealBudgetKind;
  anchorRect: DOMRect;
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

function EmployeeAvatar({ employee }: { employee: Employee }) {
  const initial = employee.fullName.trim().charAt(0).toUpperCase() || '?';
  const isInternal = employee.workplace === 'INTERNAL';
  const ringClass = isInternal ? styles.avatarIn : styles.avatarOut;

  if (!employee.photoUrl) {
    return (
      <div className={`${styles.avatarFallback} ${ringClass}`} aria-hidden>
        {initial}
      </div>
    );
  }

  return (
    <img
      className={`${styles.avatar} ${ringClass}`}
      src={employee.photoUrl}
      alt=""
      width={52}
      height={52}
    />
  );
}

export function MonthlyAllowancesPage() {
  const { t, locale } = useI18n();
  const [selectedYear, setSelectedYear] = useState(DEMO_CALENDAR_DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(DEMO_RECEIPTS_MONTH);
  const [editor, setEditor] = useState<AllowanceEditorState | null>(null);
  const [saveError, setSaveError] = useState('');
  const [payrollEditor, setPayrollEditor] = useState<PayrollEditorState | null>(null);
  const [payrollSaveError, setPayrollSaveError] = useState('');

  const { countsByMonth } = useAdminCheckCountsByMonth(selectedYear);

  const {
    internalBudget,
    externalBudget,
    saving: payrollSaving,
    error: budgetLoadError,
    saveBudget,
    reload: reloadBudgets,
  } = useMealBudgets(selectedYear, selectedMonth);

  const {
    employees,
    loading: employeesLoading,
    error: employeesLoadError,
    reload: reloadEmployees,
  } = useEmployees();

  const {
    allowanceMap,
    saving: allowanceSaving,
    saveAllowance,
    loading: allowancesLoading,
    error: allowancesLoadError,
    reload: reloadAllowances,
  } = useEmployeeMealAllowances(selectedYear, selectedMonth);

  const loading = employeesLoading || allowancesLoading;

  const { internalList, externalList } = useMemo(() => {
    const internal: Employee[] = [];
    const external: Employee[] = [];
    for (const employee of employees) {
      if (employee.workplace === 'INTERNAL') internal.push(employee);
      else external.push(employee);
    }
    return { internalList: internal, externalList: external };
  }, [employees]);

  const openEditor = (employee: Employee, event: MouseEvent<HTMLButtonElement>) => {
    const allowance = allowanceMap.get(employee.id);
    const groupBudget = groupBudgetForWorkplace(
      employee.workplace,
      internalBudget,
      externalBudget,
    );
    const monthlyAllocation = resolveEmployeeMonthlyAllocation(
      allowance,
      employee.workplace,
      internalBudget,
      externalBudget,
    );
    setSaveError('');
    setEditor({
      employee,
      baseAmount: monthlyAllocation ?? groupBudget ?? 0,
      extraAmount: 0,
      reason: '',
      anchorRect: event.currentTarget.getBoundingClientRect(),
    });
  };

  const closeEditor = () => {
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
        employeeId: editor.employee.id,
        employeeName: editor.employee.fullName,
        year: selectedYear,
        month: selectedMonth,
        groupType: workplaceToGroupType(editor.employee.workplace),
        baseAmount: payload.baseAmount,
        extraAmount: payload.extraAmount,
        reason: payload.reason || undefined,
      });
      closeEditor();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('employeeAllowanceSaveError'));
    }
  };

  const openPayrollEditor = (kind: MealBudgetKind, event: MouseEvent<HTMLButtonElement>) => {
    setPayrollSaveError('');
    setPayrollEditor({ kind, anchorRect: event.currentTarget.getBoundingClientRect() });
  };

  const closePayrollEditor = () => {
    setPayrollSaveError('');
    setPayrollEditor(null);
  };

  const savePayrollDisbursement = async (amount: number) => {
    if (!payrollEditor) return;
    try {
      await saveBudget(payrollEditor.kind, amount);
      closePayrollEditor();
    } catch (err) {
      setPayrollSaveError(err instanceof Error ? err.message : t('mealBudgetSaveError'));
    }
  };

  const payrollEditorLabel =
    payrollEditor?.kind === 'internal' ? t('payrollInternal') : t('payrollExternal');

  const payrollEditorInitialValue =
    payrollEditor?.kind === 'internal'
      ? internalBudget
      : payrollEditor?.kind === 'external'
        ? externalBudget
        : null;

  const renderEmployeeRow = (employee: Employee) => {
    const allowance = allowanceMap.get(employee.id);
    const monthlyAllocation = resolveEmployeeMonthlyAllocation(
      allowance,
      employee.workplace,
      internalBudget,
      externalBudget,
    );
    const allocationLabel =
      monthlyAllocation === null
        ? t('mealBudgetNotSet')
        : `${formatCurrency(monthlyAllocation, locale)} ${t('currency')}`;
    const isInternal = employee.workplace === 'INTERNAL';

    return (
      <li key={employee.id}>
        <div className={`${styles.row} ${isInternal ? styles.rowInternal : styles.rowExternal}`}>
          <EmployeeAvatar employee={employee} />
          <div className={styles.meta}>
            <div className={styles.nameRow}>
              <span className={styles.name}>{employee.fullName}</span>
              <span
                className={`${styles.typeBadge} ${isInternal ? styles.typeIn : styles.typeOut}`}
              >
                {isInternal ? t('workplaceInternalShort') : t('workplaceExternalShort')}
              </span>
            </div>
            <div className={styles.code}>
              {t('authEmployeeIdLabel')}: {employee.employeeCode ?? '—'}
            </div>
          </div>
          <div className={styles.allocationCol}>
            <span className={styles.allocationLabel}>{t('receiptMonthlyAllocation')}</span>
            <button
              type="button"
              className={styles.allocationBtn}
              onClick={(event) => openEditor(employee, event)}
              aria-label={t('employeeAllowanceEditAria')}
            >
              {allocationLabel}
            </button>
          </div>
        </div>
      </li>
    );
  };

  const renderSection = (
    kind: MealBudgetKind,
    titleKey: 'payrollInternal' | 'payrollExternal',
    groupBudget: number | null,
    list: Employee[],
  ) => {
    const isInternal = kind === 'internal';

    return (
      <Card className={styles.card}>
        <div className={`${styles.sectionHead} ${isInternal ? styles.sectionHeadIn : styles.sectionHeadOut}`}>
          <div className={styles.sectionHeadTop}>
            <span className={`${styles.sectionIcon} ${isInternal ? styles.sectionIconIn : styles.sectionIconOut}`}>
              {isInternal ? <BuildingIcon /> : <TruckIcon />}
            </span>
            <div className={styles.sectionHeadText}>
              <h2 className={styles.sectionTitle}>{t(titleKey)}</h2>
              <span className={styles.sectionCount}>
                {t('pendingPeopleCount', { count: list.length })}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.budgetPill}
            onClick={(event) => openPayrollEditor(kind, event)}
            aria-label={t('payrollDisbursementEditAria', { label: t(titleKey) })}
          >
            <span className={styles.budgetPillLabel}>{t('pendingGroupBudget')}</span>
            <span className={styles.budgetPillAmount}>
              {groupBudget === null
                ? t('mealBudgetNotSet')
                : `${formatCurrency(groupBudget, locale)} ${t('currency')}`}
            </span>
          </button>
        </div>
        {list.length === 0 ? (
          <div className={styles.sectionEmpty}>
            <span className={styles.sectionEmptyEmoji} aria-hidden>✨</span>
            <p>{t('monthlyAllowancesGroupEmpty')}</p>
          </div>
        ) : (
          <ul className={styles.list}>{list.map(renderEmployeeRow)}</ul>
        )}
      </Card>
    );
  };

  return (
    <div className={styles.page}>
      <p className={styles.lead}>{t('monthlyAllowancesPageHint')}</p>

      <YearMonthToolbar
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        countsByMonth={countsByMonth}
      />

      {budgetLoadError ? (
        <div className={styles.apiError} role="alert">
          <p>{budgetLoadError}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void reloadBudgets()}>
            {t('retry')}
          </button>
        </div>
      ) : null}

      {employeesLoadError ? (
        <div className={styles.apiError} role="alert">
          <p>{employeesLoadError}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void reloadEmployees()}>
            {t('retry')}
          </button>
        </div>
      ) : null}

      {allowancesLoadError ? (
        <div className={styles.apiError} role="alert">
          <p>{allowancesLoadError}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void reloadAllowances()}>
            {t('retry')}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className={styles.stateText}>{t('loading')}</p>
      ) : employees.length === 0 ? (
        <p className={styles.stateText}>{t('employeesEmpty')}</p>
      ) : (
        <div className={styles.sideBySide}>
          {renderSection('internal', 'payrollInternal', internalBudget, internalList)}
          {renderSection('external', 'payrollExternal', externalBudget, externalList)}
        </div>
      )}

      <EmployeeAllowancePopover
        open={editor !== null}
        anchorRect={editor?.anchorRect ?? null}
        employeeName={editor?.employee.fullName ?? ''}
        initialBaseAmount={editor?.baseAmount ?? 0}
        initialExtraAmount={editor?.extraAmount ?? 0}
        initialReason={editor?.reason ?? ''}
        baseOnly
        saving={allowanceSaving}
        saveError={saveError}
        onSave={handleSaveAllowance}
        onClose={closeEditor}
      />

      <PayrollDisbursementPopover
        open={payrollEditor !== null}
        anchorRect={payrollEditor?.anchorRect ?? null}
        label={payrollEditorLabel}
        initialValue={payrollEditorInitialValue}
        saving={payrollSaving}
        saveError={payrollSaveError}
        onSave={savePayrollDisbursement}
        onClose={closePayrollEditor}
      />
    </div>
  );
}
