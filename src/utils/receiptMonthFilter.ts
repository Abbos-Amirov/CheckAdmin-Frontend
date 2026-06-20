/** Sahifalar ochilganda by default ko'rsatiladigan yil/oy — har doim joriy sana. */
const now = new Date();
export const DEMO_RECEIPTS_YEAR = now.getFullYear();
export const DEMO_RECEIPTS_MONTH = now.getMonth() + 1;
export const DEMO_CALENDAR_DEFAULT_YEAR = DEMO_RECEIPTS_YEAR;
export const DEMO_CALENDAR_YEAR_END = 2036;

export const DEMO_CALENDAR_YEARS = Array.from(
  { length: DEMO_CALENDAR_YEAR_END - DEMO_CALENDAR_DEFAULT_YEAR + 1 },
  (_, i) => DEMO_CALENDAR_DEFAULT_YEAR + i,
);

export const MONTH_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function receiptInYearMonth(iso: string, year: number, month: number): boolean {
  const d = new Date(iso);
  return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
}

export function receiptInDemoMonth(iso: string): boolean {
  return receiptInYearMonth(iso, DEMO_RECEIPTS_YEAR, DEMO_RECEIPTS_MONTH);
}
