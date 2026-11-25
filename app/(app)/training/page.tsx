"use client";
import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { DAY, fmtDate } from "@/lib/utils";
import { PageHeader, Rise, Stagger, StatusBadge } from "@/components/ui/Glass";

export default function TrainingPage() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const employees = useStore((s) => s.employees).filter((e) => e.role === "operator");
  const [now] = useState(() => Date.now());
  const rows = employees.map((e) => {
    const d = Math.ceil((e.certExpiry - now) / DAY);
    return { e, d, st: d < 0 ? "expired" : d <= 30 ? "expiring" : "in" } as const;
  }).sort((a, b) => a.d - b.d);
  const n = { in: rows.filter((r) => r.st === "in").length, exp: rows.filter((r) => r.st === "expiring").length, out: rows.filter((r) => r.st === "expired").length };
  return (
    <>
      <PageHeader title={`${t("Training")} & ${t("Authorised")}`} sub="Rule: only authorised (in-date) operators can sign sampling checks. Expired operators are blocked at the signature step." />
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[[t("In date"), n.in, "pass", ShieldCheck], [t("Expiring"), n.exp, "pending", Clock], [t("Expired"), n.out, "fail", ShieldAlert]].map(([l, v, k, I]) => {
          const Icon = I as typeof ShieldCheck;
          return <div key={l as string} className="glass flex items-center gap-3 p-4" style={{ borderRadius: 8 }}><Icon size={22} className={k === "pass" ? "text-pass-fg" : k === "pending" ? "text-pending-fg" : "text-fail-fg"} /><div><p className="font-display text-3xl font-semibold">{v as number}</p><p className="text-xs text-muted">{l as string}</p></div></div>;
        })}
      </div>
      <Stagger className="glass divide-y divide-hair overflow-hidden" >
        {rows.map(({ e, d, st }) => (
          <Rise key={e.id}>
            <Link href={`/users?open=${e.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-hi">
              <span className="w-24 font-mono text-sm font-semibold">{e.id}</span>
              <span className="min-w-40 flex-1 text-sm">{lang === "ar" ? e.nameAr : e.name} <span className="text-xs text-muted">· {e.locationId}</span></span>
              <span className="text-xs text-muted">Qualification valid until {fmtDate(e.certExpiry)}</span>
              {st === "in" && <StatusBadge kind="pass">{t("In date")}</StatusBadge>}
              {st === "expiring" && <StatusBadge kind="pending">{t("Expiring")} · {d}d</StatusBadge>}
              {st === "expired" && <StatusBadge kind="fail">{t("Expired")} · cannot sign</StatusBadge>}
            </Link>
          </Rise>
        ))}
      </Stagger>
    </>
  );
}
