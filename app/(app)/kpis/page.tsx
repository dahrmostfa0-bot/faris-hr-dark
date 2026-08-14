'use client';

import { useEffect, useState } from 'react';
import { Target, Plus, Trash2, TrendingUp, Award } from 'lucide-react';
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/permissions';
import type { Kpi, Employee } from '@/lib/types';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';

export default function KpisPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const canManage = hasPermission(role ?? undefined, 'kpis.manage');

  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selEmp, setSelEmp] = useState<string>('all');
  const [form, setForm] = useState({ employee_id: '', title: '', description: '', target: 100, actual: 0, weight: 3, period: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}` });

  useEffect(() => {
    (async () => {
      const [kRes, eRes] = await Promise.all([
        supabase.from('kpis').select('*, employee:employees(*)').order('created_at', { ascending: false }),
        supabase.from('employees').select('id, full_name').order('full_name'),
      ]);
      setKpis((kRes.data ?? []) as Kpi[]);
      setEmployees((eRes.data ?? []) as Employee[]);
      setLoading(false);
    })();
  }, []);

  async function handleSubmit() {
    if (!form.employee_id || !form.title) { toast({ title: 'أكمل البيانات', variant: 'destructive' }); return; }
    const score = Number(form.target) > 0 ? Math.min(100, Math.round((Number(form.actual) / Number(form.target)) * 100)) : 0;
    const { error } = await supabase.from('kpis').insert({
      employee_id: form.employee_id, title: form.title, description: form.description,
      target: Number(form.target), actual: Number(form.actual), weight: Number(form.weight),
      period: form.period, score,
    });
    if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'تم إضافة المؤشر' });
      setOpen(false);
      const { data } = await supabase.from('kpis').select('*, employee:employees(*)').order('created_at', { ascending: false });
      setKpis((data ?? []) as Kpi[]);
    }
  }

  async function updateActual(id: string, actual: number) {
    const kpi = kpis.find((k) => k.id === id);
    if (!kpi) return;
    const score = kpi.target > 0 ? Math.min(100, Math.round((actual / kpi.target) * 100)) : 0;
    await supabase.from('kpis').update({ actual, score }).eq('id', id);
    setKpis((k) => k.map((x) => x.id === id ? { ...x, actual, score } : x));
  }

  async function remove(id: string) {
    if (!confirm('حذف هذا المؤشر؟')) return;
    await supabase.from('kpis').delete().eq('id', id);
    setKpis((k) => k.filter((x) => x.id !== id));
    toast({ title: 'تم الحذف' });
  }

  const filtered = selEmp === 'all' ? kpis : kpis.filter((k) => k.employee_id === selEmp);

  // radar chart data for selected employee
  const radarData = (selEmp === 'all' ? [] : kpis.filter((k) => k.employee_id === selEmp)).map((k) => ({
    subject: k.title.length > 12 ? k.title.slice(0, 12) + '…' : k.title,
    score: k.score,
    full: k.title,
  }));

  // overall avg score
  const avgScore = kpis.length > 0 ? Math.round(kpis.reduce((s, k) => s + k.score, 0) / kpis.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="تقييم الأداء و KPIs"
        description={`${kpis.length} مؤشر — متوسط الأداء ${avgScore}%`}
        actions={canManage && <Button onClick={() => setOpen(true)}><Plus className="ml-2 h-4 w-4" /> إضافة مؤشر</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة مؤشر أداء</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>الموظف</Label><Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>عنوان المؤشر *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: معدل إنجاز المهام" /></div>
            <div className="space-y-2"><Label>الوصف</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label>الهدف</Label><Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>الفعلي</Label><Input type="number" value={form.actual} onChange={(e) => setForm({ ...form, actual: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>الوزن (1-5)</Label><Input type="number" min={1} max={5} value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-2"><Label>الفترة</Label><Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="2025-Q3" /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Target className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">إجمالي المؤشرات</p><p className="text-xl font-bold">{kpis.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success"><TrendingUp className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">متوسط الأداء</p><p className="text-xl font-bold">{avgScore}%</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning"><Award className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">أداء ممتاز (90%+)</p><p className="text-xl font-bold">{kpis.filter((k) => k.score >= 90).length}</p></div></CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selEmp} onValueChange={setSelEmp}>
          <SelectTrigger className="w-64"><SelectValue placeholder="كل الموظفين" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الموظفين</SelectItem>
            {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">مؤشرات الأداء</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div> : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><Target className="h-8 w-8 opacity-40" /><p className="text-sm">لا توجد مؤشرات</p></div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>المؤشر</TableHead><TableHead>الهدف</TableHead><TableHead>الفعلي</TableHead><TableHead>الوزن</TableHead><TableHead>النسبة</TableHead>{canManage && <TableHead>إجراءات</TableHead>}</TableRow></TableHeader>
                <TableBody>
                  {filtered.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.employee?.full_name ?? '-'}</TableCell>
                      <TableCell>{k.title}</TableCell>
                      <TableCell>{k.target}</TableCell>
                      <TableCell>
                        {canManage ? <Input type="number" value={k.actual} onChange={(e) => updateActual(k.id, Number(e.target.value))} className="h-8 w-20" /> : k.actual}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{k.weight}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary"><div className={`h-full ${k.score >= 75 ? 'bg-success' : k.score >= 50 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${k.score}%` }} /></div>
                          <span className="text-sm font-medium tabular-nums">{k.score}%</span>
                        </div>
                      </TableCell>
                      {canManage && <TableCell><Button size="icon" variant="ghost" onClick={() => remove(k.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {radarData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">خريطة الأداء</CardTitle><CardDescription>{employees.find((e) => e.id === selEmp)?.full_name}</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="النسبة" dataKey="score" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
