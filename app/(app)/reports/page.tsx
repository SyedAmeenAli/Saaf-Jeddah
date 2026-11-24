"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CalendarDays, Truck, User, OctagonAlert, Clock, BarChart3, ScrollText, ArrowUpRight, MapPin, Check, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { REPORTS } from "@/lib/reports";
import { POINTS } from "@/lib/domain";
import { trend } from "@/lib/selectors";
import { cn, fmtDT, DAY } from "@/lib/utils";
import { PageHeader, Rise, Stagger, StatusBadge, Tabs, inputCls } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { ReportPreview } from "@/components/features/ReportPreview";

const TrendChart = dynamic(() => import("@/components/features/TrendChart"), { ssr: false, loading: () => <div className="h-56" /> });
const ICONS = { calendar: CalendarDays, truck: Truck, user: User, alert: OctagonAlert, clock: Clock, chart: BarChart3, log: ScrollText, pin: MapPin };
const TABS = [["sampling", "Sampling Report"], ["compliance", "Compliance"], ["failures", "Failures"], ["trends", "Trend Analysis"]] as const;
const mark = (r: string) => r === "pass" ? <Check size={14} className="text-pass-fg" aria-label="pass" /> : r === "fail" ? <X size={14} className="text-fail-fg" aria-label="fail" /> : <span className="text-faint">–</span>;

export default function ReportsPage() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const checks = useStore((s) => s.checks);
  const locations = useStore((s) => s.locations);
  const vehicles = useStore((s) => s.vehicles);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("sampling");
  const [loc, setLoc] = useState("all");
  const [vt, setVt] = useState("all");
  const [days, setDays] = useState(7);
  const [now] = useState(() => Date.now());

  const rows = useMemo(() => checks.filter((c) => (loc === "all" || c.locationId === loc) && (vt === "all" || vehicles.find((v) => v.id === c.vehicleId)?.type === vt) && c.ts > now - days * DAY), [checks, loc, vt, days, vehicles, now]);
  const failed = rows.filter((c) => c.result === "fail").length;
  const tr = useMemo(() => trend(rows), [rows]);
  const shown = (tab === "failures" ? rows.filter((c) => c.result === "fail") : rows).slice(0, 12);

  return (
    <ExpandGroup>
      <PageHeader title={t("Reports")} sub="Reports and analytics. Open a report card to preview the paper form and export to PDF or Excel." />

      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto sm:grid sm:grid-cols-3 sm:gap-3">
        <select aria-label="Location" className={`${inputCls} min-w-44 shrink-0`} value={loc} onChange={(e) => setLoc(e.target.value)}><option value="all" className="text-black">All Locations</option>{locations.map((l) => <option key={l.id} value={l.id} className="text-black">{lang === "ar" ? l.nameAr : l.name}</option>)}</select>
        <select aria-label="Vehicle type" className={`${inputCls} min-w-40 shrink-0`} value={vt} onChange={(e) => setVt(e.target.value)}><option value="all" className="text-black">All Vehicles</option><option value="refueller" className="text-black">Refuellers</option><option value="dispenser" className="text-black">Hydrant dispensers</option></select>
        <select aria-label="Date range" className={`${inputCls} min-w-36 shrink-0`} value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={1} className="text-black">Today</option><option value={3} className="text-black">Last 3 days</option><option value={7} className="text-black">Last 7 days</option></select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Total samples", rows.length, ""], [t("Passed"), rows.length - failed, "text-pass-fg"], [t("Failed"), failed, "text-fail-fg"], [t("Pass rate"), rows.length ? `${(((rows.length - failed) / rows.length) * 100).toFixed(1)}%` : "–", ""]].map(([l, v, c]) => (
          <div key={l as string} className="glass p-4" style={{ borderRadius: 16 }}><p className="text-xs text-muted">{l}</p><p className={cn("text-[28px] font-semibold leading-9 tnum", c as string)}>{v}</p></div>
        ))}
      </div>

      <div className="glass mb-8 overflow-hidden p-5" style={{ borderRadius: 16 }}>
        {tab === "trends" ? <TrendChart data={tr} height={260} bars /> : tab === "compliance" ? (
          <table className="tbl"><thead><tr><th>Location</th><th className="!text-end">Samples</th><th className="!text-end">Failed</th><th className="!text-end">Compliance</th></tr></thead>
            <tbody>{locations.map((l) => { const r = rows.filter((c) => c.locationId === l.id), f = r.filter((c) => c.result === "fail").length; return <tr key={l.id} className="border-t border-hair"><td className="py-2.5">{lang === "ar" ? l.nameAr : l.name}</td><td className="text-end tnum">{r.length}</td><td className="text-end tnum">{f}</td><td className="text-end tnum">{r.length ? (((r.length - f) / r.length) * 100).toFixed(1) : "–"}%</td></tr>; })}</tbody></table>
        ) : (
          <>
          <ul className="space-y-2 md:hidden">{shown.map((c) => (<li key={c.id} className="rounded-xl bg-white/5 p-3.5"><div className="flex items-center justify-between"><span className="font-mono text-sm font-semibold">{c.vehicleId}</span><StatusBadge kind={c.result === "pass" ? "pass" : "fail"}>{c.result === "pass" ? t("Pass") : t("Fail")}</StatusBadge></div><p className="mt-1 text-sm">{POINTS[c.point].label}</p><p className="mt-0.5 text-xs text-muted">{fmtDT(c.ts)} · {c.employeeId}</p><p className="mt-1.5 flex items-center gap-3 text-xs text-muted">VAC {mark(c.clarity === "fail" || c.sediment === "fail" || c.freeWater === "fail" ? "fail" : "pass")} CWD {mark(c.cwd)}</p></li>))}</ul>
          <div className="hidden overflow-x-auto md:block"><table className="tbl min-w-[52rem]">
            <thead className="text-xs text-muted"><tr>{["Report ID", "Date & Time", "Vehicle", "Sampling Point", "VAC", "CWD", "Result", "Employee"].map((h) => <th key={h} className="pb-2 pe-3 text-start font-medium">{h}</th>)}</tr></thead>
            <tbody>{shown.map((c) => (
              <tr key={c.id} className="border-t border-hair"><td className="py-2.5 pe-3 font-mono text-xs">{c.sampleId.slice(-18)}</td><td className="pe-3 tnum text-muted">{fmtDT(c.ts)}</td><td className="pe-3 font-mono text-[13px]">{c.vehicleId}</td><td className="pe-3">{POINTS[c.point].label}</td>
                <td className="pe-3">{mark(c.clarity === "fail" || c.sediment === "fail" || c.freeWater === "fail" ? "fail" : "pass")}</td><td className="pe-3">{mark(c.cwd)}</td>
                <td className="pe-3"><StatusBadge kind={c.result === "pass" ? "pass" : "fail"}>{c.result === "pass" ? t("Pass") : t("Fail")}</StatusBadge></td><td className="font-mono text-xs text-muted">{c.employeeId}</td></tr>
            ))}</tbody></table></div>
          </>
        )}
      </div>

      <h2 className="mb-3 text-xl font-semibold">Report forms</h2>
      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {REPORTS.map((r) => {
          const I = ICONS[r.icon as keyof typeof ICONS] ?? BarChart3;
          const title = lang === "ar" ? r.titleAr : r.title;
          return (
            <Rise key={r.id}>
              <ExpandCard
                id={r.id} title={title}
                card={
                  <div className="flex h-full min-h-40 flex-col justify-between gap-5 p-5">
                    <div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-full bg-teal/15 text-teal"><I size={20} strokeWidth={1.5} /></span><ArrowUpRight size={16} className="text-faint rtl:-scale-x-100" /></div>
                    <div><h3 className="text-base font-semibold">{title}</h3><p className="mt-1 text-sm text-muted">{r.desc}</p></div>
                  </div>
                }
                detail={() => <ReportPreview id={r.id} />}
              />
            </Rise>
          );
        })}
      </Stagger>
    </ExpandGroup>
  );
}
