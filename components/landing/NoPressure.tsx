import Reveal from "./Reveal";

export default function NoPressure() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="bg-gradient-to-l from-indigo-50 to-violet-50 border border-indigo-100 rounded-3xl p-8 sm:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              لا تحتاج إلى اتخاذ قرار الآن
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              اطلب نسخة تجريبية، تعرّف على النظام، شاهد كيف يعمل،
              ثم قرر ما إذا كان مناسبًا لمؤسستك.
            </p>
            <a
              href="#demo-form"
              className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-7 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
            >
              طلب نسخة تجريبية
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
