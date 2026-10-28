 'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, LogIn, LogOut, Calendar, User, Filter, Upload, FileSpreadsheet, RefreshCw, Plus, Trash2, Check, UserX } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { formatDateAr, formatTimeAr, AR_MONTHS } from '@/lib/format';
import { ATTENDANCE_STATUS_LABELS, type Attendance, type Employee, type WorkSchedule } from '@/lib/types';

const ATT_SELECT = '*, employee:employees(id, full_name, employee_code)';
const EMP_SELECT = 'id, full_name, employee_code, user_id, department:departments!employees_department_id_fkey(id, name, name_ar)';
const ALL_DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const DEFAULT_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const LATE_AFTER_MINUTES = 8 * 60 + 30; // التأخير بعد 8:30 صباحًا بتوقيت القاهرة
const TZ = 'Africa/Cairo';

// تاريخ القاهرة بصيغة YYYY-MM-DD بصرف النظر عن توقيت الجهاز
function localDateStr(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
}

// دقائق التأخير بتوقيت القاهرة
function lateMinutesOf(d: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return Math.max(0, h * 60 + m - LATE_AFTER_MINUTES);
}

function hoursBetween(a: Date, b: Date) {
  return Math.round(((b.getTime() - a.getTime()) / 3600000) * 100) / 100;
}

function splitCsvLine(line: string) {
  return line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
}

function normTime(t: string) {
  const [h, m, s] = t.split(':');
  return `${h.padStart(2, '0')}:${m}:${s ?? '00'}`;
}

function rpcErrorMessage(msg: string) {
  if (msg.includes('already_checked_in')) return 'سبق تسجيل حالة اليوم';
  if (msg.includes('no_open_checkin')) return 'لا يوجد حضور مفتوح لتسجيل الانصراف';
  if (msg.includes('no_employee_record')) return 'حسابك غير مربوط بسجل موظف';
  return msg;
}

export default function AttendancePage() {
  const { user, company, companyRole } = useAuth();
  const { toast } = useToast();
  const canManage = hasCompanyPermission(companyRole ?? undefined, 'attendance.manage');

  const [records, setRecords] = useState<Attendance[]>([]);
  const [todayRows, setTodayRows] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmp, setMyEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selEmp, setSelEmp] = useState('all');
  const [activeTab, setActiveTab] = useState<'attendance' | 'schedules' | 'management'>('attendance');

  const [importOpen, setImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    name: '', start_time: '08:00', end_time: '16:00', break_minutes: '60', work_days: DEFAULT_DAYS,
  });

  const loadSchedules = useCallback(async () => {
    if (!company) { setSchedules([]); return; }
    const { data } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: true });
    setSchedules((data ?? []) as WorkSchedule[]);
  }, [company]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  useEffect(() => {
    if (!company) return;
    (async () => {
      const { data } = await supabase
        .from('employees')
        .select(EMP_SELECT)
        .eq('company_id', company.id)
        .order('full_name');
      const list = (data ?? []) as unknown as Employee[];
      setEmployees(list);
      setMyEmp(user ? list.find((e) => e.user_id === user.id) ?? null : null);
    })();
  }, [user, company]);

  const loadRecords = useCallback(async () => {
    if (!company) { setRecords([]); setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    const mm = String(month).padStart(2, '0');
    const start = `${year}-${mm}-01`;
    const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    let q = supabase
      .from('attendance')
      .select(ATT_SELECT)
      .eq('company_id', company.id)
      .gte('date', start)
      .lt('date', next)
      .order('date', { ascending: false });
    if (selEmp !== 'all') q = q.eq('employee_id', selEmp);
    const { data, error } = await q;
    if (error) setLoadError(error.message);
    setRecords((data ?? []) as unknown as Attendance[]);
    setLoading(false);
  }, [year, month, selEmp, company]);

  const loadToday = useCallback(async () => {
    if (!company) { setTodayRows([]); return; }
    const { data } = await supabase
      .from('attendance')
      .select(ATT_SELECT)
      .eq('company_id', company.id)
      .eq('date', localDateStr());
    setTodayRows((data ?? []) as unknown as Attendance[]);
  }, [company]);

  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => { loadToday(); }, [loadToday]);

  async function refresh() {
    await Promise.all([loadRecords(), loadToday()]);
  }

  // ---------- تسجيل الموظف لنفسه (بوقت السيرفر) ----------
  async function checkIn() {
    if (!myEmp || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc('employee_check_in');
    setBusy(false);
    if (error) { toast({ title: 'تعذر تسجيل الحضور', description: rpcErrorMessage(error.message), variant: 'destructive' }); return; }
    toast({ title: 'تم تسجيل الحضور بنجاح' });
    await refresh();
  }

  async function checkOut() {
    if (!myEmp || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc('employee_check_out');
    setBusy(false);
    if (error) { toast({ title: 'تعذر تسجيل الانصراف', description: rpcErrorMessage(error.message), variant: 'destructive' }); return; }
    toast({ title: 'تم تسجيل الانصراف بنجاح' });
    await refresh();
  }

  // ---------- إجراءات الإدارة على الموظفين ----------
  async function quickCheckIn(emp: Employee) {
    if (!company) return;
    const now = new Date();
    const late = lateMinutesOf(now);
    const { error } = await supabase.from('attendance').upsert({
      company_id: company.id,
      employee_id: emp.id,
      date: localDateStr(now),
      check_in: now.toISOString(),
      check_out: null,
      work_hours: 0,
      late_minutes: late,
      status: late > 0 ? 'late' : 'present',
    }, { onConflict: 'employee_id,date' });
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم تسجيل الحضور', description: emp.full_name });
    await refresh();
  }

  async function quickMarkAbsent(emp: Employee) {
    if (!company) return;
    const { error } = await supabase.from('attendance').upsert({
      company_id: company.id,
      employee_id: emp.id,
      date: localDateStr(),
      check_in: null,
      check_out: null,
      work_hours: 0,
      late_minutes: 0,
      status: 'absent',
    }, { onConflict: 'employee_id,date' });
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم تسجيل الغياب', description: emp.full_name });
    await refresh();
  }

  async function quickCheckOut(emp: Employee) {
    const rec = todayRows.find((r) => r.employee_id === emp.id);
    if (!rec?.check_in) { toast({ title: 'لم يسجل الموظف الحضور بعد', variant: 'destructive' }); return; }
    if (rec.check_out) { toast({ title: 'سبق تسجيل الانصراف', variant: 'destructive' }); return; }
    const now = new Date();
    const { error } = await supabase
      .from('attendance')
      .update({ check_out: now.toISOString(), work_hours: hoursBetween(new Date(rec.check_in), now) })
      .eq('id', rec.id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم تسجيل الانصراف', description: emp.full_name });
    await refresh();
  }

  // ---------- استيراد CSV حقيقي ----------
  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' || file.size > 2 * 1024 * 1024) {
      toast({ title: 'ملف غير صالح', description: 'اختر ملف CSV بحجم لا يتجاوز 2 ميجابايت.', variant: 'destructive' });
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
  }

  async function importCsv() {
    if (!company || !selectedFile || importing) return;
    setImporting(true);
    try {
      const text = (await selectedFile.text()).replace(/^\uFEFF/, '');
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) throw new Error('الملف فارغ');
      if (lines.length > 2001) throw new Error('الحد الأقصى 2000 سطر');

      const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
      const iCode = header.indexOf('employee_code');
      const iDate = header.indexOf('date');
      const iIn = header.indexOf('check_in');
      const iOut = header.indexOf('check_out');
      if (iCode < 0 || iDate < 0 || iIn < 0) {
        throw new Error('الأعمدة المطلوبة: employee_code,date,check_in,check_out');
      }

      const byCode = new Map(employees.map((e) => [e.employee_code, e.id]));
      const timeRe = /^\d{1,2}:\d{2}(:\d{2})?$/;
      const rows = new Map<string, Record<string, unknown>>();
      let skipped = 0;

      for (const line of lines.slice(1)) {
        const c = splitCsvLine(line);
        const empId = byCode.get(c[iCode]);
        const date = c[iDate];
        const inT = c[iIn];
        const outT = iOut >= 0 ? c[iOut] : '';
        if (!empId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !timeRe.test(inT) || (outT && !timeRe.test(outT))) {
          skipped++; continue;
        }
        // الأوقات في الملف تُعتبر بتوقيت القاهرة
        const checkIn = new Date(`${date}T${normTime(inT)}+03:00`);
        const checkOut = outT ? new Date(`${date}T${normTime(outT)}+03:00`) : null;
        if (Number.isNaN(checkIn.getTime()) || (checkOut && (Number.isNaN(checkOut.getTime()) || checkOut < checkIn))) {
          skipped++; continue;
        }
        const late = lateMinutesOf(checkIn);
        rows.set(`${empId}|${date}`, {
          company_id: company.id,
          employee_id: empId,
          date,
          check_in: checkIn.toISOString(),
          check_out: checkOut ? checkOut.toISOString() : null,
          work_hours: checkOut ? hoursBetween(checkIn, checkOut) : 0,
          late_minutes: late,
          status: late > 0 ? 'late' : 'present',
        });
      }

      if (rows.size === 0) throw new Error('لا توجد صفوف صالحة في الملف');
      const { error } = await supabase.from('attendance').upsert(Array.from(rows.values()), { onConflict: 'employee_id,date' });
      if (error) throw new Error(error.message);

      toast({ title: 'تم استيراد الحضور', description: `${rows.size} سجل${skipped ? ` — تم تخطي ${skipped} صف غير صالح` : ''}` });
      setSelectedFile(null);
      setImportOpen(false);
      await refresh();
    } catch (e) {
      toast({ title: 'تعذر الاستيراد', description: e instanceof Error ? e.message : 'خطأ غير متوقع', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  }

  // ---------- مواعيد العمل ----------
  function toggleDay(day: string) {
    setScheduleForm((f) => ({
      ...f,
      work_days: f.work_days.includes(day) ? f.work_days.filter((d) => d !== day) : [...f.work_days, day],
    }));
  }

  async function addWorkSchedule() {
    if (!company || savingSchedule) return;
    if (!scheduleForm.name.trim()) { toast({ title: 'أدخل اسم الموعد', variant: 'destructive' }); return; }
    if (scheduleForm.work_days.length === 0) { toast({ title: 'اختر يوم عمل واحدًا على الأقل', variant: 'destructive' }); return; }
    setSavingSchedule(true);
    const { error } = await supabase.from('work_schedules').insert({
      company_id: company.id,
      name: scheduleForm.name.trim(),
      start_time: scheduleForm.start_time,
      end_time: scheduleForm.end_time,
      break_minutes: Math.max(0, Number(scheduleForm.break_minutes) || 0),
      work_days: scheduleForm.work_days,
    });
    setSavingSchedule(false);
    if (error) { toast({ title: 'تعذر حفظ موعد العمل', description: error.message, variant: 'destructive' }); return; }
    setScheduleForm({ name: '', start_time: '08:00', end_time: '16:00', break_minutes: '60', work_days: DEFAULT_DAYS });
    setScheduleOpen(false);
    toast({ title: 'تمت إضافة موعد العمل' });
    await loadSchedules();
  }

  async function deleteWorkSchedule(schedule: WorkSchedule) {
    if (!company) return;
    if (!confirm(`حذف موعد العمل "${schedule.name}"؟`)) return;
    const { error } = await supabase.from('work_schedules').delete().eq('id', schedule.id).eq('company_id', company.id);
    if (error) { toast({ title: 'تعذر حذف موعد العمل', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'تم حذف موعد العمل' });
    await loadSchedules();
  }

  // ---------- مشتقات العرض ----------
  const present = todayRows.filter((r) => r.status === 'present').length;
  const late = todayRows.filter((r) => r.status === 'late').length;
  const absent = todayRows.filter((r) => r.status === 'absent').length;
  const totalOT = records.reduce((s, r) => s + Number(r.overtime_hours || 0), 0);
  const todayMap = new Map<string, Attendance>();
  todayRows.forEach((r) => todayMap.set(r.employee_id, r));

  const myTodayRec = myEmp ? todayMap.get(myEmp.id) : undefined;
  const hasCheckedIn = !!myTodayRec;
  const hasCheckedOut = !!myTodayRec?.check_out;

  const tabs: { key: 'attendance' | 'schedules' | 'management'; label: string }[] = [
    { key: 'attendance', label: 'سجل الحضور والغياب' },
    { key: 'schedules', label: 'مواعيد العمل' },
    ...(canManage ? [{ key: 'management' as const, label: 'إدارة الموظفين' }] : []),
  ];

  if (!company && !loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="الحضور والانصراف" description="تسجيل ومتابعة حضور الموظفين" />
        <Card><CardContent className="p-6 text-sm text-muted-foreground">لا توجد شركة مرتبطة بالحساب.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الحضور والانصراف"
        description="تسجيل ومتابعة حضور الموظفين"
        actions={
          canManage ? (
            <Button onClick={() => setImportOpen(true)} className="gap-2 bg-teal-600 text-white hover:bg-teal-700">
              <Upload className="h-4 w-4" /> استيراد حضور من ملف CSV
            </Button>
          ) : null
        }
      />

      <div role="tablist" aria-label="أقسام الحضور والانصراف" className="flex w-full max-w-2xl gap-2 rounded-xl border border-border/60 bg-muted/40 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'attendance' && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="border-success/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success"><User className="h-5 w-5" /></div>
                <div><p className="text-sm text-muted-foreground">حاضر اليوم</p><p className="text-2xl font-bold text-success">{present}</p></div>
              </CardContent>
            </Card>
            <Card className="border-warning/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10 text-warning"><Clock className="h-5 w-5" /></div>
                <div><p className="text-sm text-muted-foreground">متأخر اليوم</p><p className="text-2xl font-bold text-warning">{late}</p></div>
              </CardContent>
            </Card>
            <Card className="border-destructive/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><User className="h-5 w-5" /></div>
                <div><p className="text-sm text-muted-foreground">غائب اليوم</p><p className="text-2xl font-bold text-destructive">{absent}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
                <div><p className="text-sm text-muted-foreground">ساعات إضافية (الشهر)</p><p className="text-2xl font-bold text-primary">{totalOT}</p></div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <Button onClick={checkIn} disabled={busy || !myEmp || hasCheckedIn} className="gap-2">
                <LogIn className="h-4 w-4" /> تسجيل الحضور
              </Button>
              <Button variant="outline" onClick={checkOut} disabled={busy || !myEmp || !myTodayRec?.check_in || hasCheckedOut} className="gap-2">
                <LogOut className="h-4 w-4" /> تسجيل الانصراف
              </Button>
              {myTodayRec?.check_in && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>تم الحضور: {formatTimeAr(myTodayRec.check_in)}</span>
                  {myTodayRec.check_out && <span> — الانصراف: {formatTimeAr(myTodayRec.check_out)}</span>}
                </div>
              )}
              {!myEmp && (
                <p className="text-sm text-muted-foreground">حسابك غير مربوط بسجل موظف، لذلك لا يمكنك تسجيل حضورك من هنا.</p>
              )}
            </CardContent>
          </Card>

          {loadError && (
            <Card><CardContent className="p-4 text-sm text-destructive">تعذر تحميل السجلات: {loadError}</CardContent></Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">سجل الحضور</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{AR_MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2027, 2026, 2025, 2024].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selEmp} onValueChange={setSelEmp}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="كل الموظفين" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الموظفين</SelectItem>
                      {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Calendar className="h-8 w-8 opacity-40" />
                  <p className="text-sm">لا توجد سجلات</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الموظف</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الحضور</TableHead>
                        <TableHead>الانصراف</TableHead>
                        <TableHead>ساعات العمل</TableHead>
                        <TableHead>إضافي</TableHead>
                        <TableHead>التأخير</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((r) => (
                        <TableRow key={r.id} className="transition-colors hover:bg-muted/40">
                          <TableCell className="font-medium">{r.employee?.full_name ?? '-'}</TableCell>
                          <TableCell>{formatDateAr(r.date)}</TableCell>
                          <TableCell>{r.check_in ? formatTimeAr(r.check_in) : '-'}</TableCell>
                          <TableCell>{r.check_out ? formatTimeAr(r.check_out) : '-'}</TableCell>
                          <TableCell>{Number(r.work_hours) > 0 ? `${r.work_hours} س` : '-'}</TableCell>
                          <TableCell>{Number(r.overtime_hours) > 0 ? `${r.overtime_hours} س` : '-'}</TableCell>
                          <TableCell>{Number(r.late_minutes) > 0 ? `${r.late_minutes} د` : '-'}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === 'present' ? 'success' : r.status === 'late' ? 'warning' : r.status === 'absent' ? 'destructive' : 'secondary'}>
                              {ATTENDANCE_STATUS_LABELS[r.status as keyof typeof ATTENDANCE_STATUS_LABELS] ?? r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'schedules' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">مواعيد العمل</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">ساعات الدوام وأيام العمل المعتمدة (للاطلاع، ولا تغيّر قاعدة احتساب التأخير).</p>
              </div>
              {canManage && (
                <Button onClick={() => setScheduleOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> إضافة موعد عمل جديد</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedules.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">لا توجد مواعيد عمل مضافة</div>
            ) : schedules.map((schedule) => (
              <div key={schedule.id} className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{schedule.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{String(schedule.start_time).slice(0, 5)} – {String(schedule.end_time).slice(0, 5)} · استراحة {schedule.break_minutes} دقيقة</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{schedule.work_days.map((day) => <Badge key={day} variant="secondary">{day}</Badge>)}</div>
                </div>
                {canManage && (
                  <Button variant="ghost" size="icon" onClick={() => deleteWorkSchedule(schedule)} aria-label={`حذف ${schedule.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'management' && canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">إدارة الموظفين والإجراءات المباشرة</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">رصد حالة كل موظف اليوم وتغييرها يدويًا بضغطة زر.</p>
          </CardHeader>
          <CardContent className="p-0">
            {employees.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">لا يوجد موظفون</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الموظف</TableHead>
                      <TableHead>اسم الموظف</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>وقت الحضور الفعلي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات المباشرة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => {
                      const rec = todayMap.get(emp.id);
                      const status = rec?.status;
                      return (
                        <TableRow key={emp.id} className="transition-colors hover:bg-muted/40">
                          <TableCell className="font-mono text-sm">{emp.employee_code}</TableCell>
                          <TableCell className="font-medium">{emp.full_name}</TableCell>
                          <TableCell>{emp.department?.name_ar ?? emp.department?.name ?? '-'}</TableCell>
                          <TableCell className="font-mono text-sm">{rec?.check_in ? formatTimeAr(rec.check_in) : '-'}</TableCell>
                          <TableCell>
                            {status ? (
                              <Badge variant={status === 'present' ? 'success' : status === 'late' ? 'warning' : status === 'absent' ? 'destructive' : 'secondary'}>
                                {ATTENDANCE_STATUS_LABELS[status as keyof typeof ATTENDANCE_STATUS_LABELS] ?? status}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">لم يسجل</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Button size="sm" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700" disabled={!!rec?.check_in} onClick={() => quickCheckIn(emp)}>
                                <Check className="h-3.5 w-3.5" /> حضور
                              </Button>
                              <Button size="sm" className="gap-1 bg-red-600 text-white hover:bg-red-700" disabled={status === 'absent'} onClick={() => quickMarkAbsent(emp)}>
                                <UserX className="h-3.5 w-3.5" /> غياب
                              </Button>
                              <Button size="sm" className="gap-1 bg-blue-600 text-white hover:bg-blue-700" disabled={!rec?.check_in || !!rec?.check_out} onClick={() => quickCheckOut(emp)}>
                                <LogOut className="h-3.5 w-3.5" /> انصراف
                              </Button>
                            </div>
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
      )}

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>إضافة موعد عمل جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="اسم الموعد، مثال: الدوام الرسمي" value={scheduleForm.name} onChange={(e) => setScheduleForm((f) => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block text-sm text-muted-foreground">وقت الحضور</label><Input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm((f) => ({ ...f, start_time: e.target.value }))} /></div>
              <div><label className="mb-1 block text-sm text-muted-foreground">وقت الانصراف</label><Input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm((f) => ({ ...f, end_time: e.target.value }))} /></div>
            </div>
            <div><label className="mb-1 block text-sm text-muted-foreground">مدة الاستراحة بالدقائق</label><Input type="number" min="0" max="480" value={scheduleForm.break_minutes} onChange={(e) => setScheduleForm((f) => ({ ...f, break_minutes: e.target.value }))} /></div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">أيام العمل</label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => (
                  <Button key={day} type="button" size="sm" variant={scheduleForm.work_days.includes(day) ? 'default' : 'outline'} onClick={() => toggleDay(day)}>{day}</Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>إلغاء</Button>
            <Button onClick={addWorkSchedule} disabled={savingSchedule}>{savingSchedule ? 'جاري الحفظ...' : 'حفظ الموعد'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={(o) => { setImportOpen(o); if (!o) setSelectedFile(null); }}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>استيراد حضور من ملف CSV</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 px-6 py-8 text-center transition-colors hover:border-teal-500 hover:bg-teal-50/50">
              <FileSpreadsheet className="h-9 w-9 text-teal-600" />
              <span className="font-medium">اختر ملف الحركات</span>
              <span className="text-xs text-muted-foreground">CSV فقط — حتى 2 ميجابايت و2000 سطر</span>
              <Input type="file" accept=".csv,text/csv" onChange={handleFileSelection} className="sr-only" />
            </label>
            {selectedFile && (
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="truncate">{selectedFile.name}</span>
                <span className="text-muted-foreground">جاهز للاستيراد</span>
              </div>
            )}
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-6 text-muted-foreground" dir="ltr">
              employee_code,date,check_in,check_out<br />
              EMP-002,2026-10-20,08:10,16:05
            </div>
            <p className="text-xs text-muted-foreground">الرقم الوظيفي لازم يطابق موظفًا موجودًا، والتاريخ بصيغة YYYY-MM-DD، والوقت HH:MM بتوقيت القاهرة. الصفوف غير الصالحة تُتخطى.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>إلغاء</Button>
            <Button onClick={importCsv} disabled={importing || !selectedFile} className="gap-2 bg-teal-600 text-white hover:bg-teal-700">
              {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importing ? 'جاري الاستيراد...' : 'استيراد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}