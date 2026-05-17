import type { DashboardMeta, DashboardStats } from '@/types/dashboard.types';
import type { Employee } from '@/types/employee.types';
import type { Receipt } from '@/types/receipt.types';

export const mockDashboardStats: DashboardStats = {
  totalEmployees: 48,
  pendingReceipts: 12,
  monthlyTotal: 4_200_000,
  approvedReports: 36,
};

export const mockDashboardMeta: DashboardMeta = {
  newEmployeesThisMonth: 4,
};

export const mockEmployees: Employee[] = [
  {
    id: 'e1',
    fullName: 'Jasur T.',
    monthlyAmount: 320_000,
    status: 'ACTIVE',
  },
  {
    id: 'e2',
    fullName: 'Sardor M.',
    monthlyAmount: 210_000,
    status: 'ACTIVE',
  },
  {
    id: 'e3',
    fullName: 'Dilnoza K.',
    monthlyAmount: 185_000,
    status: 'ACTIVE',
  },
  {
    id: 'e4',
    fullName: 'Bobur A.',
    monthlyAmount: 90_000,
    status: 'ACTIVE',
  },
];

export const mockReceipts: Receipt[] = [
  {
    id: 'r1',
    employeeId: 'e1',
    employeeName: 'Jasur T.',
    amount: 45_000,
    imageUrl: '/receipt-placeholder.svg',
    status: 'PENDING',
    createdAt: '2026-05-12T10:00:00.000Z',
  },
  {
    id: 'r2',
    employeeId: 'e2',
    employeeName: 'Sardor M.',
    amount: 32_000,
    imageUrl: '/receipt-placeholder.svg',
    status: 'PENDING',
    createdAt: '2026-05-11T14:30:00.000Z',
  },
  {
    id: 'r3',
    employeeId: 'e3',
    employeeName: 'Dilnoza K.',
    amount: 28_500,
    imageUrl: '/receipt-placeholder.svg',
    status: 'PENDING',
    createdAt: '2026-05-10T09:15:00.000Z',
  },
  {
    id: 'r4',
    employeeId: 'e4',
    employeeName: 'Bobur A.',
    amount: 18_000,
    imageUrl: '/receipt-placeholder.svg',
    status: 'APPROVED',
    createdAt: '2026-05-09T16:45:00.000Z',
  },
  {
    id: 'r5',
    employeeId: 'e2',
    employeeName: 'Sardor M.',
    amount: 12_000,
    imageUrl: '/receipt-placeholder.svg',
    status: 'REJECTED',
    createdAt: '2026-05-08T11:20:00.000Z',
  },
];
