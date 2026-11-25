"use client";
import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Check, ChevronsLeftRight, Lock, Undo2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useScoped } from "@/lib/selectors";
import { useCan, useT } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { fmtTime, ago } from "@/lib/utils";
import { Empty, Modal, PageHeader, StatusBadge } from "@/components/ui/Glass";
import { ResultBadge, StateBadge } from "@/components/features/Details";
import { RecordView } from "@/components/features/Record";
import type { Check as C } from "@/lib/types";
import { cn } from "@/lib/utils";

function Row({ c, onOpen, canSwipe }: { c: C; onOpen: () => void; canSwipe: boolean }) {
  const x = useMotionValue(0);
  const bgA = useTransform(x, [0, 90], [0, 1]);
  const bgR = useTransform(x, [0, -90], [0, 1]);
  const [quick, setQuick] = useState<null | "approve" | "return">(null);
  const t = useT();
  return (
    <li className="relative">
      <motion.div className="absolute inset-0 flex items-center justify-start rounded-3xl bg-pass/30 ps-6 text-pass-fg" style={{ opacity: bgA }} aria-hidden="true"><Check /> {t("Approve")}</motion.div>
      <motion.div className="absolute inset-0 flex items-center justify-end rounded-3xl bg-pending/30 pe-6 text-pending-fg" style={{ opacity: bgR }} aria-hidden="true">{t("Return")} <Undo2 className="ms-2" /></motion.div>
      <motion.button
        drag={canSwipe ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.5} style={{ x, borderRadius: 24 }}
        onDragEnd={(_, i) => { if (i.offset.x > 90) setQuick("approve"); else if (i.offset.x < -90) setQuick("return"); }}
        onClick={onOpen}
        className="glass relative flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 text-start"
      >
        <span className={cn("size-2.5 rounded-full", c.result === "fail" ? "bg-fail" : "bg-pending")} />
        <span className="min-w-24 font-mono text-sm font-semibold">{c.vehicleId}</span>
        <span className="flex-1 text-sm text-muted">{POINTS[c.point].label} · {fmtTime(c.ts)} · {c.employeeId}</span>
        {c.kind === "resample" && <StatusBadge kind="info">Re-sample</StatusBadge>}
        <ResultBadge c={c} />
        <span className="text-xs text-faint">{ago(c.ts)}</span>
        {canSwipe && <ChevronsLeftRight size={14} className="text-faint" aria-hidden="true" />}
      </motion.button>
      {quick && <QuickAction c={c} kind={quick} onClose={() => setQuick(null)} />}
    </li>
  );
}

function QuickAction({ c, kind, onClose }: { c: C; kind: "approve" | "return"; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`${kind === "approve" ? "Approve" : "Return"}: ${c.vehicleId}`} sheet wide>
      <RecordView check={c} onChange={onClose} />
    </Modal>
  );
}

export default function ApprovalsPage() {
  const t = useT();
  const can = useCan();
  const { checks } = useScoped();
  const [open, setOpen] = useState<string | null>(null);
  const awaiting = checks.filter((c) => c.status === "awaiting").sort((a, b) => Number(b.result === "fail") - Number(a.result === "fail") || b.ts - a.ts);
  const locked = checks.filter((c) => c.status === "approved").slice(0, 10);
  const sel = checks.find((c) => c.id === open);
  const allChecks = useStore((s) => s.checks);
  const cur = allChecks.find((c) => c.id === open) ?? sel;

  return (
    <>
      <PageHeader title={t("Approval inbox")} sub={`${awaiting.length} ${t("Awaiting supervisor")} · swipe right to approve, left to return, or tap to open`} actions={!can("verify") ? <StatusBadge kind="info">{t("Read-only for this role")}</StatusBadge> : undefined} />
      {awaiting.length === 0 ? (
        <div className="glass flex flex-col items-center p-10" style={{ borderRadius: 20 }}><Empty title="Inbox zero" sub="Every submitted check has been verified." /></div>
      ) : (
        <ul className="space-y-3">{awaiting.map((c) => <Row key={c.id} c={c} canSwipe={can("verify")} onOpen={() => setOpen(c.id)} />)}</ul>
      )}

      <h2 className="mb-3 mt-10 flex items-center gap-2 font-display text-xl font-semibold"><Lock size={18} /> {t("Approved")} · {t("Locked")}</h2>
      <ul className="space-y-2">
        {locked.map((c) => (
          <li key={c.id}>
            <button onClick={() => setOpen(c.id)} className="glass flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-start" style={{ borderRadius: 20 }}>
              <Lock size={14} className="text-muted" />
              <span className="min-w-24 font-mono text-sm font-semibold">{c.vehicleId}</span>
              <span className="flex-1 text-sm text-muted">{POINTS[c.point].label} · {c.sampleId}</span>
              <ResultBadge c={c} /><StateBadge status={c.status} />
            </button>
          </li>
        ))}
      </ul>

      <Modal open={!!cur} onClose={() => setOpen(null)} title={cur ? `${cur.vehicleId} · ${POINTS[cur.point].label}` : ""} wide>
        {cur && <RecordView check={cur} onChange={() => setOpen(null)} />}
      </Modal>
    </>
  );
}
