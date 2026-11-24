"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/** Thin teal progress line that sweeps across the top on every route change. */
export function RouteProgress() {
  const pathname = usePathname();
  const [key, setKey] = useState(0);
  const [prev, setPrev] = useState(pathname);
  if (pathname !== prev) { setPrev(pathname); setKey((k) => k + 1); }
  useEffect(() => {
    if (!key) return;
    const id = setTimeout(() => setKey(0), 900);
    return () => clearTimeout(id);
  }, [key]);
  return (
    <AnimatePresence>
      {key > 0 && (
        <motion.div key={key} aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[150] h-[2px] origin-left bg-gradient-to-r from-sky via-teal to-amber"
          initial={{ scaleX: 0, opacity: 1 }} animate={{ scaleX: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      )}
    </AnimatePresence>
  );
}
