"use client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { cn, fmtDate } from "@/lib/utils";
import { PageHeader, StatusBadge } from "@/components/ui/Glass";
import { useEmployeeActivity } from "@/components/features/Insights";
import { T } from "@/components/ui/T";

export default function Employees() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const rows = useEmployeeActivity();
  return (
    <>
      <PageHeader title={t("Employee Performance")} sub="Sampling activity and authorisation status for every operator. Read-only." />
      <div className="glass overflow-x-auto p-4" style={{ borderRadius: 20 }}>
        <table className="tbl min-w-[40rem]"><thead><tr><th><T>{"Employee"}</T></th><th><T>{"Location"}</T></th><th className="text-end"><T>{"Samples (7d)"}</T></th><th className="text-end"><T>{"Failed"}</T></th><th><T>{"Pass rate"}</T></th><th><T>{"Authorisation"}</T></th></tr></thead>
          <tbody>{rows.map(({ e, n, fail, rate, expired }) => (
            <tr key={e.id}>
              <td><span className="font-medium">{lang === "ar" ? e.nameAr : e.name}</span><span className="ms-2 font-mono text-xs text-muted">{e.id}</span></td>
              <td className="text-muted">{e.locationId}</td><td className="text-end tnum">{n}</td><td className={cn("text-end tnum", fail > 0 && "text-fail-fg")}>{fail}</td>
              <td className="tnum">{(rate * 100).toFixed(1)}%</td>
              <td>{expired ? <StatusBadge kind="fail">Expired {fmtDate(e.certExpiry)}</StatusBadge> : <StatusBadge kind="pass">Valid to {fmtDate(e.certExpiry)}</StatusBadge>}</td>
            </tr>
          ))}</tbody></table>
      </div>
    </>
  );
}
