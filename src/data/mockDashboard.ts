import type { DashboardMeta, DashboardStats } from '@/types/dashboard.types';
import type { Employee } from '@/types/employee.types';
import type { Receipt } from '@/types/receipt.types';

export const mockDashboardStats: DashboardStats = {
  totalEmployees: 48,
  pendingReceipts: 6,
  monthlyTotal: 4_200_000,
  approvedReports: 36,
};

export const mockDashboardMeta: DashboardMeta = {
  newEmployeesThisMonth: 6,
};

/** Ichki: Abbos + Faysullz (jamisi 400 000 won). Tashqi: qolganlari (525 000 won). */
export const mockEmployees: Employee[] = [
  {
    id: 'e1',
    fullName: 'Abbos',
    monthlyAmount: 200_000,
    status: 'ACTIVE',
    workplace: 'INTERNAL',
    photoUrl: '/avatars/abbos.png',
  },
  {
    id: 'e6',
    fullName: 'Faysullz',
    monthlyAmount: 200_000,
    status: 'ACTIVE',
    workplace: 'INTERNAL',
    photoUrl: '/avatars/faysullz.png',
  },
  {
    id: 'e2',
    fullName: 'Joha',
    monthlyAmount: 140_000,
    status: 'ACTIVE',
    workplace: 'EXTERNAL',
    photoUrl: '/avatars/joha.png',
  },
  {
    id: 'e3',
    fullName: 'Abror',
    monthlyAmount: 130_000,
    status: 'ACTIVE',
    workplace: 'EXTERNAL',
    photoUrl: '/avatars/abror.png',
  },
  {
    id: 'e4',
    fullName: 'Muxsinbek',
    monthlyAmount: 130_000,
    status: 'ACTIVE',
    workplace: 'EXTERNAL',
    photoUrl: '/avatars/muxsinbek.png',
  },
  {
    id: 'e5',
    fullName: 'Furqat',
    monthlyAmount: 125_000,
    status: 'ACTIVE',
    workplace: 'EXTERNAL',
    photoUrl: '/avatars/furqat.png',
  },
];

export function getEmployeeById(id: string): Employee | undefined {
  return mockEmployees.find((e) => e.id === id);
}

export const mockReceipts: Receipt[] = [
  {
    id: 'r1',
    employeeId: 'e1',
    employeeName: 'Abbos',
    amount: 45_000,
    imageUrl: '/receipt-placeholder.svg',
    status: 'PENDING',
    createdAt: '2026-05-12T10:00:00.000Z',
  },
  {
    id: 'r2',
    employeeId: 'e2',
    employeeName: 'Joha',
    amount: 32_000,
    imageUrl: '/receipt-placeholder.svg',
    status: 'PENDING',
    createdAt: '2026-05-11T14:30:00.000Z',
  },
  {
    id: 'r3',
    employeeId: 'e3',
    employeeName: 'Abror',
    amount: 28_500,
    imageUrl: '/receipt-placeholder.svg',
    status: 'PENDING',
    createdAt: '2026-05-10T09:15:00.000Z',
  },
  {
    id: 'r6',
    employeeId: 'e5',
    employeeName: 'Furqat',
    amount: 22_000,
    imageUrl: '/receipt-placeholder.svg',
    status: 'PENDING',
    createdAt: '2026-05-13T08:20:00.000Z',
  },
  {
    id: 'r7',
    employeeId: 'e6',
    employeeName: 'Faysullz',
    amount: 19_500,
    imageUrl: '/receipt-placeholder.svg',
    status: 'PENDING',
    createdAt: '2026-05-12T16:40:00.000Z',
  },
  {
    id: 'r8',
    employeeId: 'e4',
    employeeName: 'Muxsinbek',
    amount: 27_000,
    imageUrl: '/receipt-placeholder.svg',
    status: 'PENDING',
    createdAt: '2026-05-11T18:05:00.000Z',
  },
  {
    id: 'r4',
    employeeId: 'e4',
    employeeName: 'Muxsinbek',
    amount: 18_000,
    imageUrl: '/receipt-placeholder.svg',
    status: 'APPROVED',
    createdAt: '2026-05-09T16:45:00.000Z',
  },
  {
    id: 'r5',
    employeeId: 'e2',
    employeeName: 'Joha',
    amount: 12_000,
    imageUrl: '/receipt-placeholder.svg',
    status: 'REJECTED',
    createdAt: '2026-05-08T11:20:00.000Z',
  },
];
