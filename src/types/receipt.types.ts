export type ReceiptStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Receipt {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  imageUrl: string;
  status: ReceiptStatus;
  createdAt: string;
}
