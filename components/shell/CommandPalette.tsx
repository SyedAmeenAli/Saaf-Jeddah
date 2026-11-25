"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Truck, MapPin, FileBarChart, CornerDownLeft, Compass } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { NAV } from "./nav";
import { REPORTS } from "@/lib/reports";
import { cn, fuzzy } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { Portal } from "@/components/ui/Glass";

interface Item { id: string; label: string; sub: string; href: string; kind: "page" | "vehicle" | "location" | "report" }

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPalette);
  const vehicles = useStore((s) => s.vehicles);
  const locations = useStore((s) => s.locations);
  const role = useStore((s) => s.role);
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(!useStore.getState().paletteOpen); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setOpen]);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) { setPrevOpen(open); if (open) { setQ(""); setIdx(0); } }
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [open]);

  const all = useMemo<Item[]>(() => [
    ...NAV.filter((n) => n.roles.includes(role)).map((n): Item => ({ id: n.href, label: t(n.label), sub: "Page", href: n.href, kind: "page" })),
    ...locations.map((l): Item => ({ id: l.id, label: l.name, sub: "Location", href: `/locations?open=${l.id}`, kind: "location" })),
    ...vehicles.map((v): Item => ({ id: v.id, label: v.id, sub: `${v.type === "refueller" ? "Refueller" : "Hydrant dispenser"} · ${v.locationId}`, href: `/fleet?open=${v.id}`, kind: "vehicle" })),
    ...REPORTS.map((r): Item => ({ id: r.id, label: r.title, sub: "Report", href: `/reports?open=${r.id}`, kind: "report" })),
  ], [vehicles, locations, role, t]);

  const results = useMemo(() => {
    return all.map((i) => ({ i, s: fuzzy(q, `${i.label} ${i.sub}`) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 9).map((x) => x.i);
  }, [all, q]);

  const go = (it: Item) => { setOpen(false); router.push(it.href); };
  const icon = { page: Compass, vehicle: Truck, location: MapPin, report: FileBarChart };

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]">
            <motion.div className="absolute inset-0 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div
              role="dialog" aria-modal="true" aria-label="Command palette"
              initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={spring}
              className="glass glass-strong relative w-full max-w-xl overflow-hidden" style={{ borderRadius: 8 }}
            >
              <div className="flex items-center gap-3 border-b border-hair px-5">
                <Search size={18} className="text-muted" />
                <input
                  ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setIdx(0); }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
                    if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
                    if (e.key === "Enter" && results[idx]) go(results[idx]);
                    if (e.key === "Escape") setOpen(false);
                  }}
                  placeholder={t("Search vehicles, locations, reports…")}
                  aria-label={t("Search")}
                  className="h-14 flex-1 bg-transparent text-base placeholder:text-faint focus:outline-none"
                  style={{ boxShadow: "none" }}
                />
              </div>
              <ul className="max-h-[50dvh] overflow-y-auto p-2" role="listbox">
                {results.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">{t("No records")}</li>}
                {results.map((it, n) => {
                  const I = icon[it.kind];
                  return (
                    <li key={it.kind + it.id} role="option" aria-selected={n === idx}>
                      <button onMouseEnter={() => setIdx(n)} onClick={() => go(it)}
                        className={cn("flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-start", n === idx && "bg-teal/15")}>
                        <span className="flex size-9 items-center justify-center rounded-xl bg-hi text-teal"><I size={17} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{it.label}</span>
                          <span className="block truncate text-xs text-muted">{it.sub}</span>
                        </span>
                        {n === idx && <CornerDownLeft size={15} className="text-muted" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
