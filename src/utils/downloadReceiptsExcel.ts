/** Excel eksport — faqat summa qatorlari. */
export type ReceiptAmountExport = {
  amount: number;
};

export type ReceiptsExcelMinimalLabels = {
  employeeName: string;
  amount: string;
  grandTotal: string;
};

type EmployeeSheetLayout = {
  employeeLabel: string;
  employeeName: string;
  amounts: string[];
  totalFormatted: string;
};

/** Fayl nomi: `receipts_all_2026-05` */
export function receiptsAllMonthBaseName(year: number, month: number): string {
  const m = String(month).padStart(2, '0');
  return `receipts_all_${year}-${m}`;
}

function sanitizeSheetName(raw: string): string {
  const cleaned = raw.replace(/[\[\]:*?/\\]/g, '_').slice(0, 31);
  return cleaned || 'Receipts';
}

function sanitizeFileName(raw: string): string {
  return raw.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 80);
}

function buildEmployeeLayout(
  employeeName: string,
  receipts: ReceiptAmountExport[],
  labels: ReceiptsExcelMinimalLabels,
  formatAmount: (amount: number) => string,
): EmployeeSheetLayout {
  const totalAmount = receipts.reduce((sum, item) => sum + item.amount, 0);

  return {
    employeeLabel: labels.employeeName,
    employeeName,
    amounts: receipts.map((item) => formatAmount(item.amount)),
    totalFormatted: formatAmount(totalAmount),
  };
}

/** A1 yorliq → A2 ism → bo‘sh → A4… summalar → bo‘sh → A… jami (hammasi A ustunida). */
function layoutToRows(layout: EmployeeSheetLayout): (string | number)[][] {
  return [
    [layout.employeeLabel],
    [layout.employeeName],
    [],
    ...layout.amounts.map((amount) => [amount]),
    [],
    [layout.totalFormatted],
  ];
}

function autoColumnWidths(layout: EmployeeSheetLayout): { wch: number }[] {
  const maxLen = Math.max(
    layout.employeeLabel.length,
    layout.employeeName.length,
    layout.totalFormatted.length,
    ...layout.amounts.map((a) => a.length),
    12,
  );

  return [{ wch: Math.min(maxLen + 2, 36) }];
}

type CellStyle = {
  font?: { bold?: boolean; sz?: number };
  alignment?: { horizontal?: string; vertical?: string };
};

function styledCell(value: string | number, style: CellStyle) {
  return {
    v: value,
    t: typeof value === 'number' ? 'n' : 's',
    s: style,
  };
}

function createStyledWorksheet(
  layout: EmployeeSheetLayout,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  XLSX: { utils: { aoa_to_sheet: (data: (string | number)[][]) => Record<string, unknown> } },
): Record<string, unknown> {
  const rows = layoutToRows(layout);
  const ws = XLSX.utils.aoa_to_sheet(rows);

  const headerStyle: CellStyle = {
    font: { bold: true },
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const amountRowStyle: CellStyle = {
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const nameValueStyle: CellStyle = {
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const totalValueStyle: CellStyle = {
    font: { bold: true, sz: 12 },
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  ws['A1'] = styledCell(layout.employeeLabel, headerStyle);
  ws['A2'] = styledCell(layout.employeeName, nameValueStyle);

  const amountStartRow = 4;
  layout.amounts.forEach((amount, index) => {
    ws[`A${amountStartRow + index}`] = styledCell(amount, amountRowStyle);
  });

  const totalRow = amountStartRow + layout.amounts.length + 1;
  ws[`A${totalRow}`] = styledCell(layout.totalFormatted, totalValueStyle);

  ws['!cols'] = autoColumnWidths(layout);
  return ws;
}

/**
 * Bitta xodim — hammasi A ustunida vertikal: yorliq, ism, summalar, jami.
 * Fayl: `{employeeName}_receipts.xlsx` (yoki `fileName` berilsa).
 */
export async function downloadReceiptsExcel(
  employeeName: string,
  receipts: ReceiptAmountExport[],
  labels: ReceiptsExcelMinimalLabels,
  formatAmount: (amount: number) => string,
  fileName?: string,
): Promise<void> {
  if (receipts.length === 0) return;

  const XLSX = await import('xlsx-js-style');
  const layout = buildEmployeeLayout(employeeName, receipts, labels, formatAmount);
  const ws = createStyledWorksheet(layout, XLSX);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, sanitizeSheetName(employeeName));
  XLSX.writeFile(workbook, fileName ?? `${sanitizeFileName(employeeName)}_receipts.xlsx`);
}

export type ReceiptEmployeeGroup = {
  employeeName: string;
  receipts: ReceiptAmountExport[];
};

/**
 * Bir nechta xodim — har biri alohida varaq (xuddi shu minimal format).
 */
export async function downloadReceiptsExcelGrouped(
  groups: ReceiptEmployeeGroup[],
  fileBaseName: string,
  labels: ReceiptsExcelMinimalLabels,
  formatAmount: (amount: number) => string,
): Promise<void> {
  const nonEmpty = groups.filter((g) => g.receipts.length > 0);
  if (nonEmpty.length === 0) return;

  const XLSX = await import('xlsx-js-style');
  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  for (const group of nonEmpty) {
    const layout = buildEmployeeLayout(group.employeeName, group.receipts, labels, formatAmount);
    const ws = createStyledWorksheet(layout, XLSX);

    let sheetName = sanitizeSheetName(group.employeeName);
    let n = 2;
    while (usedSheetNames.has(sheetName)) {
      sheetName = sanitizeSheetName(`${group.employeeName}_${n}`);
      n += 1;
    }
    usedSheetNames.add(sheetName);
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  }

  XLSX.writeFile(workbook, `${sanitizeFileName(fileBaseName)}.xlsx`);
}
