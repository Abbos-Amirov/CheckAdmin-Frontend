export type ApprovedMonthSummary = {
  month: number;
  monthKey: string;
  monthLabel: string;
  approvedCount: number;
};

export type ApprovedEmployeesSummary = {
  year: number;
  totalApprovedEmployees: number;
  months: ApprovedMonthSummary[];
};

export type ApprovedEmployee = {
  _id: string;
  fullName: string;
  employeeId: string;
  phone?: string;
  workType: 'inside' | 'outside';
  avatarUrl?: string | null;
  checkCount: number;
  totalAmount: number;
  approvedAt?: string | null;
  reviewedBy?: string | null;
};

export type ApprovedEmployeesList = {
  year: number;
  month: number;
  monthKey: string;
  monthLabel: string;
  totalEmployees: number;
  employees: ApprovedEmployee[];
};
