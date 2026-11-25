"use client";
import Link from "next/link";
import { ArrowRight, Layers, MapPin, Truck, BarChart3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { Photo } from "@/components/ui/Photo";
import { SafaaMark, ApscoWordmark } from "@/components/shell/Brand";
import { LangPill } from "@/components/features/AuthShell";

export default function Splash() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const pills = [
    [Layers, "JIG-aligned", "sampling & checks"],
    [Truck, "Mobile equipment", "refuellers & dispensers"],
    [BarChart3, "Reports &", "traceability"],
  ] as const;
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Photo crop="full" className="!fixed inset-0 -z-[1]" scrim="from-[#0d0818]/40 via-[#0d0818]/35 to-[#0d0818]/90" />
      <div className="pointer-events-none fixed inset-0 -z-[1] bg-gradient-to-r from-[#0d0818]/85 via-[#0d0818]/35 to-transparent" />
      <header className="flex items-center justify-between p-5 md:p-8">
        <div className="flex items-center gap-3"><ApscoWordmark /><span className="h-5 w-px bg-white/25" /><span className="flex items-center gap-1 text-sm text-white/80"><MapPin size={14} /> Jeddah, KSA</span></div>
        <LangPill />
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-16 md:px-10">
        <div className="max-w-xl">
          <div className="flex items-center gap-4">
            <span className="shrink-0"><SafaaMark size={64} /></span>
            <div>
              <div className="text-lg text-white/90" dir="rtl" lang="ar">صفاء</div>
              <div className="text-6xl font-semibold leading-none tracking-tight md:text-7xl">SAFAA</div>
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-medium text-white md:text-3xl">{lang === "ar" ? "ضمان جودة وقود الطيران" : "Aviation Fuel Quality Assurance"}</h1>
          <p className="mt-3 text-lg italic text-white/80">{t("Every sample. Every point. Proven.")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {pills.map(([I, a, b]) => (
              <div key={a} className="glass flex items-center gap-3 px-4 py-2.5 text-sm" style={{ borderRadius: 14 }}>
                <I size={20} strokeWidth={1.5} className="text-teal" />
                <span className="leading-tight"><span className="block font-medium">{a}</span><span className="block text-xs text-muted">{b}</span></span>
              </div>
            ))}
          </div>
          <Link href="/login" className="cta mt-10 inline-flex h-12 items-center gap-2 rounded-xl px-7">Get Started <ArrowRight size={18} className="rtl:rotate-180" /></Link>
        </div>
      </main>
    </div>
  );
}
