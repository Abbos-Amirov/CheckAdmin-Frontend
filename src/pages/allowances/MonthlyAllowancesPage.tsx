import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { YearMonthToolbar } from '@/components/common/YearMonthToolbar';
import { EmployeeAllowancePopover } from '@/components/dashboard/EmployeeAllowancePopover';
import { useAdminCheckCountsByMonth } from '@/hooks/useAdminCheckCountsByMonth';
import { useEmployeeMealAllowances } from '@/hooks/useEmployeeMealAllowances';
import { useEmployees } from '@/hooks/useEmployees';
import { useMealBudgets } from '@/hooks/useMealBudgets';
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

function EmployeeAvatar({ employee }: { employee: Employee }) {
  const initial = employee.fullName.trim().charAt(0).toUpperCase() || '?';

  if (!employee.photoUrl) {
    return (
      <div className={styles.avatarFallback} aria-hidden>
        {initial}
      </div>
    );
  }

  return (
    <img
      className={styles.avatar}
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

  const { countsByMonth } = useAdminCheckCountsByMonth(selectedYear);

  const {
    internalBudget,
    externalBudget,
    error: budgetLoadError,
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
        <div className={styles.row}>
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
    titleKey: 'payrollInternal' | 'payrollExternal',
    groupBudget: number | null,
    list: Employee[],
  ) => {
    const isInternal = titleKey === 'payrollInternal';

    return (
      <section
        className={`${styles.section} ${isInternal ? styles.sectionInternal : styles.sectionExternal}`}
        aria-labelledby={`allowances-${titleKey}`}
      >
        <div className={styles.sectionHead}>
          <div className={styles.sectionHeadMain}>
            <span className={styles.sectionBadge}>
              {isInternal ? t('workplaceInternalShort') : t('workplaceExternalShort')}
            </span>
            <h2 id={`allowances-${titleKey}`} className={styles.sectionTitle}>
              {t(titleKey)}
            </h2>
          </div>
          <div className={styles.budgetPill}>
            <span className={styles.budgetPillLabel}>{t('pendingGroupBudget')}</span>
            <span className={styles.budgetPillAmount}>
              {groupBudget === null
                ? t('mealBudgetNotSet')
                : `${formatCurrency(groupBudget, locale)} ${t('currency')}`}
            </span>
          </div>
        </div>
        {list.length === 0 ? (
          <p className={styles.stateText}>{t('monthlyAllowancesGroupEmpty')}</p>
        ) : (
          <ul className={styles.list}>{list.map(renderEmployeeRow)}</ul>
        )}
      </section>
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
        <div className={styles.groups}>
          {renderSection('payrollInternal', internalBudget, internalList)}
          {renderSection('payrollExternal', externalBudget, externalList)}
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
    </div>
  );
}
