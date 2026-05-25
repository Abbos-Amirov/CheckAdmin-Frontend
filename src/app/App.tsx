import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { I18nProvider } from '@/app/providers/I18nProvider';
import { ReceiptsProvider } from '@/app/providers/ReceiptsProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicRoute } from '@/components/auth/PublicRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EmployeeDetailPage } from '@/pages/employees/EmployeeDetailPage';
import { EmployeesPage } from '@/pages/employees/EmployeesPage';
import { ReceiptsPage } from '@/pages/receipts/ReceiptsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

export function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <ReceiptsProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<PublicRoute />}>
                  <Route element={<AuthLayout />}>
                    <Route path="login" element={<LoginPage />} />
                    <Route path="signup" element={<SignupPage />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="employees/:employeeId" element={<EmployeeDetailPage />} />
                    <Route path="employees" element={<EmployeesPage />} />
                    <Route path="receipts" element={<ReceiptsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ReceiptsProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
