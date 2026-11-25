"use client";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { Photo, type Crop } from "@/components/ui/Photo";
import { SafaaLogo, ApscoWordmark } from "@/components/shell/Brand";
import { cn } from "@/lib/utils";

export function LangPill() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  return (
    <div className="glass flex h-9 items-center rounded-full p-0.5 text-xs font-semibold" style={{ borderRadius: 9999 }} role="group" aria-label="Language">
      {(["en", "ar"] as const).map((l) => (
        <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={cn("h-8 rounded-full px-3", lang === l ? "bg-white/15 text-white" : "text-muted")}>{l === "en" ? "EN" : "عربي"}</button>
      ))}
    </div>
  );
}

/** Full-bleed photographic shell for the auth screens, with a glass card. */
export function AuthShell({ crop = "engine", title, subtitle, children, footer }: { crop?: Crop; title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <Photo crop={crop} className="!fixed inset-0 -z-[1]" scrim="from-[#050b18]/45 via-[#050b18]/60 to-[#050b18]/92" />
      <header className="flex items-center justify-between p-5 md:p-8">
        <Link href="/" className="flex items-center gap-3"><ApscoWordmark /><span className="h-5 w-px bg-white/25" /><span className="flex items-center gap-1 text-sm text-muted"><MapPin size={14} /> Jeddah</span></Link>
        <LangPill />
      </header>
      <main className="mx-auto flex w-full max-w-[28rem] flex-col px-5 pb-16 pt-4 md:pt-10">
        <div className="glass glass-strong p-6 md:p-8" style={{ borderRadius: 8 }}>
          <div className="mb-6 flex flex-col items-center"><SafaaLogo stacked size={40} /></div>
          <h1 className="text-center text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-center text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
        <p className="mt-6 text-center text-[11px] leading-relaxed text-faint">Illustrative demo data. Final checklist and acceptance criteria to be approved by APSCO Quality Control against controlled copies of the applicable standards.</p>
      </main>
    </div>
  );
}
