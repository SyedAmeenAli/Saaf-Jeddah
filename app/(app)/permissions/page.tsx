"use client";
import { Check, Lock, Minus } from "lucide-react";
import { ROLE_META } from "@/lib/domain";
import { useStore } from "@/lib/store";
import { useCan, useT, type Cap } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { PageHeader, StatusBadge, Switch } from "@/components/ui/Glass";
import { ROLE_NAV } from "@/components/shell/nav";
import type { Role } from "@/lib/types";
import { T } from "@/components/ui/T";

const ROLES: Role[] = ["operator", "supervisor", "manager", "admin"];
const ROWS: [string, Cap | null][] = [
  ["Perform sampling and sign checks", "sample"],
  ["Review, approve, return and countersign samples", "verify"],
  ["Authorise release of equipment on hold", "release"],
  ["Amend a record (original preserved)", "amend"],
  ["Export reports (PDF / Excel)", "export"],
  ["Manage users, fleet, tags and matrix", "admin"],
  ["Edit or delete a submitted record", null],
];

export default function Permissions() {
  const t = useT();
  const can = useCan();
  const perms = useStore((s) => s.perms);
  const setPerm = useStore((s) => s.setPerm);
  const editable = can("admin");
  const locked = (r: Role, c: Cap) => (r === "admin" && c === "admin") || (r === "manager" && c !== "export");
  return (
    <>
      <PageHeader title={t("Permissions")} sub="What each role can see and do. Changes apply immediately across the demo." actions={editable ? <StatusBadge kind="locked"><Lock size={11} className="me-1" /><T>{"Records stay locked for every role"}</T></StatusBadge> : <StatusBadge kind="info">{t("Read-only for this role")}</StatusBadge>} />
      <div className="glass overflow-x-auto p-4" style={{ borderRadius: 20 }}>
        <table className="tbl min-w-[40rem]"><thead><tr><th><T>{"Capability"}</T></th>{ROLES.map((r) => <th key={r} className="text-center">{ROLE_META[r].label}</th>)}</tr></thead>
          <tbody>{ROWS.map(([label, cap]) => (
            <tr key={label}><td>{label}{cap === null && <span className="ms-2 text-xs text-fail-fg"><T>{"Never allowed. Records lock on approval."}</T></span>}</td>
              {ROLES.map((r) => {
                const on = cap !== null && perms[r].includes(cap);
                if (cap === null || !editable || locked(r, cap)) return <td key={r} className="text-center">{on ? <Check size={16} className="inline text-pass-fg" aria-label="Allowed" /> : <Minus size={16} className="inline text-faint" aria-label="Not allowed" />}{cap !== null && locked(r, cap) && <Lock size={10} className="ms-1 inline text-faint" aria-label="Locked by policy" />}</td>;
                return <td key={r} className="text-center"><span className="inline-flex"><Switch checked={on} onChange={(v) => setPerm(r, cap, v)} label={`${label} for ${ROLE_META[r].label}`} /></span></td>;
              })}</tr>
          ))}</tbody></table>
        <p className="mt-3 text-xs text-faint"><T>{"Locked cells follow policy: the manager role is read-only and an administrator cannot remove their own access."}</T></p>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold"><T>{"Navigation by role"}</T></h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((r) => (
          <section key={r} className="glass p-5" style={{ borderRadius: 20 }}>
            <h3 className="mb-1 text-base font-semibold">{ROLE_META[r].label}</h3><p className="mb-3 text-xs text-muted">{ROLE_META[r].desc}</p>
            <ul className="space-y-1.5 text-sm">{ROLE_NAV[r].map((n) => <li key={n.href} className="flex items-center gap-2"><n.icon size={14} strokeWidth={1.5} className={cn("text-teal")} />{n.label}</li>)}</ul>
          </section>
        ))}
      </div>
    </>
  );
}
