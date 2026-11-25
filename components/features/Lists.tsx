"use client";
import Link from "next/link";
import { Check as CheckI, FileText, Lock, OctagonAlert, PenLine, RotateCcw, Settings2, Undo2, FlaskConical, ShieldCheck } from "lucide-react";
import type { AuditEntry, Check, DueItem } from "@/lib/types";
import { POINTS } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { cn, fmtDT, fmtTime, ago } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Glass";
import { ResultBadge, StateBadge } from "./Details";
import { targetHref } from "@/lib/links";
import { T } from "@/components/ui/T";

export function CheckList({ checks, limit = 30 }: { checks: Check[]; limit?: number }) {
  const t = useT();
  if (!checks.length) return <p className="py-10 text-center text-sm text-muted">{t("No records")}</p>;
  return (
    <ul className="space-y-2">
      {checks.slice(0, limit).map((c) => (
        <li key={c.id}>
          <Link href={`/fleet?open=${c.vehicleId}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-hi px-4 py-3 hover:bg-teal/10">
            <span className="min-w-28 font-mono text-sm font-semibold">{c.vehicleId}</span>
            <span className="flex-1 text-sm text-muted">{POINTS[c.point].label} · {fmtTime(c.ts)} · {c.employeeId}</span>
            {c.kind === "resample" && <StatusBadge kind="info"><T>{"Re-sample"}</T></StatusBadge>}
            <ResultBadge c={c} />
            <span className="hidden sm:block"><StateBadge status={c.status} /></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function DueListView({ due }: { due: DueItem[] }) {
  const t = useT();
  if (!due.length) return <p className="py-10 text-center text-sm text-muted">{t("No records")}</p>;
  return (
    <ul className="space-y-2">
      {due.map((d) => (
        <li key={d.id}>
          <Link href={`/scan?v=${d.vehicleId}&p=${d.point}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-hi px-4 py-3 hover:bg-teal/10">
            <span className="min-w-28 font-mono text-sm font-semibold">{d.vehicleId}</span>
            <span className="flex-1 text-sm text-muted">{POINTS[d.point].label} · {fmtDT(d.dueTs)}</span>
            <StatusBadge kind={d.state === "overdue" ? "fail" : "pending"}>{d.state === "overdue" ? t("Overdue") : "Due"}</StatusBadge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const ICON: Record<AuditEntry["action"], typeof CheckI> = {
  submission: PenLine, approval: CheckI, return: Undo2, amendment: RotateCcw, config: Settings2, hold: OctagonAlert, release: ShieldCheck, resample: FlaskConical,
};
const TONE: Record<AuditEntry["action"], string> = {
  submission: "bg-info/20 text-info-fg", approval: "bg-pass/20 text-pass-fg", return: "bg-pending/20 text-pending-fg", amendment: "bg-pending/20 text-pending-fg",
  config: "bg-hi text-muted", hold: "bg-fail/20 text-fail-fg", release: "bg-pass/20 text-pass-fg", resample: "bg-info/20 text-info-fg",
};

export function ActivityList({ entries, full = false }: { entries: AuditEntry[]; full?: boolean }) {
  const employees = useStore((s) => s.employees);
  const lang = useStore((s) => s.lang);
  return (
    <ol className="space-y-1">
      {entries.map((a) => {
        const I = ICON[a.action] ?? FileText;
        const e = employees.find((x) => x.id === a.actor);
        return (
          <li key={a.id}><Link href={targetHref(a.target)} className="flex gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
            <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", TONE[a.action])}><I size={15} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm"><span className="font-semibold capitalize">{a.action}</span> <span className="text-muted">· {a.target}</span></p>
              <p className="truncate text-xs text-muted">{e ? (lang === "ar" ? e.nameAr : e.name) : a.actor} · {a.detail}</p>
            </div>
            <span className="shrink-0 text-xs text-faint">{full ? fmtDT(a.ts) : ago(a.ts)}</span>
          </Link></li>
        );
      })}
    </ol>
  );
}

export function LockedBadge() {
  const t = useT();
  return <StatusBadge kind="locked"><Lock size={0} className="hidden" />{t("Locked")}</StatusBadge>;
}
