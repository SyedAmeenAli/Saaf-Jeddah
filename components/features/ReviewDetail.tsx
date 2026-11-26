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
      <div className="glass flex flex-wrap items-center gap-4 p-4">
        <VehicleArt type={live.vehicleId.startsWith("DSP") ? "dispenser" : "refueller"} compact className="size-16 shrink-0 rounded-xl border border-hair" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted">{live.sampleId}</p>
          <h2 className="font-display text-xl font-semibold">{live.vehicleId} · {POINTS[live.point].label}</h2>
          <p className="text-sm text-muted">{fmtTime(live.ts)} · {live.employeeId}</p>
        </div>
        <ResultBadge c={live} />
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
