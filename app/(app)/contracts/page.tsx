 'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { hasCompanyPermission } from '@/lib/permissions';
import { formatDateAr } from '@/lib/format';
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, type Contract, type ContractType, type ContractStatus, type Employee } from '@/lib/types';

const CONTRACT_SELECT = '*, employee:employees(id, full_name)';

function emptyForm() {
  return {
    employee_id: '', type: 'permanent' as ContractType, start_date: new Date().toISOString().slice(0, 10),
    end_date: '', salary: 0, terms: '',
  };
}

export default function ContractsPage() {
  const { company, companyRole } = useAuth();
  const { toast } = useToast();
  const canManage = hasCompanyPermission(companyRole ?? undefined, 'contracts.manage');

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  async function loadContracts(companyId: string) {
    const { data } = await supabase
      .from('contracts')
      .select(CONTRACT_SELECT)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setContracts((data ?? []) as unknown as Contract[]);
  }

  useEffect(() => {
    if (!company) { setLoading(false); return; }
    (async () => {
      const empRes = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('company_id', company.id)
        .order('full_name');
      setEmployees((empRes.data ?? []) as Employee[]);
      await loadContracts(company.id);
      setLoading(false);
    })();
  }, [company]);

  async function handleSubmit() {
    if (!company) { toast({ title: 'خطأ', description: 'لا توجد شركة مرتبطة بالحساب', variant: 'destructive' }); return; }
    if (!form.employee_id) { toast({ title: 'اختر موظف', variant: 'destructive' }); return; }
    if (Number(form.salary) < 0) { toast({ title: 'الراتب لا يمكن أن يكون سالبًا', variant: 'destructive' }); return; }
    if (form.end_date && form.end_date < form.start_date) {
      toast({ title: 'تاريخ الانتهاء قبل البداية', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('contracts').insert({
      company_id: company.id,
      employee_id: form.employee_id,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      salary: Number(form.salary),
      status: 'active',
      terms: form.terms,
    });
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم إنشاء العقد' });
    setOpen(false);
    setForm(emptyForm());
    await loadContracts(company.id);
  }

  async function renew(id: string) {
    if (!company) return;
    const c = contracts.find((x) => x.id === id);
    if (!c?.end_date) { toast({ title: 'حدد تاريخ انتهاء أولاً', variant: 'destructive' }); return; }
    const newEnd = new Date(c.end_date);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    const newEndStr = newEnd.toISOString().slice(0, 10);
    if (!confirm(`تجديد العقد حتى ${formatDateAr(newEndStr)}؟`)) return;
    const { error } = await supabase
      .from('contracts')
      .update({ end_date: newEndStr, status: 'renewed' })
      .eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم تجديد العقد' });
    await loadContracts(company.id);
  }

  async function terminate(id: string) {
    if (!confirm('إنهاء هذا العقد؟')) return;
    const { error } = await supabase.from('contracts').update({ status: 'terminated' }).eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setContracts((c) => c.map((x) => x.id === id ? { ...x, status: 'terminated' as ContractStatus } : x));
    toast({ title: 'تم إنهاء العقد' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="العقود"
        description={`${contracts.length} عقد`}
        actions={canManage && <Button onClick={() => setOpen(true)}><Plus className="ml-2 h-4 w-4" /> عقد جديد</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>إنشاء عقد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>الموظف</Label><Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>نوع العقد</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ContractType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map((t) => <SelectItem key={t} value={t}>{CONTRACT_TYPE_LABELS[t]}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>تاريخ البداية</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>تاريخ الانتهاء</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>الراتب</Label><Input type="number" min={0} value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>الشروط</Label><Textarea rows={3} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>إنشاء</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div> : contracts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><FileText className="h-8 w-8 opacity-40" /><p className="text-sm">لا توجد عقود</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>النوع</TableHead><TableHead>البداية</TableHead><TableHead>النهاية</TableHead><TableHead>الراتب</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                <TableBody>
                  {contracts.map((c) => {
                    const days = c.end_date ? Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000) : null;
                    const endingSoon = days !== null && days >= 0 && days <= 30;
                    const pastEnd = days !== null && days < 0 && c.status !== 'terminated' && c.status !== 'expired';
                    const closed = c.status === 'terminated' || c.status === 'expired';
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.employee?.full_name ?? '-'}</TableCell>
                        <TableCell>{CONTRACT_TYPE_LABELS[c.type as keyof typeof CONTRACT_TYPE_LABELS] ?? c.type}</TableCell>
                        <TableCell>{formatDateAr(c.start_date)}</TableCell>
                        <TableCell>{c.end_date ? formatDateAr(c.end_date) : '-'}{endingSoon && <Badge variant="warning" className="mr-2">{days} يوم</Badge>}</TableCell>
                        <TableCell>{new Intl.NumberFormat('ar-EG').format(c.salary)}</TableCell>
                        <TableCell>
                          {pastEnd
                            ? <Badge variant="destructive">منتهي</Badge>
                            : <Badge variant={c.status === 'active' ? 'success' : closed ? 'destructive' : 'warning'}>{CONTRACT_STATUS_LABELS[c.status as keyof typeof CONTRACT_STATUS_LABELS] ?? c.status}</Badge>}
                        </TableCell>
                        <TableCell>
                          {canManage && !closed && (
                            <div className="flex gap-1">
                              {c.end_date && <Button size="sm" variant="ghost" title="تجديد سنة" onClick={() => renew(c.id)}><RefreshCw className="h-4 w-4" /></Button>}
                              <Button size="sm" variant="ghost" onClick={() => terminate(c.id)}>إنهاء</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}