import type { OccasionId, PointId, VehicleType } from "./types";

export const POINTS: Record<PointId, { code: string; label: string; labelAr: string; tank: boolean }> = {
  tank_sump: { code: "TS", label: "Tank sump", labelAr: "حوض الخزان", tank: true },
  filter_sump: { code: "FS", label: "Filter sump", labelAr: "حوض المرشح", tank: false },
  filter_outlet: { code: "FO", label: "Filter outlet", labelAr: "مخرج المرشح", tank: false },
  tank_drain: { code: "TD", label: "Tank drain", labelAr: "مصرف الخزان", tank: true },
};
export const POINT_ORDER: PointId[] = ["tank_sump", "filter_sump", "filter_outlet", "tank_drain"];

export const OCCASIONS: Record<OccasionId, { label: string; labelAr: string; points: PointId[]; refuellerOnly?: boolean }> = {
  start_shift: { label: "Start of morning shift", labelAr: "بداية الوردية الصباحية", points: ["tank_sump", "filter_sump", "filter_outlet"] },
  during_fuelling: { label: "During fuelling", labelAr: "أثناء التزويد", points: ["filter_outlet"] },
  after_fuelling: { label: "After fuelling", labelAr: "بعد التزويد", points: ["filter_sump"], refuellerOnly: true },
  after_wash: { label: "After wash", labelAr: "بعد الغسيل", points: ["tank_drain", "filter_sump"] },
  after_rain: { label: "After heavy rain", labelAr: "بعد أمطار غزيرة", points: ["tank_drain", "filter_sump"] },
  after_maintenance: { label: "After maintenance", labelAr: "بعد الصيانة", points: ["tank_drain", "filter_sump"] },
};
export const OCCASION_ORDER = Object.keys(OCCASIONS) as OccasionId[];

export function pointsForVehicle(type: VehicleType): PointId[] {
  return POINT_ORDER.filter((p) => type === "refueller" || !POINTS[p].tank);
}

/** Points required for an occasion on a given equipment type, per the proposed matrix. */
export function applicablePoints(occasion: OccasionId, type: VehicleType): PointId[] {
  const o = OCCASIONS[occasion];
  if (o.refuellerOnly && type !== "refueller") return [];
  return o.points.filter((p) => type === "refueller" || !POINTS[p].tank);
}

export const DP_RANGE = { min: 0.1, max: 1.0, unit: "bar" };

export const ROLE_META: Record<string, { label: string; labelAr: string; desc: string; descAr: string }> = {
  operator: { label: "Operator", labelAr: "مشغّل", desc: "Perform sampling, sign checks", descAr: "إجراء أخذ العينات والتوقيع" },
  supervisor: { label: "Supervisor", labelAr: "مشرف", desc: "Review, verify, return, countersign", descAr: "المراجعة والتحقق والإرجاع والتوقيع المشترك" },
  manager: { label: "Manager", labelAr: "مدير", desc: "Read-only dashboards and reports", descAr: "لوحات وتقارير للقراءة فقط" },
  admin: { label: "Admin", labelAr: "مسؤول النظام", desc: "Manage locations, fleet, users, tags", descAr: "إدارة المواقع والأسطول والمستخدمين والعلامات" },
};

export type MatrixConfig = Record<OccasionId, PointId[]>;
export const defaultMatrix = (): MatrixConfig => Object.fromEntries(OCCASION_ORDER.map((o) => [o, [...OCCASIONS[o].points]])) as MatrixConfig;
/** Applicable points for an occasion on an equipment type, from an editable matrix. */
export function applicableWith(m: MatrixConfig, occasion: OccasionId, type: VehicleType): PointId[] {
  const o = OCCASIONS[occasion];
  if (o.refuellerOnly && type !== "refueller") return [];
  return (m[occasion] ?? o.points).filter((p) => type === "refueller" || !POINTS[p].tank);
}
