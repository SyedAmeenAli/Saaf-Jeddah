import {
  LayoutDashboard, MapPinned, Truck, Grid3x3, ScanLine, ClipboardCheck, OctagonAlert, FileBarChart, ScrollText, Settings2, GraduationCap, Cpu, Smartphone, FlaskConical, Users, SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem { href: string; label: string; icon: LucideIcon; roles: Role[]; sub: string }
const ALL: Role[] = ["operator", "supervisor", "manager", "admin"];

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL, sub: "Fuel Quality Assurance Overview" },
  { href: "/scan", label: "Sampling", icon: ScanLine, roles: ["operator", "supervisor"], sub: "Scan a sampling point and record the check" },
  { href: "/records", label: "Inspections", icon: FlaskConical, roles: ALL, sub: "Every sampling record, with status and signatures" },
  { href: "/fleet", label: "Fleet", icon: Truck, roles: ALL, sub: "Refuellers and hydrant dispensers" },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck, roles: ["supervisor"], sub: "Supervisor verification inbox" },
  { href: "/holds", label: "Failures", icon: OctagonAlert, roles: ALL, sub: "Failure management and corrective action" },
  { href: "/reports", label: "Reports", icon: FileBarChart, roles: ["supervisor", "manager", "admin"], sub: "Reports and analytics" },
  { href: "/locations", label: "Locations", icon: MapPinned, roles: ALL, sub: "Operating locations" },
  { href: "/matrix", label: "Sampling matrix", icon: Grid3x3, roles: ALL, sub: "Occasions, sampling points and equipment" },
  { href: "/audit", label: "Audit log", icon: ScrollText, roles: ["supervisor", "manager", "admin"], sub: "Append-only record of every action" },
  { href: "/training", label: "Training", icon: GraduationCap, roles: ALL, sub: "Operator qualification and authorisation" },
  { href: "/users", label: "Users", icon: Users, roles: ["supervisor", "manager", "admin"], sub: "People, roles and qualifications" },
  { href: "/admin", label: "Administration", icon: Settings2, roles: ["admin"], sub: "Users, vehicles, tags and settings" },
  { href: "/hardware", label: "Hardware & setup", icon: Cpu, roles: ALL, sub: "NFC tags, readers and offline sync" },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal, roles: ALL, sub: "Preferences, operations and demo data" },
  { href: "/mobile", label: "Mobile app", icon: Smartphone, roles: ALL, sub: "Operator flow on a phone" },
];

export const MOBILE_TABS: Record<Role, string[]> = {
  operator: ["/dashboard", "/fleet", "/scan", "/holds"],
  supervisor: ["/dashboard", "/approvals", "/scan", "/holds"],
  manager: ["/dashboard", "/locations", "/reports", "/audit"],
  admin: ["/dashboard", "/fleet", "/admin", "/reports"],
};
