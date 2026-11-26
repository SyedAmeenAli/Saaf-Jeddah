import { cn } from "@/lib/utils";
import { DispenserSvg, TruckSvg } from "./Vehicles";
import type { VehicleType } from "@/lib/types";

/** Original APSCO-neutral vehicle illustration on a plum tile. Used for every refueller and hydrant dispenser. */
export function VehicleArt({ type, className, art = "h-full w-[78%]" }: { type: VehicleType; className?: string; art?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden [&_svg]:brightness-[1.5] bg-gradient-to-br from-[#2a1747] via-[#1a1030] to-[#0d0818]", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_70%_0%,rgba(181,138,255,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#b58aff]/50 to-transparent" />
      {type === "refueller" ? <TruckSvg className={cn("relative", art)} /> : <DispenserSvg className={cn("relative", art)} />}
    </div>
  );
}
