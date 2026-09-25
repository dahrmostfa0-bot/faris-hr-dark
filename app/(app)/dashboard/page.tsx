'use client';

import { useAuth } from '@/lib/auth-context';
import { EmployeeDashboard } from '@/components/employee-dashboard';
import { AdminDashboard } from '@/components/admin-dashboard';

function isEmployeeRole(role: string | null, companyRole: string | null): boolean {
  if (companyRole) return companyRole === 'employee';
  if (role) return role === 'employee';
  return false;
}

export default function DashboardPage() {
  const { role, companyRole } = useAuth();

  if (isEmployeeRole(role, companyRole)) {
    return <EmployeeDashboard />;
  }

  return <AdminDashboard />;
}
