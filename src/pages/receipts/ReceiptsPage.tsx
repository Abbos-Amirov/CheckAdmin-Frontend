import { useMemo, useState } from 'react';
import type { Locale } from '@/i18n';
import { useI18n } from '@/app/providers/I18nProvider';
import type { Receipt, ReceiptStatus } from '@/types/receipt.types';
import { formatCurrency, formatDashboardMonth } from '@/utils/format';
import { Card } from '@/components/common/Card';
import { YearMonthToolbar } from '@/components/common/YearMonthToolbar';
import { ReceiptsMonthDownloadBar } from '@/components/receipts/ReceiptsMonthDownloadBar';
import { useReceiptsPage } from '@/hooks/useReceiptsPage';
import {
  DEMO_CALENDAR_DEFAULT_YEAR,
  DEMO_RECEIPTS_MONTH,
} from '@/utils/receiptMonthFilter';
import styles from './ReceiptsPage.module.scss';

function totalReceiptAmount(list: Receipt[]): number {
  return list.reduce((sum, r) => sum + r.amount, 0);
}

export function ReceiptsPage() {
  const { t, locale } = useI18n();
  const [selectedYear, setSelectedYear] = useState(DEMO_CALENDAR_DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(DEMO_RECEIPTS_MONTH);

  const {
    workers,
    receipts,
    groups,
    selectedEmployeeId,
    setSelectedEmployeeId,
    loading,
    error,
    reload,
    countsByMonth,
  } = useReceiptsPage(selectedYear, selectedMonth);

  const monthTotals = useMemo(() => {
    const amount = totalReceiptAmount(receipts);
    return { count: receipts.length, amount };
  }, [receipts]);

  const periodLabelDate = useMemo(
    () => new Date(selectedYear, selectedMonth - 1, 1),
    [selectedYear, selectedMonth],
  );

  return (
    <div className={styles.page}>
      <p className={styles.lead}>{t('receiptsPageHint')}</p>

      <YearMonthToolbar
        className={styles.monthToolbar}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        countsByMonth={countsByMonth}
      />

      <div className={styles.filters}>
        <label className={styles.filterLabel} htmlFor="receipts-employee-filter">
          {t('receiptsEmployeeFilterLabel')}
        </label>
        <select
          id="receipts-employee-filter"
          className={styles.filterSelect}
          value={selectedEmployeeId ?? ''}
          onChange={(event) =>
            setSelectedEmployeeId(event.target.value ? event.target.value : null)
          }
          disabled={loading}
        >
          <option value="">{t('receiptsEmployeeAll')}</option>
          {workers.map((worker) => (
            <option key={worker._id} value={worker._id}>
              {worker.fullName}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className={styles.apiError} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.retryBtn} onClick={() => void reload()}>
            {t('retry')}
          </button>
        </div>
      ) : null}

      <div className={styles.periodBanner}>
        <h2 className={styles.periodTitle}>
          {t('receiptsGroupedTitle', {
            month: formatDashboardMonth(periodLabelDate, locale),
          })}
        </h2>
        <p className={styles.periodHint}>{t('receiptsThumbHint')}</p>
      </div>

      {loading ? (
        <Card className={styles.emptyCard}>
          <p className={styles.emptyText}>{t('loading')}</p>
        </Card>
      ) : groups.length > 0 ? (
        <>
          <div className={styles.overviewBar} aria-label={t('receiptsMonthOverviewHint')}>
            <div className={styles.overviewBlock}>
              <span className={styles.overviewBig}>{monthTotals.count}</span>
              <span className={styles.overviewCaption}>{t('receiptsStatChecks')}</span>
            </div>
            <div className={styles.overviewBlock}>
              <span className={styles.overviewBig}>
                {formatCurrency(monthTotals.amount, locale)}{' '}
                <span className={styles.overviewCurrency}>{t('currency')}</span>
              </span>
              <span className={styles.overviewCaption}>{t('receiptsStatTotal')}</span>
            </div>
          </div>

          {!selectedEmployeeId ? (
            <Card className={styles.allDownloadsCard}>
              <h3 className={styles.allDownloadsTitle}>
                {t('receiptsAllEmployeesDownloadTitle')}
              </h3>
              <p className={styles.allDownloadsHint}>{t('receiptsAllEmployeesDownloadHint')}</p>
              <ReceiptsMonthDownloadBar
                receipts={receipts}
                year={selectedYear}
                month={selectedMonth}
                variant="page"
                className={styles.allDownloadsBar}
              />
            </Card>
          ) : null}

          <div className={styles.workerGroups}>
            {groups.map((g) => (
              <Card key={g.employeeId} className={styles.workerBox}>
                <div className={styles.workerBanner}>
                  <h3 className={styles.workerTitle}>{g.employeeName}</h3>
                  <div className={styles.workerMetrics} role="group">
                    <div className={styles.workerMetric}>
                      <span className={styles.workerMetricLabel}>{t('receiptsStatChecks')}</span>
                      <span className={styles.workerMetricValue}>{g.receipts.length}</span>
                    </div>
                    <span className={styles.workerMetricSep} aria-hidden />
                    <div className={styles.workerMetric}>
                      <span className={styles.workerMetricLabel}>{t('receiptsStatTotal')}</span>
                      <span className={styles.workerMetricValue}>
                        {formatCurrency(totalReceiptAmount(g.receipts), locale)}
                        <span className={styles.workerMetricCur}> {t('currency')}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.horizontalStrip} role="list">
                  {g.receipts.map((r) => (
                    <div key={r.id} className={styles.stripItem} role="listitem">
                      <ReceiptDetailCard receipt={r} variant="strip" />
                    </div>
                  ))}
                </div>
                <ReceiptsMonthDownloadBar
                  receipts={g.receipts}
                  year={selectedYear}
                  month={selectedMonth}
                  singleEmployeeName={g.employeeName}
                  variant="worker"
                  className={styles.workerDownloads}
                />
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className={styles.emptyCard}>
          <p className={styles.emptyText}>{t('receiptsNoInMonth')}</p>
        </Card>
      )}
    </div>
  );
}

function ReceiptDetailCard({
  receipt,
  variant,
}: {
  receipt: Receipt;
  variant: 'strip';
}) {
  const { t, locale } = useI18n();
  const strip = variant === 'strip';

  return (
    <div className={`${styles.block} ${strip ? styles.blockStrip : ''}`}>
      <div className={styles.blockInner}>
        <div className={styles.scan}>
          <div className={styles.scanFrame}>
            {receipt.imageUrl ? (
              <img
                src={receipt.imageUrl}
                alt=""
                className={styles.scanImg}
                width={240}
                height={350}
                loading="lazy"
              />
            ) : (
              <div className={styles.scanPlaceholder} aria-hidden>
                {t('receiptsNoImage')}
              </div>
            )}
          </div>
        </div>

        <div className={styles.detail}>
          <div className={styles.detailMetaBox}>
            <div className={styles.head}>
              <div className={styles.headMain}>
                <h3 className={styles.store}>{receipt.storeName}</h3>
                <div className={styles.codes}>
                  <span className={styles.codePrimary}>
                    <span className={styles.codeLabel}>{t('receiptTransactionCode')}</span>
                    <span className={styles.codeValue}>{receipt.receiptCode}</span>
                  </span>
                  <span className={styles.codeSecondary}>
                    {t('receiptInternalId')}: <strong>{receipt.id}</strong>
                  </span>
                </div>
                <div className={styles.worker}>
                  <span className={styles.rcWorkerLabel}>{t('employees')}</span>
                  <span className={styles.rcWorkerName}>{receipt.employeeName}</span>
                  <span className={styles.dot}>·</span>
                  <span>
                    {t('receiptDate')}: {formatDate(receipt.createdAt, locale)}
                  </span>
                </div>
              </div>
              <StatusBadge status={receipt.status} />
            </div>
            <h4 className={styles.metaPurchasesTitle}>{t('receiptItemsTitle')}</h4>
          </div>

          <section className={styles.section}>
            <div className={styles.tableWrap}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>{t('receiptItemCode')}</th>
                    <th>{t('receiptItemName')}</th>
                    <th className={styles.num}>{t('receiptQty')}</th>
                    <th className={styles.num}>{t('receiptUnitPrice')}</th>
                    <th className={styles.num}>{t('receiptLineTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.lineItems.length > 0 ? (
                    receipt.lineItems.map((line, idx) => (
                      <tr key={`${receipt.id}-line-${idx}`}>
                        <td className={styles.mono}>{line.itemCode ?? '—'}</td>
                        <td>{line.name}</td>
                        <td className={styles.num}>{line.quantity}</td>
                        <td className={styles.num}>
                          {formatCurrency(line.unitPrice, locale)}
                        </td>
                        <td className={`${styles.num} ${styles.lineAmt}`}>
                          {formatCurrency(line.lineTotal, locale)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className={styles.emptyLine}>
                        {t('receiptItemsEmpty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('receiptPaymentTitle')}</h4>
            <dl className={styles.payGrid}>
              <div className={styles.payRow}>
                <dt>{t('receiptPaymentMethod')}</dt>
                <dd>{receipt.payment.method}</dd>
              </div>
              <div className={styles.payRow}>
                <dt>{t('receiptCardIssuer')}</dt>
                <dd>{receipt.payment.cardIssuer}</dd>
              </div>
              <div className={styles.payRow}>
                <dt>{t('receiptCardNumber')}</dt>
                <dd className={styles.mono}>{receipt.payment.maskedCardNumber}</dd>
              </div>
              {receipt.payment.approvalNumber ? (
                <div className={styles.payRow}>
                  <dt>{t('receiptApprovalNo')}</dt>
                  <dd className={styles.mono}>{receipt.payment.approvalNumber}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <div className={styles.grand}>
            <span className={styles.grandLabel}>{t('receiptGrandTotal')}</span>
            <span className={styles.grandVal}>
              {formatCurrency(receipt.amount, locale)} {t('currency')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ReceiptStatus }) {
  const { t } = useI18n();
  const label =
    status === 'PENDING'
      ? t('statusPending')
      : status === 'APPROVED'
        ? t('statusApproved')
        : t('statusRejected');

  const cls =
    status === 'PENDING'
      ? styles.stPending
      : status === 'APPROVED'
        ? styles.stApproved
        : styles.stRejected;

  return <span className={`${styles.status} ${cls}`}>{label}</span>;
}

function formatDate(iso: string, locale: Locale) {
  const d = new Date(iso);
  const lc = locale === 'ko' ? 'ko-KR' : 'uz-Latn-UZ';
  return new Intl.DateTimeFormat(lc, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
