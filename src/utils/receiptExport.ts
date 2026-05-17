import type { Receipt } from '@/types/receipt.types';

export function receiptExportBaseName(receipt: Receipt): string {
  const raw = `${receipt.id}_${receipt.receiptCode}`;
  return raw.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 96);
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

const A4_W = 595.28;
const A4_H = 841.89;

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

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  triggerBlobDownload(blob, `${baseName}.pdf`);
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

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Receipt');
  XLSX.writeFile(wb, `${baseName}.xlsx`);
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
