"use client";
import { useState } from "react";
import { Plus, Truck, Droplets, OctagonAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCan, useT } from "@/lib/hooks";
import { Button, Field, Modal, PageHeader, Rise, Stagger, StatusBadge, inputCls } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { LocationDetail, LocationStats } from "@/components/features/Details";

export default function LocationsPage() {
  const t = useT();
  const can = useCan();
  const lang = useStore((s) => s.lang);
  const locations = useStore((s) => s.locations);
  const vehicles = useStore((s) => s.vehicles);
  const checks = useStore((s) => s.checks);
  const due = useStore((s) => s.due);
  const holds = useStore((s) => s.holds);
  const add = useStore((s) => s.addLocation);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");

  return (
    <ExpandGroup>
      <PageHeader
        title={t("Locations")}
        sub={`${locations.length} · Jeddah · ${t("Demo data")}`}
        actions={can("admin") ? <Button variant="primary" onClick={() => setModal(true)}><Plus size={18} /> {t("Add location")}</Button> : <span className="text-xs text-muted">{t("Read-only for this role")}</span>}
      />
      <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {locations.map((l) => {
          const st = LocationStats(l.id, vehicles, checks, due, holds);
          const nm = lang === "ar" ? l.nameAr : l.name;
          return (
            <Rise key={l.id}>
              <ExpandCard
                id={l.id} title={nm}
                card={
                  <div className="flex h-full flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-5 pt-5"><span className="rounded-lg border border-hair bg-white/[0.06] px-2 py-1 font-mono text-xs text-muted">{l.id}</span></div>
                    <div className="space-y-4 p-5 pt-3">
                      <div><h3 className="font-display text-lg font-semibold leading-snug">{nm}</h3><p className="text-xs text-muted">{l.zone}</p></div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-2xl bg-hi p-2"><Truck size={15} className="mx-auto text-sky" /><p className="font-display text-xl font-semibold">{st.fleet}</p><p className="text-[10px] text-muted">{t("Fleet size")}</p></div>
                        <div className="rounded-2xl bg-hi p-2"><Droplets size={15} className="mx-auto text-teal" /><p className="font-display text-xl font-semibold">{Math.round(st.pct * 100)}%</p><p className="text-[10px] text-muted">{t("Completion today")}</p></div>
                        <div className="rounded-2xl bg-hi p-2"><OctagonAlert size={15} className="mx-auto text-fail-fg" /><p className="font-display text-xl font-semibold">{st.open}</p><p className="text-[10px] text-muted">{t("Open failures")}</p></div>
                      </div>
                      {st.open > 0 ? <StatusBadge kind="fail">HOLD · {st.open}</StatusBadge> : <StatusBadge kind="pass">OK</StatusBadge>}
                    </div>
                  </div>
                }
                detail={() => <LocationDetail location={l} />}
              />
            </Rise>
          );
        })}
      </Stagger>

      <Modal open={modal} onClose={() => setModal(false)} title={t("Add location")}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { add(name.trim(), nameAr.trim()); setModal(false); setName(""); setNameAr(""); } }}>
          <Field label={t("Location name")}><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Location 04 – East Apron" autoFocus /></Field>
          <Field label={`${t("Location name")} (العربية)`}><input className={inputCls} dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="الموقع 04 – ساحة الشرق" /></Field>
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!name.trim()}>{t("Add")}</Button>
        </form>
      </Modal>
    </ExpandGroup>
  );
}
