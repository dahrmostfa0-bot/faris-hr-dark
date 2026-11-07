 'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, Briefcase, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatDateAr, formatCurrency, initials } from '@/lib/format';
import { EMPLOYEE_STATUS_LABELS, COMPANY_ROLE_LABELS, type Employee, type EmployeeSalary } from '@/lib/types';

const COLS =
  'id, employee_code, full_name, email, phone, hire_date, status, department:departments!employees_department_id_fkey(id, name, name_ar), position:positions(id, title, title_ar)';

export default function ProfilePage() {
  const { user, company, companyRole, loading: authLoading } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salary, setSalary] = useState<EmployeeSalary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !company) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data: emp } = await supabase
        .from('employees').select(COLS)
        .eq('company_id', company.id).eq('user_id', user.id).maybeSingle();
      if (cancelled) return;
      setEmployee(emp as unknown as Employee | null);
      if (emp) {
        const { data: sal } = await supabase
          .from('employee_salary').select('*').eq('employee_id', (emp as { id: string }).id).maybeSingle();
        if (!cancelled) setSalary(sal as EmployeeSalary | null);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, company, authLoading]);

  if (loading || authLoading) return <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="الملف الشخصي" description="بياناتك في النظام" />

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {employee ? initials(employee.full_name) : user?.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{employee?.full_name ?? user?.email}</h2>
            <p className="text-sm text-muted-foreground">{employee?.position?.title_ar ?? employee?.position?.title ?? 'موظف'}</p>
            {companyRole && <Badge variant="default" className="mt-2">{COMPANY_ROLE_LABELS[companyRole]}</Badge>}
          </div>
        </CardContent>
      </Card>

      {employee ? (
        <Card>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={User} label="الرقم الوظيفي" value={employee.employee_code} />
            <InfoRow icon={Mail} label="البريد" value={employee.email} />
            <InfoRow icon={Phone} label="الهاتف" value={employee.phone} />
            <InfoRow icon={Calendar} label="تاريخ التعيين" value={formatDateAr(employee.hire_date)} />
            <InfoRow icon={Briefcase} label="القسم" value={employee.department?.name_ar ?? employee.department?.name} />
            <InfoRow icon={Briefcase} label="الوظيفة" value={employee.position?.title_ar ?? employee.position?.title} />
            {salary && (
              <>
                <InfoRow icon={Wallet} label="الراتب الأساسي" value={formatCurrency(salary.basic_salary)} />
                <InfoRow icon={Wallet} label="البدلات" value={formatCurrency(salary.allowances)} />
              </>
            )}
            <InfoRow icon={User} label="الحالة" value={EMPLOYEE_STATUS_LABELS[employee.status] ?? employee.status} />
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">حسابك غير مربوط بسجل موظف.</CardContent></Card>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value || '-'}</p></div>
    </div>
  );
}