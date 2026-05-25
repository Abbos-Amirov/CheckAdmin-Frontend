import type { Employee } from '@/types/employee.types';
import type {
  AllowanceGroupType,
  ApiUser,
  EmployeeMealAllowance,
} from '@/types/employeeMealAllowance.types';
import type { Receipt } from '@/types/receipt.types';

const MONGO_ID_PATTERN = /^[a-f0-9]{24}$/i;

export function workplaceToGroupType(workplace: Employee['workplace']): AllowanceGroupType {
  return workplace === 'INTERNAL' ? 'INSIDE_FACTORY' : 'OUTSIDE_FACTORY';
}

export function workTypeToWorkplace(workType: ApiUser['workType']): Employee['workplace'] {
  return workType === 'inside' ? 'INTERNAL' : 'EXTERNAL';
}

export function groupBudgetForWorkplace(
  workplace: Employee['workplace'],
  internalBudget: number | null | undefined,
  externalBudget: number | null | undefined,
): number | null {
  if (workplace === 'INTERNAL') {
    return internalBudget ?? null;
  }
  return externalBudget ?? null;
}

/** Guruh budgeti default; admin allowance saqlagach — shu yozuvdagi summa. */
export function resolveEmployeeMonthlyAllocation(
  allowance: EmployeeMealAllowance | undefined,
  workplace: Employee['workplace'],
  internalBudget: number | null | undefined,
  externalBudget: number | null | undefined,
): number | null {
  if (allowance) {
    return allowance.totalAmount;
  }
  return groupBudgetForWorkplace(workplace, internalBudget, externalBudget);
}

export function resolveAllowanceEditorDefaults(
  allowance: EmployeeMealAllowance | undefined,
  groupBudget: number | null | undefined,
): { baseAmount: number; extraAmount: number; reason: string } {
  return {
    baseAmount: allowance?.baseAmount ?? groupBudget ?? 0,
    extraAmount: allowance?.extraAmount ?? 0,
    reason: allowance?.reason ?? '',
  };
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function pickUserByName(users: ApiUser[], name: string): ApiUser | undefined {
  const target = normalizeName(name);
  const workers = users.filter((user) => user.role === 'worker');
  const pool = workers.length > 0 ? workers : users;

  return pool.find((user) => normalizeName(user.fullName) === target);
}

export type ResolvedEmployee = {
  mongoId: string;
  employeeName: string;
  groupType: AllowanceGroupType;
  workplace: Employee['workplace'];
  avatarUrl?: string | null;
};

export function resolveEmployeeForReceipt(
  receipt: Receipt,
  users: ApiUser[],
  mockEmployee?: Employee,
): ResolvedEmployee | null {
  if (MONGO_ID_PATTERN.test(receipt.employeeId)) {
    const user = users.find((item) => item._id === receipt.employeeId);
    const workplace = user
      ? workTypeToWorkplace(user.workType)
      : (receipt.employeeWorkplace ?? mockEmployee?.workplace ?? 'EXTERNAL');

    return {
      mongoId: receipt.employeeId,
      employeeName: user?.fullName ?? receipt.employeeName,
      groupType: workplaceToGroupType(workplace),
      workplace,
      avatarUrl: user?.avatarUrl ?? receipt.employeePhotoUrl ?? mockEmployee?.photoUrl,
    };
  }

  const byMockId = users.find((user) => user.employeeId === receipt.employeeId);
  if (byMockId) {
    const workplace = workTypeToWorkplace(byMockId.workType);
    return {
      mongoId: byMockId._id,
      employeeName: byMockId.fullName,
      groupType: workplaceToGroupType(workplace),
      workplace,
      avatarUrl: byMockId.avatarUrl,
    };
  }

  const lookupName = mockEmployee?.fullName ?? receipt.employeeName;
  const byName = pickUserByName(users, lookupName);
  if (byName) {
    const workplace = workTypeToWorkplace(byName.workType);
    return {
      mongoId: byName._id,
      employeeName: byName.fullName,
      groupType: workplaceToGroupType(workplace),
      workplace,
      avatarUrl: byName.avatarUrl,
    };
  }

  return null;
}

export function allowancesByEmployeeId(
  list: EmployeeMealAllowance[],
): Map<string, EmployeeMealAllowance> {
  return new Map(list.map((item) => [item.employeeId, item]));
}
