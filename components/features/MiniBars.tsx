"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BarRow { label: string; value: number; max?: number; display?: string; sub?: string; color?: string }

/** Animated horizontal bars. `value` is compared to `max` (default: largest row). */
export function MiniBars({ rows, className }: { rows: BarRow[]; className?: string }) {
  const m = Math.max(1e-9, ...rows.map((r) => r.max ?? r.value));
  return (
    <ul className={cn("space-y-3", className)}>
      {rows.map((r, i) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="tnum shrink-0 font-medium">{r.display ?? r.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full" style={{ background: r.color ?? "linear-gradient(90deg,#b58aff,#d7bcff)" }}
              initial={{ width: 0 }} animate={{ width: `${Math.min(100, (r.value / (r.max ?? m)) * 100)}%` }} transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          {r.sub && <p className="mt-1 text-xs text-faint">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Stacked proportion bar with legend. */
export function StackBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = Math.max(1, parts.reduce((a, p) => a + p.value, 0));
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
        {parts.map((p) => <motion.div key={p.label} title={`${p.label}: ${p.value}`} initial={{ width: 0 }} animate={{ width: `${(p.value / total) * 100}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} style={{ background: p.color }} />)}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {parts.map((p) => <li key={p.label} className="flex items-center gap-2"><i className="size-2 rounded-full" style={{ background: p.color }} /><span className="text-muted">{p.label}</span><b className="ms-auto tnum">{p.value}</b></li>)}
      </ul>
    </div>
  );
}
