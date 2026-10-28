'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { canAccessRouteCompany } from '@/lib/permissions';
import { supabase } from '@/lib/supabase/client';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { companyRole, loading } = useAuth();
  const [platformAdmin, setPlatformAdmin] = useState<boolean | null>(null);

  // أول جزء من المسار، مثل /payroll من /payroll/123
  const base = '/' + (pathname.split('/')[1] ?? '');
  const isPlatformRoute = base === '/requests';

  useEffect(() => {
    if (!isPlatformRoute) return;
    let alive = true;
    supabase.rpc('am_i_platform_admin').then(({ data }) => {
      if (alive) setPlatformAdmin(data === true);
    });
    return () => { alive = false; };
  }, [isPlatformRoute]);

  // null = لسه بنتحقق، true = مسموح، false = ممنوع
  let allowed: boolean | null;
  if (loading) allowed = null;
  else if (isPlatformRoute) allowed = platformAdmin;
  else if (!companyRole) allowed = true; // الصفحة نفسها بتعرض رسالة "لا توجد شركة"
  else allowed = canAccessRouteCompany(companyRole, base);

  useEffect(() => {
    if (allowed === false) router.replace('/dashboard');
  }, [allowed, router]);

  if (allowed !== true) return null;
  return <>{children}</>;
}