"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock, Lock, Nfc, FileText, MapPin, Truck } from "lucide-react";
import { PageHeader } from "@/components/ui/Glass";
import { Photo } from "@/components/ui/Photo";
import { PhoneFrame, NfcTag } from "@/components/illustrations/Doodles";
import { SafaaLogo } from "@/components/shell/Brand";
import { T } from "@/components/ui/T";

function Screen({ title, back = true, children, bottom }: { title?: string; back?: boolean; children: React.ReactNode; bottom?: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col px-4 pb-4 pt-10 text-[12px]">
      {title && <div className="mb-3 flex items-center justify-center text-sm font-semibold">{back && <ArrowLeft size={16} className="absolute start-4" />}{title}</div>}
      <div className="flex-1 overflow-hidden">{children}</div>
      {bottom}
    </div>
  );
}
const Btn = ({ children, blue, href }: { children: React.ReactNode; blue?: boolean; href: string }) => <Link href={href} className={`flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold ${blue ? "cta-blue" : "cta"}`}>{children}</Link>;
const Row = ({ I, l, v }: { I: typeof Truck; l: string; v: string }) => <div className="flex items-center gap-3 border-b border-white/10 py-2.5 last:border-0"><I size={16} strokeWidth={1.5} className="text-muted" /><div><p className="text-[10px] text-muted">{l}</p><p className="font-medium">{v}</p></div></div>;

export default function MobileShowcase() {
  const frames: [string, React.ReactNode][] = [
    ["Welcome", (
      <Photo key="a" crop="tower" className="h-full" scrim="from-[#0d0818]/50 to-[#0d0818]/95">
        <div className="flex h-full flex-col items-center justify-between px-5 pb-6 pt-14 text-center"><span className="font-bold tracking-wider">APSCO</span><div className="flex flex-col items-center gap-2"><SafaaLogo stacked size={36} /><p className="text-[11px] text-white/80"><T>{"Aviation Fuel Quality Assurance"}</T></p></div><div className="w-full"><Btn href="/login"><T>{"Get Started"}</T> <ArrowRight size={14} /></Btn></div></div>
      </Photo>)],
    ["NFC Sampling", (
      <Photo key="b" crop="tanker" className="h-full" scrim="from-[#0d0818]/50 to-[#0d0818]/90">
        <Screen title="NFC Sampling"><div className="mt-8 flex flex-col items-center gap-4"><div className="glass flex size-28 items-center justify-center" style={{ borderRadius: 24 }}><NfcTag className="size-14 text-teal" /></div><p className="text-center text-muted"><T>{"Bring your device close to the tag to start sampling"}</T></p></div></Screen>
      </Photo>)],
    ["Point detected", (
      <Screen key="c" title="Sampling Point Detected" bottom={<Btn href="/scan"><T>{"Start Quality Check"}</T> <ArrowRight size={14} /></Btn>}>
        <div className="mt-6 flex flex-col items-center gap-4"><span className="flex size-16 items-center justify-center rounded-full bg-pass/20 text-pass-fg"><Check size={32} /></span>
          <div className="glass w-full px-3" style={{ borderRadius: 12 }}><Row I={Truck} l="Vehicle" v="REF-014 (Refueller)" /><Row I={MapPin} l="Location" v="Location 02" /><Row I={Nfc} l="Sampling point" v="Filter Outlet" /></div></div>
      </Screen>)],
    ["Fuel quality check", (
      <Screen key="d" title="Fuel Quality Check" bottom={<Btn blue href="/approvals"><T>{"Submit for Verification"}</T></Btn>}>
        <p className="mb-2 font-semibold"><T>{"Visual Appearance Check"}</T></p>
        {["Colour", "Sediments", "Water", "Bacteria signs"].map((x) => <div key={x} className="mb-1.5 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"><span>{x}</span><span className="flex gap-1.5"><span className="flex size-7 items-center justify-center rounded-md bg-pass/80 text-white"><Check size={14} /></span><span className="flex size-7 items-center justify-center rounded-md border border-white/20 text-muted">✕</span></span></div>)}
        <div className="mt-3 rounded-lg bg-white/5 px-3 py-2"><T>{"Employee Number"}</T><p className="font-mono text-muted">EMP-1024</p></div>
      </Screen>)],
    ["Submitted", (
      <Screen key="e" title="Sampling Submitted" bottom={<Btn href="/reports"><T>{"View Report"}</T></Btn>}>
        <div className="mt-6 flex flex-col items-center gap-3"><span className="flex size-20 items-center justify-center rounded-full border-4 border-teal text-teal"><Check size={36} /></span><p className="text-muted"><T>{"Waiting for Supervisor Verification"}</T></p>
          <ul className="glass w-full space-y-3 p-3" style={{ borderRadius: 12 }}><li className="flex items-center gap-2"><Check size={14} className="text-pass-fg" /><T>{"Operator Entry"}</T></li><li className="flex items-center gap-2"><Clock size={14} className="text-pending-fg" /><T>{"Supervisor Verification"}</T></li><li className="flex items-center gap-2 text-faint"><Lock size={14} /><T>{"Finalised"}</T></li></ul></div>
      </Screen>)],
    ["Reports", (
      <Screen key="f" title="Reports" bottom={<Btn href="/reports"><T>{"Generate Report"}</T></Btn>}>
        {["Daily Sampling Report", "Vehicle-wise Report", "Location-wise Report", "Failure & Corrective Action", "JIG-aligned Checklist"].map((x) => <Link key={x} href="/reports" className="mb-1.5 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5"><FileText size={14} strokeWidth={1.5} className="text-teal" />{x}<ArrowRight size={12} className="ms-auto text-faint" /></Link>)}
      </Screen>)],
  ];
  return (
    <>
      <PageHeader title="Mobile app" sub="Operator flow as it appears on a phone. Under 768px the real app uses these native mobile layouts." />
      <div className="no-scrollbar flex gap-6 overflow-x-auto pb-6">
        {frames.map(([label, node]) => (
          <figure key={label} className="shrink-0"><PhoneFrame>{node}</PhoneFrame><figcaption className="mt-3 text-center text-sm text-muted">{label}</figcaption></figure>
        ))}
      </div>
    </>
  );
}
