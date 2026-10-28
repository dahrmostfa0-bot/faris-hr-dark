 'use client';

import { useAuth } from '@/lib/auth-context';
import { EmployeeDashboard } from '@/components/employee-dashboard';
import { AdminDashboard } from '@/components/admin-dashboard';

export default function DashboardPage() {
  const { companyRole, loading } = useAuth();

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  if (!companyRole) {
    return <div className="py-12 text-center text-muted-foreground">لا توجد شركة مرتبطة بالحساب.</div>;
  }

  if (companyRole === 'employee') {
    return <EmployeeDashboard />;
  }

  return <AdminDashboard />;
}