import HeroDashboard from "./HeroDashboard";
import Reveal from "./Reveal";

export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36 pb-16 lg:pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/80 via-white to-white" />
        <div className="absolute top-[-200px] left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute top-[-100px] right-[5%] w-[400px] h-[400px] rounded-full bg-violet-100/50 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            نظام ذكي لإدارة الموارد البشرية
          </div>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.3] max-w-4xl mx-auto">
            إدارة موظفيك أصبحت
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 to-violet-600"> أذكى وأسهل</span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            «فارس دحروج الذكي» يساعدك على تنظيم بيانات الموظفين، الحضور،
            الإجازات، الرواتب، العقود، الملفات والتوظيف من خلال منصة واحدة
            مصممة لتبسيط الإدارة.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="#demo-form"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white text-base font-semibold px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5"
            >
              طلب نسخة تجريبية
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </a>
            <a
              href="#dashboard-preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-700 text-base font-semibold px-8 py-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              استكشف النظام
            </a>
          </div>
        </Reveal>

        <Reveal delay={400}>
          <p className="mt-5 text-xs sm:text-sm text-slate-500">
            مناسب للمدارس والشركات والمؤسسات وأي جهة لديها فريق عمل
          </p>
        </Reveal>

        <Reveal delay={500}>
          <div className="mt-12 lg:mt-16 max-w-5xl mx-auto">
            <HeroDashboard />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
