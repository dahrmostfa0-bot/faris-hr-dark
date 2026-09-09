import Reveal from "./Reveal";

const before = [
  "ملفات كثيرة",
  "جداول متفرقة",
  "بحث يدوي",
  "معلومات موزعة",
  "متابعة مرهقة",
  "صعوبة في رؤية الصورة الكاملة",
];

const after = [
  "معلومات مركزية",
  "لوحة تحكم",
  "ملفات منظمة",
  "متابعة الحضور",
  "إدارة الإجازات",
  "تنظيم الرواتب",
  "إدارة العقود",
  "وصول أسهل للمعلومات",
];

export default function BeforeAfter() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            ما الفرق الذي يحدثه النظام؟
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Before */}
          <Reveal>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6 sm:p-8 h-full">
              <h3 className="font-bold text-rose-700 text-lg">قبل النظام</h3>
              <ul className="mt-5 space-y-3">
                {before.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* After */}
          <Reveal delay={120}>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 sm:p-8 h-full">
              <h3 className="font-bold text-emerald-700 text-lg">مع فارس دحروج</h3>
              <ul className="mt-5 space-y-3">
                {after.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
