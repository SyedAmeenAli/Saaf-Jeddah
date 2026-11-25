"use client";
import { useId } from "react";
import type { PointId, VehicleType } from "@/lib/types";

const LINE = "#a9bdd3";
const FAINT = "#5d7590";

function Wheel({ x, y = 166, r = 20 }: { x: number; y?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#0b1522" stroke={LINE} strokeWidth="1.2" />
      <circle r={r - 5} fill="none" stroke={FAINT} strokeWidth="1" />
      <circle r="4" fill={LINE} opacity=".7" />
      {Array.from({ length: 6 }).map((_, i) => <line key={i} x1="0" y1={-(r - 5)} x2="0" y2={-5} stroke={FAINT} strokeWidth="1" transform={`rotate(${i * 60})`} />)}
    </g>
  );
}

/** Technical side elevation of a road refueller: tank, side-mounted filter vessel, pump, hose reel. Hotspots are overlaid by HOTSPOTS. */
export function TruckSvg({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 400 210" className={className} role="img" aria-label="Refueller technical side elevation with sampling points">
      <defs>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dbe8f7" stopOpacity=".26" /><stop offset=".5" stopColor="#a9bdd3" stopOpacity=".10" /><stop offset="1" stopColor="#6e86a3" stopOpacity=".18" /></linearGradient>
        <linearGradient id={`v${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7fe3d6" stopOpacity=".34" /><stop offset=".45" stopColor="#dff7f3" stopOpacity=".12" /><stop offset="1" stopColor="#59dfce" stopOpacity=".26" /></linearGradient>
      </defs>
      <line x1="14" y1="187" x2="386" y2="187" stroke={FAINT} strokeWidth="1" strokeDasharray="3 4" />
      {/* chassis */}
      <rect x="36" y="146" width="338" height="7" rx="2" fill="none" stroke={LINE} strokeWidth="1.2" />
      {/* cab */}
      <path d="M38 146V98q0-10 9-13l34-12q8-3 14 3l20 26v44Z" fill={`url(#s${id})`} stroke={LINE} strokeWidth="1.3" />
      <path d="M62 98l24-8q6-1 9 3l10 14H62Z" fill="#0b1522" stroke={FAINT} strokeWidth="1" />
      <rect x="35" y="132" width="9" height="6" rx="1.5" fill="#d8ad76" opacity=".9" />
      {/* tank */}
      <rect x="124" y="62" width="250" height="82" rx="40" fill={`url(#s${id})`} stroke={LINE} strokeWidth="1.3" />
      {[176, 236, 296].map((x) => <line key={x} x1={x} y1="63" x2={x} y2="143" stroke={FAINT} strokeWidth="1" />)}
      <rect x="226" y="52" width="30" height="10" rx="2" fill="none" stroke={LINE} strokeWidth="1.2" />
      <line x1="150" y1="74" x2="350" y2="74" stroke="#fff" strokeOpacity=".28" strokeWidth="2" strokeLinecap="round" />
      <rect x="124" y="112" width="250" height="6" fill="#59dfce" opacity=".5" />
      {/* tank sump valve and rear drain */}
      <path d="M146 144v10h8v-10" fill="none" stroke={LINE} strokeWidth="1.2" /><rect x="143" y="154" width="14" height="5" rx="1" fill={LINE} opacity=".7" />
      <path d="M368 144v8h8v-8" fill="none" stroke={LINE} strokeWidth="1.2" /><rect x="365" y="152" width="14" height="5" rx="1" fill={LINE} opacity=".7" />
      {/* filter vessel (side mounted) */}
      <g>
        <rect x="236" y="112" width="40" height="54" rx="14" fill={`url(#v${id})`} stroke="#59dfce" strokeWidth="1.4" />
        <line x1="236" y1="124" x2="276" y2="124" stroke="#59dfce" strokeOpacity=".6" /><line x1="236" y1="154" x2="276" y2="154" stroke="#59dfce" strokeOpacity=".6" />
        <circle cx="256" cy="139" r="9" fill="#0b1522" stroke={LINE} strokeWidth="1.2" /><path d="M256 139l5-5" stroke="#d8ad76" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="251" y="166" width="10" height="8" rx="1.5" fill={LINE} opacity=".7" />
        <path d="M276 124h12v-12" fill="none" stroke={LINE} strokeWidth="1.4" />
      </g>
      {/* pump + hose reel */}
      <rect x="196" y="128" width="26" height="22" rx="4" fill="none" stroke={LINE} strokeWidth="1.2" /><circle cx="209" cy="139" r="5" fill="none" stroke={FAINT} />
      <circle cx="342" cy="106" r="15" fill="none" stroke={LINE} strokeWidth="1.2" /><circle cx="342" cy="106" r="6" fill="none" stroke={FAINT} />
      <Wheel x={84} /><Wheel x={304} /><Wheel x={338} />
    </svg>
  );
}

/** Technical side elevation of a hydrant dispenser: hydrant coupler, filter vessel, control cabinet, hose reel. */
export function DispenserSvg({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 400 210" className={className} role="img" aria-label="Hydrant dispenser technical side elevation with sampling points">
      <defs>
        <linearGradient id={`d${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#dbe8f7" stopOpacity=".26" /><stop offset="1" stopColor="#6e86a3" stopOpacity=".16" /></linearGradient>
        <linearGradient id={`w${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7fe3d6" stopOpacity=".34" /><stop offset=".5" stopColor="#dff7f3" stopOpacity=".12" /><stop offset="1" stopColor="#59dfce" stopOpacity=".26" /></linearGradient>
      </defs>
      <line x1="14" y1="187" x2="386" y2="187" stroke={FAINT} strokeWidth="1" strokeDasharray="3 4" />
      <rect x="56" y="150" width="290" height="7" rx="2" fill="none" stroke={LINE} strokeWidth="1.2" />
      {/* hydrant coupler */}
      <path d="M56 128h50" stroke={LINE} strokeWidth="1.4" /><rect x="40" y="120" width="16" height="16" rx="3" fill="none" stroke={LINE} strokeWidth="1.3" /><path d="M48 112v8" stroke={LINE} strokeWidth="1.3" />
      {/* control cabinet */}
      <rect x="132" y="44" width="62" height="52" rx="6" fill={`url(#d${id})`} stroke={LINE} strokeWidth="1.3" />
      <rect x="142" y="54" width="42" height="18" rx="3" fill="#0b1522" stroke={FAINT} /><circle cx="150" cy="84" r="3.5" fill="#59dfce" /><circle cx="164" cy="84" r="3.5" fill="#d8ad76" />
      {/* filter vessel horizontal */}
      <rect x="120" y="94" width="196" height="54" rx="27" fill={`url(#w${id})`} stroke="#59dfce" strokeWidth="1.4" />
      {[160, 214, 268].map((x) => <line key={x} x1={x} y1="95" x2={x} y2="147" stroke="#59dfce" strokeOpacity=".45" />)}
      <circle cx="244" cy="121" r="9" fill="#0b1522" stroke={LINE} strokeWidth="1.2" /><path d="M244 121l5-5" stroke="#d8ad76" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M212 148v8h8v-8" fill="none" stroke={LINE} strokeWidth="1.2" /><rect x="209" y="156" width="14" height="5" rx="1" fill={LINE} opacity=".7" />
      {/* outlet + hose reel */}
      <path d="M316 118h22v-14" fill="none" stroke={LINE} strokeWidth="1.5" />
      <circle cx="356" cy="108" r="22" fill="none" stroke={LINE} strokeWidth="1.2" /><circle cx="356" cy="108" r="9" fill="none" stroke={FAINT} />
      <Wheel x={110} y={168} r={18} /><Wheel x={296} y={168} r={18} />
    </svg>
  );
}

/** Hotspot positions (% of the 400x210 viewBox). Hydrant dispensers have no tank points. */
export const HOTSPOTS: Record<VehicleType, Partial<Record<PointId, { x: number; y: number }>>> = {
  refueller: {
    tank_sump: { x: 37.5, y: 78 },
    tank_drain: { x: 94, y: 76 },
    filter_sump: { x: 64, y: 85 },
    filter_outlet: { x: 72, y: 59 },
  },
  dispenser: {
    filter_sump: { x: 54, y: 79 },
    filter_outlet: { x: 84.5, y: 56 },
  },
};

export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={label ?? "Loading"}>
      <span className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-teal" />
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );
}
