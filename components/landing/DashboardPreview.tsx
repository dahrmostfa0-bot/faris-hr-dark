import Reveal from "./Reveal";
import HeroDashboard from "./HeroDashboard";

export default function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="py-16 lg:py-24 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/50" aria-hidden="true" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-snug">
            ماذا لو كانت هذه المعلومات كلها أمامك؟
          </h2>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto">
            بدون بحث في الملفات، وبدون مكالمات ورسائل.
            لوحة تحكم واحدة تعرض لك ما تحتاجه.
          </p>
        </Reveal>

        <Reveal delay={200} className="mt-12">
          <div className="[&_.bg-white]:bg-slate-50">
            <HeroDashboard />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
