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
  viewLarger: string;
  viewLargerHint: string;
  detailSheetName: string;
};

/** Portret chek — asosiy varaq (thumbnail). */
const IMAGE_WIDTH = 180;
const IMAGE_HEIGHT = 300;
const RECEIPT_ROW_HEIGHT = 230;
const IMAGE_COL_WIDTH = 34;
const AMOUNT_COL_WIDTH = 18;
const LINK_COL_WIDTH = 14;

/** Kattaroq ko'rinish varaqidagi rasm. */
const DETAIL_IMAGE_WIDTH = 360;
const DETAIL_IMAGE_HEIGHT = 600;
const DETAIL_ROW_HEIGHT = 455;
const DETAIL_COL_WIDTH = 54;

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

function internalSheetLink(sheetName: string, cell: string): string {
  const escaped = sheetName.replace(/'/g, "''");
  return `#'${escaped}'!${cell}`;
}

type ImagePayload = {
  buffer: ArrayBuffer;
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

function styleLinkCell(cell: Cell): void {
  cell.font = { size: 10, color: { argb: 'FF2563EB' }, underline: true };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
}

function styleTotalLabelCell(cell: Cell): void {
  cell.font = { bold: true, size: 12 };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

function styleTotalValueCell(cell: Cell): void {
  cell.font = { bold: true, size: 12, color: { argb: 'FF166534' } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
}

function styleDetailCaptionCell(cell: Cell): void {
  cell.font = { bold: true, size: 12 };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
}

function applyMainWorksheetChrome(worksheet: Worksheet): void {
  worksheet.getColumn(1).width = IMAGE_COL_WIDTH;
  worksheet.getColumn(2).width = AMOUNT_COL_WIDTH;
  worksheet.getColumn(3).width = LINK_COL_WIDTH;
  worksheet.views = [{ state: 'frozen', ySplit: 3 }];
}

function setHyperlinkCell(
  cell: Cell,
  text: string,
  target: string,
  tooltip: string,
): void {
  cell.value = { text, hyperlink: target, tooltip };
  styleLinkCell(cell);
}

function embedImage(
  worksheet: Worksheet,
  workbook: import('exceljs').Workbook,
  payload: ImagePayload,
  row: number,
  width: number,
  height: number,
): void {
  const imageId = workbook.addImage({
    buffer: payload.buffer,
    extension: payload.extension,
  });
  worksheet.addImage(imageId, {
    tl: { col: 0.05, row: row - 1 + 0.04 },
    ext: { width, height },
  });
}

/**
 * Bitta xodim — chek rasmlari + summalar + jami (ExcelJS).
 * Ustun C: kattaroq ko'rinish varaqiga havola. Ikkinchi varaqda katta rasm.
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

  const imagePayloads = await Promise.all(
    receipts.map(async (receipt) => {
      if (!receipt.imageUrl) return null;
      try {
        return await fetchImagePayload(receipt.imageUrl);
      } catch {
        return null;
      }
    }),
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PNS Receipt';

  const detailSheetTitle = sanitizeSheetName(labels.detailSheetName);
  const mainSheet = workbook.addWorksheet(sanitizeSheetName(employeeName));
  const detailSheet = workbook.addWorksheet(detailSheetTitle);
  detailSheet.getColumn(1).width = DETAIL_COL_WIDTH;

  applyMainWorksheetChrome(mainSheet);

  mainSheet.getCell('A1').value = labels.employeeName;
  styleHeaderCell(mainSheet.getCell('A1'));
  mainSheet.getCell('B1').value = employeeName;
  styleValueCell(mainSheet.getCell('B1'));
  mainSheet.getRow(2).height = 8;

  mainSheet.getCell('A3').value = labels.receiptImage;
  styleHeaderCell(mainSheet.getCell('A3'));
  mainSheet.getCell('B3').value = labels.amount;
  styleHeaderCell(mainSheet.getCell('B3'));
  mainSheet.getCell('C3').value = labels.viewLarger;
  styleHeaderCell(mainSheet.getCell('C3'));

  const detailAnchors: string[] = [];
  let detailRow = 1;
  receipts.forEach((receipt, index) => {
    const captionRow = detailRow;
    detailAnchors.push(`A${captionRow}`);

    const captionCell = detailSheet.getCell(captionRow, 1);
    captionCell.value = `${index + 1}. ${formatAmount(receipt.amount)}`;
    styleDetailCaptionCell(captionCell);
    detailSheet.getRow(captionRow).height = 22;

    detailRow += 1;
    const imageRow = detailRow;
    detailSheet.getRow(imageRow).height = DETAIL_ROW_HEIGHT;

    const payload = imagePayloads[index];
    if (payload) {
      embedImage(detailSheet, workbook, payload, imageRow, DETAIL_IMAGE_WIDTH, DETAIL_IMAGE_HEIGHT);
    } else {
      detailSheet.getCell(imageRow, 1).value = '—';
    }

    detailRow += 2;
  });

  let currentRow = 4;
  receipts.forEach((receipt, index) => {
    mainSheet.getRow(currentRow).height = RECEIPT_ROW_HEIGHT;
    mainSheet.getCell(currentRow, 2).value = formatAmount(receipt.amount);
    styleAmountCell(mainSheet.getCell(currentRow, 2));

    const payload = imagePayloads[index];
    if (payload) {
      embedImage(mainSheet, workbook, payload, currentRow, IMAGE_WIDTH, IMAGE_HEIGHT);
    } else {
      mainSheet.getCell(currentRow, 1).value = '—';
      mainSheet.getCell(currentRow, 1).alignment = { vertical: 'middle', horizontal: 'center' };
    }

    setHyperlinkCell(
      mainSheet.getCell(currentRow, 3),
      labels.viewLarger,
      internalSheetLink(detailSheetTitle, detailAnchors[index]),
      labels.viewLargerHint,
    );

    currentRow += 1;
  });

  currentRow += 1;
  const totalAmount = receipts.reduce((sum, item) => sum + item.amount, 0);
  mainSheet.getCell(currentRow, 1).value = labels.grandTotal;
  styleTotalLabelCell(mainSheet.getCell(currentRow, 1));
  mainSheet.getCell(currentRow, 2).value = formatAmount(totalAmount);
  styleTotalValueCell(mainSheet.getCell(currentRow, 2));
  mainSheet.getRow(currentRow).height = 24;

  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([xlsxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  saveAs(blob, fileName ?? `${sanitizeFileName(employeeName)}_receipts.xlsx`);
}
