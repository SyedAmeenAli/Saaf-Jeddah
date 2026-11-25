"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, HardHat, Users, BarChart3, Settings2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { ROLE_META } from "@/lib/domain";
import type { Role } from "@/lib/types";
import { Photo } from "@/components/ui/Photo";
import { SafaaLogo } from "@/components/shell/Brand";
import { LangPill } from "@/components/features/AuthShell";
import { cn } from "@/lib/utils";

const CROP = { operator: "tanker", supervisor: "tower", manager: "skyline", admin: "engine" } as const;
const ICON = { operator: HardHat, supervisor: Users, manager: BarChart3, admin: Settings2 };

export default function RolePage() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const lang = useStore((s) => s.lang);
  const [role, setRole] = useState<Role>("operator");
  const go = () => {
    login(role);
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/") ? next : "/dashboard");
  };
  return (
    <div className="relative min-h-dvh">
      <Photo crop="plane" className="!fixed inset-0 -z-[1]" scrim="from-[#050b18]/55 via-[#050b18]/70 to-[#050b18]/94" />
      <header className="flex items-center justify-between p-5 md:p-8"><SafaaLogo /><LangPill /></header>
      <main className="mx-auto max-w-4xl px-5 pb-16 pt-6 text-center">
        <h1 className="text-3xl font-semibold">{lang === "ar" ? "اختر دورك" : "Select Your Role"}</h1>
        <p className="mt-1 text-muted">Demo mode. You can switch role at any time from the sidebar.</p>
        <div role="radiogroup" aria-label="Role" className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(ROLE_META) as Role[]).map((r) => {
            const I = ICON[r], on = role === r;
            return (
              <button key={r} role="radio" aria-checked={on} onClick={() => setRole(r)}
                className={cn("glass group relative flex flex-col overflow-hidden text-start transition-all", on ? "!bg-teal/10 ring-1 ring-teal/70" : ".5 hover:bg-hi")} style={{ borderRadius: 8 }}>
                <Photo crop={CROP[r]} className="h-24 w-full" scrim="from-[#050b18]/10 to-[#050b18]/85" bloom={false} />
                {on && <span className="absolute end-3 top-3 flex size-6 items-center justify-center rounded-full bg-teal text-[#05110f]"><Check size={14} strokeWidth={3} /></span>}
                <div className="-mt-6 flex flex-col gap-1.5 p-4 pt-0">
                  <span className={cn("flex size-11 items-center justify-center rounded-xl border backdrop-blur", on ? "border-teal/60 bg-teal/25 text-teal" : "border-white/15 bg-[#0a1630]/80 text-white/80")}><I size={22} strokeWidth={1.5} /></span>
                  <span className="mt-1 text-base font-semibold">{lang === "ar" ? ROLE_META[r].labelAr : ROLE_META[r].label}</span>
                  <span className="text-xs leading-snug text-muted">{lang === "ar" ? ROLE_META[r].descAr : ROLE_META[r].desc}</span>
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={go} className="cta mt-8 inline-flex h-12 items-center gap-2 rounded-xl px-10">Continue <ArrowRight size={18} className="rtl:rotate-180" /></button>
      </main>
    </div>
  );
}
