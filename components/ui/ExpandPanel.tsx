"use client";
import { ExpandCard } from "./Expand";
import { cn } from "@/lib/utils";

/** A titled analytics panel that expands (shared element) into a full-screen view of the same content. */
export function ExpandPanel({ id, title, sub, children, detail, className, pad = true }: { id: string; title: string; sub?: string; children: React.ReactNode; detail?: () => React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <ExpandCard id={id} title={title} className={className}
      card={<div className={cn("h-full", pad && "p-5")}><h3 className="text-base font-semibold">{title}</h3>{sub ? <p className="mb-4 mt-0.5 text-xs text-muted">{sub}</p> : <div className="mb-3" />}{children}</div>}
      detail={() => <div className="mx-auto max-w-4xl space-y-5">{sub && <p className="text-sm text-muted">{sub}</p>}{detail ? detail() : <div className="glass p-6" style={{ borderRadius: 20 }}>{children}</div>}</div>} />
  );
}
