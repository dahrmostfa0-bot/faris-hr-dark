import Reveal from "./Reveal";

const sectors = [
  { icon: "🏫", title: "المدارس", desc: "إدارة المعلمين والإداريين والعمال والملفات والحضور والإجازات والرواتب." },
  { icon: "🏢", title: "الشركات", desc: "إدارة الموظفين والأقسام والحضور والإجازات والرواتب والعقود." },
  { icon: "🏭", title: "المصانع", desc: "تنظيم بيانات فرق العمل والموظفين والحضور والأقسام." },
  { icon: "🎓", title: "المراكز التعليمية", desc: "إدارة فريق العمل والموظفين والمدربين والإداريين." },
  { icon: "🏥", title: "المؤسسات الصحية", desc: "إدارة بيانات الموظفين والأقسام والملفات." },
  { icon: "🏪", title: "المتاجر والفروع", desc: "تنظيم فرق العمل والموظفين والفروع." },
  { icon: "🏛️", title: "المؤسسات والجمعيات", desc: "إدارة الموظفين والملفات والحضور والإجازات." },
  { icon: "👥", title: "أي مؤسسة لديها فريق عمل", desc: "النظام قابل للتكيف مع احتياجات المؤسسات المختلفة حسب طبيعة العمل." },
];

export default function SectorsSection() {
  return (
    <section id="sectors" className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            مصمم لمختلف أنواع المؤسسات
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            النظام ليس مخصصًا لقطاع واحد. أي جهة لديها موظفون أو عمال أو فرق عمل
            يمكنها الاستفادة منه.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectors.map((s, i) => (
            <Reveal key={s.title} delay={(i % 4) * 60}>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 h-full hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-1 transition-all duration-300 text-center">
                <span className="text-3xl" aria-hidden="true">{s.icon}</span>
                <h3 className="mt-3 font-bold text-slate-900 text-sm">{s.title}</h3>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
