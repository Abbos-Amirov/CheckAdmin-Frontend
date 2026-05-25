import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useI18n } from '@/app/providers/I18nProvider';
import { useReceipts } from '@/app/providers/ReceiptsProvider';
import { useEmployees } from '@/hooks/useEmployees';
import { formatCalendarMonth, formatCurrency, formatDashboardMonth } from '@/utils/format';
import { receiptScanImageUrl } from '@/data/receiptScanAssets';
import { ReceiptsMonthDownloadBar } from '@/components/receipts/ReceiptsMonthDownloadBar';
import { Card } from '@/components/common/Card';
import styles from './EmployeeDetailPage.module.scss';

/** Demo yili — Cheklar sahifasi bilan bir xil. */
const EMPLOYEE_RECEIPTS_YEAR = 2026;

const MONTH_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { t, locale } = useI18n();
  const { receipts } = useReceipts();
  const { getEmployeeById, loading, error, reload } = useEmployees();
  const [selectedMonth, setSelectedMonth] = useState(5);

  const emp = employeeId ? getEmployeeById(employeeId) : undefined;

  const employeeReceipts = useMemo(
    () =>
      employeeId
        ? receipts.filter(
            (r) => r.employeeId === employeeId || r.employeeName === emp?.fullName,
          )
        : [],
    [receipts, employeeId, emp?.fullName],
  );

  const statsByMonth = useMemo(() => {
    const totals = Array.from({ length: 12 }, () => ({ count: 0, total: 0 }));
    for (const r of employeeReceipts) {
      const d = new Date(r.createdAt);
      if (d.getUTCFullYear() !== EMPLOYEE_RECEIPTS_YEAR) continue;
      const mi = d.getUTCMonth();
      totals[mi].count += 1;
      totals[mi].total += r.amount;
    }
    return totals;
  }, [employeeReceipts]);

  const displayedReceipts = useMemo(() => {
    return employeeReceipts
      .filter((r) => {
        const d = new Date(r.createdAt);
        return (
          d.getUTCFullYear() === EMPLOYEE_RECEIPTS_YEAR &&
          d.getUTCMonth() + 1 === selectedMonth
        );
      })
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [employeeReceipts, selectedMonth]);

  const selectedStat = statsByMonth[selectedMonth - 1];
  const periodLabelDate = useMemo(
    () => new Date(EMPLOYEE_RECEIPTS_YEAR, selectedMonth - 1, 1),
    [selectedMonth],
  );

  if (!employeeId) {
    return <Navigate to="/employees" replace />;
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.missing}>{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.missing}>{error}</p>
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
          {t('employeeReceiptsSectionTitle', { year: EMPLOYEE_RECEIPTS_YEAR })}
        </h3>
        <p className={styles.receiptsLead}>{t('employeeReceiptsLead')}</p>

        <p className={styles.yearLabel}>{t('receiptsYearLabel', { year: EMPLOYEE_RECEIPTS_YEAR })}</p>
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

        {displayedReceipts.length === 0 ? (
          <p className={styles.emptyMonth}>{t('employeeReceiptsEmptyMonth')}</p>
        ) : (
          <>
            <ul className={styles.scanGallery} role="list">
              {displayedReceipts.map((r) => (
                <li key={r.id} className={styles.scanThumb} role="listitem">
                  <div className={styles.scanThumbFrame}>
                    <img
                      src={receiptScanImageUrl(r.id)}
                      alt=""
                      className={styles.scanThumbImg}
                      width={160}
                      height={280}
                      loading="lazy"
                    />
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
              year={EMPLOYEE_RECEIPTS_YEAR}
              month={selectedMonth}
              singleEmployeeName={emp.fullName}
            />
          </>
        )}
      </Card>
    </div>
  );
}
