"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Barcode, Lock, Nfc, Wand2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCan, useT } from "@/lib/hooks";
import { POINTS, pointsForVehicle } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Button, Chip, Field, GlassDropdown, PageHeader, SearchField, StatusBadge, inputCls } from "@/components/ui/Glass";
import type { PointId } from "@/lib/types";
import { T } from "@/components/ui/T";

type Kind = "NFC" | "BAR";
const kindOf = (tag?: string): Kind | null => (tag ? (tag.toUpperCase().startsWith("BAR") ? "BAR" : "NFC") : null);

export default function PointsPage() {
  const t = useT();
  const can = useCan();
  const vehicles = useStore((s) => s.vehicles);
  const assign = useStore((s) => s.assignTag);
  const sp = useSearchParams();
  const first = sp.get("v") && vehicles.some((v) => v.id === sp.get("v")) ? (sp.get("v") as string) : vehicles[0]?.id ?? "REF-001";
  const [vid, setVid] = useState(first);
  const v = vehicles.find((x) => x.id === vid) ?? vehicles[0];
  const pts = pointsForVehicle(v.type);
  const [pt, setPt] = useState<PointId>(pts[0]);
  const point = pts.includes(pt) ? pt : pts[0];
  const [kind, setKind] = useState<Kind>("NFC");
  const [tag, setTag] = useState("");
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | "unassigned">("all");
  const editable = can("admin");

  const all = useMemo(() => vehicles.flatMap((x) => pointsForVehicle(x.type).map((p) => ({ v: x, p, tag: x.tags[p] }))), [vehicles]);
  const used = useMemo(() => new Map(all.filter((r) => r.tag).map((r) => [r.tag!.toUpperCase(), `${r.v.id} · ${POINTS[r.p].label}`])), [all]);
  const val = tag.trim().toUpperCase();
  const owner = val ? used.get(val) : undefined;
  const mine = v.tags[point]?.toUpperCase() === val;
  const err = !val ? "" : !/^(NFC|BAR)-[A-Z0-9-]{4,}$/.test(val) ? "Use NFC-… or BAR-… followed by at least 4 letters or digits" : owner && !mine ? `Already assigned to ${owner}` : "";
  const rows = all.filter((r) => (f === "all" || !r.tag) && `${r.v.id} ${POINTS[r.p].label} ${r.tag ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const gen = () => setTag(`${kind}-${v.id.replace("-", "")}-${POINTS[point].code}-${Math.floor(100 + Math.random() * 900)}`);

  return (
    <>
      <PageHeader title={t("Sampling Points & Tags")} sub="Assign NFC and barcode tags to each sampling point. Hydrant dispensers have no tank points."
        actions={editable ? <StatusBadge kind="locked"><Lock size={11} className="me-1" /><T>{"Changes are audited"}</T></StatusBadge> : <StatusBadge kind="info">{t("Read-only for this role")}</StatusBadge>} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <section className="glass space-y-4 p-5 xl:col-span-2" style={{ borderRadius: 20 }}>
          <h2 className="text-base font-semibold"><T>{"Assign tag"}</T></h2>
          <Field label="Vehicle"><GlassDropdown label="Vehicle" value={vid} onChange={setVid} options={vehicles.map((x) => [x.id, `${x.id} · ${x.locationId}`] as const)} /></Field>
          <Field label="Sampling point"><GlassDropdown label="Sampling point" value={point} onChange={(p) => setPt(p as PointId)} options={pts.map((p) => [p, POINTS[p].label] as const)} /></Field>
          <div><p className="mb-1.5 text-sm font-medium text-muted"><T>{"Identification type"}</T></p><div className="flex gap-2"><Chip active={kind === "NFC"} onClick={() => setKind("NFC")} icon={<Nfc size={14} />}><T>{"NFC tag"}</T></Chip><Chip active={kind === "BAR"} onClick={() => setKind("BAR")} icon={<Barcode size={14} />}><T>{"Barcode"}</T></Chip></div></div>
          <Field label="Tag ID" hint={`Current: ${v.tags[point] ?? "none"}`}>
            <div className="flex gap-2"><input className={cn(inputCls, "font-mono", err && "!border-fail")} aria-label="Tag ID" aria-invalid={!!err} placeholder={`${kind}-XXXXXXXX`} value={tag} onChange={(e) => setTag(e.target.value)} disabled={!editable} /><Button variant="secondary" onClick={gen} disabled={!editable} aria-label="Generate tag ID"><Wand2 size={16} /></Button></div>
            {err && <span className="mt-1 block text-xs text-fail-fg">{err}</span>}
          </Field>
          <Button variant="primary" size="lg" className="w-full" disabled={!editable || !val || !!err} onClick={() => { assign(v.id, point, val); setTag(""); }}><T>{"Assign tag"}</T></Button>
        </section>

        <section className="glass p-5 xl:col-span-3" style={{ borderRadius: 20 }}>
          <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="me-auto text-base font-semibold"><T>{"Tag registry"}</T></h2><Chip active={f === "all"} onClick={() => setF("all")}>All ({all.length})</Chip><Chip active={f === "unassigned"} onClick={() => setF("unassigned")}>Unassigned ({all.filter((r) => !r.tag).length})</Chip></div>
          <div className="mb-3 flex"><SearchField value={q} onChange={setQ} placeholder="Vehicle, point or tag ID…" /></div>
          <div className="max-h-[32rem] overflow-auto">
            <table className="tbl min-w-[32rem]"><thead><tr><th><T>{"Vehicle"}</T></th><th><T>{"Point"}</T></th><th><T>{"Tag ID"}</T></th><th><T>{"Type"}</T></th><th /></tr></thead>
              <tbody>{rows.slice(0, 80).map((r) => (
                <tr key={`${r.v.id}${r.p}`}><td className="font-mono font-medium">{r.v.id}</td><td>{POINTS[r.p].label}</td><td className="font-mono text-xs text-muted">{r.tag ?? <span className="text-pending-fg"><T>{"Unassigned"}</T></span>}</td><td>{r.tag ? <StatusBadge kind="info">{kindOf(r.tag) === "BAR" ? "Barcode" : "NFC"}</StatusBadge> : null}</td>
                  <td className="text-end"><button type="button" disabled={!editable} onClick={() => { setVid(r.v.id); setPt(r.p); setTag(""); }} className="btn-secondary h-8 rounded-xl px-3 text-xs disabled:opacity-40">{r.tag ? "Reassign" : "Assign"}</button></td></tr>
              ))}</tbody></table>
            {rows.length > 80 && <p className="mt-2 text-xs text-faint">Showing 80 of {rows.length}. Search to narrow.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
