 'use client';

import { useEffect, useState } from 'react';
import { Plus, Wallet, CalendarDays, Check, X } from 'lucide-react';
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
import { formatDateAr, formatCurrency, daysBetween } from '@/lib/format';
import {
  LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, LOAN_REQUEST_STATUS_LABELS,
  type Leave, type LeaveType, type LoanRequest,
} from '@/lib/types';

const LEAVE_SELECT = '*, employee:employees(id, full_name)';
const LOAN_SELECT = '*, employee:employees(id, full_name)';

export default function SelfServicePage() {
  const { user, company, companyRole } = useAuth();
  const { toast } = useToast();
  // الموافقة على السلف: المالك و hr_manager فقط (مطابق لسياسات قاعدة البيانات)
  const canApproveLoans = companyRole === 'owner' || companyRole === 'hr_manager';

  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loanReqs, setLoanReqs] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'annual' as LeaveType, start_date: '', end_date: '', reason: '' });
  const [loanForm, setLoanForm] = useState({ amount: 0, installments: 1, reason: '' });

  async function loadLeaves(companyId: string) {
    const { data } = await supabase
      .from('leaves').select(LEAVE_SELECT).eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setLeaves((data ?? []) as unknown as Leave[]);
  }

  async function loadLoans(companyId: string) {
    const { data } = await supabase
      .from('loan_requests').select(LOAN_SELECT).eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setLoanReqs((data ?? []) as unknown as LoanRequest[]);
  }

  useEffect(() => {
    if (!company) { setLoading(false); return; }
    (async () => {
      if (user) {
        const { data: me } = await supabase
          .from('employees').select('id')
          .eq('company_id', company.id).eq('user_id', user.id).maybeSingle();
        setMyEmployeeId((me as { id: string } | null)?.id ?? null);
      }
      await Promise.all([loadLeaves(company.id), loadLoans(company.id)]);
      setLoading(false);
    })();
  }, [company, user]);

  async function submitLeave() {
    if (!company) { toast({ title: 'خطأ', description: 'لا توجد شركة مرتبطة بالحساب', variant: 'destructive' }); return; }
    if (!myEmployeeId) { toast({ title: 'حسابك غير مربوط بسجل موظف', description: 'تواصل مع الموارد البشرية', variant: 'destructive' }); return; }
    if (!leaveForm.start_date || !leaveForm.end_date) { toast({ title: 'أكمل التواريخ', variant: 'destructive' }); return; }
    if (leaveForm.end_date < leaveForm.start_date) { toast({ title: 'تاريخ النهاية قبل البداية', variant: 'destructive' }); return; }
    const days = daysBetween(leaveForm.start_date, leaveForm.end_date);
    const { error } = await supabase.from('leaves').insert({
      company_id: company.id,
      employee_id: myEmployeeId,
      type: leaveForm.type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      days,
      reason: leaveForm.reason,
      status: 'pending',
    });
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم تقديم طلب الإجازة' });
    setLeaveOpen(false);
    setLeaveForm({ type: 'annual', start_date: '', end_date: '', reason: '' });
    await loadLeaves(company.id);
  }

  async function submitLoan() {
    if (!company) { toast({ title: 'خطأ', description: 'لا توجد شركة مرتبطة بالحساب', variant: 'destructive' }); return; }
    if (!myEmployeeId) { toast({ title: 'حسابك غير مربوط بسجل موظف', description: 'تواصل مع الموارد البشرية', variant: 'destructive' }); return; }
    if (!loanForm.amount || loanForm.amount <= 0) { toast({ title: 'أدخل مبلغًا صحيحًا', variant: 'destructive' }); return; }
    const { error } = await supabase.from('loan_requests').insert({
      company_id: company.id,
      employee_id: myEmployeeId,
      amount: Number(loanForm.amount),
      installments: Math.max(1, Number(loanForm.installments)),
      reason: loanForm.reason,
      status: 'pending',
    });
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم تقديم طلب السلفة' });
    setLoanOpen(false);
    setLoanForm({ amount: 0, installments: 1, reason: '' });
    await loadLoans(company.id);
  }

  async function decideLoan(id: string, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('loan_requests')
      .update({ status, hr_decision: 'تم', decided_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setLoanReqs((l) => l.map((x) => x.id === id ? { ...x, status } : x));
    toast({ title: status === 'approved' ? 'تمت الموافقة على السلفة' : 'تم رفض السلفة' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الخدمة الذاتية"
        description="تقديم طلبات الإجازات والسلف ومتابعتها"
        actions={
          myEmployeeId ? (
            <>
              <Button variant="outline" onClick={() => setLeaveOpen(true)}><CalendarDays className="ml-2 h-4 w-4" /> طلب إجازة</Button>
              <Button onClick={() => setLoanOpen(true)}><Plus className="ml-2 h-4 w-4" /> طلب سلفة</Button>
            </>
          ) : null
        }
      />

      {!loading && !myEmployeeId && (
        <Card><CardContent className="p-4 text-sm text-muted-foreground">
          حسابك غير مربوط بسجل موظف، لذلك لا يمكنك تقديم طلبات من هنا. تواصل مع الموارد البشرية لربط حسابك.
        </CardContent></Card>
      )}

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>طلب إجازة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>نوع الإجازة</Label><Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({ ...leaveForm, type: v as LeaveType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((t) => <SelectItem key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>من</Label><Input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} /></div><div className="space-y-2"><Label>إلى</Label><Input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} /></div></div>
            <div className="space-y-2"><Label>السبب</Label><Textarea rows={2} value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={submitLeave}>تقديم الطلب</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={loanOpen} onOpenChange={setLoanOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader><DialogTitle>طلب سلفة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>المبلغ</Label><Input type="number" min={0} value={loanForm.amount} onChange={(e) => setLoanForm({ ...loanForm, amount: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>عدد الأقساط</Label><Input type="number" min={1} value={loanForm.installments} onChange={(e) => setLoanForm({ ...loanForm, installments: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>السبب</Label><Textarea rows={2} value={loanForm.reason} onChange={(e) => setLoanForm({ ...loanForm, reason: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={submitLoan}>تقديم الطلب</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="leaves">
        <TabsList>
          <TabsTrigger value="leaves"><CalendarDays className="ml-2 h-4 w-4" /> طلبات الإجازات</TabsTrigger>
          <TabsTrigger value="loans"><Wallet className="ml-2 h-4 w-4" /> طلبات السلف</TabsTrigger>
        </TabsList>

        <TabsContent value="leaves">
          <Card>
            <CardHeader><CardTitle className="text-base">طلبات الإجازات</CardTitle><CardDescription>تتبع حالة طلبات الإجازات المقدمة</CardDescription></CardHeader>
            <CardContent className="p-0">
              {loading ? <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div> : leaves.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><CalendarDays className="h-8 w-8 opacity-40" /><p className="text-sm">لا توجد طلبات</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>النوع</TableHead><TableHead>من</TableHead><TableHead>إلى</TableHead><TableHead>الأيام</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {leaves.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.employee?.full_name ?? '-'}</TableCell>
                        <TableCell>{LEAVE_TYPE_LABELS[l.type as keyof typeof LEAVE_TYPE_LABELS] ?? l.type}</TableCell>
                        <TableCell>{formatDateAr(l.start_date)}</TableCell>
                        <TableCell>{formatDateAr(l.end_date)}</TableCell>
                        <TableCell>{l.days}</TableCell>
                        <TableCell><Badge variant={l.status === 'hr_approved' ? 'success' : l.status === 'rejected' ? 'destructive' : 'warning'}>{LEAVE_STATUS_LABELS[l.status as keyof typeof LEAVE_STATUS_LABELS] ?? l.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
          <Card>
            <CardHeader><CardTitle className="text-base">طلبات السلف</CardTitle><CardDescription>تتبع طلبات السلف والموافقة عليها</CardDescription></CardHeader>
            <CardContent className="p-0">
              {loading ? <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div> : loanReqs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><Wallet className="h-8 w-8 opacity-40" /><p className="text-sm">لا توجد طلبات سلف</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>المبلغ</TableHead><TableHead>الأقساط</TableHead><TableHead>السبب</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead>{canApproveLoans && <TableHead>إجراءات</TableHead>}</TableRow></TableHeader>
                  <TableBody>
                    {loanReqs.map((lr) => (
                      <TableRow key={lr.id}>
                        <TableCell className="font-medium">{lr.employee?.full_name ?? '-'}</TableCell>
                        <TableCell>{formatCurrency(lr.amount)}</TableCell>
                        <TableCell>{lr.installments}</TableCell>
                        <TableCell className="max-w-[160px] truncate text-muted-foreground">{lr.reason ?? '-'}</TableCell>
                        <TableCell>{formatDateAr(lr.created_at)}</TableCell>
                        <TableCell><Badge variant={lr.status === 'approved' ? 'success' : lr.status === 'rejected' ? 'destructive' : 'warning'}>{LOAN_REQUEST_STATUS_LABELS[lr.status as keyof typeof LOAN_REQUEST_STATUS_LABELS] ?? lr.status}</Badge></TableCell>
                        {canApproveLoans && (
                          <TableCell>
                            {lr.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => decideLoan(lr.id, 'approved')}><Check className="h-4 w-4 text-success" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => decideLoan(lr.id, 'rejected')}><X className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            )}
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
      </Tabs>
    </div>
  );
}