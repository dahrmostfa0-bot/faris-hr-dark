 'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Trash2, FileText } from 'lucide-react';
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
import { APPLICANT_STATUS_LABELS, type Applicant, type ApplicantStatus, type Department } from '@/lib/types';

const BUCKET = 'applicant-cvs';
const MAX_CV_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ['pdf', 'doc', 'docx'];
const APPLICANT_SELECT = '*, department:departments(id, name, name_ar)';

const emptyForm = { full_name: '', email: '', phone: '', position_applied: '', department_id: '', notes: '' };

export default function RecruitmentPage() {
  const { company, companyRole } = useAuth();
  const { toast } = useToast();
  const canManage = hasCompanyPermission(companyRole ?? undefined, 'recruitment.manage');

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [cvFile, setCvFile] = useState<File | null>(null);

  async function loadApplicants(companyId: string) {
    const { data } = await supabase
      .from('applicants')
      .select(APPLICANT_SELECT)
      .eq('company_id', companyId)
      .order('applied_at', { ascending: false });
    setApplicants((data ?? []) as unknown as Applicant[]);
  }

  useEffect(() => {
    if (!company) { setLoading(false); return; }
    (async () => {
      const dRes = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', company.id)
        .order('name');
      setDepartments((dRes.data ?? []) as Department[]);
      await loadApplicants(company.id);
      setLoading(false);
    })();
  }, [company]);

  async function handleSubmit() {
    if (!company) { toast({ title: 'خطأ', description: 'لا توجد شركة مرتبطة بالحساب', variant: 'destructive' }); return; }
    if (!form.full_name) { toast({ title: 'أدخل الاسم', variant: 'destructive' }); return; }

    let cvPath: string | null = null;
    if (cvFile) {
      const ext = (cvFile.name.split('.').pop() ?? '').toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) {
        toast({ title: 'نوع الملف غير مسموح', description: 'ارفع ملف PDF أو Word فقط', variant: 'destructive' });
        return;
      }
      if (cvFile.size > MAX_CV_BYTES) {
        toast({ title: 'الملف كبير', description: 'الحد الأقصى 5 ميجا', variant: 'destructive' });
        return;
      }
      setUploading(true);
      const path = `${company.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, cvFile);
      setUploading(false);
      if (upErr) { toast({ title: 'خطأ رفع الملف', description: upErr.message, variant: 'destructive' }); return; }
      cvPath = path;
    }

    const { error } = await supabase.from('applicants').insert({
      company_id: company.id,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      position_applied: form.position_applied,
      department_id: form.department_id || null,
      notes: form.notes,
      cv_path: cvPath,
      status: 'applied',
    });
    if (error) {
      if (cvPath) await supabase.storage.from(BUCKET).remove([cvPath]);
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'تم تسجيل المتقدم' });
    setOpen(false);
    setCvFile(null);
    setForm(emptyForm);
    await loadApplicants(company.id);
  }

  async function openCv(path: string) {
    const w = window.open('', '_blank');
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      w?.close();
      toast({ title: 'تعذّر فتح السيرة الذاتية', description: error?.message, variant: 'destructive' });
      return;
    }
    if (w) w.location.href = data.signedUrl;
  }

  async function updateStatus(id: string, status: ApplicantStatus) {
    const { error } = await supabase.from('applicants').update({ status }).eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setApplicants((a) => a.map((x) => x.id === id ? { ...x, status } : x));
    toast({ title: 'تم تحديث الحالة' });
  }

  async function deleteApplicant(id: string, cvPath?: string | null) {
    if (!confirm('حذف هذا المتقدم؟')) return;
    const { error } = await supabase.from('applicants').delete().eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    if (cvPath) await supabase.storage.from(BUCKET).remove([cvPath]);
    setApplicants((a) => a.filter((x) => x.id !== id));
    toast({ title: 'تم الحذف' });
  }

  const counts = {
    applied: applicants.filter((a) => a.status === 'applied').length,
    interview: applicants.filter((a) => a.status === 'interview').length,
    offered: applicants.filter((a) => a.status === 'offered').length,
    hired: applicants.filter((a) => a.status === 'hired').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="التوظيف"
        description={`${applicants.length} متقدم — ${counts.applied} جديد — ${counts.interview} مقابلة — ${counts.hired} تم التعيين`}
        actions={canManage && <Button onClick={() => setOpen(true)}><UserPlus className="ml-2 h-4 w-4" /> إضافة متقدم</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>تسجيل متقدم جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>الوظيفة المتقدم لها</Label><Input value={form.position_applied} onChange={(e) => setForm({ ...form, position_applied: e.target.value })} /></div>
              <div className="space-y-2"><Label>البريد</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>القسم</Label><Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}><SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name_ar ?? d.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 sm:col-span-2"><Label>السيرة الذاتية (PDF/Word، حتى 5 ميجا)</Label><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>ملاحظات</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={uploading}>{uploading ? 'جاري الرفع...' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div> : applicants.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><UserPlus className="h-8 w-8 opacity-40" /><p className="text-sm">لا يوجد متقدمون</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>الوظيفة</TableHead><TableHead>القسم</TableHead><TableHead>الهاتف</TableHead><TableHead>التاريخ</TableHead><TableHead>السيرة</TableHead><TableHead>الحالة</TableHead>{canManage && <TableHead>إجراءات</TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {applicants.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.full_name}</TableCell>
                      <TableCell>{a.position_applied ?? '-'}</TableCell>
                      <TableCell>{a.department?.name_ar ?? a.department?.name ?? '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{a.phone ?? '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateAr(a.applied_at)}</TableCell>
                      <TableCell>{a.cv_path ? <Button size="sm" variant="ghost" onClick={() => openCv(a.cv_path as string)}><FileText className="h-4 w-4" /></Button> : '-'}</TableCell>
                      <TableCell>
                        {canManage ? (
                          <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v as ApplicantStatus)}>
                            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{(Object.keys(APPLICANT_STATUS_LABELS) as ApplicantStatus[]).map((s) => <SelectItem key={s} value={s}>{APPLICANT_STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={a.status === 'hired' ? 'success' : a.status === 'rejected' ? 'destructive' : a.status === 'offered' ? 'default' : 'secondary'}>
                            {APPLICANT_STATUS_LABELS[a.status as keyof typeof APPLICANT_STATUS_LABELS] ?? a.status}
                          </Badge>
                        )}
                      </TableCell>
                      {canManage && <TableCell><Button size="icon" variant="ghost" onClick={() => deleteApplicant(a.id, a.cv_path)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>}
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
