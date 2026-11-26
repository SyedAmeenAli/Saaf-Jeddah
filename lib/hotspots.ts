import type { PointId, VehicleType } from "./types";

/** Percent of the diagram image width/height. Initial positions are placeholders until APSCO Engineering / QC validate them against the real sampling ports. */
export type Pos = { x: number; y: number; side?: "up" | "down" };
export type HotspotConfig = Record<VehicleType, Partial<Record<PointId, Pos>>>;

export const DIAGRAM = {
  refueller: { src: "/assets/apsco-refueller-cutaway.png", w: 700, h: 215, approved: true },
  dispenser: { src: null, w: 400, h: 210, approved: false },
} as const;

export const defaultHotspots = (): HotspotConfig => ({
  refueller: {
    filter_sump: { x: 24, y: 76, side: "down" },
    filter_outlet: { x: 30.5, y: 57, side: "up" },
    tank_sump: { x: 57, y: 77, side: "down" },
    tank_drain: { x: 92, y: 74, side: "down" },
  },
  dispenser: {
    filter_sump: { x: 54, y: 79, side: "down" },
    filter_outlet: { x: 84.5, y: 56, side: "up" },
  },
});

export type NodeStatus = "pending" | "due" | "completed" | "failed" | "hold" | "na";
export const NODE_STATUS_LABEL: Record<NodeStatus, string> = { pending: "Pending", due: "Due", completed: "Completed", failed: "Failed", hold: "On hold", na: "Not applicable" };
