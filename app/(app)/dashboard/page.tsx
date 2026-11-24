"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Check, ClipboardCheck, MapPin, Truck, X, ArrowUp, ArrowDown, TriangleAlert, ShieldCheck } from "lucide-react";
import { useStore, empName, currentUserId } from "@/lib/store";
import { useScoped, kpis, trend } from "@/lib/selectors";
import { useT } from "@/lib/hooks";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { CountUp, Ring, Stagger, Rise, StatusBadge } from "@/components/ui/Glass";
import { Photo } from "@/components/ui/Photo";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { ActivityList, CheckList, DueListView } from "@/components/features/Lists";
import { HoldBanner, LocationDetail, LocationStats } from "@/components/features/Details";
import { POINTS } from "@/lib/domain";

const TrendChart = dynamic(() => import("@/components/features/TrendChart"), { ssr: false, loading: () => <div className="h-48" /> });
const Donut = dynamic(() => import("@/components/features/Donut"), { ssr: false, loading: () => <div className="h-40" /> });

export default function Dashboard() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const role = useStore((s) => s.role);
  const employees = useStore((s) => s.employees);
  const locations = useStore((s) => s.locations);
  const audit = useStore((s) => s.audit);
  const allVehicles = useStore((s) => s.vehicles);
  const allChecks = useStore((s) => s.checks);
  const allDue = useStore((s) => s.due);
  const allHolds = useStore((s) => s.holds);
  const { checks, due, holds, vehicles, loc } = useScoped();
  const k = useMemo(() => kpis(checks, due), [checks, due]);
  const tr = useMemo(() => trend(checks), [checks]);
  const hr = new Date().getHours();
  const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const name = empName(employees, currentUserId(role), lang).replace(/^(Dr\. |د\. )/, "").split(" ")[0];
  const activeHolds = holds.filter((h) => h.state !== "released");
  const awaiting = checks.filter((c) => c.status === "awaiting");
  const feed = audit.filter((a) => loc === "all" || a.target.startsWith(loc) || allVehicles.some((v) => v.locationId === loc && a.target === v.id));
  const yPass = tr[5] && tr[5].total ? tr[5].pass / tr[5].total : k.passRate;
  const delta = (k.passRate - yPass) * 100;
  const refN = vehicles.filter((v) => v.type === "refueller").length, dspN = vehicles.length - refN;

  const byPoint = (["tank_sump", "filter_sump", "filter_outlet", "tank_drain"] as const).map((p, i) => ({
    name: POINTS[p].label, value: k.today.filter((c) => c.point === p).length, color: ["#2dd4bf", "#3b82f6", "#f5a524", "#64748b"][i],
  })).filter((d) => d.value > 0);

  const kpiDefs = [
    { id: "kpi-samples", label: "Samples today", v: k.completed, icon: ClipboardCheck, tone: "bg-info/15 text-info-fg", sub: `${k.dueN} due · ${k.overdue} overdue`, body: () => <CheckList checks={k.today} /> },
    { id: "kpi-pass", label: t("Pass rate"), v: k.passRate * 100, dec: 1, suffix: "%", icon: Check, tone: "bg-pass/15 text-pass-fg", delta, body: () => <CheckList checks={k.today.filter((c) => c.result === "pass")} /> },
    { id: "kpi-failed", label: "Samples failed", v: k.failed, icon: X, tone: "bg-fail/15 text-fail-fg", sub: `${activeHolds.length} on HOLD`, body: () => <CheckList checks={k.today.filter((c) => c.result === "fail")} /> },
    { id: "kpi-pending", label: "Pending approvals", v: awaiting.length, icon: ShieldCheck, tone: "bg-pending/15 text-pending-fg", sub: t("Awaiting supervisor"), body: () => <CheckList checks={awaiting} limit={40} /> },
    { id: "kpi-vehicles", label: "Active vehicles", v: vehicles.length, icon: Truck, tone: "bg-info/15 text-info-fg", sub: `${dspN} Dispensers · ${refN} Refuellers`, body: () => <DueListView due={due} /> },
    { id: "kpi-locations", label: t("Locations"), v: loc === "all" ? locations.length : 1, icon: MapPin, tone: "bg-teal/15 text-teal", sub: "Demo locations", body: () => <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{locations.map((l) => <Link key={l.id} href={`/locations?open=${l.id}`} className="rounded-xl bg-white/5 p-4 text-sm hover:bg-white/10"><span className="font-mono text-xs text-muted">{l.id}</span><span className="mt-1 block font-medium">{lang === "ar" ? l.nameAr : l.name}</span></Link>)}</div> },
  ];

  const recent = k.today.slice(0, 7);

  return (
    <ExpandGroup>
      <Stagger className="space-y-4">
        <Rise>
          <Photo crop="full" className="rounded-[20px] border border-hair" scrim="from-[#050b18]/15 via-[#050b18]/55 to-[#050b18]/92">
            <div className="flex min-h-[210px] flex-col justify-end gap-5 p-5 md:min-h-[250px] md:flex-row md:items-end md:justify-between md:p-8">
              <div>
                <p className="eyebrow !text-teal">{loc === "all" ? "Jeddah" : loc} · {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
                <h1 className="mt-2 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[42px]">{t(greet)}, {name}</h1>
                <p className="mt-2 max-w-xl text-sm text-white/70">{k.completed} samples recorded today, {Math.round(k.pct * 100)}% of the schedule complete. {activeHolds.length ? `${activeHolds.length} vehicle${activeHolds.length > 1 ? "s" : ""} on HOLD.` : "No vehicles on HOLD."}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(role === "operator" || role === "supervisor") && <Link href="/scan" className="cta inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm">Start sampling <ArrowRight size={16} className="rtl:rotate-180" /></Link>}
                <Link href="/holds" className="glass inline-flex h-11 items-center gap-2 px-5 text-sm font-medium hover:bg-white/10" style={{ borderRadius: 12 }}>{activeHolds.length ? <StatusBadge kind="fail">{activeHolds.length}</StatusBadge> : null} Failures</Link>
              </div>
            </div>
          </Photo>
        </Rise>

        {activeHolds.length > 0 && (
          <Rise>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {activeHolds.map((h) => <Link key={h.id} href="/holds"><HoldBanner vehicleId={`${h.vehicleId} · ${POINTS[h.point].label}`} /></Link>)}
            </div>
          </Rise>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {kpiDefs.map((d) => (
            <Rise key={d.id} className="h-full">
              <ExpandCard
                id={d.id} title={d.label}
                card={
                  <div className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", d.tone)}><d.icon size={20} strokeWidth={1.5} /></span>
                      <span className="text-[28px] font-semibold leading-8"><CountUp value={d.v} decimals={d.dec ?? 0} suffix={d.suffix} /></span>
                    </div>
                    <div>
                      <p className="text-sm text-muted">{d.label}</p>
                      {"delta" in d && d.delta !== undefined ? <p className={cn("mt-0.5 flex items-center gap-1 text-xs font-medium", d.delta >= 0 ? "text-pass-fg" : "text-fail-fg")}>{d.delta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}{Math.abs(d.delta).toFixed(1)}% vs yesterday</p> : <p className="mt-0.5 text-xs text-faint">{d.sub}</p>}
                    </div>
                  </div>
                }
                detail={() => <div className="mx-auto max-w-3xl"><p className="mb-4 text-sm text-muted">{fmtDate(Date.now())} · {t("Demo data")}</p>{d.body()}</div>}
              />
            </Rise>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Rise className="lg:col-span-2">
            <ExpandCard
              id="trend" title={t("7-day trend")}
              card={
                <div className="p-5">
                  <div className="mb-2 flex items-center justify-between"><h3 className="text-base font-semibold">Daily Sampling Trend</h3>
                    <span className="flex items-center gap-3 text-xs text-muted"><i className="size-2 rounded-full bg-teal" /> {t("Pass")} <i className="size-2 rounded-full bg-fail" /> {t("Fail")}</span></div>
                  <TrendChart data={tr} height={190} />
                </div>
              }
              detail={() => (
                <div className="space-y-5">
                  <TrendChart data={tr} height={320} bars />
                  <table className="w-full text-sm"><thead className="text-xs uppercase text-muted"><tr><th className="py-2 text-start">Day</th><th className="text-end">Total</th><th className="text-end">{t("Pass")}</th><th className="text-end">{t("Fail")}</th></tr></thead>
                    <tbody>{tr.map((r, i) => <tr key={i} className="border-t border-hair"><td className="py-2">{r.day}</td><td className="text-end tnum">{r.total}</td><td className="text-end tnum text-pass-fg">{r.pass}</td><td className="text-end tnum text-fail-fg">{r.fail}</td></tr>)}</tbody></table>
                </div>
              )}
            />
          </Rise>
          <Rise>
            <ExpandCard
              id="ring" title={t("Today's compliance")}
              card={
                <div className="flex h-full flex-col p-5">
                  <h3 className="mb-3 text-base font-semibold">Overall Compliance</h3>
                  <div className="flex flex-1 items-center gap-5">
                    <Ring value={k.passRate} size={132} stroke={12}><span className="text-2xl font-semibold"><CountUp value={k.passRate * 100} decimals={1} suffix="%" /></span></Ring>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><i className="size-2 rounded-full bg-pass" /><span className="text-muted">{t("Pass")}</span><b className="ms-auto ps-3 tnum">{k.passed}</b></li>
                      <li className="flex items-center gap-2"><i className="size-2 rounded-full bg-fail" /><span className="text-muted">{t("Fail")}</span><b className="ms-auto ps-3 tnum">{k.failed}</b></li>
                      <li className="flex items-center gap-2"><i className="size-2 rounded-full bg-pending" /><span className="text-muted">{t("Pending")}</span><b className="ms-auto ps-3 tnum">{k.dueN + k.overdue}</b></li>
                    </ul>
                  </div>
                </div>
              }
              detail={() => (
                <div className="mx-auto max-w-2xl space-y-3">
                  {locations.map((l) => {
                    const st = LocationStats(l.id, allVehicles, allChecks, allDue, allHolds);
                    return (
                      <div key={l.id} className="rounded-xl bg-white/5 p-4">
                        <div className="mb-2 flex justify-between text-sm"><span className="font-medium">{lang === "ar" ? l.nameAr : l.name}</span><span className="tnum">{Math.round(st.pct * 100)}%</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-teal2 to-sky" style={{ width: `${st.pct * 100}%`, background: "linear-gradient(90deg,#14b8a6,#3b82f6)" }} /></div>
                        <p className="mt-2 text-xs text-muted">{st.done} done · {st.pending} outstanding · {st.open} open failures</p>
                      </div>
                    );
                  })}
                </div>
              )}
            />
          </Rise>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Rise>
            <div className="glass h-full p-5" style={{ borderRadius: 16 }}>
              <h3 className="mb-1 text-base font-semibold">Inspections by Sampling Point</h3>
              <div className="flex items-center gap-4">
                <div className="w-36 shrink-0"><Donut data={byPoint} total={k.completed} height={150} /></div>
                <ul className="min-w-0 flex-1 space-y-2 text-sm">{byPoint.map((d) => <li key={d.name} className="flex items-center gap-2"><i className="size-2 shrink-0 rounded-full" style={{ background: d.color }} /><span className="truncate text-muted">{d.name}</span><b className="ms-auto tnum">{Math.round((d.value / Math.max(1, k.completed)) * 100)}%</b></li>)}</ul>
              </div>
            </div>
          </Rise>
          <Rise className="lg:col-span-2">
            <ExpandCard
              id="feed" title="Recent Sampling Activities"
              card={
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-semibold">Recent Sampling Activities</h3><Link href="/records" onClick={(e) => e.stopPropagation()} className="text-xs text-teal hover:underline">View all</Link></div>
                  <div className="overflow-x-auto">
                    <table className="tbl min-w-[34rem]">
                      <thead><tr><th>Time</th><th>Vehicle</th><th>Sampling Point</th><th>Tests</th><th>Result</th><th>Employee</th></tr></thead>
                      <tbody>{recent.map((c) => (
                        <tr key={c.id}><td className="tnum text-muted">{fmtTime(c.ts)}</td><td className="font-mono text-[13px]">{c.vehicleId}</td><td>{POINTS[c.point].label}</td><td className="text-muted">VAC, CWD</td>
                          <td><StatusBadge kind={c.result === "pass" ? "pass" : "fail"}>{c.result === "pass" ? t("Pass") : t("Fail")}</StatusBadge></td><td className="font-mono text-xs text-muted">{c.employeeId}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              }
              detail={() => <div className="mx-auto max-w-3xl"><ActivityList entries={feed.slice(0, 60)} full /></div>}
            />
          </Rise>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {locations.map((l) => {
            const st = LocationStats(l.id, allVehicles, allChecks, allDue, allHolds);
            return (
              <Rise key={l.id}>
                <ExpandCard
                  id={`loc-${l.id}`} title={lang === "ar" ? l.nameAr : l.name}
                  card={
                    <div className="flex h-full flex-col gap-3 p-5">
                      <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-medium"><MapPin size={16} strokeWidth={1.5} className="text-teal" />{lang === "ar" ? l.nameAr : l.name}</span>{st.open > 0 ? <StatusBadge kind="fail">{st.open} HOLD</StatusBadge> : <StatusBadge kind="pass">OK</StatusBadge>}</div>
                      <div><div className="mb-1 flex justify-between text-xs text-muted"><span>{t("Completion today")}</span><span className="tnum">{Math.round(st.pct * 100)}%</span></div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${st.pct * 100}%`, background: st.open ? "#f5a524" : "linear-gradient(90deg,#14b8a6,#3b82f6)" }} /></div></div>
                      <p className="text-xs text-faint">{st.fleet} vehicles · {st.done} samples today</p>
                    </div>
                  }
                  detail={() => <LocationDetail location={l} />}
                />
              </Rise>
            );
          })}
        </div>

        {(due.some((d) => d.state === "overdue") || awaiting.length > 0) && (
          <Rise>
            <div className="glass p-5" style={{ borderRadius: 16 }}>
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><TriangleAlert size={16} strokeWidth={1.5} className="text-pending-fg" /> {t("Needs attention")}</h3>
              <DueListView due={due.filter((d) => d.state === "overdue")} />
            </div>
          </Rise>
        )}
      </Stagger>
    </ExpandGroup>
  );
}
