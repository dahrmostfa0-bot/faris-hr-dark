import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// عزل مؤقت لمسار الدخول — حتى انتهاء المراجعة الأمنية
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  if (url.pathname.startsWith('/login')) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/login/:path*'],
};
