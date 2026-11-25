"use client";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, Clock, MapPin, OctagonAlert, ScanLine, Sun, Moon, Truck } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
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
          <div className="relative overflow-hidden" style={{ borderRadius: 28 }}>
            <Photo crop="plane" className="!absolute inset-0" scrim="from-[#0d0818]/15 via-[#0d0818]/35 to-[#0d0818]/88" />
            <div className="relative px-5 pb-6 pt-5 text-[#faf7ff] md:px-8 md:pb-8 md:pt-7">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#d9cdee]">
                <span>{t(greet)}, {name}</span>
                <span className="inline-flex items-center gap-1.5 normal-case tracking-normal"><MapPin size={12} className="text-[#b58aff]" />{loc ? (lang === "ar" ? loc.nameAr : loc.name) : locId}</span>
                <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">{night ? <Moon size={12} className="text-[#d7bcff]" /> : <Sun size={12} className="text-pending-fg" />}{shift}</span>
              </p>
              <h1 className="mt-3 max-w-[14ch] text-[34px] font-semibold leading-[1.05] md:text-[46px]">{t("Your Shift,")} <em className="block bg-gradient-to-r from-[#e6d4ff] via-[#b58aff] to-[#ff7a8e] bg-clip-text font-medium not-italic text-transparent">{t("in Control.")}</em></h1>
              <p className="mt-2 max-w-[32ch] text-[13px] leading-5 text-[#d9cdee]">{t("Maintain fuel quality. Ensure safe operations.")}</p>
            </div>
          </div>
        </Rise>

        <Rise>
          <div className="glass p-4 md:p-5" style={{ borderRadius: 24 }}>
            <div className="flex items-center gap-4">
              <Ring value={pct} size={92} stroke={9}><span className="text-xl font-semibold"><CountUp value={pct * 100} suffix="%" /></span><span className="text-[9px] text-muted">{t("Completed")}</span></Ring>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted">{t("Today's Sampling")}</p>
                <p className="mt-0.5 font-display text-2xl font-semibold tnum">{today.length} <span className="text-base font-normal text-muted">{t("of")} {expected}</span></p>
                <div className="mt-2.5 flex gap-[3px]" aria-hidden="true">{Array.from({ length: 24 }).map((_, i) => <span key={i} className={cn("h-2.5 flex-1 rounded-[3px]", i < Math.round(pct * 24) ? "bg-teal" : "bg-hair-strong/60")} />)}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[{ n: overdue.length, l: "Overdue", i: <OctagonAlert size={17} />, c: "text-fail-fg bg-fail/12", href: "#tasks" }, { n: onHold.length, l: "On Hold", i: <Truck size={17} />, c: "text-pending-fg bg-pending/12", href: "/holds" }, { n: myDue.length - overdue.length, l: "Upcoming", i: <CalendarClock size={17} />, c: "text-lav bg-teal/12", href: "#tasks" }].map((k) => (
                <Link key={k.l} href={k.href} className="glass-2 flex min-h-[64px] flex-col items-start justify-between gap-1 rounded-2xl border border-hair p-3 transition-colors hover:bg-[var(--glass-hover)]">
                  <span className={cn("flex size-7 items-center justify-center rounded-lg", k.c)}>{k.i}</span>
                  <span className="flex items-baseline gap-1.5"><span className="font-display text-lg font-semibold tnum">{String(Math.max(0, k.n)).padStart(2, "0")}</span><span className="text-[11px] text-muted">{t(k.l)}</span></span>
                </Link>
              ))}
            </div>
            <Link href="/scan" className="cta mt-4 inline-flex h-14 w-full items-center justify-center gap-2.5 px-8 text-base" style={{ borderRadius: 18 }}>
              <ScanLine size={22} strokeWidth={1.9} /> {t("Start sampling")} <ArrowRight size={18} className="rtl:rotate-180" />
            </Link>
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
            <div className="flex items-center gap-3 rounded-[18px] border border-fail/40 bg-fail/10 px-4 py-3 text-fail-fg" role="status">
              <Clock size={20} />
              <p className="flex-1 text-sm font-medium">{overdue.length} {t(overdue.length > 1 ? "overdue sampling tasks. Do these first." : "overdue sampling task. Do these first.")}</p>
            </div>
          </Rise>
        )}

        <Rise>
          <section id="tasks" aria-label="Today's tasks" className="scroll-mt-20">
            <div className="mb-2 flex items-end justify-between px-1">
              <h2 className="text-lg font-semibold">{t("Today's sampling tasks")}</h2>
              <span className="text-xs text-muted">{myDue.length} {t("open")}</span>
            </div>
            {myDue.length === 0 ? (
              <div className="glass p-8 text-center text-sm text-muted" style={{ borderRadius: 20 }}>{t("All tasks for this shift are complete.")}</div>
            ) : (
              <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {myDue.slice(0, 8).map((d) => (
                  <li key={d.id}>
                    <Link href={`/scan?v=${d.vehicleId}&p=${d.point}`} className="glass hover-glow flex min-h-[72px] items-center gap-4 px-4 py-3" style={{ borderRadius: 18 }}>
                      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", d.state === "overdue" ? "bg-fail/15 text-fail-fg" : "bg-teal/15 text-teal")}><ScanLine size={20} strokeWidth={1.6} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[15px] font-semibold">{d.vehicleId}</span>
                        <span className="block truncate text-xs text-muted">{POINTS[d.point].label} · {OCCASIONS[d.occasion].label}</span>
                      </span>
                      <span className="text-end">
                        <StatusBadge kind={d.state === "overdue" ? "fail" : "info"}>{t(d.state === "overdue" ? "Overdue" : "Due")}</StatusBadge>
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
            <h2 className="mb-2 px-1 text-lg font-semibold">{t("My latest submissions")}</h2>
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
              {mine.length === 0 && <p className="glass p-6 text-center text-sm text-muted md:col-span-2" style={{ borderRadius: 20 }}>{t("No submissions yet today.")}</p>}
            </div>
          </section>
        </Rise>
        <p className="px-1 text-center text-[11px] text-faint"><OctagonAlert size={11} className="me-1 inline" />{t("Failed result? Stop, tag the vehicle HOLD and call the supervisor.")}</p>
      </Stagger>
    </ExpandGroup>
  );
}
