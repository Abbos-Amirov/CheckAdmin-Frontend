import { useMemo, useState } from 'react';
import type { Locale } from '@/i18n';
import { useI18n } from '@/app/providers/I18nProvider';
import { useReceipts } from '@/app/providers/ReceiptsProvider';
import type { Receipt, ReceiptStatus } from '@/types/receipt.types';
import { formatCalendarMonth, formatCurrency, formatDashboardMonth } from '@/utils/format';
import { Card } from '@/components/common/Card';
import { ReceiptsMonthDownloadBar } from '@/components/receipts/ReceiptsMonthDownloadBar';
import { receiptScanImageUrl } from '@/data/receiptScanAssets';
import styles from './ReceiptsPage.module.scss';

/** Demo: cheklar asosan shu yilda (mock). Keyin API / tanlangan yil. */
const RECEIPTS_PAGE_YEAR = 2026;

const MONTH_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function receiptInYearMonth(iso: string, year: number, month: number): boolean {
  const d = new Date(iso);
  return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
}

function totalReceiptAmount(list: Receipt[]): number {
  return list.reduce((sum, r) => sum + r.amount, 0);
}

type WorkerGroup = {
  employeeId: string;
  employeeName: string;
  receipts: Receipt[];
};

export function ReceiptsPage() {
  const { t, locale } = useI18n();
  const { receipts } = useReceipts();
  const [selectedMonth, setSelectedMonth] = useState(5);

  const countsByMonth = useMemo(() => {
    const arr = Array.from({ length: 12 }, () => 0);
    for (const r of receipts) {
      const d = new Date(r.createdAt);
      if (d.getUTCFullYear() === RECEIPTS_PAGE_YEAR) {
        arr[d.getUTCMonth()] += 1;
      }
    }
    return arr;
  }, [receipts]);

  const filtered = useMemo(
    () =>
      receipts.filter((r) =>
        receiptInYearMonth(r.createdAt, RECEIPTS_PAGE_YEAR, selectedMonth),
      ),
    [receipts, selectedMonth],
  );

  const groups = useMemo(() => {
    const map = new Map<string, WorkerGroup>();
    for (const r of filtered) {
      const existing = map.get(r.employeeId);
      if (existing) {
        existing.receipts.push(r);
      } else {
        map.set(r.employeeId, {
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          receipts: [r],
        });
      }
    }
    for (const g of map.values()) {
      g.receipts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return [...map.values()].sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName, undefined, { sensitivity: 'base' }),
    );
  }, [filtered]);

  const monthTotals = useMemo(() => {
    const amount = totalReceiptAmount(filtered);
    return { count: filtered.length, amount };
  }, [filtered]);

  const periodLabelDate = useMemo(
    () => new Date(RECEIPTS_PAGE_YEAR, selectedMonth - 1, 1),
    [selectedMonth],
  );

  return (
    <div className={styles.page}>
      <p className={styles.lead}>{t('receiptsPageHint')}</p>

      <div className={styles.monthToolbar}>
        <p className={styles.yearLabel}>{t('receiptsYearLabel', { year: RECEIPTS_PAGE_YEAR })}</p>
        <div className={styles.monthStrip} role="tablist" aria-label={t('receiptsMonthPickerAria')}>
          {MONTH_INDEXES.map((m) => {
            const count = countsByMonth[m - 1];
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
                {count > 0 ? (
                  <span className={styles.monthBtnBadge} aria-hidden>
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.periodBanner}>
        <h2 className={styles.periodTitle}>
          {t('receiptsGroupedTitle', {
            month: formatDashboardMonth(periodLabelDate, locale),
          })}
        </h2>
        <p className={styles.periodHint}>{t('receiptsThumbHint')}</p>
      </div>

      {groups.length > 0 ? (
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
          <ReceiptsMonthDownloadBar
            receipts={filtered}
            year={RECEIPTS_PAGE_YEAR}
            month={selectedMonth}
          />
        </>
      ) : null}

      {groups.length === 0 ? (
        <Card className={styles.emptyCard}>
          <p className={styles.emptyText}>{t('receiptsNoInMonth')}</p>
        </Card>
      ) : (
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
            </Card>
          ))}
        </div>
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
            <img
              src={receiptScanImageUrl(receipt.id)}
              alt=""
              className={styles.scanImg}
              width={240}
              height={350}
              loading="lazy"
            />
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
                  {receipt.lineItems.map((line, idx) => (
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
                  ))}
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
