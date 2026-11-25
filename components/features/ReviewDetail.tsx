"use client";
import { useStore } from "@/lib/store";
import { POINTS } from "@/lib/domain";
import { useExpandNav } from "@/components/ui/Expand";
import { HoldBanner } from "./Details";
import { HoldChain } from "./HoldChain";
import { RecordView } from "./Record";
import type { Check } from "@/lib/types";

/** Full-screen detail for a sampling record. Failed records get the investigation timeline first. */
export function ReviewDetail({ check }: { check: Check }) {
  const { close } = useExpandNav();
  const holds = useStore((s) => s.holds);
  const live = useStore((s) => s.checks.find((c) => c.id === check.id)) ?? check;
  const h = holds.find((x) => x.events.some((e) => e.checkId === live.id)) ?? holds.find((x) => x.vehicleId === live.vehicleId && x.point === live.point && x.state !== "released");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {live.result === "fail" && h && (
        <>
          {h.state !== "released" && <HoldBanner vehicleId={`${h.vehicleId} · ${POINTS[h.point].label}`} />}
          <div className="glass p-4" style={{ borderRadius: 20 }}><p className="mb-3 text-sm font-semibold">Failure investigation</p><HoldChain hold={h} /></div>
        </>
      )}
      <RecordView check={live} onChange={close} />
    </div>
  );
}
