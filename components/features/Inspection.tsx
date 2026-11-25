"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Lock, OctagonAlert, ShieldAlert, X } from "lucide-react";
import type { Check, OccasionId, PointId, Res, Vehicle } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useNow, useT } from "@/lib/hooks";
import { DP_RANGE, OCCASIONS, POINTS } from "@/lib/domain";
import { cn, fmtDT, ymd } from "@/lib/utils";
import { Button, Modal, StatusBadge, inputCls } from "@/components/ui/Glass";
import { ColorSwatchSelect, ResultToggle } from "./ResultToggle";
import { SignBlock } from "./Sign";
import { spring } from "@/lib/motion";

type Tri = Res | null;

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="space-y-3">
      <div><h3 className="font-display text-base font-semibold">{title}</h3>{note && <p className="text-xs text-muted">{note}</p>}</div>
      {children}
    </section>
  );
}

export function InspectionSheet({ open, onClose, vehicle, point, occasion, onDone }: {
  open: boolean; onClose: () => void; vehicle: Vehicle; point: PointId; occasion: OccasionId; onDone: () => void;
}) {
  const t = useT();
  const employees = useStore((s) => s.employees);
  const submit = useStore((s) => s.submitCheck);
  const nextSeq = useStore((s) => s.nextSeq);
  const offline = useStore((s) => s.offline);
  const role = useStore((s) => s.role);
  const defaultEmp = role === "supervisor" ? "EMP-2001" : "EMP-1024";

  const [emp, setEmp] = useState(defaultEmp);
  const [colour, setColour] = useState<Check["colour"]>("water-white");
  const [colourChange, setColourChange] = useState(false);
  const [clarity, setClarity] = useState<Tri>(null);
  const [sediment, setSediment] = useState<Tri>(null);
  const [freeWater, setFreeWater] = useState<Tri>(null);
  const [micro, setMicro] = useState<Tri>(null);
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

  const empRec = employees.find((e) => e.id.toLowerCase() === emp.trim().toLowerCase());
  const authorised = !!empRec && empRec.role !== "manager" && empRec.role !== "admin" && empRec.certExpiry > now;
  const empMsg = !empRec ? "Unknown employee number" : empRec.role === "manager" || empRec.role === "admin" ? "This role cannot sign sampling checks" : empRec.certExpiry <= now ? "Qualification expired: only authorised operators can sign checks" : null;

  const dpNum = parseFloat(dp);
  const dpValid = !Number.isNaN(dpNum) && dpNum >= 0;
  const dpIn = dpValid && dpNum >= DP_RANGE.min && dpNum <= DP_RANGE.max;
  const anyFail = clarity === "fail" || sediment === "fail" || freeWater === "fail" || micro === "fail" || cwd === "fail";
  const sampleId = `${vehicle.locationId}-${vehicle.id.replace("-", "")}-${POINTS[point].code}-${ymd(now)}-${String(nextSeq(vehicle.id, point)).padStart(3, "0")}`;

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!clarity) m.push("Clarity & brightness");
    if (!sediment) m.push("Sediment");
    if (!freeWater) m.push("Free water / haze");
    if (!micro) m.push("Microbial growth signs");
    if (!cwd) m.push("CWD result");
    if ((cwd === "pass" || cwd === "fail") && !batch.trim()) m.push("CWD batch/lot");
    if (!dpValid) m.push("Differential pressure");
    if (!authorised) m.push("Authorised employee number");
    if (anyFail && reason.trim().length < 5) m.push("Failure reason (mandatory)");
    if (!signed) m.push("Signature + PIN");
    return m;
  }, [clarity, sediment, freeWater, micro, cwd, batch, dpValid, authorised, anyFail, reason, signed]);

  const send = () => {
    const c = submit({
      vehicleId: vehicle.id, point, occasion, employeeId: empRec!.id, colour, colourChange,
      clarity: clarity!, sediment: sediment!, freeWater: freeWater!, microbialSigns: micro === "fail" ? "yes" : "no",
      cwd: cwd as Check["cwd"], cwdKit: kit, cwdBatch: batch || "–", cwdExpiry: exp, dp: dpNum, failReason: anyFail ? `${failType}: ${reason.trim()} [Actions: ${actList.join("; ") || "none"}]` : undefined,
    });
    setResult(c);
  };

  const reset = () => {
    setClarity(null); setSediment(null); setFreeWater(null); setMicro(null); setCwd(null); setBatch(""); setReason(""); setPhoto(null); setResult(null); setColour("water-white"); setColourChange(false);
  };
  const close = () => { onClose(); if (result) onDone(); setTimeout(reset, 400); };

  return (
    <Modal open={open} onClose={close} title={result ? t("Locked") : t("Scan & Inspect")} sheet wide footer={(
        !result ? (
          <div>
            {missing.length > 0 && <p className="mb-2 text-xs text-muted">Still needed: {missing.join(" · ")}</p>}
            <Button type="submit" form="inspection-form" variant={anyFail ? "danger" : "primary"} size="lg" className="w-full" disabled={missing.length > 0}>
              <Lock size={18} /> {anyFail ? "Submit failed check & raise HOLD" : t("Submit & lock record")}{offline ? ` (${t("Offline")})` : ""}
            </Button>
          </div>
        ) : undefined
      )}>
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="relative size-36">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--hair-strong)" strokeWidth="6" opacity=".4" />
                <motion.circle cx="60" cy="60" r="52" fill="none" stroke={result.result === "pass" ? "#34d399" : "#ff6b6b"} strokeWidth="6" strokeLinecap="round" strokeDasharray={327}
                  initial={{ strokeDashoffset: 327 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
              </svg>
              <motion.svg viewBox="0 0 24 24" className="absolute inset-0 m-auto size-16" fill="none" stroke={result.result === "pass" ? "#34d399" : "#ff6b6b"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, ...spring }}>
                {result.result === "pass" ? <motion.path d="M5 12.5l4.5 4.5L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.85, duration: 0.4 }} /> : <path d="M6 6l12 12M18 6L6 18" />}
              </motion.svg>
              <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 1.3, ...spring }}
                className="absolute -bottom-1 -end-1 flex size-11 items-center justify-center rounded-full border border-hair-strong bg-[var(--glass-strong)] text-fg shadow-lg" aria-hidden="true"><Lock size={20} /></motion.span>
            </div>
            <div>
              
              <h3 className="mt-2 font-display text-2xl font-semibold">{result.result === "pass" ? "Check recorded & locked" : "FAILED: HOLD raised"}</h3>
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
          <motion.form id="inspection-form" key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={(e) => { e.preventDefault(); if (!missing.length) send(); }} className="space-y-7 pb-4">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-hi p-4 text-sm md:grid-cols-3">
              {[[t("Location"), vehicle.locationId], [t("Vehicle"), vehicle.id], [t("Sampling point"), POINTS[point].label], ["Occasion", OCCASIONS[occasion].label], [t("Date / time"), fmtDT(now)], [t("Sample ID"), sampleId]].map(([l, v]) => (
                <div key={l} className={cn("min-w-0", l === t("Sample ID") && "col-span-2 md:col-span-1")}><p className="text-xs text-muted">{l}</p><p className="truncate font-mono text-[13px] font-semibold">{v}</p></div>
              ))}
              <label className="col-span-2 md:col-span-3">
                <span className="text-xs text-muted">{t("Employee number")}</span>
                <input value={emp} onChange={(e) => setEmp(e.target.value.toUpperCase())} className={cn(inputCls, "mt-1 font-mono", empMsg && "border-fail")} aria-invalid={!!empMsg} />
                {empMsg ? <span className="mt-1 flex items-center gap-1.5 text-xs text-fail-fg"><ShieldAlert size={13} /> {empMsg}. Try EMP-1024 (authorised) or EMP-1079 (expired).</span>
                  : <span className="mt-1 block text-xs text-pass-fg">✓ {empRec?.name} · {t("Authorised")}</span>}
              </label>
            </div>

            <Section title={t("Visual appearance check")}>
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-sm font-semibold">{t("Colour")}</p>
                  <ColorSwatchSelect value={colour} onChange={(v) => setColour(v as Check["colour"])} />
                  <label className="mt-2 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={colourChange} onChange={(e) => setColourChange(e.target.checked)} className="size-5 accent-[var(--teal)]" /> Colour changed compared with previous sample (flag)</label>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ResultToggle label={t("Clarity & brightness")} value={clarity} onChange={(v) => setClarity(v as Res)} passHint="Clear & bright" failHint="Not clear" />
                  <ResultToggle label={t("Visible sediment")} value={sediment} onChange={(v) => setSediment(v as Res)} passHint="None visible" failHint="Sediment" />
                  <ResultToggle label={t("Visible free water / haze")} value={freeWater} onChange={(v) => setFreeWater(v as Res)} passHint="None visible" failHint="Water / haze" />
                  <div>
                    <ResultToggle label={t("Microbial growth signs")} value={micro} onChange={(v) => setMicro(v as Res)} passHint="No signs" failHint="Signs seen" />
                    <p className="mt-1 text-[11px] leading-snug text-faint">Visual observation only. Not proof of microbial cleanliness.</p>
                  </div>
                </div>
              </div>
            </Section>

            <Section title={t("Chemical water detector (CWD)")}>
              <ResultToggle label="CWD result" value={cwd} onChange={(v) => setCwd(v)} notDone passHint="No water" failHint="Water detected" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input className={inputCls} value={kit} onChange={(e) => setKit(e.target.value)} aria-label="Kit type" placeholder="Kit type" />
                <input className={inputCls} value={batch} onChange={(e) => setBatch(e.target.value)} aria-label="Batch or lot" placeholder="Batch / lot" />
                <input className={inputCls} type="month" value={exp} onChange={(e) => setExp(e.target.value)} aria-label="Kit expiry" />
              </div>
            </Section>

            <Section title={t("Filter differential pressure")} note={`Placeholder range ${DP_RANGE.min}–${DP_RANGE.max} ${DP_RANGE.unit}, per approved procedure`}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative w-40"><input inputMode="decimal" className={cn(inputCls, "pe-14 font-mono text-lg")} value={dp} onChange={(e) => setDp(e.target.value)} aria-label="Differential pressure in bar" /><span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-muted">bar</span></div>
                <div className="min-w-48 flex-1">
                  <div className="relative h-3 rounded-full bg-hair">
                    <motion.span className="absolute top-1/2 size-5 -translate-y-1/2 rounded-full border-2 border-white bg-fg shadow" animate={{ left: `${Math.min(100, Math.max(0, (dpNum / 1.5) * 100))}%` }} transition={spring} />
                  </div>
                  <p className={cn("mt-2 text-xs font-semibold", dpIn ? "text-pass-fg" : "text-pending-fg")}>{dpIn ? "✓ In range" : "Outside placeholder range: confirm per procedure"}</p>
                </div>
              </div>
            </Section>

            <Section title={t("Sample jar photo (optional)")}>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-hair-strong bg-hi px-4 text-sm text-muted hover:text-fg">
                <Camera size={20} /> <span>Add photo (stays in your browser)</span>
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
              </label>
              {photo && (
                <div className="relative w-40 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="Sample jar preview" className="h-28 w-40 object-cover" />
                  <button type="button" onClick={() => setPhoto(null)} aria-label="Remove photo" className="absolute end-1 top-1 flex size-8 items-center justify-center rounded-full bg-black/60 text-white"><X size={14} /></button>
                </div>
              )}
            </Section>

            <AnimatePresence>
              {anyFail && (
                <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="space-y-3 rounded-2xl border border-fail/60 bg-fail/10 p-4">
                    <h3 className="flex items-center gap-2 font-display text-base font-semibold text-fail-fg"><OctagonAlert size={18} /> {t("Failure management")}</h3>
                    <p className="text-sm">On submit: <b>HOLD — Do not fuel</b> on {vehicle.id}, supervisor + QC manager notified. Chain: <b>Failed check → Re-sample → Authorised release</b> (release needs a supervisor signature). This result can never be overwritten.</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="block text-sm font-medium">Failure type
                        <select value={failType} onChange={(e) => setFailType(e.target.value)} className={cn(inputCls, "mt-1.5")}>
                          {["Visible water", "Sediment", "Haze / not clear", "CWD indicated water", "Microbial growth signs", "Other"].map((x) => <option key={x} className="text-black">{x}</option>)}
                        </select>
                      </label>
                      <fieldset><legend className="mb-1.5 text-sm font-medium">Immediate action</legend>
                        {["Isolate equipment / Do not use", "Report to QC", "Re-sample and re-test", "Notify maintenance"].map((x) => (
                          <label key={x} className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--teal)]" checked={!!acts[x]} onChange={(e) => setActs({ ...acts, [x]: e.target.checked })} />{x}</label>
                        ))}
                      </fieldset>
                    </div>
                    <label className="block text-sm font-medium">Observation / Remarks (mandatory) *
                      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Describe what was observed…" className={cn(inputCls, "mt-1.5 h-auto py-3")} />
                    </label>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            <Section title={`${t("Signature")} & ${t("PIN confirm")}`}>
              <SignBlock onReady={setSigned} />
            </Section>

          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}
