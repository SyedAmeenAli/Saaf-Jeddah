"use client";
import { Moon, Sun, Languages, Wifi, WifiOff, RefreshCw, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { ROLE_META } from "@/lib/domain";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const t = useT();
  const dark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={`${t("Theme")}: ${dark ? "dark" : "light"}`}
      className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-md bg-hi px-3 text-sm text-muted transition-colors hover:text-fg"
    >
      <motion.span key={theme} initial={{ rotate: -80, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={spring}>
        {dark ? <Moon size={18} /> : <Sun size={18} />}
      </motion.span>
      {!compact && <span>{dark ? "Dark" : "Light"}</span>}
    </button>
  );
}

export function LangToggle({ compact }: { compact?: boolean }) {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const t = useT();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      aria-label={t("Language")}
      className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-md bg-hi px-3 text-sm text-muted transition-colors hover:text-fg"
    >
      <Languages size={18} />
      {!compact && <span>{lang === "en" ? "العربية" : "English"}</span>}
    </button>
  );
}

export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);
  const lang = useStore((s) => s.lang);
  const t = useT();
  const roles = Object.keys(ROLE_META) as Role[];
  if (compact) {
    return (
      <div className="flex flex-col gap-1" role="radiogroup" aria-label={t("Role")}>
        {roles.map((r) => (
          <button key={r} role="radio" aria-checked={role === r} title={ROLE_META[r].label} onClick={() => setRole(r)}
            className={cn("flex size-10 items-center justify-center rounded-xl text-xs font-bold", role === r ? "bg-teal/25 text-fg" : "bg-hi text-muted")}>
            {ROLE_META[r].label[0]}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div role="radiogroup" aria-label={t("Role")} className="grid grid-cols-2 gap-1 rounded-md bg-hi p-1">
      {roles.map((r) => (
        <button key={r} role="radio" aria-checked={role === r} onClick={() => setRole(r)}
          className={cn("relative min-h-10 rounded-xl px-2 text-xs font-semibold transition-colors", role === r ? "text-fg" : "text-muted hover:text-fg")}>
          {role === r && <motion.span layoutId="rolepill" className="absolute inset-0 rounded-xl border border-hair-strong bg-teal/20" transition={spring} />}
          <span className="relative">{lang === "ar" ? ROLE_META[r].labelAr : ROLE_META[r].label}</span>
        </button>
      ))}
    </div>
  );
}

export function SyncPill() {
  const offline = useStore((s) => s.offline);
  const queued = useStore((s) => s.queued);
  const syncing = useStore((s) => s.syncing);
  const toggle = useStore((s) => s.toggleOffline);
  const t = useT();
  const label = syncing ? "Syncing…" : offline ? `${t("Offline")} · ${queued} ${t("queued")}` : `${t("Online")} · ${t("Synced")}`;
  const tone = syncing ? "text-info-fg" : offline ? "text-pending-fg" : "text-pass-fg";
  return (
    <button
      onClick={toggle}
      title="Demo: toggle offline mode. Submissions queue while offline and sync when back online."
      aria-label={`${label}. Toggle offline demo mode`}
      className="glass flex h-10 items-center gap-2 px-3 text-xs font-semibold"
      style={{ borderRadius: 6 }}
    >
      <span className={tone}>
        {syncing ? <RefreshCw size={14} className="animate-spin" /> : offline ? <WifiOff size={14} /> : <Wifi size={14} />}
      </span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  );
}

export function SignOut() {
  const logout = useStore((s) => s.logout);
  const t = useT();
  return (
    <button onClick={logout} aria-label={t("Sign out")} className="flex h-11 min-w-11 items-center justify-center rounded-md bg-hi px-3 text-muted hover:text-fg">
      <LogOut size={18} />
    </button>
  );
}
