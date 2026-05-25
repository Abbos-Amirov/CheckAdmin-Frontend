import type { WorkplaceType } from '@/types/employee.types';

export type ReceiptStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReceiptLineItem {
  /** Shtrix-kod / SKU (bo‘sh bo‘lishi mumkin) */
  itemCode?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptPayment {
  /** Masalan: 신용카드 */
  method: string;
  /** Masalan: 신한카드, KB국민카드 */
  cardIssuer: string;
  maskedCardNumber: string;
  approvalNumber?: string;
}

export interface Receipt {
  id: string;
  /** Chekni noyob identifikatsiya qilish uchun kod (skaner / ERP). */
  receiptCode: string;
  storeName: string;
  employeeId: string;
  employeeName: string;
  /** Jami (won) — odatda pozitsiyalar yig‘indisi */
  amount: number;
  imageUrl: string;
  status: ReceiptStatus;
  createdAt: string;
  /** Backend oy kaliti, masalan: 2026-05 */
  month?: string;
  lineItems: ReceiptLineItem[];
  payment: ReceiptPayment;
  employeeWorkplace?: WorkplaceType;
  employeePhotoUrl?: string;
  employeeCode?: string;
}
