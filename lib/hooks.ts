"use client";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "./store";
import { translate } from "./i18n";
import type { Role } from "./types";

export function useT() {
  const lang = useStore((s) => s.lang);
  return useCallback((s: string) => translate(lang, s), [lang]);
}
export function useIsRtl() {
  return useStore((s) => s.lang) === "ar";
}

export type Cap = "sample" | "verify" | "release" | "admin" | "amend" | "export";
export const DEFAULT_CAPS: Record<Role, Cap[]> = {
  operator: ["sample"],
  supervisor: ["verify", "release", "amend", "export"],
  manager: ["export"],
  admin: ["admin", "export"],
};
export function useCan() {
  const role = useStore((s) => s.role);
  const perms = useStore((s) => s.perms);
  return useCallback((c: Cap) => (perms[role] ?? DEFAULT_CAPS[role]).includes(c), [role, perms]);
}

export function useMedia(q: string, initial = false) {
  const [m, setM] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}

export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(i);
  }, [intervalMs]);
  return now;
}
