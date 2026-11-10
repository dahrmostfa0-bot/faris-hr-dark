 'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import type {
  Employee, EmployeeStatus, Department, Position, Branch,
  EmployeeSalary, EmployeeIdentity,
} from '@/lib/types';

// الموظف مع عمود الموعد الجديد (غير موجود في lib/types.ts)
type EmployeeWithSchedule = Employee & { schedule_id?: string | null };

interface Props {
  employee?: EmployeeWithSchedule;
}

type Opt = { id: string; full_name: string };
type ScheduleOpt = { id: string; name: string; start_time: string; end_time: string; is_default?: boolean };

const DEFAULT_SCHEDULE_VALUE = '__default__';

function nextCode(codes: string[]) {
  let max = 0;
  codes.forEach((c) => {
    const m = /(\d+)$/.exec(c ?? '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `EMP-${String(max + 1).padStart(4, '0')}`;
}

export function EmployeeForm({ employee }: Props) {
  const router = useRouter();
  const { company, companyRole } = useAuth();
  const { toast } = useToast();
  const canSensitive = companyRole === 'owner' || companyRole === 'hr_manager';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [managers, setManagers] = useState<Opt[]>([]);
  const [schedules, setSchedules] = useState<ScheduleOpt[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingPrivate, setLoadingPrivate] = useState(!!employee && canSensitive);

  const [form, setForm] = useState({
    employee_code: employee?.employee_code ?? '',
    full_name: employee?.full_name ?? '',
    phone: employee?.phone ?? '',
    email: employee?.email ?? '',
    address: employee?.address ?? '',
    birth_date: employee?.birth_date ?? '',
    marital_status: employee?.marital_status ?? '',
    qualification: employee?.qualification ?? '',
    department_id: employee?.department_id ?? '',
    position_id: employee?.position_id ?? '',
    branch_id: employee?.branch_id ?? '',
    manager_id: employee?.manager_id ?? '',
    schedule_id: employee?.schedule_id ?? '',
    hire_date: employee?.hire_date ?? new Date().toISOString().slice(0, 10),
    status: (employee?.status ?? 'active') as EmployeeStatus,
    notes: employee?.notes ?? '',
  });
  const [priv, setPriv] = useState({ national_id: '', bank_account: '', basic_salary: 0, allowances: 0 });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // القوائم المرجعية (بفلتر الشركة) + كود الموظف التلقائي
  useEffect(() => {
    if (!company) return;
    let cancelled = false;
    (async () => {
      const [d, p, b, e, s] = await Promise.all([
        supabase.from('departments').select('*').eq('company_id', company.id).order('name'),
        supabase.from('positions').select('*').eq('company_id', company.id).order('title'),
        supabase.from('branches').select('*').eq('company_id', company.id).order('name'),
        supabase.from('employees').select('id, full_name, employee_code').eq('company_id', company.id).order('full_name'),
        supabase.from('work_schedules').select('id, name, start_time, end_time, is_default').eq('company_id', company.id).order('created_at'),
      ]);
      if (cancelled) return;
      setDepartments((d.data ?? []) as Department[]);
      setPositions((p.data ?? []) as Position[]);
      setBranches((b.data ?? []) as Branch[]);
      setSchedules((s.data ?? []) as ScheduleOpt[]);
      const emps = (e.data ?? []) as (Opt & { employee_code: string })[];
      setManagers(emps.filter((x) => x.id !== employee?.id));
      if (!employee) setForm((f) => (f.employee_code ? f : { ...f, employee_code: nextCode(emps.map((x) => x.employee_code)) }));
    })();
    return () => { cancelled = true; };
  }, [company, employee]);

  // البيانات المالية والهوية (للمصرّح لهم فقط، وعند التعديل)
  useEffect(() => {
    if (!employee || !canSensitive) { setLoadingPrivate(false); return; }
    let cancelled = false;
    (async () => {
      const [s, i] = await Promise.all([
        supabase.from('employee_salary').select('*').eq('employee_id', employee.id).maybeSingle(),
        supabase.from('employee_identity').select('*').eq('employee_id', employee.id).maybeSingle(),
      ]);
      if (cancelled) return;
      const sal = s.data as EmployeeSalary | null;
      const idn = i.data as EmployeeIdentity | null;
      setPriv({
        national_id: idn?.national_id ?? '',
        bank_account: idn?.bank_account ?? '',
        basic_salary: Number(sal?.basic_salary ?? 0),
        allowances: Number(sal?.allowances ?? 0),
      });
      setLoadingPrivate(false);
    })();
    return () => { cancelled = true; };
  }, [employee, canSensitive]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company) {
      toast({ title: 'خطأ', description: 'لا توجد شركة مرتبطة بالحساب', variant: 'destructive' });
      return;
    }
    if (canSensitive && (priv.basic_salary < 0 || priv.allowances < 0)) {
      toast({ title: 'القيم المالية لا يمكن أن تكون سالبة', variant: 'destructive' });
      return;
    }
    if (employee && canSensitive && loadingPrivate) {
      toast({ title: 'انتظر اكتمال تحميل البيانات المالية', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const base = {
      employee_code: form.employee_code.trim(),
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      birth_date: form.birth_date || null,
      marital_status: form.marital_status || null,
      qualification: form.qualification.trim() || null,
      department_id: form.department_id || null,
      position_id: form.position_id || null,
      branch_id: form.branch_id || null,
      manager_id: form.manager_id || null,
      schedule_id: form.schedule_id || null,
      hire_date: form.hire_date,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    let employeeId = employee?.id;

    if (employee) {
      const { error } = await supabase.from('employees').update(base).eq('id', employee.id).eq('company_id', company.id);
      if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    } else {
      const { data, error } = await supabase
        .from('employees').insert({ ...base, company_id: company.id }).select('id').single();
      if (error || !data) { toast({ title: 'خطأ', description: error?.message ?? 'تعذر الحفظ', variant: 'destructive' }); setSaving(false); return; }
      employeeId = data.id;
    }

    if (canSensitive && employeeId) {
      const [s, i] = await Promise.all([
        supabase.from('employee_salary').upsert({
          employee_id: employeeId, company_id: company.id,
          basic_salary: Number(priv.basic_salary) || 0,
          allowances: Number(priv.allowances) || 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'employee_id' }),
        supabase.from('employee_identity').upsert({
          employee_id: employeeId, company_id: company.id,
          national_id: priv.national_id.trim() || null,
          bank_account: priv.bank_account.trim() || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'employee_id' }),
      ]);
      const err = s.error ?? i.error;
      if (err) {
        toast({
          title: 'تم حفظ البيانات الأساسية، لكن تعذر حفظ البيانات المالية',
          description: err.message, variant: 'destructive',
        });
        setSaving(false);
        router.push(`/employees/${employeeId}`);
        return;
      }
    }

    toast({ title: employee ? 'تم الحفظ' : 'تمت الإضافة', description: employee ? 'تم تحديث بيانات الموظف' : 'تم إضافة الموظف بنجاح' });
    setSaving(false);
    router.push(`/employees/${employeeId}`);
  }

  const defaultSchedule = schedules.find((s) => s.is_default);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          <ArrowRight className="ml-2 h-4 w-4" /> رجوع
        </Button>
        <Button type="submit" disabled={saving}>
          <Save className="ml-2 h-4 w-4" /> {saving ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">البيانات الأساسية</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>الرقم الوظيفي *</Label>
            <Input value={form.employee_code} onChange={(e) => set('employee_code', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>الاسم الكامل *</Label>
            <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
          </div>
          {canSensitive && (
            <div className="space-y-2">
              <Label>الرقم القومي</Label>
              <Input value={priv.national_id} onChange={(e) => setPriv((p) => ({ ...p, national_id: e.target.value }))} disabled={loadingPrivate} />
            </div>
          )}
          <div className="space-y-2">
            <Label>الهاتف</Label>
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>تاريخ الميلاد</Label>
            <Input type="date" value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>الحالة الاجتماعية</Label>
            <Select value={form.marital_status} onValueChange={(v) => set('marital_status', v)}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">أعزب</SelectItem>
                <SelectItem value="married">متزوج</SelectItem>
                <SelectItem value="divorced">مطلق</SelectItem>
                <SelectItem value="widowed">أرمل</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>المؤهل</Label>
            <Input value={form.qualification} onChange={(e) => set('qualification', e.target.value)} placeholder="بكالوريوس / ماجستير..." />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label>العنوان</Label>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">البيانات الوظيفية</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>الفرع</Label>
            <Select value={form.branch_id} onValueChange={(v) => set('branch_id', v)}>
              <SelectTrigger><SelectValue placeholder="اختر الفرع" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name_ar ?? b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>القسم</Label>
            <Select value={form.department_id} onValueChange={(v) => set('department_id', v)}>
              <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name_ar ?? d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>الوظيفة</Label>
            <Select value={form.position_id} onValueChange={(v) => set('position_id', v)}>
              <SelectTrigger><SelectValue placeholder="اختر الوظيفة" /></SelectTrigger>
              <SelectContent>
                {positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.title_ar ?? p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>المدير المباشر</Label>
            <Select value={form.manager_id} onValueChange={(v) => set('manager_id', v)}>
              <SelectTrigger><SelectValue placeholder="اختر المدير" /></SelectTrigger>
              <SelectContent>
                {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>موعد العمل</Label>
            <Select
              value={form.schedule_id || DEFAULT_SCHEDULE_VALUE}
              onValueChange={(v) => set('schedule_id', v === DEFAULT_SCHEDULE_VALUE ? '' : v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_SCHEDULE_VALUE}>
                  {defaultSchedule ? `الموعد الافتراضي (${defaultSchedule.name})` : 'الموعد الافتراضي (8:30 إن لم يوجد)'}
                </SelectItem>
                {schedules.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({String(s.start_time).slice(0, 5)} - {String(s.end_time).slice(0, 5)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>تاريخ التعيين *</Label>
            <Input type="date" value={form.hire_date} onChange={(e) => set('hire_date', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>الحالة الوظيفية</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v as EmployeeStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="on_leave">في إجازة</SelectItem>
                <SelectItem value="resigned">مستقيل</SelectItem>
                <SelectItem value="terminated">منتهي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {canSensitive && (
        <Card>
          <CardHeader><CardTitle className="text-base">البيانات المالية</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>الراتب الأساسي</Label>
              <Input type="number" min={0} value={priv.basic_salary} disabled={loadingPrivate}
                onChange={(e) => setPriv((p) => ({ ...p, basic_salary: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>البدلات</Label>
              <Input type="number" min={0} value={priv.allowances} disabled={loadingPrivate}
                onChange={(e) => setPriv((p) => ({ ...p, allowances: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>رقم الحساب البنكي</Label>
              <Input value={priv.bank_account} disabled={loadingPrivate}
                onChange={(e) => setPriv((p) => ({ ...p, bank_account: e.target.value }))} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">ملاحظات</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="ملاحظات إضافية..." />
        </CardContent>
      </Card>
    </form>
  );
}