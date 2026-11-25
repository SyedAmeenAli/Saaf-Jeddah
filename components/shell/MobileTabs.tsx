"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MoreHorizontal, ScanLine } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MOBILE_TABS, ROLE_NAV } from "./nav";
import { RoleSwitcher, SignOut, LangToggle } from "./Controls";
import { GlassDropdown, Modal } from "@/components/ui/Glass";

/** Floating frosted-glass bottom bar. Tabs and the optional centre action come from the active role. */
export function MobileTabs() {
  const pathname = usePathname();
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);
  const locations = useStore((s) => s.locations);
  const active = useStore((s) => s.activeLocation);
  const setActive = useStore((s) => s.setActiveLocation);
  const t = useT();
  const [more, setMore] = useState(false);
  const cfg = MOBILE_TABS[role];
  const items = ROLE_NAV[role];
  const find = (h: string) => items.find((n) => n.href === h)!;
  const used = [...cfg.left, cfg.right, ...(cfg.centre ? [cfg.centre] : [])];
  const rest = items.filter((n) => !used.includes(n.href));
  const on = (h: string) => pathname === h || pathname.startsWith(h + "/");

  const tab = (href: string) => {
    const n = find(href), I = n.icon, a = on(href);
    return (
      <Link key={href} href={href} aria-current={a ? "page" : undefined} className={cn("relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors", a ? "text-white" : "text-muted")}>
        {a && <motion.span layoutId="mtab" className="absolute inset-x-1 inset-y-1.5 rounded-2xl border border-teal/30 bg-gradient-to-b from-teal/25 to-teal/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_8px_22px_-10px_rgba(89,223,206,0.6)]" transition={spring} />}
        <I size={21} strokeWidth={1.6} className={cn("relative transition-transform", a && "-translate-y-px scale-110 text-teal")} />
        <span className="relative max-w-full truncate px-0.5">{t(n.label.replace("Equipment on hold", "On hold"))}</span>
      </Link>
    );
  };

  return (
    <>
      <nav aria-label="Primary" className="glass glass-strong fixed inset-x-3 bottom-3 z-40 flex items-stretch justify-between px-1.5 py-0.5 lg:hidden" style={{ borderRadius: 24, paddingBottom: "max(0.125rem, env(safe-area-inset-bottom))" }}>
        {tab(cfg.left[0])}
        {tab(cfg.left[1])}
        {cfg.centre && (
          <Link href={cfg.centre} aria-label={t(find(cfg.centre).label)} className="relative -mt-5 flex w-[60px] shrink-0 flex-col items-center gap-0.5 pb-1 text-[11px] font-medium text-muted">
            <span className="cta flex size-12 items-center justify-center rounded-2xl ring-[5px] ring-[#0b1928]" style={{ borderRadius: 18 }}><ScanLine size={22} strokeWidth={1.9} /></span>
            {t(find(cfg.centre).label)}
          </Link>
        )}
        {tab(cfg.right)}
        <button onClick={() => setMore(true)} aria-label={t("More")} className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted">
          <MoreHorizontal size={21} strokeWidth={1.6} />
          {t("More")}
        </button>
      </nav>
      <Modal open={more} onClose={() => setMore(false)} title="Profile & more" sheet>
        <div className="space-y-4 pb-2">
          <div className="grid grid-cols-2 gap-2">
            {rest.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setMore(false)} className="btn-secondary flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium">
                <n.icon size={18} strokeWidth={1.5} className="text-teal" /> {t(n.label)}
              </Link>
            ))}
          </div>
          <GlassDropdown label={t("Location")} value={active} onChange={setActive} options={[["all", `${t("All")} ${t("Locations")}`], ...locations.map((l) => [l.id, lang === "ar" ? l.nameAr : l.name] as const)]} />
          <RoleSwitcher />
          <div className="flex gap-2"><LangToggle /><SignOut /></div>
        </div>
      </Modal>
    </>
  );
}
