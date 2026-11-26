"use client";
import { useStore } from "@/lib/store";
import { POINTS } from "@/lib/domain";
import { useExpandNav } from "@/components/ui/Expand";
import { HoldBanner } from "./Details";
import { HoldChain } from "./HoldChain";
import { RecordView } from "./Record";
import type { Check } from "@/lib/types";
import { T } from "@/components/ui/T";
import { VehicleArt } from "@/components/illustrations/VehicleArt";
import { ResultBadge } from "./Details";
import { fmtTime } from "@/lib/utils";

/** Full-screen detail for a sampling record. Failed records get the investigation timeline first. */
export function ReviewDetail({ check }: { check: Check }) {
  const { close } = useExpandNav();
  const holds = useStore((s) => s.holds);
  const live = useStore((s) => s.checks.find((c) => c.id === check.id)) ?? check;
  const h = holds.find((x) => x.events.some((e) => e.checkId === live.id)) ?? holds.find((x) => x.vehicleId === live.vehicleId && x.point === live.point && x.state !== "released");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-hair">
        <VehicleArt type={live.vehicleId.startsWith("DSP") ? "dispenser" : "refueller"} className="h-40 w-full !justify-end pe-5" art="h-full w-[48%] opacity-60" />
        <div className="absolute inset-0 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-[#0d0818]/90 to-transparent p-5">
          <div>
            <p className="font-mono text-xs text-[#d9cdee]">{live.sampleId}</p>
            <h2 className="font-display text-2xl font-semibold text-[#faf7ff]">{live.vehicleId} · {POINTS[live.point].label}</h2>
            <p className="text-sm text-[#d9cdee]">{fmtTime(live.ts)} · {live.employeeId}</p>
          </div>
          <ResultBadge c={live} />
        </div>
      </div>
      {live.result === "fail" && h && (
        <>
          {h.state !== "released" && <HoldBanner vehicleId={`${h.vehicleId} · ${POINTS[h.point].label}`} />}
          <div className="glass p-4" style={{ borderRadius: 20 }}><p className="mb-3 text-sm font-semibold"><T>{"Failure investigation"}</T></p><HoldChain hold={h} /></div>
        </>
      )}
      <RecordView check={live} onChange={close} />
    </div>
  );
}
