"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, Clock, Lock, OctagonAlert, Timer, Wrench } from "lucide-react";
import { VehicleArt } from "@/components/illustrations/VehicleArt";
import { useScoped } from "@/lib/selectors";
import { useStore, empName } from "@/lib/store";
import { useCan, useNow, useT } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { fmtDT, ago, cn } from "@/lib/utils";
import { Chip, Empty, GlassDropdown, PageHeader, SearchField, StatusBadge } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { ResultBadge, StateBadge } from "@/components/features/Details";
import { ReviewDetail } from "@/components/features/ReviewDetail";
import type { Check as C } from "@/lib/types";
import { T } from "@/components/ui/T";

type Filter = "all" | "pending" | "failed" | "returned" | "reviewed";
type Sort = "oldest" | "newest" | "failed" | "location";
const COLS = "lg:grid lg:grid-cols-[.9fr_.9fr_.9fr_1.1fr_.8fr_.8fr_1.1fr_1fr_1fr_.5fr] lg:items-center lg:gap-3";

function useRowData() {
  const vehicles = useStore((s) => s.vehicles);
  const employees = useStore((s) => s.employees);
  const lang = useStore((s) => s.lang);
  return (c: C) => {
    const v = vehicles.find((x) => x.id === c.vehicleId);
    return { loc: v?.locationId ?? "–", type: v?.type === "dispenser" ? "Hydrant dispenser" : "Refueller", op: empName(employees, c.employeeId, lang) };
  };
}

function QueueRow({ c }: { c: C }) {
  const t = useT();
  const d = useRowData()(c);
  const failed = c.result === "fail";
  return (
    <>
      {/* desktop: table row */}
      <div className={cn("hidden px-4 py-3 text-sm", COLS)}>
        <span className="flex items-center gap-2 font-mono font-semibold"><span className={cn("size-2 rounded-full", failed ? "bg-fail" : "bg-pending")} />{c.vehicleId}</span>
        <span className="truncate text-muted">{t(d.type)}</span>
        <span className="text-muted">{d.loc}</span>
        <span className="truncate">{POINTS[c.point].label}</span>
        <span className="text-muted">VAC · CWD</span>
        <span><ResultBadge c={{ result: c.result, status: c.status }} /></span>
        <span className="truncate text-muted">{d.op}</span>
        <span className="text-xs text-muted">{fmtDT(c.ts)}<br />{ago(c.ts)}</span>
        <span><StateBadge status={c.status} /></span>
        <span className="flex justify-end text-teal"><ChevronRight size={18} className="rtl:rotate-180" /></span>
      </div>
      {/* mobile / tablet: compact review card */}
      <div className="flex items-start gap-3 p-3.5 lg:hidden">
        <VehicleArt type={c.vehicleId.startsWith("DSP") ? "dispenser" : "refueller"} compact className={cn("size-12 shrink-0 rounded-xl border border-hair", failed && "!border-fail")} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-sm font-semibold">{c.vehicleId}</span>
            <span className="text-xs text-muted">{d.loc}</span>
            <span className="ms-auto"><ResultBadge c={{ result: c.result, status: c.status }} /></span>
          </div>
          <p className="truncate text-sm">{POINTS[c.point].label} <span className="text-muted">· VAC · CWD</span></p>
          <p className="truncate text-xs text-muted">{d.op} · {ago(c.ts)}</p>
          <div className="pt-0.5"><StateBadge status={c.status} /></div>
        </div>
      </div>
    </>
  );
}

export default function ApprovalsPage() {
  const t = useT();
  const can = useCan();
  const now = useNow(60000);
  const { checks, holds } = useScoped();
  const rowData = useRowData();
  const [f, setF] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("failed");
  const [q, setQ] = useState("");

  const pending = checks.filter((c) => c.status === "awaiting");
  const failed = checks.filter((c) => c.result === "fail");
  const active = holds.filter((h) => h.state !== "released");
  const overdueInv = active.filter((h) => h.state === "hold" && now - h.openedTs > 4 * 3600_000);
  const lookupEmp = useStore((s) => s.employees);
  const lang = useStore((s) => s.lang);
  const holdCheck = (h: (typeof holds)[number]) => checks.find((c) => h.events.some((e) => e.checkId === c.id) && c.result === "fail") ?? checks.find((c) => c.vehicleId === h.vehicleId && c.point === h.point && c.result === "fail");

  const rows = useMemo(() => {
    const m: Record<Filter, (c: C) => boolean> = { all: () => true, pending: (c) => c.status === "awaiting", failed: (c) => c.result === "fail", returned: (c) => c.status === "returned", reviewed: (c) => c.status === "approved" };
    const needle = q.trim().toLowerCase();
    const list = checks.filter(m[f]).filter((c) => !needle || `${c.vehicleId} ${c.employeeId} ${empName(lookupEmp, c.employeeId, "en")} ${c.sampleId} ${POINTS[c.point].label}`.toLowerCase().includes(needle));
    const loc = (c: C) => rowData(c).loc;
    return list.sort((a, b) => sort === "oldest" ? a.ts - b.ts : sort === "newest" ? b.ts - a.ts : sort === "location" ? loc(a).localeCompare(loc(b)) || b.ts - a.ts : Number(b.result === "fail") - Number(a.result === "fail") || Number(b.status === "awaiting") - Number(a.status === "awaiting") || b.ts - a.ts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checks, f, sort, q, lookupEmp]);

  const metrics = [
    { l: "Pending approvals", n: pending.length, I: Clock, c: "text-pending-fg bg-[var(--warning-soft)]" },
    { l: "Failed samples", n: failed.filter((c) => c.ts >= new Date(now).setHours(0, 0, 0, 0)).length, I: AlertTriangle, c: "text-fail-fg bg-[var(--danger-soft)]" },
    { l: "Equipment on hold", n: active.length, I: Wrench, c: "text-fail-fg bg-[var(--danger-soft)]" },
    { l: "Overdue investigations", n: overdueInv.length, I: Timer, c: "text-teal bg-[var(--brand-purple-light)]" },
  ] as const;
  const counts: Record<Filter, number> = { all: checks.length, pending: pending.length, failed: failed.length, returned: checks.filter((c) => c.status === "returned").length, reviewed: checks.filter((c) => c.status === "approved").length };
  const shown = rows.slice(0, 60);

  return (
    <ExpandGroup>
      <PageHeader visible eyebrow={t("QUALITY CONTROL")} title={t("Review Queue")} sub="Samples requiring verification and operational attention."
        actions={!can("verify") ? <StatusBadge kind="info">{t("Read-only for this role")}</StatusBadge> : undefined} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.l} className="glass flex items-center gap-3 px-4 py-3">
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", m.c)}><m.I size={17} strokeWidth={1.7} /></span>
            <div className="min-w-0"><p className="font-display text-xl font-semibold leading-6">{m.n}</p><p className="text-xs leading-4 text-muted">{t(m.l)}</p></div>
          </div>
        ))}
      </div>

      {active.length > 0 && (
        <section aria-label="Equipment holds" className="mb-4 overflow-hidden rounded-2xl border border-[#f1c3c9] bg-[var(--danger-soft)]">
          <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-fail-fg"><OctagonAlert size={16} /> {active.length} {t("Equipment on hold")} · <span className="font-normal">{t("Do not fuel")}</span></div>
          <ul className="divide-y divide-[#f1c3c9] border-t border-[#f1c3c9] bg-white/60">
            {active.map((h) => {
              const fc = holdCheck(h);
              return (
                <li key={h.id} className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 py-2.5 text-sm md:grid-cols-[auto_1fr_1fr_1fr_1fr] md:items-center">
                  <span className="font-mono font-semibold">{h.vehicleId}</span>
                  <span>{POINTS[h.point].label}</span>
                  <span className="text-muted">{fc ? `${t("Failed")} · ${fc.sampleId.slice(-14)}` : h.reason}</span>
                  <span className="text-muted">{fmtDT(h.openedTs)}{fc ? ` · ${empName(lookupEmp, fc.employeeId, lang)}` : ""}</span>
                  <span><StatusBadge kind={h.state === "hold" ? "fail" : "pending"}>{h.state === "hold" ? t("On hold") : t("Release pending")}</StatusBadge></span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["all", "pending", "failed", "returned", "reviewed"] as Filter[]).map((k) => (
          <Chip key={k} active={f === k} onClick={() => setF(k)}>{t(k === "all" ? "All" : k === "pending" ? "Pending" : k === "failed" ? "Failed" : k === "returned" ? "Returned" : "Reviewed")} ({counts[k]})</Chip>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_14rem]">
        <SearchField value={q} onChange={setQ} placeholder="Vehicle, employee, sample ID or point…" />
        <GlassDropdown label={t("Sort")} value={sort} onChange={(v) => setSort(v as Sort)} options={[["failed", "Failed first"], ["oldest", "Oldest first"], ["newest", "Newest first"], ["location", "Location"]]} />
      </div>

      {shown.length === 0 ? (
        <div className="glass flex flex-col items-center p-10"><Empty title="No matching records" sub="Adjust the filter or search." /></div>
      ) : (
        <div>
          <div className={cn("hidden px-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-muted", COLS)}>
            {["Asset ID", "Asset type", "Location", "Sampling point", "Test type", "Test result", "Operator", "Submitted", "Review status", ""].map((h, i) => <span key={i}>{h ? t(h) : ""}</span>)}
          </div>
          <div className="space-y-2">
            {shown.map((c) => (
              <ExpandCard key={c.id} id={c.id} title={`${c.vehicleId} · ${POINTS[c.point].label}`} card={<QueueRow c={c} />} detail={() => <ReviewDetail check={c} />} />
            ))}
          </div>
          {rows.length > shown.length && <p className="mt-3 text-center text-xs text-muted">{t("Showing")} {shown.length} / {rows.length}. {t("Search to narrow.")}</p>}
        </div>
      )}
      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted"><Lock size={12} /> {t("A failed result is never overwritten. It is superseded by a new linked sample.")}</p>
    </ExpandGroup>
  );
}

