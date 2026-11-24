import type {
  AuditEntry, Check, DueItem, Employee, Hold, Location, Notice, OccasionId, PointId, Res, Vehicle, VehicleType,
} from "@/lib/types";
import { applicablePoints, POINTS, pointsForVehicle } from "@/lib/domain";
import { DAY, fmtTime, startOfDay, ymd } from "@/lib/utils";

/** Demo data. Dates are computed relative to "now" so the demo never looks stale. */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const LOCATIONS: Location[] = [
  { id: "LOC01", name: "Location 01 – North Apron", nameAr: "الموقع 01 – ساحة الشمال", zone: "Jeddah · North" },
  { id: "LOC02", name: "Location 02 – South Apron", nameAr: "الموقع 02 – ساحة الجنوب", zone: "Jeddah · South" },
  { id: "LOC03", name: "Location 03 – Cargo Apron", nameAr: "الموقع 03 – ساحة الشحن", zone: "Jeddah · Cargo" },
];

const E = (id: string, name: string, nameAr: string, role: Employee["role"], loc: string, days: number): Employee => ({
  id, name, nameAr, role, locationId: loc, certExpiry: Date.now() + days * DAY,
});

export function makeEmployees(): Employee[] {
  return [
    E("EMP-1024", "Khalid Al-Harbi", "خالد الحربي", "operator", "LOC01", 210),
    E("EMP-1031", "Omar Bakr", "عمر بكر", "operator", "LOC01", 95),
    E("EMP-1037", "Yusuf Al-Ghamdi", "يوسف الغامدي", "operator", "LOC01", 18),
    E("EMP-1042", "Faisal Naseer", "فيصل ناصر", "operator", "LOC01", 300),
    E("EMP-1097", "Ziyad Sulami", "زياد السلمي", "operator", "LOC01", 250),
    E("EMP-1116", "Mazen Siddiqi", "مازن صديقي", "operator", "LOC01", 75),
    E("EMP-1122", "Ibrahim Kurdi", "إبراهيم كردي", "operator", "LOC01", 140),
    E("EMP-1048", "Hassan Zahrani", "حسن الزهراني", "operator", "LOC02", 160),
    E("EMP-1055", "Tariq Mansour", "طارق منصور", "operator", "LOC02", 27),
    E("EMP-1061", "Saleh Qahtani", "صالح القحطاني", "operator", "LOC02", 340),
    E("EMP-1066", "Nasser Otaibi", "ناصر العتيبي", "operator", "LOC02", 60),
    E("EMP-1103", "Hamza Rashidi", "حمزة الرشيدي", "operator", "LOC02", 9),
    E("EMP-1128", "Waleed Bamasoud", "وليد باماسود", "operator", "LOC02", 110),
    E("EMP-1073", "Adel Juhani", "عادل الجهني", "operator", "LOC03", 120),
    E("EMP-1079", "Majed Shehri", "ماجد الشهري", "operator", "LOC03", -12),
    E("EMP-1084", "Rakan Dossari", "راكان الدوسري", "operator", "LOC03", 205),
    E("EMP-1090", "Bandar Harbi", "بندر الحربي", "operator", "LOC03", 40),
    E("EMP-1110", "Anwar Malki", "أنور المالكي", "operator", "LOC03", 180),
    E("EMP-2001", "Abdulaziz Fahad", "عبدالعزيز فهد", "supervisor", "LOC01", 365),
    E("EMP-2002", "Mohammed Jaber", "محمد جابر", "supervisor", "LOC02", 365),
    E("EMP-2003", "Rayan Hijazi", "ريان الحجازي", "supervisor", "LOC03", 365),
    E("EMP-3001", "Dr. Layla Al-Amoudi (QC)", "د. ليلى العمودي (الجودة)", "manager", "LOC01", 365),
    E("EMP-3002", "Nora Basahel (Ops)", "نورة باسهل (العمليات)", "manager", "LOC01", 365),
    E("EMP-9001", "Sami Khoja", "سامي خوجة", "admin", "LOC01", 365),
    E("EMP-9002", "Dina Fattani", "دينا فطاني", "admin", "LOC01", 365),
  ];
}

export const DEMO_USER: Record<string, string> = {
  operator: "EMP-1024",
  supervisor: "EMP-2001",
  manager: "EMP-3001",
  admin: "EMP-9001",
};

export function tagId(vehicleId: string, p: PointId) {
  return `NFC-${vehicleId.replace("-", "")}-${POINTS[p].code}-${(vehicleId.charCodeAt(5) * 7 + POINTS[p].code.charCodeAt(0) * 13) % 900 + 100}`;
}

export function makeVehicles(): Vehicle[] {
  const out: Vehicle[] = [];
  (["refueller", "dispenser"] as VehicleType[]).forEach((type) => {
    for (let i = 1; i <= 20; i++) {
      const id = `${type === "refueller" ? "REF" : "DSP"}-${String(i).padStart(3, "0")}`;
      const locationId = i <= 7 ? "LOC01" : i <= 14 ? "LOC02" : "LOC03";
      const tags: Vehicle["tags"] = {};
      pointsForVehicle(type).forEach((p) => (tags[p] = tagId(id, p)));
      out.push({ id, type, locationId, tags, plate: `${1000 + i * 37} ${type === "refueller" ? "RFL" : "DSP"}` });
    }
  });
  return out;
}

function mkCheck(
  v: Vehicle, point: PointId, occasion: OccasionId, ts: number, emp: string, result: Res, seq: number, r: () => number,
): Check {
  const fail = result === "fail";
  const failKind = fail ? (["clarity", "freeWater", "cwd"] as const)[Math.floor(r() * 3)] : null;
  return {
    id: `CHK-${ymd(ts)}-${v.id}-${POINTS[point].code}-${seq}`,
    sampleId: `${v.locationId}-${v.id.replace("-", "")}-${POINTS[point].code}-${ymd(ts)}-${String(seq).padStart(3, "0")}`,
    vehicleId: v.id, locationId: v.locationId, point, occasion, employeeId: emp, ts,
    colour: "water-white", colourChange: false,
    clarity: failKind === "clarity" ? "fail" : "pass",
    sediment: "pass",
    freeWater: failKind === "freeWater" ? "fail" : "pass",
    microbialSigns: "no",
    cwd: failKind === "cwd" ? "fail" : "pass",
    cwdKit: "CWD Kit (demo)", cwdBatch: `LOT-${20 + Math.floor(r() * 9)}${Math.floor(r() * 90 + 10)}`, cwdExpiry: "2027-06",
    dp: Math.round((0.3 + r() * 0.45) * 100) / 100,
    result, status: "approved", kind: "sample", synced: true,
    failReason: fail ? "Haze / water indication at sample" : undefined,
  };
}

export interface Seed {
  checks: Check[]; due: DueItem[]; holds: Hold[]; audit: AuditEntry[]; notices: Notice[];
}

export function makeSeed(vehicles: Vehicle[], employees: Employee[]): Seed {
  const now = Date.now();
  const r = rng(Math.floor(now / DAY));
  const sup = (loc: string) => employees.find((e) => e.role === "supervisor" && e.locationId === loc)!.id;
  const ops = (loc: string) => employees.filter((e) => e.role === "operator" && e.locationId === loc && e.certExpiry > now);
  const checks: Check[] = [];
  const due: DueItem[] = [];
  const holds: Hold[] = [];
  const audit: AuditEntry[] = [];
  const notices: Notice[] = [];

  // [vehicle, daysAgo, point] → seeded failures
  const failures: Record<string, boolean> = {
    "REF-003|5|tank_sump": true,
    "REF-007|3|filter_sump": true,
    "DSP-012|1|filter_outlet": true,
    "REF-014|0|filter_sump": true,
    "REF-009|0|filter_outlet": true,
  };
  const overdueSet = new Set(["REF-005|filter_sump", "DSP-016|filter_outlet", "REF-018|tank_sump"]);
  const dueSet = new Set(["REF-002|filter_outlet", "REF-011|tank_sump", "DSP-004|filter_sump", "DSP-009|filter_outlet", "REF-020|filter_sump", "DSP-019|filter_sump", "REF-016|filter_outlet", "DSP-013|filter_sump"]);

  for (const v of vehicles) {
    const pool = ops(v.locationId);
    for (let d = 6; d >= 0; d--) {
      const base = now - d * DAY;
      applicablePoints("start_shift", v.type).forEach((p, pi) => {
        const key = `${v.id}|${p}`;
        if (d === 0 && overdueSet.has(key)) {
          due.push({ id: `DUE-${key}`, vehicleId: v.id, locationId: v.locationId, point: p, occasion: "start_shift", dueTs: now - (70 + Math.floor(r() * 60)) * 60000, state: "overdue" });
          return;
        }
        if (d === 0 && dueSet.has(key)) {
          due.push({ id: `DUE-${key}`, vehicleId: v.id, locationId: v.locationId, point: p, occasion: "start_shift", dueTs: now + (15 + Math.floor(r() * 90)) * 60000, state: "due" });
          return;
        }
        const ts = d === 0 ? Math.max(now - (25 + Math.floor(r() * 240) + pi * 7) * 60000, startOfDay(now) + (3 + pi) * 60000) : startOfDay(base) + (5 * 60 + Math.floor(r() * 150)) * 60000;
        const failed = !!failures[`${v.id}|${d}|${p}`];
        const emp = pool[Math.floor(r() * pool.length)].id;
        const c = mkCheck(v, p, "start_shift", ts, emp, failed ? "fail" : "pass", 1, r);
        if (d === 0) c.status = r() < 0.18 ? "awaiting" : "approved";
        if (d === 1 && r() < 0.03) c.status = "awaiting";
        if (d === 0 && v.id === "REF-001" && p === "tank_sump") {
          c.status = "returned"; c.returnReason = "Employee number illegible, please re-enter";
        }
        if (c.status === "approved") { c.supervisorId = sup(v.locationId); c.reviewedTs = ts + 40 * 60000; }
        if (failed) c.status = "awaiting";
        checks.push(c);
      });
    }
  }

  // Failure chains ------------------------------------------------------------
  const byKey = (vid: string, d: number, p: PointId) =>
    checks.find((c) => c.vehicleId === vid && c.point === p && c.result === "fail" && Math.round((now - c.ts) / DAY) === d)!;

  const mkResample = (failed: Check, minutesAfter: number, emp: string, result: Res = "pass"): Check => {
    const v = vehicles.find((x) => x.id === failed.vehicleId)!;
    const c = mkCheck(v, failed.point, failed.occasion, failed.ts + minutesAfter * 60000, emp, result, 2, r);
    c.kind = "resample"; c.linkedTo = failed.id; c.status = "approved"; c.supervisorId = sup(v.locationId); c.reviewedTs = c.ts + 20 * 60000;
    return c;
  };
  const opFor = (loc: string) => ops(loc)[0].id;

  // Resolved chains (history)
  for (const [vid, d, p] of [["REF-003", 5, "tank_sump"], ["REF-007", 3, "filter_sump"], ["DSP-012", 1, "filter_outlet"]] as [string, number, PointId][]) {
    const f = byKey(vid, d, p);
    f.status = "approved"; f.supervisorId = sup(f.locationId); f.reviewedTs = f.ts + 15 * 60000;
    const rs = mkResample(f, 55, opFor(f.locationId));
    checks.push(rs);
    holds.push({
      id: `HOLD-${vid}-${d}`, vehicleId: vid, locationId: f.locationId, point: p, reason: f.failReason!, state: "released", openedTs: f.ts,
      events: [
        { type: "fail", ts: f.ts, checkId: f.id, actor: f.employeeId, note: f.failReason! },
        { type: "resample", ts: rs.ts, checkId: rs.id, actor: rs.employeeId, note: "Re-sample passed" },
        { type: "release", ts: rs.ts + 25 * 60000, actor: sup(f.locationId), note: "Authorised release, countersigned" },
      ],
    });
  }
  // Active: awaiting resample
  const f1 = byKey("REF-014", 0, "filter_sump");
  holds.push({
    id: "HOLD-REF-014-0", vehicleId: "REF-014", locationId: f1.locationId, point: "filter_sump", reason: f1.failReason!, state: "hold", openedTs: f1.ts,
    events: [{ type: "fail", ts: f1.ts, checkId: f1.id, actor: f1.employeeId, note: f1.failReason! }],
  });
  // Active: resampled, awaiting authorised release
  const f2 = byKey("REF-009", 0, "filter_outlet");
  const rs2 = mkResample(f2, 35, opFor(f2.locationId));
  rs2.status = "awaiting"; rs2.supervisorId = undefined; rs2.reviewedTs = undefined;
  checks.push(rs2);
  holds.push({
    id: "HOLD-REF-009-0", vehicleId: "REF-009", locationId: f2.locationId, point: "filter_outlet", reason: f2.failReason!, state: "resampled", openedTs: f2.ts,
    events: [
      { type: "fail", ts: f2.ts, checkId: f2.id, actor: f2.employeeId, note: f2.failReason! },
      { type: "resample", ts: rs2.ts, checkId: rs2.id, actor: rs2.employeeId, note: "Re-sample passed, awaiting authorised release" },
    ],
  });

  // Audit ---------------------------------------------------------------------
  for (const c of checks) {
    audit.push({ id: `A-${c.id}-s`, ts: c.ts, actor: c.employeeId, role: "operator", action: c.kind === "resample" ? "resample" : "submission", target: c.sampleId, detail: c.result === "fail" ? "Result: FAIL" : "Result: PASS" });
    if (c.status === "approved" && c.reviewedTs) audit.push({ id: `A-${c.id}-a`, ts: c.reviewedTs, actor: c.supervisorId!, role: "supervisor", action: "approval", target: c.sampleId, detail: "Verified and countersigned" });
    if (c.status === "returned") audit.push({ id: `A-${c.id}-r`, ts: c.ts + 30 * 60000, actor: sup(c.locationId), role: "supervisor", action: "return", target: c.sampleId, detail: c.returnReason ?? "" });
  }
  for (const h of holds) {
    audit.push({ id: `A-${h.id}-h`, ts: h.openedTs + 1000, actor: "SAFAA", role: "system", action: "hold", target: h.vehicleId, detail: "HOLD raised: supervisor + QC manager notified" });
    h.events.filter((e) => e.type === "release").forEach((e) => audit.push({ id: `A-${h.id}-rel`, ts: e.ts, actor: e.actor, role: "supervisor", action: "release", target: h.vehicleId, detail: e.note }));
  }
  const cfg: [number, string, string, string][] = [
    [6.2, "EMP-9001", "Tag NFC-REF014-FS assigned", "REF-014"],
    [5.1, "EMP-9001", "Vehicle DSP-020 added to Location 03", "DSP-020"],
    [3.4, "EMP-9002", "User EMP-1128 role set to Operator", "EMP-1128"],
    [2.2, "EMP-9001", "JIG rule set confirmed: v1", "Settings"],
  ];
  cfg.forEach(([d, a, detail, target], i) => audit.push({ id: `A-cfg-${i}`, ts: now - d * DAY, actor: a, role: "admin", action: "config", target, detail }));
  audit.sort((a, b) => b.ts - a.ts);

  notices.push(
    { id: "N-1", ts: f1.ts + 1000, kind: "fail", text: `HOLD: REF-014 filter sump failed. Do not fuel.`, read: false },
    { id: "N-2", ts: rs2.ts, kind: "info", text: "REF-009 re-sample passed: awaiting authorised release", read: false },
    ...due.filter((x) => x.state === "overdue").map((x, i): Notice => ({ id: `N-o${i}`, ts: x.dueTs, kind: "overdue", text: `Overdue: ${x.vehicleId} ${POINTS[x.point].label} at ${fmtTime(x.dueTs)}`, read: false })),
  );

  checks.sort((a, b) => b.ts - a.ts);
  return { checks, due, holds, audit, notices };
}
