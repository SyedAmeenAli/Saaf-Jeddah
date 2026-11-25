"use client";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Inbox, OctagonAlert, ShieldAlert, Timer, Wrench } from "lucide-react";
import { useStore, empName, currentUserId } from "@/lib/store";
import { useScoped } from "@/lib/selectors";
import { useNow, useT } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { startOfDay, fmtTime, ago, cn } from "@/lib/utils";
import { CountUp, Rise, Stagger, StatusBadge } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { HoldBanner, LocationDetail, LocationStats, ResultBadge } from "@/components/features/Details";
import { HoldChain } from "@/components/features/HoldChain";
import { RecordView } from "@/components/features/Record";
import { CheckList, DueListView } from "@/components/features/Lists";
import type { Check } from "@/lib/types";

/** Supervisor: a quality-assurance workspace. Leads with what needs a decision. */
export default function SupervisorHome() {
  const t = useT();
  const now = useNow(60000);
  const lang = useStore((s) => s.lang);
  const employees = useStore((s) => s.employees);
  const locations = useStore((s) => s.locations);
  const allVehicles = useStore((s) => s.vehicles);
  const allChecks = useStore((s) => s.checks);
  const allDue = useStore((s) => s.due);
  const allHolds = useStore((s) => s.holds);
  const { checks, due, holds } = useScoped();
  const name = empName(employees, currentUserId("supervisor"), lang).replace(/^(Dr\. |د\. )/, "").split(" ")[0];

  const awaiting = useMemo(() => checks.filter((c) => c.status === "awaiting").sort((a, b) => (a.result === b.result ? b.ts - a.ts : a.result === "fail" ? -1 : 1)), [checks]);
  const failedToday = checks.filter((c) => c.result === "fail" && c.ts >= startOfDay(now));
  const activeHolds = holds.filter((h) => h.state !== "released");
  const overdue = due.filter((d) => d.state === "overdue");
  const recent = [...checks].sort((a, b) => b.ts - a.ts).slice(0, 6);

  const tiles = [
    { id: "sv-pending", label: "Pending approvals", v: awaiting.length, I: Inbox, tone: "text-pending-fg bg-pending/15", sub: `${awaiting.filter((c) => c.result === "fail").length} failed need investigation`, body: () => <CheckList checks={awaiting} limit={50} /> },
    { id: "sv-failed", label: "Failed samples", v: failedToday.length, I: ShieldAlert, tone: "text-fail-fg bg-fail/15", sub: "Recorded today", body: () => <CheckList checks={failedToday} /> },
    { id: "sv-holds", label: "Vehicles on hold", v: activeHolds.length, I: Wrench, tone: "text-fail-fg bg-fail/15", sub: "Must not fuel", body: () => <div className="space-y-4">{activeHolds.map((h) => <div key={h.id} className="space-y-3"><HoldBanner vehicleId={`${h.vehicleId} · ${POINTS[h.point].label}`} /><HoldChain hold={h} /></div>)}</div> },
    { id: "sv-overdue", label: "Overdue checks", v: overdue.length, I: Timer, tone: "text-pending-fg bg-pending/15", sub: "Sampling not yet done", body: () => <DueListView due={overdue} /> },
  ];

  const renderDetail = (c: Check) => {
    const h = allHolds.find((x) => x.vehicleId === c.vehicleId && x.point === c.point && x.state !== "released") ?? allHolds.find((x) => x.events.some((e) => e.checkId === c.id));
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        {c.result === "fail" && h && <><HoldBanner vehicleId={`${h.vehicleId} · ${POINTS[h.point].label}`} /><div className="glass p-4" style={{ borderRadius: 20 }}><p className="mb-3 text-sm font-semibold">Failure investigation</p><HoldChain hold={h} /></div></>}
        <RecordView check={c} />
      </div>
    );
  };

  return (
    <ExpandGroup>
      <Stagger className="space-y-5">
        <Rise>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">{new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
              <h1 className="mt-1 text-[28px] font-semibold leading-tight md:text-[34px]">{awaiting.length ? `${awaiting.length} samples need your review` : "Review queue is clear"}, {name}</h1>
            </div>
            <Link href="/approvals" className="cta inline-flex h-11 items-center gap-2 px-5 text-sm" style={{ borderRadius: 16 }}>Open review queue <ArrowRight size={16} className="rtl:rotate-180" /></Link>
          </div>
        </Rise>

        {activeHolds.length > 0 && <Rise><div className="grid grid-cols-1 gap-2 md:grid-cols-2">{activeHolds.map((h) => <Link key={h.id} href="/holds"><HoldBanner vehicleId={`${h.vehicleId} · ${POINTS[h.point].label}`} /></Link>)}</div></Rise>}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {tiles.map((d) => (
            <Rise key={d.id} className="h-full">
              <ExpandCard id={d.id} title={d.label}
                card={<div className="flex h-full flex-col gap-3 p-4"><span className={cn("flex size-10 items-center justify-center rounded-2xl", d.tone)}><d.I size={20} strokeWidth={1.6} /></span><div><p className="text-[30px] font-semibold leading-8"><CountUp value={d.v} /></p><p className="mt-1 text-sm text-muted">{d.label}</p><p className="mt-0.5 text-xs text-faint">{d.sub}</p></div></div>}
                detail={() => <div className="mx-auto max-w-3xl">{d.body()}</div>} />
            </Rise>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <Rise className="xl:col-span-3">
            <section aria-label="Review queue">
              <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-lg font-semibold">Review queue</h2><Link href="/approvals" className="text-xs text-teal hover:underline">View all {awaiting.length}</Link></div>
              <div className="space-y-2.5">
                {awaiting.slice(0, 6).map((c) => (
                  <ExpandCard key={c.id} id={`rv-${c.id}`} title={`${c.sampleId}`}
                    card={
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5">
                        <span className={cn("size-2.5 rounded-full", c.result === "fail" ? "bg-fail" : "bg-pending")} />
                        <span className="min-w-24 font-mono text-sm font-semibold">{c.vehicleId}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-muted">{POINTS[c.point].label} · {fmtTime(c.ts)} · {c.employeeId}</span>
                        <ResultBadge c={c} />
                        <span className="text-xs text-faint">{ago(c.ts)}</span>
                      </div>
                    }
                    detail={() => renderDetail(c)} />
                ))}
                {awaiting.length === 0 && <p className="glass p-8 text-center text-sm text-muted" style={{ borderRadius: 20 }}>Nothing waiting for review.</p>}
              </div>
            </section>
          </Rise>

          <Rise className="xl:col-span-2">
            <section aria-label="Location activity" className="space-y-2.5">
              <h2 className="px-1 text-lg font-semibold">Location activity</h2>
              {locations.map((l) => {
                const st = LocationStats(l.id, allVehicles, allChecks, allDue, allHolds);
                return (
                  <ExpandCard key={l.id} id={`loc-${l.id}`} title={lang === "ar" ? l.nameAr : l.name}
                    card={
                      <div className="p-4">
                        <div className="flex items-center justify-between text-sm"><span className="font-medium">{lang === "ar" ? l.nameAr : l.name}</span>{st.open > 0 ? <StatusBadge kind="fail">{st.open} HOLD</StatusBadge> : <StatusBadge kind="pass">OK</StatusBadge>}</div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${st.pct * 100}%`, background: st.open ? "#e6a84a" : "linear-gradient(90deg,#b58aff,#d7bcff)" }} /></div>
                        <p className="mt-2 text-xs text-muted">{Math.round(st.pct * 100)}% complete · {st.done} done · {st.pending} outstanding</p>
                      </div>
                    }
                    detail={() => <LocationDetail location={l} />} />
                );
              })}
            </section>
          </Rise>
        </div>

        <Rise>
          <section aria-label="Recent submissions">
            <h2 className="mb-2 px-1 text-lg font-semibold">Recent submissions</h2>
            <div className="glass overflow-x-auto p-4" style={{ borderRadius: 20 }}>
              <table className="tbl min-w-[32rem]"><thead><tr><th>Time</th><th>Vehicle</th><th>Sampling point</th><th>Result</th><th>Operator</th></tr></thead>
                <tbody>{recent.map((c) => <tr key={c.id}><td className="tnum text-muted">{fmtTime(c.ts)}</td><td className="font-mono text-[13px]">{c.vehicleId}</td><td>{POINTS[c.point].label}</td><td><ResultBadge c={c} /></td><td className="font-mono text-xs text-muted">{c.employeeId}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        </Rise>
        <p className="sr-only">{t("Demo data")} <OctagonAlert /></p>
      </Stagger>
    </ExpandGroup>
  );
}
