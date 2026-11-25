"use client";
import { Check, Minus } from "lucide-react";
import { ROLE_META } from "@/lib/domain";
import { useT } from "@/lib/hooks";
import { PageHeader } from "@/components/ui/Glass";
import { ROLE_NAV } from "@/components/shell/nav";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["operator", "supervisor", "manager", "admin"];
const CAPS: [string, Role[]][] = [
  ["Perform sampling and sign checks", ["operator"]],
  ["Scan and record in the field", ["operator", "supervisor"]],
  ["Review, approve and return samples", ["supervisor"]],
  ["Countersign submitted records", ["supervisor"]],
  ["Authorise release of equipment on hold", ["supervisor"]],
  ["Amend a record (original preserved)", ["supervisor"]],
  ["View executive analytics", ["manager", "supervisor", "admin"]],
  ["Export reports (PDF / Excel)", ["supervisor", "manager", "admin"]],
  ["Manage users and roles", ["admin"]],
  ["Register vehicles and locations", ["admin"]],
  ["Assign NFC / barcode tags", ["admin"]],
  ["Configure sampling matrix", ["admin"]],
  ["Edit or delete a submitted record", []],
];

export default function Permissions() {
  const t = useT();
  return (
    <>
      <PageHeader title={t("Permissions")} sub="What each role can see and do. These rules are enforced across the demo." />
      <div className="glass overflow-x-auto p-4" style={{ borderRadius: 20 }}>
        <table className="tbl min-w-[40rem]"><thead><tr><th>Capability</th>{ROLES.map((r) => <th key={r} className="text-center">{ROLE_META[r].label}</th>)}</tr></thead>
          <tbody>{CAPS.map(([c, who]) => (
            <tr key={c}><td>{c}{who.length === 0 && <span className="ms-2 text-xs text-fail-fg">Never allowed. Records lock on approval.</span>}</td>
              {ROLES.map((r) => <td key={r} className="text-center">{who.includes(r) ? <Check size={16} className="inline text-pass-fg" aria-label="Allowed" /> : <Minus size={16} className="inline text-faint" aria-label="Not allowed" />}</td>)}</tr>
          ))}</tbody></table>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Navigation by role</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((r) => (
          <section key={r} className="glass p-5" style={{ borderRadius: 20 }}>
            <h3 className="mb-1 text-base font-semibold">{ROLE_META[r].label}</h3><p className="mb-3 text-xs text-muted">{ROLE_META[r].desc}</p>
            <ul className="space-y-1.5 text-sm">{ROLE_NAV[r].map((n) => <li key={n.href} className="flex items-center gap-2"><n.icon size={14} strokeWidth={1.5} className="text-teal" />{n.label}</li>)}</ul>
          </section>
        ))}
      </div>
    </>
  );
}
