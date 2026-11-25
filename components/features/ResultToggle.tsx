"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { T } from "@/components/ui/T";

type V = "pass" | "fail" | null;

function Burst() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <motion.span key={i} className="pointer-events-none absolute left-1/2 top-1/2 size-1.5 rounded-full bg-pass"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(a) * 26, y: Math.sin(a) * 26, opacity: 0, scale: 0.3 }} transition={{ duration: 0.55, ease: "easeOut" }} />
        );
      })}
    </>
  );
}

/** ✓ / ✕ toggle. Never pre-selected. ✓ draws a tick with a small burst; ✕ shakes and flashes red. */
export function ResultToggle({ value, onChange, label, passHint, failHint, notDone = false }: {
  value: V | "na"; onChange: (v: "pass" | "fail" | "na") => void; label: string; passHint?: string; failHint?: string; notDone?: boolean;
}) {
  const [n, setN] = useState(0);
  const pick = (v: "pass" | "fail" | "na") => { setN((x) => x + 1); onChange(v); };
  return (
    <div className={cn("rounded-2xl border p-3 transition-colors", value === "fail" ? "border-fail/60 bg-fail/10" : value === "pass" ? "border-pass/40 bg-pass/5" : "border-hair bg-hi")} role="group" aria-label={label}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {value === null && <span className="text-xs text-pending-fg"><T>{"Required"}</T></span>}
      </div>
      <div className={cn("grid gap-2", notDone ? "grid-cols-3" : "grid-cols-2")}>
        <button type="button" aria-pressed={value === "pass"} onClick={() => pick("pass")}
          className={cn("relative flex h-14 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors", value === "pass" ? "border-pass bg-pass/25 text-pass-fg" : "border-hair-strong hover:bg-hi")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {value === "pass" ? <motion.path key={n} d="M5 12.5l4.5 4.5L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} /> : <path d="M5 12.5l4.5 4.5L19 7" opacity=".35" />}
          </svg>
          <span>{passHint ?? "Pass"}</span>
          {value === "pass" && <Burst key={`b${n}`} />}
        </button>
        <motion.button type="button" aria-pressed={value === "fail"} onClick={() => pick("fail")}
          key={value === "fail" ? `f${n}` : "f"}
          animate={value === "fail" ? { x: [0, -6, 5, -4, 3, 0], boxShadow: ["0 0 0 0 rgba(255,107,107,.8)", "0 0 28px 4px rgba(255,107,107,.55)", "0 0 0 0 rgba(255,107,107,0)"] } : {}}
          transition={{ duration: 0.5 }}
          className={cn("flex h-14 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors", value === "fail" ? "border-fail bg-fail/25 text-fail-fg" : "border-hair-strong hover:bg-hi")}>
          <X size={22} strokeWidth={3.2} className={value === "fail" ? "" : "opacity-35"} />
          <span>{failHint ?? "Fail"}</span>
        </motion.button>
        {notDone && (
          <button type="button" aria-pressed={value === "na"} onClick={() => pick("na")}
            className={cn("flex h-14 items-center justify-center rounded-xl border text-sm font-semibold", value === "na" ? "border-info bg-info/20 text-info-fg" : "border-hair-strong hover:bg-hi")}>
            Not done
          </button>
        )}
      </div>
    </div>
  );
}

export function ColorSwatchSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = [["water-white", "Water-white", "#f6fbff"], ["straw", "Straw", "#f3d97a"], ["other", "Other", "#c58a4a"]] as const;
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Colour">
      {opts.map(([v, l, c]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={cn("flex h-14 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-semibold", value === v ? "border-teal bg-teal/15" : "border-hair-strong")}>
          <motion.span animate={{ scale: value === v ? 1.15 : 1 }} transition={spring} className="size-4 rounded-full border border-black/20" style={{ background: c }} />
          {l}
        </button>
      ))}
    </div>
  );
}
