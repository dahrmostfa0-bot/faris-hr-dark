import Reveal from "./Reveal";

const objections = [
  {
    q: "هل النظام مناسب لي إذا كنت لا أملك شركة كبيرة؟",
    a: "النظام موجه للمؤسسات التي تحتاج إلى تنظيم وإدارة فريق عمل، سواء كانت مدرسة أو شركة أو مؤسسة صغيرة.",
  },
  {
    q: "هل أحتاج إلى خبرة تقنية؟",
    a: "الواجهة عربية وواضحة ومصممة لتكون سهلة الاستخدام، ولا تحتاج إلى خلفية تقنية لاستخدامها.",
  },
  {
    q: "هل يمكنني تجربة النظام أولًا؟",
    a: "نعم، من خلال طلب نسخة تجريبية. ستتعرف على النظام قبل اتخاذ أي قرار.",
  },
  {
    q: "هل النظام مخصص للمدارس؟",
    a: "لا، يمكن استخدامه لإدارة الموارد البشرية في أنواع مختلفة من المؤسسات: شركات، مصانع، مراكز تعليمية، جمعيات، وأكثر.",
  },
  {
    q: "هل يمكن تطوير النظام حسب احتياجات مؤسستي؟",
    a: "يمكن مناقشة احتياجات مؤسستك ومعرفة مدى توافقها مع النظام عند التواصل.",
  },
];

export default function Objections() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            ربما تتساءل...
          </h2>
        </Reveal>

        <div className="mt-10 space-y-4">
          {objections.map((o, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 sm:p-6">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{o.q}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{o.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
