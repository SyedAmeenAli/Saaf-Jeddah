import { cn } from "@/lib/utils";
import { DispenserSvg } from "./Vehicles";
import type { VehicleType } from "@/lib/types";

/** Bold filled glyphs that stay recognisable at 40-72px. Refueller = side-on tanker truck, dispenser = upright cart with hose. */
function Glyph({ type }: { type: VehicleType }) {
  return type === "refueller" ? (
    <svg viewBox="0 0 64 64" className="h-[78%] w-[78%]" aria-hidden="true">
      <rect x="3" y="43" width="58" height="4" rx="2" fill="#6738ae" />
      <rect x="6" y="19" width="36" height="22" rx="11" fill="#c9a8ff" />
      <rect x="20" y="14" width="8" height="6" rx="2" fill="#e7d8ff" />
      <path d="M44 25h9l7 9v9H44z" fill="#ff405c" />
      <path d="M48 28h5l4 5h-9z" fill="#ffffff" opacity=".6" />
      {[[15, 47], [29, 47], [52, 47]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5.5" fill="#261638" stroke="#ffffff" strokeWidth="2.2" />)}
    </svg>
  ) : (
    <svg viewBox="0 0 64 64" className="h-[78%] w-[78%]" aria-hidden="true">
      <rect x="8" y="46" width="48" height="6" rx="3" fill="#6738ae" />
      <rect x="20" y="10" width="22" height="36" rx="5" fill="#c9a8ff" />
      <rect x="24" y="15" width="14" height="9" rx="2" fill="#0d0818" opacity=".6" />
      <circle cx="31" cy="34" r="5" fill="#0d0818" opacity=".6" />
      <path d="M42 22h6c5 0 8 3 8 8v14" fill="none" stroke="#ff405c" strokeWidth="4" strokeLinecap="round" />
      <circle cx="56" cy="46" r="3.5" fill="#ff405c" />
      {[[16, 54], [48, 54]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" fill="#261638" stroke="#ffffff" strokeWidth="2" />)}
    </svg>
  );
}

/** Original APSCO-neutral vehicle illustration on a plum tile. `compact` swaps in the bold glyph for small sizes. */
export function VehicleArt({ type, className, art = "h-full w-[78%]", compact = false }: { type: VehicleType; className?: string; art?: string; compact?: boolean }) {
  if (compact || type === "refueller") {
    return (
      <div className={cn("relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-[#f1ebf8]", className)}>
        {compact ? <Glyph type={type} /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src="/assets/apsco-refueller-cutaway.png" alt="" className="h-full w-full object-contain p-2" width={700} height={215} />}
      </div>
    );
  }
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a1747] via-[#1a1030] to-[#0d0818] [&_svg]:brightness-[1.5]", className)}>
      <DispenserSvg className={cn("relative", art)} />
    </div>
  );
}
