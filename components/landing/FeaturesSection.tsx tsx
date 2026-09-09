import Reveal from "./Reveal";

const features = [
  {
    title: "إدارة الموظفين",
    desc: "ملفات الموظفين وبياناتهم ومعلوماتهم في مكان منظم وسهل الوصول.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    title: "الحضور والانصراف",
    desc: "متابعة الحضور والغياب والتأخير بشكل يومي ومنظم.",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "الإجازات",
    desc: "إدارة طلبات الإجازات والموافقة عليها ومتابعتها خطوة بخطوة.",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    title: "الرواتب",
    desc: "تنظيم بيانات الرواتب والمستحقات والخصومات والحوافز حسب ما هو مطبق في مؤسستك.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "العقود",
    desc: "تنظيم بيانات عقود الموظفين والوصول إليها عند الحاجة.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    title: "الأرشفة الإلكترونية",
    desc: "تنظيم المستندات والملفات الخاصة بالموظفين رقميًا.",
    icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  },
  {
    title: "الأقسام",
    desc: "تنظيم الموظفين حسب الإدارات والأقسام داخل مؤسستك.",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    title: "التقارير والمؤشرات",
    desc: "عرض المعلومات بطريقة تساعد الإدارة على اتخاذ قرارات أفضل.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    title: "الإشعارات",
    desc: "متابعة التنبيهات والطلبات الجديدة لحظة بلحظة.",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1h6z",
  },
  {
    title: "لوحة التحكم",
    desc: "رؤية مركزية للمعلومات المهمة في شاشة واحدة.",
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            كل ما تحتاجه لإدارة موظفيك... في نظام واحد
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            من الحضور والإجازات إلى الرواتب والعقود وملفات الموظفين —
            إدارة مواردك البشرية من مكان واحد.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 80}>
              <div className="group bg-white rounded-2xl border border-slate-100 p-6 h-full hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-600/5 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300">
                  <svg
                    className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors duration-300"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mt-10 text-center">
          <a
            href="#demo-form"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
          >
            طلب نسخة تجريبية
          </a>
        </Reveal>
      </div>
    </section>
  );
}
