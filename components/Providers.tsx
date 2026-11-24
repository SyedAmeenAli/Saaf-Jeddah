"use client";
import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { useStore } from "@/lib/store";
import { Aurora } from "@/components/ui/Aurora";
import { Toasts } from "@/components/shell/Toasts";

export function Providers({ children }: { children: React.ReactNode }) {
  const init = useStore((s) => s.init);
  const theme = useStore((s) => s.theme);
  const lang = useStore((s) => s.lang);
  const ready = useStore((s) => s.ready);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (!ready) return;
    const d = document.documentElement;
    d.setAttribute("data-theme", theme);
    d.lang = lang;
    d.dir = lang === "ar" ? "rtl" : "ltr";
  }, [theme, lang, ready]);

  useEffect(() => {
    const on = () => document.documentElement.classList.toggle("hidden-tab", document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Aurora />
      {children}
      <Toasts />
    </MotionConfig>
  );
}
