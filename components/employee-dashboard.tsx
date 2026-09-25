'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  CalendarDays,
  CalendarCheck,
  UserCog,
  Bell,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { formatDateAr, formatTimeAr } from '@/lib/format';
import type { Attendance, Leave, Notification } from '@/lib/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function EmployeeDashboard() {
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [weekTrend, setWeekTrend] = useState<{ name: string; ساعات: number }[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data: emp } = await supabase
          .from('employees')
          .select('id, full_name, department:departments(name_ar, name)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!emp || cancelled) {
          setLoading(false);
          return;
        }

        setEmployeeId(emp.id);

        const today = new Date().toISOString().slice(0, 10);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenStr = sevenDaysAgo.toISOString().slice(0, 10);

        const [attRes, leaveRes, notifRes] = await Promise.all([
          supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', emp.id)
            .gte('date', sevenStr)
            .order('date', { ascending: false }),
          supabase
            .from('leaves')
            .select('*')
            .eq('employee_id', emp.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        if (cancelled) return;

        setAttendance((attRes.data ?? []) as Attendance[]);
        setLeaves((leaveRes.data ?? []) as Leave[]);
        setNotifs((notifRes.data ?? []) as Notification[]);

        const todayRec = (attRes.data ?? []).find((a: any) => a.date === today);
        setTodayAttendance(todayRec ?? null);

        const trend: { name: string; ساعات: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().slice(0, 10);
          const rec = (attRes.data ?? []).find((a: any) => a.date === ds);
          trend.push({
            name: `${d.getDate()}/${d.getMonth() + 1}`,
            ساعات: rec?.work_hours ?? 0,
          });
        }
        setWeekTrend(trend);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">جاري تحميل بياناتك...</div>;
  }

  const presentDays = attendance.filter((a) => a.status === 'present').length;
  const lateDays = attendance.filter((a) => a.status === 'late').length;
  const absentDays = attendance.filter((a) => a.status === 'absent').length;
  const pendingLeaves = leaves.filter((l) => l.status === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="بياناتك الشخصية وحضورك"
        actions={
          <Button asChild variant="outline"><Link href="/self-service">الخدمة الذاتية</Link></Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard title="أيام الحضور (7 أيام)" value={presentDays} icon={CalendarCheck} color="success" />
        <StatCard title="أيام التأخير" value={lateDays} icon={Clock} color="warning" />
        <StatCard title="أيام الغياب" value={absentDays} icon={CalendarDays} color="destructive" />
        <StatCard title="طلبات إجازة قيد الانتظار" value={pendingLeaves} icon={CheckSquare} color="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">ساعات العمل — آخر 7 أيام</CardTitle>
            <CardDescription>تتبع ساعات العمل اليومية</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weekTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 }} />
                <Area type="monotone" dataKey="ساعات" stroke="hsl(var(--chart-1))" fill="url(#gHours)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">حالة اليوم</CardTitle>
            <CardDescription>سجل الحضور لليوم</CardDescription>
          </CardHeader>
          <CardContent>
            {todayAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm text-muted-foreground">الحالة</span>
                  <Badge variant={todayAttendance.status === 'present' ? 'success' : todayAttendance.status === 'late' ? 'warning' : 'destructive'}>
                    {todayAttendance.status === 'present' ? 'حاضر' : todayAttendance.status === 'late' ? 'متأخر' : todayAttendance.status === 'absent' ? 'غائب' : 'إجازة'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm text-muted-foreground">الحضور</span>
                  <span className="text-sm font-medium">{formatTimeAr(todayAttendance.check_in)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm text-muted-foreground">الانصراف</span>
                  <span className="text-sm font-medium">{formatTimeAr(todayAttendance.check_out)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm text-muted-foreground">ساعات العمل</span>
                  <span className="text-sm font-medium">{todayAttendance.work_hours} ساعة</span>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                لم يتم تسجيل الحضور اليوم
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading text-base">طلبات الإجازات</CardTitle>
              <CardDescription>أحدث طلباتك</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm"><Link href="/leaves">عرض الكل</Link></Button>
          </CardHeader>
          <CardContent>
            {leaves.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">لا توجد طلبات إجازات</div>
            ) : (
              <div className="space-y-3">
                {leaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formatDateAr(l.start_date)} — {l.days} يوم</p>
                        <p className="text-xs text-muted-foreground">{l.type === 'annual' ? 'سنوية' : l.type === 'sick' ? 'مرضية' : l.type === 'emergency' ? 'اضطرارية' : 'بدون راتب'}</p>
                      </div>
                    </div>
                    <Badge variant={l.status === 'hr_approved' ? 'success' : l.status === 'rejected' ? 'destructive' : l.status === 'pending' ? 'warning' : 'secondary'}>
                      {l.status === 'pending' ? 'قيد الانتظار' : l.status === 'manager_approved' ? 'معتمد من المدير' : l.status === 'hr_approved' ? 'معتمد' : l.status === 'rejected' ? 'مرفوض' : 'ملغي'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-heading text-base">الإشعارات</CardTitle></CardHeader>
          <CardContent>
            {notifs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">لا توجد إشعارات</div>
            ) : (
              <div className="space-y-3">
                {notifs.map((n) => (
                  <div key={n.id} className="flex gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
