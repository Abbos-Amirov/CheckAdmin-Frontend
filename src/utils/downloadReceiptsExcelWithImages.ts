import type { Cell, Worksheet } from 'exceljs';

export type ReceiptExcelImageExport = {
  employeeName: string;
  amount: number;
  imageUrl: string;
};

export type ReceiptsExcelWithImagesLabels = {
  employeeName: string;
  receiptImage: string;
  amount: string;
  grandTotal: string;
};

const IMAGE_WIDTH = 120;
const IMAGE_HEIGHT = 120;
/** ~120px thumbnail in Excel row units (points). */
const RECEIPT_ROW_HEIGHT = 90;
const IMAGE_COL_WIDTH = 20;
const AMOUNT_COL_WIDTH = 16;

function sanitizeSheetName(raw: string): string {
  const cleaned = raw.replace(/[\[\]:*?/\\]/g, '_').slice(0, 31);
  return cleaned || 'Receipts';
}

function sanitizeFileName(raw: string): string {
  return raw.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 80);
}

function resolveImageUrl(url: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  return new URL(url, window.location.origin).href;
}

type ImagePayload = {
  buffer: Buffer | ArrayBuffer;
  extension: 'png' | 'jpeg' | 'gif';
};

async function fetchImagePayload(url: string): Promise<ImagePayload> {
  const response = await fetch(resolveImageUrl(url));
  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  let extension: ImagePayload['extension'] = 'png';

  if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    extension = 'jpeg';
  } else if (contentType.includes('gif')) {
    extension = 'gif';
  }

  return { buffer, extension };
}

function styleHeaderCell(cell: Cell): void {
  cell.font = { bold: true, size: 11, color: { argb: 'FF1F2937' } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' },
  };
}

function styleValueCell(cell: Cell): void {
  cell.font = { bold: true, size: 11 };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

function styleAmountCell(cell: Cell): void {
  cell.font = { size: 11 };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

function styleTotalLabelCell(cell: Cell): void {
  cell.font = { bold: true, size: 12 };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

function styleTotalValueCell(cell: Cell): void {
  cell.font = { bold: true, size: 12, color: { argb: 'FF166534' } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

function applyWorksheetChrome(worksheet: Worksheet): void {
  worksheet.getColumn(1).width = IMAGE_COL_WIDTH;
  worksheet.getColumn(2).width = AMOUNT_COL_WIDTH;
  worksheet.views = [{ state: 'frozen', ySplit: 3 }];
}

/**
 * Bitta xodim — chek rasmlari + summalar + jami (ExcelJS).
 * Fayl: `{employeeName}_receipts.xlsx`
 */
export async function downloadReceiptsExcelWithImages(
  employeeName: string,
  receipts: ReceiptExcelImageExport[],
  labels: ReceiptsExcelWithImagesLabels,
  formatAmount: (amount: number) => string,
  fileName?: string,
): Promise<void> {
  if (receipts.length === 0) return;

  const ExcelJS = await import('exceljs');
  const { saveAs } = await import('file-saver');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PNS Receipt';
  const worksheet = workbook.addWorksheet(sanitizeSheetName(employeeName));
  applyWorksheetChrome(worksheet);

  const nameLabelCell = worksheet.getCell('A1');
  nameLabelCell.value = labels.employeeName;
  styleHeaderCell(nameLabelCell);

  const nameValueCell = worksheet.getCell('B1');
  nameValueCell.value = employeeName;
  styleValueCell(nameValueCell);

  worksheet.getRow(2).height = 8;

  const imageHeaderCell = worksheet.getCell('A3');
  imageHeaderCell.value = labels.receiptImage;
  styleHeaderCell(imageHeaderCell);

  const amountHeaderCell = worksheet.getCell('B3');
  amountHeaderCell.value = labels.amount;
  styleHeaderCell(amountHeaderCell);

  let currentRow = 4;

  for (const receipt of receipts) {
    const row = worksheet.getRow(currentRow);
    row.height = RECEIPT_ROW_HEIGHT;

    const amountCell = worksheet.getCell(currentRow, 2);
    amountCell.value = formatAmount(receipt.amount);
    styleAmountCell(amountCell);

    try {
      const { buffer, extension } = await fetchImagePayload(receipt.imageUrl);
      const imageId = workbook.addImage({ buffer, extension });
      worksheet.addImage(imageId, {
        tl: { col: 0.15, row: currentRow - 1 + 0.08 },
        ext: { width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
      });
    } catch {
      const fallbackCell = worksheet.getCell(currentRow, 1);
      fallbackCell.value = '—';
      fallbackCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    currentRow += 1;
  }

  currentRow += 1;

  const totalAmount = receipts.reduce((sum, item) => sum + item.amount, 0);
  const totalLabelCell = worksheet.getCell(currentRow, 1);
  totalLabelCell.value = labels.grandTotal;
  styleTotalLabelCell(totalLabelCell);

  const totalValueCell = worksheet.getCell(currentRow, 2);
  totalValueCell.value = formatAmount(totalAmount);
  styleTotalValueCell(totalValueCell);

  worksheet.getRow(currentRow).height = 24;

  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([xlsxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  saveAs(blob, fileName ?? `${sanitizeFileName(employeeName)}_receipts.xlsx`);
}
