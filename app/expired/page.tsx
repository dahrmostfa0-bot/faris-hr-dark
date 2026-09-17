export const metadata = {
  title: "انتهت فترة الخدمة | فارس دحروج الذكي",
};

export default function ExpiredPage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex items-center justify-center px-4"
    >
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center">
        {/* أيقونة تنبيه */}
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900">
          انتهت فترة الخدمة
        </h1>

        <p className="mt-4 text-slate-600 leading-relaxed">
          انتهت فترة اشتراك هذه النسخة من النظام.
          <br />
          <strong className="text-slate-800">
            بياناتكم محفوظة بأمان كامل
          </strong>{" "}
          وستعود الخدمة فورًا بعد تجديد الاشتراك.
        </p>

        <a
          href="https://wa.me/2001553830995?text=%D9%85%D8%B1%D8%AD%D8%A8%D9%8B%D8%A7%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%AA%D8%AC%D8%AF%D9%8A%D8%AF%20%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%86%D8%B8%D8%A7%D9%85%20%D9%81%D8%A7%D8%B1%D8%B3%20%D8%AF%D8%AD%D8%B1%D9%88%D8%AC%20%D8%A7%D9%84%D8%B0%D9%83%D9%8A"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          التجديد عبر واتساب
        </a>

        <p className="mt-6 text-xs text-slate-400">
          فارس دحروج الذكي — إدارة الموارد البشرية
        </p>
      </div>
    </div>
  );
}
