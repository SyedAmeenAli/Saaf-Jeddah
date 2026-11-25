"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock, Plus, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCan, useT } from "@/lib/hooks";
import { POINTS, pointsForVehicle } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Button, Chip, Field, GlassDropdown, Modal, PageHeader, SearchField, StatusBadge, inputCls } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup, useExpandNav } from "@/components/ui/Expand";
import type { Vehicle, VehicleType } from "@/lib/types";

function VehicleEditor({ v }: { v: Vehicle }) {
  const can = useCan();
  const locations = useStore((s) => s.locations);
  const update = useStore((s) => s.updateVehicle);
  const { close } = useExpandNav();
  const [plate, setPlate] = useState(v.plate);
  const [loc, setLoc] = useState(v.locationId);
  const editable = can("admin");
  const pts = pointsForVehicle(v.type);
  const dirty = plate.trim() !== v.plate || loc !== v.locationId;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3"><span className="font-mono text-3xl font-semibold">{v.id}</span><StatusBadge kind="info">{v.type === "refueller" ? "Refueller" : "Hydrant dispenser"}</StatusBadge>{!editable && <StatusBadge kind="locked"><Lock size={11} className="me-1" />Read-only</StatusBadge>}</div>
      <div className="glass grid grid-cols-1 gap-4 p-5 md:grid-cols-2" style={{ borderRadius: 20 }}>
        <Field label="Registration / plate"><input className={inputCls} value={plate} onChange={(e) => setPlate(e.target.value)} disabled={!editable} aria-label="Plate" /></Field>
        <Field label="Location"><GlassDropdown label="Location" value={loc} onChange={setLoc} options={locations.map((l) => [l.id, l.name] as const)} /></Field>
        {editable && <div className="md:col-span-2"><Button variant="primary" disabled={!dirty || plate.trim().length < 3} onClick={() => { update(v.id, { plate: plate.trim(), locationId: loc }); close(); }}><Save size={16} /> Save changes</Button><span className="ms-3 text-xs text-muted">Changes are written to the audit log.</span></div>}
      </div>
      <div className="glass p-5" style={{ borderRadius: 20 }}>
        <h3 className="mb-3 text-base font-semibold">Sampling points and tags</h3>
        <ul className="divide-y divide-hair">{pts.map((p) => <li key={p} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span>{POINTS[p].label}</span><span className="font-mono text-xs text-muted">{v.tags[p] ?? "No tag"}</span></li>)}</ul>
        {v.type === "dispenser" && <p className="mt-3 text-xs text-faint">Tank sump and tank drain do not apply to hydrant dispensers.</p>}
        <div className="mt-4 flex gap-2"><Link href={`/points?v=${v.id}`} className="btn-secondary inline-flex h-10 items-center rounded-2xl px-4 text-sm">Assign tags</Link><Link href={`/fleet?open=${v.id}`} className="btn-secondary inline-flex h-10 items-center rounded-2xl px-4 text-sm">Open vehicle record</Link></div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const t = useT();
  const can = useCan();
  const vehicles = useStore((s) => s.vehicles);
  const locations = useStore((s) => s.locations);
  const add = useStore((s) => s.addVehicle);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | VehicleType>("all");
  const [open, setOpen] = useState(false);
  const [nType, setNType] = useState<VehicleType>("refueller");
  const [nLoc, setNLoc] = useState("LOC01");
  const editable = can("admin");
  const rows = useMemo(() => vehicles.filter((v) => (type === "all" || v.type === type) && `${v.id} ${v.plate} ${v.locationId}`.toLowerCase().includes(q.toLowerCase())), [vehicles, type, q]);

  return (
    <ExpandGroup>
      <PageHeader title={t("Assets & Fleet")} sub="Register vehicles, edit equipment metadata and review the fleet registry."
        actions={editable ? <Button variant="primary" onClick={() => setOpen(true)}><Plus size={16} /> Register vehicle</Button> : <StatusBadge kind="info">{t("Read-only for this role")}</StatusBadge>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchField value={q} onChange={setQ} placeholder="Vehicle ID, plate or location…" />
        <Chip active={type === "all"} onClick={() => setType("all")}>All ({vehicles.length})</Chip>
        <Chip active={type === "refueller"} onClick={() => setType("refueller")}>Refuellers</Chip>
        <Chip active={type === "dispenser"} onClick={() => setType("dispenser")}>Hydrant dispensers</Chip>
      </div>
      <div className="space-y-2">
        <div className="hidden grid-cols-[1fr_1.2fr_1fr_1fr_1fr] gap-3 px-5 text-xs text-muted md:grid"><span>Vehicle</span><span>Type</span><span>Location</span><span>Plate</span><span>Tags</span></div>
        {rows.map((v) => {
          const pts = pointsForVehicle(v.type), tagged = pts.filter((p) => v.tags[p]).length;
          return (
            <ExpandCard key={v.id} id={v.id} title={`${v.id} · equipment record`}
              card={<div className="grid grid-cols-2 items-center gap-3 px-5 py-3.5 text-sm md:grid-cols-[1fr_1.2fr_1fr_1fr_1fr]"><span className="font-mono font-semibold">{v.id}</span><span className="text-muted">{v.type === "refueller" ? "Refueller" : "Hydrant dispenser"}</span><span className="text-muted">{locations.find((l) => l.id === v.locationId)?.name ?? v.locationId}</span><span className="font-mono text-xs text-muted">{v.plate}</span><span className={cn("text-xs", tagged < pts.length ? "text-pending-fg" : "text-pass-fg")}>{tagged}/{pts.length} tagged</span></div>}
              detail={() => <VehicleEditor v={v} />} />
          );
        })}
        {rows.length === 0 && <p className="glass p-8 text-center text-sm text-muted" style={{ borderRadius: 20 }}>No vehicles match.</p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Register vehicle">
        <div className="space-y-4">
          <div><p className="mb-1.5 text-sm font-medium text-muted">Equipment type</p><div className="flex gap-2"><Chip active={nType === "refueller"} onClick={() => setNType("refueller")}>Refueller</Chip><Chip active={nType === "dispenser"} onClick={() => setNType("dispenser")}>Hydrant dispenser</Chip></div></div>
          <Field label="Location"><GlassDropdown label="Location" value={nLoc} onChange={setNLoc} options={locations.map((l) => [l.id, l.name] as const)} /></Field>
          <p className="text-xs text-muted">An ID, plate and one tag per sampling point are generated. {nType === "dispenser" ? "Dispensers get filter points only." : "Refuellers get tank and filter points."}</p>
          <Button variant="primary" size="lg" className="w-full" onClick={() => { add(nType, nLoc); setOpen(false); }}><Plus size={18} /> Register {nType === "refueller" ? "refueller" : "dispenser"}</Button>
        </div>
      </Modal>
    </ExpandGroup>
  );
}
