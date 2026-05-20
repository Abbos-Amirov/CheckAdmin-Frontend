import type { PDFDocument } from 'pdf-lib';
import type { Receipt } from '@/types/receipt.types';

export function receiptExportBaseName(receipt: Receipt): string {
  const raw = `${receipt.id}_${receipt.receiptCode}`;
  return raw.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 96);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const A4_W = 595.28;
const A4_H = 841.89;

async function appendScanPage(pdfDoc: PDFDocument, bytes: ArrayBuffer): Promise<void> {
  let image;
  try {
    image = await pdfDoc.embedPng(bytes);
  } catch {
    image = await pdfDoc.embedJpg(bytes);
  }

  const iw = image.width;
  const ih = image.height;
  const margin = 36;
  const maxW = A4_W - margin * 2;
  const maxH = A4_H - margin * 2;
  const scale = Math.min(maxW / iw, maxH / ih, 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const x = (A4_W - dw) / 2;
  const y = A4_H - margin - dh;

  const page = pdfDoc.addPage([A4_W, A4_H]);
  page.drawImage(image, { x, y, width: dw, height: dh });
}

/** Skan faylini PNG sifatida yuklab oladi. */
export async function downloadReceiptScanPng(
  imageUrl: string,
  baseName: string,
): Promise<void> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`PNG fetch failed: ${res.status}`);
  const blob = await res.blob();
  triggerBlobDownload(blob, `${baseName}.png`);
}

/** Bir nechta skan — ketma-ket PNG yuklab olish (brauzer bloklamasligi uchun qisqa pauza). */
export async function downloadReceiptScansPngAll(
  items: { url: string; baseName: string }[],
  delayMs = 140,
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    await downloadReceiptScanPng(items[i].url, items[i].baseName);
    if (i < items.length - 1) await sleep(delayMs);
  }
}

/** Skan rasmini bir sahifali PDF ga joylashtiradi (A4, proporsiya saqlanadi). */
export async function downloadReceiptScanPdf(
  imageUrl: string,
  baseName: string,
): Promise<void> {
  const { PDFDocument } = await import('pdf-lib');
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const bytes = await res.arrayBuffer();

  const pdfDoc = await PDFDocument.create();
  await appendScanPage(pdfDoc, bytes);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  triggerBlobDownload(blob, `${baseName}.pdf`);
}

/** Barcha skanlar bitta ko‘p sahifali PDF da. */
export async function downloadMergedReceiptScansPdf(
  imageUrls: string[],
  downloadBaseName: string,
): Promise<void> {
  if (imageUrls.length === 0) return;
  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();

  for (const imageUrl of imageUrls) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const bytes = await res.arrayBuffer();
    await appendScanPage(pdfDoc, bytes);
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  triggerBlobDownload(blob, `${downloadBaseName}.pdf`);
}

export type ReceiptExcelExportLabels = {
  sheetTitle: string;
  itemsSectionTitle: string;
  paymentBlock: string;
  store: string;
  receiptCode: string;
  internalId: string;
  employee: string;
  date: string;
  status: string;
  grandTotal: string;
  currencyLabel: string;
  itemCode: string;
  itemName: string;
  qty: string;
  unitPrice: string;
  lineTotal: string;
  paymentMethod: string;
  cardIssuer: string;
  cardNumber: string;
  approvalNo: string;
};

function receiptExportRows(
  receipt: Receipt,
  labels: ReceiptExcelExportLabels,
  formatMoney: (n: number) => string,
  formatDateIso: (iso: string) => string,
  statusDisplay: string,
): (string | number)[][] {
  const rows: (string | number)[][] = [
    [labels.sheetTitle],
    [],
    [labels.store, receipt.storeName],
    [labels.receiptCode, receipt.receiptCode],
    [labels.internalId, receipt.id],
    [labels.employee, receipt.employeeName],
    [labels.date, formatDateIso(receipt.createdAt)],
    [labels.status, statusDisplay],
    [
      labels.grandTotal,
      `${formatMoney(receipt.amount)} ${labels.currencyLabel}`,
    ],
    [],
    [labels.itemsSectionTitle],
    [],
    [
      labels.itemCode,
      labels.itemName,
      labels.qty,
      labels.unitPrice,
      labels.lineTotal,
    ],
    ...receipt.lineItems.map((line) => [
      line.itemCode ?? '—',
      line.name,
      line.quantity,
      formatMoney(line.unitPrice),
      formatMoney(line.lineTotal),
    ]),
    [],
    [labels.paymentBlock],
    [],
    [labels.paymentMethod, receipt.payment.method],
    [labels.cardIssuer, receipt.payment.cardIssuer],
    [labels.cardNumber, receipt.payment.maskedCardNumber],
  ];

  if (receipt.payment.approvalNumber) {
    rows.push([labels.approvalNo, receipt.payment.approvalNumber]);
  }

  return rows;
}

function sanitizeExcelSheetName(raw: string): string {
  const cleaned = raw.replace(/[\[\]:*?/\\]/g, '_').slice(0, 31);
  return cleaned || 'Sheet';
}

/** Chek ma'lumotlari va qatorlari bilan `.xlsx` yaratadi. */
export async function downloadReceiptExcel(
  receipt: Receipt,
  labels: ReceiptExcelExportLabels,
  formatMoney: (n: number) => string,
  formatDateIso: (iso: string) => string,
  statusDisplay: string,
  baseName: string,
): Promise<void> {
  const XLSX = await import('xlsx');
  const rows = receiptExportRows(receipt, labels, formatMoney, formatDateIso, statusDisplay);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Receipt');
  XLSX.writeFile(wb, `${baseName}.xlsx`);
}

/** Bir nechta chek — bitta `.xlsx`, har biri alohida varaq. */
export async function downloadReceiptsExcelWorkbook(
  receipts: Receipt[],
  labels: ReceiptExcelExportLabels,
  formatMoney: (n: number) => string,
  formatDateIso: (iso: string) => string,
  statusForReceipt: (r: Receipt) => string,
  fileBaseName: string,
): Promise<void> {
  if (receipts.length === 0) return;
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();

  for (const receipt of receipts) {
    const perLabels = { ...labels, sheetTitle: receipt.receiptCode };
    const rows = receiptExportRows(
      receipt,
      perLabels,
      formatMoney,
      formatDateIso,
      statusForReceipt(receipt),
    );
    const ws = XLSX.utils.aoa_to_sheet(rows);

    let sheetName = sanitizeExcelSheetName(receipt.id);
    let n = 2;
    while (used.has(sheetName)) {
      sheetName = sanitizeExcelSheetName(`${receipt.id}_${n}`);
      n += 1;
    }
    used.add(sheetName);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  XLSX.writeFile(wb, `${fileBaseName}.xlsx`);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
