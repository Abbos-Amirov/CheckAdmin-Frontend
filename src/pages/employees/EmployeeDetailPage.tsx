import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useI18n } from '@/app/providers/I18nProvider';
import { useEmployeeChecks } from '@/hooks/useEmployeeChecks';
import { useEmployees } from '@/hooks/useEmployees';
import { formatCalendarMonth, formatCurrency, formatDashboardMonth } from '@/utils/format';
import { DEMO_CALENDAR_DEFAULT_YEAR } from '@/utils/receiptMonthFilter';
import { ReceiptsMonthDownloadBar } from '@/components/receipts/ReceiptsMonthDownloadBar';
import { Card } from '@/components/common/Card';
import styles from './EmployeeDetailPage.module.scss';

const MONTH_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { t, locale } = useI18n();
  const { getEmployeeById, loading: employeeLoading, error: employeeError, reload } =
    useEmployees();
  const [selectedMonth, setSelectedMonth] = useState(5);
  const receiptsYear = DEMO_CALENDAR_DEFAULT_YEAR;

  const {
    statsByMonth,
    getReceiptsForMonth,
    loading: checksLoading,
    error: checksError,
    reload: reloadChecks,
  } = useEmployeeChecks(employeeId, receiptsYear);

  const emp = employeeId ? getEmployeeById(employeeId) : undefined;

  const displayedReceipts = useMemo(
    () => getReceiptsForMonth(selectedMonth),
    [getReceiptsForMonth, selectedMonth],
  );

  const selectedStat = statsByMonth[selectedMonth - 1];
  const periodLabelDate = useMemo(
    () => new Date(receiptsYear, selectedMonth - 1, 1),
    [selectedMonth, receiptsYear],
  );

  if (!employeeId) {
    return <Navigate to="/employees" replace />;
  }

  if (employeeLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.missing}>{t('loading')}</p>
      </div>
    );
  }

  if (employeeError) {
    return (
      <div className={styles.page}>
        <p className={styles.missing}>{employeeError}</p>
        <button type="button" className={styles.back} onClick={() => void reload()}>
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!emp) {
    return (
      <div className={styles.page}>
        <p className={styles.missing}>{t('employeeNotFound')}</p>
        <Link className={styles.back} to="/employees">
          {t('backToEmployees')}
        </Link>
      </div>
    );
  }

  const isInternal = emp.workplace === 'INTERNAL';
  const initial = emp.fullName.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className={styles.page}>
      <Link className={styles.back} to="/employees">
        {t('backToEmployees')}
      </Link>

      <Card className={styles.card}>
        <div className={styles.layout}>
          <div className={styles.photoCol}>
            <div className={styles.photoFrame}>
              {emp.photoUrl ? (
                <img
                  className={styles.photo}
                  src={emp.photoUrl}
                  alt={emp.fullName}
                  width={400}
                  height={400}
                />
              ) : (
                <div className={styles.photoFallback} aria-hidden>
                  {initial}
                </div>
              )}
            </div>
          </div>
          <div className={styles.info}>
            <h2 className={styles.name}>{emp.fullName}</h2>

            <dl className={styles.dl}>
              <div className={styles.row}>
                <dt>{t('authEmployeeIdLabel')}</dt>
                <dd>{emp.employeeCode ?? '—'}</dd>
              </div>
              {emp.phone ? (
                <div className={styles.row}>
                  <dt>{t('employeesPhoneLabel')}</dt>
                  <dd>{emp.phone}</dd>
                </div>
              ) : null}
              <div className={styles.row}>
                <dt>{t('workplaceColumn')}</dt>
                <dd>
                  <span
                    className={`${styles.wp} ${isInternal ? styles.wpIn : styles.wpOut}`}
                  >
                    {isInternal ? t('workplaceInternalShort') : t('workplaceExternalShort')}
                  </span>
                </dd>
              </div>
              <div className={styles.row}>
                <dt>{t('employeesStatus')}</dt>
                <dd>
                  <span className={`${styles.st} ${styles.stOk}`}>
                    {t('statusActiveLabel')}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      <Card className={styles.receiptsCard}>
        <h3 className={styles.receiptsTitle}>
          {t('employeeReceiptsSectionTitle', { year: receiptsYear })}
        </h3>
        <p className={styles.receiptsLead}>{t('employeeReceiptsLead')}</p>

        {checksError ? (
          <div className={styles.checksError} role="alert">
            <p>{checksError}</p>
            <button type="button" className={styles.retryBtn} onClick={() => void reloadChecks()}>
              {t('retry')}
            </button>
          </div>
        ) : null}

        <p className={styles.yearLabel}>{t('receiptsYearLabel', { year: receiptsYear })}</p>
        <div
          className={styles.monthStrip}
          role="tablist"
          aria-label={t('employeeReceiptsYearTotalsAria')}
        >
          {MONTH_INDEXES.map((m) => {
            const st = statsByMonth[m - 1];
            const active = selectedMonth === m;
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.monthBtn} ${active ? styles.monthBtnActive : ''}`}
                onClick={() => setSelectedMonth(m)}
              >
                <span className={styles.monthBtnLabel}>
                  {formatCalendarMonth(m, locale, 'short')}
                </span>
                {st.count > 0 ? (
                  <span className={styles.monthBtnBadge} aria-hidden>
                    {st.count}
                  </span>
                ) : null}
                <span className={styles.monthBtnSum}>
                  {st.total > 0
                    ? `${formatCurrency(st.total, locale)} ${t('currency')}`
                    : '—'}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.monthDetail}>
          <p className={styles.monthDetailTitle}>
            {formatDashboardMonth(periodLabelDate, locale)}
          </p>
          <p className={styles.monthDetailMeta}>
            <span>{t('receiptsChecksCount', { count: selectedStat.count })}</span>
            <span className={styles.monthDetailDot}>·</span>
            <span>
              {t('receiptsStatTotal')}: {formatCurrency(selectedStat.total, locale)}{' '}
              {t('currency')}
            </span>
          </p>
        </div>

        {checksLoading ? (
          <p className={styles.emptyMonth}>{t('loading')}</p>
        ) : displayedReceipts.length === 0 ? (
          <p className={styles.emptyMonth}>{t('employeeReceiptsEmptyMonth')}</p>
        ) : (
          <>
            <ul className={styles.scanGallery} role="list">
              {displayedReceipts.map((r) => (
                <li key={r.id} className={styles.scanThumb} role="listitem">
                  <div className={styles.scanThumbFrame}>
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt=""
                        className={styles.scanThumbImg}
                        width={160}
                        height={280}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.scanThumbPlaceholder}>{t('receiptsNoImage')}</div>
                    )}
                  </div>
                  <span className={styles.scanThumbCap}>{r.receiptCode}</span>
                  <span className={styles.scanThumbAmt}>
                    {formatCurrency(r.amount, locale)} {t('currency')}
                  </span>
                </li>
              ))}
            </ul>
            <ReceiptsMonthDownloadBar
              receipts={displayedReceipts}
              year={receiptsYear}
              month={selectedMonth}
              singleEmployeeName={emp.fullName}
            />
          </>
        )}
      </Card>
    </div>
  );
}
