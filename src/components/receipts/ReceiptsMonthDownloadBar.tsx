import { useMemo, useState } from 'react';
import type { Receipt } from '@/types/receipt.types';
import { useI18n } from '@/app/providers/I18nProvider';
import { receiptScanImageUrl } from '@/data/receiptScanAssets';
import { formatCurrency, formatReceiptDate } from '@/utils/format';
import {
  downloadMergedReceiptScansPdf,
  downloadReceiptScansPngAll,
  receiptExportBaseName,
} from '@/utils/receiptExport';
import {
  downloadReceiptsExcel,
  downloadReceiptsExcelAllHorizontal,
  receiptsAllMonthBaseName,
  receiptsEmployeeMonthBaseName,
  type ReceiptAmountExport,
  type ReceiptEmployeeGroup,
} from '@/utils/downloadReceiptsExcel';
import { downloadReceiptsExcelWithImages } from '@/utils/downloadReceiptsExcelWithImages';
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

function toReceiptExport(r: Receipt): ReceiptAmountExport {
  return {
    amount: r.amount,
    storeName: r.storeName,
    createdAt: r.createdAt,
  };
}

function groupByEmployee(receipts: Receipt[]): ReceiptEmployeeGroup[] {
  const map = new Map<string, ReceiptAmountExport[]>();

  for (const r of receipts) {
    const list = map.get(r.employeeName) ?? [];
    list.push(toReceiptExport(r));
    map.set(r.employeeName, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(([employeeName, groupReceipts]) => ({
      employeeName,
      receipts: groupReceipts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }));
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

  const formatDate = (createdAt: string) => formatReceiptDate(createdAt, locale);

  const excelLabels = {
    employeeName: t('receiptExcelColEmployee'),
    storeName: t('receiptExcelColStore'),
    date: t('receiptExcelColDate'),
    amount: t('receiptExcelColAmount'),
    grandTotal: t('receiptExcelGrandTotal'),
  };

  const excelImageLabels = {
    employeeName: t('receiptExcelColEmployee'),
    receiptImage: t('receiptExcelColImage'),
    amount: t('receiptExcelColAmount'),
    grandTotal: t('receiptExcelGrandTotal'),
    viewLarger: t('receiptExcelViewLarger'),
    viewLargerHint: t('receiptExcelViewLargerHint'),
    detailSheetName: t('receiptExcelDetailSheet'),
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
    if (variant === 'worker' && singleEmployeeName) {
      return downloadReceiptsExcelWithImages(
        singleEmployeeName,
        receipts.map((r) => ({
          employeeName: r.employeeName,
          amount: r.amount,
          imageUrl: r.imageUrl,
        })),
        excelImageLabels,
        formatAmount,
        `${singleEmployeeName.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 40)}_receipts.xlsx`,
      );
    }

    if (singleEmployeeName || employeeGroups.length === 1) {
      const name = singleEmployeeName ?? employeeGroups[0].employeeName;
      const amounts =
        singleEmployeeName != null
          ? receipts.map(toReceiptExport)
          : employeeGroups[0].receipts;
      return downloadReceiptsExcel(name, amounts, excelLabels, formatAmount);
    }
    return downloadReceiptsExcelAllHorizontal(
      employeeGroups,
      fileBase,
      excelLabels,
      formatAmount,
      formatDate,
    );
  };

  const pdfBaseName = singleEmployeeName
    ? `${receiptsEmployeeMonthBaseName(singleEmployeeName, year, month)}_scans`
    : `${fileBase}_scans`;

  const ariaLabel = singleEmployeeName
    ? t('receiptsWorkerDownloadsAria', { name: singleEmployeeName })
    : t('receiptsMonthBulkDownloadsAria');

  return (
    <div
      className={`${styles.bar} ${isWorker ? styles.barWorker : styles.barPage} ${className}`.trim()}
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
