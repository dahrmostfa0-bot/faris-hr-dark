 import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// نظام إدارة الاشتراكات — متحكم في حالة النسخة
// SUBSCRIPTION_ACTIVE: true = شغّال / false = صفحة التجديد
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // 1) حجب مسار الدخول مؤقتًا (المراجعة الأمنية مستمرة)
  if (url.pathname.startsWith('/login')) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 2) مفتاح الاشتراك — صفحة التجديد معفاة من الفحص
  const subscriptionActive = process.env.SUBSCRIPTION_ACTIVE !== 'false';
  if (!subscriptionActive && !url.pathname.startsWith('/expired')) {
    url.pathname = '/expired';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login/:path*', '/((?!_next/static|_next/image|favicon.ico|expired).*)'],
};
