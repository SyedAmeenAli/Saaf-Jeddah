import { cn } from "@/lib/utils";
import { DispenserSvg, TruckSvg } from "./Vehicles";
import type { VehicleType } from "@/lib/types";

/** Bold filled glyphs that stay recognisable at 40-72px. Refueller = side-on tanker truck, dispenser = upright cart with hose. */
function Glyph({ type }: { type: VehicleType }) {
  return type === "refueller" ? (
    <svg viewBox="0 0 64 64" className="h-[78%] w-[78%]" aria-hidden="true">
      <rect x="3" y="43" width="58" height="4" rx="2" fill="#6738ae" />
      <rect x="6" y="19" width="36" height="22" rx="11" fill="#c9a8ff" />
      <rect x="20" y="14" width="8" height="6" rx="2" fill="#e7d8ff" />
      <path d="M44 25h9l7 9v9H44z" fill="#ff405c" />
      <path d="M48 28h5l4 5h-9z" fill="#0d0818" opacity=".55" />
      {[[15, 47], [29, 47], [52, 47]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5.5" fill="#0d0818" stroke="#faf7ff" strokeWidth="2.2" />)}
    </svg>
  ) : (
    <svg viewBox="0 0 64 64" className="h-[78%] w-[78%]" aria-hidden="true">
      <rect x="8" y="46" width="48" height="6" rx="3" fill="#6738ae" />
      <rect x="20" y="10" width="22" height="36" rx="5" fill="#c9a8ff" />
      <rect x="24" y="15" width="14" height="9" rx="2" fill="#0d0818" opacity=".6" />
      <circle cx="31" cy="34" r="5" fill="#0d0818" opacity=".6" />
      <path d="M42 22h6c5 0 8 3 8 8v14" fill="none" stroke="#ff405c" strokeWidth="4" strokeLinecap="round" />
      <circle cx="56" cy="46" r="3.5" fill="#ff405c" />
      {[[16, 54], [48, 54]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" fill="#0d0818" stroke="#faf7ff" strokeWidth="2" />)}
    </svg>
  );
}

/** Original APSCO-neutral vehicle illustration on a plum tile. `compact` swaps in the bold glyph for small sizes. */
export function VehicleArt({ type, className, art = "h-full w-[78%]", compact = false }: { type: VehicleType; className?: string; art?: string; compact?: boolean }) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a1747] via-[#1a1030] to-[#0d0818]", !compact && "[&_svg]:brightness-[1.5]", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_70%_0%,rgba(181,138,255,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#b58aff]/50 to-transparent" />
      {compact ? <Glyph type={type} /> : type === "refueller" ? <TruckSvg className={cn("relative", art)} /> : <DispenserSvg className={cn("relative", art)} />}
    </div>
  );
}
