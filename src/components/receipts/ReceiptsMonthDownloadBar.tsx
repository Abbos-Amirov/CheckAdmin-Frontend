import { useMemo, useState } from 'react';
import type { Receipt } from '@/types/receipt.types';
import { useI18n } from '@/app/providers/I18nProvider';
import { receiptScanImageUrl } from '@/data/receiptScanAssets';
import { formatCurrency } from '@/utils/format';
import {
  downloadMergedReceiptScansPdf,
  downloadReceiptScansPngAll,
  receiptExportBaseName,
} from '@/utils/receiptExport';
import {
  downloadReceiptsExcel,
  downloadReceiptsExcelGrouped,
  receiptsAllMonthBaseName,
  receiptsEmployeeMonthBaseName,
  type ReceiptAmountExport,
  type ReceiptEmployeeGroup,
} from '@/utils/downloadReceiptsExcel';
import styles from './ReceiptsMonthDownloadBar.module.scss';

type Props = {
  receipts: Receipt[];
  year: number;
  month: number;
  /** Bitta xodim — `{name}_receipts.xlsx` va shu xodimga tegishli PDF/PNG. */
  singleEmployeeName?: string;
  /** `worker` — ishchi box ichidagi ixcham panel. */
  variant?: 'page' | 'worker';
  className?: string;
};

function groupByEmployee(receipts: Receipt[]): ReceiptEmployeeGroup[] {
  const map = new Map<string, ReceiptAmountExport[]>();

  for (const r of receipts) {
    const list = map.get(r.employeeName) ?? [];
    list.push({ amount: r.amount });
    map.set(r.employeeName, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([employeeName, amounts]) => ({ employeeName, receipts: amounts }));
}

export function ReceiptsMonthDownloadBar({
  receipts,
  year,
  month,
  singleEmployeeName,
  variant = 'page',
  className = '',
}: Props) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState<'png' | 'pdf' | 'xlsx' | null>(null);

  const disabled = receipts.length === 0;
  const fileBase = receiptsAllMonthBaseName(year, month);
  const isWorker = variant === 'worker';

  const employeeGroups = useMemo(() => groupByEmployee(receipts), [receipts]);

  const pngItems = useMemo(
    () =>
      receipts.map((r) => ({
        url: receiptScanImageUrl(r.id),
        baseName: receiptExportBaseName(r),
      })),
    [receipts],
  );

  const scanUrls = useMemo(() => receipts.map((r) => receiptScanImageUrl(r.id)), [receipts]);

  const formatAmount = (amount: number) =>
    `${formatCurrency(amount, locale)} ${t('currency')}`;

  const excelLabels = {
    employeeName: t('receiptExcelColEmployee'),
    amount: t('receiptExcelColAmount'),
    grandTotal: t('receiptExcelGrandTotal'),
  };

  const run = async (kind: 'png' | 'pdf' | 'xlsx', fn: () => void | Promise<void>) => {
    setBusy(kind);
    try {
      await Promise.resolve(fn());
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  const handleExcelDownload = () => {
    if (singleEmployeeName || employeeGroups.length === 1) {
      const name = singleEmployeeName ?? employeeGroups[0].employeeName;
      const amounts =
        singleEmployeeName != null
          ? receipts.map((r) => ({ amount: r.amount }))
          : employeeGroups[0].receipts;
      return downloadReceiptsExcel(name, amounts, excelLabels, formatAmount);
    }
    return downloadReceiptsExcelGrouped(employeeGroups, fileBase, excelLabels, formatAmount);
  };

  const pdfBaseName = singleEmployeeName
    ? `${receiptsEmployeeMonthBaseName(singleEmployeeName, year, month)}_scans`
    : `${fileBase}_scans`;

  const ariaLabel = singleEmployeeName
    ? t('receiptsWorkerDownloadsAria', { name: singleEmployeeName })
    : t('receiptsMonthBulkDownloadsAria');

  return (
    <div
      className={`${styles.bar} ${isWorker ? styles.barWorker : ''} ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
      aria-busy={busy !== null}
    >
      <button
        type="button"
        className={`${styles.btn} ${styles.btnExcel}`}
        disabled={disabled || busy !== null}
        onClick={() => run('xlsx', handleExcelDownload)}
      >
        {busy === 'xlsx' ? '…' : t('receiptExcelDownload')}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnPdf}`}
        disabled={disabled || busy !== null}
        onClick={() => run('pdf', () => downloadMergedReceiptScansPdf(scanUrls, pdfBaseName))}
      >
        {busy === 'pdf' ? '…' : t('receiptDownloadPdf')}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnPng}`}
        disabled={disabled || busy !== null}
        onClick={() => run('png', () => downloadReceiptScansPngAll(pngItems))}
      >
        {busy === 'png' ? '…' : t('receiptDownloadPng')}
      </button>
    </div>
  );
}
