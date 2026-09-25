import Reveal from "./Reveal";

const wastedSteps = [
  "البحث عن ملف",
  "مراجعة جدول",
  "الاتصال بالمسؤول",
  "مراجعة الحضور",
  "مراجعة الإجازات",
  "البحث عن العقد",
  "إعداد التقرير",
];

export default function CostSection() {
  return (
    <section className="py-16 lg:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            الوقت الذي يضيع في الإدارة... <span className="text-rose-500">له تكلفة</span>.
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            كل مهمة بسيطة تتطلب بحثًا في ملفات وجداول متفرقة، تتراكم مع الوقت
            وتستهلك ساعات من عمل فريقك.
          </p>
        </Reveal>

        {/* Flow */}
        <Reveal delay={150} className="mt-14">
          <div className="flex flex-col items-center gap-0 max-w-md mx-auto">
            {wastedSteps.map((step, i) => (
              <div key={step} className="flex flex-col items-center w-full">
                <div className="w-full bg-rose-50/80 border border-rose-100 text-rose-700 text-sm font-medium px-5 py-3 rounded-xl text-center">
                  {step}
                </div>
                {i < wastedSteps.length - 1 && (
                  <svg className="w-4 h-6 text-rose-300 my-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
              </div>
            ))}
            <div className="mt-4 text-center text-sm text-rose-500 font-medium">
              ...وتتكرر كل يوم
            </div>
          </div>
        </Reveal>

        <Reveal delay={250} className="mt-12 text-center">
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            ماذا لو كانت هذه المعلومات كلها <span className="text-indigo-600">أمامك</span>؟
          </p>
          <a
            href="#dashboard-preview"
            className="mt-5 inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
          >
            شاهد لوحة التحكم
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
          <p className="mt-4 text-xs text-slate-400">أقل وقت في البحث عن المعلومات، وأكثر وقت في إدارة مؤسستك.</p>
        </Reveal>
      </div>
    </section>
  );
}
