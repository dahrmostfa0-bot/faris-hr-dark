import Reveal from "./Reveal";

const stats = [
  { label: "إجمالي الموظفين", value: "128", change: "+4 هذا الشهر", icon: "users" },
  { label: "حضور اليوم", value: "112", change: "87.5%", icon: "check" },
  { label: "إجازات معلّقة", value: "3", change: "بانتظار الموافقة", icon: "leave" },
  { label: "أقسام نشطة", value: "9", change: "منظم بالكامل", icon: "dept" },
];

const departments = [
  { name: "الإدارة العامة", count: 22, pct: 100 },
  { name: "التعليم", count: 48, pct: 92 },
  { name: "المالية", count: 12, pct: 78 },
  { name: "الموارد البشرية", count: 8, pct: 65 },
  { name: "الصيانة", count: 15, pct: 54 },
  { name: "تقنية المعلومات", count: 10, pct: 45 },
];

const recentRequests = [
  { name: "أحمد العمري", type: "طلب إجازة", status: "معلّق", color: "bg-amber-100 text-amber-700" },
  { name: "سارة الخطيب", type: "طلب إجازة", status: "تمت الموافقة", color: "bg-emerald-100 text-emerald-700" },
  { name: "محمد الشمري", type: "تسجيل حضور", status: "مكتمل", color: "bg-sky-100 text-sky-700" },
];

function StatIcon({ type }: { type: string }) {
  const paths: Record<string, React.ReactNode> = {
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    leave: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    dept: <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  };
  return (
    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {paths[type]}
    </svg>
  );
}

export default function HeroDashboard() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-b from-indigo-200/40 to-transparent rounded-3xl blur-2xl" aria-hidden="true" />

      <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden text-right">
        {/* Window bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs text-slate-400 font-medium">فارس دحروج الذكي — لوحة التحكم (بيانات تجريبية)</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Stats row */}
          <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">{s.label}</span>
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <StatIcon type={s.icon} />
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</span>
                <span className="block text-[10px] sm:text-xs text-slate-400 mt-1">{s.change}</span>
              </div>
            ))}
          </div>

          {/* Departments chart */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">الموظفون حسب القسم</h3>
            <div className="space-y-3">
              {departments.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-28 sm:w-32 shrink-0 truncate">{d.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-indigo-500 to-violet-500 rounded-full"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500 w-6 text-left">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent requests */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">أحدث الطلبات</h3>
            <div className="space-y-3">
              {recentRequests.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div>
                    <span className="block text-xs font-medium text-slate-800">{r.name}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{r.type}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full shrink-0 ${r.color}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400">جميع الأرقام في هذه اللوحة بيانات تجريبية للعرض فقط</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
