export interface DashboardStats {
  totalEmployees: number;
  pendingReceipts: number;
  monthlyTotal: number;
  approvedReports: number;
}

/** Snapshot counts shown on dashboard (can diverge from live receipt list until API sync). */
export interface DashboardMeta {
  newEmployeesThisMonth: number;
}
