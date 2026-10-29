 import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════════
// نظام الحماية الشامل v2.3 — فارس دحروج الذكي
// - /login مفتوح دائمًا (النشر والتطوير)
// - المنطقة الداخلية تتطلب وجود كوكي جلسة Supabase (قد يكون مقسّمًا .0 .1)
// - التطوير المحلي: تخطي حظر الجلسة لسهولة الاختبار
// ملاحظة: هذا الملف بوابة "هل توجد جلسة" فقط. حماية الأدوار تتم في
// RouteGuard داخل المنطقة الداخلية وفي سياسات قاعدة البيانات (RLS).
// ═══════════════════════════════════════════════════════════

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/employees',
  '/attendance',
  '/leaves',
  '/payroll',
  '/contracts',
  '/tasks',
  '/reviews',
  '/self-service',
  '/recruitment',
  '/reports',
  '/departments',
  '/kpis',
  '/warnings',
  '/notifications',
  '/settings',
  '/requests',
  '/profile',
  '/search',
  '/ai',
];

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // 1) مسار الدخول مفتوح دائمًا
  if (url.pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // 2) المنطقة الداخلية: تتطلب كوكي جلسة Supabase
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => url.pathname === p || url.pathname.startsWith(p + '/')
  );

  if (isProtected) {
    const cookies = request.cookies.getAll();

    // كوكي الجلسة (قد يكون مقسّمًا إلى أجزاء: ...auth-token.0 و ...auth-token.1)
    const sessionParts = cookies.filter(
      (c) => c.name.startsWith('sb-') && c.name.includes('auth-token')
    );
    const totalLength = sessionParts.reduce((sum, c) => sum + c.value.length, 0);
    const sessionValid = totalLength > 50;

    if (!sessionValid) {
      // التطوير المحلي: تخطي الحظر
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
      }

      // الإنتاج: لا توجد جلسة، نحوّل لصفحة الدخول
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login/:path*',
    '/((?!_next/static|_next/image|favicon.ico|api/demo-request|expired|api/requests).*)',
  ],
};