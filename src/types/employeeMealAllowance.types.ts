export type AllowanceGroupType = 'INSIDE_FACTORY' | 'OUTSIDE_FACTORY';

export type EmployeeMealAllowance = {
  _id: string;
  employeeId: string;
  employeeName: string;
  year: number;
  month: number;
  groupType: AllowanceGroupType;
  baseAmount: number;
  extraAmount: number;
  totalAmount: number;
  reason: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AllowanceSummaryGroup = {
  employeeCount: number;
  baseTotal: number;
  extraTotal: number;
  grandTotal: number;
};

export type AllowanceSummary = {
  year: number;
  month: number;
  insideFactory: AllowanceSummaryGroup;
  outsideFactory: AllowanceSummaryGroup;
};

export type SaveEmployeeMealAllowanceRequest = {
  employeeId: string;
  employeeName: string;
  year: number;
  month: number;
  groupType: AllowanceGroupType;
  baseAmount: number;
  extraAmount?: number;
  reason?: string;
};

export type PatchEmployeeMealAllowanceExtraRequest = {
  year: number;
  month: number;
  extraAmount: number;
  reason?: string;
};

export type ApiUser = {
  _id: string;
  fullName: string;
  employeeId: string;
  phone?: string;
  workType: 'inside' | 'outside';
  avatarUrl?: string | null;
  role?: string;
  groupType?: AllowanceGroupType;
};
