"use client";
import { Check, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useApplicable, useCan, useT } from "@/lib/hooks";
import { OCCASION_ORDER, OCCASIONS, POINTS, POINT_ORDER } from "@/lib/domain";
import type { VehicleType } from "@/lib/types";
import { PageHeader, Rise, Stagger, StatusBadge } from "@/components/ui/Glass";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

function Matrix({ type }: { type: VehicleType }) {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const applicable = useApplicable();
  const can = useCan();
  const toggle = useStore((s) => s.toggleMatrix);
  const editable = can("admin");
  return (
    <div className="glass overflow-hidden" style={{ borderRadius: 20 }}>
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="font-display text-xl font-semibold">{type === "refueller" ? t("Refuellers") : t("Hydrant dispensers")}</h2>
        <StatusBadge kind="info">{type === "refueller" ? "4 points" : "2 points"}</StatusBadge>
      </div>
      <div>
        <table className="w-full text-sm md:min-w-[34rem]">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted">
              <th className="px-3 py-3 text-start font-semibold md:px-5">{t("Occasion")}</th>
              {POINT_ORDER.map((p) => <th key={p} className="px-1 py-3 text-center font-semibold md:px-2"><span className="hidden md:inline">{lang === "ar" ? POINTS[p].labelAr : POINTS[p].label}</span><span className="md:hidden" title={POINTS[p].label}>{POINTS[p].code}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {OCCASION_ORDER.map((o, ri) => {
              const req = applicable(o, type);
              const rowNA = req.length === 0;
              return (
                <tr key={o} className="border-t border-hair">
                  <td className="max-w-[7.5rem] px-3 py-3 text-[12.5px] font-medium leading-tight md:max-w-none md:px-5 md:py-3.5 md:text-sm">{lang === "ar" ? OCCASIONS[o].labelAr : OCCASIONS[o].label}{OCCASIONS[o].refuellerOnly && <span className="ms-2 text-xs text-faint">({t("Refueller")})</span>}</td>
                  {POINT_ORDER.map((p, ci) => {
                    const on = req.includes(p);
                    const na = POINTS[p].tank && type === "dispenser";
                    return (
                      <td key={p} className="px-0.5 py-2 text-center md:px-2">
                        {editable && !na && !(OCCASIONS[o].refuellerOnly && type !== "refueller") ? (
                          <button type="button" onClick={() => toggle(o, p)} aria-pressed={on} aria-label={`${OCCASIONS[o].label}, ${POINTS[p].label}: ${on ? "required" : "not required"}. Toggle`}
                            className={cn("mx-auto flex size-8 items-center justify-center rounded-full border transition-colors md:size-9", on ? "border-teal/60 bg-teal/20 text-teal" : "border-hair text-faint hover:border-teal/40 hover:text-teal")}>{on ? <Check size={17} strokeWidth={3} /> : <Minus size={14} />}</button>
                        ) : on ? (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.1 + (ri * 4 + ci) * 0.015 }}
                            className="mx-auto flex size-8 items-center justify-center rounded-full border border-teal/50 bg-teal/15 text-teal md:size-9" aria-label="Required"><Check size={17} strokeWidth={3} /></motion.span>
                        ) : na ? (
                          <span className="mx-auto inline-flex h-7 items-center rounded-lg bg-hi px-2 text-[11px] font-semibold text-faint" title={t("Not applicable")}>N/A</span>
                        ) : (
                          <span className={cn("mx-auto flex size-8 items-center justify-center text-faint/50 md:size-9", rowNA && "opacity-60")} aria-label="Not required"><Minus size={14} /></span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MatrixPage() {
  const t = useT();
  const can = useCan();
  return (
    <>
      <PageHeader title={t("Sampling matrix")} sub={can("admin") ? "Occasions × sampling points × equipment type. Select a cell to change what is required. Changes are audited." : "Occasions × sampling points × equipment type. Hydrant dispensers have no tank, so tank rows are N/A."} />
      <Stagger className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
        <Rise><Matrix type="refueller" /></Rise>
        <Rise><Matrix type="dispenser" /></Rise>
      </Stagger>
      <p className="mt-4 text-xs text-faint md:hidden">TS tank sump · FS filter sump · FO filter outlet · TD tank drain</p>
      <p className="mt-3 flex items-center gap-2 text-sm text-muted"> {t("Proposed operational matrix, to be approved by APSCO QC.")}</p>
    </>
  );
}
