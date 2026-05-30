/** Excel eksport — chek qatorlari (do'kon, sana, summa). */
export type ReceiptAmountExport = {
  amount: number;
  storeName: string;
  createdAt: string;
};

export type ReceiptsExcelMinimalLabels = {
  employeeName: string;
  storeName: string;
  date: string;
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

/** Fayl nomi: `Abbos_2026-05` */
export function receiptsEmployeeMonthBaseName(
  employeeName: string,
  year: number,
  month: number,
): string {
  const m = String(month).padStart(2, '0');
  const safe = employeeName.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 40);
  return `${safe}_${year}-${m}`;
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
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
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

function colLetter(colIndex: number): string {
  let n = colIndex;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

const COLS_PER_EMPLOYEE_BLOCK = 3;
const SPACER_COLS_BETWEEN_BLOCKS = 1;

function blockStartCol(groupIndex: number): number {
  return groupIndex * (COLS_PER_EMPLOYEE_BLOCK + SPACER_COLS_BETWEEN_BLOCKS);
}

function sheetColCount(groupCount: number): number {
  if (groupCount === 0) return 0;
  return (
    groupCount * COLS_PER_EMPLOYEE_BLOCK + (groupCount - 1) * SPACER_COLS_BETWEEN_BLOCKS
  );
}

type MergeRange = { s: { r: number; c: number }; e: { r: number; c: number } };

function createHorizontalStyledWorksheet(
  groups: ReceiptEmployeeGroup[],
  labels: ReceiptsExcelMinimalLabels,
  formatAmount: (amount: number) => string,
  formatDate: (createdAt: string) => string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  XLSX: { utils: { aoa_to_sheet: (data: (string | number)[][]) => Record<string, unknown> } },
): Record<string, unknown> {
  const maxReceipts = Math.max(...groups.map((g) => g.receipts.length), 0);
  const totalRows = 3 + maxReceipts;
  const totalCols = sheetColCount(groups.length);
  const grid: string[][] = Array.from({ length: totalRows }, () =>
    Array(totalCols).fill(''),
  );

  const nameStyle: CellStyle = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const totalStyle: CellStyle = {
    font: { bold: true, sz: 13 },
    alignment: { horizontal: 'center', vertical: 'center' },
  };
  const tableHeaderStyle: CellStyle = {
    font: { bold: true },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  };
  const dataStyle: CellStyle = {
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  };

  const merges: MergeRange[] = [];

  groups.forEach((group, groupIndex) => {
    const sc = blockStartCol(groupIndex);
    const totalAmount = group.receipts.reduce((sum, item) => sum + item.amount, 0);

    grid[0][sc] = group.employeeName;
    merges.push({ s: { r: 0, c: sc }, e: { r: 0, c: sc + 2 } });

    grid[1][sc] = `${labels.grandTotal}: ${formatAmount(totalAmount)}`;
    merges.push({ s: { r: 1, c: sc }, e: { r: 1, c: sc + 2 } });

    grid[2][sc] = labels.storeName;
    grid[2][sc + 1] = labels.date;
    grid[2][sc + 2] = labels.amount;

    group.receipts.forEach((item, receiptIndex) => {
      const row = 3 + receiptIndex;
      grid[row][sc] = item.storeName;
      grid[row][sc + 1] = formatDate(item.createdAt);
      grid[row][sc + 2] = formatAmount(item.amount);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(grid);
  ws['!merges'] = merges;

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const sc = blockStartCol(groupIndex);
    const group = groups[groupIndex];

    ws[`${colLetter(sc)}1`] = styledCell(grid[0][sc], nameStyle);
    ws[`${colLetter(sc)}2`] = styledCell(grid[1][sc], totalStyle);
    ws[`${colLetter(sc)}3`] = styledCell(grid[2][sc], tableHeaderStyle);
    ws[`${colLetter(sc + 1)}3`] = styledCell(grid[2][sc + 1], tableHeaderStyle);
    ws[`${colLetter(sc + 2)}3`] = styledCell(grid[2][sc + 2], tableHeaderStyle);

    group.receipts.forEach((_item, receiptIndex) => {
      const excelRow = 4 + receiptIndex;
      ws[`${colLetter(sc)}${excelRow}`] = styledCell(
        grid[3 + receiptIndex][sc],
        dataStyle,
      );
      ws[`${colLetter(sc + 1)}${excelRow}`] = styledCell(
        grid[3 + receiptIndex][sc + 1],
        dataStyle,
      );
      ws[`${colLetter(sc + 2)}${excelRow}`] = styledCell(
        grid[3 + receiptIndex][sc + 2],
        dataStyle,
      );
    });
  }

  const colWidths: { wch: number }[] = Array(totalCols).fill({ wch: 2 });
  groups.forEach((group, groupIndex) => {
    const sc = blockStartCol(groupIndex);
    const storeWidth = Math.min(
      Math.max(
        labels.storeName.length,
        group.employeeName.length,
        ...group.receipts.map((r) => r.storeName.length),
        10,
      ) + 2,
      28,
    );
    const dateWidth = Math.max(labels.date.length, 12);
    const amountWidth = Math.min(
      Math.max(
        labels.amount.length,
        formatAmount(group.receipts.reduce((s, r) => s + r.amount, 0)).length + 4,
        ...group.receipts.map((r) => formatAmount(r.amount).length),
        10,
      ) + 2,
      18,
    );

    colWidths[sc] = { wch: storeWidth };
    colWidths[sc + 1] = { wch: dateWidth };
    colWidths[sc + 2] = { wch: amountWidth };
  });
  ws['!cols'] = colWidths;

  return ws;
}

/**
 * Barcha ishchilar — har ishchi uchun blok: ism, umumiy summa, jadval (do'kon | sana | summa).
 */
export async function downloadReceiptsExcelAllHorizontal(
  groups: ReceiptEmployeeGroup[],
  fileBaseName: string,
  labels: ReceiptsExcelMinimalLabels,
  formatAmount: (amount: number) => string,
  formatDate: (createdAt: string) => string,
): Promise<void> {
  const nonEmpty = groups.filter((g) => g.receipts.length > 0);
  if (nonEmpty.length === 0) return;

  const XLSX = await import('xlsx-js-style');
  const ws = createHorizontalStyledWorksheet(nonEmpty, labels, formatAmount, formatDate, XLSX);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, 'Receipts');
  XLSX.writeFile(workbook, `${sanitizeFileName(fileBaseName)}.xlsx`);
}

/**
 * Bir nechta xodim — har biri alohida varaq (vertikal A ustun).
 * @deprecated Umumiy eksport uchun `downloadReceiptsExcelAllHorizontal` ishlatiladi.
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
