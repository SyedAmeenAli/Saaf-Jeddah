"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookLock, Grid3x3, Lock, MapPin, Nfc, Plus, Truck, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCan, useT } from "@/lib/hooks";
import { OCCASION_ORDER, OCCASIONS, POINTS, POINT_ORDER, ROLE_META, applicablePoints } from "@/lib/domain";
import { Button, Field, PageHeader, StatusBadge, inputCls } from "@/components/ui/Glass";
import { cn } from "@/lib/utils";

const ICON = { users: Users, locations: MapPin, vehicles: Truck, tags: Nfc, matrix: Grid3x3, jig: BookLock } as const;
type Tab = "users" | "locations" | "vehicles" | "tags" | "matrix" | "jig";

export type AdminTab = Tab;
export function AdminConsole({ only, title, sub }: { only?: Tab; title?: string; sub?: string }) {
  const t = useT();
  const can = useCan();
  const lang = useStore((s) => s.lang);
  const employees = useStore((s) => s.employees);
  const locations = useStore((s) => s.locations);
  const vehicles = useStore((s) => s.vehicles);
  const assignTag = useStore((s) => s.assignTag);
  const addLocation = useStore((s) => s.addLocation);
  const addVehicle = useStore((s) => s.addVehicle);
  const toast = useStore((s) => s.toast);
  const router = useRouter();
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>(only ?? "users");
  const [vid, setVid] = useState(sp.get("v") && vehicles.some((x) => x.id === sp.get("v")) ? (sp.get("v") as string) : vehicles[0]?.id ?? "REF-001");
  const [pt, setPt] = useState<(typeof POINT_ORDER)[number]>("filter_sump");
  const [tag, setTag] = useState("");
  const [custom, setCustom] = useState<Record<string, boolean>>({});
  const v = vehicles.find((x) => x.id === vid)!;
  const editable = can("admin");

  const tabs: [Tab, string][] = [["users", t("Users & roles")], ["locations", t("Locations")], ["vehicles", t("Vehicles")], ["tags", t("Tag management")], ["matrix", t("Matrix editor")], ["jig", "Settings · JIG version"]];
  return (
    <>
      <PageHeader title={title ?? t("Admin")} sub={sub ?? "Manage locations, vehicles, users, tags and the sampling matrix."} actions={!editable ? <StatusBadge kind="info">{t("Read-only for this role")}</StatusBadge> : <StatusBadge kind="locked">Submitted records stay locked</StatusBadge>} />
      <div className={cn("mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6", only && "hidden")} role="tablist">
        {tabs.map(([k, l]) => {
          const I = ICON[k];
          return (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("glass flex flex-col items-start gap-3 p-4 text-start transition-colors", tab === k ? "!border-teal bg-teal/10" : "hover:bg-white/10")} style={{ borderRadius: 16 }}>
              <I size={22} strokeWidth={1.5} className={tab === k ? "text-teal" : "text-muted"} />
              <span className="text-sm font-semibold">{l}</span>
            </button>
          );
        })}
      </div>

      <div className="glass p-5 md:p-6" style={{ borderRadius: 20 }}>
        {tab === "users" && (
          <div className="overflow-x-auto"><table className="tbl min-w-[32rem]"><thead><tr><th className="py-2 text-start">ID</th><th className="text-start">Name</th><th className="text-start">{t("Role")}</th><th className="text-start">{t("Location")}</th></tr></thead>
            <tbody>{employees.map((e) => <tr key={e.id} className="border-t border-hair cursor-pointer hover:bg-white/5" tabIndex={0} onClick={() => router.push(`/users?open=${e.id}`)} onKeyDown={(ev) => { if (ev.key === "Enter") router.push(`/users?open=${e.id}`); }}><td className="py-2.5 font-mono">{e.id}</td><td>{lang === "ar" ? e.nameAr : e.name}</td>
              <td><StatusBadge kind={e.role === "admin" ? "info" : e.role === "supervisor" ? "pending" : e.role === "manager" ? "locked" : "pass"}>{ROLE_META[e.role].label}</StatusBadge></td><td className="font-mono text-xs">{e.locationId}</td></tr>)}</tbody></table>
            <div className="mt-3 flex items-center justify-between"><p className="flex items-center gap-2 text-xs text-muted"><Users size={13} /> {employees.length} users · Demo data</p><Button onClick={() => router.push("/users")}>Manage users</Button></div></div>
        )}
        {tab === "locations" && (
          <div className="space-y-3">
            {locations.map((l) => <div key={l.id} className="flex items-center gap-3 rounded-2xl bg-hi px-4 py-3"><span className="font-mono text-sm">{l.id}</span><span className="flex-1 text-sm">{lang === "ar" ? l.nameAr : l.name}</span><span className="text-xs text-muted">{vehicles.filter((x) => x.locationId === l.id).length} vehicles</span></div>)}
            <Button disabled={!editable} onClick={() => addLocation(`Location ${String(locations.length + 1).padStart(2, "0")} – Demo Apron`, "الموقع – ساحة تجريبية")}><Plus size={16} /> {t("Add location")}</Button>
          </div>
        )}
        {tab === "vehicles" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">{vehicles.map((x) => <div key={x.id} className="rounded-xl bg-hi px-3 py-2 text-sm"><span className="font-mono font-semibold">{x.id}</span> <span className="text-xs text-muted">· {x.locationId}</span></div>)}</div>
            <div className="flex gap-2"><Button disabled={!editable} onClick={() => addVehicle("refueller", "LOC01")}><Plus size={16} /> + REF</Button><Button disabled={!editable} onClick={() => addVehicle("dispenser", "LOC01")}><Plus size={16} /> + DSP</Button></div>
          </div>
        )}
        {tab === "tags" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label={t("Vehicle")}><select className={inputCls} value={vid} onChange={(e) => setVid(e.target.value)}>{vehicles.map((x) => <option key={x.id} className="text-black">{x.id}</option>)}</select></Field>
            <Field label={t("Sampling point")}><select className={inputCls} value={pt} onChange={(e) => setPt(e.target.value as typeof pt)}>{POINT_ORDER.filter((p) => v?.type === "refueller" || !POINTS[p].tank).map((p) => <option key={p} value={p} className="text-black">{POINTS[p].label}</option>)}</select></Field>
            <Field label={`${t("NFC tag")} ID`} hint={`Current: ${v?.tags[pt] ?? "none"}`}><input className={cn(inputCls, "font-mono")} value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} placeholder="NFC-XXXXXXXX" /></Field>
            <Button variant="primary" disabled={!editable || tag.length < 6} onClick={() => { assignTag(vid, pt, tag); setTag(""); }}><Nfc size={16} /> Assign tag</Button>
          </div>
        )}
        {tab === "matrix" && (
          <div className="overflow-x-auto"><table className="tbl min-w-[34rem]"><thead><tr><th className="py-2 text-start">{t("Occasion")}</th>{POINT_ORDER.map((p) => <th key={p}>{POINTS[p].label}</th>)}</tr></thead>
            <tbody>{OCCASION_ORDER.map((o) => <tr key={o} className="border-t border-hair"><td className="py-2.5">{OCCASIONS[o].label}</td>
              {POINT_ORDER.map((p) => { const k = `${o}-${p}`; const base = applicablePoints(o, "refueller").includes(p); const on = custom[k] ?? base; return <td key={p} className="text-center"><input type="checkbox" aria-label={`${OCCASIONS[o].label} ${POINTS[p].label}`} checked={on} disabled={!editable} onChange={(e) => { setCustom({ ...custom, [k]: e.target.checked }); toast("info", "Matrix editor is UI-only in this demo"); }} className="size-5 accent-[var(--teal)]" /></td>; })}</tr>)}</tbody></table>
            <p className="mt-3 text-xs text-muted">UI only. Changes here are not persisted. Matrix must be approved by APSCO QC.</p></div>
        )}
        {tab === "jig" && (
          <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-2xl bg-hi p-5"><BookLock className="mt-1 text-teal" /><div>
              <p className="font-display text-xl font-semibold">JIG 1 Issue 13 / JIG 2 Issue 13</p><p className="text-sm text-muted">Rule set v1 · JIG-aligned</p></div></div>
            <p className="text-sm text-muted">Rules are version-controlled and configurable for future issues. Each submitted record stores the rule-set version it was captured under, so history stays valid when a new issue is adopted.</p>
            <p className="flex items-center gap-2 text-xs text-faint"><Lock size={12} /> Final checklist and acceptance criteria to be approved by APSCO Quality Control against controlled copies of the applicable standards.</p>
          </div>
        )}
      </div>
    </>
  );
}


export default function AdminPage() { return <AdminConsole />; }
