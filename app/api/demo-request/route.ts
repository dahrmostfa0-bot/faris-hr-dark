 import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { org_name, contact_name, email, phone, org_type } = body;

    if (
      !org_name?.trim() ||
      !contact_name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !org_type?.trim()
    ) {
      return NextResponse.json(
        { error: "يرجى ملء جميع الحقول المطلوبة." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "البريد الإلكتروني غير صحيح." },
        { status: 400 }
      );
    }

    // ✅ إدراج بدون .select() — لا يحتاج سوى سياسة INSERT الموجودة
    const { error } = await supabase.from("demo_requests").insert({
      org_name: org_name.trim(),
      contact_name: contact_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      org_type: org_type.trim(),
      employee_count: body.employee_count ? Number(body.employee_count) : null,
      branches_count: body.branches_count ? Number(body.branches_count) : null,
      message: body.message?.trim() || null,
    });

    if (error) {
      console.error("Supabase insert error:", error.message);
      // 🔍 رسالة تشخيصية مؤقتة تكشف السبب الحقيقي في الواجهة
      // بعد نجاح الاختبار: أعد استبدالها بـ "تعذر حفظ الطلب حاليًا. يرجى المحاولة مرة أخرى."
      return NextResponse.json(
        { error: "تعذر حفظ الطلب حاليًا. يرجى المحاولة مرة أخرى." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع في الخادم." },
      { status: 500 }
    );
  }
}