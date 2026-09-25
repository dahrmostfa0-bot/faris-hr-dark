"use client";

import { useEffect, useState } from "react";

export default function MobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    document.getElementById("demo-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button
          onClick={handleClick}
          className="w-full bg-indigo-600 text-white text-sm font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
        >
          طلب نسخة تجريبية
        </button>
      </div>
    </div>
  );
}
