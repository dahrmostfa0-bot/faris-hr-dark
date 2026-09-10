import Reveal from "./Reveal";

const points = [
  { title: "تسجيل دخول محمي", desc: "وصول النظام يتطلب مصادقة عبر حساب مسجل." },
  { title: "صلاحيات المستخدمين", desc: "كل مستخدم يصل إلى ما يخص دوره فقط." },
  { title: "حماية الوصول", desc: "حماية الصفحات الداخلية من الوصول غير المصرح به." },
  { title: "بنية Supabase", desc: "قاعدة بيانات سحابية منظمة وآمنة للبيانات." },
];

export default function SecuritySection() {
  return (
    <section className="py-16 lg:py-24 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-emerald-400 text-sm font-medium">الأمن والخصوصية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-snug">
              بيانات موظفيك تستحق الحماية
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              بيانات الموظفين معلومات حساسة. لذلك يطبق النظام آليات
              مصادقة وصلاحيات واضحة لضمان وصول كل مستخدم إلى ما يخصه فقط.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {points.map((p) => (
                <div
                  key={p.title}
                  className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-5"
                >
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="mt-3 font-semibold text-white text-sm">{p.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
