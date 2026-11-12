 'use client';

import { useEffect, useState } from 'react';
import { Wallet, Plus, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { hasCompanyPermission } from '@/lib/permissions';
import { formatCurrency, AR_MONTHS } from '@/lib/format';
import { PAYROLL_STATUS_LABELS, type Payroll, type Employee, type PayrollStatus } from '@/lib/types';

const PAYROLL_SELECT = '*, employee:employees(id, full_name, employee_code)';

function esc(v: unknown) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function csvCell(v: string) {
  const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${s.replace(/"/g, '""')}"`;
}

function calcNet(f: { basic_salary: number; allowances: number; bonuses: number; overtime_pay: number; deductions: number; loans: number }) {
  return Number(f.basic_salary) + Number(f.allowances) + Number(f.bonuses) + Number(f.overtime_pay) - Number(f.deductions) - Number(f.loans);
}

function emptyForm() {
  return {
    employee_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    basic_salary: 0, allowances: 0, bonuses: 0, deductions: 0, loans: 0, overtime_pay: 0,
  };
}

type EmployeePay = Employee & { basic_salary?: number; allowances?: number };
type SalaryRow = { employee_id: string; basic_salary: number; allowances: number };

// قيم مبدئية لاقتراح أجر الإضافي. يراجعها المحاسب ويعدّلها حسب سياسة المؤسسة والقانون.
const DEFAULT_OT_MULTIPLIER = '1.5';
const DEFAULT_MONTHLY_HOURS = '208';

export default function PayrollPage() {
  const { company, companyRole } = useAuth();
  const { toast } = useToast();
  const role = companyRole ?? undefined;
  const canManage = hasCompanyPermission(role, 'payroll.manage');
  const canExport = hasCompanyPermission(role, 'payroll.export');

  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<EmployeePay[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  // ساعات الإضافي المسجّلة للموظف في الشهر المختار (اقتراح فقط)
  const [otHours, setOtHours] = useState<number | null>(null);
  const [otLoading, setOtLoading] = useState(false);
  const [otError, setOtError] = useState<string | null>(null);
  const [otCfg, setOtCfg] = useState({ multiplier: DEFAULT_OT_MULTIPLIER, monthlyHours: DEFAULT_MONTHLY_HOURS });

  async function loadPayrolls(companyId: string) {
    const { data } = await supabase
      .from('payroll')
      .select(PAYROLL_SELECT)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    setPayrolls((data ?? []) as unknown as Payroll[]);
  }

  useEffect(() => {
    if (!company) { setLoading(false); return; }
    (async () => {
      const [empRes, salRes] = await Promise.all([
        supabase
          .from('employees')
          .select('id, full_name, employee_code')
          .eq('company_id', company.id)
          .order('full_name'),
        supabase
          .from('employee_salary')
          .select('employee_id, basic_salary, allowances')
          .eq('company_id', company.id),
      ]);
      const salMap = new Map<string, SalaryRow>(
        ((salRes.data ?? []) as SalaryRow[]).map((s) => [s.employee_id, s]),
      );
      const merged = ((empRes.data ?? []) as unknown as EmployeePay[]).map((e) => ({
        ...e,
        basic_salary: Number(salMap.get(e.id)?.basic_salary ?? 0),
        allowances: Number(salMap.get(e.id)?.allowances ?? 0),
      }));
      setEmployees(merged);
      await loadPayrolls(company.id);
      setLoading(false);
    })();
  }, [company]);

  // جلب مجموع ساعات الإضافي للموظف في الشهر المختار
  useEffect(() => {
    if (!open || !company || !form.employee_id) {
      setOtHours(null);
      setOtError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setOtLoading(true);
      setOtError(null);
      const mm = String(form.month).padStart(2, '0');
      const start = `${form.year}-${mm}-01`;
      const next = form.month === 12
        ? `${form.year + 1}-01-01`
        : `${form.year}-${String(form.month + 1).padStart(2, '0')}-01`;
      const { data, error } = await supabase
        .from('attendance')
        .select('overtime_hours')
        .eq('company_id', company.id)
        .eq('employee_id', form.employee_id)
        .gte('date', start)
        .lt('date', next);
      if (cancelled) return;
      setOtLoading(false);
      if (error) { setOtHours(null); setOtError(error.message); return; }
      const rows = (data ?? []) as { overtime_hours: number | null }[];
      const total = rows.reduce((s, r) => s + Number(r.overtime_hours || 0), 0);
      setOtHours(Math.round(total * 100) / 100);
    })();
    return () => { cancelled = true; };
  }, [open, company, form.employee_id, form.month, form.year]);

  function applyOvertimePay() {
    const mult = Number(otCfg.multiplier);
    const monthly = Number(otCfg.monthlyHours);
    if (!Number.isFinite(mult) || mult < 0 || !Number.isFinite(monthly) || monthly <= 0) {
      toast({ title: 'راجع المضاعف وساعات الشهر القياسية', variant: 'destructive' });
      return;
    }
    if (otHours == null) {
      toast({ title: 'اختر موظفًا لتحميل ساعات الإضافي', variant: 'destructive' });
      return;
    }
    const hourly = Number(form.basic_salary) / monthly;
    const pay = Math.round(otHours * hourly * mult * 100) / 100;
    setForm({ ...form, overtime_pay: pay });
    toast({
      title: 'تم احتساب أجر الإضافي',
      description: `${otHours} ساعة × ${formatCurrency(hourly)} للساعة × ${mult} = ${formatCurrency(pay)}`,
    });
  }

  async function handleSubmit() {
    if (!company) { toast({ title: 'خطأ', description: 'لا توجد شركة مرتبطة بالحساب', variant: 'destructive' }); return; }
    if (!form.employee_id) { toast({ title: 'اختر موظف', variant: 'destructive' }); return; }
    const nums = [form.basic_salary, form.allowances, form.bonuses, form.deductions, form.loans, form.overtime_pay];
    if (nums.some((n) => Number(n) < 0 || Number.isNaN(Number(n)))) {
      toast({ title: 'القيم لا يمكن أن تكون سالبة', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('payroll').insert({
      company_id: company.id,
      employee_id: form.employee_id,
      month: form.month,
      year: form.year,
      basic_salary: Number(form.basic_salary),
      allowances: Number(form.allowances),
      bonuses: Number(form.bonuses),
      deductions: Number(form.deductions),
      loans: Number(form.loans),
      overtime_pay: Number(form.overtime_pay),
      status: 'draft',
    });
    if (error) {
      const dup = error.code === '23505';
      toast({
        title: 'خطأ',
        description: dup ? 'يوجد كشف راتب لهذا الموظف في نفس الشهر والسنة' : error.message,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'تم إنشاء كشف الرواتب' });
    setOpen(false);
    setForm(emptyForm());
    await loadPayrolls(company.id);
  }

  async function updateStatus(id: string, status: PayrollStatus) {
    if (status === 'paid' && !confirm('تأكيد دفع هذا الراتب؟ لا يمكن التراجع بعد الدفع.')) return;
    const { error } = await supabase.from('payroll').update({ status }).eq('id', id);
    if (error) { toast({ title: 'خطأ', description: error.message, variant: 'destructive' }); return; }
    setPayrolls((p) => p.map((x) => x.id === id ? { ...x, status } : x));
    toast({ title: 'تم التحديث' });
  }

  function exportCsv() {
    const rows: string[][] = [['الموظف', 'الشهر', 'السنة', 'الأساسي', 'البدلات', 'المكافآت', 'الخصومات', 'السلف', 'إضافي', 'الصافي', 'الحالة']];
    payrolls.forEach((p) => rows.push([
      p.employee?.full_name ?? '', String(p.month), String(p.year),
      String(p.basic_salary), String(p.allowances), String(p.bonuses), String(p.deductions), String(p.loans), String(p.overtime_pay), String(p.net_salary),
      PAYROLL_STATUS_LABELS[p.status as keyof typeof PAYROLL_STATUS_LABELS] ?? p.status,
    ]));
    const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'payroll.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function printPayroll(p: Payroll) {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><title>كشف راتب</title><style>body{font-family:Arial;padding:40px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:8px;text-align:right}</style></head><body>
      <h1>كشف راتب - ${esc(p.employee?.full_name)}</h1>
      <p>الشهر: ${esc(AR_MONTHS[p.month - 1])} ${esc(p.year)}</p>
      <table><tr><td>الراتب الأساسي</td><td>${esc(formatCurrency(p.basic_salary))}</td></tr>
      <tr><td>البدلات</td><td>${esc(formatCurrency(p.allowances))}</td></tr>
      <tr><td>المكافآت</td><td>${esc(formatCurrency(p.bonuses))}</td></tr>
      <tr><td>الساعات الإضافية</td><td>${esc(formatCurrency(p.overtime_pay))}</td></tr>
      <tr><td>الخصومات</td><td>- ${esc(formatCurrency(p.deductions))}</td></tr>
      <tr><td>السلف</td><td>- ${esc(formatCurrency(p.loans))}</td></tr>
      <tr><td><b>صافي الراتب</b></td><td><b>${esc(formatCurrency(p.net_salary))}</b></td></tr></table>
      </body></html>`);
    w.document.close(); w.print();
  }

  const totalNet = payrolls.reduce((s, p) => s + Number(p.net_salary || 0), 0);

  function printMasir() {
    if (payrolls.length === 0) { toast({ title: 'لا توجد كشوف للطباعة', variant: 'destructive' }); return; }
    const w = window.open('', '_blank');
    if (!w) return;
    const sum = (k: 'basic_salary' | 'allowances' | 'bonuses' | 'overtime_pay' | 'deductions' | 'loans') =>
      payrolls.reduce((s, p) => s + Number(p[k] || 0), 0);
    const rows = payrolls.map((p, i) => `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${esc(p.employee?.full_name ?? '-')}</td>
      <td style="text-align:center">${esc(p.employee?.employee_code ?? '-')}</td>
      <td style="text-align:left">${esc(formatCurrency(p.basic_salary))}</td>
      <td style="text-align:left">${esc(formatCurrency(p.allowances))}</td>
      <td style="text-align:left">${esc(formatCurrency(p.bonuses))}</td>
      <td style="text-align:left">${esc(formatCurrency(p.overtime_pay))}</td>
      <td style="text-align:left">- ${esc(formatCurrency(p.deductions))}</td>
      <td style="text-align:left">- ${esc(formatCurrency(p.loans))}</td>
      <td style="text-align:left"><b>${esc(formatCurrency(p.net_salary))}</b></td>
    </tr>`).join('');
    w.document.write(`<html dir="rtl"><head><title>مسير الرواتب</title><style>
      body{font-family:Arial;padding:30px}
      h1{text-align:center;margin-bottom:5px}
      .meta{text-align:center;color:#666;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#2b53a8;color:#fff;padding:8px;border:1px solid #999}
      td{border:1px solid #ccc;padding:6px 8px}
      tfoot td{font-weight:bold;background:#f0f0f0}
      @media print{body{padding:10px}}
    </style></head><body>
      <h1>مسير الرواتب</h1>
      <div class="meta">قائمة صرف رواتب الموظفين</div>
      <table>
        <thead><tr>
          <th style="text-align:center;width:30px">م</th>
          <th>اسم الموظف</th>
          <th style="text-align:center">الرقم الوظيفي</th>
          <th>الأساسي</th>
          <th>البدلات</th>
          <th>المكافآت</th>
          <th>إضافي</th>
          <th>الخصومات</th>
          <th>السلف</th>
          <th>الصافي</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td colspan="3" style="text-align:center">الإجمالي</td>
          <td>${esc(formatCurrency(sum('basic_salary')))}</td>
          <td>${esc(formatCurrency(sum('allowances')))}</td>
          <td>${esc(formatCurrency(sum('bonuses')))}</td>
          <td>${esc(formatCurrency(sum('overtime_pay')))}</td>
          <td>${esc(formatCurrency(sum('deductions')))}</td>
          <td>${esc(formatCurrency(sum('loans')))}</td>
          <td>${esc(formatCurrency(totalNet))}</td>
        </tr></tfoot>
      </table>
    </body></html>`);
    w.document.close(); w.print();
  }

  const previewNet = calcNet(form);

  return (
    <div className="space-y-6">
      <PageHeader
        title="الرواتب"
        description={`إجمالي صافي الرواتب: ${formatCurrency(totalNet)}`}
        actions={
          <>
            {canExport && <Button variant="outline" onClick={printMasir}><Printer className="ml-2 h-4 w-4" /> طباعة المسير</Button>}
            {canExport && <Button variant="outline" onClick={exportCsv}><Download className="ml-2 h-4 w-4" /> تصدير Excel</Button>}
            {canManage && <Button onClick={() => setOpen(true)}><Plus className="ml-2 h-4 w-4" /> كشف راتب جديد</Button>}
          </>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>إنشاء كشف راتب</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>الموظف</Label>
              <Select value={form.employee_id} onValueChange={(v) => {
                const emp = employees.find((e) => e.id === v);
                setForm({ ...form, employee_id: v, basic_salary: Number(emp?.basic_salary ?? 0), allowances: Number(emp?.allowances ?? 0) });
              }}>
                <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>الشهر</Label><Select value={String(form.month)} onValueChange={(v) => setForm({ ...form, month: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AR_MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>السنة</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>الراتب الأساسي</Label><Input type="number" min={0} value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>البدلات</Label><Input type="number" min={0} value={form.allowances} onChange={(e) => setForm({ ...form, allowances: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>المكافآت</Label><Input type="number" min={0} value={form.bonuses} onChange={(e) => setForm({ ...form, bonuses: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>الخصومات</Label><Input type="number" min={0} value={form.deductions} onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>السلف</Label><Input type="number" min={0} value={form.loans} onChange={(e) => setForm({ ...form, loans: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>أجر إضافي</Label><Input type="number" min={0} value={form.overtime_pay} onChange={(e) => setForm({ ...form, overtime_pay: Number(e.target.value) })} /></div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-sm sm:col-span-2">
              <p className="font-medium">اقتراح أجر الإضافي من سجل الحضور</p>
              {!form.employee_id ? (
                <p className="text-muted-foreground">اختر الموظف أولًا لعرض ساعات الإضافي المسجّلة في الشهر.</p>
              ) : otLoading ? (
                <p className="text-muted-foreground">جاري قراءة ساعات الإضافي...</p>
              ) : otError ? (
                <p className="text-destructive">تعذر قراءة سجل الحضور: {otError}</p>
              ) : (
                <p>ساعات الإضافي المسجّلة في الشهر المختار: <span className="font-bold">{otHours ?? 0} ساعة</span></p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">مضاعف الإضافي</Label>
                  <Input type="number" min={0} step="0.25" value={otCfg.multiplier} onChange={(e) => setOtCfg({ ...otCfg, multiplier: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">ساعات الشهر القياسية</Label>
                  <Input type="number" min={1} value={otCfg.monthlyHours} onChange={(e) => setOtCfg({ ...otCfg, monthlyHours: e.target.value })} />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={applyOvertimePay} disabled={!form.employee_id || otLoading || otHours == null}>
                احسب أجر الإضافي
              </Button>
              <p className="text-xs text-muted-foreground">
                أجر الإضافي = الساعات × (الراتب الأساسي ÷ ساعات الشهر القياسية) × المضاعف. القيمتان المبدئيتان (1.5 و208) للبداية فقط، راجعهما مع المحاسب حسب سياسة المؤسسة والقانون. الناتج اقتراح تقدر تعدّله في خانة "أجر إضافي" قبل الحفظ.
              </p>
            </div>

            <div className="sm:col-span-2 rounded-lg bg-muted/50 p-3 text-sm">
              صافي الراتب المتوقع: <span className="font-bold">{formatCurrency(previewNet)}</span>
            </div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>إنشاء</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div> : payrolls.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><Wallet className="h-8 w-8 opacity-40" /><p className="text-sm">لا توجد كشوف رواتب</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>الشهر</TableHead><TableHead>الأساسي</TableHead><TableHead>البدلات</TableHead><TableHead>المكافآت</TableHead><TableHead>الخصومات</TableHead><TableHead>الصافي</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payrolls.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.employee?.full_name ?? '-'}</TableCell>
                      <TableCell>{AR_MONTHS[p.month - 1]} {p.year}</TableCell>
                      <TableCell>{formatCurrency(p.basic_salary)}</TableCell>
                      <TableCell>{formatCurrency(p.allowances)}</TableCell>
                      <TableCell>{formatCurrency(p.bonuses)}</TableCell>
                      <TableCell>{formatCurrency(p.deductions)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(p.net_salary)}</TableCell>
                      <TableCell><Badge variant={p.status === 'paid' ? 'success' : p.status === 'approved' ? 'default' : 'secondary'}>{PAYROLL_STATUS_LABELS[p.status as keyof typeof PAYROLL_STATUS_LABELS] ?? p.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canExport && <Button size="sm" variant="ghost" onClick={() => printPayroll(p)}><FileSpreadsheet className="h-4 w-4" /></Button>}
                          {canManage && p.status === 'draft' && <Button size="sm" variant="ghost" onClick={() => updateStatus(p.id, 'approved')}>اعتماد</Button>}
                          {canManage && p.status === 'approved' && <Button size="sm" variant="ghost" onClick={() => updateStatus(p.id, 'paid')}>دفع</Button>}
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