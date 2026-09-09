import Reveal from "./Reveal";

const schoolItems = [
  "المعلمين", "الإداريين", "العمال", "الحضور",
  "الغياب", "الإجازات", "العقود", "الملفات",
  "الرواتب", "الأقسام",
];

export default function SchoolsSection() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Reveal>
            <div>
              <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4">
                قطاع التعليم
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-snug">
                حل ذكي لإدارة العاملين في المدارس
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                المدارس من أكثر البيئات التي تحتاج إلى تنظيم: فريق متنوع من المعلمين
                والإداريين والعمال، وحضور يومي، وإجازات، وعقود، ورواتب.
                النظام يجمع كل ذلك في مكان واحد.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {schoolItems.map((item) => (
                  <span
                    key={item}
                    className="text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-lg"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <a
                href="#demo-form"
                className="mt-7 inline-flex items-center gap-2 text-indigo-600 font-semibold hover:gap-3 transition-all"
              >
                اطلب نسخة تجريبية لمداستك
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14V5" />
                </svg>
              </a>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 sm:p-10 text-white overflow-hidden">
              <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <div className="relative">
                <h3 className="text-lg font-bold">لكن فارس دحروج لا يتوقف عند المدارس...</h3>
                <p className="mt-3 text-sm text-indigo-100 leading-relaxed">
                  النظام مناسب أيضًا للشركات والمصانع والمراكز التعليمية
                  والمؤسسات الصحية والمتاجر والجمعيات —
                  <strong className="text-white"> أي جهة لديها فريق عمل.</strong>
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {["الشركات", "المصانع", "المؤسسات الصحية", "الجمعيات"].map((s) => (
                    <div key={s} className="bg-white/10 backdrop-blur rounded-xl px-4 py-3 text-sm font-medium text-center">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
