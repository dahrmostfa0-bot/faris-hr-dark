"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type DemoRequest = {
  id: string;
  org_name: string;
  contact_name: string;
  email: string;
  phone: string;
  org_type: string;
  employee_count: number | null;
  branches_count: number | null;
  message: string | null;
  status: string;
  created_at: string;
};

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "replied">("all");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("demo_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("خطأ في جلب الطلبات:", error.message);
      }
      setRequests((data ?? []) as DemoRequest[]);
      setLoading(false);
    };
    load();
  }, []);

  const markReplied = async (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "replied" } : r))
    );
    const { error } = await supabase
      .from("demo_requests")
      .update({ status: "replied", replied_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("خطأ في التحديث:", error.message);
  };

  const whatsappLink = (phone: string, name: string) =>
    `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
      `مرحباً ${name}، معك فارس دحروج الذكي — شكراً لاهتمامكم بالنظام 🌹`
    )}`;

  const visible =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const newCount = requests.filter((r) => r.status !== "replied").length;

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400 animate-pulse">جاري تحميل الطلبات...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
      {/* الرأس */}
      <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            📬 صندوق طلبات التجربة
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            طلبات العملاء الجدد — واتساب مباشر لكل عميل
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 rounded-lg px-3 py-2"
        >
          → لوحة التحكم
        </button>
      </div>

      {/* الفلاتر */}
      <div className="max-w-6xl mx-auto flex gap-2 mb-5">
        {(
          [
            { key: "all", label: `الكل (${requests.length})` },
            { key: "new", label: `🟡 جديد (${newCount})` },
            {
              key: "replied",
              label: `✅ تم الرد (${requests.length - newCount})`,
            },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* الطلبات */}
      <div className="max-w-6xl mx-auto space-y-3">
        {visible.length === 0 && (
          <div className="text-center py-16 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
            لا توجد طلبات في هذه القائمة
          </div>
        )}

        {visible.map((r) => (
          <div
            key={r.id}
            className={`rounded-2xl border p-5 transition-colors ${
              r.status === "replied"
                ? "border-slate-800 bg-slate-900/50"
                : "border-indigo-500/40 bg-slate-800/60 hover:border-indigo-400"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              {/* البيانات */}
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white">{r.contact_name}</h3>
                  <span className="text-slate-400 text-sm">— {r.org_name}</span>
                  {r.status !== "replied" && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                      جديد
                    </span>
                  )}
                  {r.status === "replied" && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                      تم الرد
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {r.org_type}
                  {r.employee_count ? ` · ${r.employee_count} موظف` : ""}
                  {r.branches_count ? ` · ${r.branches_count} فروع` : ""}
                  {" · "}
                  {new Date(r.created_at).toLocaleDateString("ar-EG")}
                </p>
                {r.message && (
                  <p className="text-sm text-slate-400 mt-2 bg-slate-900/60 rounded-lg px-3 py-2">
                    {r.message}
                  </p>
                )}
              </div>

              {/* الإجراءات */}
              <div className="flex flex-wrap gap-2">
                <a
                  href={whatsappLink(r.phone, r.contact_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  💬 واتساب
                </a>
                <a
                  href={`mailto:${r.email}`}
                  className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl transition-colors"
                >
                  ✉️ بريد
                </a>
                {r.status !== "replied" && (
                  <button
                    onClick={() => markReplied(r.id)}
                    className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    ✅ تم الرد
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}