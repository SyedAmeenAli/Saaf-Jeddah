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
