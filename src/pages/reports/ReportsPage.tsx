import { useMemo } from 'react';
import { useI18n } from '@/app/providers/I18nProvider';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useApprovedEmployeesReports } from '@/hooks/useApprovedEmployeesReports';
import type { ApprovedEmployee } from '@/types/approvedEmployees.types';
import type { ApiCheck } from '@/types/check.types';
import { resolveMediaUrl } from '@/utils/apiUser';
import {
  formatCalendarMonth,
  formatCurrency,
  formatReceiptDate,
} from '@/utils/format';
import { DEMO_CALENDAR_DEFAULT_YEAR } from '@/utils/receiptMonthFilter';
import styles from './ReportsPage.module.scss';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function ReportsPage() {
  const { t, locale } = useI18n();
  const year = DEMO_CALENDAR_DEFAULT_YEAR;

  const {
    summary,
    summaryLoading,
    summaryError,
    reloadSummary,
    selectedMonth,
    selectMonth,
    monthData,
    monthLoading,
    monthError,
    selectedEmployeeId,
    selectEmployee,
    checksData,
    checksLoading,
    checksError,
    getMonthApprovedCount,
  } = useApprovedEmployeesReports(year);

  const selectedEmployee = useMemo(
    () => monthData?.employees.find((e) => e._id === selectedEmployeeId) ?? null,
    [monthData, selectedEmployeeId],
  );

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h2 className={styles.pageTitle}>{t('reportsPageTitle')}</h2>
        <p className={styles.hint}>{t('reportsApprovedHint')}</p>
        <p className={styles.year}>{t('reportsYearLabel', { year })}</p>
      </div>

      {summaryError ? (
        <div className={styles.apiError} role="alert">
          <p>{summaryError}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void reloadSummary()}>
            {t('retry')}
          </button>
        </div>
      ) : null}

      <Card className={styles.monthsCard}>
        <div className={styles.summaryHead}>
          <div>
            <h3 className={styles.sectionTitle}>{t('reportsApprovedMonthsTitle')}</h3>
            <p className={styles.sectionHint}>{t('reportsApprovedPickMonthHint')}</p>
          </div>
          {!summaryLoading && summary ? (
            <p className={styles.yearTotal}>
              {t('reportsApprovedYearTotal', {
                count: summary.totalApprovedEmployees,
              })}
            </p>
          ) : null}
        </div>

        {summaryLoading ? (
          <p className={styles.loadingText}>{t('loading')}</p>
        ) : (
          <div className={styles.monthGrid}>
            {MONTHS.map((m) => {
              const count = getMonthApprovedCount(m);
              return (
                <button
                  key={m}
                  type="button"
                  className={`${styles.monthBtn} ${selectedMonth === m ? styles.monthBtnActive : ''}`.trim()}
                  onClick={() => selectMonth(selectedMonth === m ? null : m)}
                  aria-pressed={selectedMonth === m}
                >
                  <span className={styles.monthShort}>
                    {formatCalendarMonth(m, locale, 'short')}
                  </span>
                  <span className={styles.monthNum}>{m}</span>
                  <span className={styles.monthCount}>
                    {t('reportsApprovedMonthBadge', { count })}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {selectedMonth !== null ? (
        <Card className={styles.detailCard}>
          <div className={styles.detailHead}>
            <div>
              <h3 className={styles.detailTitle}>{t('reportsApprovedEmployeesTitle')}</h3>
              <p className={styles.detailSubtitle}>
                {monthData?.monthLabel ??
                  `${formatCalendarMonth(selectedMonth, locale, 'long')} ${year}`}
                {monthData
                  ? ` · ${t('reportsApprovedEmployeesCount', {
                      count: monthData.totalEmployees,
                    })}`
                  : null}
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={() => selectMonth(null)}>
              {t('reportsClearSelection')}
            </Button>
          </div>

          {monthLoading ? (
            <p className={styles.loadingText}>{t('loading')}</p>
          ) : monthError ? (
            <div className={styles.apiError} role="alert">
              <p>{monthError}</p>
            </div>
          ) : monthData && monthData.employees.length === 0 ? (
            <p className={styles.emptyText}>{t('reportsApprovedEmpty')}</p>
          ) : monthData ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('reportsEmployeeCol')}</th>
                    <th>{t('reportsChecksCol')}</th>
                    <th>{t('reportsAmountCol')}</th>
                    <th aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {monthData.employees.map((employee) => (
                    <EmployeeRow
                      key={employee._id}
                      employee={employee}
                      locale={locale}
                      active={selectedEmployeeId === employee._id}
                      onSelect={() =>
                        selectEmployee(
                          selectedEmployeeId === employee._id ? null : employee._id,
                        )
                      }
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      ) : null}

      {selectedEmployee && selectedMonth !== null ? (
        <Card className={styles.checksCard}>
          <div className={styles.detailHead}>
            <div>
              <h3 className={styles.detailTitle}>
                {t('reportsApprovedChecksTitle', { name: selectedEmployee.fullName })}
              </h3>
              <p className={styles.detailSubtitle}>
                {monthData?.monthLabel ?? formatCalendarMonth(selectedMonth, locale, 'long')}
                {checksData
                  ? ` · ${t('reportsApprovedChecksSummary', {
                      count: checksData.totalChecks,
                      amount: formatCurrency(checksData.totalAmount, locale),
                    })} ${t('currency')}`
                  : null}
              </p>
            </div>
            <Button type="button" variant="ghost" onClick={() => selectEmployee(null)}>
              {t('reportsBackToList')}
            </Button>
          </div>

          {checksLoading ? (
            <p className={styles.loadingText}>{t('loading')}</p>
          ) : checksError ? (
            <div className={styles.apiError} role="alert">
              <p>{checksError}</p>
            </div>
          ) : checksData && checksData.checks.length === 0 ? (
            <p className={styles.emptyText}>{t('employeeReceiptsEmptyMonth')}</p>
          ) : checksData ? (
            <ul className={styles.checkGallery} role="list">
              {checksData.checks.map((check) => (
                <CheckThumb key={check._id} check={check} locale={locale} t={t} />
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

function EmployeeRow({
  employee,
  locale,
  active,
  onSelect,
  t,
}: {
  employee: ApprovedEmployee;
  locale: ReturnType<typeof useI18n>['locale'];
  active: boolean;
  onSelect: () => void;
  t: ReturnType<typeof useI18n>['t'];
}) {
  const initial = employee.fullName.trim().charAt(0).toUpperCase() || '?';

  return (
    <tr
      className={`${styles.employeeRow} ${active ? styles.employeeRowActive : ''}`.trim()}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={active}
    >
      <td>
        <div className={styles.employeeCell}>
          <div className={styles.avatar}>
            {employee.avatarUrl ? (
              <img src={resolveMediaUrl(employee.avatarUrl)} alt="" />
            ) : (
              <span aria-hidden>{initial}</span>
            )}
          </div>
          <div>
            <span className={styles.nameCell}>{employee.fullName}</span>
            <span className={styles.employeeCode}>{employee.employeeId}</span>
          </div>
        </div>
      </td>
      <td>{employee.checkCount}</td>
      <td>
        {formatCurrency(employee.totalAmount, locale)} {t('currency')}
      </td>
      <td className={styles.arrowCell} aria-hidden>
        →
      </td>
    </tr>
  );
}

function CheckThumb({
  check,
  locale,
  t,
}: {
  check: ApiCheck;
  locale: ReturnType<typeof useI18n>['locale'];
  t: ReturnType<typeof useI18n>['t'];
}) {
  const imageUrl = resolveMediaUrl(check.imageUrl);
  const dateSource = check.createdAt ?? check.checkDate ?? '';

  return (
    <li className={styles.checkItem} role="listitem">
      <div className={styles.checkFrame}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className={styles.checkImg}
            width={160}
            height={280}
            loading="lazy"
          />
        ) : (
          <div className={styles.checkPlaceholder}>{t('receiptsNoImage')}</div>
        )}
      </div>
      <p className={styles.checkStore}>{check.storeName ?? '—'}</p>
      <p className={styles.checkMeta}>
        {dateSource ? formatReceiptDate(dateSource, locale) : '—'}
      </p>
      <p className={styles.checkAmount}>
        {formatCurrency(check.amount, locale)} {t('currency')}
      </p>
    </li>
  );
}
