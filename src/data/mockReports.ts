import { mockEmployees } from '@/data/mockDashboard';
import type { MonthlySubmissionRow } from '@/types/reports.types';

function submissionSeed(year: number, month: number, employeeId: string): number {
  const s = `${year}-${month}-${employeeId}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Mock: berilgan yil va oy uchun har bir xodim topshirgan / topshirmagan.
 * Keyin API `GET /reports/submissions?year=&month=` bilan almashtiring.
 */
export function getMonthlySubmissionRows(
  year: number,
  month: number,
): MonthlySubmissionRow[] {
  return mockEmployees.map((emp) => ({
    employeeId: emp.id,
    fullName: emp.fullName,
    submitted: submissionSeed(year, month, emp.id) % 5 !== 0,
  }));
}
