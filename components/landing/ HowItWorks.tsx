import Reveal from "./Reveal";

const steps = [
  { num: "01", title: "اطلب النسخة التجريبية", desc: "أرسل بيانات مؤسستك من خلال النموذج." },
  { num: "02", title: "نتعرف على احتياجاتك", desc: "نفهم طبيعة عمل مؤسستك وطريقة تنظيمها." },
  { num: "03", title: "شاهد النظام", desc: "تتعرف على طريقة عمل النظام وواجهاته." },
  { num: "04", title: "قرر بنفسك", desc: "جرّب النظام وقيّم مدى مناسبته لمؤسستك." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            كيف يعمل النظام؟
          </h2>
          <p className="mt-4 text-xl font-semibold text-indigo-600">
            جرّب أولًا... ثم قرر.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 100}>
              <div className="relative bg-white rounded-2xl border border-slate-100 p-6 h-full hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300">
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-indigo-200 to-indigo-100">
                  {s.num}
                </span>
                <h3 className="mt-3 font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <svg className="hidden lg:block absolute top-1/2 -left-3.5 w-7 h-7 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14V5" />
                  </svg>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
