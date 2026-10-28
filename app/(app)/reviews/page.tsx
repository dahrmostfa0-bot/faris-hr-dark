 'use client';

import { useEffect, useState } from 'react';
import { Plus, Star } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import type { PerformanceReview, Employee } from '@/lib/types';

const REVIEW_SELECT = '*, employee:employees!employee_id(id, full_name)';

function emptyForm() {
  return {
    employee_id: '',
    period: String(new Date().getFullYear()),
    review_date: new Date().toISOString().slice(0, 10),
    rating: 3,
    goals: '',
    strengths: '',
    weaknesses: '',
    recommendations: '',
  };
}

export default function ReviewsPage() {
  const { user, company, companyRole } = useAuth();
  const { toast } = useToast();
  const canManage = hasCompanyPermission(companyRole ?? undefined, 'reviews.manage');

  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());

  async function loadReviews(companyId: string) {
    const { data } = await supabase
      .from('performance_reviews')
      .select(REVIEW_SELECT)
      .eq('company_id', companyId)
      .order('review_date', { ascending: false });
    setReviews((data ?? []) as unknown as PerformanceReview[]);
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
      await loadReviews(company.id);
      setLoading(false);
    })();
  }, [company, user]);

  async function handleSubmit() {
    if (!company) { toast({ title: 'خطأ', description: 'لا توجد شركة مرتبطة بالحساب', variant: 'destructive' }); return; }
    if (!form.employee_id) { toast({ title: 'اختر موظف', variant: 'destructive' }); return; }
    const { error } = await supabase.from('performance_reviews').insert({
      company_id: company.id,
      employee_id: form.employee_id,
      reviewer_id: myEmployeeId,
      period: form.period,
      review_date: form.review_date,
      rating: Number(form.rating),
      goals: form.goals,
      strengths: form.strengths,
      weaknesses: form.weaknesses,
      recommendations: form.recommendations,
    });
    if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'تم حفظ التقييم' });
      setOpen(false);
      setForm(emptyForm());
      await loadReviews(company.id);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="التقييم السنوي"
        description={`${reviews.length} تقييم`}
        actions={canManage && <Button onClick={() => setOpen(true)}><Plus className="ml-2 h-4 w-4" /> تقييم جديد</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>تقييم أداء جديد</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>الموظف</Label><Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>السنة</Label><Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} /></div>
            <div className="space-y-2"><Label>التقييم (1-5)</Label><Select value={String(form.rating)} onValueChange={(v) => setForm({ ...form, rating: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} نجوم</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 sm:col-span-2"><Label>الأهداف</Label><Textarea rows={2} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} /></div>
            <div className="space-y-2"><Label>نقاط القوة</Label><Textarea rows={2} value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></div>
            <div className="space-y-2"><Label>نقاط الضعف</Label><Textarea rows={2} value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>التوصيات</Label><Textarea rows={2} value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>حفظ التقييم</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div> : reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><Star className="h-8 w-8 opacity-40" /><p className="text-sm">لا توجد تقييمات</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>السنة</TableHead><TableHead>التاريخ</TableHead><TableHead>التقييم</TableHead><TableHead>الأهداف</TableHead></TableRow></TableHeader>
                <TableBody>
                  {reviews.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.employee?.full_name ?? '-'}</TableCell>
                      <TableCell>{r.period}</TableCell>
                      <TableCell>{formatDateAr(r.review_date)}</TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={n <= (r.rating ?? 0) ? 'h-4 w-4 fill-warning text-warning' : 'h-4 w-4 text-muted-foreground'} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{r.goals ?? '-'}</TableCell>
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