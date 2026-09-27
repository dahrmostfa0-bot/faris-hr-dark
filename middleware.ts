 import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// نظام إدارة الاشتراكات — متحكم في حالة النسخة
// SUBSCRIPTION_ACTIVE: true = شغّال / false = صفحة التجديد
// TRIAL_END_DATE: تاريخ انتهاء صلاحية زر "تسجيل الدخول" (فترة تجريبية 14 يوم للعميل)
// مثال القيمة في متغيرات البيئة على Vercel: TRIAL_END_DATE=2026-10-09
// لو المتغير غير موجود أو التاريخ غير صالح، يبقى الدخول محجوبًا كالوضع الحالي (آمن افتراضيًا)
function isTrialActive(): boolean {
  const trialEndDate = process.env.TRIAL_END_DATE;
  if (!trialEndDate) return false;
  const end = new Date(`${trialEndDate}T23:59:59`);
  if (Number.isNaN(end.getTime())) return false;
  return new Date() <= end;
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // 1) الدخول متاح فقط خلال الفترة التجريبية (14 يوم)، ثم يوجّه تلقائيًا لصفحة التجديد
  if (url.pathname.startsWith('/login')) {
    if (!isTrialActive()) {
      url.pathname = '/expired';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
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