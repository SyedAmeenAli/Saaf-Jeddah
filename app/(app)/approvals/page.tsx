"use client";
import { Lock } from "lucide-react";
import { useScoped } from "@/lib/selectors";
import { useCan, useT } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { fmtTime, ago, cn } from "@/lib/utils";
import { Empty, PageHeader, Rise, Stagger, StatusBadge } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { ResultBadge, StateBadge } from "@/components/features/Details";
import { ReviewDetail } from "@/components/features/ReviewDetail";
import type { Check as C } from "@/lib/types";

function Row({ c }: { c: C }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5">
      <span className={cn("size-2.5 rounded-full", c.result === "fail" ? "bg-fail" : "bg-pending")} />
      <span className="min-w-24 font-mono text-sm font-semibold">{c.vehicleId}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted">{POINTS[c.point].label} · {fmtTime(c.ts)} · {c.employeeId}</span>
      {c.kind === "resample" && <StatusBadge kind="info">Re-sample</StatusBadge>}
      <ResultBadge c={c} />
      <span className="text-xs text-faint">{ago(c.ts)}</span>
    </div>
  );
}

export default function ApprovalsPage() {
  const t = useT();
  const can = useCan();
  const { checks } = useScoped();
  const awaiting = checks.filter((c) => c.status === "awaiting").sort((a, b) => Number(b.result === "fail") - Number(a.result === "fail") || b.ts - a.ts);
  const locked = checks.filter((c) => c.status === "approved").slice(0, 10);

  return (
    <ExpandGroup>
      <PageHeader title={t("Review Queue")} sub={`${awaiting.length} ${t("Awaiting supervisor")}. Open a sample to approve, return for correction, countersign or investigate a failure.`} actions={!can("verify") ? <StatusBadge kind="info">{t("Read-only for this role")}</StatusBadge> : undefined} />
      {awaiting.length === 0 ? (
        <div className="glass flex flex-col items-center p-10" style={{ borderRadius: 20 }}><Empty title="Queue clear" sub="Every submitted check has been verified." /></div>
      ) : (
        <Stagger className="space-y-2.5">{awaiting.map((c) => <Rise key={c.id}><ExpandCard id={c.id} title={`${c.vehicleId} · ${POINTS[c.point].label}`} card={<Row c={c} />} detail={() => <ReviewDetail check={c} />} /></Rise>)}</Stagger>
      )}

      <h2 className="mb-3 mt-10 flex items-center gap-2 font-display text-xl font-semibold"><Lock size={18} /> {t("Approved")} · {t("Locked")}</h2>
      <div className="space-y-2">
        {locked.map((c) => (
          <ExpandCard key={c.id} id={c.id} title={`${c.vehicleId} · ${POINTS[c.point].label}`}
            card={<div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"><Lock size={14} className="text-muted" /><span className="min-w-24 font-mono text-sm font-semibold">{c.vehicleId}</span><span className="min-w-0 flex-1 truncate text-sm text-muted">{POINTS[c.point].label} · {c.sampleId}</span><ResultBadge c={c} /><StateBadge status={c.status} /></div>}
            detail={() => <ReviewDetail check={c} />} />
        ))}
      </div>
    </ExpandGroup>
  );
}
