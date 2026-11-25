"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, ScanLine, FileBarChart } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";
import { RoleSwitcher, SignOut, LangToggle } from "./Controls";
import { Modal } from "@/components/ui/Glass";

/** Bottom tab bar: Home, two role tabs, a raised teal Scan button, and a Profile sheet. */
export function MobileTabs() {
  const pathname = usePathname();
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);
  const locations = useStore((s) => s.locations);
  const active = useStore((s) => s.activeLocation);
  const setActive = useStore((s) => s.setActiveLocation);
  const t = useT();
  const [more, setMore] = useState(false);
  const canScan = role === "operator" || role === "supervisor";
  const sideHrefs: Record<string, [string, string, string]> = {
    operator: ["/dashboard", "/fleet", "/holds"],
    supervisor: ["/dashboard", "/approvals", "/holds"],
    manager: ["/dashboard", "/locations", "/audit"],
    admin: ["/dashboard", "/fleet", "/admin"],
  };
  const [a, b, c] = sideHrefs[role];
  const find = (h: string) => NAV.find((n) => n.href === h)!;
  const centerHref = canScan ? "/scan" : "/reports";
  const used = [a, b, c, centerHref];
  const rest = NAV.filter((n) => n.roles.includes(role) && !used.includes(n.href));

  const tab = (href: string) => {
    const n = find(href), on = pathname.startsWith(href), I = n.icon;
    return (
      <Link key={href} href={href} aria-current={on ? "page" : undefined} className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", on ? "text-teal" : "text-muted")}>
        <I size={22} strokeWidth={1.5} />
        <span className="max-w-full truncate px-0.5">{t(n.label)}</span>
      </Link>
    );
  };

  return (
    <>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-between border-t border-hair bg-[var(--glass)] px-1 lg:hidden" style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}>
        {tab(a)}
        {tab(b)}
        <Link href={centerHref} aria-label={t(find(centerHref).label)} className="relative -mt-6 flex w-16 shrink-0 flex-col items-center gap-0.5 pb-1 text-[11px] font-medium text-muted">
          <span className="cta flex size-14 items-center justify-center rounded-lg ring-4 ring-[#10161d]">{canScan ? <ScanLine size={26} strokeWidth={1.75} /> : <FileBarChart size={24} strokeWidth={1.75} />}</span>
          {t(find(centerHref).label)}
        </Link>
        {tab(c)}
        <button onClick={() => setMore(true)} className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted">
          <MoreHorizontal size={22} strokeWidth={1.5} />
          {t("More")}
        </button>
      </nav>
      <Modal open={more} onClose={() => setMore(false)} title="Profile & more" sheet>
        <div className="space-y-4 pb-2">
          <div className="grid grid-cols-2 gap-2">
            {rest.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setMore(false)} className="flex min-h-12 items-center gap-3 rounded-md border border-hair px-4 text-sm font-medium">
                <n.icon size={18} strokeWidth={1.5} className="text-teal" /> {t(n.label)}
              </Link>
            ))}
          </div>
          <select aria-label={t("Location")} value={active} onChange={(e) => setActive(e.target.value)} className="h-12 w-full rounded-md border border-hair-strong bg-bg px-3">
            <option value="all" className="text-black">{t("All")} {t("Locations")}</option>
            {locations.map((l) => <option key={l.id} value={l.id} className="text-black">{lang === "ar" ? l.nameAr : l.name}</option>)}
          </select>
          <RoleSwitcher />
          <div className="flex gap-2"><LangToggle /><SignOut /></div>
        </div>
      </Modal>
    </>
  );
}
