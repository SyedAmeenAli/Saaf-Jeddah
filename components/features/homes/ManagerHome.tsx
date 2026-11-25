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
import { EmployeeActivity, FleetHealth, OccasionCompletion, QualityByLocation, RepeatFailures, TypeComparison } from "@/components/features/Insights";

const TrendChart = dynamic(() => import("@/components/features/TrendChart"), { ssr: false, loading: () => <div className="skeleton h-48" /> });

function Panel({ title, sub, children, className }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("glass p-5", className)} style={{ borderRadius: 20 }}>
      <h3 className="text-base font-semibold">{title}</h3>
      {sub && <p className="mb-4 mt-0.5 text-xs text-muted">{sub}</p>}
      {!sub && <div className="mb-3" />}
      {children}
    </section>
  );
}

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
            <section className="glass h-full p-5" style={{ borderRadius: 20 }}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="text-base font-semibold">Sampling trend</h3><p className="text-xs text-muted">Pass and fail results per day{range !== "7" ? ". Days before the last 7 are illustrative." : ""}</p></div>
                <Tabs className="!mb-0 !gap-1 [&>button]:!px-3" tabs={[["7", "7 days"], ["30", "30 days"], ["90", "90 days"]] as const} value={range} onChange={setRange} />
              </div>
              <TrendChart key={range} data={series} height={260} bars={range !== "7"} />
            </section>
          </Rise>
          <Rise><Panel title="Quality by location" sub="Pass rate, last 7 days" className="h-full"><QualityByLocation /></Panel></Rise>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Rise><Panel title="Refueller vs dispenser" sub="Pass rate by equipment type" className="h-full"><TypeComparison /></Panel></Rise>
          <Rise><Panel title="Completion by occasion" sub="Samples recorded per sampling occasion" className="h-full"><OccasionCompletion /></Panel></Rise>
          <Rise className="md:col-span-2 xl:col-span-1"><Panel title="Fleet health" sub="Current status of every vehicle" className="h-full"><FleetHealth /></Panel></Rise>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Rise><Panel title="Repeat failure trends" sub="Vehicles with failures in the last 7 days" className="h-full"><RepeatFailures /></Panel></Rise>
          <Rise><Panel title="Employee activity" sub="Samples recorded in the last 7 days" className="h-full"><EmployeeActivity /></Panel></Rise>
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
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${st.pct * 100}%`, background: st.open ? "#e6a84a" : "linear-gradient(90deg,#59dfce,#43c9df)" }} /></div>
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
