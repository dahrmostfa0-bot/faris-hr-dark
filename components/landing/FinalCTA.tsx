import Reveal from "./Reveal";

export default function FinalCTA() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-3xl px-6 py-12 sm:px-12 sm:py-16 text-center overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-violet-400/20 blur-3xl" aria-hidden="true" />

            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-snug">
                جاهز ترى النظام بنفسك؟
              </h2>
              <p className="mt-4 text-indigo-100 max-w-xl mx-auto leading-relaxed">
                ابدأ بخطوة واحدة: اطلب نسخة تجريبية، وشاهد كيف يمكن لفارس دحروج الذكي
                أن يبسط إدارة موظفيك.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="#demo-form"
                  className="w-full sm:w-auto bg-white text-indigo-700 font-bold text-base px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl"
                >
                  طلب نسخة تجريبية
                </a>
                <a
                  href="#features"
                  className="w-full sm:w-auto border border-white/30 text-white font-semibold text-base px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  اكتشف المميزات
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
