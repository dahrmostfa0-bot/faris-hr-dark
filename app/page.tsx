'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  GraduationCap, Building2, LayoutDashboard, FolderArchive, Wallet,
  Clock, Users, ArrowLeft, Check, ShieldCheck, Sparkles, TrendingUp,
  CalendarDays, PlayCircle, Menu, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/components/scroll-reveal';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

const features = [
  {
    icon: LayoutDashboard,
    title: 'لوحة تحكم ذكية',
    desc: 'إحصائيات فورية شاملة لإجمالي الموظفين، الغياب، التأخير، وعقود العمل.',
    color: 'primary',
  },
  {
    icon: FolderArchive,
    title: 'الأرشفة الإلكترونية السحابية',
    desc: 'رفع السيرة الذاتية، العقود، الهويات، والشهادات على سحابة مشفرة وآمنة مع أزرار عرض وحذف فورية.',
    color: 'accent',
  },
  {
    icon: Wallet,
    title: 'نظام الرواتب المؤتمت',
    desc: 'حساب المستحقات، المكافآت، الخصومات، والرواتب الإجمالية بدقة متناهية ودون تعقيد.',
    color: 'success',
  },
  {
    icon: Clock,
    title: 'الحضور الذكي والإجازات',
    desc: 'تتبع يومي وسجل متكامل للطلب والموافقات الفورية بحسابات المديرين والموظفين.',
    color: 'warning',
  },
  {
    icon: Users,
    title: 'الخدمة الذاتية والتوظيف',
    desc: 'بوابات مخصصة تمنح الموظفين والباحثين عن عمل تجربة رقمية تفاعلية بالكامل.',
    color: 'primary',
  },
  {
    icon: ShieldCheck,
    title: 'أمان وبنية متينة',
    desc: 'حماية على مستوى المؤسسات مع تشفير كامل للبيانات وصلاحيات دقيقة لكل دور.',
    color: 'success',
  },
];

const colorMap: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
};

const stats = [
  { value: '+50', label: 'مؤسسة عميلة' },
  { value: '+5000', label: 'موظف مُدار' },
  { value: '99.9%', label: 'جاهزية النظام' },
  { value: '24/7', label: 'دعم فني' },
];

export default function LandingPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    email: '',
    phone: '',
    organization_type: 'school',
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.company_name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast({ title: 'تنبيه', description: 'يرجى ملء جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('demo_requests').insert({
        company_name: form.company_name,
        email: form.email,
        phone: form.phone,
        organization_type: form.organization_type,
      });
      if (error) throw error;
      toast({
        title: 'تم استقبال طلبك بنجاح!',
        description: 'سيتواصل معك فريق الدعم لتجهيز نسختك التجريبية.',
      });
      setForm({ company_name: '', email: '', phone: '', organization_type: 'school' });
    } catch {
      toast({
        title: 'حدث خطأ',
        description: 'تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== Nav ===== */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-base font-bold sm:text-lg">فارس دحروج</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#audience" className="text-sm text-muted-foreground transition-colors hover:text-foreground">المناسب لمن</a>
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">المميزات</a>
            <a href="#offer" className="text-sm text-muted-foreground transition-colors hover:text-foreground">ابدأ الآن</a>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">تسجيل الدخول</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-primary">
              <Link href="/login">الدخول للنظام</Link>
            </Button>
          </div>
          <button
            className="rounded-lg p-2 text-muted-foreground md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="القائمة"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-border/50 bg-background/95 px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#audience" onClick={() => setMenuOpen(false)} className="text-sm text-muted-foreground">المناسب لمن</a>
              <a href="#features" onClick={() => setMenuOpen(false)} className="text-sm text-muted-foreground">المميزات</a>
              <a href="#offer" onClick={() => setMenuOpen(false)} className="text-sm text-muted-foreground">ابدأ الآن</a>
              <Button asChild variant="outline" size="sm" className="w-full"><Link href="/login">تسجيل الدخول</Link></Button>
            </div>
          </div>
        )}
      </nav>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute right-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute left-1/4 top-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <ScrollReveal>
              <Badge variant="secondary" className="mb-6 gap-1.5 border-primary/20 bg-primary/5 px-3 py-1 text-xs">
                <Sparkles className="h-3 w-3 text-primary" />
                منظومة رقمية متكاملة لإدارة الموارد البشرية
              </Badge>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
                نظام فارس دحروج الذكي للموارد البشرية
                <span className="mt-2 block text-gradient-primary">منظومة رقمية متكاملة للمدارس والشركات</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                أدر شؤون الموظفين والمعلمين، واجعل حساب الرواتب، أرشفة المستندات، ومتابعة الحضور والانصراف يتم بضغطة زر واحدة ومن أي مكان.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={240}>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full gap-2 bg-gradient-primary shadow-glow-primary transition-transform hover:scale-[1.02] sm:w-auto">
                  <a href="#offer"><Check className="h-4 w-4" /> اطلب نسخة تجريبية مجاناً</a>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full gap-2 transition-transform hover:scale-[1.02] sm:w-auto">
                  <a href="#features"><PlayCircle className="h-4 w-4" /> شاهد الديمو الحي</a>
                </Button>
              </div>
            </ScrollReveal>
          </div>

          {/* Dashboard mockup */}
          <ScrollReveal delay={320} className="mt-16">
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-primary opacity-20 blur-2xl" />
              <Card className="overflow-hidden rounded-2xl border-border/60 shadow-soft-lg">
                <div className="flex items-center gap-2 border-b border-border/50 bg-card/50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-warning/60" />
                    <div className="h-3 w-3 rounded-full bg-success/60" />
                  </div>
                  <div className="mr-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    dashboard.faris-hr.com
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { icon: Users, label: 'إجمالي الموظفين', value: '248', color: 'primary' },
                      { icon: Clock, label: 'الحضور اليوم', value: '224', color: 'success' },
                      { icon: CalendarDays, label: 'الإجازات الجارية', value: '12', color: 'accent' },
                      { icon: Wallet, label: 'إجمالي الرواتب', value: '1.2M', color: 'warning' },
                    ].map((s, i) => (
                      <div key={i} className={`rounded-xl border p-4 ${colorMap[s.color]}`}>
                        <s.icon className="mb-3 h-5 w-5" />
                        <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-4 px-6 pb-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-border/50 bg-card/40 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium">حالة الحضور — أسبوع</p>
                        <Badge variant="secondary" className="text-xs">7 أيام</Badge>
                      </div>
                      <div className="flex h-32 items-end gap-2">
                        {[60, 75, 90, 70, 85, 95, 80].map((h, i) => (
                          <div key={i} className="flex flex-1 flex-col items-center gap-1">
                            <div
                              className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary transition-all duration-700"
                              style={{ height: `${h}%` }}
                            />
                            <span className="text-[10px] text-muted-foreground">{['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'][i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-card/40 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium">أحدث طلبات الإجازات</p>
                        <Badge variant="secondary" className="text-xs">مباشر</Badge>
                      </div>
                      <div className="space-y-2">
                        {[
                          { name: 'أحمد محمد', status: 'معتمد', color: 'success' as const },
                          { name: 'سارة علي', status: 'قيد الانتظار', color: 'warning' as const },
                          { name: 'خالد عبدالله', status: 'معتمد', color: 'success' as const },
                        ].map((r, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2">
                            <span className="text-xs font-medium">{r.name}</span>
                            <Badge variant={r.color} className="text-[10px]">{r.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollReveal>

          {/* Stats bar */}
          <ScrollReveal delay={400}>
            <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="font-heading text-3xl font-bold text-gradient-primary sm:text-4xl">{s.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== Audience Targeting ===== */}
      <section id="audience" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/5">المناسب لمن</Badge>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl md:text-4xl">
                مصمم خصيصاً لاحتياجات مؤسستك
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                سواء كنت تدير مدرسة أو شركة تجارية، النظام يتكيف مع هيكلك الإداري بالكامل
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 lg:grid-cols-2">
            <ScrollReveal>
              <Card className="group h-full overflow-hidden border-border/60 shadow-soft transition-all hover:shadow-soft-lg hover:border-primary/30">
                <CardContent className="p-8">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading text-xl font-bold">قطاع المدارس والمؤسسات التعليمية</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    حلول متخصصة لإدارة المعلمين والكوادر التعليمية بكفاءة عالية
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      'إدارة المعلمين والكوادر التعليمية',
                      'أرشفة الشهادات والعقود إلكترونياً',
                      'حساب البدلات والإجازات الصيفية',
                      'التقييم الأكاديمي والمهني',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <Card className="group h-full overflow-hidden border-border/60 shadow-soft transition-all hover:shadow-soft-lg hover:border-accent/30">
                <CardContent className="p-8">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-transform group-hover:scale-110">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <h3 className="font-heading text-xl font-bold">الشركات والمؤسسات التجارية</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    بنية تحتية مرنة تناسب الشركات بمختلف أحجامها وقطاعاتها
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      'هيكلة الأقسام الديناميكية',
                      'تقارير ذكية وتحليلات فورية',
                      'متابعة كفاءة الموظفين والأداء',
                      'إدارة شؤون الموظفين باحترافية',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                          <Check className="h-3 w-3 text-accent" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== Core Features ===== */}
      <section id="features" className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[140px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/5">المميزات</Badge>
              <h2 className="font-heading text-2xl font-bold sm:text-3xl md:text-4xl">
                كل ما تحتاجه في منظومة واحدة
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                أدوات قوية ومتكاملة صُممت لتغطية كل جوانب إدارة الموارد البشرية
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <Card className="group h-full border-border/60 shadow-soft transition-all hover:shadow-soft-lg hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${colorMap[f.color]} transition-transform group-hover:scale-110`}>
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-lg font-bold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Offer & CTA ===== */}
      <section id="offer" className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute right-1/3 top-0 h-[400px] w-[400px] rounded-full bg-primary/15 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <ScrollReveal>
              <div>
                <Badge variant="secondary" className="mb-4 border-success/20 bg-success/5">
                  <TrendingUp className="ml-1 h-3 w-3 text-success" />
                  عرض حصري
                </Badge>
                <h2 className="font-heading text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
                  انضم إلى المستقبل الرقمي ووفر
                  <span className="text-gradient-primary"> 30% </span>
                  من وقت وجهد إدارتك
                </h2>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                  احصل على نسخة تجريبية مجانية الآن، واكتشف كيف يمكن لنظام فارس دحروج تحويل إدارة الموارد البشرية في مؤسستك إلى تجربة سلسة وذكية.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'تفعيل فوري بدون رسوم إعداد',
                    'تدريب مجاني للفريق على النظام',
                    'دعم فني مستمر على مدار الساعة',
                    'ترحيل بياناتك الحالية مجاناً',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15">
                        <Check className="h-3 w-3 text-success" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <Card className="border-border/60 shadow-soft-lg">
                <CardContent className="p-8">
                  <h3 className="font-heading text-xl font-bold">اطلب نسختك التجريبية</h3>
                  <p className="mt-2 text-sm text-muted-foreground">املأ النموذج وسنتواصل معك خلال 24 ساعة</p>
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">اسم المؤسسة</label>
                      <Input
                        placeholder="مثال: مدرسة النور الأهلية"
                        value={form.company_name}
                        onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">البريد الإلكتروني</label>
                      <Input
                        type="email"
                        placeholder="name@company.com"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">رقم الهاتف</label>
                      <Input
                        type="tel"
                        placeholder="05xxxxxxxx"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">نوع المنشأة</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, organization_type: 'school' }))}
                          className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                            form.organization_type === 'school'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          <GraduationCap className="h-4 w-4" /> مدرسة
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, organization_type: 'company' }))}
                          className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                            form.organization_type === 'company'
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          <Building2 className="h-4 w-4" /> شركة
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className="w-full gap-2 bg-gradient-primary shadow-glow-primary transition-transform hover:scale-[1.01]"
                    >
                      {submitting ? (
                        <>جاري الإرسال...</>
                      ) : (
                        <>اطلب النسخة التجريبية <ArrowLeft className="h-4 w-4" /></>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading text-sm font-bold">نظام فارس دحروج لإدارة الموارد البشرية</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="transition-colors hover:text-foreground">المميزات</a>
              <a href="#offer" className="transition-colors hover:text-foreground">النسخة التجريبية</a>
              <Link href="/login" className="transition-colors hover:text-foreground">تسجيل الدخول</Link>
            </div>
          </div>
          <div className="mt-8 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
            نظام فارس دحروج لإدارة الموارد البشرية &copy; 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
