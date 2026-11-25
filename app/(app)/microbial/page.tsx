"use client";
import { useMemo, useState } from "react";
import { Beaker, Check, FlaskConical, Lock, Send, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCan, useNow, useT } from "@/lib/hooks";
import { cn, fmtDT, fmtDate, ago } from "@/lib/utils";
import { Button, Chip, CountUp, PageHeader, Rise, Stagger, StatusBadge, inputCls } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import type { MicroTest } from "@/lib/types";
import { T } from "@/components/ui/T";

type F = "all" | "due" | "lab" | "done" | "fail";

function State({ m, now }: { m: MicroTest; now: number }) {
  if (m.status === "complete") return m.result === "fail" ? <StatusBadge kind="fail"><T>{"Failed"}</T></StatusBadge> : <StatusBadge kind="pass"><T>{"Clear"}</T></StatusBadge>;
  if (m.status === "collected") return <StatusBadge kind="info"><T>{"In laboratory"}</T></StatusBadge>;
  return m.dueTs < now ? <StatusBadge kind="pending"><T>{"Overdue"}</T></StatusBadge> : <StatusBadge kind="info"><T>{"Scheduled"}</T></StatusBadge>;
}

function Detail({ m }: { m: MicroTest }) {
  const can = useCan();
  const collect = useStore((s) => s.collectMicro);
  const record = useStore((s) => s.recordMicro);
  const live = useStore((s) => s.micro.find((x) => x.id === m.id)) ?? m;
  const [note, setNote] = useState("");
  const now = useNow(60000);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center gap-3"><span className="font-mono text-2xl font-semibold">{live.vehicleId}</span><State m={live} now={now} /><span className="font-mono text-xs text-muted">{live.id}</span></div>
      <ol className="glass-2 space-y-4 rounded-3xl border border-hair p-5">
        {[["Scheduled", `Due ${fmtDate(live.dueTs)}`, true], ["Collected", live.collectedTs ? `${fmtDT(live.collectedTs)} · ${live.collectedBy} · ${live.labRef}` : "Waiting for collection", !!live.collectedTs], ["Laboratory result", live.resultTs ? `${live.result === "pass" ? "No growth at limit" : "Growth above limit"} · ${fmtDT(live.resultTs)} · ${live.reviewedBy}` : "Awaiting result", !!live.resultTs]].map(([t, d, ok]) => (
          <li key={t as string} className="flex gap-3"><span className={cn("mt-0.5 flex size-6 items-center justify-center rounded-full border", ok ? "border-teal bg-teal/25 text-teal" : "border-hair-strong text-faint")}>{ok ? <Check size={13} strokeWidth={3} /> : null}</span><div><p className="text-sm font-semibold">{t as string}</p><p className="text-xs text-muted">{d as string}</p></div></li>
        ))}
      </ol>
      {live.note && <p className="rounded-2xl border border-hair bg-white/[0.04] p-3 text-sm text-muted">{live.note}</p>}
      <p className="text-xs text-faint">Method: {live.method}. Microbial monitoring is separate from the visual appearance check and is not proof of cleanliness for a single sample.</p>
      {live.status === "scheduled" && (can("sample") || can("verify") ? <Button variant="primary" size="lg" onClick={() => collect(live.id)}><Beaker size={18} /> <T>{"Mark sample collected"}</T></Button> : <p className="flex items-center gap-2 text-sm text-muted"><Lock size={14} /> <T>{"Read-only for this role"}</T></p>)}
      {live.status === "collected" && (can("verify") ? (
        <div className="space-y-3">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Laboratory remarks" className={cn(inputCls, "h-auto py-3")} aria-label="Laboratory remarks" />
          <div className="flex gap-2"><Button variant="primary" onClick={() => record(live.id, "pass", note)}><Check size={16} /> <T>{"Record clear"}</T></Button><Button variant="danger" onClick={() => record(live.id, "fail", note || "Growth above limit")}><X size={16} /> <T>{"Record failure"}</T></Button></div>
        </div>
      ) : <p className="flex items-center gap-2 text-sm text-muted"><Send size={14} /> <T>{"Sent to laboratory. A supervisor records the result."}</T></p>)}
    </div>
  );
}

export default function Microbial() {
  const t = useT();
  const micro = useStore((s) => s.micro);
  const active = useStore((s) => s.activeLocation);
  const now = useNow(60000);
  const [f, setF] = useState<F>("all");
  const list = useMemo(() => micro.filter((m) => active === "all" || m.locationId === active), [micro, active]);
  const c = { due: list.filter((m) => m.status === "scheduled").length, over: list.filter((m) => m.status === "scheduled" && m.dueTs < now).length, lab: list.filter((m) => m.status === "collected").length, done: list.filter((m) => m.status === "complete").length, fail: list.filter((m) => m.result === "fail").length };
  const rows = list.filter((m) => f === "all" || (f === "due" && m.status === "scheduled") || (f === "lab" && m.status === "collected") || (f === "done" && m.status === "complete") || (f === "fail" && m.result === "fail")).sort((a, b) => (a.status === "scheduled" && b.status !== "scheduled" ? -1 : a.dueTs - b.dueTs));
  return (
    <ExpandGroup>
      <PageHeader title={t("Microbial Monitoring")} sub="Scheduled microbial testing with its own sample records. Separate from the visual appearance check." />
      <Stagger className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {([["Scheduled", c.due, "text-info-fg bg-info/15"], ["Overdue", c.over, "text-pending-fg bg-pending/15"], ["In laboratory", c.lab, "text-info-fg bg-info/15"], ["Completed", c.done, "text-pass-fg bg-pass/15"], ["Failed", c.fail, "text-fail-fg bg-fail/15"]] as const).map(([l, v, tone]) => (
            <Rise key={l}><div className="glass p-4" style={{ borderRadius: 20 }}><span className={cn("flex size-9 items-center justify-center rounded-xl", tone)}><FlaskConical size={17} strokeWidth={1.6} /></span><p className="mt-3 text-[26px] font-semibold leading-8"><CountUp value={v} /></p><p className="text-sm text-muted">{l}</p></div></Rise>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {([["all", "All"], ["due", "Scheduled"], ["lab", "In laboratory"], ["done", "Completed"], ["fail", "Failed"]] as const).map(([k, l]) => <Chip key={k} active={f === k} onClick={() => setF(k)}>{l}</Chip>)}
        </div>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((m) => (
            <ExpandCard key={m.id} id={`mic-${m.id}`} title={`Microbial test · ${m.vehicleId}`}
              card={<div className="flex items-center gap-3 p-4"><span className="min-w-0 flex-1"><span className="block font-mono text-[15px] font-semibold">{m.vehicleId}</span><span className="block truncate text-xs text-muted">{m.locationId} · {m.status === "complete" && m.resultTs ? `result ${ago(m.resultTs)}` : `due ${fmtDate(m.dueTs)}`}</span></span><State m={m} now={now} /></div>}
              detail={() => <Detail m={m} />} />
          ))}
          {rows.length === 0 && <p className="glass p-8 text-center text-sm text-muted md:col-span-2 xl:col-span-3" style={{ borderRadius: 20 }}><T>{"Nothing in this view."}</T></p>}
        </div>
      </Stagger>
    </ExpandGroup>
  );
}
