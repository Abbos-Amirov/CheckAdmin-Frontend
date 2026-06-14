import { useMemo, useState } from 'react';
import type { CheckReviewStatus } from '@/api/checks';
import { ApiError } from '@/api/client';
import type { Locale, TranslationKey } from '@/i18n';
import { useI18n } from '@/app/providers/I18nProvider';
import { useToast } from '@/app/providers/ToastProvider';
import type { Receipt, ReceiptStatus } from '@/types/receipt.types';
import { formatCurrency, formatDashboardMonth } from '@/utils/format';
import { Card } from '@/components/common/Card';
import { ImageLightbox } from '@/components/common/ImageLightbox';
import { YearMonthToolbar } from '@/components/common/YearMonthToolbar';
import { CheckRejectModal } from '@/components/receipts/CheckRejectModal';
import { ReceiptsMonthDownloadBar } from '@/components/receipts/ReceiptsMonthDownloadBar';
import { groupReceiptsByEmployee, useReceiptsPage } from '@/hooks/useReceiptsPage';
import {
  DEMO_CALENDAR_DEFAULT_YEAR,
  DEMO_RECEIPTS_MONTH,
} from '@/utils/receiptMonthFilter';
import styles from './ReceiptsPage.module.scss';

function totalReceiptAmount(list: Receipt[]): number {
  return list.reduce((sum, r) => sum + r.amount, 0);
}

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export function ReceiptsPage() {
  const { t, locale } = useI18n();
  const { showToast } = useToast();
  const [selectedYear, setSelectedYear] = useState(DEMO_CALENDAR_DEFAULT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(DEMO_RECEIPTS_MONTH);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Receipt | null>(null);
  const [rejectSaving, setRejectSaving] = useState(false);
  const [rejectError, setRejectError] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actioningStatus, setActioningStatus] = useState<CheckReviewStatus | null>(null);

  const {
    workers,
    receipts,
    selectedEmployeeId,
    setSelectedEmployeeId,
    loading,
    error,
    reload,
    countsByMonth,
    reviewCheck,
  } = useReceiptsPage(selectedYear, selectedMonth);

  const resolveActionErrorMessage = (err: unknown, fallbackKey: TranslationKey): string => {
    if (err instanceof ApiError && err.message !== 'NETWORK_ERROR') return err.message;
    return t(fallbackKey);
  };

  const handleApprove = async (receipt: Receipt) => {
    setActioningId(receipt.id);
    setActioningStatus('approved');
    try {
      await reviewCheck(receipt.id, 'approved');
      showToast(t('receiptActionApproveSuccess', { name: receipt.employeeName }), 'success');
    } catch (err) {
      showToast(resolveActionErrorMessage(err, 'checksApproveError'), 'error');
    } finally {
      setActioningId(null);
      setActioningStatus(null);
    }
  };

  const handleRevert = async (receipt: Receipt) => {
    setActioningId(receipt.id);
    setActioningStatus('pending');
    try {
      await reviewCheck(receipt.id, 'pending');
      showToast(t('receiptActionRevertSuccess', { name: receipt.employeeName }), 'success');
    } catch (err) {
      showToast(resolveActionErrorMessage(err, 'receiptActionRevertError'), 'error');
    } finally {
      setActioningId(null);
      setActioningStatus(null);
    }
  };

  const openRejectModal = (receipt: Receipt) => {
    setRejectError('');
    setRejectTarget(receipt);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    setRejectSaving(true);
    setRejectError('');
    setActioningId(rejectTarget.id);
    setActioningStatus('rejected');
    try {
      await reviewCheck(rejectTarget.id, 'rejected', reason);
      showToast(t('receiptActionRejectSuccess', { name: rejectTarget.employeeName }), 'success');
      setRejectTarget(null);
    } catch (err) {
      setRejectError(resolveActionErrorMessage(err, 'checksRejectError'));
    } finally {
      setRejectSaving(false);
      setActioningId(null);
      setActioningStatus(null);
    }
  };

  const filteredReceipts = useMemo(() => {
    let list = receipts;
    if (statusFilter !== 'ALL') {
      list = list.filter((r) => r.status === statusFilter);
    }
    const query = searchTerm.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (r) =>
          r.storeName.toLowerCase().includes(query) ||
          r.employeeName.toLowerCase().includes(query) ||
          r.receiptCode.toLowerCase().includes(query),
      );
    }
    return list;
  }, [receipts, statusFilter, searchTerm]);

  const groups = useMemo(() => groupReceiptsByEmployee(filteredReceipts), [filteredReceipts]);

  const monthTotals = useMemo(() => {
    const amount = totalReceiptAmount(filteredReceipts);
    return { count: filteredReceipts.length, amount };
  }, [filteredReceipts]);

  const periodLabelDate = useMemo(
    () => new Date(selectedYear, selectedMonth - 1, 1),
    [selectedYear, selectedMonth],
  );

  const isFiltering = statusFilter !== 'ALL' || searchTerm.trim().length > 0;

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

        <label className={styles.filterLabel} htmlFor="receipts-status-filter">
          {t('receiptsStatusFilterLabel')}
        </label>
        <select
          id="receipts-status-filter"
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          disabled={loading}
        >
          <option value="ALL">{t('receiptsStatusAll')}</option>
          <option value="PENDING">{t('statusPending')}</option>
          <option value="APPROVED">{t('statusApproved')}</option>
          <option value="REJECTED">{t('statusRejected')}</option>
        </select>

        <label className={styles.filterLabel} htmlFor="receipts-search">
          {t('receiptsSearchLabel')}
        </label>
        <input
          id="receipts-search"
          type="search"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t('receiptsSearchPlaceholder')}
          disabled={loading}
        />
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

          {!selectedEmployeeId && !isFiltering ? (
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
                      <ReceiptDetailCard
                        receipt={r}
                        variant="strip"
                        onImageClick={setLightboxSrc}
                        onApprove={handleApprove}
                        onReject={openRejectModal}
                        onRevert={handleRevert}
                        busyAction={actioningId === r.id ? actioningStatus : null}
                      />
                    </div>
                  ))}
                </div>
                {!isFiltering ? (
                  <ReceiptsMonthDownloadBar
                    receipts={g.receipts}
                    year={selectedYear}
                    month={selectedMonth}
                    singleEmployeeName={g.employeeName}
                    variant="worker"
                    className={styles.workerDownloads}
                  />
                ) : null}
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className={styles.emptyCard}>
          <p className={styles.emptyText}>
            {isFiltering ? t('receiptsNoSearchResults') : t('receiptsNoInMonth')}
          </p>
        </Card>
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      <CheckRejectModal
        open={rejectTarget !== null}
        storeName={rejectTarget?.storeName ?? ''}
        saving={rejectSaving}
        error={rejectError}
        onConfirm={handleRejectConfirm}
        onClose={() => {
          if (rejectSaving) return;
          setRejectTarget(null);
          setRejectError('');
        }}
      />
    </div>
  );
}

function ReceiptDetailCard({
  receipt,
  variant,
  onImageClick,
  onApprove,
  onReject,
  onRevert,
  busyAction,
}: {
  receipt: Receipt;
  variant: 'strip';
  onImageClick: (src: string) => void;
  onApprove: (receipt: Receipt) => void;
  onReject: (receipt: Receipt) => void;
  onRevert: (receipt: Receipt) => void;
  busyAction: CheckReviewStatus | null;
}) {
  const { t, locale } = useI18n();
  const strip = variant === 'strip';
  const busy = busyAction !== null;

  return (
    <div className={`${styles.block} ${strip ? styles.blockStrip : ''}`}>
      <div className={styles.blockInner}>
        <div className={styles.scan}>
          <div className={styles.scanFrame}>
            {receipt.imageUrl ? (
              <button
                type="button"
                className={styles.scanImgBtn}
                onClick={() => onImageClick(receipt.imageUrl)}
                aria-label={t('receiptsImageZoomAria')}
              >
                <img
                  src={receipt.imageUrl}
                  alt=""
                  className={styles.scanImg}
                  width={240}
                  height={350}
                  loading="lazy"
                />
              </button>
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

            {receipt.status === 'REJECTED' && receipt.rejectReason ? (
              <div className={styles.rejectReasonBox} role="note">
                <span className={styles.rejectReasonLabel}>{t('receiptRejectReasonLabel')}</span>
                <p className={styles.rejectReasonText}>{receipt.rejectReason}</p>
              </div>
            ) : null}

            <div className={styles.actionsBar} role="group" aria-label={t('receiptActionsAria')}>
              {receipt.status !== 'APPROVED' ? (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionApprove}`}
                  onClick={() => onApprove(receipt)}
                  disabled={busy}
                >
                  {busyAction === 'approved' ? '…' : t('receiptActionApprove')}
                </button>
              ) : null}
              {receipt.status !== 'REJECTED' ? (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionReject}`}
                  onClick={() => onReject(receipt)}
                  disabled={busy}
                >
                  {busyAction === 'rejected' ? '…' : t('receiptActionReject')}
                </button>
              ) : null}
              {receipt.status !== 'PENDING' ? (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionRevert}`}
                  onClick={() => onRevert(receipt)}
                  disabled={busy}
                >
                  {busyAction === 'pending' ? '…' : t('receiptActionRevert')}
                </button>
              ) : null}
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
