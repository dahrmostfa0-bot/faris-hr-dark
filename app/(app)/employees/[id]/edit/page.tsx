 'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { EmployeeForm } from '@/components/employees/employee-form';
import { PageHeader } from '@/components/page-header';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { hasCompanyPermission } from '@/lib/permissions';
import type { Employee } from '@/lib/types';

export default function EditEmployeePage() {
  const params = useParams();
  const { company, companyRole, loading: authLoading } = useAuth();
  const canEdit = hasCompanyPermission(companyRole ?? undefined, 'employees.edit');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!company || !canEdit) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('employees')
        .select('id, company_id, user_id, employee_code, full_name, email, phone, address, birth_date, marital_status, qualification, hire_date, status, notes, department_id, position_id, branch_id, manager_id')
        .eq('id', params.id as string)
        .eq('company_id', company.id)
        .maybeSingle();
      if (cancelled) return;
      setEmployee(data as unknown as Employee | null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [params.id, company, canEdit, authLoading]);

  if (loading || authLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!canEdit) return <div className="py-12 text-center text-muted-foreground">لا تملك صلاحية تعديل بيانات الموظفين.</div>;
  if (!employee) return <div className="py-12 text-center">لم يتم العثور على الموظف</div>;

  return (
    <div>
      <PageHeader title="تعديل بيانات الموظف" description={employee.full_name} />
      <EmployeeForm employee={employee} />
    </div>
  );
}