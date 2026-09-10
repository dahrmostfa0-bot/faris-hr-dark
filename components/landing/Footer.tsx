export default function Footer() {
  const year = new Date().getFullYear();

  const links = [
    { href: "#hero", label: "الرئيسية" },
    { href: "#features", label: "المميزات" },
    { href: "#sectors", label: "القطاعات" },
    { href: "#demo-form", label: "طلب نسخة تجريبية" },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="leading-tight">
                <span className="block font-bold text-white text-sm">فارس دحروج الذكي</span>
                <span className="block text-[10px] text-slate-400">إدارة الموارد البشرية</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              نظام متكامل لإدارة الموارد البشرية مناسب للمدارس والشركات والمؤسسات.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">روابط سريعة</h3>
            <ul className="space-y-2.5">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-4">تواصل معنا</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a href="#demo-form" className="hover:text-white transition-colors">
                  طلب نسخة تجريبية
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-white transition-colors">
                  تسجيل الدخول
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            © {year} فارس دحروج الذكي — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
}
