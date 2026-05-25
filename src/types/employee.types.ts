export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

/** Ish joyi: ofis / ishlab chiqarish ichida yoki tashqi xodim. */
export type WorkplaceType = 'INTERNAL' | 'EXTERNAL';

export interface Employee {
  id: string;
  fullName: string;
  employeeCode?: string;
  phone?: string;
  monthlyAmount?: number;
  status: EmployeeStatus;
  workplace: WorkplaceType;
  /** Avatar URL — backend `/uploads/...` yoki `public/` */
  photoUrl: string;
}
