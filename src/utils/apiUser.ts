import type { Employee } from '@/types/employee.types';
import type { ApiUser } from '@/types/employeeMealAllowance.types';
import { workTypeToWorkplace } from '@/utils/employeeAllowance';

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

export function mapApiUserToEmployee(user: ApiUser): Employee {
  return {
    id: user._id,
    fullName: user.fullName,
    employeeCode: user.employeeId,
    phone: user.phone,
    status: 'ACTIVE',
    workplace: workTypeToWorkplace(user.workType),
    photoUrl: resolveMediaUrl(user.avatarUrl),
  };
}

export function filterWorkerUsers(users: ApiUser[]): ApiUser[] {
  return users.filter((user) => user.role === 'worker');
}
