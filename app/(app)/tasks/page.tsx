'use client';

import { useEffect, useState } from 'react';
import { Plus, CheckSquare, MessageSquare } from 'lucide-react';
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
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/permissions';
import { formatDateAr } from '@/lib/format';
import { TASK_STATUS_LABELS, type Task, type TaskStatus, type Employee, type TaskComment } from '@/lib/types';

export default function TasksPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const canManage = hasPermission(role ?? undefined, 'tasks.manage');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '', start_date: new Date().toISOString().slice(0, 10),
    due_date: '', priority: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    (async () => {
      const [tRes, empRes] = await Promise.all([
        supabase.from('tasks').select('*, employee:employees!assigned_to(*)').order('created_at', { ascending: false }),
        supabase.from('employees').select('id, full_name').order('full_name'),
      ]);
      setTasks((tRes.data ?? []) as Task[]);
      setEmployees((empRes.data ?? []) as Employee[]);
      setLoading(false);
    })();
  }, []);

  async function handleSubmit() {
    if (!form.title || !form.assigned_to) { toast({ title: 'أكمل البيانات', variant: 'destructive' }); return; }
    const { error } = await supabase.from('tasks').insert({
      title: form.title, description: form.description, assigned_to: form.assigned_to,
      start_date: form.start_date, due_date: form.due_date, priority: form.priority,
      status: 'todo', progress: 0, comments: [],
    });
    if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'تم إنشاء المهمة' });
      setOpen(false);
      const { data } = await supabase.from('tasks').select('*, employee:employees!assigned_to(*)').order('created_at', { ascending: false });
      setTasks((data ?? []) as Task[]);
    }
  }

  async function updateProgress(id: string, progress: number) {
    const status: TaskStatus = progress >= 100 ? 'done' : progress > 0 ? 'in_progress' : 'todo';
    await supabase.from('tasks').update({ progress, status }).eq('id', id);
    setTasks((t) => t.map((x) => x.id === id ? { ...x, progress, status } : x));
  }

  async function addComment(id: string) {
    if (!commentText.trim()) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const comments: TaskComment[] = Array.isArray(task.comments) ? task.comments : [];
    comments.push({ author: 'أنت', text: commentText, at: new Date().toISOString() });
    await supabase.from('tasks').update({ comments }).eq('id', id);
    setTasks((t) => t.map((x) => x.id === id ? { ...x, comments } : x));
    setCommentText('');
    setCommentOpen(null);
    toast({ title: 'تم إضافة التعليق' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="المهام"
        description={`${tasks.length} مهمة`}
        actions={canManage && <Button onClick={() => setOpen(true)}><Plus className="ml-2 h-4 w-4" /> مهمة جديدة</Button>}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إنشاء مهمة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>العنوان</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>الوصف</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>تعيين إلى</Label><Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}><SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>البداية</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>الاستحقاق</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>الأولوية</Label><Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as 'low' | 'medium' | 'high' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">منخفضة</SelectItem><SelectItem value="medium">متوسطة</SelectItem><SelectItem value="high">عالية</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button onClick={handleSubmit}>إنشاء</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? <div className="py-12 text-center text-muted-foreground">جاري التحميل...</div> : tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground"><CheckSquare className="h-8 w-8 opacity-40" /><p className="text-sm">لا توجد مهام</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardContent className="flex-1 space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{t.title}</h3>
                  <Badge variant={t.priority === 'high' ? 'destructive' : t.priority === 'medium' ? 'warning' : 'secondary'}>
                    {t.priority === 'high' ? 'عالية' : t.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                  </Badge>
                </div>
                {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                <div className="text-xs text-muted-foreground">
                  <span>المسند إلى: {t.employee?.full_name ?? '-'}</span><br />
                  <span>الاستحقاق: {formatDateAr(t.due_date)}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs"><span>نسبة الإنجاز</span><span>{t.progress}%</span></div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary transition-all" style={{ width: `${t.progress}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={t.status === 'done' ? 'success' : t.status === 'in_progress' ? 'warning' : 'secondary'}>
                    {TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => setCommentOpen(commentOpen === t.id ? null : t.id)}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
                {canManage && (
                  <Input type="range" min={0} max={100} value={t.progress} onChange={(e) => updateProgress(t.id, Number(e.target.value))} className="h-1" />
                )}
                {commentOpen === t.id && (
                  <div className="space-y-2 border-t border-border pt-2">
                    {Array.isArray(t.comments) && t.comments.map((c, i) => (
                      <div key={i} className="rounded bg-muted p-2 text-xs"><b>{c.author}:</b> {c.text}</div>
                    ))}
                    <div className="flex gap-2">
                      <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="تعليق..." />
                      <Button size="sm" onClick={() => addComment(t.id)}>إرسال</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
