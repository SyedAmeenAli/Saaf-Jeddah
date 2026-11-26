"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Beaker, Check, ChevronRight, CircleHelp, Keyboard, Lock, Nfc, Pencil, QrCode, Radio, ScanLine, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { useApplicable, useCan, useNow, useT } from "@/lib/hooks";
import { OCCASION_ORDER, OCCASIONS, POINTS, POINT_ORDER } from "@/lib/domain";
import type { OccasionId, PointId } from "@/lib/types";
import { Button, PageHeader, StatusBadge, inputCls } from "@/components/ui/Glass";
import { VehicleArt } from "@/components/illustrations/VehicleArt";
import { InspectionSheet } from "@/components/features/Inspection";
import { HoldBanner } from "@/components/features/Details";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { T } from "@/components/ui/T";

type Phase = "ready" | "scanning" | "detected" | "unknown";
type Mode = "nfc" | "barcode";

function StepShell({ n, title, done, active, summary, onEdit, children }: { n: number; title: string; done: boolean; active: boolean; summary?: React.ReactNode; onEdit?: () => void; children?: React.ReactNode }) {
  return (
    <motion.section layout transition={spring} className={cn("glass overflow-hidden", active && "ring-1 ring-teal/50")} style={{ borderRadius: 20 }} aria-current={active ? "step" : undefined}>
      <header className="flex items-center gap-3 px-4 py-3.5">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold", done ? "bg-pass text-white" : active ? "bg-teal/25 text-teal" : "bg-white/10 text-muted")}>{done ? <Check size={14} /> : n}</span>
        <h2 className={cn("flex-1 text-sm font-semibold", !done && !active && "text-muted")}>{title}</h2>
        {done && !active && summary && <span className="min-w-0 truncate text-sm text-muted">{summary}</span>}
        {done && !active && onEdit && <button onClick={onEdit} aria-label="Edit" className="flex size-9 items-center justify-center rounded-full bg-white/5 text-muted hover:text-fg"><Pencil size={14} /></button>}
      </header>
      <AnimatePresence initial={false}>
        {active && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden"><div className="px-4 pb-4">{children}</div></motion.div>}
      </AnimatePresence>
    </motion.section>
  );
}

function ScanInner() {
  const t = useT();
  const can = useCan();
  const sp = useSearchParams();
  const vehicles = useStore((s) => s.vehicles);
  const due = useStore((s) => s.due);
  const holds = useStore((s) => s.holds);
  const active = useStore((s) => s.activeLocation);
  const lang = useStore((s) => s.lang);
  const toast = useStore((s) => s.toast);
  const prefs = useStore((s) => s.prefs);
  const applicable = useApplicable();

  const pool = useMemo(() => vehicles.filter((v) => active === "all" || v.locationId === active), [vehicles, active]);
  const qv = sp.get("v");
  const qp = sp.get("p") as PointId | null;
  const [vid, setVid] = useState<string | null>(qv);
  const [occ, setOcc] = useState<OccasionId | null>(qv ? "start_shift" : null);
  const [pt, setPt] = useState<PointId | null>(qp);
  const [step, setStep] = useState(qv && qp ? 3 : qv ? 1 : 0);
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const [mode, setMode] = useState<Mode>("nfc");
  const [sheet, setSheet] = useState(false);
  const [manual, setManual] = useState(false);
  const [tag, setTag] = useState("");

  const vehicle = vehicles.find((v) => v.id === vid) ?? null;
  const hold = vehicle ? holds.find((h) => h.vehicleId === vehicle.id && h.state !== "released") : undefined;
  const canScan = can("sample") || can("verify");
  const occasions = vehicle ? OCCASION_ORDER.filter((o) => applicable(o, vehicle.type).length > 0) : [];
  const pts = vehicle && occ ? applicable(occ, vehicle.type) : [];
  const point: PointId | null = pt && pts.includes(pt) ? pt : null;

  const dueNow = due.filter((d) => active === "all" || d.locationId === active).sort((a, b) => a.dueTs - b.dueTs).slice(0, 6);
  const dueIds = new Set(dueNow.map((d) => d.vehicleId));
  const matches = pool.filter((v) => v.id.toLowerCase().includes(q.toLowerCase()) || v.plate.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(dueIds.has(b.id)) - Number(dueIds.has(a.id)) || a.id.localeCompare(b.id)).slice(0, 8);
  const microAll = useStore((s) => s.micro);
  const nowT = useNow(60000);
  const microDue = microAll.filter((m) => m.status === "scheduled").length;
  const microOver = microAll.filter((m) => m.status === "scheduled" && m.dueTs < nowT).length;

  const pickVehicle = (id: string) => { setVid(id); setOcc(null); setPt(null); setPhase("ready"); setStep(1); };
  const pickOcc = (o: OccasionId) => { setOcc(o); setPt(null); setPhase("ready"); const n = vehicle ? applicable(o, vehicle.type) : []; if (n.length === 1) { setPt(n[0]); setStep(3); } else setStep(2); };
  const pickPoint = (p: PointId) => { setPt(p); setPhase("ready"); setStep(3); };
  const jumpDue = (d: (typeof dueNow)[number]) => { setVid(d.vehicleId); setOcc(d.occasion); setPt(d.point); setPhase("ready"); setStep(3); };

  const finishRead = (p: PointId) => {
    setPt(p); setManual(false); setPhase("detected");
    if (prefs.haptics && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(30);
    setTimeout(() => setSheet(true), 900);
  };
  const simulate = (unknown = false) => {
    if (!canScan || !point || phase === "scanning") return;
    setPhase("scanning");
    setTimeout(() => (unknown ? setPhase("unknown") : finishRead(point)), 1200);
  };
  const manualGo = () => {
    if (!vehicle) return;
    const hit = Object.entries(vehicle.tags).find(([, v]) => v === tag.trim().toUpperCase());
    if (!hit) { setPhase("unknown"); toast("fail", "Tag ID not recognised for this vehicle"); return; }
    finishRead(hit[0] as PointId);
  };

  const pl = (p: PointId) => (lang === "ar" ? POINTS[p].labelAr : POINTS[p].label);
  const ol = (o: OccasionId) => (lang === "ar" ? OCCASIONS[o].labelAr : OCCASIONS[o].label);

  const phaseMeta: Record<Phase, { label: string; cls: string }> = {
    ready: { label: "Ready", cls: "text-muted" },
    scanning: { label: "Scanning…", cls: "text-info-fg" },
    detected: { label: "Tag detected", cls: "text-pass-fg" },
    unknown: { label: "Unknown tag", cls: "text-fail-fg" },
  };

  return (
    <>
      <PageHeader title={t("Scan & Inspect")} sub="Identify the equipment, choose the occasion, pick the point, then scan its tag." />
      {!canScan && (
        <div className="glass mb-4 flex items-center gap-3 p-4 text-sm" style={{ borderRadius: 16 }}><Lock size={18} className="text-pending-fg" /> {t("Read-only for this role")}. Switch to Operator or Supervisor to perform sampling.</div>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          {hold && vehicle && <HoldBanner vehicleId={vehicle.id} />}

          {/* 1. Equipment */}
          <StepShell n={1} title={t("Identify equipment")} done={!!vehicle} active={step === 0} onEdit={() => setStep(0)}
            summary={vehicle && <span className="font-mono">{vehicle.id} · {vehicle.locationId}</span>}>
            <div className="relative mb-3">
              <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className={cn(inputCls, "ps-9")} value={q} onChange={(e) => setQ(e.target.value)} placeholder="REF-014, plate…" aria-label={t("Search")} />
            </div>
            <ul className="space-y-2">
              {matches.length === 0 && <li className="py-3 text-center text-sm text-muted">{t("No vehicles match.")}</li>}
              {matches.map((v) => (
                <li key={v.id}>
                  <button onClick={() => pickVehicle(v.id)} className={cn("flex w-full items-center gap-3 rounded-2xl bg-white/5 p-2 pe-3 text-start hover:bg-white/10", v.id === vid && "ring-1 ring-teal/60")}>
                    <VehicleArt type={v.type} className="size-12 shrink-0 rounded-xl" art="h-full w-[92%]" />
                    <span className="min-w-0 flex-1"><span className="block font-mono text-sm font-semibold">{v.id}</span><span className="block truncate text-xs text-muted">{v.type === "refueller" ? t("Refueller") : t("Hydrant dispenser")} · {v.locationId}</span></span>
                    {dueIds.has(v.id) && <StatusBadge kind="pending">{t("Due")}</StatusBadge>}
                    <ChevronRight size={16} className="text-muted rtl:rotate-180" />
                  </button>
                </li>
              ))}
            </ul>
          </StepShell>

          {/* 2. Occasion */}
          <StepShell n={2} title={t("Sampling occasion")} done={!!occ && step > 1} active={step === 1 && !!vehicle} onEdit={() => setStep(1)} summary={occ && ol(occ)}>
            <p className="mb-3 text-xs text-muted"><T>{"Only occasions approved for this equipment and point are shown."}</T></p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {occasions.map((o) => (
                <button key={o} onClick={() => pickOcc(o)} className={cn("flex items-center justify-between gap-2 rounded-2xl bg-white/5 px-4 py-3 text-start text-sm font-medium hover:bg-white/10", o === occ && "ring-1 ring-teal/60")}>
                  {ol(o)}<span className="text-xs text-muted">{vehicle ? applicable(o, vehicle.type).length : 0} {t("points")}</span>
                </button>
              ))}
            </div>
          </StepShell>

          {/* 3. Point */}
          <StepShell n={3} title={t("Sampling point")} done={!!point && step > 2} active={step === 2 && !!occ} onEdit={() => setStep(2)} summary={point && pl(point)}>
            <p className="mb-3 text-xs text-muted">{vehicle?.type === "dispenser" ? t("Tank sump and tank drain do not apply to hydrant dispensers.") : t("Tap the point you are sampling.")}</p>
            <div className="grid grid-cols-2 gap-2">
              {POINT_ORDER.filter((p) => pts.includes(p)).map((p, i) => (
                <button key={p} onClick={() => pickPoint(p)} className={cn("flex flex-col items-start gap-2 rounded-2xl bg-white/5 p-3 text-start hover:bg-white/10", p === point && "ring-1 ring-teal/60")}>
                  <span className="flex size-8 items-center justify-center rounded-full bg-teal/20 font-display text-sm font-semibold text-teal">{i + 1}</span>
                  <span className="text-sm font-medium leading-tight">{pl(p)}</span>
                  <span className="font-mono text-[11px] text-muted">{vehicle?.tags[p]}</span>
                </button>
              ))}
            </div>
          </StepShell>

          {/* 4. Scan */}
          <StepShell n={4} title={t("Scan tag")} done={phase === "detected"} active={step === 3 && !!point}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pending/20 px-2.5 py-1 text-[11px] font-medium text-pending-fg"><CircleHelp size={12} /> {t("Simulated scan (demo)")}</span>
              <div className="flex rounded-xl bg-white/5 p-1" role="group" aria-label="Scan mode">
                {([["nfc", "NFC", Radio], ["barcode", "QR / Barcode", QrCode]] as const).map(([m, l, I]) => (
                  <button key={m} aria-pressed={mode === m} onClick={() => { setMode(m); setPhase("ready"); }} className={cn("flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium", mode === m ? "bg-teal/20 text-teal" : "text-muted")}><I size={14} strokeWidth={1.5} />{l}</button>
                ))}
              </div>
            </div>

            <div className="relative flex flex-col items-center gap-3 rounded-2xl bg-black/25 px-4 py-6">
              <div className="relative flex size-44 items-center justify-center">
                {mode === "nfc" ? (
                  <>
                    {[0, 1, 2].map((i) => <span key={i} className={cn("absolute size-36 rounded-full border", phase === "unknown" ? "border-fail/60" : phase === "detected" ? "border-pass/60" : "border-teal/60")} style={{ animation: phase === "detected" || phase === "unknown" ? "none" : `ripple ${phase === "scanning" ? 0.9 : 2.8}s ease-out ${i * (phase === "scanning" ? 0.18 : 0.9)}s infinite` }} />)}
                    <div className={cn("glass glass-strong relative flex size-24 items-center justify-center", phase === "detected" && "!border-pass", phase === "unknown" && "!border-fail")} style={{ borderRadius: 24 }}>
                      {phase === "detected" ? <Check size={40} className="text-pass-fg" strokeWidth={2.4} /> : phase === "unknown" ? <CircleHelp size={40} className="text-fail-fg" /> : <Nfc size={40} className="text-teal" strokeWidth={1.5} />}
                    </div>
                  </>
                ) : (
                  <div className="relative size-40">
                    {["start-0 top-0 border-s-2 border-t-2 rounded-tl-xl", "end-0 top-0 border-e-2 border-t-2 rounded-tr-xl", "start-0 bottom-0 border-s-2 border-b-2 rounded-bl-xl", "end-0 bottom-0 border-e-2 border-b-2 rounded-br-xl"].map((c) => <span key={c} className={cn("absolute size-8", phase === "unknown" ? "border-fail" : phase === "detected" ? "border-pass" : "border-teal", c)} />)}
                    <QrCode size={56} strokeWidth={1} className="absolute inset-0 m-auto text-white/40" />
                    {phase === "scanning" && <span className="absolute inset-x-3 h-0.5 bg-teal shadow-[0_0_12px_var(--teal)]" style={{ animation: "scanline 1.2s ease-in-out infinite alternate" }} />}
                  </div>
                )}
              </div>
              <p className={cn("text-sm font-semibold", phaseMeta[phase].cls)} role="status" aria-live="polite">{t(phaseMeta[phase].label)}</p>
              <p className="text-center text-xs text-muted">
                {phase === "unknown" ? t("This tag does not belong to the selected point. Check the plate or enter the ID manually.") : phase === "detected" ? `${vehicle?.id} · ${point ? pl(point) : ""}` : point ? `${vehicle?.id} · ${pl(point)} · ${vehicle?.tags[point]}` : ""}
              </p>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" size="lg" className="flex-1" onClick={() => simulate(false)} disabled={!canScan || phase === "scanning" || phase === "detected"}><ScanLine size={18} /> {mode === "nfc" ? t("Simulate tap") : t("Simulate scan")}</Button>
              <Button variant="secondary" size="lg" onClick={() => simulate(true)} disabled={!canScan || phase === "scanning" || phase === "detected"}>{t("Simulate unknown tag")}</Button>
            </div>
            <button onClick={() => setManual(!manual)} className="mt-3 flex items-center gap-2 text-sm text-muted hover:text-fg"><Keyboard size={16} strokeWidth={1.5} /> <T>{"Enter tag ID manually"}</T></button>
            {manual && (
              <div className="mt-2 flex gap-2">
                <input className={cn(inputCls, "font-mono")} value={tag} onChange={(e) => setTag(e.target.value)} placeholder={point ? vehicle?.tags[point] : ""} aria-label="Tag ID" />
                <Button onClick={manualGo}>{t("Go")}</Button>
              </div>
            )}
          </StepShell>
        </div>

        <aside className="space-y-4">
          <div className="glass p-5" style={{ borderRadius: 16 }}>
            <h3 className="mb-3 text-base font-semibold">{t("Samples due")}</h3>
            <ul className="space-y-2">
              {dueNow.length === 0 && <li className="text-sm text-muted">{t("All clear")}</li>}
              {dueNow.map((d) => (
                <li key={d.id}>
                  <button onClick={() => jumpDue(d)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start", vid === d.vehicleId && pt === d.point ? "bg-teal/15" : "bg-white/5 hover:bg-white/10")}>
                    <span className="font-mono text-sm font-medium">{d.vehicleId}</span>
                    <span className="flex-1 text-xs text-muted">{POINTS[d.point].label}</span>
                    <StatusBadge kind={d.state === "overdue" ? "fail" : "pending"}>{d.state === "overdue" ? t("Overdue") : t("Due")}</StatusBadge>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/microbial" className="glass sheen hover-glow block p-5" style={{ borderRadius: 20 }}>
            <div className="mb-2 flex items-center gap-2"><Beaker size={18} strokeWidth={1.5} className="text-info-fg" /><h3 className="text-base font-semibold">{t("Microbial monitoring")}</h3></div>
            <p className="text-xs text-muted"><T>{"A separate scheduled programme with its own sample records. It is not part of the visual check."}</T></p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white/5 p-3"><dt className="text-xs text-muted"><T>{"To collect"}</T></dt><dd className="font-medium">{microDue}</dd></div>
              <div className="rounded-xl bg-white/5 p-3"><dt className="text-xs text-muted"><T>{"Overdue"}</T></dt><dd className="font-medium">{microOver}</dd></div>
            </dl>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal"><T>{"Open microbial monitoring →"}</T></span>
          </Link>
        </aside>
      </div>

      {vehicle && point && occ && (
        <InspectionSheet open={sheet} onClose={() => { setSheet(false); setPhase("ready"); }} onDone={() => { setPhase("ready"); setStep(0); setVid(null); setOcc(null); setPt(null); }} vehicle={vehicle} point={point} occasion={occ} />
      )}
    </>
  );
}

function Keyed() {
  const sp = useSearchParams();
  return <ScanInner key={`${sp.get("v")}|${sp.get("p")}`} />;
}

export default function ScanPage() {
  return <Suspense fallback={null}><Keyed /></Suspense>;
}
