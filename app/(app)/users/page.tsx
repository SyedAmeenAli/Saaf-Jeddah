"use client";
import { Suspense, useMemo, useState } from "react";
import { Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCan, useT } from "@/lib/hooks";
import { ROLE_META } from "@/lib/domain";
import type { Role } from "@/lib/types";
import { Button, Card, Chip, Empty, Field, Modal, PageHeader, SearchField, StatusBadge, Tabs, inputCls } from "@/components/ui/Glass";
import { useOpenId } from "@/components/ui/Expand";
import { DAY, fmtDate } from "@/lib/utils";

const ROLES = ["all", "operator", "supervisor", "manager", "admin"] as const;
const kindOf = (r: Role) => (r === "admin" ? "info" : r === "supervisor" ? "pending" : r === "manager" ? "locked" : "pass") as "info" | "pending" | "locked" | "pass";

function Inner() {
  const t = useT();
  const can = useCan();
  const lang = useStore((s) => s.lang);
  const employees = useStore((s) => s.employees);
  const locations = useStore((s) => s.locations);
  const addUser = useStore((s) => s.addUser);
  const setRole = useStore((s) => s.setUserRole);
  const setCert = useStore((s) => s.setCert);
  const [tab, setTab] = useState<(typeof ROLES)[number]>("all");
  const [q, setQ] = useState("");
  const [add, setAdd] = useState(false);
  const [nm, setNm] = useState("");
  const [nr, setNr] = useState<Role>("operator");
  const [nl, setNl] = useState("LOC01");
  const { id, open, close } = useOpenId();
  const [now] = useState(() => Date.now());

  const rows = useMemo(() => employees.filter((e) => (tab === "all" || e.role === tab) && `${e.id} ${e.name} ${e.nameAr}`.toLowerCase().includes(q.toLowerCase())), [employees, tab, q]);
  const cur = employees.find((e) => e.id === id);
  const editable = can("admin");
  const days = (c: number) => Math.ceil((c - now) / DAY);

  return (
    <>
      <PageHeader title={t("Users")} sub="People, roles and operator qualification. Only authorised operators can sign checks."
        actions={editable ? <Button variant="primary" onClick={() => setAdd(true)}><Plus size={16} /> Add user</Button> : <StatusBadge kind="info">{t("Read-only for this role")}</StatusBadge>} />
      <Tabs tabs={ROLES.map((r) => [r, r === "all" ? t("All") : ROLE_META[r].label, r === "all" ? employees.length : employees.filter((e) => e.role === r).length] as const)} value={tab} onChange={setTab} />
      <div className="mb-4 flex"><SearchField value={q} onChange={setQ} placeholder="Name or employee number…" /></div>

      <Card pad={false} className="overflow-hidden">
        {rows.length === 0 ? <Empty title={t("No records")} /> : (
          <div className="overflow-x-auto p-5">
            <table className="tbl min-w-[36rem]">
              <thead><tr><th>Employee</th><th>Name</th><th>{t("Role")}</th><th>{t("Location")}</th><th>Qualification</th></tr></thead>
              <tbody>
                {rows.map((e) => {
                  const d = days(e.certExpiry);
                  return (
                    <tr key={e.id} className="row-link" tabIndex={0} onClick={() => open(e.id)} onKeyDown={(ev) => { if (ev.key === "Enter") open(e.id); }}>
                      <td className="font-mono text-[13px]">{e.id}</td><td>{lang === "ar" ? e.nameAr : e.name}</td>
                      <td><StatusBadge kind={kindOf(e.role)}>{ROLE_META[e.role].label}</StatusBadge></td><td className="font-mono text-xs text-muted">{e.locationId}</td>
                      <td>{e.role !== "operator" ? <span className="text-faint">–</span> : d < 0 ? <StatusBadge kind="fail">{t("Expired")}</StatusBadge> : d <= 30 ? <StatusBadge kind="pending">{t("Expiring")} · {d}d</StatusBadge> : <StatusBadge kind="pass">{t("In date")}</StatusBadge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!cur} onClose={close} title={cur ? (lang === "ar" ? cur.nameAr : cur.name) : ""}>
        {cur && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-muted">Employee</p><p className="font-mono font-medium">{cur.id}</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-muted">{t("Location")}</p><p className="font-medium">{cur.locationId}</p></div>
              <div className="col-span-2 rounded-xl bg-white/5 p-3"><p className="text-xs text-muted">Qualification valid until</p><p className="font-medium">{fmtDate(cur.certExpiry)} · {days(cur.certExpiry) < 0 ? "expired, cannot sign" : `${days(cur.certExpiry)} days left`}</p></div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted">{t("Role")}</p>
              <div className="flex flex-wrap gap-2">{(["operator", "supervisor", "manager", "admin"] as Role[]).map((r) => <Chip key={r} active={cur.role === r} onClick={() => editable ? setRole(cur.id, r) : undefined}>{ROLE_META[r].label}</Chip>)}</div>
              {!editable && <p className="mt-2 text-xs text-faint">{t("Read-only for this role")}. Admins can change roles.</p>}
            </div>
            {cur.role === "operator" && (
              <div className="flex flex-wrap gap-2">
                <Button disabled={!editable} onClick={() => setCert(cur.id, 365)}><ShieldCheck size={16} /> Renew 12 months</Button>
                <Button disabled={!editable} onClick={() => setCert(cur.id, -1)}><ShieldAlert size={16} /> Suspend</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={add} onClose={() => setAdd(false)} title="Add user">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (nm.trim()) { addUser(nm.trim(), "", nr, nl); setAdd(false); setNm(""); } }}>
          <Field label="Full name"><input className={inputCls} value={nm} onChange={(e) => setNm(e.target.value)} autoFocus required /></Field>
          <Field label={t("Role")}><select className={inputCls} value={nr} onChange={(e) => setNr(e.target.value as Role)}>{(["operator", "supervisor", "manager", "admin"] as Role[]).map((r) => <option key={r} value={r} className="text-black">{ROLE_META[r].label}</option>)}</select></Field>
          <Field label={t("Location")}><select className={inputCls} value={nl} onChange={(e) => setNl(e.target.value)}>{locations.map((l) => <option key={l.id} value={l.id} className="text-black">{l.name}</option>)}</select></Field>
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={!nm.trim()}>{t("Add")}</Button>
        </form>
      </Modal>
    </>
  );
}

export default function UsersPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
