"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { AuthShell } from "@/components/features/AuthShell";
import { inputCls } from "@/components/ui/Glass";

export default function Login() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [emp, setEmp] = useState("");
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next ? `/role?next=${encodeURIComponent(next)}` : "/role");
  };
  return (
    <AuthShell crop="engine" title="Welcome back" subtitle="Sign in to your account"
      footer={<Link href="/request-access" className="text-teal hover:underline">Request access</Link>}>
      <form onSubmit={go} className="space-y-4">
        <label className="relative block">
          <User size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-faint" />
          <input className={`${inputCls} ps-11`} placeholder="Employee Number" value={emp} onChange={(e) => setEmp(e.target.value.toUpperCase())} aria-label="Employee number" autoComplete="username" />
        </label>
        <label className="relative block">
          <Lock size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-faint" />
          <input className={`${inputCls} px-11`} type={show ? "text" : "password"} placeholder="Password" aria-label="Password" autoComplete="current-password" />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute end-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-faint hover:text-fg">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </label>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted"><input type="checkbox" defaultChecked className="size-4 accent-[var(--teal)]" /> Remember me</label>
          <Link href="/reset-password" className="text-teal hover:underline">Forgot password?</Link>
        </div>
        <button type="submit" className="cta flex h-12 w-full items-center justify-center gap-2 rounded-xl">Sign In <ArrowRight size={18} className="rtl:rotate-180" /></button>
        <div className="flex items-center gap-3 text-xs text-faint"><span className="h-px flex-1 bg-hair-strong" />or<span className="h-px flex-1 bg-hair-strong" /></div>
        <button type="button" onClick={() => router.push("/role")} className="glass flex h-12 w-full items-center justify-center text-sm font-medium hover:bg-hi" style={{ borderRadius: 6 }}>Use Company SSO (demo)</button>
        <p className="text-center text-xs text-faint">Demo: any credentials work. Pick a role on the next screen.</p>
      </form>
    </AuthShell>
  );
}
