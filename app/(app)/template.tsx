"use client";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";

/** Shared-axis page transition: short slide + fade on enter (mirrored for RTL). */
export default function Template({ children }: { children: React.ReactNode }) {
  const rtl = useStore((s) => s.lang) === "ar";
  return (
    <motion.div
      initial={{ opacity: 0, x: rtl ? -18 : 18, filter: "blur(6px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
