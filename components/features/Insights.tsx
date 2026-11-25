"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useScoped, vehicleStatus } from "@/lib/selectors";
import { useNow } from "@/lib/hooks";
import { OCCASIONS, OCCASION_ORDER } from "@/lib/domain";
import { DAY, startOfDay } from "@/lib/utils";
import { MiniBars, StackBar } from "./MiniBars";
import { T } from "@/components/ui/T";

const rate = (p: number, n: number) => (n ? p / n : 1);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export function QualityByLocation() {
  const locations = useStore((s) => s.locations);
  const lang = useStore((s) => s.lang);
  const checks = useStore((s) => s.checks);
  const rows = locations.map((l) => {
    const cs = checks.filter((c) => c.locationId === l.id);
    const pass = cs.filter((c) => c.result === "pass").length;
    return { label: lang === "ar" ? l.nameAr : l.name, value: rate(pass, cs.length), max: 1, display: pct(rate(pass, cs.length)), sub: `${cs.length} samples · ${cs.length - pass} failed (7 days)` };
  });
  return <MiniBars rows={rows} />;
}

export function TypeComparison() {
  const { checks, vehicles } = useScoped();
  const rows = (["refueller", "dispenser"] as const).map((t) => {
    const ids = new Set(vehicles.filter((v) => v.type === t).map((v) => v.id));
    const cs = checks.filter((c) => ids.has(c.vehicleId));
    const pass = cs.filter((c) => c.result === "pass").length;
    return { label: t === "refueller" ? "Refuellers" : "Hydrant dispensers", value: rate(pass, cs.length), max: 1, display: pct(rate(pass, cs.length)), sub: `${ids.size} units · ${cs.length} samples · ${cs.length - pass} failed`, color: t === "refueller" ? "linear-gradient(90deg,#b58aff,#d7bcff)" : "linear-gradient(90deg,#cdb8f0,#6aa8f5)" };
  });
  return <MiniBars rows={rows} />;
}

export function OccasionCompletion() {
  const { checks } = useScoped();
  const rows = OCCASION_ORDER.map((o) => {
    const n = checks.filter((c) => c.occasion === o).length;
    return { label: OCCASIONS[o].label, value: n, display: String(n) };
  });
  return <MiniBars rows={rows} />;
}

export function RepeatFailures() {
  const { checks } = useScoped();
  const now = useNow(60000);
  const list = useMemo(() => {
    const m = new Map<string, number>();
    checks.filter((c) => c.result === "fail" && c.ts > startOfDay(now) - 6 * DAY).forEach((c) => m.set(c.vehicleId, (m.get(c.vehicleId) ?? 0) + 1));
    return [...m.entries()].filter(([, n]) => n >= 1).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [checks, now]);
  if (!list.length) return <p className="py-6 text-center text-sm text-muted"><T>{"No repeat failures in the last 7 days."}</T></p>;
  return (
    <ul className="divide-y divide-hair">
      {list.map(([v, n]) => (
        <li key={v}><Link href={`/fleet?open=${v}`} className="flex items-center justify-between py-2.5 text-sm hover:text-teal"><span className="font-mono font-medium">{v}</span><span className="text-muted">{n} failed {n === 1 ? "sample" : "samples"}</span></Link></li>
      ))}
    </ul>
  );
}

export function FleetHealth() {
  const { vehicles, holds, due, checks } = useScoped();
  const c = { ok: 0, pending: 0, due: 0, overdue: 0, hold: 0 };
  vehicles.forEach((v) => { c[vehicleStatus(v, holds, due, checks)]++; });
  return <StackBar parts={[{ label: "Cleared", value: c.ok, color: "#2fbf8f" }, { label: "Awaiting review", value: c.pending, color: "#cdb8f0" }, { label: "Due", value: c.due, color: "#e6a84a" }, { label: "Overdue", value: c.overdue, color: "#ff405c" }, { label: "On hold", value: c.hold, color: "#ef6f6c" }]} />;
}

export function useEmployeeActivity() {
  const employees = useStore((s) => s.employees);
  const { checks } = useScoped();
  const now = useNow(60000);
  return useMemo(() => employees.filter((e) => e.role === "operator").map((e) => {
    const cs = checks.filter((c) => c.employeeId === e.id);
    const pass = cs.filter((c) => c.result === "pass").length;
    return { e, n: cs.length, fail: cs.length - pass, rate: rate(pass, cs.length), expired: e.certExpiry < now };
  }).sort((a, b) => b.n - a.n), [employees, checks, now]);
}

export function EmployeeActivity({ limit = 6 }: { limit?: number }) {
  const lang = useStore((s) => s.lang);
  const rows = useEmployeeActivity().slice(0, limit);
  return <MiniBars rows={rows.map((r) => ({ label: `${lang === "ar" ? r.e.nameAr : r.e.name} · ${r.e.id}`, value: r.n, display: `${r.n}`, sub: `${pct(r.rate)} pass rate${r.expired ? " · authorisation expired" : ""}` }))} />;
}
