 'use client';

import { useEffect, useState } from 'react';
import { Plus, CalendarDays, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { hasCompanyPermission } from '@/lib/permissions';
import { formatDateAr, daysBetween } from '@/lib/format';
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, type Leave, type LeaveType, type Employee } from '@/lib/types';

const LEAVE_SELECT = '*, employee:employees(id, full_name)';

export default function LeavesPage() {
  const { user, company, companyRole } = useAuth();
  const { toast } = useToast();
  const role = companyRole ?? undefined;
  const canRequest = hasCompanyPermission(role, 'leaves.request');
  const canApproveManager = hasCompanyPermission(role, 'leaves.approve_manager');
  const canApproveHr = hasCompanyPermission(role, 'leaves.approve_hr');
  // المالك والـ HR يختارون الموظف، أما الموظف العادي فطلبه باسمه
  const canPickEmployee = canApproveHr;

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: '', type: 'annual' as LeaveType, start_date: '', end_date: '', reason: '',
  });

  async function loadLeaves(companyId: string) {
    const { data } = await supabase
      .from('leaves')
      .select(LEAVE_SELECT)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setLeaves((data ?? []) as unknown as Leave[]);
  }

  useEffect(() => {
    if (!company) { setLoading(false); return; }
    (async () => {
      const [empRes, meRes] = await Promise.all([
        supabase.from('employees').select('id, full_name').eq('company_id', company.id).order('full_name'),
        user
          ? supabase.from('employees').select('id').eq('company_id', company.id).eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setEmployees((empRes.data ?? []) as Employee[]);
      setMyEmployeeId((meRes.data as { id: string } | null)?.id ?? null);
      await loadLeaves(company.id);
      setLoading(false);
    })();
  }, [company, user]);

  async function handleSubmit() {
    if (!company) { toast({ title: 'خطأ', description: 'لا توجد شركة مرتبطة بالحساب', variant: 'destructive' }); return; }
    const employeeId = canPickEmployee ? form.employee_id : myEmployeeId;
    if (!employeeId) {
      toast({ title: canPickEmployee ? 'اختر الموظف' : 'حسابك غير مربوط بسجل موظف', variant: 'destructive' });
      return;
    }
    if (!form.start_date || !form.end_date) { toast({ title: 'أكمل التواريخ', variant: 'destructive' }); return; }
    if (form.end_date < form.start_date) { toast({ title: 'تاريخ النهاية قبل البداية', variant: 'destructive' }); return; }
    const days = daysBetween(form.start_date, form.end_date);
    const { error } = await supabase.from('leaves').insert({
      company_id: company.id,
      employee_id: employeeId,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
      days,
      reason: form.reason,
      status: 'pending',
    });
    if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'تم إرسال الطلب' });
      setOpen(false);
      setForm({ employee_id: '', type: 'annual', start_date: '', end_date: '', reason: '' });
      await loadLeaves(company.id);
    }
  }

  async function updateStatus(id: string, status: Leave['status'], decisionField: 'manager_decision' | 'hr_decision') {
    if (!company) return;
    const { error } = await supabase
      .from('leaves')
      .update({ status, [decisionField]: 'تم', [decisionField + '_at']: new Date().toISOString() })
      .eq('id', id);
    if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'تم التحديث' });
      await loadLeaves(company.id);
    }
  }

  const pending = leaves.filter((l) => l.status === 'pending').length;
  const approved = leaves.filter((l) => l.status === 'hr_approved').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإجازات"
        description={`${leaves.length} طلب — ${pending} قيد الانتظار — ${approved} معتمد`}
        actions={canRequest && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" /> طلب إجازة</Button></DialogTrigger>
            <DialogContent aria-describedby={undefined}>
              <DialogHeader><DialogTitle>طلب إجازة جديد</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                {canPickEmployee && (
                  <div className="space-y-2">
                    <Label>الموظف</Label>
                    <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                      <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>نوع الإجازة</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as LeaveType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((t) => <SelectItem key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>من تاريخ</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                  <div className="space-y-2"><Label>إلى تاريخ</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>السبب</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={handleSubmit}>إرسال الطلب</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div> : leaves.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><CalendarDays className="h-8 w-8 opacity-40" /><p className="text-sm">لا توجد طلبات إجازات</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>النوع</TableHead><TableHead>من</TableHead><TableHead>إلى</TableHead><TableHead>الأيام</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                <TableBody>
                  {leaves.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.employee?.full_name ?? '-'}</TableCell>
                      <TableCell>{LEAVE_TYPE_LABELS[l.type as keyof typeof LEAVE_TYPE_LABELS] ?? l.type}</TableCell>
                      <TableCell>{formatDateAr(l.start_date)}</TableCell>
                      <TableCell>{formatDateAr(l.end_date)}</TableCell>
                      <TableCell>{l.days}</TableCell>
                      <TableCell><Badge variant={l.status === 'hr_approved' ? 'success' : l.status === 'rejected' ? 'destructive' : l.status === 'pending' ? 'warning' : 'secondary'}>{LEAVE_STATUS_LABELS[l.status as keyof typeof LEAVE_STATUS_LABELS] ?? l.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canApproveManager && l.status === 'pending' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus(l.id, 'manager_approved', 'manager_decision')}><Check className="h-4 w-4 text-success" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus(l.id, 'rejected', 'manager_decision')}><X className="h-4 w-4 text-destructive" /></Button>
                            </>
                          )}
                          {!canApproveManager && canApproveHr && l.status === 'pending' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus(l.id, 'hr_approved', 'hr_decision')}><Check className="h-4 w-4 text-success" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus(l.id, 'rejected', 'hr_decision')}><X className="h-4 w-4 text-destructive" /></Button>
                            </>
                          )}
                          {canApproveHr && l.status === 'manager_approved' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus(l.id, 'hr_approved', 'hr_decision')}><Check className="h-4 w-4 text-success" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => updateStatus(l.id, 'rejected', 'hr_decision')}><X className="h-4 w-4 text-destructive" /></Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}