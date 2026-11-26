"use client";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookLock, Boxes, Grid3x3, Lock, MapPin, Nfc, Plus, Users } from "lucide-react";
import { useStore } from "@/lib/store";
const arName = (e: { name: string; nameAr: string }, lang: string) => (lang === "ar" ? e.nameAr : e.name);
import { useApplicable, useNow, useT } from "@/lib/hooks";
import { OCCASION_ORDER, pointsForVehicle } from "@/lib/domain";
import { Rise, Stagger, StatusBadge, CountUp } from "@/components/ui/Glass";
import { ActivityList } from "@/components/features/Lists";
import { cn } from "@/lib/utils";
import { T } from "@/components/ui/T";

/** Admin: a configuration console. Registry health, gaps to fix, recent config changes. Table-first. */
export default function AdminHome() {
  const t = useT();
  const employees = useStore((s) => s.employees);
  const lang = useStore((s) => s.lang);
  const locations = useStore((s) => s.locations);
  const vehicles = useStore((s) => s.vehicles);
  const audit = useStore((s) => s.audit);
  const now = useNow(60000);
  const applicable = useApplicable();

  const stats = useMemo(() => {
    const slots = vehicles.reduce((a, v) => a + pointsForVehicle(v.type).length, 0);
    const tagged = vehicles.reduce((a, v) => a + pointsForVehicle(v.type).filter((p) => v.tags[p]).length, 0);
    const missing = vehicles.map((v) => ({ v, n: pointsForVehicle(v.type).filter((p) => !v.tags[p]).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
    const matrix = OCCASION_ORDER.reduce((a, o) => a + applicable(o, "refueller").length + applicable(o, "dispenser").length, 0);
    const expired = employees.filter((e) => e.role === "operator" && e.certExpiry < now);
    return { slots, tagged, missing, matrix, expired };
  }, [vehicles, employees, now, applicable]);
  const cover = stats.slots ? stats.tagged / stats.slots : 1;
  const cfg = audit.filter((a) => a.action === "config" || a.action === "amendment").slice(0, 6);

  const modules = [
    { href: "/users", label: "Users", v: employees.length, sub: `${stats.expired.length} authorisation${stats.expired.length === 1 ? "" : "s"} expired`, I: Users },
    { href: "/locations", label: "Locations", v: locations.length, sub: "Operating sites", I: MapPin },
    { href: "/assets", label: "Assets & Fleet", v: vehicles.length, sub: `${vehicles.filter((v) => v.type === "dispenser").length} dispensers · ${vehicles.filter((v) => v.type === "refueller").length} refuellers`, I: Boxes },
    { href: "/points", label: "Tags assigned", v: Math.round(cover * 100), suffix: "%", sub: `${stats.tagged} of ${stats.slots} points tagged`, I: Nfc },
    { href: "/matrix", label: "Matrix entries", v: stats.matrix, sub: "Approved occasion / point pairs", I: Grid3x3 },
    { href: "/settings", label: "JIG version", text: "JIG 1 / 2", sub: "Aligned, pending QC approval", I: BookLock },
  ];

  return (
    <Stagger className="space-y-5">
      <Rise>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">{t("Administration")}</p>
            <h1 className="mt-1 text-[28px] font-semibold leading-tight md:text-[34px]"><T>{"System overview"}</T></h1>
          </div>
          <StatusBadge kind="locked"><Lock size={11} className="me-1" /><T>{"Submitted records stay locked"}</T></StatusBadge>
        </div>
      </Rise>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {modules.map((m) => (
          <Rise key={m.href} className="h-full">
            <Link href={m.href} className="glass sheen hover-glow flex h-full flex-col gap-3 p-4" style={{ borderRadius: 20 }}>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-teal/15 text-teal"><m.I size={20} strokeWidth={1.6} /></span>
              <div>
                <p className="text-[26px] font-semibold leading-8">{"text" in m ? m.text : <CountUp value={m.v} suffix={m.suffix} />}</p>
                <p className="mt-1 text-sm text-muted">{m.label}</p>
                <p className="mt-0.5 text-xs text-faint">{m.sub}</p>
              </div>
            </Link>
          </Rise>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Rise className="xl:col-span-3">
          <section className="glass p-5" style={{ borderRadius: 20 }}>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold"><T>{"Needs configuration"}</T></h2><Link href="/points" className="inline-flex items-center gap-1 text-xs text-teal hover:underline"><T>{"Open tag registry"}</T> <ArrowRight size={12} className="rtl:rotate-180" /></Link></div>
            {stats.missing.length === 0 && stats.expired.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted"><T>{"Every sampling point has a tag and every operator is authorised."}</T></p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tbl min-w-[28rem]"><thead><tr><th><T>{"Item"}</T></th><th><T>{"Issue"}</T></th><th /></tr></thead>
                  <tbody>
                    {stats.missing.slice(0, 5).map(({ v, n }) => <tr key={v.id}><td className="font-mono font-medium">{v.id}</td><td className="text-muted">{n} sampling point{n > 1 ? "s" : ""} without a tag</td><td className="text-end"><Link href={`/points?v=${v.id}`} className="btn-secondary inline-flex h-8 items-center rounded-xl px-3 text-xs"><T>{"Assign"}</T></Link></td></tr>)}
                    {stats.expired.slice(0, 4).map((e) => <tr key={e.id}><td className="font-mono font-medium">{e.id}</td><td className="text-muted">{arName(e, lang)}: authorisation expired</td><td className="text-end"><Link href="/users" className="btn-secondary inline-flex h-8 items-center rounded-xl px-3 text-xs"><T>{"Review"}</T></Link></td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </Rise>

        <Rise className="xl:col-span-2">
          <section className="glass h-full p-5" style={{ borderRadius: 20 }}>
            <h2 className="mb-3 text-base font-semibold"><T>{"Quick actions"}</T></h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {[["/users", "Add employee", Users], ["/assets", "Register vehicle", Boxes], ["/locations", "Add location", MapPin], ["/points", "Assign NFC tag", Nfc]].map(([h, l, I]) => {
                const Ic = I as typeof Users;
                return <Link key={h as string} href={h as string} className="btn-secondary flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium"><Plus size={14} className="text-teal" /><Ic size={16} strokeWidth={1.5} className="text-muted" />{l as string}</Link>;
              })}
            </div>
            <p className="mt-4 rounded-2xl border border-hair bg-white/[0.03] p-3 text-xs leading-relaxed text-muted"><Lock size={12} className={cn("me-1.5 inline text-faint")} /><T>{"Administrators configure the system. A submitted quality record can only be changed through an auditable amendment that preserves the original."}</T></p>
          </section>
        </Rise>
      </div>

      <Rise>
        <section className="glass p-5" style={{ borderRadius: 20 }}>
          <h2 className="mb-3 text-base font-semibold"><T>{"Recent configuration changes"}</T></h2>
          {cfg.length ? <ActivityList entries={cfg} /> : <p className="py-6 text-center text-sm text-muted"><T>{"No configuration changes yet. Add a user, vehicle or tag to see it logged here."}</T></p>}
        </section>
      </Rise>
    </Stagger>
  );
}
