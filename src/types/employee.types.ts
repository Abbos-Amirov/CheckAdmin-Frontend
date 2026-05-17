export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

/** Ish joyi: ofis / ishlab chiqarish ichida yoki tashqi xodim. */
export type WorkplaceType = 'INTERNAL' | 'EXTERNAL';

export interface Employee {
  id: string;
  fullName: string;
  monthlyAmount: number;
  status: EmployeeStatus;
  workplace: WorkplaceType;
  /** Kvadrat avatar — `public/` dan, masalan `/avatars/abbos.png` */
  photoUrl: string;
}
