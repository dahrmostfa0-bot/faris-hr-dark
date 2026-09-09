import Reveal from "./Reveal";

const pillars = [
  {
    title: "بيانات مركزية",
    desc: "كل معلومة عن موظفيك في قاعدة بيانات واحدة منظمة، بدل ملفات وجداول متفرقة.",
  },
  {
    title: "عمليات منظمة",
    desc: "الحضور والإجازات والطلبات تمر عبر سير عمل واضح بدل الورق والمكالمات.",
  },
  {
    title: "رؤية إدارية",
    desc: "لوحة تحكم تمنحك صورة لحظية عن فريقك وقسمك ومؤسستك.",
  },
];

export default function SolutionSection() {
  return (
    <section id="solution" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-snug">
            اجمع إدارة الموارد البشرية في مكان واحد
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            «فارس دحروج الذكي» يجمع العمليات الرئيسية لإدارة موظفيك في منصة واحدة.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <div className="relative bg-gradient-to-b from-indigo-50/70 to-white rounded-2xl border border-indigo-100 p-7 text-center h-full">
                <span className="absolute -top-3 right-6 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <h3 className="font-bold text-slate-900">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300} className="mt-10 text-center">
          <a
            href="#dashboard-preview"
            className="inline-flex items-center gap-2 text-indigo-600 font-semibold border border-indigo-200 px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            شاهد النظام
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
