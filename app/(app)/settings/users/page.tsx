'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Trash2, KeyRound, Copy } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { COMPANY_ROLE_LABELS, type CompanyRole } from '@/lib/types';

type Member = {
  user_id: string; email: string; role: CompanyRole; status: string;
  employee_name: string | null; employee_code: string | null;
};
type Unlinked = { id: string; full_name: string; employee_code: string };
type LinkMode = 'new' | 'existing' | 'none';

const ASSIGNABLE: CompanyRole[] = [
  'hr_manager', 'hr_attendance', 'hr_payroll', 'hr_recruitment', 'direct_manager', 'employee',
];

function genPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%';
  const buf = new Uint32Array(14);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join('');
}

async function api(method: string, body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/admin/users', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data: data as Record<string, unknown> & { error?: string; warning?: string } };
}

function emptyForm() {
  return { email: '', full_name: '', password: '', role: 'employee' as CompanyRole, link_mode: 'new' as LinkMode, employee_id: '' };
}

export default function UsersPage() {
  const { user, companyRole } = useAuth();
  const { toast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [unlinked, setUnlinked] = useState<Unlinked[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const [pwTarget, setPwTarget] = useState<Member | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await api('GET');
    if (!ok) setError(data.error ?? 'تعذر تحميل المستخدمين');
    else {
      setError(null);
      setMembers((data.members ?? []) as Member[]);
      setUnlinked((data.unlinked ?? []) as Unlinked[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (companyRole === 'owner') load();
    else setLoading(false);
  }, [companyRole, load]);

  function openAdd() {
    setForm({ ...emptyForm(), password: genPassword() });
    setCreated(null);
    setAddOpen(true);
  }

  async function submitAdd() {
    if (!form.email.trim() || form.password.length < 8) {
      toast({ title: 'أكمل البريد وكلمة مرور (8 أحرف على الأقل)', variant: 'destructive' });
      return;
    }
    if (form.link_mode === 'new' && !form.full_name.trim()) {
      toast({ title: 'أدخل اسم الموظف', variant: 'destructive' });
      return;
    }
    if (form.link_mode === 'existing' && !form.employee_id) {
      toast({ title: 'اختر الموظف المراد ربطه', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { ok, data } = await api('POST', form);
    setSaving(false);
    if (!ok) { toast({ title: 'تعذر إنشاء المستخدم', description: data.error, variant: 'destructive' }); return; }
    setCreated({ email: form.email.trim().toLowerCase(), password: form.password });
    await load();
  }

  async function changeRole(m: Member, role: CompanyRole) {
    const { ok, data } = await api('PATCH', { user_id: m.user_id, role });
    if (!ok) { toast({ title: 'خطأ', description: data.error, variant: 'destructive' }); return; }
    setMembers((list) => list.map((x) => x.user_id === m.user_id ? { ...x, role } : x));
    toast({ title: 'تم تغيير الدور' });
  }

  async function submitPassword() {
    if (!pwTarget) return;
    if (newPassword.length < 8) { toast({ title: 'كلمة المرور 8 أحرف على الأقل', variant: 'destructive' }); return; }
    setSaving(true);
    const { ok, data } = await api('PATCH', { user_id: pwTarget.user_id, password: newPassword });
    setSaving(false);
    if (!ok) { toast({ title: 'خطأ', description: data.error, variant: 'destructive' }); return; }
    toast({ title: 'تم تعيين كلمة السر الجديدة', description: 'أبلغ الموظف بها بطريقة آمنة' });
    setPwTarget(null);
  }

  async function removeUser(m: Member) {
    if (!confirm(`إزالة ${m.email}؟ سيفقد الوصول للنظام فورًا. سجل الموظف وتاريخه يبقيان.`)) return;
    const { ok, data } = await api('DELETE', { user_id: m.user_id });
    if (!ok) { toast({ title: 'خطأ', description: data.error, variant: 'destructive' }); return; }
    toast({ title: 'تمت الإزالة', description: data.warning });
    await load();
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast({ title: 'تم النسخ' }); }
    catch { toast({ title: 'تعذر النسخ، انسخ يدويًا', variant: 'destructive' }); }
  }

  if (!loading && companyRole !== 'owner') {
    return <div className="py-12 text-center text-muted-foreground">هذه الصفحة لمالك الشركة فقط.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستخدمون"
        description="إضافة حسابات الدخول وتحديد صلاحيات كل مستخدم"
        actions={<Button onClick={openAdd}><UserPlus className="ml-2 h-4 w-4" /> مستخدم جديد</Button>}
      />

      {error && <Card><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموظف</TableHead>
                    <TableHead>البريد</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const locked = m.role === 'owner' || m.user_id === user?.id;
                    return (
                      <TableRow key={m.user_id}>
                        <TableCell className="font-medium">
                          {m.employee_name ?? '-'}
                          {m.employee_code && <span className="mr-2 text-xs text-muted-foreground">{m.employee_code}</span>}
                        </TableCell>
                        <TableCell dir="ltr" className="text-right text-muted-foreground">{m.email}</TableCell>
                        <TableCell>
                          {locked ? (
                            <Badge variant="secondary">{COMPANY_ROLE_LABELS[m.role] ?? m.role}</Badge>
                          ) : (
                            <Select value={m.role} onValueChange={(v) => changeRole(m, v as CompanyRole)}>
                              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ASSIGNABLE.map((r) => <SelectItem key={r} value={r}>{COMPANY_ROLE_LABELS[r]}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {!locked && (
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" title="تعيين كلمة سر جديدة" onClick={() => { setPwTarget(m); setNewPassword(genPassword()); }}>
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" title="إزالة المستخدم" onClick={() => removeUser(m)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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

      {/* إضافة مستخدم */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{created ? 'تم إنشاء الحساب' : 'مستخدم جديد'}</DialogTitle></DialogHeader>

          {created ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">سلّم هذه البيانات للموظف بطريقة آمنة. كلمة السر لن تظهر مرة أخرى.</p>
              <div className="flex items-center justify-between rounded-lg border border-border p-3" dir="ltr">
                <span className="text-sm">{created.email}</span>
                <Button size="icon" variant="ghost" onClick={() => copy(created.email)}><Copy className="h-4 w-4" /></Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3" dir="ltr">
                <span className="font-mono text-sm">{created.password}</span>
                <Button size="icon" variant="ghost" onClick={() => copy(created.password)}><Copy className="h-4 w-4" /></Button>
              </div>
              <DialogFooter><Button onClick={() => setAddOpen(false)}>تم</Button></DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور المؤقتة</Label>
                  <div className="flex gap-2">
                    <Input dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <Button type="button" variant="outline" onClick={() => setForm({ ...form, password: genPassword() })}>توليد</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الدور</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as CompanyRole })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ASSIGNABLE.map((r) => <SelectItem key={r} value={r}>{COMPANY_ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>سجل الموظف</Label>
                  <Select value={form.link_mode} onValueChange={(v) => setForm({ ...form, link_mode: v as LinkMode })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">إنشاء سجل موظف جديد</SelectItem>
                      <SelectItem value="existing">ربط بموظف موجود</SelectItem>
                      <SelectItem value="none">بدون سجل موظف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.link_mode === 'new' && (
                  <div className="space-y-2">
                    <Label>اسم الموظف</Label>
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                )}
                {form.link_mode === 'existing' && (
                  <div className="space-y-2">
                    <Label>الموظف</Label>
                    <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder={unlinked.length ? 'اختر' : 'لا يوجد موظفون بدون حساب'} /></SelectTrigger>
                      <SelectContent>
                        {unlinked.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name} — {e.employee_code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
                <Button onClick={submitAdd} disabled={saving}>{saving ? 'جاري الإنشاء...' : 'إنشاء'}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* إعادة تعيين كلمة السر */}
      <Dialog open={!!pwTarget} onOpenChange={(o) => { if (!o) setPwTarget(null); }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>كلمة سر جديدة</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground" dir="ltr">{pwTarget?.email}</p>
            <div className="flex gap-2">
              <Input dir="ltr" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Button type="button" variant="outline" onClick={() => setNewPassword(genPassword())}>توليد</Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => copy(newPassword)}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)}>إلغاء</Button>
            <Button onClick={submitPassword} disabled={saving}>{saving ? 'جاري الحفظ...' : 'تعيين'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}