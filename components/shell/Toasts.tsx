"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 md:items-end md:pe-6" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const I = t.kind === "pass" ? Check : t.kind === "fail" ? X : Info;
          return (
            <motion.div
              key={t.id} layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={spring}
              className={cn("glass glass-strong pointer-events-auto flex w-full max-w-sm items-center gap-3 px-4 py-3 text-sm", t.kind === "fail" && "border-fail/60")}
              style={{ borderRadius: 8 }}
              role={t.kind === "fail" ? "alert" : "status"}
              onClick={() => dismiss(t.id)}
            >
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", t.kind === "pass" ? "bg-pass/25 text-pass-fg" : t.kind === "fail" ? "bg-fail/25 text-fail-fg" : "bg-info/25 text-info-fg")}>
                <I size={15} strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1 font-medium">{t.text}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
