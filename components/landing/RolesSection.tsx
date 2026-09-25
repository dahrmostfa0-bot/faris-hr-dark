import Reveal from "./Reveal";

const roles = [
  { title: "صاحب المؤسسة", desc: "رؤية عامة ومعلومات تساعده على متابعة المؤسسة." },
  { title: "مدير الموارد البشرية", desc: "إدارة الموظفين والملفات والإجازات والحضور." },
  { title: "المسؤول المالي", desc: "الوصول إلى بيانات الرواتب والمستحقات المتاحة له." },
  { title: "المدير", desc: "متابعة المعلومات والطلبات المتعلقة بفريقه." },
  { title: "الموظف", desc: "الوصول إلى الخدمات المتاحة له وفق صلاحيات النظام." },
];

export default function RolesSection() {
  return (
    <section className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            كل مسؤول يرى ما يحتاجه
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            النظام يعتمد صلاحيات واضحة لكل دور، بحيث يصل كل مستخدم
            إلى المعلومات التي تخص عمله.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((r, i) => (
            <Reveal key={r.title} delay={(i % 3) * 80} className={i === 4 ? "lg:col-start-2" : ""}>
              <div className="bg-white rounded-2xl border border-slate-100 p-6 h-full text-center hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{r.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{r.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
