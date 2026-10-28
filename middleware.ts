 import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ═══════════════════════════════════════════════════════════
// نظام الحماية الشامل v2.2 — فارس دحروج الذكي
// - النشر العام: /login محجوب + المنطقة الداخلية محمية بالكامل
// - التطوير المحلي: /login مفتوح + تخطي حظر الجلسة لدخول المالك
// ملاحظة: هذا الملف بوابة "هل توجد جلسة" فقط. حماية الأدوار تتم في
// تخطيط المنطقة الداخلية وفي سياسات قاعدة البيانات (RLS).
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


  // 2) المنطقة الداخلية: تتطلب جلسة Supabase حقيقية وفعّالة
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => url.pathname === p || url.pathname.startsWith(p + '/')
  );

  if (isProtected) {
    const cookies = request.cookies.getAll();

    // 2أ) يجب وجود كوكي جلسة يبدأ بـ sb-
    const sessionCookie = cookies.find(
      (c) => c.name.startsWith('sb-') && c.name.includes('auth-token')
    );

    // 2ب) يجب أن يحتوي الكوكي على قيمة حقيقية (ليس فارغًا أو قصيرًا)
    const sessionValid =
      !!sessionCookie && sessionCookie.value.length > 50;

    if (!sessionValid) {
      // 🔧 التطوير المحلي: تخطي الحظر لفتح لوحة التحكم فوراً على جهازك
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
      }

      // بيئة الإنتاج الحية (Vercel): تفعيل الحماية الكاملة للموقع
      url.pathname = '/';
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