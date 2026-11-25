"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, X } from "lucide-react";
import { useStore, currentUserId } from "@/lib/store";
import { useScoped } from "@/lib/selectors";
import { useCan, useT } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { fmtDT } from "@/lib/utils";
import { Empty, PageHeader, SearchField, StatusBadge, Tabs } from "@/components/ui/Glass";
import { ExpandCard, ExpandGroup } from "@/components/ui/Expand";
import { useSearchParams } from "next/navigation";
import { ReviewDetail } from "@/components/features/ReviewDetail";
import { StateBadge } from "@/components/features/Details";
import { T } from "@/components/ui/T";

const TABS = [["all", "All"], ["awaiting", "Awaiting supervisor"], ["failed", "Failed"], ["approved", "Locked"], ["returned", "Returned"]] as const;
const mark = (r: string) => r === "pass" ? <Check size={14} className="text-pass-fg" aria-label="pass" /> : r === "fail" ? <X size={14} className="text-fail-fg" aria-label="fail" /> : <span className="text-faint">–</span>;

function Inner() {
  const t = useT();
  const can = useCan();
  const { checks: scoped } = useScoped();
  const role = useStore((s) => s.role);
  const mine = role === "operator";
  const checks = useMemo(() => (mine ? scoped.filter((c) => c.employeeId === currentUserId("operator")) : scoped), [scoped, mine]);
  const all = useStore((s) => s.checks);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(40);
  const sp = useSearchParams();
  const openId = sp.get("open");

  const rows = useMemo(() => checks.filter((c) =>
    (tab === "all" || (tab === "failed" ? c.result === "fail" : c.status === tab)) &&
    `${c.sampleId} ${c.vehicleId} ${c.employeeId} ${POINTS[c.point].label}`.toLowerCase().includes(q.toLowerCase())), [checks, tab, q]);
  const count = (k: (typeof TABS)[number][0]) => checks.filter((c) => k === "all" || (k === "failed" ? c.result === "fail" : c.status === k)).length;
  const cur = all.find((c) => c.id === openId);
  const shown = useMemo(() => { const v = rows.slice(0, limit); return cur && !v.some((x) => x.id === cur.id) ? [cur, ...v] : v; }, [rows, limit, cur]);

  return (
    <ExpandGroup>
      <PageHeader title={mine ? t("My Records") : t("Inspections")} sub={mine ? "Samples you have submitted and where each one stands." : "Every sampling record. Open one to review, approve, return or amend."}
        actions={(can("sample") || can("verify")) ? <Link href="/scan" className="cta inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm"><Plus size={16} /> <T>{"New inspection"}</T></Link> : undefined} />
      <Tabs tabs={TABS.map(([k, l]) => [k, l, count(k)] as const)} value={tab} onChange={setTab} />
      <div className="mb-4 flex"><SearchField value={q} onChange={setQ} placeholder="Sample ID, vehicle or employee…" /></div>

      {rows.length === 0 ? <div className="glass" style={{ borderRadius: 20 }}><Empty title={t("No records")} sub="Try another tab or clear the search." /></div> : (
        <div className="space-y-2">
          <div className="hidden grid-cols-[1.7fr_1.2fr_.8fr_1fr_.6fr_.6fr_.7fr_1fr_.8fr] gap-3 px-5 text-xs text-muted xl:grid"><span><T>{"Sample ID"}</T></span><span><T>{"Date & Time"}</T></span><span><T>{"Vehicle"}</T></span><span><T>{"Sampling Point"}</T></span><span>VAC</span><span>CWD</span><span><T>{"Result"}</T></span><span><T>{"Status"}</T></span><span><T>{"Employee"}</T></span></div>
          {shown.map((c) => (
            <ExpandCard key={c.id} id={c.id} title={`${c.vehicleId} · ${POINTS[c.point].label}`}
              card={
                <>
                  <div className="hidden grid-cols-[1.7fr_1.2fr_.8fr_1fr_.6fr_.6fr_.7fr_1fr_.8fr] items-center gap-3 px-5 py-3.5 text-sm xl:grid">
                    <span className="truncate font-mono text-xs">{c.sampleId}</span><span className="tnum text-muted">{fmtDT(c.ts)}</span><span className="font-mono text-[13px]">{c.vehicleId}</span><span>{POINTS[c.point].label}</span>
                    <span>{mark(c.clarity === "fail" || c.sediment === "fail" || c.freeWater === "fail" ? "fail" : "pass")}</span><span>{mark(c.cwd)}</span>
                    <span><StatusBadge kind={c.result === "pass" ? "pass" : "fail"}>{c.result === "pass" ? t("Pass") : t("Fail")}</StatusBadge></span><span><StateBadge status={c.status} /></span><span className="font-mono text-xs text-muted">{c.employeeId}</span>
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-3 xl:hidden">
                    <span className="flex items-center justify-between"><span className="font-mono text-sm font-semibold">{c.vehicleId}</span><StatusBadge kind={c.result === "pass" ? "pass" : "fail"}>{c.result === "pass" ? t("Pass") : t("Fail")}</StatusBadge></span>
                    <span className="text-sm">{POINTS[c.point].label}</span>
                    <span className="flex items-center justify-between text-xs text-muted"><span>{fmtDT(c.ts)} · {c.employeeId}</span><StateBadge status={c.status} /></span>
                  </div>
                </>
              }
              detail={() => <ReviewDetail check={c} />} />
          ))}
        </div>
      )}
      {rows.length > limit && <div className="mt-4 flex justify-center"><button type="button" onClick={() => setLimit(limit + 40)} className="btn-secondary h-10 rounded-2xl px-5 text-sm"><T>{"Show 40 more"}</T></button></div>}
      <p className="mt-3 text-xs text-faint">Showing {Math.min(rows.length, limit)} of {rows.length} records · {t("Demo data")}</p>

    </ExpandGroup>
  );
}

export default function RecordsPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
