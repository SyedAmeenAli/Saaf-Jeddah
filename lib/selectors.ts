"use client";
import { useMemo } from "react";
import { useStore } from "./store";
import { DAY, startOfDay } from "./utils";
import type { Check, DueItem, Hold, Vehicle } from "./types";

export function useScoped() {
  const loc = useStore((s) => s.activeLocation);
  const checks = useStore((s) => s.checks);
  const due = useStore((s) => s.due);
  const vehicles = useStore((s) => s.vehicles);
  const holds = useStore((s) => s.holds);
  return useMemo(() => {
    const f = <T extends { locationId: string }>(a: T[]) => (loc === "all" ? a : a.filter((x) => x.locationId === loc));
    return { checks: f(checks), due: f(due), vehicles: f(vehicles), holds: f(holds), loc };
  }, [loc, checks, due, vehicles, holds]);
}

export interface Kpis {
  today: Check[]; completed: number; passed: number; failed: number; dueN: number; overdue: number; expected: number; pct: number; passRate: number;
}
export function kpis(checks: Check[], due: DueItem[]): Kpis {
  const s = startOfDay(Date.now());
  const today = checks.filter((c) => c.ts >= s);
  const passed = today.filter((c) => c.result === "pass").length;
  const failed = today.length - passed;
  const dueN = due.filter((d) => d.state === "due").length;
  const overdue = due.filter((d) => d.state === "overdue").length;
  const expected = today.length + dueN + overdue;
  return { today, completed: today.length, passed, failed, dueN, overdue, expected, pct: expected ? today.length / expected : 1, passRate: today.length ? passed / today.length : 1 };
}

export function trend(checks: Check[]) {
  const now = Date.now();
  return Array.from({ length: 7 }, (_, k) => {
    const i = 6 - k;
    const s = startOfDay(now - i * DAY), e = s + DAY;
    const cs = checks.filter((c) => c.ts >= s && c.ts < e);
    const fail = cs.filter((c) => c.result === "fail").length;
    return { day: new Date(s).toLocaleDateString("en-GB", { weekday: "short" }), pass: cs.length - fail, fail, total: cs.length };
  });
}

export function vehicleStatus(v: Vehicle, holds: Hold[], due: DueItem[], checks: Check[]): "hold" | "overdue" | "due" | "pending" | "ok" {
  const h = holds.find((x) => x.vehicleId === v.id && x.state !== "released");
  if (h) return "hold";
  const d = due.filter((x) => x.vehicleId === v.id);
  if (d.some((x) => x.state === "overdue")) return "overdue";
  if (d.length) return "due";
  if (checks.some((c) => c.vehicleId === v.id && c.status === "awaiting")) return "pending";
  return "ok";
}

/** N-day pass/fail series. The seed holds 7 real days; older days are deterministic illustrative values. */
export function trendN(checks: Check[], days: number) {
  const now = Date.now();
  const real = trend(checks);
  const avg = real.reduce((a, r) => a + r.total, 0) / Math.max(1, real.length) || 80;
  const failRate = real.reduce((a, r) => a + r.fail, 0) / Math.max(1, real.reduce((a, r) => a + r.total, 0)) || 0.03;
  return Array.from({ length: days }, (_, k) => {
    const i = days - 1 - k;
    if (i < 7) { const r = real[6 - i]; return { ...r, day: days > 14 ? new Date(now - i * DAY).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : r.day }; }
    const w = Math.sin(i * 1.7) * 0.12 + Math.cos(i * 0.6) * 0.08;
    const total = Math.round(avg * (0.92 + w));
    const fail = Math.max(0, Math.round(total * failRate * (1 + Math.sin(i * 2.3) * 0.8)));
    return { day: new Date(now - i * DAY).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), pass: total - fail, fail, total };
  });
}
