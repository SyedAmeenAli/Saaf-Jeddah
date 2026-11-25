"use client";
import { useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Chip, PageHeader, StatusBadge } from "@/components/ui/Glass";

const SWATCHES = [["Background", "#050B18"], ["Background 2", "#0A1630"], ["Teal (accent)", "#2DD4BF"], ["Teal deep", "#14B8A6"], ["Pass", "#22C55E"], ["Fail", "#EF4444"], ["Pending", "#F5A524"], ["Info", "#3B82F6"]];

export default function DesignPage() {
  const toast = useStore((s) => s.toast);
  const [chip, setChip] = useState(true);
  return (
    <>
      <PageHeader title="Design system" sub="Tokens and components used across SAFAA. Compare against the reference sheets in /reference." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="glass p-5" style={{ borderRadius: 8 }}>
          <h2 className="mb-3 text-base font-semibold">Colour</h2>
          <div className="grid grid-cols-4 gap-3">{SWATCHES.map(([n, c]) => <div key={n}><div className="h-12 rounded-lg border border-white/15" style={{ background: c }} /><p className="mt-1 text-[11px] text-muted">{n}</p><p className="font-mono text-[11px]">{c}</p></div>)}</div>
        </section>
        <section className="glass p-5" style={{ borderRadius: 8 }}>
          <h2 className="mb-3 text-base font-semibold">Type (Inter)</h2>
          <p className="text-[40px] font-semibold leading-[44px] tracking-tight">Display 40/44</p>
          <p className="text-[28px] font-semibold leading-8">Page title 28/32</p>
          <p className="text-base font-semibold">Card title 16/24</p>
          <p className="text-sm">Body 14/20 with tabular figures 0123456789</p>
          <p className="text-xs text-muted">Caption 12/16 secondary</p>
        </section>
        <section className="glass p-5" style={{ borderRadius: 8 }}>
          <h2 className="mb-3 text-base font-semibold">Buttons and chips</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={() => toast("pass", "Primary button")}>Sign In <ArrowRight size={16} /></Button><Button onClick={() => toast("info", "Secondary button")}>Secondary</Button><Button variant="danger" onClick={() => toast("fail", "Danger button")}>Save &amp; Notify</Button>
            <Chip active={chip} onClick={() => setChip(true)}>Active</Chip><Chip active={!chip} onClick={() => setChip(false)}>Chip</Chip>
          </div>
        </section>
        <section className="glass p-5" style={{ borderRadius: 8 }}>
          <h2 className="mb-3 text-base font-semibold">Status (colour plus icon)</h2>
          <div className="flex flex-wrap gap-2"><StatusBadge kind="pass">Pass</StatusBadge><StatusBadge kind="fail">Fail</StatusBadge><StatusBadge kind="pending">Pending</StatusBadge><StatusBadge kind="info">Info</StatusBadge><StatusBadge kind="locked">Locked</StatusBadge></div>
          <div className="mt-4 flex gap-2"><span className="flex size-9 items-center justify-center rounded-lg bg-pass text-white"><Check size={16} /></span><span className="flex size-9 items-center justify-center rounded-lg border border-white/20 text-muted"><X size={16} /></span></div>
        </section>
        <section className="glass p-5 lg:col-span-2" style={{ borderRadius: 8 }}>
          <h2 className="mb-3 text-base font-semibold">Surfaces</h2>
          <p className="text-sm text-muted">Glass: 5% white fill, 20px blur at 140% saturation, 1px 10% border, inset top highlight. Radius 16 (cards), 24 (panels, phone frames), 12 (inputs, buttons). Icons: lucide, 1.5 stroke, 16/20/24.</p>
        </section>
      </div>
    </>
  );
}
