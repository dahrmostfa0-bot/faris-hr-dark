import Reveal from "./Reveal";

const values = [
  { title: "تنظيم أكبر", desc: "بيانات الموظفين في مكان واحد بدل التشتت بين الملفات والجداول." },
  { title: "متابعة أسهل", desc: "الحضور والإجازات والطلبات بصورة منظمة وواضحة." },
  { title: "وصول أسرع للمعلومات", desc: "بدل البحث في الملفات والجداول المتفرقة." },
  { title: "رؤية أوضح للإدارة", desc: "لوحة تحكم ومعلومات مركزية تعرض الصورة الكاملة." },
  { title: "أرشفة أفضل", desc: "الوصول إلى المستندات بصورة منظمة في أي وقت." },
  { title: "إدارة أكثر احترافية", desc: "نظام واحد بدل الاعتماد على أدوات متفرقة." },
];

export default function ValueSection() {
  return (
    <section className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            ماذا ستتغير في طريقة عمل مؤسستك؟
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            عندما تكون معلومات فريقك في مكان واحد، تصبح الإدارة أكثر وضوحًا.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={(i % 3) * 80}>
              <div className="flex items-start gap-4 bg-white rounded-2xl border border-slate-100 p-5 h-full hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300">
                <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-emerald-600 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{v.title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
