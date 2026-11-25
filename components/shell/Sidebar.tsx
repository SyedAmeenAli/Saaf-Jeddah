"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useStore, empName, currentUserId } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";
import { SafaaLogo } from "./Brand";
import { RoleSwitcher, SignOut } from "./Controls";
import { ROLE_META } from "@/lib/domain";

const GROUPS: [string, string[]][] = [
  ["Operations", ["/dashboard", "/scan", "/records", "/approvals", "/holds"]],
  ["Assets", ["/fleet", "/locations", "/matrix"]],
  ["Insight", ["/reports", "/audit", "/training"]],
  ["Manage", ["/users", "/admin", "/hardware", "/settings", "/mobile"]],
];
export const SIDEBAR_W = 224;
export const SIDEBAR_W_COLLAPSED = 64;

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggle = useStore((s) => s.toggleSidebar);
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);
  const employees = useStore((s) => s.employees);
  const t = useT();
  const items = NAV.filter((n) => n.roles.includes(role));
  const uid = currentUserId(role);
  const name = empName(employees, uid, lang);
  const initials = name.replace(/^(Dr\. |د\. )/, "").split(" ").slice(0, 2).map((x) => x[0]).join("");

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W }}
      transition={spring}
      className="fixed inset-y-0 start-0 z-40 hidden flex-col overflow-hidden border-e border-hair bg-[var(--glass)] p-3 lg:flex"
      aria-label="Primary"
    >
      <div className={cn("flex items-center px-1 pb-4 pt-1", collapsed ? "justify-center" : "justify-between")}>
        <SafaaLogo compact={collapsed} />
        {!collapsed && (
          <button onClick={toggle} aria-label={t("Collapse")} className="flex size-8 items-center justify-center rounded-md text-faint hover:bg-hi hover:text-fg">
            <PanelLeftClose size={16} strokeWidth={1.5} className="rtl:rotate-180" />
          </button>
        )}
      </div>
      {collapsed && (
        <button onClick={toggle} aria-label={t("Expand")} className="mx-auto mb-2 flex size-8 items-center justify-center rounded-md text-faint hover:bg-hi hover:text-fg">
          <PanelLeftOpen size={16} strokeWidth={1.5} className="rtl:rotate-180" />
        </button>
      )}

      <nav className="no-scrollbar -mx-1 flex-1 space-y-0.5 overflow-y-auto px-1 py-1">
        {GROUPS.map(([g, hrefs]) => {
          const gi = items.filter((n) => hrefs.includes(n.href));
          if (!gi.length) return null;
          return (
            <div key={g} className="pb-2">
              {!collapsed && <p className="eyebrow px-3 pb-1.5 pt-3">{g}</p>}
              {collapsed && <span className="mx-auto my-2 block h-px w-6 bg-hair" />}
              {gi.map((n) => {
                const on = pathname === n.href || pathname.startsWith(n.href + "/");
                const Icon = n.icon;
                return (
                  <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} title={t(n.label)}
                    className={cn("relative flex h-9 items-center gap-3 rounded-md px-3 text-[13.5px] font-medium transition-colors", on ? "text-fg" : "text-muted hover:bg-hi hover:text-fg", collapsed && "justify-center px-0")}>
                    {on && <motion.span layoutId="navpill" className="absolute inset-0 rounded-md bg-hi before:absolute before:inset-y-1.5 before:start-0 before:w-0.5 before:rounded-full before:bg-teal" transition={spring} />}
                    <Icon size={17} strokeWidth={1.5} className={cn("relative shrink-0", on && "text-teal")} />
                    {!collapsed && <span className="relative truncate">{t(n.label)}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="mt-2 space-y-2 border-t border-hair pt-3">
        {!collapsed && <RoleSwitcher />}
        <div className={cn("flex items-center gap-2.5 rounded-md border border-hair bg-bg p-2", collapsed && "justify-center")}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-hi font-mono text-xs font-medium text-teal">{initials}</div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-medium">{name}</div>
                <div className="truncate text-xs text-muted">{lang === "ar" ? ROLE_META[role].labelAr : ROLE_META[role].label}</div>
              </div>
              <SignOut />
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
