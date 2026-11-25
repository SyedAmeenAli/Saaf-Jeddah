"use client";
import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import type { AuditEntry } from "@/lib/types";
import { Chip, PageHeader, SearchField, StatusBadge } from "@/components/ui/Glass";
import { ActivityList } from "@/components/features/Lists";
import { T } from "@/components/ui/T";

const ACTIONS: ("all" | AuditEntry["action"])[] = ["all", "submission", "approval", "return", "amendment", "hold", "resample", "release", "config"];

export default function AuditPage() {
  const t = useT();
  const audit = useStore((s) => s.audit);
  const [a, setA] = useState<(typeof ACTIONS)[number]>("all");
  const [q, setQ] = useState("");
  const rows = useMemo(() => audit.filter((x) => (a === "all" || x.action === a) && `${x.actor} ${x.target} ${x.detail}`.toLowerCase().includes(q.toLowerCase())), [audit, a, q]);
  return (
    <>
      <PageHeader title={t("Audit log")} sub="Append-only. Entries cannot be edited or deleted." actions={<StatusBadge kind="locked"><T>{"Append-only"}</T></StatusBadge>} />
      <div className="glass mb-4 flex flex-wrap items-center gap-2 p-3" style={{ borderRadius: 24 }}>
        <SearchField value={q} onChange={setQ} placeholder="Actor, target, detail…" />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">{ACTIONS.map((x) => <Chip key={x} active={a === x} onClick={() => setA(x)} className="capitalize">{x === "all" ? t("All") : x}</Chip>)}</div>
      </div>
      <div className="glass p-3 md:p-5" style={{ borderRadius: 20 }}>
        <p className="mb-2 flex items-center gap-2 px-2 text-xs text-muted"><Lock size={12} /> {rows.length} entries</p>
        <ActivityList entries={rows.slice(0, 150)} full />
      </div>
    </>
  );
}
