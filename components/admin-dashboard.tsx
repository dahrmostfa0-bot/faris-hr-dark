 'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, UserCheck, UserPlus, UserMinus, Clock, CalendarDays, Wallet, FileText, Bell, AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { formatDateAr, formatCurrency } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';
import { hasCompanyPermission } from '@/lib/permissions';
import type { Leave, Contract, Notification } from '@/lib/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const TZ = 'Africa/Cairo';
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 13 };

function cairoDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return cairoDate(d);
}

type Stats = {
  total: number; active: number; newHires: number; resigned: number;
  presentToday: number; absentToday: number; lateToday: number;
  onLeaveNow: number; totalPayroll: number; endingContracts: number;
};

const EMPTY: Stats = {
  total: 0, active: 0, newHires: 0, resigned: 0,
  presentToday: 0, absentToday: 0, lateToday: 0,
  onLeaveNow: 0, totalPayroll: 0, endingContracts: 0,
};

export function AdminDashboard() {
  const { company, companyRole } = useAuth();
  const role = companyRole ?? undefined;
  const canEmployees = hasCompanyPermission(role, 'employees.view');
  const canAttendance = hasCompanyPermission(role, 'attendance.view');
  const canLeaves = hasCompanyPermission(role, 'leaves.view');
  const canPayroll = hasCompanyPermission(role, 'payroll.view');
  const canContracts = hasCompanyPermission(role, 'contracts.view');
  const canDepartments = hasCompanyPermission(role, 'departments.view');

  const [stats, setStats] = useState<Stats>(EMPTY);
  const [attendanceTrend, setAttendanceTrend] = useState<{ name: string; حاضر: number; متأخر: number; غائب: number }[]>([]);
  const [deptDist, setDeptDist] = useState<{ name: string; value: number }[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [endingContracts, setEndingContracts] = useState<Contract[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company) { setLoading(false); return; }
    let cancelled = false;
    const co = company.id;

    (async () => {
      try {
        const today = cairoDate();
        const monthAgo = daysAgoStr(30);
        const weekAgo = daysAgoStr(6);
        const errors: string[] = [];
        const next: Stats = { ...EMPTY };

        // إشعاراتي (تظهر لكل الأدوار)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const nRes = await supabase
            .from('notifications').select('*').eq('user_id', user.id)
            .order('created_at', { ascending: false }).limit(5);
          if (!cancelled) setNotifs((nRes.data ?? []) as Notification[]);
        }

        // الموظفون
        if (canEmployees) {
          const eRes = await supabase
            .from('employees')
            .select('status, hire_date, department_id')
            .eq('company_id', co);
          if (eRes.error) errors.push(eRes.error.message);
          const rows = eRes.data ?? [];
          next.total = rows.length;
          next.active = rows.filter((e) => e.status === 'active').length;
          next.resigned = rows.filter((e) => e.status === 'resigned').length;
          next.newHires = rows.filter((e) => e.hire_date && e.hire_date >= monthAgo).length;

          if (canDepartments) {
            const dRes = await supabase.from('departments').select('id, name, name_ar').eq('company_id', co);
            const names = new Map((dRes.data ?? []).map((d) => [d.id, d.name_ar || d.name]));
            const count = new Map<string, number>();
            rows.forEach((e) => {
              const n = (e.department_id && names.get(e.department_id)) || 'غير محدد';
              count.set(n, (count.get(n) ?? 0) + 1);
            });
            if (!cancelled) setDeptDist(Array.from(count, ([name, value]) => ({ name, value })));
          }
        }

        // الحضور: استعلام واحد للأسبوع
        if (canAttendance) {
          const aRes = await supabase
            .from('attendance').select('status, date')
            .eq('company_id', co).gte('date', weekAgo).lte('date', today);
          if (aRes.error) errors.push(aRes.error.message);
          const att = aRes.data ?? [];
          const todayRows = att.filter((a) => a.date === today);
          next.presentToday = todayRows.filter((a) => a.status === 'present').length;
          next.lateToday = todayRows.filter((a) => a.status === 'late').length;
          next.absentToday = todayRows.filter((a) => a.status === 'absent').length;

          const trend: { name: string; حاضر: number; متأخر: number; غائب: number }[] = [];
          for (let i = 6; i >= 0; i--) {
            const ds = daysAgoStr(i);
            const [, m, d] = ds.split('-');
            const day = att.filter((a) => a.date === ds);
            trend.push({
              name: `${Number(d)}/${Number(m)}`,
              حاضر: day.filter((a) => a.status === 'present').length,
              متأخر: day.filter((a) => a.status === 'late').length,
              غائب: day.filter((a) => a.status === 'absent').length,
            });
          }
          if (!cancelled) setAttendanceTrend(trend);
        }

        // الإجازات
        if (canLeaves) {
          const lRes = await supabase
            .from('leaves').select('*, employee:employees(id, full_name)')
            .eq('company_id', co).order('created_at', { ascending: false }).limit(5);
          if (lRes.error) errors.push(lRes.error.message);
          if (!cancelled) setRecentLeaves((lRes.data ?? []) as unknown as Leave[]);

          const cRes = await supabase
            .from('leaves').select('id', { count: 'exact', head: true })
            .eq('company_id', co).eq('status', 'hr_approved')
            .lte('start_date', today).gte('end_date', today);
          next.onLeaveNow = cRes.count ?? 0;
        }

        // الرواتب
        if (canPayroll) {
          const pRes = await supabase
            .from('payroll').select('net_salary').eq('company_id', co).eq('status', 'paid');
          if (pRes.error) errors.push(pRes.error.message);
          next.totalPayroll = (pRes.data ?? []).reduce((s, p) => s + Number(p.net_salary || 0), 0);
        }

        // العقود
        if (canContracts) {
          const limit = daysAgoStr(-30);
          const cRes = await supabase
            .from('contracts').select('*, employee:employees(id, full_name)')
            .eq('company_id', co).not('end_date', 'is', null)
            .gte('end_date', today).lte('end_date', limit)
            .order('end_date', { ascending: true }).limit(5);
          if (cRes.error) errors.push(cRes.error.message);
          const list = (cRes.data ?? []) as unknown as Contract[];
          next.endingContracts = list.length;
          if (!cancelled) setEndingContracts(list);
        }

        if (!cancelled) {
          setStats(next);
          setError(errors.length ? errors[0] : null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'خطأ غير متوقع');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [company, canEmployees, canAttendance, canLeaves, canPayroll, canContracts, canDepartments]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">جاري تحميل البيانات...</div>;
  }

  if (!company) {
    return <div className="py-12 text-center text-muted-foreground">لا توجد شركة مرتبطة بالحساب.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم"
        description="نظرة عامة على حالة الموارد البشرية"
        actions={hasCompanyPermission(role, 'reports.view') ? <Button asChild><Link href="/reports">عرض التقارير</Link></Button> : null}
      />

      {error && (
        <Card><CardContent className="p-4 text-sm text-destructive">تعذّر تحميل جزء من البيانات: {error}</CardContent></Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {canEmployees && <StatCard title="إجمالي الموظفين" value={stats.total} icon={Users} color="primary" />}
        {canEmployees && <StatCard title="الموظفون النشطون" value={stats.active} icon={UserCheck} color="success" />}
        {canEmployees && <StatCard title="موظفون جدد" value={stats.newHires} icon={UserPlus} color="accent" trend="آخر 30 يوم" trendUp />}
        {canEmployees && <StatCard title="المستقيلون" value={stats.resigned} icon={UserMinus} color="destructive" />}
        {canAttendance && <StatCard title="الحضور اليوم" value={stats.presentToday} icon={Clock} color="success" />}
        {canAttendance && <StatCard title="الغياب اليوم" value={stats.absentToday} icon={UserMinus} color="destructive" />}
        {canAttendance && <StatCard title="التأخير اليوم" value={stats.lateToday} icon={AlertTriangle} color="warning" />}
        {canLeaves && <StatCard title="في إجازة اليوم" value={stats.onLeaveNow} icon={CalendarDays} color="accent" />}
        {canPayroll && <StatCard title="إجمالي الرواتب المدفوعة" value={formatCurrency(stats.totalPayroll)} icon={Wallet} color="primary" />}
        {canContracts && <StatCard title="عقود تنتهي خلال 30 يوم" value={stats.endingContracts} icon={FileText} color="warning" />}
      </div>

      {(canAttendance || canDepartments) && (
        <div className="grid gap-6 lg:grid-cols-3">
          {canAttendance && (
            <Card className={canDepartments ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <CardHeader>
                <CardTitle className="font-heading text-base">حالة الحضور — آخر 7 أيام</CardTitle>
                <CardDescription>تتبع الحضور والتأخير والغياب اليومي</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={attendanceTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="حاضر" stroke="hsl(var(--chart-1))" fill="url(#gP)" strokeWidth={2} />
                    <Area type="monotone" dataKey="متأخر" stroke="hsl(var(--chart-3))" fill="url(#gL)" strokeWidth={2} />
                    <Area type="monotone" dataKey="غائب" stroke="hsl(var(--chart-5))" fill="url(#gA)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {canDepartments && (
            <Card className={canAttendance ? '' : 'lg:col-span-3'}>
              <CardHeader>
                <CardTitle className="font-heading text-base">توزيع الموظفين حسب القسم</CardTitle>
                <CardDescription>عدد الموظفين في كل قسم</CardDescription>
              </CardHeader>
              <CardContent>
                {deptDist.length === 0 ? (
                  <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">لا توجد بيانات</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={deptDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: { name: string }) => e.name}>
                        {deptDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {canLeaves && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading text-base">آخر طلبات الإجازات</CardTitle>
                <CardDescription>أحدث طلبات الإجازات المُسجّلة</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm"><Link href="/leaves">عرض الكل</Link></Button>
            </CardHeader>
            <CardContent>
              {recentLeaves.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">لا توجد طلبات إجازات</div>
              ) : (
                <div className="space-y-3">
                  {recentLeaves.map((l) => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{l.employee?.full_name ?? 'موظف'}</p>
                          <p className="text-xs text-muted-foreground">{formatDateAr(l.start_date)} — {l.days} يوم</p>
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
        )}

        <Card className={canLeaves ? '' : 'lg:col-span-3'}>
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

      {canContracts && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">عقود قاربت على الانتهاء</CardTitle>
            <CardDescription>عقود تنتهي خلال 30 يوماً</CardDescription>
          </CardHeader>
          <CardContent>
            {endingContracts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">لا توجد عقود قاربت على الانتهاء</div>
            ) : (
              <div className="space-y-3">
                {endingContracts.map((c) => {
                  const days = c.end_date ? Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000) : 0;
                  return (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10 text-warning">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.employee?.full_name ?? 'موظف'}</p>
                          <p className="text-xs text-muted-foreground">ينتهي: {formatDateAr(c.end_date)}</p>
                        </div>
                      </div>
                      <Badge variant={days <= 7 ? 'destructive' : 'warning'}>{days} يوم</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}