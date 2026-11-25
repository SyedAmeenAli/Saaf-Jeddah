"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, OctagonAlert, Nfc, Play, QrCode, Radio } from "lucide-react";
import type { Check, Location, Vehicle } from "@/lib/types";
import { useStore, empName } from "@/lib/store";
import { useCan, useT } from "@/lib/hooks";
import { OCCASIONS, POINTS, pointsForVehicle } from "@/lib/domain";
import { vehicleStatus } from "@/lib/selectors";
import { cn, fmtDT, ago } from "@/lib/utils";
import { Button, StatusBadge, GlassCard, type StatusKind } from "@/components/ui/Glass";
import { DispenserSvg, HOTSPOTS, TruckSvg } from "@/components/illustrations/Vehicles";
import { HoldChain } from "./HoldChain";
import { spring } from "@/lib/motion";
import { T } from "@/components/ui/T";

export function ResultBadge({ c }: { c: Pick<Check, "result" | "status"> }) {
  const t = useT();
  return <StatusBadge kind={c.result === "pass" ? "pass" : "fail"}>{c.result === "pass" ? t("Pass") : t("Fail")}</StatusBadge>;
}
export function StateBadge({ status }: { status: Check["status"] }) {
  const t = useT();
  const k: Record<Check["status"], [StatusKind, string]> = { awaiting: ["pending", t("Awaiting supervisor")], approved: ["locked", t("Approved")], returned: ["info", t("Returned")] };
  return <StatusBadge kind={k[status][0]}>{k[status][1]}</StatusBadge>;
}

export function HoldBanner({ vehicleId, compact = false }: { vehicleId: string; compact?: boolean }) {
  const t = useT();
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border border-fail/60 bg-fail/20 font-semibold text-fail-fg", compact ? "px-3 py-1.5 text-xs" : "px-4 py-3 text-base")} role="alert">
      <OctagonAlert size={compact ? 14 : 22} />
      HOLD — {t("HOLD: Do not fuel").replace("HOLD: ", "").replace("إيقاف: ", "")}
      {!compact && <span className="ms-auto font-mono text-xs opacity-80">{vehicleId}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------- vehicle */
export function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const t = useT();
  const can = useCan();
  const lang = useStore((s) => s.lang);
  const checks = useStore((s) => s.checks);
  const holds = useStore((s) => s.holds);
  const employees = useStore((s) => s.employees);
  const [sel, setSel] = useState(pointsForVehicle(vehicle.type)[0]);
  const vh = holds.filter((h) => h.vehicleId === vehicle.id);
  const activeHold = vh.find((h) => h.state !== "released");
  const hist = checks.filter((c) => c.vehicleId === vehicle.id);
  const last = (p: typeof sel) => hist.find((c) => c.point === p);
  const lc = last(sel);
  const hs = HOTSPOTS[vehicle.type];
  const pts = pointsForVehicle(vehicle.type);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1fr]">
      <div className="space-y-5">
        {activeHold && <HoldBanner vehicleId={vehicle.id} />}
        <div className="glass relative overflow-hidden p-4 md:p-6" style={{ borderRadius: 20 }}>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{vehicle.type === "refueller" ? t("Refueller") : t("Hydrant dispenser")} · {vehicle.locationId}</p>
              <p className="font-display text-3xl font-semibold">{vehicle.id}</p>
            </div>
            
          </div>
          <div className="relative mx-auto max-w-xl">
            {vehicle.type === "refueller" ? <TruckSvg className="w-full" /> : <DispenserSvg className="w-full" />}
            {pts.map((p) => {
              const pos = hs[p]!;
              const lr = last(p);
              const failed = lr?.result === "fail";
              const hot = sel === p;
              return (
                <button
                  key={p}
                  onClick={() => setSel(p)}
                  aria-label={`${POINTS[p].label}${lr ? `, last result ${lr.result}` : ""}`}
                  aria-pressed={hot}
                  className="group absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <span className={cn("absolute size-7 rounded-full opacity-25", failed ? "bg-fail" : "bg-teal")} />
                  <motion.span animate={{ scale: hot ? 1.25 : 1 }} transition={spring}
                    className={cn("relative size-5 rounded-full border-2 border-white shadow-lg", failed ? "bg-fail" : lr ? "bg-pass" : "bg-pending")} />
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {pts.map((p) => {
              const lr = last(p);
              return (
                <button key={p} onClick={() => setSel(p)} className={cn("flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-start transition-colors", sel === p ? "border-teal bg-teal/10" : "border-hair bg-hi")}>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{lang === "ar" ? POINTS[p].labelAr : POINTS[p].label}</span>
                    <span className="block text-xs text-muted">{lr ? ago(lr.ts) : t("No result yet")}</span>
                  </span>
                  {lr && <ResultBadge c={lr} />}
                </button>
              );
            })}
            {vehicle.type === "dispenser" && (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-hair px-3 py-2.5 text-sm text-faint sm:col-span-2">Tank sump / tank drain: {t("Not applicable")} (no tank on hydrant dispensers)</div>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-hi p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">{t("Last result")} · {lang === "ar" ? POINTS[sel].labelAr : POINTS[sel].label}</p>
                {lc ? (
                  <p className="mt-1 text-sm"><span className="font-mono">{lc.sampleId}</span><br /><span className="text-muted">{fmtDT(lc.ts)} · {empName(employees, lc.employeeId, lang)}</span></p>
                ) : <p className="mt-1 text-sm text-muted">{t("No result yet")}</p>}
              </div>
              {can("sample") || can("verify") ? (
                <Button variant="primary" onClick={() => router.push(`/scan?v=${vehicle.id}&p=${sel}`)}><Play size={16} /> {t("Start check")}</Button>
              ) : <span className="inline-flex items-center gap-1.5 text-xs text-muted"><Lock size={13} /> {t("Read-only for this role")}</span>}
            </motion.div>
          </AnimatePresence>
        </div>

        {vh.length > 0 && (
          <div className="glass p-5 md:p-6" style={{ borderRadius: 20 }}>
            <h3 className="mb-4 font-display text-lg font-semibold">{t("Failure management")}</h3>
            <div className="space-y-6">{vh.map((h) => <HoldChain key={h.id} hold={h} />)}</div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="glass p-5" style={{ borderRadius: 20 }}>
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><Nfc size={18} className="text-teal" /> {t("NFC tag")}</h3>
          <ul className="space-y-2 text-sm">
            {pts.map((p) => (
              <li key={p} className="flex items-center gap-3 rounded-xl bg-hi px-3 py-2">
                <QrCode size={18} className="text-muted" />
                <span className="flex-1 text-muted">{POINTS[p].label}</span>
                <span className="font-mono text-xs">{vehicle.tags[p]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-faint"><Radio size={12} /> Plate {vehicle.plate} · Demo data</p>
        </div>
        <div className="glass p-5" style={{ borderRadius: 20 }}>
          <h3 className="mb-4 font-display text-lg font-semibold">{t("History")}</h3>
          <ol className="relative max-h-[28rem] space-y-3 overflow-y-auto ps-5 pe-1">
            <span className="absolute bottom-2 start-[0.45rem] top-2 w-px bg-hair-strong" />
            {hist.slice(0, 14).map((c) => (
              <li key={c.id} className="relative">
                <span className={cn("absolute -start-[1.05rem] top-1.5 size-2.5 rounded-full ring-4 ring-[var(--bg)]", c.result === "pass" ? "bg-pass" : "bg-fail")} />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{POINTS[c.point].label}</span>
                  <ResultBadge c={c} />
                  {c.kind === "resample" && <StatusBadge kind="info"><T>{"Re-sample"}</T></StatusBadge>}
                </div>
                <p className="text-xs text-muted">{fmtDT(c.ts)} · {c.employeeId} · {OCCASIONS[c.occasion].label}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- location */
export function LocationStats(locationId: string, vehicles: Vehicle[], checks: Check[], due: { locationId: string }[], holds: { locationId: string; state: string }[]) {
  const s = new Date(); s.setHours(0, 0, 0, 0);
  const fleet = vehicles.filter((v) => v.locationId === locationId).length;
  const done = checks.filter((c) => c.locationId === locationId && c.ts >= s.getTime()).length;
  const pending = due.filter((d) => d.locationId === locationId).length;
  const pct = done + pending ? done / (done + pending) : 1;
  const open = holds.filter((h) => h.locationId === locationId && h.state !== "released").length;
  return { fleet, done, pending, pct, open };
}

export function LocationDetail({ location }: { location: Location }) {
  const vehicles = useStore((s) => s.vehicles);
  const checks = useStore((s) => s.checks);
  const due = useStore((s) => s.due);
  const holds = useStore((s) => s.holds);
  const t = useT();
  const st = LocationStats(location.id, vehicles, checks, due, holds);
  const list = vehicles.filter((v) => v.locationId === location.id);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[[t("Fleet size"), st.fleet], [t("Completion today"), `${Math.round(st.pct * 100)}%`], [t("Open failures"), st.open], [t("Overdue"), due.filter((d) => d.locationId === location.id && d.state === "overdue").length]].map(([l, v]) => (
          <GlassCard key={l as string} className="p-4" sheen={false}><p className="text-xs text-muted">{l}</p><p className="font-display text-3xl font-semibold">{v}</p></GlassCard>
        ))}
      </div>
      <h3 className="font-display text-lg font-semibold">{t("Vehicles")}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((v) => {
          const s = vehicleStatus(v, holds, due, checks);
          return (
            <Link key={v.id} href={`/fleet?open=${v.id}`} className="flex items-center gap-3 rounded-2xl bg-hi px-4 py-3 hover:bg-teal/10">
              <span className="font-mono text-sm font-semibold">{v.id}</span>
              <span className="flex-1 text-xs text-muted">{v.type === "refueller" ? t("Refueller") : t("Hydrant dispenser")}</span>
              <StatusPill s={s} />
            </Link>
          );
        })}
      </div>
      <p className="flex items-center gap-2 text-xs text-faint"> {t("Demo data")}</p>
    </div>
  );
}

export function StatusPill({ s }: { s: ReturnType<typeof vehicleStatus> }) {
  if (s === "hold") return <StatusBadge kind="fail">HOLD</StatusBadge>;
  if (s === "overdue") return <StatusBadge kind="fail"><T>{"Overdue"}</T></StatusBadge>;
  if (s === "due") return <StatusBadge kind="pending"><T>{"Due"}</T></StatusBadge>;
  if (s === "pending") return <StatusBadge kind="pending"><T>{"Verify"}</T></StatusBadge>;
  return <StatusBadge kind="pass">OK</StatusBadge>;
}
