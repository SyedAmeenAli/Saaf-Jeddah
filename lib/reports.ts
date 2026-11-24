import type { Check, Employee, AuditEntry, DueItem } from "./types";
import { POINTS, OCCASIONS } from "./domain";
import { fmtDT, fmtDate, fmtTime, DAY, startOfDay } from "./utils";

export interface ReportDef { id: string; title: string; titleAr: string; desc: string; icon: string }
export const REPORTS: ReportDef[] = [
  { id: "daily", title: "Daily report", titleAr: "التقرير اليومي", desc: "Every sample taken today, with results, employee and signatures.", icon: "calendar" },
  { id: "vehicle", title: "Vehicle-wise report", titleAr: "تقرير حسب المركبة", desc: "Full 7-day history for one refueller or dispenser.", icon: "truck" },
  { id: "employee", title: "Employee report", titleAr: "تقرير الموظف", desc: "Samples performed per employee number.", icon: "user" },
  { id: "failure", title: "Failure report", titleAr: "تقرير الإخفاقات", desc: "Failed checks, holds, re-samples and authorised releases.", icon: "alert" },
  { id: "pending", title: "Pending / overdue", titleAr: "المعلّق / المتأخر", desc: "Samples due, overdue, and awaiting supervisor verification.", icon: "clock" },
  { id: "location", title: "Location-wise report", titleAr: "تقرير حسب الموقع", desc: "Samples and compliance per location.", icon: "pin" },
  { id: "monthly", title: "Monthly report", titleAr: "التقرير الشهري", desc: "Compliance summary across the period.", icon: "chart" },
  { id: "audit", title: "Audit export", titleAr: "تصدير التدقيق", desc: "Append-only log of submissions, approvals and changes.", icon: "log" },
];

export interface Row { cells: (string | number)[]; result?: "pass" | "fail" | "pending" }
export interface Built { head: string[]; rows: Row[]; sig?: boolean }

const tick = (r: string) => (r === "pass" ? "✓" : r === "fail" ? "✕" : "–");
const cwdT = (r: string) => (r === "pass" ? "✓" : r === "fail" ? "✕" : "n/d");

export function checkRows(checks: Check[]): Row[] {
  return checks.map((c) => ({
    result: c.result,
    cells: [
      fmtDT(c.ts), c.sampleId, c.vehicleId, POINTS[c.point].label, tick(c.clarity), tick(c.sediment), tick(c.freeWater), cwdT(c.cwd),
      c.dp.toFixed(2), c.employeeId, c.result === "pass" ? "PASS" : "FAIL", c.supervisorId ?? (c.status === "returned" ? "returned" : "pending"),
    ],
  }));
}
export const CHECK_HEAD = ["Date / time", "Sample ID", "Vehicle", "Point", "Clarity", "Sediment", "Free water", "CWD", "DP (bar)", "Emp. no.", "Result", "Supervisor"];

export function buildReport(
  id: string,
  d: { checks: Check[]; due: DueItem[]; audit: AuditEntry[]; employees: Employee[] },
  opt: { vehicleId?: string; employeeId?: string },
): Built {
  const now = Date.now();
  const today = startOfDay(now);
  switch (id) {
    case "daily":
      return { head: CHECK_HEAD, rows: checkRows(d.checks.filter((c) => c.ts >= today)), sig: true };
    case "vehicle":
      return { head: CHECK_HEAD, rows: checkRows(d.checks.filter((c) => c.vehicleId === (opt.vehicleId || "REF-014"))), sig: true };
    case "employee":
      return { head: CHECK_HEAD, rows: checkRows(d.checks.filter((c) => c.employeeId === (opt.employeeId || "EMP-1024"))), sig: true };
    case "location": {
      const locs = Array.from(new Set(d.checks.map((c) => c.locationId))).sort();
      return { head: ["Location", "Samples", "Passed", "Failed", "Pass rate"], rows: locs.map((l) => { const r = d.checks.filter((c) => c.locationId === l), f = r.filter((c) => c.result === "fail").length; return { cells: [l, r.length, r.length - f, f, `${(((r.length - f) / r.length) * 100).toFixed(1)}%`] }; }) };
    }
    case "failure":
      return { head: [...CHECK_HEAD.slice(0, 3), "Point", "Occasion", "Reason", "Emp. no.", "Kind", "Linked to"], rows: d.checks.filter((c) => c.result === "fail" || c.kind === "resample").map((c) => ({
        result: c.result, cells: [fmtDT(c.ts), c.sampleId, c.vehicleId, POINTS[c.point].label, OCCASIONS[c.occasion].label, c.failReason ?? "Re-sample (pass)", c.employeeId, c.kind, c.linkedTo?.slice(-14) ?? "–"],
      })) };
    case "pending":
      return { head: ["Due / sampled", "Vehicle", "Point", "Status", "Detail"], rows: [
        ...d.due.map((x): Row => ({ result: "pending", cells: [fmtDT(x.dueTs), x.vehicleId, POINTS[x.point].label, x.state === "overdue" ? "OVERDUE" : "DUE", OCCASIONS[x.occasion].label] })),
        ...d.checks.filter((c) => c.status === "awaiting").map((c): Row => ({ result: "pending", cells: [fmtDT(c.ts), c.vehicleId, POINTS[c.point].label, "AWAITING SUPERVISOR", c.sampleId] })),
      ] };
    case "monthly": {
      const days: Row[] = [];
      for (let i = 6; i >= 0; i--) {
        const s = startOfDay(now - i * DAY), e = s + DAY;
        const cs = d.checks.filter((c) => c.ts >= s && c.ts < e);
        const f = cs.filter((c) => c.result === "fail").length;
        days.push({ cells: [fmtDate(s), cs.length, cs.length - f, f, cs.length ? `${(((cs.length - f) / cs.length) * 100).toFixed(1)}%` : "–"] });
      }
      return { head: ["Date", "Samples", "Passed", "Failed", "Pass rate"], rows: days };
    }
    default:
      return { head: ["Time", "Actor", "Role", "Action", "Target", "Detail"], rows: d.audit.slice(0, 80).map((a) => ({ cells: [fmtDT(a.ts), a.actor, a.role, a.action, a.target, a.detail] })) };
  }
}

export { fmtTime };
