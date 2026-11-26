"use client";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Lock, RotateCcw } from "lucide-react";
import { VehicleArt } from "@/components/illustrations/VehicleArt";
import { useScoped } from "@/lib/selectors";
import { useCan, useT } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { fmtTime, ago, cn } from "@/lib/utils";
import { Chip, Empty, PageHeader, Rise, Stagger, StatusBadge } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { EquipmentBadge, ResultBadge, StateBadge } from "@/components/features/Details";
import { ReviewDetail } from "@/components/features/ReviewDetail";
import type { Check as C } from "@/lib/types";
import { T } from "@/components/ui/T";

function Row({ c }: { c: C }) {
  const failed = c.result === "fail";
  return (
    <div className="flex items-stretch gap-4 p-3">
      <VehicleArt type={c.vehicleId.startsWith("DSP") ? "dispenser" : "refueller"} className={cn("size-16 shrink-0 self-center rounded-xl", failed && "ring-1 ring-fail/60")} art="h-full w-[92%]" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={cn("size-2.5 rounded-full", failed ? "bg-fail" : "bg-pending")} />
          <span className="font-mono text-sm font-semibold">{c.vehicleId}</span>
          {c.kind === "resample" && <StatusBadge kind="info"><T>{"Re-sample"}</T></StatusBadge>}
          <ResultBadge c={c} />
        </div>
        <p className="truncate text-sm text-muted">{POINTS[c.point].label} · {c.sampleId}</p>
        <p className="text-xs text-faint">{fmtTime(c.ts)} · {c.employeeId} · {ago(c.ts)}</p>
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const t = useT();
  const can = useCan();
  const { checks } = useScoped();
  const [f, setF] = useState<"all" | "fail" | "pass">("all");
  const all = checks.filter((c) => c.status === "awaiting");
  const nFail = all.filter((c) => c.result === "fail").length;
  const nRe = all.filter((c) => c.kind === "resample").length;
  const returned = checks.filter((c) => c.status === "returned").length;
  const awaiting = all.filter((c) => f === "all" || c.result === f).sort((a, b) => Number(b.result === "fail") - Number(a.result === "fail") || b.ts - a.ts);
  const locked = checks.filter((c) => c.status === "approved").slice(0, 10);

  return (
    <ExpandGroup>
      <PageHeader title={t("Review Queue")} sub={`${awaiting.length} ${t("Awaiting supervisor")}. Open a sample to approve, return for correction, countersign or investigate a failure.`} actions={!can("verify") ? <StatusBadge kind="info">{t("Read-only for this role")}</StatusBadge> : undefined} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {([[t("Awaiting"), all.length, Clock, "text-pending-fg"], [t("Failed"), nFail, AlertTriangle, "text-fail-fg"], ["Re-sample", nRe, RotateCcw, "text-info-fg"], [t("Returned"), returned, CheckCircle2, "text-teal"]] as const).map(([l, n, I, col]) => (
          <div key={l} className="glass flex items-center gap-3 p-4" style={{ borderRadius: 16 }}>
            <span className={cn("flex size-10 items-center justify-center rounded-xl bg-white/5", col)}><I size={18} strokeWidth={1.6} /></span>
            <div><p className="font-display text-2xl font-semibold leading-none">{n}</p><p className="mt-1 text-xs text-muted">{l}</p></div>
          </div>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        {([["all", t("All")], ["fail", t("Failed")], ["pass", t("Pass")]] as const).map(([k, l]) => <Chip key={k} active={f === k} onClick={() => setF(k)}>{l}</Chip>)}
      </div>
      {awaiting.length === 0 ? (
        <div className="glass flex flex-col items-center p-10" style={{ borderRadius: 20 }}><Empty title="Queue clear" sub="Every submitted check has been verified." /></div>
      ) : (
        <Stagger className="space-y-2.5">{awaiting.map((c) => <Rise key={c.id}><ExpandCard id={c.id} title={`${c.vehicleId} · ${POINTS[c.point].label}`} card={<Row c={c} />} detail={() => <ReviewDetail check={c} />} /></Rise>)}</Stagger>
      )}

      <h2 className="mb-3 mt-10 flex items-center gap-2 font-display text-xl font-semibold"><Lock size={18} /> {t("Approved")} · {t("Locked")}</h2>
      <div className="space-y-2">
        {locked.map((c) => (
          <ExpandCard key={c.id} id={c.id} title={`${c.vehicleId} · ${POINTS[c.point].label}`}
            card={<div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"><Lock size={14} className="text-muted" /><span className="min-w-24 font-mono text-sm font-semibold">{c.vehicleId}</span><span className="min-w-0 flex-1 truncate text-sm text-muted">{POINTS[c.point].label} · {c.sampleId}</span><ResultBadge c={c} /><StateBadge status={c.status} /><EquipmentBadge c={c} /></div>}
            detail={() => <ReviewDetail check={c} />} />
        ))}
      </div>
    </ExpandGroup>
  );
}
