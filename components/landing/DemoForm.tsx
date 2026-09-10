 "use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

const orgTypes = [
  "مدرسة",
  "شركة",
  "مؤسسة",
  "مصنع",
  "مركز تعليمي",
  "جمعية",
  "مؤسسة صحية",
  "متجر / سلسلة",
  "أخرى",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

export default function DemoForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    org_name: "",
    contact_name: "",
    email: "",
    phone: "",
    org_type: "",
    employee_count: "",
    branches_count: "",
    message: "",
  });

  const update = (key: string, value: string) =>
    setFormData((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.org_name.trim()) errors.org_name = "يرجى إدخال اسم المؤسسة";
    if (!formData.contact_name.trim()) errors.contact_name = "يرجى إدخال اسم المسؤول";
    if (!formData.email.trim()) {
      errors.email = "يرجى إدخال البريد الإلكتروني";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "يرجى إدخال بريد إلكتروني صحيح";
    }
    if (!formData.phone.trim()) {
      errors.phone = "يرجى إدخال رقم الهاتف";
    } else if (!/^[0-9+\-\s()]{8,}$/.test(formData.phone.trim())) {
      errors.phone = "يرجى إدخال رقم هاتف صحيح";
    }
    if (!formData.org_type) errors.org_type = "يرجى اختيار نوع المؤسسة";
    return errors;
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // منع الإرسال المزدوج
    if (status === "loading") return;

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setErrorMsg("يرجى تصحيح الحقول المطلوبة قبل الإرسال.");
      return;
    }

    setErrorMsg("");
    setStatus("loading");

    try {
      // ✅ طلب fetch حقيقي إلى الـ API
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // ✅ قراءة الرد وفحص النجاح الفعلي
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error || "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى."
        );
      }

      // النجاح فقط بعد تأكيد الخادم
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى."
      );
    }
  }

  // شاشة النجاح
  if (status === "success") {
    return (
      <section id="demo-form" className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-12 text-center shadow-lg shadow-emerald-600/5">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-900">
              تم إرسال طلبك بنجاح 🎉
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              شكرًا لاهتمامك بفارس دحروج الذكي.
              سنراجع بيانات الطلب ونتواصل معك.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="demo-form" className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            اطلب نسختك التجريبية
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            أخبرنا قليلًا عن مؤسستك، وسنتواصل معك للتعرف على احتياجاتك وتعريفك بالنظام.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-6 sm:p-8 space-y-5"
          noValidate
        >
          {status === "error" && errorMsg && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3" role="alert">
              <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-rose-700">{errorMsg}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="org_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                اسم المؤسسة <span className="text-rose-500">*</span>
              </label>
              <input
                id="org_name" type="text" required
                className={`${inputClass} ${fieldErrors.org_name ? "border-rose-400" : ""}`}
                placeholder="مثال: مدرسة الأمل"
                value={formData.org_name}
                onChange={(e) => update("org_name", e.target.value)}
                disabled={status === "loading"}
              />
              {fieldErrors.org_name && <p className="mt-1 text-xs text-rose-600">{fieldErrors.org_name}</p>}
            </div>

            <div>
              <label htmlFor="contact_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                اسم المسؤول <span className="text-rose-500">*</span>
              </label>
              <input
                id="contact_name" type="text" required
                className={`${inputClass} ${fieldErrors.contact_name ? "border-rose-400" : ""}`}
                placeholder="الاسم الكامل"
                value={formData.contact_name}
                onChange={(e) => update("contact_name", e.target.value)}
                disabled={status === "loading"}
              />
              {fieldErrors.contact_name && <p className="mt-1 text-xs text-rose-600">{fieldErrors.contact_name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                البريد الإلكتروني <span className="text-rose-500">*</span>
              </label>
              <input
                id="email" type="email" required dir="ltr"
                className={`${inputClass} text-left ${fieldErrors.email ? "border-rose-400" : ""}`}
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => update("email", e.target.value)}
                disabled={status === "loading"}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                رقم الهاتف / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                id="phone" type="tel" required dir="ltr"
                className={`${inputClass} text-left ${fieldErrors.phone ? "border-rose-400" : ""}`}
                placeholder="+966 5X XXX XXXX"
                value={formData.phone}
                onChange={(e) => update("phone", e.target.value)}
                disabled={status === "loading"}
              />
              {fieldErrors.phone && <p className="mt-1 text-xs text-rose-600">{fieldErrors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label htmlFor="org_type" className="block text-sm font-medium text-slate-700 mb-1.5">
                نوع المؤسسة <span className="text-rose-500">*</span>
              </label>
              <select
                id="org_type" required
                className={`${inputClass} ${fieldErrors.org_type ? "border-rose-400" : ""} ${!formData.org_type ? "text-slate-400" : ""}`}
                value={formData.org_type}
                onChange={(e) => update("org_type", e.target.value)}
                disabled={status === "loading"}
              >
                <option value="" disabled>اختر النوع</option>
                {orgTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {fieldErrors.org_type && <p className="mt-1 text-xs text-rose-600">{fieldErrors.org_type}</p>}
            </div>

            <div>
              <label htmlFor="employee_count" className="block text-sm font-medium text-slate-700 mb-1.5">
                عدد الموظفين التقريبي
              </label>
              <input
                id="employee_count" type="number" min="1"
                className={inputClass}
                placeholder="مثال: 50"
                value={formData.employee_count}
                onChange={(e) => update("employee_count", e.target.value)}
                disabled={status === "loading"}
              />
            </div>

            <div>
              <label htmlFor="branches_count" className="block text-sm font-medium text-slate-700 mb-1.5">
                عدد الفروع
              </label>
              <input
                id="branches_count" type="number" min="1"
                className={inputClass}
                placeholder="مثال: 2"
                value={formData.branches_count}
                onChange={(e) => update("branches_count", e.target.value)}
                disabled={status === "loading"}
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">
              الرسالة / الاحتياج
            </label>
            <textarea
              id="message" rows={4}
              className={`${inputClass} resize-none`}
              placeholder="أخبرنا باحتياج مؤسستك أو أي ملاحظات إضافية..."
              value={formData.message}
              onChange={(e) => update("message", e.target.value)}
              disabled={status === "loading"}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-indigo-600 text-white font-bold text-base py-4 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                جارٍ إرسال الطلب...
              </>
            ) : (
              "طلب النسخة التجريبية"
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            بياناتك تُستخدم فقط للتواصل معك بشأن النسخة التجريبية.
          </p>
        </form>
      </div>
    </section>
  );
}
