import Reveal from "./Reveal";

const reasons = [
  "واجهة عربية واضحة",
  "تصميم حديث",
  "تنظيم مركزي للبيانات",
  "إدارة الصلاحيات حسب الدور",
  "إدارة الموظفين",
  "الحضور والإجازات",
  "الرواتب",
  "العقود",
  "الأرشفة",
  "قابلية التطوير والتوسع",
];

export default function WhyFaris() {
  return (
    <section className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-snug">
              لماذا فارس دحروج؟
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              نظام مبني حول احتياجات إدارة الموارد البشرية الحديثة،
              بواجهة عربية واضحة وتنظيم مركزي للبيانات،
              يمنح مؤسستك أساسًا متينًا لإدارة فريق العمل.
            </p>
            <p className="mt-3 text-slate-600 leading-relaxed">
              لا تحتاج إلى تغيير طريقة عمل مؤسستك بالكامل.
              ابدأ بخطوة واحدة: <strong className="text-slate-800">شاهد النظام.</strong>
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reasons.map((r) => (
                <div
                  key={r}
                  className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3.5 hover:border-indigo-200 transition-colors"
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-slate-700">{r}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
