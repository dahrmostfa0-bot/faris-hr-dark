'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { EmployeeForm } from '@/components/employees/employee-form';
import { PageHeader } from '@/components/page-header';
import { supabase } from '@/lib/supabase/client';
import type { Employee } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function EditEmployeePage() {
  const params = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('employees')
        .select('*, department:departments(*), position:positions(*), branch:branches(*), manager:employees!manager_id(*)')
        .eq('id', params.id as string)
        .maybeSingle();
      setEmployee(data as Employee | null);
      setLoading(false);
    })();
  }, [params.id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!employee) return <div>لم يتم العثور على الموظف</div>;

  return (
    <div>
      <PageHeader title="تعديل بيانات الموظف" description={employee.full_name} />
      <EmployeeForm employee={employee} />
    </div>
  );
}
