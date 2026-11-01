import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ASSIGNABLE_ROLES = [
  'hr_manager', 'hr_attendance', 'hr_payroll', 'hr_recruitment', 'direct_manager', 'employee',
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function adminClient() {
  if (!SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// الهوية والدور يُؤخذان من قاعدة البيانات، لا من محتوى الطلب
async function requireOwner(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await userClient.auth.getUser(token);
  const user = userData?.user;
  if (!user) return null;
  const { data: mem } = await userClient
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at')
    .limit(1)
    .maybeSingle();
  if (!mem || mem.role !== 'owner') return null;
  return { userId: user.id, companyId: mem.company_id as string };
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await request.json();
    return b && typeof b === 'object' ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function cairoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
}

// ───────────── GET: قائمة المستخدمين ─────────────
export async function GET(request: Request) {
  const owner = await requireOwner(request);
  if (!owner) return json({ error: 'غير مصرّح' }, 403);
  const admin = adminClient();
  if (!admin) return json({ error: 'إعداد الخادم ناقص: SUPABASE_SERVICE_ROLE_KEY' }, 500);

  const [memRes, empRes, usersRes] = await Promise.all([
    admin.from('company_members').select('user_id, role, status, created_at')
      .eq('company_id', owner.companyId).order('created_at'),
    admin.from('employees').select('id, user_id, full_name, employee_code')
      .eq('company_id', owner.companyId).order('full_name'),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (memRes.error) return json({ error: memRes.error.message }, 500);

  const emails = new Map<string, string>();
  (usersRes.data?.users ?? []).forEach((u) => emails.set(u.id, u.email ?? ''));
  const employees = empRes.data ?? [];

  const members = (memRes.data ?? []).map((m) => {
    const emp = employees.find((e) => e.user_id === m.user_id);
    return {
      user_id: m.user_id,
      email: emails.get(m.user_id) ?? '',
      role: m.role,
      status: m.status,
      employee_name: emp?.full_name ?? null,
      employee_code: emp?.employee_code ?? null,
    };
  });
  const unlinked = employees
    .filter((e) => !e.user_id)
    .map((e) => ({ id: e.id, full_name: e.full_name, employee_code: e.employee_code }));

  return json({ members, unlinked });
}

// ───────────── POST: إنشاء مستخدم ─────────────
export async function POST(request: Request) {
  const owner = await requireOwner(request);
  if (!owner) return json({ error: 'غير مصرّح' }, 403);
  const admin = adminClient();
  if (!admin) return json({ error: 'إعداد الخادم ناقص: SUPABASE_SERVICE_ROLE_KEY' }, 500);

  const body = await readBody(request);
  if (!body) return json({ error: 'طلب غير صالح' }, 400);

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const role = String(body.role ?? '');
  const linkMode = body.link_mode === 'existing' || body.link_mode === 'new' ? body.link_mode : 'none';
  const employeeId = typeof body.employee_id === 'string' ? body.employee_id : '';
  const fullName = String(body.full_name ?? '').trim();

  if (!EMAIL_RE.test(email) || email.length > 200) return json({ error: 'البريد الإلكتروني غير صحيح' }, 400);
  if (password.length < 8 || password.length > 72) return json({ error: 'كلمة المرور من 8 إلى 72 حرفًا' }, 400);
  if (!ASSIGNABLE_ROLES.includes(role)) return json({ error: 'الدور غير مسموح' }, 400);
  if (linkMode === 'new' && (!fullName || fullName.length > 200)) return json({ error: 'أدخل اسم الموظف' }, 400);

  if (linkMode === 'existing') {
    const { data: emp } = await admin.from('employees').select('id, user_id')
      .eq('id', employeeId).eq('company_id', owner.companyId).maybeSingle();
    if (!emp) return json({ error: 'الموظف غير موجود' }, 404);
    if (emp.user_id) return json({ error: 'هذا الموظف مربوط بحساب بالفعل' }, 409);
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (createErr || !created?.user) {
    const exists = /already|registered|exists/i.test(createErr?.message ?? '');
    return json({ error: exists ? 'هذا البريد مسجّل بالفعل' : (createErr?.message ?? 'تعذر إنشاء الحساب') }, exists ? 409 : 500);
  }
  const newUserId = created.user.id;

  async function rollback() {
    await admin!.from('company_members').delete().eq('user_id', newUserId);
    await admin!.auth.admin.deleteUser(newUserId);
  }

  const { error: memErr } = await admin.from('company_members').insert({
    company_id: owner.companyId, user_id: newUserId, role, status: 'active',
  });
  if (memErr) { await rollback(); return json({ error: memErr.message }, 500); }

  let employeeCode: string | null = null;

  if (linkMode === 'existing') {
    const { data: upd, error: updErr } = await admin.from('employees')
      .update({ user_id: newUserId })
      .eq('id', employeeId).eq('company_id', owner.companyId).is('user_id', null)
      .select('id, employee_code');
    if (updErr || !upd || upd.length !== 1) {
      await rollback();
      return json({ error: 'تعذر ربط الموظف بالحساب' }, 409);
    }
    employeeCode = upd[0].employee_code;
  } else if (linkMode === 'new') {
    const { data: codes } = await admin.from('employees').select('employee_code').eq('company_id', owner.companyId);
    let max = 0;
    (codes ?? []).forEach((c) => {
      const m = /(\d+)$/.exec(c.employee_code ?? '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    employeeCode = `EMP-${String(max + 1).padStart(4, '0')}`;
    const { error: empErr } = await admin.from('employees').insert({
      company_id: owner.companyId,
      user_id: newUserId,
      employee_code: employeeCode,
      full_name: fullName,
      email,
      hire_date: cairoToday(),
      status: 'active',
    });
    if (empErr) { await rollback(); return json({ error: empErr.message }, 500); }
  }

  return json({ ok: true, user_id: newUserId, employee_code: employeeCode }, 201);
}

// ───────────── PATCH: تغيير الدور أو كلمة السر ─────────────
export async function PATCH(request: Request) {
  const owner = await requireOwner(request);
  if (!owner) return json({ error: 'غير مصرّح' }, 403);
  const admin = adminClient();
  if (!admin) return json({ error: 'إعداد الخادم ناقص: SUPABASE_SERVICE_ROLE_KEY' }, 500);

  const body = await readBody(request);
  if (!body) return json({ error: 'طلب غير صالح' }, 400);
  const target = String(body.user_id ?? '');
  if (!target) return json({ error: 'مستخدم غير محدد' }, 400);
  if (target === owner.userId) return json({ error: 'لا يمكن تعديل حسابك من هذه الصفحة' }, 400);

  const { data: mem } = await admin.from('company_members').select('role')
    .eq('user_id', target).eq('company_id', owner.companyId).maybeSingle();
  if (!mem) return json({ error: 'المستخدم غير موجود في شركتك' }, 404);
  if (mem.role === 'owner') return json({ error: 'لا يمكن تعديل حساب المالك' }, 400);

  if (typeof body.role === 'string') {
    if (!ASSIGNABLE_ROLES.includes(body.role)) return json({ error: 'الدور غير مسموح' }, 400);
    const { error } = await admin.from('company_members').update({ role: body.role })
      .eq('user_id', target).eq('company_id', owner.companyId);
    if (error) return json({ error: error.message }, 500);
  }

  if (typeof body.password === 'string') {
    if (body.password.length < 8 || body.password.length > 72) return json({ error: 'كلمة المرور من 8 إلى 72 حرفًا' }, 400);
    const { error } = await admin.auth.admin.updateUserById(target, { password: body.password });
    if (error) return json({ error: error.message }, 500);
  }

  return json({ ok: true });
}

// ───────────── DELETE: إزالة المستخدم ─────────────
export async function DELETE(request: Request) {
  const owner = await requireOwner(request);
  if (!owner) return json({ error: 'غير مصرّح' }, 403);
  const admin = adminClient();
  if (!admin) return json({ error: 'إعداد الخادم ناقص: SUPABASE_SERVICE_ROLE_KEY' }, 500);

  const body = await readBody(request);
  const target = String(body?.user_id ?? '');
  if (!target) return json({ error: 'مستخدم غير محدد' }, 400);
  if (target === owner.userId) return json({ error: 'لا يمكنك حذف حسابك' }, 400);

  const { data: mem } = await admin.from('company_members').select('role')
    .eq('user_id', target).eq('company_id', owner.companyId).maybeSingle();
  if (!mem) return json({ error: 'المستخدم غير موجود في شركتك' }, 404);
  if (mem.role === 'owner') return json({ error: 'لا يمكن حذف حساب المالك' }, 400);

  // 1) قطع الوصول فورًا: العضوية ثم فك ربط سجل الموظف (السجل نفسه يبقى بتاريخه)
  const { error: delErr } = await admin.from('company_members').delete()
    .eq('user_id', target).eq('company_id', owner.companyId);
  if (delErr) return json({ error: delErr.message }, 500);
  await admin.from('employees').update({ user_id: null })
    .eq('user_id', target).eq('company_id', owner.companyId);

  // 2) حذف الحساب نفسه فقط إن لم يبق مرتبطًا بأي شركة
  const { count } = await admin.from('company_members')
    .select('user_id', { count: 'exact', head: true }).eq('user_id', target);
  if ((count ?? 0) === 0) {
    const { error } = await admin.auth.admin.deleteUser(target);
    if (error) {
      return json({ ok: true, warning: 'تم قطع الوصول، لكن تعذر حذف الحساب نفسه: ' + error.message });
    }
  }
  return json({ ok: true });
}