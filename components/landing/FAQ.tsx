"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const faqs = [
  {
    q: "ما هو فارس دحروج الذكي؟",
    a: "نظام ذكي لإدارة الموارد البشرية يساعد المؤسسات على تنظيم بيانات الموظفين، الحضور، الإجازات، الرواتب، العقود، الملفات والتوظيف من خلال منصة واحدة.",
  },
  {
    q: "لمن يناسب النظام؟",
    a: "يناسب أي مؤسسة لديها موظفون أو عمال أو فرق عمل: مدارس، شركات، مؤسسات، مصانع، مراكز تعليمية، مؤسسات صحية، متاجر، وجمعيات.",
  },
  {
    q: "هل هو مخصص للمدارس فقط؟",
    a: "لا. المدارس قطاع مهم، لكن النظام مصمم لإدارة الموارد البشرية في مختلف أنواع المؤسسات.",
  },
  {
    q: "ما المميزات الأساسية؟",
    a: "إدارة الموظفين، الحضور والانصراف، الإجازات، الرواتب، العقود، الأرشفة الإلكترونية، الأقسام، التقارير والمؤشرات، الإشعارات، ولوحة تحكم مركزية.",
  },
  {
    q: "هل يمكن تجربة النظام؟",
    a: "نعم، يمكنك طلب نسخة تجريبية مجانية من خلال النموذج في هذه الصفحة، وسنتواصل معك لترتيب التجربة.",
  },
  {
    q: "كيف أطلب نسخة تجريبية؟",
    a: "املأ نموذج طلب النسخة التجريبية في هذه الصفحة ببيانات مؤسستك، وسنتواصل معك في أقرب وقت.",
  },
  {
    q: "هل بياناتي آمنة؟",
    a: "يطبق النظام مصادقة تسجيل دخول وصلاحيات مستخدمين واضحة، مع بنية بيانات سحابية منظمة لضمان حماية وصول المعلومات.",
  },
  {
    q: "هل يدعم اللغة العربية؟",
    a: "نعم، النظام بواجهة عربية كاملة مصممة بالكامل باللغة العربية.",
  },
  {
    q: "هل يمكن استخدامه من الهاتف؟",
    a: "النظام يعمل عبر المتصفح ويمكن الوصول إليه من مختلف الأجهزة، بما في ذلك الهواتف الذكية.",
  },
  {
    q: "هل يناسب المؤسسات الصغيرة؟",
    a: "نعم. النظام يساعد المؤسسات الصغيرة على بناء تنظيم صحيح لبيانات موظفيها منذ البداية، ويتوسع مع نمو المؤسسة.",
  },
  {
    q: "هل يناسب المؤسسات التي لديها عدد كبير من الموظفين؟",
    a: "نعم، النظام مبني على تنظيم البيانات مركزيًا مما يسمح بإدارة أعداد كبيرة من الموظفين والأقسام بشكل منظم.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 lg:py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            الأسئلة الشائعة
          </h2>
          <p className="mt-4 text-slate-600">
            إجابات عن أكثر الأسئلة تكرارًا حول النظام.
          </p>
        </Reveal>

        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={i} delay={Math.min(i * 40, 200)}>
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  aria-expanded={openIndex === i}
                >
                  <span className="font-semibold text-slate-900 text-sm sm:text-base">{f.q}</span>
                  <svg
                    className={`w-5 h-5 text-indigo-600 shrink-0 transition-transform duration-300 ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openIndex === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 sm:px-6 pb-5 text-sm text-slate-600 leading-relaxed">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
