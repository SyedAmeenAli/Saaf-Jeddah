"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, Check as CheckI, Lock, Nfc, OctagonAlert, Send, ShieldAlert, X } from "lucide-react";
import type { Check, OccasionId, PointId, Res, Vehicle } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useApplicable, useNow, useT } from "@/lib/hooks";
import { DP_RANGE, OCCASIONS, OCCASION_ORDER, POINTS } from "@/lib/domain";
import { cn, fmtDT, ymd } from "@/lib/utils";
import { Button, Field, Modal, StatusBadge, inputCls } from "@/components/ui/Glass";
import { ColorSwatchSelect, ResultToggle } from "./ResultToggle";
import { SignBlock } from "./Sign";
import { DispenserSvg, HOTSPOTS, TruckSvg } from "@/components/illustrations/Vehicles";
import { PointCloseup, SampleJarSvg } from "@/components/illustrations/Equipment";
import { spring } from "@/lib/motion";

type Tri = Res | null;
const STEPS = ["Vehicle", "Sampling point", "Occasion", "VAC", "CWD", "Sign-off", "Review"] as const;

function Stepper({ at, onJump }: { at: number; onJump: (i: number) => void }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between sm:hidden">
        <p className="text-sm font-semibold">Step {at + 1} of {STEPS.length} <span className="font-normal text-muted">· {STEPS[at]}</span></p>
      </div>
      <ol className="mt-2 flex items-center sm:mt-0" aria-label="Sampling steps">
        {STEPS.map((s, i) => {
          const done = i < at, cur = i === at;
          return (
            <li key={s} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
              <button type="button" disabled={i > at} onClick={() => onJump(i)} aria-current={cur ? "step" : undefined} aria-label={`${s}${done ? ", completed" : ""}`}
                className="group flex flex-col items-center gap-1.5 disabled:cursor-default">
                <span className={cn("relative flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                  done ? "border-teal/60 bg-teal/25 text-teal" : cur ? "border-teal bg-gradient-to-b from-teal/40 to-teal/15 text-white shadow-[0_0_0_4px_rgba(181,138,255,0.14),0_8px_20px_-8px_rgba(181,138,255,0.7)]" : "border-hair bg-white/[0.04] text-faint")}>
                  {done ? <CheckI size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn("hidden text-[11px] sm:block", cur ? "font-semibold text-fg" : "text-faint")}>{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className="relative mx-1.5 mb-5 h-px flex-1 bg-white/10 sm:mb-6">
                  <motion.span className="absolute inset-y-0 start-0 bg-teal" initial={false} animate={{ width: i < at ? "100%" : "0%" }} transition={spring} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div><h3 className="font-display text-lg font-semibold">{title}</h3>{note && <p className="mt-0.5 text-sm text-muted">{note}</p>}</div>
      {children}
    </section>
  );
}
const Fact = ({ l, v, mono = true }: { l: string; v: string; mono?: boolean }) => (
  <div className="glass-2 min-w-0 rounded-2xl border border-hair p-3.5"><p className="text-xs text-muted">{l}</p><p className={cn("mt-0.5 truncate text-[15px] font-semibold", mono && "font-mono")}>{v}</p></div>
);

function PointDiagram({ vehicle, point }: { vehicle: Vehicle; point: PointId }) {
  const hs = HOTSPOTS[vehicle.type];
  return (
    <div className="glass-2 relative mx-auto w-full max-w-xl rounded-3xl border border-hair p-3">
      <div className="relative">
        {vehicle.type === "refueller" ? <TruckSvg className="w-full" /> : <DispenserSvg className="w-full" />}
        {(Object.keys(hs) as PointId[]).map((p) => {
          const on = p === point, pos = hs[p]!;
          return (
            <span key={p} className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
              {on && <span className="absolute size-9 animate-ping rounded-full bg-teal/40" />}
              <span className={cn("relative rounded-full border-2 border-white shadow-lg", on ? "size-5 bg-teal" : "size-3 bg-white/30")} />
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-muted">Highlighted: <b className="text-teal">{POINTS[point].label}</b></p>
    </div>
  );
}

export function InspectionSheet({ open, onClose, vehicle, point, occasion: occ0, onDone }: {
  open: boolean; onClose: () => void; vehicle: Vehicle; point: PointId; occasion: OccasionId; onDone: () => void;
}) {
  const t = useT();
  const applicable = useApplicable();
  const employees = useStore((s) => s.employees);
  const submit = useStore((s) => s.submitCheck);
  const nextSeq = useStore((s) => s.nextSeq);
  const offline = useStore((s) => s.offline);
  const role = useStore((s) => s.role);
  const defaultEmp = role === "supervisor" ? "EMP-2001" : "EMP-1024";

  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState<OccasionId>(occ0);
  const [emp, setEmp] = useState(defaultEmp);
  const [colour, setColour] = useState<Check["colour"]>("water-white");
  const [colourChange, setColourChange] = useState(false);
  const [clarity, setClarity] = useState<Tri>(null);
  const [sediment, setSediment] = useState<Tri>(null);
  const [freeWater, setFreeWater] = useState<Tri>(null);
  const [cwd, setCwd] = useState<Tri | "na">(null);
  const [kit, setKit] = useState("CWD Kit (demo)");
  const [batch, setBatch] = useState("");
  const [exp, setExp] = useState("2027-06");
  const [dp, setDp] = useState("0.45");
  const [photo, setPhoto] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [reason, setReason] = useState("");
  const [failType, setFailType] = useState("Visible water");
  const [acts, setActs] = useState<Record<string, boolean>>({ "Isolate equipment / Do not use": true, "Report to QC": true, "Re-sample and re-test": true });
  const actList = Object.entries(acts).filter(([, v]) => v).map(([k]) => k);
  const [result, setResult] = useState<Check | null>(null);
  const now = useNow(15000);

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);

  const occasions = useMemo(() => {
    const l = OCCASION_ORDER.filter((o) => applicable(o, vehicle.type).includes(point));
    return l.includes(occ0) ? l : [occ0, ...l];
  }, [vehicle.type, point, occ0, applicable]);

  const empRec = employees.find((e) => e.id.toLowerCase() === emp.trim().toLowerCase());
  const authorised = !!empRec && empRec.role !== "manager" && empRec.role !== "admin" && empRec.certExpiry > now;
  const empMsg = !empRec ? "Unknown employee number" : empRec.role === "manager" || empRec.role === "admin" ? "This role cannot sign sampling checks" : empRec.certExpiry <= now ? "Qualification expired: only authorised operators can sign checks" : null;

  const dpNum = parseFloat(dp);
  const dpValid = !Number.isNaN(dpNum) && dpNum >= 0;
  const dpIn = dpValid && dpNum >= DP_RANGE.min && dpNum <= DP_RANGE.max;
  const anyFail = clarity === "fail" || sediment === "fail" || freeWater === "fail" || cwd === "fail";
  const sampleId = `${vehicle.locationId}-${vehicle.id.replace("-", "")}-${POINTS[point].code}-${ymd(now)}-${String(nextSeq(vehicle.id, point)).padStart(3, "0")}`;
  const tag = vehicle.tags[point];

  /** What blocks each step. Empty array = may continue. */
  const need = (s: number): string[] => {
    const m: string[] = [];
    if (s === 3) { if (!clarity) m.push("Clarity & brightness"); if (!sediment) m.push("Sediment"); if (!freeWater) m.push("Free water / haze"); }
    if (s === 4) { if (!cwd) m.push("CWD result"); if ((cwd === "pass" || cwd === "fail") && !batch.trim()) m.push("CWD batch / lot"); if (!dpValid) m.push("Differential pressure"); }
    if (s === 5) { if (!authorised) m.push("Authorised employee number"); if (anyFail && reason.trim().length < 5) m.push("Failure remarks (mandatory)"); if (!signed) m.push("Signature + PIN"); }
    return m;
  };
  const blockers = need(step);
  const allMissing = [3, 4, 5].flatMap(need);

  const send = () => {
    if (allMissing.length) return;
    const c = submit({
      vehicleId: vehicle.id, point, occasion, employeeId: empRec!.id, colour, colourChange,
      clarity: clarity!, sediment: sediment!, freeWater: freeWater!, microbialSigns: "no",
      cwd: cwd as Check["cwd"], cwdKit: kit, cwdBatch: batch || "–", cwdExpiry: exp, dp: dpNum,
      failReason: anyFail ? `${failType}: ${reason.trim()} [Actions: ${actList.join("; ") || "none"}]` : reason.trim() ? `Remarks: ${reason.trim()}` : undefined,
    });
    setResult(c);
  };

  const reset = () => {
    setStep(0); setClarity(null); setSediment(null); setFreeWater(null); setCwd(null); setBatch(""); setReason(""); setPhoto(null); setResult(null); setColour("water-white"); setColourChange(false); setSigned(false); setOccasion(occ0);
  };
  const close = () => { onClose(); if (result) onDone(); setTimeout(reset, 400); };

  const footer = !result ? (
    <div>
      {blockers.length > 0 && <p className="mb-2 text-xs text-muted">Still needed: {blockers.join(" · ")}</p>}
      <div className="flex gap-2">
        <Button variant="secondary" size="lg" onClick={() => (step === 0 ? close() : setStep(step - 1))} className="shrink-0"><ArrowLeft size={18} className="rtl:rotate-180" /> {step === 0 ? "Cancel" : "Back"}</Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" size="lg" className="flex-1" disabled={blockers.length > 0} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={18} className="rtl:rotate-180" /></Button>
        ) : (
          <Button variant={anyFail ? "danger" : "primary"} size="lg" className="flex-1" disabled={allMissing.length > 0} onClick={send}>
            <Send size={18} /> {anyFail ? "Submit failed check & raise HOLD" : "Submit for supervisor verification"}{offline ? ` (${t("Offline")})` : ""}
          </Button>
        )}
      </div>
    </div>
  ) : undefined;

  return (
    <Modal open={open} onClose={close} title={result ? t("Locked") : t("Scan & Inspect")} sheet wide footer={footer}>
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="relative size-36">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--hair-strong)" strokeWidth="6" opacity=".4" />
                <motion.circle cx="60" cy="60" r="52" fill="none" stroke={result.result === "pass" ? "#2fbf8f" : "#ef6f6c"} strokeWidth="6" strokeLinecap="round" strokeDasharray={327}
                  initial={{ strokeDashoffset: 327 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
              </svg>
              <motion.svg viewBox="0 0 24 24" className="absolute inset-0 m-auto size-16" fill="none" stroke={result.result === "pass" ? "#2fbf8f" : "#ef6f6c"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, ...spring }}>
                {result.result === "pass" ? <motion.path d="M5 12.5l4.5 4.5L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.85, duration: 0.4 }} /> : <path d="M6 6l12 12M18 6L6 18" />}
              </motion.svg>
              <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 1.3, ...spring }}
                className="absolute -bottom-1 -end-1 flex size-11 items-center justify-center rounded-full border border-hair-strong bg-[var(--glass-strong)] text-fg shadow-lg" aria-hidden="true"><Lock size={20} /></motion.span>
            </div>
            <div>
              <h3 className="mt-2 font-display text-2xl font-semibold">{result.result === "pass" ? "Submitted. Awaiting supervisor review" : "FAILED: HOLD raised"}</h3>
              <p className="mt-1 font-mono text-sm text-muted">{result.sampleId}</p>
              <div className="mt-3 flex justify-center gap-2"><StatusBadge kind={result.result === "pass" ? "pass" : "fail"}>{result.result === "pass" ? t("Pass") : t("Fail")}</StatusBadge><StatusBadge kind="pending">{t("Awaiting supervisor")}</StatusBadge>{!result.synced && <StatusBadge kind="info">{t("Offline")} · {t("queued")}</StatusBadge>}</div>
            </div>
            {result.result === "fail" && (
              <div className="w-full max-w-md rounded-2xl border border-fail/60 bg-fail/15 p-4 text-start text-sm text-fail-fg">
                <p className="flex items-center gap-2 font-semibold"><OctagonAlert size={18} /> HOLD — Do not fuel {vehicle.id}</p>
                <p className="mt-1 text-fail-fg/90">Supervisor and QC manager have been notified. Next: Re-sample → Authorised release. The failed result is permanent; it can only be superseded by a new linked sample.</p>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={close}>Next check</Button>
              <Link href={`/records?open=${result.id}`}><Button>View record</Button></Link>
              <Link href={`/fleet?open=${vehicle.id}`}><Button>{vehicle.id}</Button></Link>
            </div>
          </motion.div>
        ) : (
          <motion.div key="wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-4">
            <Stepper at={step} onJump={(i) => i <= step && setStep(i)} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }} className="space-y-6">

                {step === 0 && (
                  <Panel title="Identify vehicle" note="Identified from the tag you scanned.">
                    <div className="glass-2 flex items-center gap-4 rounded-3xl border border-hair p-4">
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal/15 text-teal"><Nfc size={26} strokeWidth={1.5} /></span>
                      <div className="min-w-0"><p className="text-xs text-muted">{vehicle.type === "refueller" ? t("Refueller") : t("Hydrant dispenser")} · {vehicle.locationId}</p><p className="font-display text-3xl font-semibold">{vehicle.id}</p><p className="font-mono text-xs text-muted">{vehicle.plate}</p></div>
                      <StatusBadge kind="pass">Identified</StatusBadge>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5"><Fact l="Tag ID" v={tag ?? "Manual entry"} /><Fact l="Employee" v={emp} /></div>
                  </Panel>
                )}

                {step === 1 && (
                  <Panel title="Identify sampling point" note={vehicle.type === "dispenser" ? "Hydrant dispensers have no tank sump or tank drain." : "Confirm this is the point you are standing at."}>
                    <PointDiagram vehicle={vehicle} point={point} />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass-2 rounded-3xl border border-hair p-2"><PointCloseup point={point} className="mx-auto h-36 w-full" /></div>
                      <div className="glass-2 rounded-3xl border border-hair p-2"><SampleJarSvg className="mx-auto h-36 w-full" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5"><Fact l="Sampling point" v={POINTS[point].label} mono={false} /><Fact l="Point code" v={POINTS[point].code} /></div>
                  </Panel>
                )}

                {step === 2 && (
                  <Panel title="Confirm sampling occasion" note="Only occasions approved for this equipment and point are shown.">
                    <div role="radiogroup" aria-label="Sampling occasion" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {occasions.map((o) => (
                        <button key={o} type="button" role="radio" aria-checked={occasion === o} onClick={() => setOccasion(o)}
                          className={cn("flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-start text-sm font-medium transition-colors", occasion === o ? "border-teal/70 bg-teal/15 text-fg" : "glass-2 border-hair text-muted hover:text-fg")}>
                          <span className={cn("flex size-5 items-center justify-center rounded-full border", occasion === o ? "border-teal bg-teal text-[#04141a]" : "border-hair-strong")}>{occasion === o && <CheckI size={12} strokeWidth={3} />}</span>
                          {OCCASIONS[o].label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"><Fact l={t("Date / time")} v={fmtDT(now)} /><Fact l="Employee" v={emp} /><Fact l={t("Sample ID")} v={sampleId} /></div>
                  </Panel>
                )}

                {step === 3 && (
                  <Panel title={t("Visual appearance check")} note="Visual and clarity observations (VAC). Every result needs a deliberate choice.">
                    <div>
                      <p className="mb-1.5 text-sm font-semibold">{t("Colour")}</p>
                      <ColorSwatchSelect value={colour} onChange={(v) => setColour(v as Check["colour"])} />
                      <label className="mt-2 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={colourChange} onChange={(e) => setColourChange(e.target.checked)} className="size-5 accent-[var(--teal)]" /> Colour changed compared with previous sample (flag)</label>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <ResultToggle label={t("Clarity & brightness")} value={clarity} onChange={(v) => setClarity(v as Res)} passHint="Clear & bright" failHint="Not clear" />
                      <ResultToggle label={t("Visible sediment")} value={sediment} onChange={(v) => setSediment(v as Res)} passHint="None visible" failHint="Sediment" />
                      <ResultToggle label={t("Visible free water / haze")} value={freeWater} onChange={(v) => setFreeWater(v as Res)} passHint="None visible" failHint="Water / haze" />
                    </div>
                    <p className="text-xs text-faint">Microbial testing is a separate scheduled monitoring programme. See Microbial Monitoring.</p>
                  </Panel>
                )}

                {step === 4 && (
                  <>
                    <Panel title={t("Chemical water detector (CWD)")} note="Record the kit details exactly as printed. Acceptance limits are those approved by APSCO Quality Control, not set by this demo.">
                      <ResultToggle label="CWD result" value={cwd} onChange={(v) => setCwd(v)} notDone passHint="No water" failHint="Water detected" />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Field label="Test kit type"><input className={inputCls} value={kit} onChange={(e) => setKit(e.target.value)} aria-label="Kit type" placeholder="Kit type" /></Field>
                        <Field label="Batch / lot number"><input className={inputCls} value={batch} onChange={(e) => setBatch(e.target.value)} aria-label="Batch or lot" placeholder="Printed on kit" /></Field>
                        <Field label="Kit expiry"><input className={inputCls} type="month" value={exp} onChange={(e) => setExp(e.target.value)} aria-label="Kit expiry" /></Field>
                      </div>
                    </Panel>
                    <Panel title={t("Filter differential pressure")} note={`Placeholder range ${DP_RANGE.min}–${DP_RANGE.max} ${DP_RANGE.unit}, per approved procedure`}>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="relative w-40"><input inputMode="decimal" className={cn(inputCls, "pe-14 font-mono text-lg")} value={dp} onChange={(e) => setDp(e.target.value)} aria-label="Differential pressure in bar" /><span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted">bar</span></div>
                        <div className="min-w-48 flex-1">
                          <div className="relative h-3 rounded-full bg-gradient-to-r from-pending/60 via-pass/70 to-pending/60">
                            <motion.span className="absolute top-1/2 size-5 -translate-y-1/2 rounded-full border-2 border-white bg-fg shadow" animate={{ left: `${Math.min(100, Math.max(0, (dpNum / 1.5) * 100))}%` }} transition={spring} />
                          </div>
                          <p className={cn("mt-2 text-xs font-semibold", dpIn ? "text-pass-fg" : "text-pending-fg")}>{dpIn ? "✓ In range" : "Outside placeholder range: confirm per procedure"}</p>
                        </div>
                      </div>
                    </Panel>
                  </>
                )}

                {step === 5 && (
                  <>
                    <Panel title="Employee authentication" note="Only an authorised operator can sign a sampling check.">
                      <label className="block">
                        <span className="text-xs text-muted">{t("Employee number")}</span>
                        <input value={emp} onChange={(e) => setEmp(e.target.value.toUpperCase())} className={cn(inputCls, "mt-1 font-mono", empMsg && "!border-fail")} aria-invalid={!!empMsg} />
                        {empMsg ? <span className="mt-1 flex items-center gap-1.5 text-xs text-fail-fg"><ShieldAlert size={13} /> {empMsg}. Try EMP-1024 (authorised) or EMP-1079 (expired).</span>
                          : <span className="mt-1 block text-xs text-pass-fg">✓ {empRec?.name} · {t("Authorised")}</span>}
                      </label>
                    </Panel>
                    {anyFail && (
                      <div className="space-y-3 rounded-3xl border border-fail/50 bg-fail/10 p-4">
                        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-fail-fg"><OctagonAlert size={18} /> {t("Failure management")}</h3>
                        <p className="text-sm">On submit: <b>HOLD — Do not fuel</b> on {vehicle.id}. Chain: <b>Failed check → Re-sample → Authorised release</b>. This result can never be overwritten.</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="block text-sm font-medium">Failure type
                            <select value={failType} onChange={(e) => setFailType(e.target.value)} className={cn(inputCls, "mt-1.5")}>
                              {["Visible water", "Sediment", "Haze / not clear", "CWD indicated water", "Other"].map((x) => <option key={x} className="text-black">{x}</option>)}
                            </select>
                          </label>
                          <fieldset><legend className="mb-1.5 text-sm font-medium">Immediate action</legend>
                            {["Isolate equipment / Do not use", "Report to QC", "Re-sample and re-test", "Notify maintenance"].map((x) => (
                              <label key={x} className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--teal)]" checked={!!acts[x]} onChange={(e) => setActs({ ...acts, [x]: e.target.checked })} />{x}</label>
                            ))}
                          </fieldset>
                        </div>
                      </div>
                    )}
                    <Panel title={anyFail ? "Observation / remarks (mandatory)" : "Remarks and photograph (optional)"}>
                      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder={anyFail ? "Describe what was observed…" : "Add a remark if needed"} className={cn(inputCls, "h-auto py-3")} aria-label="Remarks" />
                      <label className="glass-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-hair-strong px-4 text-sm text-muted hover:text-fg">
                        <Camera size={20} /> <span>Add sample jar photo (stays in your browser)</span>
                        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
                      </label>
                      {photo && (
                        <div className="relative w-40 overflow-hidden rounded-2xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo} alt="Sample jar preview" className="h-28 w-40 object-cover" />
                          <button type="button" onClick={() => setPhoto(null)} aria-label="Remove photo" className="absolute end-1 top-1 flex size-8 items-center justify-center rounded-full bg-black/60 text-white"><X size={14} /></button>
                        </div>
                      )}
                    </Panel>
                    <Panel title={`${t("Signature")} & ${t("PIN confirm")}`}><SignBlock onReady={setSigned} /></Panel>
                  </>
                )}

                {step === 6 && (
                  <Panel title="Review and submit" note="Submitting locks this record. A supervisor then verifies it.">
                    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                      <Fact l={t("Location")} v={vehicle.locationId} /><Fact l={t("Vehicle")} v={vehicle.id} /><Fact l={t("Sampling point")} v={POINTS[point].label} mono={false} />
                      <Fact l="Occasion" v={OCCASIONS[occasion].label} mono={false} /><Fact l="Employee" v={`${emp}${empRec ? ` · ${empRec.name}` : ""}`} mono={false} /><Fact l={t("Sample ID")} v={sampleId} />
                    </div>
                    <div className="glass-2 divide-y divide-hair rounded-3xl border border-hair">
                      {([["Clarity & brightness", clarity], ["Visible sediment", sediment], ["Visible free water / haze", freeWater], ["CWD", cwd === "na" ? null : cwd]] as const).map(([l, v]) => (
                        <div key={l} className="flex items-center justify-between px-4 py-3 text-sm"><span>{l}</span>{v ? <StatusBadge kind={v === "pass" ? "pass" : "fail"}>{v === "pass" ? t("Pass") : t("Fail")}</StatusBadge> : <span className="text-faint">Not done</span>}</div>
                      ))}
                      <div className="flex items-center justify-between px-4 py-3 text-sm"><span>Differential pressure</span><span className="font-mono">{dp} bar</span></div>
                      <div className="flex items-center justify-between px-4 py-3 text-sm"><span>CWD kit / batch / expiry</span><span className="font-mono text-xs">{kit} · {batch || "–"} · {exp}</span></div>
                    </div>
                    {anyFail ? <p className="flex items-center gap-2 rounded-2xl border border-fail/50 bg-fail/10 p-3 text-sm text-fail-fg"><OctagonAlert size={16} /> A failed result raises a HOLD on {vehicle.id}.</p> : <p className="flex items-center gap-2 text-sm text-muted"><CheckI size={16} className="text-pass-fg" /> All checks recorded. The sample will show as Awaiting Supervisor Review.</p>}
                  </Panel>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
