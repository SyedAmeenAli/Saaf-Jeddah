"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useScoped, trendN } from "@/lib/selectors";
import { useT } from "@/lib/hooks";
import { PageHeader, Rise, Stagger, Tabs } from "@/components/ui/Glass";
import { ExpandGroup } from "@/components/ui/Expand";
import { ExpandPanel } from "@/components/ui/ExpandPanel";
import { FleetHealth, OccasionCompletion, QualityByLocation, RepeatFailures, TypeComparison } from "@/components/features/Insights";

const TrendChart = dynamic(() => import("@/components/features/TrendChart"), { ssr: false, loading: () => <div className="skeleton h-48" /> });

export default function Analytics() {
  const t = useT();
  const { checks } = useScoped();
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const series = useMemo(() => trendN(checks, Number(range)), [checks, range]);
  const total = series.reduce((a, r) => a + r.total, 0), fail = series.reduce((a, r) => a + r.fail, 0);
  return (
    <ExpandGroup>
      <PageHeader title={t("Quality Analytics")} sub="Read-only analysis of sampling quality. Days before the last 7 are illustrative demo values." actions={<Tabs className="!mb-0 !gap-1 [&>button]:!px-3" tabs={[["7", "7 days"], ["30", "30 days"], ["90", "90 days"]] as const} value={range} onChange={setRange} />} />
      <Stagger className="space-y-5">
        <Rise><ExpandPanel id="an-trend" title="Pass / fail over time" sub={`${total} samples · ${fail} failed · ${total ? (((total - fail) / total) * 100).toFixed(1) : "100"}% pass rate`}><TrendChart key={range} data={series} height={300} bars={range !== "7"} /></ExpandPanel></Rise>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Rise><ExpandPanel id="an-qualitybylocation" title="Quality by location" sub="Pass rate" className="h-full"><QualityByLocation /></ExpandPanel></Rise>
          <Rise><ExpandPanel id="an-refuellervsdispenser" title="Refueller vs dispenser" sub="Pass rate" className="h-full"><TypeComparison /></ExpandPanel></Rise>
          <Rise><ExpandPanel id="an-completionbyoccasion" title="Completion by occasion" sub="Samples recorded" className="h-full"><OccasionCompletion /></ExpandPanel></Rise>
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Rise><ExpandPanel id="an-repeatfailures" title="Repeat failures" sub="Vehicles failing more than once" className="h-full"><RepeatFailures /></ExpandPanel></Rise>
          <Rise><ExpandPanel id="an-fleethealth" title="Fleet health" sub="Status of every vehicle" className="h-full"><FleetHealth /></ExpandPanel></Rise>
        </div>
      </Stagger>
    </ExpandGroup>
  );
}
