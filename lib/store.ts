"use client";
import { create } from "zustand";
import type {
  Amendment, AuditEntry, Check, DueItem, Employee, Hold, Location, Notice, OccasionId, PointId, Res, Role, Toast, Vehicle, VehicleType, MicroTest } from "./types";
import { DEMO_USER, LOCATIONS, makeEmployees, makeSeed, makeVehicles, tagId } from "@/data/seed";
import { POINTS, pointsForVehicle, defaultMatrix, type MatrixConfig } from "./domain";
import { ymd } from "./utils";
import type { Lang } from "./i18n";

export type Theme = "dark" | "light";

export interface SubmitInput {
  vehicleId: string; point: PointId; occasion: OccasionId; employeeId: string;
  colour: Check["colour"]; colourChange: boolean; clarity: Res; sediment: Res; freeWater: Res; microbialSigns: "yes" | "no";
  cwd: Check["cwd"]; cwdKit: string; cwdBatch: string; cwdExpiry: string; dp: number; failReason?: string;
}

interface State {
  ready: boolean;
  loggedIn: boolean;
  theme: Theme;
  lang: Lang;
  role: Role;
  sidebarCollapsed: boolean;
  activeLocation: string; // "all" | LOCxx
  offline: boolean;
  queued: number;
  syncing: boolean;
  introSeen: boolean;
  locations: Location[];
  vehicles: Vehicle[];
  employees: Employee[];
  checks: Check[];
  due: DueItem[];
  holds: Hold[];
  audit: AuditEntry[];
  notices: Notice[];
  amendments: Amendment[];
  micro: MicroTest[];
  perms: Record<Role, string[]>;
  matrix: MatrixConfig;
  toasts: Toast[];
  paletteOpen: boolean;
  noticesOpen: boolean;

  init: () => void;
  login: (role: Role) => void;
  logout: () => void;
  setRole: (r: Role) => void;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  setActiveLocation: (id: string) => void;
  toggleSidebar: () => void;
  toggleOffline: () => void;
  setPalette: (o: boolean) => void;
  setNotices: (o: boolean) => void;
  markNoticesRead: () => void;
  toast: (kind: Toast["kind"], text: string) => void;
  dismissToast: (id: string) => void;
  log: (e: Omit<AuditEntry, "id" | "ts">) => void;

  addLocation: (name: string, nameAr?: string) => void;
  addVehicle: (type: VehicleType, locationId: string) => string;
  assignTag: (vehicleId: string, point: PointId, tag: string) => void;
  updateVehicle: (id: string, patch: { plate?: string; locationId?: string }) => void;
  nextSeq: (vehicleId: string, point: PointId) => number;
  submitCheck: (i: SubmitInput) => Check;
  approveCheck: (id: string) => void;
  returnCheck: (id: string, reason: string) => void;
  amendCheck: (id: string, field: string, to: string, reason: string) => void;
  releaseHold: (holdId: string) => void;
  addUser: (name: string, nameAr: string, role: Role, locationId: string) => string;
  setUserRole: (id: string, role: Role) => void;
  setCert: (id: string, days: number) => void;
  prefs: { notifyFail: boolean; notifyOverdue: boolean; haptics: boolean; compact: boolean };
  setPref: (k: "notifyFail" | "notifyOverdue" | "haptics" | "compact", v: boolean) => void;
  resetDemo: () => void;
  setPerm: (role: Role, cap: string, on: boolean) => void;
  toggleMatrix: (occasion: OccasionId, point: PointId) => void;
  collectMicro: (id: string) => void;
  recordMicro: (id: string, result: Res, note: string) => void;
}

function makeMicro(vehicles: Vehicle[]): MicroTest[] {
  const now = Date.now(), D = 86_400_000;
  return vehicles.map((v, i) => {
    const base = { id: `MIC-${String(i + 1).padStart(4, "0")}`, vehicleId: v.id, locationId: v.locationId, method: "Membrane filtration (demo)" };
    if (i % 5 === 0) return { ...base, status: "complete" as const, dueTs: now - (12 + (i % 4)) * D, collectedTs: now - (13 + (i % 4)) * D, collectedBy: "EMP-1024", labRef: `MB-${4100 + i}`, result: (i === 10 ? "fail" : "pass") as Res, resultTs: now - (8 + (i % 3)) * D, reviewedBy: "EMP-2001", note: i === 10 ? "Growth above action limit. Repeat sample and sanitise." : "No growth at limit." };
    if (i % 5 === 1) return { ...base, status: "collected" as const, dueTs: now - 2 * D, collectedTs: now - (1 + (i % 3)) * D, collectedBy: "EMP-1042", labRef: `MB-${4100 + i}` };
    if (i % 7 === 3) return { ...base, status: "scheduled" as const, dueTs: now - (1 + (i % 3)) * D };
    return { ...base, status: "scheduled" as const, dueTs: now + (3 + (i % 20)) * D };
  });
}

const PERSIST_KEY = "safaa.state.v1";
const uid = () => Math.random().toString(36).slice(2, 9);
export const currentUserId = (role: Role) => DEMO_USER[role];

export const useStore = create<State>((set, get) => ({
  ready: false,
  loggedIn: false,
  theme: "dark",
  lang: "en",
  role: "operator",
  sidebarCollapsed: false,
  activeLocation: "all",
  offline: false,
  queued: 0,
  syncing: false,
  introSeen: false,
  locations: LOCATIONS,
  vehicles: [],
  employees: [],
  checks: [],
  due: [],
  holds: [],
  audit: [],
  notices: [],
  amendments: [],
  micro: [],
  perms: { operator: ["sample"], supervisor: ["verify", "release", "amend", "export"], manager: ["export"], admin: ["admin", "export"] },
  matrix: defaultMatrix(),
  toasts: [],
  paletteOpen: false,
  noticesOpen: false,

  init: () => {
    if (get().ready) return;
    const employees = makeEmployees();
    const vehicles = makeVehicles();
    const seed = makeSeed(vehicles, employees);
    let theme: Theme = "dark", lang: Lang = "en", role: Role = "operator", loggedIn = false, introSeen = false;
    try {
      theme = localStorage.getItem("safaa.theme") === "light" ? "light" : "dark";
      lang = (localStorage.getItem("safaa.lang") as Lang) || "en";
      role = (localStorage.getItem("safaa.role") as Role) || "operator";
      loggedIn = localStorage.getItem("safaa.login") === "1";
      introSeen = sessionStorage.getItem("safaa.intro") === "1";
    } catch {}
    set({ ready: true, micro: makeMicro(vehicles), employees, vehicles, ...seed, notices: seed.notices, theme, lang, role, loggedIn, introSeen });
    // Restore this browser's demo state (same day only, so seeded times stay relative to today), then keep saving it.
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { day: string; data: Partial<State> };
        if (saved.day === ymd(Date.now())) set(saved.data);
      }
    } catch {}
    let timer: ReturnType<typeof setTimeout> | undefined;
    useStore.subscribe((st) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const data = { locations: st.locations, vehicles: st.vehicles, employees: st.employees, checks: st.checks, due: st.due, holds: st.holds, audit: st.audit, notices: st.notices, amendments: st.amendments, micro: st.micro, perms: st.perms, matrix: st.matrix };
          localStorage.setItem(PERSIST_KEY, JSON.stringify({ day: ymd(Date.now()), data }));
        } catch {}
      }, 500);
    });
  },
  login: (role) => {
    try { localStorage.setItem("safaa.login", "1"); localStorage.setItem("safaa.role", role); sessionStorage.setItem("safaa.intro", "1"); } catch {}
    set({ loggedIn: true, role, introSeen: true });
  },
  logout: () => {
    try { localStorage.removeItem("safaa.login"); } catch {}
    set({ loggedIn: false });
  },
  setRole: (role) => {
    try { localStorage.setItem("safaa.role", role); } catch {}
    set({ role });
    get().toast("info", `Viewing as ${role}`);
  },
  setTheme: (theme) => {
    try { localStorage.setItem("safaa.theme", theme); } catch {}
    set({ theme });
  },
  setLang: (lang) => {
    try { localStorage.setItem("safaa.lang", lang); } catch {}
    set({ lang });
  },
  setActiveLocation: (activeLocation) => set({ activeLocation }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleOffline: () => {
    const { offline, queued } = get();
    if (!offline) { set({ offline: true }); return; }
    // going back online: visible sync
    set({ offline: false, syncing: true });
    setTimeout(() => {
      set((s) => ({ syncing: false, queued: 0, checks: s.checks.map((c) => (c.synced ? c : { ...c, synced: true })) }));
      if (queued > 0) get().toast("pass", `${queued} queued record${queued > 1 ? "s" : ""} synced`);
    }, 1600);
  },
  setPalette: (paletteOpen) => set({ paletteOpen }),
  setNotices: (noticesOpen) => set({ noticesOpen }),
  markNoticesRead: () => set((s) => ({ notices: s.notices.map((n) => ({ ...n, read: true })) })),
  toast: (kind, text) => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, text }] }));
    setTimeout(() => get().dismissToast(id), 4800);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  log: (e) => set((s) => ({ audit: [{ ...e, id: uid(), ts: Date.now() }, ...s.audit] })),

  addLocation: (name, nameAr) => {
    if (get().role !== "admin") return; // configuration is admin-only
    const n = get().locations.length + 1;
    const id = `LOC${String(n).padStart(2, "0")}`;
    set((s) => ({ locations: [...s.locations, { id, name, nameAr: nameAr || name, zone: "Jeddah · Demo" }] }));
    get().log({ actor: currentUserId(get().role), role: get().role, action: "config", target: id, detail: `Location added: ${name}` });
    get().toast("pass", `Location ${id} added`);
  },
  addVehicle: (type, locationId) => {
    if (get().role !== "admin") return ""; // configuration is admin-only
    const prefix = type === "refueller" ? "REF" : "DSP";
    const n = get().vehicles.filter((v) => v.type === type).length + 1;
    const id = `${prefix}-${String(n).padStart(3, "0")}`;
    const tags: Vehicle["tags"] = {};
    pointsForVehicle(type).forEach((p) => (tags[p] = tagId(id, p)));
    set((s) => ({ vehicles: [...s.vehicles, { id, type, locationId, tags, plate: `${1000 + n * 37} ${prefix}` }] }));
    get().log({ actor: currentUserId(get().role), role: get().role, action: "config", target: id, detail: `Vehicle added to ${locationId}` });
    get().toast("pass", `${id} added to ${locationId}`);
    return id;
  },
  updateVehicle: (id, patch) => {
    const s = get();
    const v = s.vehicles.find((x) => x.id === id);
    if (!v || s.role !== "admin") return;
    set({ vehicles: s.vehicles.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
    get().log({ actor: currentUserId(s.role), role: s.role, action: "config", target: id, detail: `Equipment updated${patch.plate ? `: plate ${patch.plate}` : ""}${patch.locationId ? `, location ${patch.locationId}` : ""}` });
    get().toast("pass", `${id} updated`);
  },
  assignTag: (vehicleId, point, tag) => {
    if (get().role !== "admin") return; // configuration is admin-only
    set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === vehicleId ? { ...v, tags: { ...v.tags, [point]: tag } } : v)) }));
    get().log({ actor: currentUserId(get().role), role: get().role, action: "config", target: vehicleId, detail: `Tag ${tag} assigned to ${POINTS[point].label}` });
    get().toast("pass", `Tag assigned: ${tag}`);
  },
  nextSeq: (vehicleId, point) => {
    const today = ymd(Date.now());
    return get().checks.filter((c) => c.vehicleId === vehicleId && c.point === point && ymd(c.ts) === today).length + 1;
  },
  submitCheck: (i) => {
    const s = get();
    const v = s.vehicles.find((x) => x.id === i.vehicleId)!;
    const ts = Date.now();
    const seq = s.nextSeq(i.vehicleId, i.point);
    const failed = i.clarity === "fail" || i.sediment === "fail" || i.freeWater === "fail" || i.cwd === "fail" || i.microbialSigns === "yes";
    const openHold = s.holds.find((h) => h.vehicleId === v.id && h.point === i.point && h.state === "hold");
    const isResample = !!openHold;
    const failedEvent = openHold?.events.find((e) => e.type === "fail");
    const c: Check = {
      id: `CHK-${ymd(ts)}-${v.id}-${POINTS[i.point].code}-${seq}-${uid()}`,
      sampleId: `${v.locationId}-${v.id.replace("-", "")}-${POINTS[i.point].code}-${ymd(ts)}-${String(seq).padStart(3, "0")}`,
      vehicleId: v.id, locationId: v.locationId, point: i.point, occasion: i.occasion, employeeId: i.employeeId, ts,
      colour: i.colour, colourChange: i.colourChange, clarity: i.clarity, sediment: i.sediment, freeWater: i.freeWater,
      microbialSigns: i.microbialSigns, cwd: i.cwd, cwdKit: i.cwdKit, cwdBatch: i.cwdBatch, cwdExpiry: i.cwdExpiry, dp: i.dp,
      result: failed ? "fail" : "pass", status: "awaiting", kind: isResample ? "resample" : "sample",
      linkedTo: failedEvent?.checkId, failReason: failed ? i.failReason : undefined, synced: !s.offline,
    };
    const dueMatch = (d: DueItem) => d.vehicleId === v.id && d.point === i.point;
    const holds = [...s.holds];
    const notices = [...s.notices];

    if (failed) {
      const existing = holds.findIndex((h) => h.vehicleId === v.id && h.state !== "released");
      const ev = { type: "fail" as const, ts, checkId: c.id, actor: i.employeeId, note: i.failReason ?? "Failed check" };
      if (existing >= 0) {
        // failed again while on hold: superseded by new linked sample, hold stays
        holds[existing] = { ...holds[existing], state: "hold", events: [...holds[existing].events, ev] };
      } else {
        holds.unshift({ id: `HOLD-${v.id}-${uid()}`, vehicleId: v.id, locationId: v.locationId, point: i.point, reason: i.failReason ?? "Failed check", state: "hold", openedTs: ts, events: [ev] });
      }
      if (s.prefs.notifyFail) {
        notices.unshift({ id: uid(), ts, kind: "fail", text: `HOLD: ${v.id} ${POINTS[i.point].label} failed. Do not fuel.`, read: false });
        notices.unshift({ id: uid(), ts, kind: "info", text: `Supervisor + QC manager notified about ${v.id}`, read: false });
      }
    } else if (isResample && openHold) {
      const idx = holds.findIndex((h) => h.id === openHold.id);
      holds[idx] = { ...openHold, state: "resampled", events: [...openHold.events, { type: "resample", ts, checkId: c.id, actor: i.employeeId, note: "Re-sample passed, awaiting authorised release" }] };
      notices.unshift({ id: uid(), ts, kind: "info", text: `${v.id} re-sample passed: awaiting authorised release`, read: false });
    }
    set({
      checks: [c, ...s.checks],
      due: s.due.filter((d) => !dueMatch(d)),
      holds, notices,
      queued: s.offline ? s.queued + 1 : s.queued,
    });
    get().log({ actor: i.employeeId, role: "operator", action: isResample ? "resample" : "submission", target: c.sampleId, detail: failed ? "Result: FAIL" : "Result: PASS" });
    if (failed) get().log({ actor: "SAFAA", role: "system", action: "hold", target: v.id, detail: "HOLD raised: supervisor + QC manager notified" });
    get().toast(failed ? "fail" : "pass", failed ? `HOLD raised on ${v.id}. Supervisor + QC notified.` : s.offline ? `Saved offline: ${c.sampleId}` : `Locked: ${c.sampleId}`);
    return c;
  },
  approveCheck: (id) => {
    const s = get();
    const sup = currentUserId(s.role);
    const c = s.checks.find((x) => x.id === id);
    // Record integrity: only a verifier may approve, and only a record that is awaiting review. The test result is never touched.
    if (!c || c.status !== "awaiting" || !s.perms[s.role]?.includes("verify")) { if (c) s.toast("fail", "Not allowed: this record is locked or you lack permission"); return; }
    set({ checks: s.checks.map((x) => (x.id === id ? { ...x, status: "approved", supervisorId: sup, reviewedTs: Date.now() } : x)) });
    get().log({ actor: sup, role: s.role, action: "approval", target: c.sampleId, detail: "Verified and countersigned" });
    get().toast("pass", `Approved & locked: ${c.sampleId}`);
  },
  returnCheck: (id, reason) => {
    const s = get();
    const c = s.checks.find((x) => x.id === id);
    if (!c || c.status !== "awaiting" || !s.perms[s.role]?.includes("verify")) { if (c) s.toast("fail", "Not allowed: an approved record cannot be returned"); return; }
    set({ checks: s.checks.map((x) => (x.id === id ? { ...x, status: "returned", returnReason: reason, supervisorId: currentUserId(s.role), reviewedTs: Date.now() } : x)) });
    get().log({ actor: currentUserId(s.role), role: s.role, action: "return", target: c.sampleId, detail: reason });
    get().toast("info", `Returned: ${c.sampleId}`);
  },
  amendCheck: (id, field, to, reason) => {
    const s = get();
    const c = s.checks.find((x) => x.id === id);
    if (!c || !s.perms[s.role]?.includes("amend")) return;
    const from = field === "dp" ? String(c.dp) : field === "employeeId" ? c.employeeId : c.cwdBatch;
    const a: Amendment = { id: uid(), originalId: id, field, from, to, reason, by: currentUserId(s.role), ts: Date.now() };
    set({ amendments: [a, ...s.amendments] });
    get().log({ actor: a.by, role: s.role, action: "amendment", target: c.sampleId, detail: `${field}: ${from} → ${to} (${reason}). Original preserved.` });
    get().toast("info", "Amendment recorded. Original preserved.");
  },
  addUser: (name, nameAr, role, locationId) => {
    if (get().role !== "admin") return "";
    const base = role === "operator" ? 1000 : role === "supervisor" ? 2000 : role === "manager" ? 3000 : 9000;
    const n = get().employees.filter((e) => e.role === role).length + 1 + base + 100;
    const id = `EMP-${n}`;
    set((s) => ({ employees: [...s.employees, { id, name, nameAr: nameAr || name, role, locationId, certExpiry: Date.now() + 365 * 86400000 }] }));
    get().log({ actor: currentUserId(get().role), role: get().role, action: "config", target: id, detail: `User ${name} added as ${role}` });
    get().toast("pass", `User ${id} added`);
    return id;
  },
  setUserRole: (id, role) => {
    if (get().role !== "admin") return; // configuration is admin-only
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, role } : e)) }));
    get().log({ actor: currentUserId(get().role), role: get().role, action: "config", target: id, detail: `Role set to ${role}` });
    get().toast("pass", `${id} is now ${role}`);
  },
  setCert: (id, days) => {
    if (get().role !== "admin") return; // configuration is admin-only
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, certExpiry: Date.now() + days * 86400000 } : e)) }));
    get().log({ actor: currentUserId(get().role), role: get().role, action: "config", target: id, detail: days > 0 ? `Qualification renewed (${days} days)` : "Qualification suspended" });
    get().toast(days > 0 ? "pass" : "info", days > 0 ? `${id} qualification renewed` : `${id} qualification suspended`);
  },
  prefs: { notifyFail: true, notifyOverdue: true, haptics: true, compact: false },
  setPref: (k, v) => set((s) => ({ prefs: { ...s.prefs, [k]: v } })),
  toggleMatrix: (occasion, point) => {
    const s = get();
    if (s.role !== "admin") return;
    const cur = s.matrix[occasion] ?? [];
    const on = !cur.includes(point);
    set({ matrix: { ...s.matrix, [occasion]: on ? [...cur, point] : cur.filter((p) => p !== point) } });
    get().log({ actor: currentUserId(s.role), role: s.role, action: "config", target: occasion, detail: `Matrix: ${POINTS[point].label} ${on ? "required" : "not required"} for ${occasion}` });
  },
  setPerm: (role, cap, on) => {
    const s = get();
    if (s.role !== "admin") return;
    if (role === "admin" && cap === "admin") return; // an admin cannot lock themselves out
    if (role === "manager" && cap !== "export") return; // manager stays read-only by policy
    const cur = s.perms[role];
    const next = on ? [...new Set([...cur, cap])] : cur.filter((c) => c !== cap);
    set({ perms: { ...s.perms, [role]: next } });
    get().log({ actor: currentUserId(s.role), role: s.role, action: "config", target: role, detail: `Permission ${cap} ${on ? "granted to" : "removed from"} ${role}` });
    get().toast("info", `${cap} ${on ? "granted to" : "removed from"} ${role}`);
  },
  collectMicro: (id) => {
    const s = get();
    const m = s.micro.find((x) => x.id === id);
    if (!m || m.status !== "scheduled") return;
    const by = currentUserId(s.role);
    set({ micro: s.micro.map((x) => (x.id === id ? { ...x, status: "collected", collectedTs: Date.now(), collectedBy: by, labRef: `MB-${Date.now().toString(36).toUpperCase().slice(-6)}` } : x)) });
    get().log({ actor: by, role: s.role, action: "submission", target: m.vehicleId, detail: `Microbial sample collected (${m.id}). Sent to laboratory.` });
    get().toast("pass", `Microbial sample collected for ${m.vehicleId}`);
  },
  recordMicro: (id, result, note) => {
    const s = get();
    const m = s.micro.find((x) => x.id === id);
    if (!m || m.status !== "collected") return;
    const by = currentUserId(s.role);
    set({ micro: s.micro.map((x) => (x.id === id ? { ...x, status: "complete", result, resultTs: Date.now(), reviewedBy: by, note } : x)) });
    get().log({ actor: by, role: s.role, action: "approval", target: m.vehicleId, detail: `Microbial result ${result.toUpperCase()} recorded (${m.id})${note ? `: ${note}` : ""}` });
    get().toast(result === "pass" ? "pass" : "fail", `Microbial result ${result} for ${m.vehicleId}`);
  },
  resetDemo: () => {
    try { localStorage.removeItem(PERSIST_KEY); } catch {}
    const employees = makeEmployees();
    const vehicles = makeVehicles();
    const seed = makeSeed(vehicles, employees);
    set({ matrix: defaultMatrix(), micro: makeMicro(vehicles), perms: { operator: ["sample"], supervisor: ["verify", "release", "amend", "export"], manager: ["export"], admin: ["admin", "export"] }, employees, vehicles, ...seed, notices: seed.notices, locations: LOCATIONS, amendments: [], activeLocation: "all", offline: false, queued: 0 });
    get().toast("info", "Demo data reset");
  },
  releaseHold: (holdId) => {
    const s = get();
    const h = s.holds.find((x) => x.id === holdId);
    if (!h || h.state !== "resampled" || !s.perms[s.role]?.includes("release")) return;
    const actor = currentUserId(s.role);
    set({
      holds: s.holds.map((x) => (x.id === holdId ? { ...x, state: "released", events: [...x.events, { type: "release", ts: Date.now(), actor, note: "Authorised release, countersigned" }] } : x)),
      notices: [{ id: uid(), ts: Date.now(), kind: "info", text: `${h.vehicleId} released for fuelling`, read: false }, ...s.notices],
    });
    get().log({ actor, role: s.role, action: "release", target: h.vehicleId, detail: "Authorised release, countersigned" });
    get().toast("pass", `${h.vehicleId} released`);
  },
}));

// ---- selectors / helpers ------------------------------------------------------
export function holdFor(holds: Hold[], vehicleId: string) {
  return holds.find((h) => h.vehicleId === vehicleId && h.state !== "released");
}
export function empName(employees: Employee[], id: string, lang: Lang) {
  const e = employees.find((x) => x.id === id);
  if (!e) return id;
  return lang === "ar" ? e.nameAr : e.name;
}
