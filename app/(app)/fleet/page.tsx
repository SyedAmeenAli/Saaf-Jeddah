"use client";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCan, useT } from "@/lib/hooks";
import { vehicleStatus } from "@/lib/selectors";
import { cn, ago } from "@/lib/utils";
import { Button, Chip, Empty, Field, Modal, PageHeader, Rise, SearchField, Stagger, inputCls } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { HoldBanner, StatusPill, VehicleDetail } from "@/components/features/Details";
import { DispenserSvg, TruckSvg } from "@/components/illustrations/Vehicles";
import type { VehicleType } from "@/lib/types";

export default function FleetPage() {
  const t = useT();
  const can = useCan();
  const vehicles = useStore((s) => s.vehicles);
  const checks = useStore((s) => s.checks);
  const holds = useStore((s) => s.holds);
  const due = useStore((s) => s.due);
  const locations = useStore((s) => s.locations);
  const active = useStore((s) => s.activeLocation);
  const addVehicle = useStore((s) => s.addVehicle);
  const [type, setType] = useState<"all" | VehicleType>("all");
  const [loc, setLoc] = useState("all");
  const [st, setSt] = useState("all");
  const [q, setQ] = useState("");
  const [grid, setGrid] = useState(false);
  const [modal, setModal] = useState(false);
  const [nt, setNt] = useState<VehicleType>("refueller");
  const [nl, setNl] = useState("LOC01");

  const rows = useMemo(() => vehicles
    .map((v) => ({ v, s: vehicleStatus(v, holds, due, checks) }))
    .filter(({ v, s }) => (type === "all" || v.type === type) && (loc === "all" || v.locationId === loc) && (active === "all" || v.locationId === active)
      && (st === "all" || (st === "attention" ? s !== "ok" : s === st)) && v.id.toLowerCase().includes(q.toLowerCase())),
  [vehicles, holds, due, checks, type, loc, st, q, active]);

  return (
    <ExpandGroup>
      <PageHeader
        title={t("Fleet")}
        sub={`${rows.length} / ${vehicles.length} · ${t("Refuellers")} + ${t("Hydrant dispensers")} · ${t("Demo data")}`}
        actions={can("admin") ? <Button variant="primary" onClick={() => setModal(true)}><Plus size={18} /> {t("Add vehicle")}</Button> : <span className="text-xs text-muted">{t("Read-only for this role")}</span>}
      />
      <div className="glass mb-5 flex flex-wrap items-center gap-2 p-3" style={{ borderRadius: 8 }}>
        <SearchField value={q} onChange={setQ} placeholder={`${t("Search")} REF-014…`} />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Chip active={type === "all"} onClick={() => setType("all")}>{t("All")} ({vehicles.length})</Chip>
          <Chip active={type === "refueller"} onClick={() => setType("refueller")}>{t("Refuellers")} ({vehicles.filter((v) => v.type === "refueller").length})</Chip>
          <Chip active={type === "dispenser"} onClick={() => setType("dispenser")}>{t("Hydrant dispensers")} ({vehicles.filter((v) => v.type === "dispenser").length})</Chip>
          <span className="mx-1 w-px bg-hair-strong" />
          {["all", ...locations.map((l) => l.id)].map((l) => <Chip key={l} active={loc === l} onClick={() => setLoc(l)}>{l === "all" ? t("All") : l}</Chip>)}
          <span className="mx-1 w-px bg-hair-strong" />
          {[["all", t("All")], ["hold", "HOLD"], ["attention", t("Needs attention")], ["ok", "OK"]].map(([k, l]) => <Chip key={k} active={st === k} onClick={() => setSt(k)}>{l}</Chip>)}
        </div>
        <div className="ms-auto flex rounded-full bg-hi p-1" role="group" aria-label="View">
          <button aria-label={t("Grid")} aria-pressed={grid} onClick={() => setGrid(true)} className={cn("flex size-9 items-center justify-center rounded-full", grid && "bg-teal/25")}><LayoutGrid size={16} /></button>
          <button aria-label={t("List")} aria-pressed={!grid} onClick={() => setGrid(false)} className={cn("flex size-9 items-center justify-center rounded-full", !grid && "bg-teal/25")}><List size={16} /></button>
        </div>
      </div>

      {rows.length === 0 && <Empty title={t("No records")} sub="Try clearing a filter." />}
      <Stagger className={grid ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "flex flex-col gap-2"}>
        {rows.map(({ v, s }) => {
          const last = checks.find((c) => c.vehicleId === v.id);
          return (
            <Rise key={v.id}>
              <ExpandCard
                id={v.id} title={`${v.id} · ${v.type === "refueller" ? t("Refueller") : t("Hydrant dispenser")}`}
                card={grid ? (
                  <div className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-center justify-between"><span className="font-display text-lg font-semibold">{v.id}</span><StatusPill s={s} /></div>
                    <div className="rounded-md border border-hair bg-bg px-3 pt-2">{v.type === "refueller" ? <TruckSvg className="h-24 w-full" /> : <DispenserSvg className="h-24 w-full" />}</div>
                    {s === "hold" && <HoldBanner vehicleId={v.id} compact />}
                    <div className="mt-auto flex items-center justify-between text-xs text-muted"><span>{v.locationId} · {v.type === "refueller" ? t("Refueller") : t("Hydrant dispenser")}</span><span>{last ? ago(last.ts) : "–"}</span></div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-4 py-3">
                    <span className="hidden w-20 shrink-0 sm:block">{v.type === "refueller" ? <TruckSvg className="h-10 w-full" /> : <DispenserSvg className="h-10 w-full" />}</span>
                    <span className="w-20 font-mono text-sm font-semibold">{v.id}</span>
                    <span className="flex-1 text-sm text-muted">{v.type === "refueller" ? t("Refueller") : t("Hydrant dispenser")} · {v.locationId}</span>
                    <span className="hidden text-xs text-muted sm:block">{last ? ago(last.ts) : "–"}</span>
                    <StatusPill s={s} />
                  </div>
                )}
                detail={() => <VehicleDetail vehicle={v} />}
              />
            </Rise>
          );
        })}
      </Stagger>

      <Modal open={modal} onClose={() => setModal(false)} title={t("Add vehicle")}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); addVehicle(nt, nl); setModal(false); }}>
          <Field label={t("Type")}>
            <div className="flex gap-2"><Chip active={nt === "refueller"} onClick={() => setNt("refueller")}>{t("Refueller")}</Chip><Chip active={nt === "dispenser"} onClick={() => setNt("dispenser")}>{t("Hydrant dispenser")}</Chip></div>
          </Field>
          <Field label={t("Location")}>
            <select className={inputCls} value={nl} onChange={(e) => setNl(e.target.value)}>{locations.map((l) => <option key={l.id} value={l.id} className="text-black">{l.name}</option>)}</select>
          </Field>
          <p className="text-xs text-muted">Next ID is generated automatically. NFC tags are assigned per sampling point ({nt === "refueller" ? "4" : "2"} points).</p>
          <Button type="submit" variant="primary" size="lg" className="w-full">{t("Add")}</Button>
        </form>
      </Modal>
    </ExpandGroup>
  );
}
