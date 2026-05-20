/**
 * Chek skan rasmlari `public/receipts/` papkasidan beriladi (Vite public).
 * Chek `id` masalan `r1` → `/receipts/r1.png`.
 */
export const RECEIPT_SCAN_PUBLIC_DIR = '/receipts' as const;

/** Papkada mavjud barcha skan fayllari (yangi PNG qo‘shilsa, ro‘yxatni yangilang). */
export const RECEIPT_SCAN_FILES = [
  'r1.png',
  'r2.png',
  'r3.png',
  'r4.png',
  'r5.png',
  'r6.png',
  'r7.png',
  'r8.png',
  'r9.png',
  'r10.png',
  'r11.png',
  'r12.png',
  'r13.png',
  'r14.png',
] as const;

export function receiptScanImageUrl(receiptId: string): string {
  return `${RECEIPT_SCAN_PUBLIC_DIR}/${receiptId}.png`;
}

/** Demo: mavjud skanlar orasidan barqaror “tasodifiy” tanlash. */
export function receiptScanImageFromPool(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const file = RECEIPT_SCAN_FILES[(h >>> 0) % RECEIPT_SCAN_FILES.length];
  return `${RECEIPT_SCAN_PUBLIC_DIR}/${file}`;
}
