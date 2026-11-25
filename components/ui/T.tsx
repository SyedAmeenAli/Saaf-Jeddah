"use client";
import { useT } from "@/lib/hooks";

/** Translates a literal string child using the active language. Falls back to the English text. */
export function T({ children }: { children: string }) {
  const t = useT();
  return <>{t(children)}</>;
}
