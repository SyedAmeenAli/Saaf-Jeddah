import {
  LayoutDashboard, MapPinned, Truck, Grid3x3, ScanLine, ClipboardCheck, OctagonAlert, FileBarChart, ScrollText, Settings2, GraduationCap, Smartphone,
  FlaskConical, Users, SlidersHorizontal, Inbox, ShieldAlert, Activity, LineChart, Gauge, UserCog, Tags, KeyRound, Boxes, BriefcaseBusiness, History, Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem { href: string; label: string; icon: LucideIcon; sub: string; group: string }
export interface FlatNavItem extends NavItem { roles: Role[] }

const n = (group: string, href: string, label: string, icon: LucideIcon, sub: string): NavItem => ({ group, href, label, icon, sub });

/** Each role has its own information architecture, labels and landing page. */
export const ROLE_NAV: Record<Role, NavItem[]> = {
  operator: [
    n("Field", "/dashboard", "Today", LayoutDashboard, "Your shift, tasks and equipment on hold"),
    n("Field", "/fleet", "Fleet", Truck, "Refuellers and hydrant dispensers"),
    n("Field", "/scan", "Scan", ScanLine, "Identify a sampling point and record the check"),
    n("Field", "/records", "My Records", FlaskConical, "Samples you have submitted and their status"),
    n("Safety", "/holds", "Equipment on hold", OctagonAlert, "Do not fuel. Failures and re-samples"),
    n("More", "/training", "Training", GraduationCap, "Your qualification and authorisation"),
    n("More", "/settings", "Settings", SlidersHorizontal, "Language, sound and display"),
  ],
  supervisor: [
    n("Quality", "/dashboard", "Overview", LayoutDashboard, "What needs your attention right now"),
    n("Quality", "/approvals", "Review Queue", Inbox, "Submitted samples awaiting verification"),
    n("Quality", "/holds", "Failed Samples", ShieldAlert, "Failure investigation and release"),
    n("Quality", "/equipment", "Equipment Holds", Wrench, "Vehicles that must not fuel"),
    n("Monitor", "/activity", "Sampling Activity", Activity, "Location-wise sampling and overdue checks"),
    n("Monitor", "/records", "All Inspections", FlaskConical, "Every sampling record"),
    n("Monitor", "/scan", "Sampling", ScanLine, "Record a check in the field"),
    n("Records", "/reports", "Reports", FileBarChart, "Reports with PDF and Excel export"),
    n("Records", "/audit", "Audit Trail", ScrollText, "Append-only record of every action"),
    n("More", "/settings", "Settings", SlidersHorizontal, "Language, sound and display"),
  ],
  manager: [
    n("Intelligence", "/dashboard", "Executive Overview", LayoutDashboard, "Performance across all locations"),
    n("Intelligence", "/locations", "Locations", MapPinned, "Location 01, 02 and 03 analytics"),
    n("Intelligence", "/fleet-performance", "Fleet Performance", Gauge, "Refuellers and dispensers ranked by quality"),
    n("Intelligence", "/analytics", "Quality Analytics", LineChart, "Trends, repeat failures and occasions"),
    n("Intelligence", "/employees", "Employee Performance", BriefcaseBusiness, "Sampling activity and qualification"),
    n("Records", "/reports", "Reports", FileBarChart, "Reports with PDF and Excel export"),
    n("Records", "/audit", "Audit Viewer", ScrollText, "Read-only audit trail"),
    n("More", "/settings", "Settings", SlidersHorizontal, "Language and display"),
  ],
  admin: [
    n("Console", "/dashboard", "Overview", LayoutDashboard, "System health and configuration status"),
    n("Console", "/users", "Users", Users, "People, roles and qualifications"),
    n("Console", "/locations", "Locations", MapPinned, "Operating locations"),
    n("Registry", "/assets", "Assets & Fleet", Boxes, "Vehicle and equipment registry"),
    n("Registry", "/points", "Sampling Points & Tags", Tags, "NFC and barcode tag assignment"),
    n("Registry", "/matrix", "Sampling Matrix", Grid3x3, "Approved occasions and sampling points"),
    n("Governance", "/permissions", "Permissions", KeyRound, "What each role can see and do"),
    n("Governance", "/audit", "Audit Log", History, "Append-only record of every action"),
    n("Governance", "/settings", "Settings", Settings2, "System, demo data and JIG version"),
  ],
};

/** Flat de-duplicated list (for command palette, titles, route guards). */
export const NAV: FlatNavItem[] = (() => {
  const m = new Map<string, FlatNavItem>();
  (Object.keys(ROLE_NAV) as Role[]).forEach((r) => ROLE_NAV[r].forEach((i) => {
    const e = m.get(i.href);
    if (e) e.roles.push(r); else m.set(i.href, { ...i, roles: [r] });
  }));
  return [...m.values()];
})();

/** Extra routes any signed-in role may visit (not in its menu). */
export const SHARED_ROUTES = ["/settings", "/mobile", "/design", "/hardware", "/fleet", "/records", "/holds", "/locations", "/matrix", "/training"];

/** Mobile bottom bar: two left tabs, optional centre action, two right tabs (last is always More). */
export const MOBILE_TABS: Record<Role, { left: [string, string]; centre?: string; right: string }> = {
  operator: { left: ["/dashboard", "/fleet"], centre: "/scan", right: "/records" },
  supervisor: { left: ["/dashboard", "/approvals"], centre: "/scan", right: "/holds" },
  manager: { left: ["/dashboard", "/locations"], right: "/analytics" },
  admin: { left: ["/dashboard", "/users"], right: "/assets" },
};

export const roleHome = () => "/dashboard";
export const MOBILE_ICON = Smartphone;
export { ClipboardCheck, UserCog };
