 'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Pencil, Phone, Mail, MapPin, Calendar, User, Briefcase,
  Wallet, FileText, Upload, Trash2, Star, Clock, CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth-context';
import { hasCompanyPermission } from '@/lib/permissions';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDateAr, formatTimeAr, formatCurrency, initials } from '@/lib/format';
import {
  EMPLOYEE_STATUS_LABELS, ATTENDANCE_STATUS_LABELS, LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS, PAYROLL_STATUS_LABELS, TASK_STATUS_LABELS,
  type Employee, type Attendance, type Leave, type Payroll,
  type EmployeeDocument, type Task, type PerformanceReview,
  type EmployeeStatus, type EmployeeSalary, type EmployeeIdentity,
} from '@/lib/types';

const DOC_BUCKET = 'employee-docs';
const DOC_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
const MAX_DOC_BYTES = 10 * 1024 * 1024;

// أعمدة عامة فقط (بدون national_id / basic_salary / allowances / bank_account)
const EMP_COLS =
  'id, company_id, user_id, employee_code, full_name, email, phone, address, birth_date, marital_status, qualification, hire_date, status, notes, department_id, position_id, branch_id, manager_id, created_at';
const RELATIONS =
  'department:departments!employees_department_id_fkey(id, name, name_ar), position:positions(id, title, title_ar), branch:branches(id, name, name_ar), manager:employees!manager_id(id, full_name)';

const MARITAL: Record<string, string> = {
  single: 'أعزب', married: 'متزوج', divorced: 'مطلق', widowed: 'أرمل',
};

const docTypes = [
  { key: 'cv', label: 'السيرة الذاتية' },
  { key: 'contract', label: 'العقد' },
  { key: 'id', label: 'الهوية' },
  { key: 'certificate', label: 'الشهادات' },
  { key: 'other', label: 'مستندات أخرى' },
];

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, company, companyRole, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const role = companyRole ?? undefined;
  const canSeeSensitive = companyRole === 'owner' || companyRole === 'hr_manager';
  const canEdit = hasCompanyPermission(role, 'employees.edit');
  const canDocs = companyRole === 'owner' || companyRole === 'hr_manager';
  const canAttendance = hasCompanyPermission(role, 'attendance.view');
  const canLeaves = hasCompanyPermission(role, 'leaves.view');
  const canPayroll = hasCompanyPermission(role, 'payroll.view');
  const canTasks = hasCompanyPermission(role, 'tasks.view');
  const canReviews = hasCompanyPermission(role, 'reviews.view');

  const [emp, setEmp] = useState<Employee | null>(null);
  const [salary, setSalary] = useState<EmployeeSalary | null>(null);
  const [identity, setIdentity] = useState<EmployeeIdentity | null>(null);
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const id = params.id as string;

  const loadDocs = useCallback(async () => {
    if (!canDocs) return;
    const { data } = await supabase
      .from('documents').select('*').eq('employee_id', id).order('uploaded_at', { ascending: false });
    setDocs((data ?? []) as unknown as EmployeeDocument[]);
  }, [id, canDocs]);

  useEffect(() => {
    if (authLoading) return;
    if (!company) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const empRes = await supabase
        .from('employees')
        .select(`${EMP_COLS}, ${RELATIONS}`)
        .eq('id', id)
        .eq('company_id', company.id)
        .maybeSingle();
      if (cancelled) return;
      if (!empRes.data) { setEmp(null); setLoading(false); return; }
      setEmp(empRes.data as unknown as Employee);

      const [sal, idn, att, lv, pr, tk, rv] = await Promise.all([
        canSeeSensitive ? supabase.from('employee_salary').select('*').eq('employee_id', id).maybeSingle() : null,
        canSeeSensitive ? supabase.from('employee_identity').select('*').eq('employee_id', id).maybeSingle() : null,
        canAttendance ? supabase.from('attendance').select('*').eq('employee_id', id).order('date', { ascending: false }).limit(20) : null,
        canLeaves ? supabase.from('leaves').select('*').eq('employee_id', id).order('created_at', { ascending: false }).limit(20) : null,
        canPayroll ? supabase.from('payroll').select('*').eq('employee_id', id).order('created_at', { ascending: false }).limit(12) : null,
        canTasks ? supabase.from('tasks').select('*').eq('assigned_to', id).order('created_at', { ascending: false }).limit(20) : null,
        canReviews ? supabase.from('performance_reviews').select('*').eq('employee_id', id).order('review_date', { ascending: false }).limit(10) : null,
      ]);
      if (cancelled) return;
      setSalary((sal?.data ?? null) as EmployeeSalary | null);
      setIdentity((idn?.data ?? null) as EmployeeIdentity | null);
      setAttendance((att?.data ?? []) as Attendance[]);
      setLeaves((lv?.data ?? []) as Leave[]);
      setPayrolls((pr?.data ?? []) as Payroll[]);
      setTasks((tk?.data ?? []) as Task[]);
      setReviews((rv?.data ?? []) as PerformanceReview[]);
      await loadDocs();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, company, authLoading, canSeeSensitive, canAttendance, canLeaves, canPayroll, canTasks, canReviews, loadDocs]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, type: string) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !emp || !company) return;
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!DOC_EXT.includes(ext)) {
      toast({ title: 'نوع الملف غير مسموح', description: 'المسموح: PDF وصور وWord', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      toast({ title: 'الملف كبير', description: 'الحد الأقصى 10 ميجا', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const path = `${company.id}/${emp.id}/${type}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(DOC_BUCKET).upload(path, file);
    if (upErr) {
      toast({ title: 'خطأ في الرفع', description: upErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { error: insErr } = await supabase.from('documents').insert({
      company_id: company.id,
      employee_id: emp.id,
      type,
      name: file.name.slice(0, 200),
      storage_path: path,
      uploaded_by: user?.id ?? null,
    });
    if (insErr) {
      await supabase.storage.from(DOC_BUCKET).remove([path]);
      toast({ title: 'خطأ', description: insErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    toast({ title: 'تم الرفع', description: 'تم رفع الملف بنجاح' });
    await loadDocs();
    setUploading(false);
  }

  async function openDoc(path: string) {
    const w = window.open('', '_blank');
    const { data, error } = await supabase.storage.from(DOC_BUCKET).createSignedUrl(path, 60);
    if (error || !data?.signedUrl) {
      w?.close();
      toast({ title: 'تعذّر فتح الملف', description: error?.message, variant: 'destructive' });
      return;
    }
    if (w) w.location.href = data.signedUrl;
  }

  async function handleDeleteDoc(docId: string, path: string) {
    if (!confirm('حذف هذا الملف؟')) return;
    const { error } = await supabase.from('documents').delete().eq('id', docId);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    await supabase.storage.from(DOC_BUCKET).remove([path]);
    setDocs((d) => d.filter((x) => x.id !== docId));
    toast({ title: 'تم الحذف' });
  }

  if (loading || authLoading) return <div className="flex h-64 items-center justify-center text-muted-foreground">جاري التحميل...</div>;
  if (!company) return <div className="py-12 text-center text-muted-foreground">لا توجد شركة مرتبطة بالحساب.</div>;
  if (!emp) return <div className="py-12 text-center">لم يتم العثور على الموظف</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/employees')}><ArrowRight className="ml-2 h-4 w-4" /> رجوع للقائمة</Button>
        {canEdit && <Button asChild><Link href={`/employees/${emp.id}/edit`}><Pencil className="ml-2 h-4 w-4" /> تعديل</Link></Button>}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">{initials(emp.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{emp.full_name}</h2>
            <p className="text-sm text-muted-foreground">{emp.position?.title_ar ?? emp.position?.title ?? '-'} — {emp.department?.name_ar ?? emp.department?.name ?? '-'}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {emp.employee_code}</span>
              {emp.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {emp.phone}</span>}
              {emp.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {emp.email}</span>}
            </div>
          </div>
          <Badge variant={emp.status === 'active' ? 'success' : 'destructive'} className="text-sm">
            {EMPLOYEE_STATUS_LABELS[emp.status as EmployeeStatus] ?? emp.status}
          </Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue="info">
        <TabsList className="flex-wrap">
          <TabsTrigger value="info">المعلومات</TabsTrigger>
          {canAttendance && <TabsTrigger value="attendance">الحضور</TabsTrigger>}
          {canLeaves && <TabsTrigger value="leaves">الإجازات</TabsTrigger>}
          {canPayroll && <TabsTrigger value="payroll">الرواتب</TabsTrigger>}
          {canDocs && <TabsTrigger value="documents">المستندات</TabsTrigger>}
          {canTasks && <TabsTrigger value="tasks">المهام</TabsTrigger>}
          {canReviews && <TabsTrigger value="reviews">التقييم</TabsTrigger>}
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow icon={Calendar} label="تاريخ التعيين" value={formatDateAr(emp.hire_date)} />
              <InfoRow icon={Briefcase} label="القسم" value={emp.department?.name_ar ?? emp.department?.name} />
              <InfoRow icon={Briefcase} label="الوظيفة" value={emp.position?.title_ar ?? emp.position?.title} />
              <InfoRow icon={MapPin} label="الفرع" value={emp.branch?.name_ar ?? emp.branch?.name} />
              <InfoRow icon={User} label="المدير المباشر" value={emp.manager?.full_name} />
              {canSeeSensitive && (
                <>
                  <InfoRow icon={User} label="الرقم القومي" value={identity?.national_id} />
                  <InfoRow icon={Calendar} label="تاريخ الميلاد" value={emp.birth_date ? formatDateAr(emp.birth_date) : null} />
                  <InfoRow icon={User} label="الحالة الاجتماعية" value={emp.marital_status ? (MARITAL[emp.marital_status] ?? emp.marital_status) : null} />
                  <InfoRow icon={Briefcase} label="المؤهل" value={emp.qualification} />
                  <InfoRow icon={MapPin} label="العنوان" value={emp.address} />
                  <InfoRow icon={Wallet} label="الراتب الأساسي" value={salary ? formatCurrency(salary.basic_salary) : null} />
                  <InfoRow icon={Wallet} label="البدلات" value={salary ? formatCurrency(salary.allowances) : null} />
                  <InfoRow icon={Wallet} label="الحساب البنكي" value={identity?.bank_account} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canAttendance && (
          <TabsContent value="attendance">
            <Card>
              <CardHeader><CardTitle className="text-base">سجل الحضور والانصراف</CardTitle></CardHeader>
              <CardContent className="p-0">
                {attendance.length === 0 ? <EmptyState icon={Clock} text="لا يوجد سجل حضور" /> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>الحضور</TableHead><TableHead>الانصراف</TableHead><TableHead>ساعات العمل</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {attendance.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{formatDateAr(a.date)}</TableCell>
                          <TableCell>{a.check_in ? formatTimeAr(a.check_in) : '-'}</TableCell>
                          <TableCell>{a.check_out ? formatTimeAr(a.check_out) : '-'}</TableCell>
                          <TableCell>{a.work_hours}</TableCell>
                          <TableCell><Badge variant={a.status === 'present' ? 'success' : a.status === 'late' ? 'warning' : a.status === 'absent' ? 'destructive' : 'secondary'}>{ATTENDANCE_STATUS_LABELS[a.status as keyof typeof ATTENDANCE_STATUS_LABELS] ?? a.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canLeaves && (
          <TabsContent value="leaves">
            <Card>
              <CardHeader><CardTitle className="text-base">سجل الإجازات</CardTitle></CardHeader>
              <CardContent className="p-0">
                {leaves.length === 0 ? <EmptyState icon={CalendarDays} text="لا توجد إجازات" /> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>النوع</TableHead><TableHead>من</TableHead><TableHead>إلى</TableHead><TableHead>الأيام</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {leaves.map((l) => (
                        <TableRow key={l.id}>
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
        )}

        {canPayroll && (
          <TabsContent value="payroll">
            <Card>
              <CardHeader><CardTitle className="text-base">سجل الرواتب</CardTitle></CardHeader>
              <CardContent className="p-0">
                {payrolls.length === 0 ? <EmptyState icon={Wallet} text="لا توجد سجلات رواتب" /> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>الشهر</TableHead><TableHead>الأساسي</TableHead><TableHead>البدلات</TableHead><TableHead>المكافآت</TableHead><TableHead>الخصومات</TableHead><TableHead>الصافي</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {payrolls.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.month}/{p.year}</TableCell>
                          <TableCell>{formatCurrency(p.basic_salary)}</TableCell>
                          <TableCell>{formatCurrency(p.allowances)}</TableCell>
                          <TableCell>{formatCurrency(p.bonuses)}</TableCell>
                          <TableCell>{formatCurrency(p.deductions)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(p.net_salary)}</TableCell>
                          <TableCell><Badge variant={p.status === 'paid' ? 'success' : p.status === 'approved' ? 'default' : 'secondary'}>{PAYROLL_STATUS_LABELS[p.status as keyof typeof PAYROLL_STATUS_LABELS] ?? p.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canDocs && (
          <TabsContent value="documents">
            <div className="space-y-4">
              {docTypes.map((dt) => {
                const list = docs.filter((d) => d.type === dt.key);
                return (
                  <Card key={dt.key}>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm">{dt.label}</CardTitle>
                      <div>
                        <input type="file" id={`upload-${dt.key}`} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => handleUpload(e, dt.key)} />
                        <Button variant="outline" size="sm" disabled={uploading} onClick={() => document.getElementById(`upload-${dt.key}`)?.click()}>
                          <Upload className="ml-2 h-4 w-4" /> رفع ملف
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {list.length === 0 ? (
                        <p className="text-sm text-muted-foreground">لا توجد ملفات</p>
                      ) : (
                        <div className="space-y-2">
                          {list.map((d) => (
                            <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{d.name}</span>
                                <span className="text-xs text-muted-foreground">{formatDateAr(d.uploaded_at)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openDoc(d.storage_path)}>عرض</Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(d.id, d.storage_path)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        )}

        {canTasks && (
          <TabsContent value="tasks">
            <Card>
              <CardHeader><CardTitle className="text-base">المهام المسندة</CardTitle></CardHeader>
              <CardContent className="p-0">
                {tasks.length === 0 ? <EmptyState icon={Clock} text="لا توجد مهام" /> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>المهمة</TableHead><TableHead>تاريخ الاستحقاق</TableHead><TableHead>النسبة</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {tasks.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.title}</TableCell>
                          <TableCell>{formatDateAr(t.due_date)}</TableCell>
                          <TableCell>{t.progress}%</TableCell>
                          <TableCell><Badge>{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canReviews && (
          <TabsContent value="reviews">
            <Card>
              <CardHeader><CardTitle className="text-base">تقييمات الأداء</CardTitle></CardHeader>
              <CardContent className="p-0">
                {reviews.length === 0 ? <EmptyState icon={Star} text="لا توجد تقييمات" /> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>السنة</TableHead><TableHead>التاريخ</TableHead><TableHead>التقييم</TableHead><TableHead>الأهداف</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {reviews.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.period}</TableCell>
                          <TableCell>{formatDateAr(r.review_date)}</TableCell>
                          <TableCell><Badge variant={r.rating && r.rating >= 4 ? 'success' : r.rating && r.rating >= 3 ? 'warning' : 'destructive'}>{r.rating ?? '-'}/5</Badge></TableCell>
                          <TableCell className="max-w-xs truncate">{r.goals ?? '-'}</TableCell>
                        </TableRow>
                      ))}
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

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof User; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
      <Icon className="h-8 w-8 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}