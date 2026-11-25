"use client";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, OctagonAlert, ScanLine, Sun, Moon } from "lucide-react";
import { useStore, empName, currentUserId } from "@/lib/store";
import { useNow, useT } from "@/lib/hooks";
import { OCCASIONS, POINTS } from "@/lib/domain";
import { startOfDay, fmtTime, ago, cn } from "@/lib/utils";
import { Ring, Rise, Stagger, StatusBadge, CountUp } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { HoldBanner } from "@/components/features/Details";
import { ResultBadge, StateBadge } from "@/components/features/Details";
import { RecordView } from "@/components/features/Record";

/** Operator: a field tool. Today's tasks, overdue alerts, equipment on hold, one big action. No charts. */
export default function OperatorHome() {
  const t = useT();
  const now = useNow(60000);
  const lang = useStore((s) => s.lang);
  const employees = useStore((s) => s.employees);
  const locations = useStore((s) => s.locations);
  const checks = useStore((s) => s.checks);
  const due = useStore((s) => s.due);
  const holds = useStore((s) => s.holds);
  const me = currentUserId("operator");
  const emp = employees.find((e) => e.id === me);
  const locId = emp?.locationId ?? "LOC01";
  const loc = locations.find((l) => l.id === locId);
  const name = empName(employees, me, lang).split(" ")[0];
  const hr = new Date(now).getHours();
  const night = hr >= 18 || hr < 6;
  const shift = night ? "Night shift · 18:00–06:00" : "Day shift · 06:00–18:00";
  const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  const today = useMemo(() => checks.filter((c) => c.locationId === locId && c.ts >= startOfDay(now)), [checks, locId, now]);
  const myDue = useMemo(() => due.filter((d) => d.locationId === locId).sort((a, b) => (a.state === b.state ? a.dueTs - b.dueTs : a.state === "overdue" ? -1 : 1)), [due, locId]);
  const overdue = myDue.filter((d) => d.state === "overdue");
  const expected = today.length + myDue.length;
  const pct = expected ? today.length / expected : 1;
  const onHold = holds.filter((h) => h.locationId === locId && h.state !== "released");
  const mine = checks.filter((c) => c.employeeId === me).slice(0, 4);

  return (
    <ExpandGroup>
      <Stagger className="mx-auto max-w-5xl space-y-4">
        <Rise>
          <div className="glass relative overflow-hidden p-5 md:p-7" style={{ borderRadius: 24 }}>
            <div className="pointer-events-none absolute -end-16 -top-20 size-64 rounded-full bg-teal/15 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-teal" />{loc ? (lang === "ar" ? loc.nameAr : loc.name) : locId}</span>
                  <span className="inline-flex items-center gap-1.5">{night ? <Moon size={13} className="text-ice" /> : <Sun size={13} className="text-amber" />}{shift}</span>
                </p>
                <h1 className="mt-2 text-[28px] font-semibold leading-tight md:text-[36px]">{t(greet)}, {name}</h1>
                <p className="mt-1.5 text-sm text-muted">{today.length} sampled · {myDue.length} still to do{overdue.length ? ` · ${overdue.length} overdue` : ""}</p>
                <Link href="/scan" className="cta mt-5 inline-flex h-14 w-full items-center justify-center gap-2.5 px-8 text-base sm:w-auto" style={{ borderRadius: 18 }}>
                  <ScanLine size={22} strokeWidth={1.9} /> {t("Start sampling")} <ArrowRight size={18} className="rtl:rotate-180" />
                </Link>
              </div>
              <div className="flex items-center gap-5 md:flex-col md:gap-3">
                <Ring value={pct} size={118} stroke={10}><span className="text-2xl font-semibold"><CountUp value={pct * 100} suffix="%" /></span><span className="text-[10px] text-muted">of shift</span></Ring>
              </div>
            </div>
          </div>
        </Rise>

        {onHold.length > 0 && (
          <Rise>
            <div className="space-y-2">
              {onHold.map((h) => (
                <Link key={h.id} href="/holds" className="block"><HoldBanner vehicleId={`${h.vehicleId} · ${POINTS[h.point].label}`} /></Link>
              ))}
            </div>
          </Rise>
        )}

        {overdue.length > 0 && (
          <Rise>
            <div className="flex items-center gap-3 rounded-[18px] border border-pending/40 bg-pending/10 px-4 py-3 text-pending-fg" role="status">
              <Clock size={20} />
              <p className="flex-1 text-sm font-medium">{overdue.length} overdue sampling task{overdue.length > 1 ? "s" : ""}. Do these first.</p>
            </div>
          </Rise>
        )}

        <Rise>
          <section aria-label="Today's tasks">
            <div className="mb-2 flex items-end justify-between px-1">
              <h2 className="text-lg font-semibold">Today&apos;s sampling tasks</h2>
              <span className="text-xs text-muted">{myDue.length} open</span>
            </div>
            {myDue.length === 0 ? (
              <div className="glass p-8 text-center text-sm text-muted" style={{ borderRadius: 20 }}>All tasks for this shift are complete.</div>
            ) : (
              <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {myDue.slice(0, 8).map((d) => (
                  <li key={d.id}>
                    <Link href={`/scan?v=${d.vehicleId}&p=${d.point}`} className="glass hover-glow flex min-h-[72px] items-center gap-4 px-4 py-3" style={{ borderRadius: 18 }}>
                      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", d.state === "overdue" ? "bg-pending/20 text-pending-fg" : "bg-teal/15 text-teal")}><ScanLine size={20} strokeWidth={1.6} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[15px] font-semibold">{d.vehicleId}</span>
                        <span className="block truncate text-xs text-muted">{POINTS[d.point].label} · {OCCASIONS[d.occasion].label}</span>
                      </span>
                      <span className="text-end">
                        <StatusBadge kind={d.state === "overdue" ? "pending" : "info"}>{d.state === "overdue" ? "Overdue" : "Due"}</StatusBadge>
                        <span className="mt-1 block text-[11px] text-faint">{fmtTime(d.dueTs)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Rise>

        <Rise>
          <section aria-label="My latest submissions">
            <h2 className="mb-2 px-1 text-lg font-semibold">My latest submissions</h2>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {mine.map((c) => (
                <ExpandCard key={c.id} id={`my-${c.id}`} title={`${c.vehicleId} · ${c.sampleId}`}
                  card={
                    <div className="flex items-center gap-3 p-4">
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-sm font-semibold">{c.vehicleId}</span>
                        <span className="block truncate text-xs text-muted">{POINTS[c.point].label} · {fmtTime(c.ts)} · {ago(c.ts)}</span>
                      </span>
                      <ResultBadge c={c} />
                      <span className="hidden sm:block"><StateBadge status={c.status} /></span>
                    </div>
                  }
                  detail={() => <div className="mx-auto max-w-3xl"><RecordView check={c} /></div>}
                />
              ))}
              {mine.length === 0 && <p className="glass p-6 text-center text-sm text-muted md:col-span-2" style={{ borderRadius: 20 }}>No submissions yet today.</p>}
            </div>
          </section>
        </Rise>
        <p className="px-1 text-center text-[11px] text-faint"><OctagonAlert size={11} className="me-1 inline" />Failed result? Stop, tag the vehicle HOLD and call the supervisor.</p>
      </Stagger>
    </ExpandGroup>
  );
}
