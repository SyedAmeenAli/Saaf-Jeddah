"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, OctagonAlert, Nfc, Play, QrCode, Radio } from "lucide-react";
import type { Check, Location, OccasionId, PointId, Vehicle } from "@/lib/types";
import { OccasionFilter, SamplingPointList, VehicleDiagram, useNodeStatus } from "./VehicleDiagram";
import { InspectionSheet } from "./Inspection";
import { useStore, empName } from "@/lib/store";
import { useApplicable, useCan, useT } from "@/lib/hooks";
import { OCCASIONS, OCCASION_ORDER, POINTS, pointsForVehicle } from "@/lib/domain";
import { vehicleStatus } from "@/lib/selectors";
import { cn, fmtDT, ago } from "@/lib/utils";
import { Button, StatusBadge, GlassCard, type StatusKind } from "@/components/ui/Glass";
import { DispenserSvg, HOTSPOTS, TruckSvg } from "@/components/illustrations/Vehicles";
import { HoldChain } from "./HoldChain";
import { SharedHero } from "@/components/ui/Expand";
import { VehicleArt } from "@/components/illustrations/VehicleArt";
import { spring } from "@/lib/motion";
import { T } from "@/components/ui/T";

export function ResultBadge({ c }: { c: Pick<Check, "result" | "status"> }) {
  const t = useT();
  return <StatusBadge kind={c.result === "pass" ? "pass" : "fail"}>{c.result === "pass" ? t("Pass") : t("Failed")}</StatusBadge>;
}
/** Supervisor review status only. Never implies the test result. */
export function StateBadge({ status }: { status: Check["status"] }) {
  const t = useT();
  const k: Record<Check["status"], [StatusKind, string]> = { awaiting: ["pending", t("Awaiting review")], approved: ["locked", t("Reviewed")], returned: ["info", t("Returned")] };
  return <StatusBadge kind={k[status][0]}>{k[status][1]}</StatusBadge>;
}
/** Operational status of the equipment, derived from the hold chain this sample belongs to. */
export function EquipmentBadge({ c }: { c: Pick<Check, "id" | "vehicleId" | "point" | "result"> }) {
  const t = useT();
  const holds = useStore((s) => s.holds);
  const h = holds.find((x) => x.events.some((e) => e.checkId === c.id)) ?? holds.find((x) => x.vehicleId === c.vehicleId && x.point === c.point && x.state !== "released" && c.result === "fail");
  if (!h) return <StatusBadge kind="pass">{t("In service")}</StatusBadge>;
  if (h.state === "released") return <StatusBadge kind="pass">{t("Released")}</StatusBadge>;
  if (h.state === "resampled") return <StatusBadge kind="pending">{t("Release pending")}</StatusBadge>;
  return <StatusBadge kind="fail">{t("On hold")}</StatusBadge>;
}
/** Three independent facts: test result, review status, equipment status. */
export function StatusTrio({ c, className }: { c: Check; className?: string }) {
  const t = useT();
  const cell = (label: string, el: React.ReactNode) => <span className="flex flex-col items-start gap-1"><span className="text-[10px] font-medium uppercase tracking-wider text-faint">{label}</span>{el}</span>;
  return (
    <div className={cn("flex flex-wrap gap-x-5 gap-y-2", className)}>
      {cell(t("Test result"), <ResultBadge c={c} />)}
      {cell(t("Review status"), <StateBadge status={c.status} />)}
      {cell(t("Equipment status"), <EquipmentBadge c={c} />)}
    </div>
  );
}

export function HoldBanner({ vehicleId, compact = false }: { vehicleId: string; compact?: boolean }) {
  const t = useT();
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-fail/30 bg-fail/10 font-semibold text-fail-fg", compact ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm")} role="alert">
      <OctagonAlert size={compact ? 14 : 18} />
      HOLD — {t("HOLD: Do not fuel").replace("HOLD: ", "").replace("إيقاف: ", "")}
      {!compact && <span className="ms-auto font-mono text-xs opacity-80">{vehicleId}</span>}
    </div>
  );
}

/* ---------------------------------------------------------------- vehicle */
export function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const t = useT();
  const can = useCan();
  const checks = useStore((s) => s.checks);
  const holds = useStore((s) => s.holds);
  const toast = useStore((s) => s.toast);
  const vh = holds.filter((h) => h.vehicleId === vehicle.id);
  const activeHold = vh.find((h) => h.state !== "released");
  const hist = checks.filter((c) => c.vehicleId === vehicle.id);
  const pts = pointsForVehicle(vehicle.type);
  const due = useStore((s) => s.due);
  const applicable = useApplicable();
  const [occ, setOcc] = useState<OccasionId | null>(null);
  const [active, setActive] = useState<PointId | null>(() => {
    if (typeof window === "undefined") return null;
    const p = new URLSearchParams(window.location.search).get("pt") as PointId | null;
    return p && pts.includes(p) ? p : null;
  });
  const st = useNodeStatus(vehicle, occ);
  const nextDue = due.filter((d) => d.vehicleId === vehicle.id).sort((a, b) => a.dueTs - b.dueTs)[0];
  const lastCheck = hist[0];
  const canSample = can("sample") || can("verify");

  // Node -> inspection: history entry so browser Back reverses the transition.
  useEffect(() => {
    const onPop = () => { if (!new URLSearchParams(window.location.search).get("pt")) setActive(null); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const openPoint = (p: PointId, el?: HTMLElement | null) => {
    if (!canSample) { toast("info", "Read-only for this role"); return; }
    if (!st[p].enabled) return;
    const r = el?.getBoundingClientRect();
    setOrigin(r ? { x: ((r.left + r.width / 2) / window.innerWidth) * 100, y: ((r.top + r.height / 2) / window.innerHeight) * 100 } : null);
    const u = new URL(window.location.href); u.searchParams.set("pt", p);
    window.history.pushState(null, "", u.pathname + u.search);
    setActive(p);
  };
  const closePoint = () => {
    if (new URLSearchParams(window.location.search).get("pt")) window.history.back(); else setActive(null);
  };
  const occFor = (p: PointId): OccasionId => occ && applicable(occ, vehicle.type).includes(p) ? occ : (OCCASION_ORDER.find((o) => applicable(o, vehicle.type).includes(p)) ?? "start_shift");

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
      <div className="min-w-0 space-y-5">
        {activeHold && <HoldBanner vehicleId={vehicle.id} />}
        <div className="glass p-4 md:p-5" style={{ borderRadius: 20 }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{vehicle.type === "refueller" ? t("Refueller") : t("Hydrant dispenser")} · {vehicle.locationId}</p>
              <p className="font-display text-3xl font-semibold">{vehicle.id}</p>
              <p className="mt-0.5 font-mono text-xs text-muted">{vehicle.plate}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
              <div><p className="text-muted">{t("Last sample")}</p><p className="font-semibold">{lastCheck ? ago(lastCheck.ts) : "–"}</p></div>
              <div><p className="text-muted">{t("Next scheduled")}</p><p className="font-semibold">{nextDue ? `${POINTS[nextDue.point].label} · ${fmtDT(nextDue.dueTs)}` : "–"}</p></div>
              <div><p className="text-muted">{t("Open holds")}</p><p className="font-semibold">{vh.filter((h) => h.state !== "released").length}</p></div>
            </div>
          </div>
        </div>

        <div className="glass space-y-3 p-2 sm:p-3 md:p-4" style={{ borderRadius: 20 }}>
          <div className="flex items-center justify-between gap-3 px-1">
            <h3 className="font-display text-lg font-semibold">{t("Sampling points")}</h3>
            <span className="text-xs text-muted">{canSample ? t("Tap a node to start sampling") : t("Read-only for this role")}</span>
          </div>
          <OccasionFilter value={occ} onChange={setOcc} type={vehicle.type} />
          <VehicleDiagram vehicle={vehicle} occasion={occ} activePoint={active} onSelect={openPoint} />
          <SamplingPointList vehicle={vehicle} occasion={occ} activePoint={active} onSelect={openPoint} />
        </div>
        {active && (
          <InspectionSheet open vehicle={vehicle} point={active} occasion={occFor(active)} origin={origin}
            onClose={closePoint} onDone={() => {}} />
        )}

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
