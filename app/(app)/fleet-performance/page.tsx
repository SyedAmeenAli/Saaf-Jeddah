"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useScoped, vehicleStatus } from "@/lib/selectors";
import { useT } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Chip, PageHeader } from "@/components/ui/Glass";
import { StatusPill } from "@/components/features/Details";

export default function FleetPerformance() {
  const t = useT();
  const router = useRouter();
  const { vehicles, checks, holds, due } = useScoped();
  const [type, setType] = useState<"all" | "refueller" | "dispenser">("all");
  const rows = useMemo(() => vehicles.filter((v) => type === "all" || v.type === type).map((v) => {
    const cs = checks.filter((c) => c.vehicleId === v.id);
    const fail = cs.filter((c) => c.result === "fail").length;
    return { v, n: cs.length, fail, rate: cs.length ? (cs.length - fail) / cs.length : 1, status: vehicleStatus(v, holds, due, checks) };
  }).sort((a, b) => a.rate - b.rate || b.fail - a.fail), [vehicles, checks, holds, due, type]);
  return (
    <>
      <PageHeader title={t("Fleet Performance")} sub="Every vehicle ranked by pass rate over the last 7 days. Select a row for the vehicle record." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Chip active={type === "all"} onClick={() => setType("all")}>All ({vehicles.length})</Chip>
        <Chip active={type === "refueller"} onClick={() => setType("refueller")}>Refuellers</Chip>
        <Chip active={type === "dispenser"} onClick={() => setType("dispenser")}>Hydrant dispensers</Chip>
      </div>
      <div className="glass overflow-x-auto p-4" style={{ borderRadius: 20 }}>
        <table className="tbl min-w-[40rem]"><thead><tr><th>Vehicle</th><th>Type</th><th>Location</th><th className="text-end">Samples</th><th className="text-end">Failed</th><th className="w-48">Pass rate</th><th>Status</th></tr></thead>
          <tbody>{rows.map(({ v, n, fail, rate, status }) => (
            <tr key={v.id} className="row-link" onClick={() => router.push(`/fleet?open=${v.id}`)}>
              <td className="font-mono font-medium">{v.id}</td><td className="text-muted">{v.type === "refueller" ? "Refueller" : "Dispenser"}</td><td className="text-muted">{v.locationId}</td>
              <td className="text-end tnum">{n}</td><td className={cn("text-end tnum", fail > 0 && "text-fail-fg")}>{fail}</td>
              <td><div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${rate * 100}%`, background: rate < 0.95 ? "#e6a84a" : "linear-gradient(90deg,#59dfce,#43c9df)" }} /></div><span className="w-12 text-end text-xs tnum">{(rate * 100).toFixed(0)}%</span></div></td>
              <td><StatusPill s={status} /></td>
            </tr>
          ))}</tbody></table>
      </div>
    </>
  );
}
