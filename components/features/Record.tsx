"use client";
import { useState } from "react";
import { Lock, PenLine, Trash2, Undo2 } from "lucide-react";
import type { Check } from "@/lib/types";
import { useStore, empName } from "@/lib/store";
import { useCan, useT } from "@/lib/hooks";
import { OCCASIONS, POINTS } from "@/lib/domain";
import { cn, fmtDT } from "@/lib/utils";
import { Button, Field, Modal, StatusBadge, inputCls } from "@/components/ui/Glass";
import { StatusTrio } from "./Details";
import { SignModal } from "./Sign";
import { T } from "@/components/ui/T";

const tick = (r: string) => (r === "pass" ? "✓" : r === "fail" ? "✕" : "n/d");

function Cell({ l, v, bad, ghost }: { l: string; v: React.ReactNode; bad?: boolean; ghost?: boolean }) {
  return (
    <div className={cn("rounded-xl bg-hi px-3 py-2", ghost && "ring-1 ring-pending/60")}>
      <p className="text-[11px] uppercase tracking-wider text-muted">{l}</p>
      <p className={cn("font-mono text-sm font-semibold", bad && "text-fail-fg")}>{v}</p>
    </div>
  );
}

function Grid({ c, over }: { c: Check; over?: Record<string, string> }) {
  const o = over ?? {};
  return (
    <div className="grid grid-cols-2 gap-2">
      <Cell l="Sample ID" v={c.sampleId} />
      <Cell l="Date / time" v={fmtDT(c.ts)} />
      <Cell l="Vehicle" v={c.vehicleId} />
      <Cell l="Point" v={POINTS[c.point].label} />
      <Cell l="Clarity" v={tick(c.clarity)} bad={c.clarity === "fail"} />
      <Cell l="Sediment" v={tick(c.sediment)} bad={c.sediment === "fail"} />
      <Cell l="Free water" v={tick(c.freeWater)} bad={c.freeWater === "fail"} />
      <Cell l="CWD" v={tick(c.cwd)} bad={c.cwd === "fail"} />
      <Cell l="DP (bar)" v={o.dp ?? c.dp.toFixed(2)} ghost={"dp" in o} />
      <Cell l="CWD batch" v={o.cwdBatch ?? c.cwdBatch} ghost={"cwdBatch" in o} />
      <Cell l="Employee" v={o.employeeId ?? c.employeeId} ghost={"employeeId" in o} />
      <Cell l="Supervisor" v={c.supervisorId ?? "–"} />
    </div>
  );
}

export function RecordView({ check: c, onChange }: { check: Check; onChange?: () => void }) {
  const t = useT();
  const can = useCan();
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);
  const employees = useStore((s) => s.employees);
  const amendments = useStore((s) => s.amendments).filter((a) => a.originalId === c.id);
  const allChecks = useStore((s) => s.checks);
  const original = c.linkedTo ? allChecks.find((x) => x.id === c.linkedTo) : undefined;
  const followUps = allChecks.filter((x) => x.linkedTo === c.id);
  const approve = useStore((s) => s.approveCheck);
  const ret = useStore((s) => s.returnCheck);
  const amend = useStore((s) => s.amendCheck);
  const toast = useStore((s) => s.toast);
  const [sign, setSign] = useState(false);
  const [retOpen, setRetOpen] = useState(false);
  const [why, setWhy] = useState("");
  const [amOpen, setAmOpen] = useState(false);
  const [field, setField] = useState("dp");
  const [to, setTo] = useState("");
  const [amWhy, setAmWhy] = useState("");
  const locked = c.status === "approved";
  const over = Object.fromEntries(amendments.map((a) => [a.field, a.to]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusTrio c={c} className="me-auto" />
        {c.kind === "resample" && <StatusBadge kind="info"><T>{"Re-sample"}</T></StatusBadge>}
        {locked && <StatusBadge kind="locked">{t("Locked record")}</StatusBadge>}
      </div>
      {(original || followUps.length > 0) && (
        <div className="space-y-1.5 rounded-2xl border border-info/40 bg-info/10 p-3 text-sm">
          {original && <p><span className="text-muted">{t("Re-sample of failed sample")}:</span> <span className="font-mono font-semibold">{original.sampleId}</span> <StatusBadge kind="fail">{t("Failed")}</StatusBadge></p>}
          {followUps.map((f) => <p key={f.id}><span className="text-muted">{t("Superseded by re-sample")}:</span> <span className="font-mono font-semibold">{f.sampleId}</span> <StatusBadge kind={f.result === "pass" ? "pass" : "fail"}>{f.result === "pass" ? t("Pass") : t("Failed")}</StatusBadge></p>)}
          <p className="text-xs text-faint">{t("The original failed result is permanent and is never overwritten.")}</p>
        </div>
      )}
      <p className="text-sm text-muted">{OCCASIONS[c.occasion].label} · {empName(employees, c.employeeId, lang)} · signed</p>
      {c.failReason && <p className="rounded-2xl border border-fail/50 bg-fail/10 p-3 text-sm text-fail-fg">{t("Failure reason")}: {c.failReason}</p>}
      {c.returnReason && <p className="rounded-2xl border border-pending/50 bg-pending/10 p-3 text-sm text-pending-fg">{t("Returned")}: {c.returnReason}</p>}

      {amendments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Lock size={14} /> {t("Original")} (preserved)</p><Grid c={c} /></div>
          <div><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-pending-fg"><PenLine size={14} /> {t("Amendment")}</p><Grid c={c} over={over} />
            <ul className="mt-2 space-y-1 text-xs text-muted">{amendments.map((a) => <li key={a.id}>{a.field}: {a.from} → <b className="text-fg">{a.to}</b> · {a.reason} · {a.by}</li>)}</ul></div>
        </div>
      ) : <Grid c={c} />}

      {c.status === "awaiting" && (
        can("verify") ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setSign(true)}>{t("Approve")} ({t("Countersign")})</Button>
            <Button onClick={() => setRetOpen(true)}><Undo2 size={16} /> {t("Return")}</Button>
          </div>
        ) : <p className="flex items-center gap-2 text-sm text-muted"><Lock size={14} /> Verification is a Supervisor action. {t("Read-only for this role")}.</p>
      )}

      {locked && (
        <div className="rounded-2xl border border-hair-strong bg-hi p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold"><Lock size={16} /> {t("Locked record")}</p>
          <p className="mt-1 text-muted"><T>{"Approved records are immutable. Corrections create an amendment that preserves the original."}</T></p>
          <div className="mt-3 flex flex-wrap gap-2">
            {can("amend") && <Button size="sm" onClick={() => { setTo(""); setAmWhy(""); setAmOpen(true); }}><PenLine size={14} /> {t("Create amendment")}</Button>}
            <Button size="sm" onClick={() => toast("info", "Submitted records cannot be deleted. Use an amendment.")}><Trash2 size={14} /> <T>{"Delete"}</T></Button>
            {role === "admin" && <span className="self-center text-xs text-pending-fg"><T>{"Admins cannot edit or delete submitted records."}</T></span>}
          </div>
        </div>
      )}

      <SignModal open={sign} onClose={() => setSign(false)} title={`${t("Countersign")}: ${c.vehicleId}`} confirmLabel={`${t("Approve")} & lock`} onConfirm={() => { approve(c.id); onChange?.(); }}>
        <p className="text-sm text-muted"><T>{"Approving locks"}</T> <span className="font-mono">{c.sampleId}</span><T>{". It cannot be edited afterwards, only amended."}</T></p>
      </SignModal>

      <Modal open={retOpen} onClose={() => setRetOpen(false)} title={t("Return")}>
        <div className="space-y-4">
          <Field label={t("Return reason (required)")}><textarea className={cn(inputCls, "h-auto py-3")} rows={3} value={why} onChange={(e) => setWhy(e.target.value)} autoFocus /></Field>
          <Button variant="primary" size="lg" className="w-full" disabled={why.trim().length < 5} onClick={() => { ret(c.id, why.trim()); setRetOpen(false); setWhy(""); onChange?.(); }}>{t("Return")}</Button>
        </div>
      </Modal>

      <Modal open={amOpen} onClose={() => setAmOpen(false)} title={t("Create amendment")}>
        <div className="space-y-4">
          <Field label="Field to correct"><select className={inputCls} value={field} onChange={(e) => setField(e.target.value)}><option value="dp" className="text-black"><T>{"Differential pressure"}</T></option><option value="cwdBatch" className="text-black"><T>{"CWD batch / lot"}</T></option><option value="employeeId" className="text-black"><T>{"Employee number"}</T></option></select></Field>
          <Field label="Corrected value"><input className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Field label="Reason (required)"><textarea className={cn(inputCls, "h-auto py-3")} rows={2} value={amWhy} onChange={(e) => setAmWhy(e.target.value)} /></Field>
          <Button variant="primary" size="lg" className="w-full" disabled={!to.trim() || amWhy.trim().length < 5} onClick={() => { amend(c.id, field, to.trim(), amWhy.trim()); setAmOpen(false); }}><T>{"Record amendment"}</T></Button>
        </div>
      </Modal>
    </div>
  );
}
