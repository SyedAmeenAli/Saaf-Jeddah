"use client";
import { CloudOff, HardHat, Nfc, ScanLine, ClipboardCheck, PenLine } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { Button, PageHeader, Rise, Stagger, StatusBadge } from "@/components/ui/Glass";
import { Photo } from "@/components/ui/Photo";
import { TruckSvg } from "@/components/illustrations/Vehicles";

const STEPS = [
  { i: Nfc, t: "Tap", d: "Operator taps the NFC tag fixed at the sampling point with an approved reader or phone." },
  { i: ScanLine, t: "Inspect", d: "The form opens pre-filled. Record VAC and CWD as pass or fail. Nothing is pre-selected." },
  { i: PenLine, t: "Sign", d: "Employee number, signature and PIN confirm. The record locks on submit." },
  { i: ClipboardCheck, t: "Verify", d: "Supervisor reviews, countersigns or returns. Managers see live dashboards and reports." },
];

export default function HardwarePage() {
  const t = useT();
  const offline = useStore((s) => s.offline);
  const queued = useStore((s) => s.queued);
  const toggle = useStore((s) => s.toggleOffline);
  return (
    <>
      <PageHeader title={t("Hardware & setup")} sub="How SAFAA is deployed on the apron." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Rise>
          <Photo crop="refuel" className="rounded-2xl border border-hair" scrim="from-[#050b18]/60 to-[#050b18]/90">
            <div className="p-6">
              <h2 className="mb-1 text-lg font-semibold">NFC tag + reader at the sampling point</h2>
              <p className="mb-4 text-sm text-muted">One passive tag per sampling point: 4 on a refueller, 2 on a hydrant dispenser.</p>
              <div className="relative mx-auto max-w-md"><TruckSvg className="w-full" />
                <span className="absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-teal bg-teal/20 text-teal" style={{ left: "74.5%", top: "81%" }}><Nfc size={16} strokeWidth={1.5} /></span></div>
              <ul className="mt-4 space-y-1.5 text-sm text-muted"><li>Tag read by an intrinsically safe phone or reader, selected for the site.</li><li>Tag ID is printed on a stainless plate with a QR code as a fallback.</li></ul>
            </div>
          </Photo>
        </Rise>
        <Rise>
          <div className="space-y-4">
            <div className="glass p-5" style={{ borderRadius: 16 }}>
              <div className="mb-2 flex items-center gap-3"><HardHat size={20} strokeWidth={1.5} className="text-pending-fg" /><h2 className="text-base font-semibold">Hazardous-zone requirement</h2></div>
              <p className="text-sm leading-relaxed text-muted">All hardware (phones, readers, tags and mounts) must be certified for the site&apos;s classified hazardous zone and verified with APSCO&apos;s HSE team and applicable Saudi regulatory requirements before use on the apron. This demo makes no certification claims for any device.</p>
            </div>
            <div className="glass p-5" style={{ borderRadius: 16 }}>
              <div className="mb-2 flex items-center gap-3"><CloudOff size={20} strokeWidth={1.5} className="text-info-fg" /><h2 className="text-base font-semibold">Offline-first sync</h2></div>
              <p className="text-sm text-muted">Apron coverage can be patchy. Checks are saved on the device and queued, then synced automatically when connectivity returns.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button onClick={toggle}>{offline ? "Go online (sync)" : "Go offline (demo)"}</Button>
                <StatusBadge kind={offline ? "pending" : "pass"}>{offline ? `Offline · ${queued} queued` : "Online · Synced"}</StatusBadge>
              </div>
              <p className="mt-2 text-xs text-faint">Go offline, submit a check from Sampling, then come back online to watch it sync.</p>
            </div>
          </div>
        </Rise>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-semibold">{t("How it works")}</h2>
      <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((s, i) => (
          <Rise key={s.t}>
            <div className="glass relative h-full p-5" style={{ borderRadius: 16 }}>
              <span className="absolute end-4 top-3 text-4xl font-semibold text-white/5" aria-hidden="true">{i + 1}</span>
              <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-teal/15 text-teal"><s.i size={20} strokeWidth={1.5} /></span>
              <h3 className="text-base font-semibold">{s.t}</h3><p className="mt-1 text-sm text-muted">{s.d}</p>
            </div>
          </Rise>
        ))}
      </Stagger>
    </>
  );
}
