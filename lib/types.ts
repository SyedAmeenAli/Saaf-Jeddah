export type Role = "operator" | "supervisor" | "manager" | "admin";
export type VehicleType = "refueller" | "dispenser";
export type PointId = "tank_sump" | "filter_sump" | "filter_outlet" | "tank_drain";
export type OccasionId =
  | "start_shift"
  | "during_fuelling"
  | "after_fuelling"
  | "after_wash"
  | "after_rain"
  | "after_maintenance";
export type Res = "pass" | "fail";
export type CheckKind = "sample" | "resample";
export type CheckStatus = "awaiting" | "approved" | "returned";

export interface Location {
  id: string; // LOC01
  name: string;
  nameAr: string;
  zone: string;
}

export interface Vehicle {
  id: string; // REF-014
  type: VehicleType;
  locationId: string;
  tags: Partial<Record<PointId, string>>;
  plate: string;
}

export interface Employee {
  id: string; // EMP-1024
  name: string;
  nameAr: string;
  role: Role;
  locationId: string;
  certExpiry: number; // epoch ms (operators)
}

export interface Check {
  id: string;
  sampleId: string;
  vehicleId: string;
  locationId: string;
  point: PointId;
  occasion: OccasionId;
  employeeId: string;
  ts: number;
  colour: "water-white" | "straw" | "other";
  colourChange: boolean;
  clarity: Res;
  sediment: Res;
  freeWater: Res;
  microbialSigns: "no" | "yes";
  cwd: Res | "na";
  cwdKit: string;
  cwdBatch: string;
  cwdExpiry: string;
  dp: number;
  result: Res;
  status: CheckStatus;
  kind: CheckKind;
  linkedTo?: string;
  failReason?: string;
  supervisorId?: string;
  reviewedTs?: number;
  returnReason?: string;
  synced: boolean;
  note?: string;
}

export interface DueItem {
  id: string;
  vehicleId: string;
  locationId: string;
  point: PointId;
  occasion: OccasionId;
  dueTs: number;
  state: "due" | "overdue";
}

export interface HoldEvent {
  type: "fail" | "resample" | "release";
  ts: number;
  checkId?: string;
  actor: string;
  note: string;
}

export interface Hold {
  id: string;
  vehicleId: string;
  locationId: string;
  point: PointId;
  reason: string;
  state: "hold" | "resampled" | "released";
  events: HoldEvent[];
  openedTs: number;
}

export interface Amendment {
  id: string;
  originalId: string;
  field: string;
  from: string;
  to: string;
  reason: string;
  by: string;
  ts: number;
}

export interface AuditEntry {
  id: string;
  ts: number;
  actor: string;
  role: Role | "system";
  action: "submission" | "approval" | "return" | "amendment" | "config" | "hold" | "release" | "resample";
  target: string;
  detail: string;
}

export interface Notice {
  id: string;
  ts: number;
  kind: "fail" | "overdue" | "info";
  text: string;
  read: boolean;
}

export interface Toast {
  id: string;
  kind: "pass" | "fail" | "info";
  text: string;
}

/** Scheduled microbial monitoring: separate from the visual appearance check. */
export interface MicroTest {
  id: string;
  vehicleId: string;
  locationId: string;
  dueTs: number;
  status: "scheduled" | "collected" | "complete";
  method: string;
  collectedTs?: number;
  collectedBy?: string;
  labRef?: string;
  result?: Res;
  resultTs?: number;
  reviewedBy?: string;
  note?: string;
}
