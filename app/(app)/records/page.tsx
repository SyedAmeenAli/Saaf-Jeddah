"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useScoped } from "@/lib/selectors";
import { useCan, useT } from "@/lib/hooks";
import { POINTS } from "@/lib/domain";
import { fmtDT } from "@/lib/utils";
import { Card, Empty, Modal, PageHeader, SearchField, StatusBadge, Tabs } from "@/components/ui/Glass";
import { useOpenId } from "@/components/ui/Expand";
import { RecordView } from "@/components/features/Record";
import { StateBadge } from "@/components/features/Details";

const TABS = [["all", "All"], ["awaiting", "Awaiting supervisor"], ["failed", "Failed"], ["approved", "Locked"], ["returned", "Returned"]] as const;
const mark = (r: string) => r === "pass" ? <Check size={14} className="text-pass-fg" aria-label="pass" /> : r === "fail" ? <X size={14} className="text-fail-fg" aria-label="fail" /> : <span className="text-faint">–</span>;

function Inner() {
  const t = useT();
  const can = useCan();
  const { checks } = useScoped();
  const all = useStore((s) => s.checks);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("all");
  const [q, setQ] = useState("");
  const { id, open, close } = useOpenId();

  const rows = useMemo(() => checks.filter((c) =>
    (tab === "all" || (tab === "failed" ? c.result === "fail" : c.status === tab)) &&
    `${c.sampleId} ${c.vehicleId} ${c.employeeId} ${POINTS[c.point].label}`.toLowerCase().includes(q.toLowerCase())), [checks, tab, q]);
  const count = (k: (typeof TABS)[number][0]) => checks.filter((c) => k === "all" || (k === "failed" ? c.result === "fail" : c.status === k)).length;
  const cur = all.find((c) => c.id === id);

  return (
    <>
      <PageHeader title={t("Inspections")} sub="Every sampling record. Open one to review, approve, return or amend."
        actions={(can("sample") || can("verify")) ? <Link href="/scan" className="cta inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm"><Plus size={16} /> New inspection</Link> : undefined} />
      <Tabs tabs={TABS.map(([k, l]) => [k, l, count(k)] as const)} value={tab} onChange={setTab} />
      <div className="mb-4 flex"><SearchField value={q} onChange={setQ} placeholder="Sample ID, vehicle or employee…" /></div>

      <Card pad={false} className="overflow-hidden">
        {rows.length === 0 ? <Empty title={t("No records")} sub="Try another tab or clear the search." /> : (
          <>
            <ul className="divide-y divide-hair md:hidden">
              {rows.slice(0, 40).map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => open(c.id)} className="flex w-full flex-col gap-1 px-4 py-3 text-start hover:bg-white/5">
                    <span className="flex items-center justify-between"><span className="font-mono text-sm font-semibold">{c.vehicleId}</span><StatusBadge kind={c.result === "pass" ? "pass" : "fail"}>{c.result === "pass" ? t("Pass") : t("Fail")}</StatusBadge></span>
                    <span className="text-sm">{POINTS[c.point].label}</span>
                    <span className="flex items-center justify-between text-xs text-muted"><span>{fmtDT(c.ts)} · {c.employeeId}</span><StateBadge status={c.status} /></span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto p-5 md:block">
              <table className="tbl min-w-[56rem]">
                <thead><tr><th>Sample ID</th><th>Date &amp; Time</th><th>Vehicle</th><th>Sampling Point</th><th>VAC</th><th>CWD</th><th>Result</th><th>Status</th><th>Employee</th></tr></thead>
                <tbody>
                  {rows.slice(0, 60).map((c) => (
                    <tr key={c.id} className="row-link" tabIndex={0} onClick={() => open(c.id)} onKeyDown={(e) => { if (e.key === "Enter") open(c.id); }}>
                      <td className="font-mono text-xs">{c.sampleId}</td><td className="tnum text-muted">{fmtDT(c.ts)}</td><td className="font-mono text-[13px]">{c.vehicleId}</td><td>{POINTS[c.point].label}</td>
                      <td>{mark(c.clarity === "fail" || c.sediment === "fail" || c.freeWater === "fail" ? "fail" : "pass")}</td><td>{mark(c.cwd)}</td>
                      <td><StatusBadge kind={c.result === "pass" ? "pass" : "fail"}>{c.result === "pass" ? t("Pass") : t("Fail")}</StatusBadge></td><td><StateBadge status={c.status} /></td>
                      <td className="font-mono text-xs text-muted">{c.employeeId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
      <p className="mt-3 text-xs text-faint">Showing {Math.min(rows.length, 60)} of {rows.length} records · {t("Demo data")}</p>

      <Modal open={!!cur} onClose={close} title={cur ? `${cur.vehicleId} · ${POINTS[cur.point].label}` : ""} wide>
        {cur && <RecordView check={cur} onChange={close} />}
      </Modal>
    </>
  );
}

export default function RecordsPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
