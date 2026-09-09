import Reveal from "./Reveal";

const problems = [
  { icon: "📁", title: "ملفات ومستندات كثيرة", desc: "أوراق متفرقة يصعب تتبعها" },
  { icon: "📊", title: "جداول Excel متفرقة", desc: "كل قسم بنسخة مختلفة" },
  { icon: "⏰", title: "متابعة الحضور والغياب", desc: "تسجيل يدوي يومي مرهق" },
  { icon: "📝", title: "طلبات الإجازات", desc: "أوراق تنتظر توقيعات" },
  { icon: "💰", title: "بيانات الرواتب", desc: "حسابات معقدة في ملفات منفصلة" },
  { icon: "📄", title: "العقود والمستندات", desc: "بحث طويل عند الحاجة" },
  { icon: "🔎", title: "البحث عن معلومات", desc: "سؤال عدة أشخاص لإيجاد معلومة" },
  { icon: "📈", title: "صعوبة رؤية الصورة الكاملة", desc: "لا يوجد مصدر موحد للمعلومات" },
];

export default function ProblemSection() {
  return (
    <section className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-snug">
            هل ما زالت إدارة الموظفين تستهلك وقتك؟
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            إذا كنت تعتمد على ملفات وجداول وأوراق متفرقة، فأنت لست وحدك.
            هذه أكثر التحديات شيوعًا في إدارة الموارد البشرية.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {problems.map((p, i) => (
            <Reveal key={p.title} delay={i * 60}>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 h-full hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-1 transition-all duration-300">
                <span className="text-2xl" aria-hidden="true">{p.icon}</span>
                <h3 className="mt-3 font-semibold text-slate-800 text-sm">{p.title}</h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mt-14 text-center">
          <p className="text-lg sm:text-xl text-slate-500 font-medium">
            المشكلة ليست في كثرة الموظفين...
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
            المشكلة في <span className="text-rose-500">تشتت المعلومات</span>.
          </p>
          <a href="#solution" className="mt-6 inline-flex items-center gap-2 text-indigo-600 font-semibold hover:gap-3 transition-all">
            تعرف على الحل
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14V5" />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
