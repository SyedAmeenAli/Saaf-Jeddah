"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Send, ShieldCheck, Users, BarChart3, Settings2, HardHat } from "lucide-react";
import { AuthShell } from "@/components/features/AuthShell";
import { Field, inputCls } from "@/components/ui/Glass";
import { T } from "@/components/ui/T";

const ROLES = [[HardHat, "Operator", "Perform sampling and record results"], [Users, "Supervisor", "Review, verify and approve records"], [BarChart3, "Manager", "Monitor compliance and reports"], [Settings2, "Administrator", "Manage users, vehicles and locations"]] as const;

export default function RequestAccess() {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell crop="truck" title="Request Access" subtitle="For APSCO employees only" footer={<Link href="/login" className="text-teal hover:underline"><T>{"Back to sign in"}</T></Link>}>
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center"><span className="flex size-14 items-center justify-center rounded-full bg-pass/20 text-pass-fg"><Check size={28} /></span><p className="font-semibold"><T>{"Request submitted"}</T></p><p className="text-sm text-muted"><T>{"Your supervisor will review it. Demo only: nothing was sent."}</T></p></div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name"><input className={inputCls} required /></Field>
            <Field label="Employee number"><input className={inputCls} placeholder="EMP-1047" required /></Field>
          </div>
          <Field label="Requested role"><select className={inputCls}>{ROLES.map(([, r]) => <option key={r} className="text-black">{r}</option>)}</select></Field>
          <Field label="Location"><select className={inputCls}><option className="text-black"><T>{"Location 01 – North Apron"}</T></option><option className="text-black"><T>{"Location 02 – South Apron"}</T></option><option className="text-black"><T>{"Location 03 – Cargo Apron"}</T></option></select></Field>
          <ul className="grid grid-cols-2 gap-2 text-xs text-muted">{ROLES.map(([I, r, d]) => <li key={r} className="flex gap-2 rounded-xl bg-white/5 p-2.5"><I size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-teal" /><span><b className="block text-fg">{r}</b>{d}</span></li>)}</ul>
          <button className="cta flex h-12 w-full items-center justify-center gap-2 rounded-xl" type="submit"><Send size={16} /> <T>{"Submit Request"}</T></button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-faint"><ShieldCheck size={12} /> <T>{"Only authorised operators can sign checks."}</T></p>
        </form>
      )}
    </AuthShell>
  );
}
