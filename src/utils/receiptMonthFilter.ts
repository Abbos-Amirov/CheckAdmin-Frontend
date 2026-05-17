/** Dashboard va cheklar bilan bir xil demo oyi. */
export const DEMO_RECEIPTS_YEAR = 2026;
export const DEMO_RECEIPTS_MONTH = 5;

export function receiptInDemoMonth(iso: string): boolean {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() === DEMO_RECEIPTS_YEAR &&
    d.getUTCMonth() + 1 === DEMO_RECEIPTS_MONTH
  );
}
