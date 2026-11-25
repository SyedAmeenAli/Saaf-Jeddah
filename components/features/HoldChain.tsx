"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, CircleDashed, FlaskConical, OctagonAlert, ShieldCheck, Lock } from "lucide-react";
import type { Hold } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useCan, useT } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { cn, fmtDT } from "@/lib/utils";
import { Button } from "@/components/ui/Glass";
import { SignModal } from "./Sign";
import { spring } from "@/lib/motion";
import { T } from "@/components/ui/T";

/** Failed check → Re-sample → Authorised release, as three separate linked events. */
export function HoldChain({ hold }: { hold: Hold }) {
  const can = useCan();
  const release = useStore((s) => s.releaseHold);
  const t = useT();
  const [sign, setSign] = useState(false);
  const fail = hold.events.filter((e) => e.type === "fail");
  const rs = hold.events.find((e) => e.type === "resample");
  const rel = hold.events.find((e) => e.type === "release");
  const steps = [
    { key: "fail", title: t("Failed check"), icon: OctagonAlert, done: true, ev: fail[fail.length - 1], tone: "fail" as const, note: hold.reason },
    { key: "rs", title: t("Re-sample"), icon: FlaskConical, done: !!rs, ev: rs, tone: "pass" as const, note: rs?.note ?? "Take a NEW linked sample. The failed result stays on record." },
    { key: "rel", title: t("Authorised release"), icon: ShieldCheck, done: !!rel, ev: rel, tone: "pass" as const, note: rel?.note ?? "Supervisor action with signature." },
  ];
  return (
    <div>
      <ol className="relative space-y-4 ps-2">
        <span className="absolute bottom-6 start-[1.6rem] top-6 w-px bg-hair-strong" aria-hidden="true" />
        {steps.map((s, i) => {
          const I = s.done ? s.icon : CircleDashed;
          return (
            <motion.li key={s.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: i * 0.08 }} className="relative flex gap-3">
              <span className={cn("relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border", s.done ? (s.tone === "fail" ? "border-fail/60 bg-fail/20 text-fail-fg" : "border-pass/60 bg-pass/20 text-pass-fg") : "border-hair-strong bg-hi text-faint")}>
                <I size={18} />
              </span>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-x-3 text-sm">
                  <span className="font-semibold">{s.title}</span>
                  {s.ev && <span className="text-xs text-muted">{fmtDT(s.ev.ts)} · {s.ev.actor}</span>}
                </div>
                <p className="text-sm text-muted">{s.note}</p>
                {fail.length > 1 && s.key === "fail" && <p className="text-xs text-fail-fg">{fail.length} failed attempts on record (each superseded by a new linked sample)</p>}
              </div>
            </motion.li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {hold.state === "hold" && (can("sample") || can("verify")) && (
          <Link href={`/scan?v=${hold.vehicleId}&p=${hold.point}`}>
            <Button variant="primary"><FlaskConical size={16} /> Start re-sample ({POINTS[hold.point].label})</Button>
          </Link>
        )}
        {hold.state === "hold" && !(can("sample") || can("verify")) && <p className="text-sm text-muted"><T>{"Waiting for an operator to take a linked re-sample."}</T></p>}
        {hold.state === "resampled" && can("release") && <Button variant="primary" onClick={() => setSign(true)}><ShieldCheck size={16} /> {t("Release")} (sign)</Button>}
        {hold.state === "resampled" && !can("release") && <p className="text-sm text-pending-fg"><T>{"Re-sample passed. Release requires a Supervisor signature."}</T></p>}
        {hold.state === "released" && <p className="inline-flex items-center gap-2 text-sm text-pass-fg"><Check size={16} /> <T>{"Released. Chain closed."}</T> <Lock size={14} /></p>}
      </div>
      <SignModal open={sign} onClose={() => setSign(false)} title="Authorised release" confirmLabel={`${hold.vehicleId}: release for fuelling`} onConfirm={() => release(hold.id)}>
        <p className="text-sm text-muted">{hold.vehicleId} · {POINTS[hold.point].label}. Confirm the re-sample passed and countersign to lift the HOLD.</p>
      </SignModal>
    </div>
  );
}
