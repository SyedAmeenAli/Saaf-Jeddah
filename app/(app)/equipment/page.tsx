"use client";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useScoped } from "@/lib/selectors";
import { useT } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { fmtDT } from "@/lib/utils";
import { Empty, PageHeader, Rise, Stagger, StatusBadge } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { HoldBanner, VehicleDetail } from "@/components/features/Details";
import { HoldChain } from "@/components/features/HoldChain";
import { useStore } from "@/lib/store";
import { T } from "@/components/ui/T";

export default function EquipmentHolds() {
  const t = useT();
  const { holds } = useScoped();
  const vehicles = useStore((s) => s.vehicles);
  const active = holds.filter((h) => h.state !== "released");
  return (
    <ExpandGroup>
      <PageHeader title={t("Equipment Holds")} sub="Vehicles that must not fuel until a failed sample is re-sampled and a supervisor authorises release." />
      {active.length === 0 ? (
        <div className="glass flex flex-col items-center p-10" style={{ borderRadius: 20 }}><ShieldCheck size={36} strokeWidth={1.5} className="text-pass-fg" /><Empty title={t("All clear")} sub="No equipment is on hold." /></div>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {active.map((h) => {
            const v = vehicles.find((x) => x.id === h.vehicleId);
            return (
              <Rise key={h.id}>
                <ExpandCard id={`eq-${h.id}`} title={`${h.vehicleId} · on hold`}
                  card={
                    <div className="space-y-3 p-5">
                      <div className="flex items-center justify-between"><span className="font-mono text-lg font-semibold">{h.vehicleId}</span><StatusBadge kind={h.state === "hold" ? "fail" : "pending"}>{h.state === "hold" ? "Awaiting re-sample" : "Awaiting release"}</StatusBadge></div>
                      <HoldBanner vehicleId={POINTS[h.point].label} compact />
                      <p className="text-sm text-muted">{h.reason}</p>
                      <p className="text-xs text-faint">{h.locationId} · opened {fmtDT(h.openedTs)}</p>
                    </div>
                  }
                  detail={() => <div className="mx-auto max-w-4xl space-y-5"><HoldChain hold={h} />{v && <VehicleDetail vehicle={v} />}</div>} />
              </Rise>
            );
          })}
        </Stagger>
      )}
      <p className="mt-6 text-center text-xs text-faint"><T>{"Looking for the failed sample itself?"}</T> <Link href="/holds" className="text-teal hover:underline"><T>{"Open Failed Samples"}</T></Link></p>
    </ExpandGroup>
  );
}
