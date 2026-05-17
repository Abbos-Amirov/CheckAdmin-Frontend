import type { DashboardMeta, DashboardStats } from '@/types/dashboard.types';
import type { Employee } from '@/types/employee.types';

export { mockReceipts } from './mockReceiptsData';

export const mockDashboardStats: DashboardStats = {
  totalEmployees: 52,
  pendingReceipts: 6,
  monthlyTotal: 4_200_000,
  approvedReports: 36,
};

export const mockDashboardMeta: DashboardMeta = {
  newEmployeesThisMonth: 6,
};

/** Ichki xodimlar limiti 400 000 won; tashqi — 525 000 won (payroll kartalari). */
export const PAYROLL_CAP_INTERNAL_WON = 400_000;
export const PAYROLL_CAP_EXTERNAL_WON = 525_000;

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
  {
    id: 'e7',
    fullName: 'Oscar',
    monthlyAmount: 110_000,
    status: 'ACTIVE',
    workplace: 'EXTERNAL',
    photoUrl: '/avatars/oscar.png',
  },
  {
    id: 'e8',
    fullName: 'Ali',
    monthlyAmount: 115_000,
    status: 'ACTIVE',
    workplace: 'EXTERNAL',
    photoUrl: '/avatars/ali.png',
  },
  {
    id: 'e9',
    fullName: 'Oybek',
    monthlyAmount: 185_000,
    status: 'ACTIVE',
    workplace: 'INTERNAL',
    photoUrl: '/avatars/oybek.png',
  },
  {
    id: 'e10',
    fullName: 'Otabek',
    monthlyAmount: 102_000,
    status: 'ACTIVE',
    workplace: 'EXTERNAL',
    photoUrl: '/avatars/otabek.png',
  },
];

export function getEmployeeById(id: string): Employee | undefined {
  return mockEmployees.find((e) => e.id === id);
}
