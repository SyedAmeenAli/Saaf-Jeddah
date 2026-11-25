"use client";
import type { PointId } from "@/lib/types";

const L = "#cdbfe6", F = "#8d809f", T = "#b58aff", A = "#ff405c";

/** Filter vessel close-up. `hot` marks the sampling valve being used. */
export function FilterVesselSvg({ hot, className = "" }: { hot: "sump" | "outlet" | null; className?: string }) {
  const on = (k: "sump" | "outlet") => (hot === k ? T : L);
  return (
    <svg viewBox="0 0 220 200" className={className} role="img" aria-label="Filter vessel with sampling valves">
      <defs><linearGradient id="fvg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#d7bcff" stopOpacity=".34" /><stop offset=".5" stopColor="#efe6ff" stopOpacity=".12" /><stop offset="1" stopColor="#b58aff" stopOpacity=".26" /></linearGradient></defs>
      <rect x="70" y="30" width="80" height="120" rx="34" fill="url(#fvg)" stroke={T} strokeWidth="1.5" />
      <line x1="70" y1="60" x2="150" y2="60" stroke={T} strokeOpacity=".5" /><line x1="70" y1="120" x2="150" y2="120" stroke={T} strokeOpacity=".5" />
      <rect x="96" y="18" width="28" height="12" rx="3" fill="none" stroke={L} strokeWidth="1.3" />
      {/* inlet */}
      <path d="M20 84h50" stroke={L} strokeWidth="1.6" /><rect x="14" y="76" width="10" height="16" rx="2" fill="none" stroke={L} />
      {/* outlet */}
      <path d="M150 84h40v-26" stroke={on("outlet")} strokeWidth={hot === "outlet" ? 2.6 : 1.6} fill="none" />
      <circle cx="190" cy="52" r="7" fill="none" stroke={on("outlet")} strokeWidth={hot === "outlet" ? 2.2 : 1.3} />
      {hot === "outlet" && <circle cx="190" cy="52" r="13" fill="none" stroke={T} strokeOpacity=".5" />}
      {/* sump valve */}
      <path d="M104 150v18h12v-18" fill="none" stroke={on("sump")} strokeWidth={hot === "sump" ? 2.6 : 1.5} />
      <rect x="98" y="168" width="24" height="9" rx="2" fill={on("sump")} opacity=".8" />
      {hot === "sump" && <circle cx="110" cy="172" r="16" fill="none" stroke={T} strokeOpacity=".5" />}
      {/* DP gauge */}
      <circle cx="110" cy="96" r="14" fill="#120c20" stroke={L} strokeWidth="1.3" /><path d="M110 96l8-7" stroke={A} strokeWidth="1.8" strokeLinecap="round" />
      <text x="110" y="196" textAnchor="middle" fontSize="9" fill={F}>FILTER VESSEL</text>
    </svg>
  );
}

/** Tank sump / drain valve close-up. */
export function TankValveSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 200" className={className} role="img" aria-label="Tank sump valve and drain">
      <path d="M20 60q90-28 180 0v34q-90 24-180 0Z" fill="#cdbfe6" fillOpacity=".12" stroke={L} strokeWidth="1.4" />
      <path d="M96 90v34h28V90" fill="none" stroke={T} strokeWidth="2.4" />
      <rect x="88" y="124" width="44" height="12" rx="3" fill={T} opacity=".85" />
      <rect x="101" y="136" width="18" height="16" rx="2" fill="none" stroke={L} strokeWidth="1.4" />
      <path d="M110 152v16" stroke={L} strokeWidth="1.4" strokeDasharray="3 3" />
      <path d="M100 168q10 12 20 0" fill="none" stroke={T} strokeWidth="1.6" />
      <circle cx="110" cy="109" r="5" fill="#120c20" stroke={A} strokeWidth="1.5" />
      <text x="110" y="194" textAnchor="middle" fontSize="9" fill={F}>TANK SUMP / DRAIN VALVE</text>
    </svg>
  );
}

/** Sample jar with the label and tag the operator reads. */
export function SampleJarSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 200" className={className} role="img" aria-label="Sample jar and identification tag">
      <rect x="70" y="52" width="80" height="116" rx="14" fill="#efe6ff" fillOpacity=".08" stroke={L} strokeWidth="1.5" />
      <rect x="80" y="36" width="60" height="16" rx="4" fill="none" stroke={L} strokeWidth="1.4" />
      <path d="M72 108h76v46a14 14 0 0 1-14 14H86a14 14 0 0 1-14-14Z" fill={T} fillOpacity=".16" />
      <line x1="72" y1="108" x2="148" y2="108" stroke={T} strokeOpacity=".7" />
      <rect x="160" y="64" width="42" height="56" rx="6" fill="none" stroke={L} strokeWidth="1.3" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={166 + i * 5} y="72" width={i % 2 ? 2 : 3} height="26" fill={L} />)}
      <circle cx="181" cy="108" r="6" fill="none" stroke={T} strokeWidth="1.4" /><path d="M177 108a4 4 0 0 1 8 0" stroke={T} strokeWidth="1.2" fill="none" />
      <text x="110" y="194" textAnchor="middle" fontSize="9" fill={F}>SAMPLE JAR + TAG</text>
    </svg>
  );
}

export function PointCloseup({ point, className = "" }: { point: PointId; className?: string }) {
  if (point === "filter_sump") return <FilterVesselSvg hot="sump" className={className} />;
  if (point === "filter_outlet") return <FilterVesselSvg hot="outlet" className={className} />;
  return <TankValveSvg className={className} />;
}
