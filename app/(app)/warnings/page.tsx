 'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Plus, Trash2, FileWarning, Clock, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { hasCompanyPermission } from '@/lib/permissions';
import { formatDateAr } from '@/lib/format';
import {
  WARNING_TYPE_LABELS, WARNING_STATUS_LABELS,
  type Warning, type WarningType, type WarningStatus, type Employee, type Contract,
} from '@/lib/types';

const WARNING_SELECT = '*, employee:employees(id, full_name)';
const CONTRACT_SELECT = '*, employee:employees(id, full_name)';

function emptyForm() {
  return {
    employee_id: '', type: 'verbal' as WarningType, reason: '', date: new Date().toISOString().slice(0, 10),
    issued_by: '', labor_law_ref: '', notes: '',
  };
}

export default function WarningsPage() {
  const { company, companyRole } = useAuth();
  const { toast } = useToast();
  const role = companyRole ?? undefined;
  const canManage = hasCompanyPermission(role, 'warnings.manage');
  const canViewContracts = hasCompanyPermission(role, 'contracts.view');

  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  async function loadWarnings(companyId: string) {
    const { data } = await supabase
      .from('warnings')
      .select(WARNING_SELECT)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setWarnings((data ?? []) as unknown as Warning[]);
  }

  useEffect(() => {
    if (!company) { setLoading(false); return; }
    (async () => {
      const eRes = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('company_id', company.id)
        .order('full_name');
      setEmployees((eRes.data ?? []) as Employee[]);

      if (canViewContracts) {
        const cRes = await supabase
          .from('contracts')
          .select(CONTRACT_SELECT)
          .eq('company_id', company.id)
          .order('end_date', { ascending: true });
        setContracts((cRes.data ?? []) as unknown as Contract[]);
      }

      await loadWarnings(company.id);
      setLoading(false);
    })();
  }, [company, canViewContracts]);

  async function notifyManagement(companyId: string, title: string, body: string) {
    const { data: members } = await supabase
      .from('company_members')
      .select('user_id, role')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .in('role', ['owner', 'hr_manager']);
    // company_members يقرأها المستخدم لنفسه فقط، فقد لا تُرجع غيره؛ لذلك نضمن إشعارًا لصاحب الإجراء على الأقل
    const ids = new Set<string>((members ?? []).map((m: { user_id: string }) => m.user_id));
    const rows = Array.from(ids).map((uid) => ({
      company_id: companyId, user_id: uid, title, body, type: 'warning', read: false,
    }));
    if (rows.length > 0) await supabase.from('notifications').insert(rows);
  }

  async function handleSubmit() {
    if (!company) { toast({ title: 'خطأ', description: 'لا توجد شركة مرتبطة بالحساب', variant: 'destructive' }); return; }
    if (!form.employee_id || !form.reason) { toast({ title: 'أكمل البيانات', variant: 'destructive' }); return; }
    const { error } = await supabase.from('warnings').insert({
      company_id: company.id,
      employee_id: form.employee_id,
      type: form.type,
      reason: form.reason,
      date: form.date,
      issued_by: form.issued_by,
      labor_law_ref: form.labor_law_ref,
      notes: form.notes,
      status: 'active',
    });
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }

    toast({ title: 'تم تسجيل التنبيه' });
    setOpen(false);
    const empName = employees.find((e) => e.id === form.employee_id)?.full_name ?? '';
    setForm(emptyForm());
    await loadWarnings(company.id);
    await notifyManagement(company.id, 'تنبيه جديد', `تم تسجيل ${WARNING_TYPE_LABELS[form.type]} للموظف ${empName}`);
  }

  async function revoke(id: string) {
    const { error } = await supabase.from('warnings').update({ status: 'revoked' }).eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setWarnings((w) => w.map((x) => x.id === id ? { ...x, status: 'revoked' as WarningStatus } : x));
    toast({ title: 'تم إلغاء التنبيه' });
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا التنبيه؟')) return;
    const { error } = await supabase.from('warnings').delete().eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setWarnings((w) => w.filter((x) => x.id !== id));
    toast({ title: 'تم الحذف' });
  }

  const now = Date.now();
  const endingContracts = contracts.filter((c) => {
    if (!c.end_date || c.status === 'terminated' || c.status === 'expired') return false;
    const days = (new Date(c.end_date).getTime() - now) / 86400000;
    return days >= 0 && days <= 90;
  });

  const activeWarnings = warnings.filter((w) => w.status === 'active');

  return (
    <div className="space-y-6">
      <PageHeader
        title="التنبيهات والجزاءات"
        description={canViewContracts
          ? `${activeWarnings.length} تنبيه ساري — ${endingContracts.length} عقد قارب على الانتهاء`
          : `${activeWarnings.length} تنبيه ساري`}
        actions={canManage && <Button onClick={() => setOpen(true)}><Plus className="ml-2 h-4 w-4" /> تسجيل تنبيه</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>تسجيل تنبيه / جزاء</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>الموظف</Label><Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>نوع التنبيه</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as WarningType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(WARNING_TYPE_LABELS) as WarningType[]).map((t) => <SelectItem key={t} value={t}>{WARNING_TYPE_LABELS[t]}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>السبب *</Label><Textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>التاريخ</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="space-y-2"><Label>صادر من</Label><Input value={form.issued_by} onChange={(e) => setForm({ ...form, issued_by: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>مرجع قانون العمل</Label><Input value={form.labor_law_ref} onChange={(e) => setForm({ ...form, labor_law_ref: e.target.value })} placeholder="مثال: المادة 69 من قانون العمل" /></div>
            <div className="space-y-2"><Label>ملاحظات</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={`grid grid-cols-2 gap-3 ${canViewContracts ? 'sm:grid-cols-4' : 'sm:grid-cols-1'}`}>
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning"><AlertTriangle className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">تنبيهات سارية</p><p className="text-xl font-bold">{activeWarnings.length}</p></div></CardContent></Card>
        {canViewContracts && (
          <>
            <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive"><FileWarning className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">عقود تنتهي خلال 30 يوم</p><p className="text-xl font-bold">{endingContracts.filter((c) => { const d = (new Date(c.end_date!).getTime() - now) / 86400000; return d <= 30; }).length}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">عقود تنتهي خلال 60 يوم</p><p className="text-xl font-bold">{endingContracts.filter((c) => { const d = (new Date(c.end_date!).getTime() - now) / 86400000; return d <= 60; }).length}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"><ShieldAlert className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">إجمالي العقود المنتهية قريباً</p><p className="text-xl font-bold">{endingContracts.length}</p></div></CardContent></Card>
          </>
        )}
      </div>

      <Tabs defaultValue="warnings">
        <TabsList>
          <TabsTrigger value="warnings"><ShieldAlert className="ml-2 h-4 w-4" /> التنبيهات والجزاءات</TabsTrigger>
          {canViewContracts && <TabsTrigger value="contracts"><FileWarning className="ml-2 h-4 w-4" /> تنبيهات انتهاء العقود</TabsTrigger>}
        </TabsList>

        <TabsContent value="warnings">
          <Card>
            <CardHeader><CardTitle className="text-base">سجل التنبيهات والجزاءات</CardTitle><CardDescription>توثيق الإجراءات التأديبية وفقاً لقانون العمل</CardDescription></CardHeader>
            <CardContent className="p-0">
              {loading ? <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div> : warnings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><ShieldAlert className="h-8 w-8 opacity-40" /><p className="text-sm">لا توجد تنبيهات</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>النوع</TableHead><TableHead>السبب</TableHead><TableHead>التاريخ</TableHead><TableHead>مرجع قانون العمل</TableHead><TableHead>الحالة</TableHead>{canManage && <TableHead>إجراءات</TableHead>}</TableRow></TableHeader>
                  <TableBody>
                    {warnings.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.employee?.full_name ?? '-'}</TableCell>
                        <TableCell><Badge variant={w.type === 'termination' ? 'destructive' : w.type === 'suspension' ? 'warning' : 'secondary'}>{WARNING_TYPE_LABELS[w.type as keyof typeof WARNING_TYPE_LABELS] ?? w.type}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">{w.reason}</TableCell>
                        <TableCell>{formatDateAr(w.date)}</TableCell>
                        <TableCell className="text-muted-foreground">{w.labor_law_ref ?? '-'}</TableCell>
                        <TableCell><Badge variant={w.status === 'active' ? 'destructive' : 'secondary'}>{WARNING_STATUS_LABELS[w.status as keyof typeof WARNING_STATUS_LABELS] ?? w.status}</Badge></TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex gap-1">
                              {w.status === 'active' && <Button size="sm" variant="ghost" onClick={() => revoke(w.id)}>إلغاء</Button>}
                              <Button size="icon" variant="ghost" onClick={() => remove(w.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canViewContracts && (
          <TabsContent value="contracts">
            <Card>
              <CardHeader><CardTitle className="text-base">عقود قاربت على الانتهاء</CardTitle><CardDescription>تنبيهات للموارد البشرية بخصوص العقود المنتهية خلال 90 يوماً</CardDescription></CardHeader>
              <CardContent className="p-0">
                {endingContracts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><FileWarning className="h-8 w-8 opacity-40" /><p className="text-sm">لا توجد عقود قاربت على الانتهاء</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>نوع العقد</TableHead><TableHead>تاريخ الانتهاء</TableHead><TableHead>الأيام المتبقية</TableHead><TableHead>الأولوية</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {endingContracts.map((c) => {
                        const days = Math.ceil((new Date(c.end_date!).getTime() - now) / 86400000);
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.employee?.full_name ?? '-'}</TableCell>
                            <TableCell>{c.type}</TableCell>
                            <TableCell>{formatDateAr(c.end_date)}</TableCell>
                            <TableCell className="font-semibold">{days} يوم</TableCell>
                            <TableCell><Badge variant={days <= 7 ? 'destructive' : days <= 30 ? 'warning' : 'secondary'}>{days <= 7 ? 'عاجل' : days <= 30 ? 'مرتفعة' : 'متوسطة'}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}