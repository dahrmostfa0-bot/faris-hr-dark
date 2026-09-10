import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, email, phone, organization_type } = body;

    if (!company_name || !email || !phone) {
      return NextResponse.json(
        { error: 'اسم الشركة والبريد الإلكتروني ورقم الهاتف مطلوبة' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('demo_requests')
      .insert({
        company_name: String(company_name).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        organization_type: organization_type ? String(organization_type).trim() : 'school',
        status: 'pending',
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Demo request insert error:', error.message);
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'تم استلام طلبك بنجاح. سنتواصل معك قريباً.', id: data.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'الطريقة غير مدعومة' },
    { status: 405 }
  );
}
