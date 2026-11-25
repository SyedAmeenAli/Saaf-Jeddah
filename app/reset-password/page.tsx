"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Lock, Send } from "lucide-react";
import { AuthShell } from "@/components/features/AuthShell";
import { Field, inputCls } from "@/components/ui/Glass";
import { cn } from "@/lib/utils";
import { T } from "@/components/ui/T";

const STEPS = ["Verify", "Reset", "Done"];

export default function ResetPassword() {
  const [step, setStep] = useState(0);
  return (
    <AuthShell crop="engine" title="Reset Password" subtitle="Enter your employee number to receive a verification code" footer={<Link href="/login" className="text-teal hover:underline"><T>{"Back to sign in"}</T></Link>}>
      <ol className="mb-6 flex items-center justify-center gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={cn("flex size-7 items-center justify-center rounded-full border font-semibold", i <= step ? "border-teal bg-teal/20 text-teal" : "border-white/15 text-faint")}>{i < step ? <Check size={14} /> : i + 1}</span>
            <span className={i <= step ? "text-fg" : "text-faint"}>{s}</span>
            {i < 2 && <span className="h-px w-6 bg-white/15" />}
          </li>
        ))}
      </ol>
      {step === 0 && <form onSubmit={(e) => { e.preventDefault(); setStep(1); }} className="space-y-4"><Field label="Employee number"><input className={inputCls} placeholder="EMP-1047" required /></Field><button className="cta flex h-12 w-full items-center justify-center gap-2 rounded-xl"><Send size={16} /> <T>{"Send Verification Code"}</T></button></form>}
      {step === 1 && <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4"><Field label="Verification code (demo: any 6 digits)"><input className={`${inputCls} text-center font-mono text-xl tracking-[0.5em]`} maxLength={6} inputMode="numeric" required /></Field><Field label="New password"><input className={inputCls} type="password" required /></Field><button className="cta flex h-12 w-full items-center justify-center gap-2 rounded-xl"><Lock size={16} /> <T>{"Reset Password"}</T></button></form>}
      {step === 2 && <div className="flex flex-col items-center gap-3 py-4 text-center"><span className="flex size-14 items-center justify-center rounded-full bg-pass/20 text-pass-fg"><Check size={28} /></span><p className="font-semibold"><T>{"Password updated"}</T></p><Link href="/login" className="cta mt-2 inline-flex h-11 items-center rounded-xl px-6"><T>{"Sign In"}</T></Link></div>}
    </AuthShell>
  );
}
