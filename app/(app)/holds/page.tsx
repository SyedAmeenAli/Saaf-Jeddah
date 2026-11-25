"use client";
import { useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { useScoped } from "@/lib/selectors";
import { useT } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { cn, fmtDT } from "@/lib/utils";
import { Empty, PageHeader, Rise, Stagger, StatusBadge, Tabs } from "@/components/ui/Glass";
import { HoldBanner } from "@/components/features/Details";
import { HoldChain } from "@/components/features/HoldChain";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { ReviewDetail } from "@/components/features/ReviewDetail";
import { useStore } from "@/lib/store";
import type { Hold } from "@/lib/types";

const STEPS = ["Record", "Action", "Retest", "Close"];

function Stepper({ at }: { at: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs" aria-label="Failure management progress">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={cn("flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold", i < at ? "border-teal bg-teal text-[#04121a]" : i === at ? "border-teal text-teal" : "border-white/20 text-faint")}>{i < at ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
          <span className={i <= at ? "text-fg" : "text-faint"}>{s}</span>
          {i < STEPS.length - 1 && <span className="h-px w-3 bg-white/15 sm:w-5" />}
        </li>
      ))}
    </ol>
  );
}

function Item({ h }: { h: Hold }) {
  const t = useT();
  const checks = useStore((s) => s.checks);
  const at = h.state === "hold" ? 1 : h.state === "resampled" ? 2 : 3;
  const fail = h.state !== "released";
  const failed = checks.find((c) => c.id === h.events.find((e) => e.type === "fail")?.checkId);
  return (
    <ExpandCard id={`hold-${h.id}`} title={`${h.vehicleId} · ${POINTS[h.point].label}`}
      card={
        <div className={cn("space-y-4 p-5", fail && "rounded-[20px] bg-fail/[0.05]")}>
          <div className="flex items-start gap-3">
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", fail ? "bg-fail/20 text-fail-fg" : "bg-pass/20 text-pass-fg")}>{fail ? <X size={22} strokeWidth={2} /> : <Check size={22} strokeWidth={2} />}</span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">{fail ? "Test Failed" : t("Released")} · <span className="font-mono">{h.vehicleId}</span></p>
              <p className="text-sm text-muted">{POINTS[h.point].label} · {h.locationId} · {fmtDT(h.openedTs)}</p>
              <p className="mt-1 text-sm">Observation: {h.reason}</p>
            </div>
            <StatusBadge kind={h.state === "hold" ? "fail" : h.state === "resampled" ? "pending" : "pass"}>{h.state === "hold" ? "Awaiting re-sample" : h.state === "resampled" ? "Awaiting release" : "Closed"}</StatusBadge>
          </div>
          <Stepper at={at} />
        </div>
      }
      detail={() => failed ? <ReviewDetail check={failed} /> : (
        <div className="mx-auto max-w-3xl space-y-5">{fail && <HoldBanner vehicleId={h.vehicleId} />}<Stepper at={at} /><HoldChain hold={h} /></div>
      )} />
  );
}

export default function HoldsPage() {
  const t = useT();
  const { holds } = useScoped();
  const open = holds.filter((h) => h.state === "hold");
  const inv = holds.filter((h) => h.state === "resampled");
  const closed = holds.filter((h) => h.state === "released");
  const tabs = [["open", "Open", open], ["inv", "Under investigation", inv], ["closed", "Closed", closed]] as const;
  const [tab, setTab] = useState<"open" | "inv" | "closed">("open");
  const list = tabs.find((x) => x[0] === tab)![2];
  return (
    <ExpandGroup>
      <PageHeader title={t("Holds & failures")} sub="A failed result is never overwritten. It is superseded by a new linked sample, then released by a supervisor." />
      <Tabs tabs={tabs.map(([k, l, a]) => [k, l, a.length] as const)} value={tab} onChange={setTab} />
      {list.length === 0 ? (
        <div className="glass flex flex-col items-center p-8" style={{ borderRadius: 16 }}><ShieldCheck size={36} strokeWidth={1.5} className="text-pass-fg" /><Empty title={t("All clear")} sub="Nothing in this list." /></div>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 xl:grid-cols-2">{list.map((h) => <Rise key={h.id}><Item h={h} /></Rise>)}</Stagger>
      )}
    </ExpandGroup>
  );
}
