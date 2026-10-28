 'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await signIn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      return;
    }
    router.replace('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-72 w-72 rounded-full bg-success/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow-primary">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold text-gradient-primary">نظام فارس دحروج لإدارة الموارد البشرية</h1>
            <p className="text-sm text-muted-foreground">Faris HR</p>
          </div>
        </div>

        <Card className="shadow-soft-lg border-border/60">
          <CardHeader>
            <CardTitle className="font-heading text-lg">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بيانات حسابك للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
                <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive animate-fade-in">{error}</div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                دخول
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                لا يوجد تسجيل ذاتي. حسابك يُنشأ بواسطة مدير الشركة. إن نسيت كلمة المرور تواصل معه.
              </p>
            </CardFooter>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">العودة للرئيسية</Link>
        </p>
      </div>
    </div>
  );
}