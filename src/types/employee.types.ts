export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export interface Employee {
  id: string;
  fullName: string;
  monthlyAmount: number;
  status: EmployeeStatus;
}
