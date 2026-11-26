"use client";
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { useStore } from "@/lib/store";
import { useApplicable, useT } from "@/lib/hooks";
import { OCCASIONS, OCCASION_ORDER, POINTS, pointsForVehicle } from "@/lib/domain";
import { DIAGRAM, NODE_STATUS_LABEL, type NodeStatus } from "@/lib/hotspots";
import { DispenserSvg } from "@/components/illustrations/Vehicles";
import { ago } from "@/lib/utils";
import type { Check, OccasionId, PointId, Vehicle } from "@/lib/types";

const RING: Record<NodeStatus, string> = {
  pending: "#9b7cc8", due: "#f44350", completed: "#279c69", failed: "#e54657", hold: "#e5732f", na: "#b9b0c4",
};
const BADGE: Record<NodeStatus, string> = {
  pending: "bg-[#f1ebf8] text-[#4b1b87]", due: "bg-[#fff0f1] text-[#c4223f]", completed: "bg-[#e8f6ef] text-[#11805a]",
  failed: "bg-[#fdecee] text-[#c4223f]", hold: "bg-[#fff3e8] text-[#a8480a]", na: "bg-[#f1eff3] text-[#766784]",
};

/** Status of every sampling point on one vehicle, derived from live demo state. */
export function useNodeStatus(vehicle: Vehicle, occasion: OccasionId | null) {
  const checks = useStore((s) => s.checks);
  const holds = useStore((s) => s.holds);
  const due = useStore((s) => s.due);
  const applicable = useApplicable();
  return useMemo(() => {
    const pts = pointsForVehicle(vehicle.type);
    const allowed = occasion ? applicable(occasion, vehicle.type) : pts;
    const out = {} as Record<PointId, { status: NodeStatus; last?: Check; enabled: boolean }>;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const p of pts) {
      const last = checks.find((c) => c.vehicleId === vehicle.id && c.point === p);
      const hold = holds.find((h) => h.vehicleId === vehicle.id && h.point === p && h.state !== "released");
      const isDue = due.some((d) => d.vehicleId === vehicle.id && d.point === p);
      const enabled = allowed.includes(p);
      let status: NodeStatus = "pending";
      if (!enabled) status = "na";
      else if (hold) status = hold.state === "hold" ? "failed" : "hold";
      else if (last?.result === "fail") status = "failed";
      else if (isDue) status = "due";
      else if (last && last.ts >= today.getTime()) status = "completed";
      out[p] = { status, last, enabled };
    }
    return out;
  }, [checks, holds, due, vehicle, occasion, applicable]);
}

export function StatusDot({ s }: { s: NodeStatus }) {
  const t = useT();
  return <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", BADGE[s])}><span className="size-1.5 rounded-full" style={{ background: RING[s] }} />{t(NODE_STATUS_LABEL[s])}</span>;
}

export function Legend() {
  const t = useT();
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted" aria-label="Legend">
      {(["pending", "due", "completed", "failed", "hold", "na"] as NodeStatus[]).map((s) => (
        <li key={s} className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 bg-white" style={{ borderColor: RING[s] }} />{t(NODE_STATUS_LABEL[s])}</li>
      ))}
    </ul>
  );
}

/** Origin id for the node-to-form shared transition. */
export const nodeLayoutId = (vehicleId: string, p: PointId) => `node-${vehicleId}-${p}`;

export function VehicleDiagram({ vehicle, occasion = null, activePoint = null, onSelect, editable = false, className }: {
  vehicle: Vehicle; occasion?: OccasionId | null; activePoint?: PointId | null; onSelect?: (p: PointId, el?: HTMLElement | null) => void; editable?: boolean; className?: string;
}) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const hs = useStore((s) => s.hotspots)[vehicle.type];
  const setHotspot = useStore((s) => s.setHotspot);
  const cfg = DIAGRAM[vehicle.type];
  const st = useNodeStatus(vehicle, occasion);
  const pts = pointsForVehicle(vehicle.type);
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<PointId | null>(null);
  const [drag, setDrag] = useState<PointId | null>(null);
  const [zoom, setZoom] = useState(false);

  const move = (e: React.PointerEvent) => {
    if (!drag || !box.current) return;
    const r = box.current.getBoundingClientRect();
    setHotspot(vehicle.type, drag, ((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  };

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-[var(--hair)] bg-white p-1.5 sm:p-3 md:p-5", className)}>
      <div className={cn(zoom ? "overflow-x-auto py-10" : "sm:py-10")}>
      {/* The physical drawing is never mirrored in RTL: dir stays ltr here. */}
      <div dir="ltr" ref={box} className="relative mx-auto w-full max-w-4xl select-none" style={{ aspectRatio: `${cfg.w} / ${cfg.h}`, minWidth: zoom ? 680 : undefined }}
        onPointerMove={editable ? move : undefined} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}>
        {cfg.src ? (
          <Image src={cfg.src} alt={`${vehicle.id} sampling-point cutaway`} fill sizes="(min-width:1024px) 900px, 100vw" className="object-contain" priority unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><DispenserSvg className="h-full w-full" /></div>
        )}
        {pts.map((p) => {
          const pos = hs[p];
          if (!pos) return null;
          const n = st[p];
          const sel = activePoint === p;
          const on = sel || hover === p;
          const down = pos.side !== "up";
          const inert = !editable && !n.enabled;
          return (
            <div key={p} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
              <button
                type="button"
                disabled={inert}
                onPointerDown={editable ? (e) => { e.currentTarget.setPointerCapture?.(e.pointerId); setDrag(p); } : undefined}
                onClick={(e) => !editable && onSelect?.(p, e.currentTarget)}
                onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(p)} onBlur={() => setHover(null)}
                aria-label={`${lang === "ar" ? POINTS[p].labelAr : POINTS[p].label}, ${NODE_STATUS_LABEL[n.status]}`}
                data-node={p}
                className={cn("group absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#4b1b87]", editable ? "cursor-grab touch-none" : inert ? "cursor-not-allowed" : "cursor-pointer")}
              >
                {n.enabled && n.status !== "completed" && <span className="absolute size-8 animate-ping rounded-full opacity-25 [animation-duration:2.6s]" style={{ background: RING[n.status] }} />}
                <motion.span
                  animate={{ scale: on ? 1.18 : 1 }} whileTap={{ scale: 1.1 }} transition={spring}
                  className="relative flex size-[22px] items-center justify-center border-[3px] shadow-[0_1px_4px_rgba(38,22,56,0.22)]"
                  style={{ borderRadius: 9999, borderColor: sel ? "#35105f" : RING[n.status], background: sel ? "#4b1b87" : n.enabled ? "#fff" : "#f1eff3", outline: on ? "4px solid rgba(75,27,135,0.14)" : "none" }}
                >{sel && <span className="size-1.5 rounded-full bg-white" />}</motion.span>
              </button>
              <span aria-hidden className={cn("pointer-events-none absolute left-0 w-px -translate-x-1/2 bg-[#4b1b87]/30", !zoom && "hidden sm:block", down ? "top-[14px] h-6" : "bottom-[14px] h-6")} />
              <span aria-hidden className={cn("pointer-events-none absolute left-0 -translate-x-1/2 whitespace-nowrap rounded-full border bg-white/95 px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur md:text-xs", !zoom && "hidden sm:block", down ? "top-[38px]" : "bottom-[38px]", n.enabled ? "border-[var(--hair)] text-[#261638]" : "border-dashed border-[var(--hair)] text-[#766784]")}
                style={{ opacity: n.enabled || on ? 1 : 0.7 }}>
                {lang === "ar" ? POINTS[p].labelAr : POINTS[p].label}
              </span>
            </div>
          );
        })}
      </div>
      </div>
      <button type="button" onClick={() => setZoom((z) => !z)} aria-pressed={zoom} className="mx-auto mt-2 flex h-10 items-center rounded-full border border-[var(--hair)] bg-white px-4 text-xs font-semibold text-[#4b1b87] sm:hidden">{zoom ? t("Fit to screen") : t("Larger view")}</button>
      {!cfg.approved && (
        <p className="mt-2 rounded-xl bg-[#fff3e8] px-3 py-2 text-center text-xs font-medium text-[#a8480a]">
          {t("Schematic placeholder. The approved hydrant dispenser drawing is pending APSCO Engineering.")}
        </p>
      )}
      {editable && <p className="mt-2 text-center text-xs text-muted">{t("Drag a node to reposition it. Positions are stored as a percentage of the image.")}</p>}
      <div className="mt-3 border-t border-[var(--hair)] pt-3"><Legend /></div>
    </div>
  );
}

/** Compact selectable list under the diagram. Tapping an entry selects the same point as tapping its marker. */
export function SamplingPointList({ vehicle, occasion, activePoint, onSelect }: { vehicle: Vehicle; occasion: OccasionId | null; activePoint: PointId | null; onSelect: (p: PointId, el?: HTMLElement | null) => void }) {
  const lang = useStore((s) => s.lang);
  const t = useT();
  const st = useNodeStatus(vehicle, occasion);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {pointsForVehicle(vehicle.type).map((p, i) => {
        const n = st[p];
        return (
          <button key={p} type="button" disabled={!n.enabled} onClick={(e) => onSelect(p, e.currentTarget)} aria-pressed={activePoint === p}
            className={cn("flex min-h-12 items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 text-start transition-colors", activePoint === p ? "border-[#4b1b87] bg-[#f1ebf8]" : "border-[var(--hair)] hover:bg-[#f8f5fb]", !n.enabled && "opacity-55")}>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-[3px] bg-white text-[11px] font-bold" style={{ borderColor: RING[n.status] }}>{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{lang === "ar" ? POINTS[p].labelAr : POINTS[p].label}</span>
              <span className="block truncate text-xs text-muted">{n.last ? `${t("Last sample")} ${ago(n.last.ts)}` : t("No result yet")}</span>
            </span>
            <StatusDot s={n.status} />
          </button>
        );
      })}
    </div>
  );
}

export function OccasionFilter({ value, onChange, type }: { value: OccasionId | null; onChange: (o: OccasionId | null) => void; type: Vehicle["type"] }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const applicable = useApplicable();
  const list = OCCASION_ORDER.filter((o) => applicable(o, type).length);
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap" role="group" aria-label={t("Sampling occasion")}>
      {[null, ...list].map((o) => (
        <button key={o ?? "all"} type="button" onClick={() => onChange(o)} aria-pressed={value === o}
          className={cn("min-h-9 rounded-xl border px-3 py-1.5 text-center text-xs font-semibold leading-4 transition-colors sm:rounded-full sm:px-3.5", value === o ? "border-[#4b1b87] bg-[#eee7f5] text-[#4b1b87]" : "border-[var(--hair)] bg-white text-[#261638] hover:bg-[#f8f5fb]")}>
          {o ? (lang === "ar" ? OCCASIONS[o].labelAr : OCCASIONS[o].label) : t("All points")}
        </button>
      ))}
    </div>
  );
}
