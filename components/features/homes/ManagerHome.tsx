"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, Check, ClipboardCheck, Eye, MapPin, ShieldAlert, Timer, Truck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useScoped, kpis, trendN } from "@/lib/selectors";
import { useNow, useT } from "@/lib/hooks";
import { cn, fmtDate } from "@/lib/utils";
import { CountUp, Rise, Stagger, StatusBadge, Tabs } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { CheckList, DueListView } from "@/components/features/Lists";
import { LocationDetail, LocationStats } from "@/components/features/Details";
import { ExpandPanel } from "@/components/ui/ExpandPanel";
import { EmployeeActivity, FleetHealth, OccasionCompletion, QualityByLocation, RepeatFailures, TypeComparison } from "@/components/features/Insights";

const TrendChart = dynamic(() => import("@/components/features/TrendChart"), { ssr: false, loading: () => <div className="skeleton h-48" /> });

/** Manager: read-only executive intelligence. No operator or admin controls anywhere. */
export default function ManagerHome() {
  const t = useT();
  const now = useNow(60000);
  const lang = useStore((s) => s.lang);
  const locations = useStore((s) => s.locations);
  const allVehicles = useStore((s) => s.vehicles);
  const allChecks = useStore((s) => s.checks);
  const allDue = useStore((s) => s.due);
  const allHolds = useStore((s) => s.holds);
  const { checks, due, vehicles } = useScoped();
  const k = useMemo(() => kpis(checks, due), [checks, due]);
  const [range, setRange] = useState<"7" | "30" | "90">("7");
  const series = useMemo(() => trendN(checks, Number(range)), [checks, range]);

  const defs = [
    { id: "mg-complete", label: "Sampling completion", v: k.pct * 100, dec: 0, suffix: "%", I: Activity, tone: "bg-teal/15 text-teal", sub: `${k.dueN + k.overdue} still outstanding`, body: () => <DueListView due={due} /> },
    { id: "mg-total", label: "Samples today", v: k.completed, I: ClipboardCheck, tone: "bg-info/15 text-info-fg", sub: `${k.expected} expected`, body: () => <CheckList checks={k.today} /> },
    { id: "mg-pass", label: "Overall pass rate", v: k.passRate * 100, dec: 1, suffix: "%", I: Check, tone: "bg-pass/15 text-pass-fg", sub: `${k.passed} passed`, body: () => <CheckList checks={k.today.filter((c) => c.result === "pass")} /> },
    { id: "mg-failed", label: "Failed inspections", v: k.failed, I: ShieldAlert, tone: "bg-fail/15 text-fail-fg", sub: "Today", body: () => <CheckList checks={k.today.filter((c) => c.result === "fail")} /> },
    { id: "mg-overdue", label: "Overdue inspections", v: k.overdue, I: Timer, tone: "bg-pending/15 text-pending-fg", sub: "Not sampled on time", body: () => <DueListView due={due.filter((d) => d.state === "overdue")} /> },
    { id: "mg-fleet", label: "Active fleet", v: vehicles.length, I: Truck, tone: "bg-info/15 text-info-fg", sub: `${vehicles.filter((v) => v.type === "dispenser").length} dispensers · ${vehicles.filter((v) => v.type === "refueller").length} refuellers`, body: () => <FleetHealth /> },
  ];

  return (
    <ExpandGroup>
      <Stagger className="space-y-5">
        <Rise>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">{fmtDate(now)} · All locations</p>
              <h1 className="mt-1 text-[28px] font-semibold leading-tight md:text-[34px]">{t("Executive Overview")}</h1>
            </div>
            <StatusBadge kind="info"><Eye size={11} className="me-1" />{t("Read-only for this role")}</StatusBadge>
          </div>
        </Rise>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {defs.map((d) => (
            <Rise key={d.id} className="h-full">
              <ExpandCard id={d.id} title={d.label}
                card={<div className="flex h-full flex-col gap-3 p-4"><span className={cn("flex size-10 items-center justify-center rounded-2xl", d.tone)}><d.I size={20} strokeWidth={1.6} /></span><div><p className="text-[28px] font-semibold leading-8"><CountUp value={d.v} decimals={d.dec ?? 0} suffix={d.suffix} /></p><p className="mt-1 text-sm text-muted">{d.label}</p><p className="mt-0.5 text-xs text-faint">{d.sub}</p></div></div>}
                detail={() => <div className="mx-auto max-w-3xl">{d.body()}</div>} />
            </Rise>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Rise className="xl:col-span-2">
            <ExpandCard id="mg-trend" title="Sampling trend" className="h-full"
              card={
                <div className="h-full p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div><h3 className="text-base font-semibold">Sampling trend</h3><p className="text-xs text-muted">Pass and fail results per day{range !== "7" ? ". Days before the last 7 are illustrative." : ""}</p></div>
                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}><Tabs className="!mb-0 !gap-1 [&>button]:!px-3" tabs={[["7", "7 days"], ["30", "30 days"], ["90", "90 days"]] as const} value={range} onChange={setRange} /></div>
                  </div>
                  <TrendChart key={range} data={series} height={260} bars={range !== "7"} />
                </div>
              }
              detail={() => (
                <div className="mx-auto max-w-4xl space-y-5">
                  <TrendChart key={`d${range}`} data={series} height={340} bars />
                  <div className="glass overflow-x-auto p-4" style={{ borderRadius: 20 }}>
                    <table className="tbl min-w-[24rem]"><thead><tr><th>Day</th><th className="text-end">Total</th><th className="text-end">Pass</th><th className="text-end">Fail</th></tr></thead><tbody>{series.slice(-14).map((r, i) => <tr key={i}><td>{r.day}</td><td className="text-end tnum">{r.total}</td><td className="text-end tnum text-pass-fg">{r.pass}</td><td className="text-end tnum text-fail-fg">{r.fail}</td></tr>)}</tbody></table>
                  </div>
                </div>
              )} />
          </Rise>
          <Rise><ExpandPanel id="mg-qloc" title="Quality by location" sub="Pass rate, last 7 days" className="h-full"><QualityByLocation /></ExpandPanel></Rise>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Rise><ExpandPanel id="mg-type" title="Refueller vs dispenser" sub="Pass rate by equipment type" className="h-full"><TypeComparison /></ExpandPanel></Rise>
          <Rise><ExpandPanel id="mg-occ" title="Completion by occasion" sub="Samples recorded per sampling occasion" className="h-full"><OccasionCompletion /></ExpandPanel></Rise>
          <Rise className="md:col-span-2 xl:col-span-1"><ExpandPanel id="mg-fleethealth" title="Fleet health" sub="Current status of every vehicle" className="h-full"><FleetHealth /></ExpandPanel></Rise>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Rise><ExpandPanel id="mg-repeat" title="Repeat failure trends" sub="Vehicles with failures in the last 7 days" className="h-full"><RepeatFailures /></ExpandPanel></Rise>
          <Rise><ExpandPanel id="mg-emp" title="Employee activity" sub="Samples recorded in the last 7 days" className="h-full"><EmployeeActivity limit={20} /></ExpandPanel></Rise>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {locations.map((l) => {
            const st = LocationStats(l.id, allVehicles, allChecks, allDue, allHolds);
            const lc = allChecks.filter((c) => c.locationId === l.id);
            const pr = lc.length ? lc.filter((c) => c.result === "pass").length / lc.length : 1;
            return (
              <Rise key={l.id}>
                <ExpandCard id={`loc-${l.id}`} title={lang === "ar" ? l.nameAr : l.name}
                  card={
                    <div className="flex h-full flex-col gap-4 p-5">
                      <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold"><MapPin size={16} strokeWidth={1.5} className="text-teal" />{lang === "ar" ? l.nameAr : l.name}</span>{st.open > 0 ? <StatusBadge kind="fail">{st.open} HOLD</StatusBadge> : <StatusBadge kind="pass">OK</StatusBadge>}</div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="text-xl font-semibold"><CountUp value={st.pct * 100} suffix="%" /></p><p className="text-[11px] text-muted">Completion</p></div>
                        <div><p className="text-xl font-semibold"><CountUp value={pr * 100} decimals={1} suffix="%" /></p><p className="text-[11px] text-muted">Pass rate</p></div>
                        <div><p className="text-xl font-semibold"><CountUp value={st.fleet} /></p><p className="text-[11px] text-muted">Fleet</p></div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${st.pct * 100}%`, background: st.open ? "#e6a84a" : "linear-gradient(90deg,#b58aff,#d7bcff)" }} /></div>
                    </div>
                  }
                  detail={() => <LocationDetail location={l} />} />
              </Rise>
            );
          })}
        </div>
      </Stagger>
    </ExpandGroup>
  );
}
