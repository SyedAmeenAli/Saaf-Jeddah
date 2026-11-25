"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { useScoped, trendN } from "@/lib/selectors";
import { useT, useNow } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { fmtTime, startOfDay } from "@/lib/utils";
import { PageHeader, Rise, Stagger, StatusBadge } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { LocationDetail, LocationStats, ResultBadge } from "@/components/features/Details";
import { DueListView } from "@/components/features/Lists";
import { OccasionCompletion } from "@/components/features/Insights";
import { T } from "@/components/ui/T";

const TrendChart = dynamic(() => import("@/components/features/TrendChart"), { ssr: false, loading: () => <div className="skeleton h-48" /> });

export default function Activity() {
  const t = useT();
  const now = useNow(60000);
  const lang = useStore((s) => s.lang);
  const locations = useStore((s) => s.locations);
  const allVehicles = useStore((s) => s.vehicles);
  const allChecks = useStore((s) => s.checks);
  const allDue = useStore((s) => s.due);
  const allHolds = useStore((s) => s.holds);
  const { checks, due } = useScoped();
  const series = useMemo(() => trendN(checks, 7), [checks]);
  const today = checks.filter((c) => c.ts >= startOfDay(now)).sort((a, b) => b.ts - a.ts);
  return (
    <ExpandGroup>
      <PageHeader title={t("Sampling Activity")} sub="Location-wise sampling, completion and overdue checks." />
      <Stagger className="space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {locations.map((l) => {
            const st = LocationStats(l.id, allVehicles, allChecks, allDue, allHolds);
            return (
              <Rise key={l.id}>
                <ExpandCard id={`loc-${l.id}`} title={lang === "ar" ? l.nameAr : l.name}
                  card={<div className="space-y-3 p-5"><div className="flex items-center justify-between text-sm font-semibold">{lang === "ar" ? l.nameAr : l.name}{st.open > 0 ? <StatusBadge kind="fail">{st.open} HOLD</StatusBadge> : <StatusBadge kind="pass">OK</StatusBadge>}</div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${st.pct * 100}%`, background: "linear-gradient(90deg,#b58aff,#d7bcff)" }} /></div><p className="text-xs text-muted">{Math.round(st.pct * 100)}% complete · {st.done} done · {st.pending} outstanding</p></div>}
                  detail={() => <LocationDetail location={l} />} />
              </Rise>
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Rise className="xl:col-span-2"><section className="glass p-5" style={{ borderRadius: 20 }}><h3 className="mb-3 text-base font-semibold"><T>{"Last 7 days"}</T></h3><TrendChart data={series} height={230} /></section></Rise>
          <Rise><section className="glass h-full p-5" style={{ borderRadius: 20 }}><h3 className="mb-4 text-base font-semibold"><T>{"By occasion"}</T></h3><OccasionCompletion /></section></Rise>
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Rise><section className="glass p-5" style={{ borderRadius: 20 }}><h3 className="mb-3 text-base font-semibold"><T>{"Overdue checks"}</T></h3><DueListView due={due.filter((d) => d.state === "overdue")} /></section></Rise>
          <Rise><section className="glass overflow-x-auto p-5" style={{ borderRadius: 20 }}><h3 className="mb-3 text-base font-semibold">Today&apos;s samples ({today.length})</h3>
            <table className="tbl min-w-[28rem]"><thead><tr><th><T>{"Time"}</T></th><th><T>{"Vehicle"}</T></th><th><T>{"Point"}</T></th><th><T>{"Result"}</T></th></tr></thead><tbody>{today.slice(0, 12).map((c) => <tr key={c.id}><td className="tnum text-muted">{fmtTime(c.ts)}</td><td className="font-mono text-[13px]">{c.vehicleId}</td><td>{POINTS[c.point].label}</td><td><ResultBadge c={c} /></td></tr>)}</tbody></table></section></Rise>
        </div>
      </Stagger>
    </ExpandGroup>
  );
}
