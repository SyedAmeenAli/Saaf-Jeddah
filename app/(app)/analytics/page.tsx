"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useScoped, trendN } from "@/lib/selectors";
import { useT } from "@/lib/hooks";
import { PageHeader, Rise, Stagger, Tabs } from "@/components/ui/Glass";
import { FleetHealth, OccasionCompletion, QualityByLocation, RepeatFailures, TypeComparison } from "@/components/features/Insights";

const TrendChart = dynamic(() => import("@/components/features/TrendChart"), { ssr: false, loading: () => <div className="skeleton h-48" /> });

function P({ title, sub, children, className }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return <section className={"glass p-5 " + (className ?? "")} style={{ borderRadius: 20 }}><h3 className="text-base font-semibold">{title}</h3><p className="mb-4 mt-0.5 text-xs text-muted">{sub}</p>{children}</section>;
}

export default function Analytics() {
  const t = useT();
  const { checks } = useScoped();
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const series = useMemo(() => trendN(checks, Number(range)), [checks, range]);
  const total = series.reduce((a, r) => a + r.total, 0), fail = series.reduce((a, r) => a + r.fail, 0);
  return (
    <>
      <PageHeader title={t("Quality Analytics")} sub="Read-only analysis of sampling quality. Days before the last 7 are illustrative demo values." actions={<Tabs className="!mb-0 !gap-1 [&>button]:!px-3" tabs={[["7", "7 days"], ["30", "30 days"], ["90", "90 days"]] as const} value={range} onChange={setRange} />} />
      <Stagger className="space-y-5">
        <Rise><P title="Pass / fail over time" sub={`${total} samples · ${fail} failed · ${total ? (((total - fail) / total) * 100).toFixed(1) : "100"}% pass rate`}><TrendChart key={range} data={series} height={300} bars={range !== "7"} /></P></Rise>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Rise><P title="Quality by location" sub="Pass rate" className="h-full"><QualityByLocation /></P></Rise>
          <Rise><P title="Refueller vs dispenser" sub="Pass rate" className="h-full"><TypeComparison /></P></Rise>
          <Rise><P title="Completion by occasion" sub="Samples recorded" className="h-full"><OccasionCompletion /></P></Rise>
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Rise><P title="Repeat failures" sub="Vehicles failing more than once" className="h-full"><RepeatFailures /></P></Rise>
          <Rise><P title="Fleet health" sub="Status of every vehicle" className="h-full"><FleetHealth /></P></Rise>
        </div>
      </Stagger>
    </>
  );
}
