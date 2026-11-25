"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarDays, ChevronDown, ChevronRight, MapPin, Search, TriangleAlert, Clock, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { NAV, ROLE_NAV } from "./nav";
import { targetHref } from "@/lib/links";
import { SyncPill } from "./Controls";
import { SafaaLogo } from "./Brand";
import { spring } from "@/lib/motion";
import { ago, cn } from "@/lib/utils";
import { Portal } from "@/components/ui/Glass";

function Title() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const t = useT();
  const role = useStore((s) => s.role);
  const nav = ROLE_NAV[role].find((n) => pathname.startsWith(n.href)) ?? NAV.find((n) => pathname.startsWith(n.href));
  const rawOpen = sp.get("open");
  const open = rawOpen && /^((REF|DSP)-\d+|LOC\d+)$/.test(rawOpen) ? rawOpen : null;
  return (
    <div className="min-w-0 leading-tight">
      <div className="flex items-center gap-1.5 truncate text-lg font-semibold">
        {open && nav ? <><Link href={nav.href} className="font-medium text-muted hover:text-fg">{t(nav.label)}</Link><ChevronRight size={16} className="shrink-0 text-faint rtl:rotate-180" /><span className="truncate">{open}</span></> : <span className="truncate">{nav ? t(nav.label) : "SAFAA"}</span>}
      </div>
      {nav && <p className="hidden truncate text-xs text-muted sm:block">{nav.sub}</p>}
    </div>
  );
}

export function Topbar() {
  const setPalette = useStore((s) => s.setPalette);
  const notices = useStore((s) => s.notices);
  const noticesOpen = useStore((s) => s.noticesOpen);
  const setNotices = useStore((s) => s.setNotices);
  const mark = useStore((s) => s.markNoticesRead);
  const locations = useStore((s) => s.locations);
  const active = useStore((s) => s.activeLocation);
  const setActive = useStore((s) => s.setActiveLocation);
  const lang = useStore((s) => s.lang);
  const t = useT();
  const unread = notices.filter((n) => !n.read).length;
  const today = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <header className="glass sticky top-3 z-30 mx-3 mt-3 flex h-16 items-center gap-3 ps-3 pe-3 md:ps-5" style={{ borderRadius: 16 }}>
      <div className="lg:hidden"><SafaaLogo size={30} /></div>
      <div className="hidden min-w-0 flex-1 lg:block"><Suspense fallback={null}><Title /></Suspense></div>
      <div className="flex-1 lg:hidden" />

      <button onClick={() => setPalette(true)} className="flex h-10 items-center gap-2 rounded-xl bg-white/5 px-3 text-sm text-muted transition-colors hover:text-fg xl:w-52" aria-label={t("Search")}>
        <Search size={16} strokeWidth={1.5} />
        <span className="hidden flex-1 text-start xl:block">{t("Search")}…</span>
        <kbd className="hidden rounded border border-hair-strong px-1.5 text-[11px] xl:block">⌘K</kbd>
      </button>

      <label className="hidden h-10 items-center gap-2 rounded-xl bg-white/5 px-3 text-sm md:flex">
        <MapPin size={15} strokeWidth={1.5} className="text-teal" />
        <span className="sr-only">{t("Location")}</span>
        <select value={active} onChange={(e) => setActive(e.target.value)} className="max-w-40 cursor-pointer appearance-none bg-transparent pe-1 text-sm focus:outline-none">
          <option value="all" className="text-black">{t("All")} {t("Locations")}</option>
          {locations.map((l) => <option key={l.id} value={l.id} className="text-black">{lang === "ar" ? l.nameAr : l.name}</option>)}
        </select>
        <ChevronDown size={14} className="text-faint" />
      </label>
      <div className="hidden h-10 items-center gap-2 rounded-xl bg-white/5 px-3 text-sm text-muted 2xl:flex"><CalendarDays size={15} strokeWidth={1.5} />{today}</div>

      <SyncPill />

      <div className="relative">
        <button
          onClick={() => { setNotices(!noticesOpen); if (!noticesOpen) setTimeout(mark, 1200); }}
          aria-label={`${t("Notifications")}${unread ? `, ${unread} unread` : ""}`}
          aria-expanded={noticesOpen}
          className="relative flex size-10 items-center justify-center rounded-xl bg-white/5 text-muted hover:text-fg"
        >
          <Bell size={18} strokeWidth={1.5} />
          {unread > 0 && <span className="absolute end-2 top-2 size-2 rounded-full bg-fail ring-2 ring-[#1a1030]" />}
        </button>
        <Portal>
          <AnimatePresence>
            {noticesOpen && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setNotices(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}
                  className="glass glass-strong fixed end-3 top-[5.25rem] z-[61] w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden p-2"
                  style={{ borderRadius: 16 }} role="dialog" aria-label={t("Notifications")}
                >
                  <div className="px-3 py-2 text-base font-semibold">{t("Notifications")}</div>
                  <ul className="max-h-[60dvh] space-y-1 overflow-y-auto">
                    {notices.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">{t("All clear")}</li>}
                    {notices.slice(0, 20).map((n) => (
                      <li key={n.id}><Link href={targetHref(n.text)} onClick={() => setNotices(false)} className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5">
                        <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", n.kind === "fail" ? "bg-fail/20 text-fail-fg" : n.kind === "overdue" ? "bg-pending/20 text-pending-fg" : "bg-info/20 text-info-fg")}>
                          {n.kind === "fail" ? <TriangleAlert size={15} /> : n.kind === "overdue" ? <Clock size={15} /> : <Info size={15} />}
                        </span>
                        <div className="min-w-0 flex-1"><p className={cn("text-sm", !n.read && "font-semibold")}>{n.text}</p><p className="text-xs text-faint">{ago(n.ts)}</p></div>
                      </Link></li>
                    ))}
                  </ul>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </Portal>
      </div>
    </header>
  );
}
