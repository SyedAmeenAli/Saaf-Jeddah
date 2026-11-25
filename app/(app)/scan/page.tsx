"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Beaker, Check, Keyboard, Lock, QrCode, Radio } from "lucide-react";
import { useStore } from "@/lib/store";
import { useApplicable, useCan, useNow, useT } from "@/lib/hooks";
import { OCCASION_ORDER, OCCASIONS, POINTS, POINT_ORDER } from "@/lib/domain";
import type { OccasionId, PointId } from "@/lib/types";
import { Button, Chip, Field, PageHeader, StatusBadge, inputCls } from "@/components/ui/Glass";
import { Photo } from "@/components/ui/Photo";
import { NfcTag } from "@/components/illustrations/Doodles";
import { InspectionSheet } from "@/components/features/Inspection";
import { HoldBanner } from "@/components/features/Details";
import { cn } from "@/lib/utils";

type Phase = "ready" | "tapping" | "read";
type Mode = "nfc" | "barcode";

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

  const pool = useMemo(() => vehicles.filter((v) => active === "all" || v.locationId === active), [vehicles, active]);
  const initV = sp.get("v") ?? due[0]?.vehicleId ?? pool[0]?.id;
  const [vid, setVid] = useState(initV);
  const vehicle = vehicles.find((v) => v.id === vid) ?? vehicles[0];
  const [occ, setOcc] = useState<OccasionId>("start_shift");
  const applicable = useApplicable();
  const pts = applicable(occ, vehicle.type);
  const [pt, setPt] = useState<PointId>((sp.get("p") as PointId) || (due.find((d) => d.vehicleId === vid)?.point ?? "filter_sump"));
  const point: PointId = pts.includes(pt) ? pt : pts[0] ?? "filter_sump";
  const [phase, setPhase] = useState<Phase>("ready");
  const [mode, setMode] = useState<Mode>("nfc");
  const [sheet, setSheet] = useState(false);
  const [manual, setManual] = useState(false);
  const [tag, setTag] = useState("");
  const hold = holds.find((h) => h.vehicleId === vehicle.id && h.state !== "released");
  const canScan = can("sample") || can("verify");

  const tap = () => {
    if (!canScan || phase !== "ready" || !pts.length) return;
    setPhase("tapping");
    if (prefs.haptics && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(30);
    setTimeout(() => setPhase("read"), 1100);
    setTimeout(() => setSheet(true), 1900);
  };
  const manualGo = () => {
    const hit = Object.entries(vehicle.tags).find(([, v]) => v === tag.trim().toUpperCase());
    if (!hit) { toast("fail", "Tag ID not recognised for this vehicle"); return; }
    setPt(hit[0] as PointId); setManual(false); setPhase("read"); setTimeout(() => setSheet(true), 600);
  };

  const dueNow = due.filter((d) => active === "all" || d.locationId === active).sort((a, b) => a.dueTs - b.dueTs).slice(0, 6);
  const microAll = useStore((s) => s.micro);
  const nowT = useNow(60000);
  const microDue = microAll.filter((m) => m.status === "scheduled").length;
  const microOver = microAll.filter((m) => m.status === "scheduled" && m.dueTs < nowT).length;

  return (
    <>
      <PageHeader title={t("Scan & Inspect")} sub="Tap the NFC tag on the sampling point. The inspection form opens pre-filled." />
      {!canScan && (
        <div className="glass mb-4 flex items-center gap-3 p-4 text-sm" style={{ borderRadius: 16 }}><Lock size={18} className="text-pending-fg" /> {t("Read-only for this role")}. Switch to Operator or Supervisor to perform sampling.</div>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <div className="glass grid grid-cols-1 gap-4 p-5 md:grid-cols-3" style={{ borderRadius: 16 }}>
            <Field label={t("Vehicle")}>
              <select className={inputCls} value={vehicle.id} onChange={(e) => { setVid(e.target.value); setPhase("ready"); }}>
                {pool.map((v) => <option key={v.id} value={v.id} className="text-black">{v.id} · {v.locationId}</option>)}
              </select>
            </Field>
            <Field label="Sampling occasion">
              <select className={inputCls} value={occ} onChange={(e) => { setOcc(e.target.value as OccasionId); setPhase("ready"); }}>
                {OCCASION_ORDER.map((o) => <option key={o} value={o} className="text-black">{lang === "ar" ? OCCASIONS[o].labelAr : OCCASIONS[o].label}</option>)}
              </select>
            </Field>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-muted">{t("Sampling point")}</span>
              <div className="flex flex-wrap gap-2">
                {pts.length === 0 && <span className="text-sm text-pending-fg">{t("Not applicable")} for {vehicle.type}</span>}
                {POINT_ORDER.filter((p) => pts.includes(p)).map((p) => <Chip key={p} active={p === point} onClick={() => { setPt(p); setPhase("ready"); }}>{lang === "ar" ? POINTS[p].labelAr : POINTS[p].label}</Chip>)}
              </div>
            </div>
          </div>

          {hold && <HoldBanner vehicleId={vehicle.id} />}

          {/* Scan stage over the apron photograph */}
          <Photo crop="truck" className="rounded-2xl border border-hair" scrim="from-[#050b18]/55 via-[#050b18]/60 to-[#050b18]/85">
            <div className="flex flex-col items-center gap-5 px-4 py-8 md:py-10">
              <h2 className="text-xl font-semibold">Scan Sampling Point</h2>
              <p className="-mt-3 text-sm text-muted">{mode === "nfc" ? "Tap the NFC tag at the sampling point" : "Align the barcode with the frame"}</p>

              <div className="relative flex size-52 items-center justify-center">
                {mode === "nfc" ? (
                  <>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="absolute size-40 rounded-full border border-teal/60" style={{ animation: `ripple ${phase === "tapping" ? 0.9 : 2.8}s ease-out ${i * (phase === "tapping" ? 0.18 : 0.9)}s infinite` }} />
                    ))}
                    <motion.div animate={phase === "tapping" ? { scale: [1, 0.94, 1] } : {}} transition={{ duration: 0.5 }}
                      className={cn("glass glass-strong relative flex size-28 items-center justify-center", phase === "read" && "!border-pass")} style={{ borderRadius: 24 }}>
                      {phase === "read" ? (
                        <svg viewBox="0 0 24 24" className="size-12 text-pass-fg" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><motion.path d="M5 12.5l4.5 4.5L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} /></svg>
                      ) : <NfcTag className="size-14 text-teal" />}
                    </motion.div>
                  </>
                ) : (
                  <div className="relative size-44 rounded-2xl">
                    {["start-0 top-0 border-s-2 border-t-2 rounded-tl-xl", "end-0 top-0 border-e-2 border-t-2 rounded-tr-xl", "start-0 bottom-0 border-s-2 border-b-2 rounded-bl-xl", "end-0 bottom-0 border-e-2 border-b-2 rounded-br-xl"].map((c) => <span key={c} className={cn("absolute size-8 border-teal", c)} />)}
                    <QrCode size={64} strokeWidth={1} className="absolute inset-0 m-auto text-white/40" />
                    <span className="absolute inset-x-3 h-0.5 bg-teal shadow-[0_0_12px_var(--teal)]" style={{ animation: "scanline 1.8s ease-in-out infinite alternate" }} />
                  </div>
                )}
              </div>

              <div className="text-center text-sm">
                <p className="font-medium">{vehicle.id} · {lang === "ar" ? POINTS[point].labelAr : POINTS[point].label}</p>
                <p className="font-mono text-xs text-muted">{vehicle.tags[point]}</p>
                {phase === "read" && <p className="mt-2 flex items-center justify-center gap-1.5 text-pass-fg"><Check size={14} /> {t("Tag read")}</p>}
              </div>

              <div className="flex rounded-xl bg-white/5 p-1" role="group" aria-label="Scan mode">
                {([["barcode", "Scan Barcode", QrCode], ["nfc", "Tap NFC", Radio]] as const).map(([m, l, I]) => (
                  <button key={m} aria-pressed={mode === m} onClick={() => { setMode(m); setPhase("ready"); }} className={cn("flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium", mode === m ? "bg-teal/20 text-teal" : "text-muted")}><I size={16} strokeWidth={1.5} />{l}</button>
                ))}
              </div>
              <Button variant="primary" size="lg" onClick={tap} disabled={!canScan || phase !== "ready" || !pts.length} className="min-w-52">
                {mode === "nfc" ? t("Simulate tap") : "Simulate scan"}
              </Button>
              <button onClick={() => setManual(!manual)} className="flex items-center gap-2 text-sm text-muted hover:text-fg"><Keyboard size={16} strokeWidth={1.5} /> Enter tag ID manually</button>
              {manual && (
                <div className="flex w-full max-w-sm gap-2">
                  <input className={cn(inputCls, "font-mono")} value={tag} onChange={(e) => setTag(e.target.value)} placeholder={vehicle.tags[point]} aria-label="Tag ID" />
                  <Button onClick={manualGo}>Go</Button>
                </div>
              )}
            </div>
          </Photo>
        </div>

        <aside className="space-y-4">
          <div className="glass p-5" style={{ borderRadius: 16 }}>
            <h3 className="mb-3 text-base font-semibold">{t("Samples due")}</h3>
            <ul className="space-y-2">
              {dueNow.length === 0 && <li className="text-sm text-muted">{t("All clear")}</li>}
              {dueNow.map((d) => (
                <li key={d.id}>
                  <button onClick={() => { setVid(d.vehicleId); setPt(d.point); setOcc(d.occasion); setPhase("ready"); }}
                    className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start", vehicle.id === d.vehicleId && point === d.point ? "bg-teal/15" : "bg-white/5 hover:bg-white/10")}>
                    <span className="font-mono text-sm font-medium">{d.vehicleId}</span>
                    <span className="flex-1 text-xs text-muted">{POINTS[d.point].label}</span>
                    <StatusBadge kind={d.state === "overdue" ? "fail" : "pending"}>{d.state === "overdue" ? t("Overdue") : "Due"}</StatusBadge>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Microbial monitoring: its own module with its own sample records */}
          <Link href="/microbial" className="glass sheen hover-glow block p-5" style={{ borderRadius: 20 }}>
            <div className="mb-2 flex items-center gap-2"><Beaker size={18} strokeWidth={1.5} className="text-info-fg" /><h3 className="text-base font-semibold">{t("Microbial monitoring")}</h3></div>
            <p className="text-xs text-muted">A separate scheduled programme with its own sample records. It is not part of the visual check.</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white/5 p-3"><dt className="text-xs text-muted">To collect</dt><dd className="font-medium">{microDue}</dd></div>
              <div className="rounded-xl bg-white/5 p-3"><dt className="text-xs text-muted">Overdue</dt><dd className="font-medium">{microOver}</dd></div>
            </dl>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-teal">Open microbial monitoring →</span>
          </Link>
        </aside>
      </div>

      <InspectionSheet open={sheet} onClose={() => { setSheet(false); setPhase("ready"); }} onDone={() => setPhase("ready")} vehicle={vehicle} point={point} occasion={occ} />
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
