"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useStore, empName, currentUserId } from "@/lib/store";
import { useT } from "@/lib/hooks";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROLE_NAV } from "./nav";
import { SafaaLogo } from "./Brand";
import { RoleSwitcher, SignOut } from "./Controls";
import { ROLE_META } from "@/lib/domain";

export const SIDEBAR_W = 250;
export const SIDEBAR_W_COLLAPSED = 76;

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggle = useStore((s) => s.toggleSidebar);
  const role = useStore((s) => s.role);
  const lang = useStore((s) => s.lang);
  const employees = useStore((s) => s.employees);
  const t = useT();
  const items = ROLE_NAV[role];
  const groups = [...new Set(items.map((i) => i.group))];
  const uid = currentUserId(role);
  const name = empName(employees, uid, lang);
  const initials = name.replace(/^(Dr\. |د\. )/, "").split(" ").slice(0, 2).map((x) => x[0]).join("");

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W }}
      transition={spring}
      className="glass fixed inset-y-3 start-3 z-40 hidden flex-col overflow-hidden p-3 lg:flex"
      style={{ borderRadius: 20 }}
      aria-label="Primary"
    >
      <div className={cn("flex items-center px-1 pb-4 pt-1", collapsed ? "justify-center" : "justify-between")}>
        <SafaaLogo compact={collapsed} />
        {!collapsed && (
          <button onClick={toggle} aria-label={t("Collapse")} className="flex size-8 items-center justify-center rounded-lg text-faint hover:bg-white/10 hover:text-fg">
            <PanelLeftClose size={16} strokeWidth={1.5} className="rtl:rotate-180" />
          </button>
        )}
      </div>
      {collapsed && (
        <button onClick={toggle} aria-label={t("Expand")} className="mx-auto mb-2 flex size-8 items-center justify-center rounded-lg text-faint hover:bg-white/10 hover:text-fg">
          <PanelLeftOpen size={16} strokeWidth={1.5} className="rtl:rotate-180" />
        </button>
      )}

      <nav className="no-scrollbar -mx-1 flex-1 space-y-0.5 overflow-y-auto px-1 py-1">
        {groups.map((g) => {
          const gi = items.filter((n) => n.group === g);
          if (!gi.length) return null;
          return (
            <div key={g} className="pb-2">
              {!collapsed && <p className="eyebrow px-3 pb-1 pt-3 !text-[10.5px] !text-faint">{t(g)}</p>}
              {collapsed && <span className="mx-auto my-2 block h-px w-6 bg-hair" />}
              {gi.map((n) => {
                const on = pathname === n.href || pathname.startsWith(n.href + "/");
                const Icon = n.icon;
                return (
                  <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} title={t(n.label)}
                    className={cn("group relative flex h-10 items-center gap-3 rounded-[14px] px-3 text-sm font-medium transition-colors", on ? "text-white" : "text-muted hover:bg-white/[0.06] hover:text-fg", collapsed && "justify-center px-0")}>
                    {on && <motion.span layoutId="navpill" className="absolute inset-0 rounded-[14px] border border-teal/35 bg-gradient-to-b from-teal/25 to-teal/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_-10px_rgba(89,223,206,0.55)]" transition={spring} />}
                    <Icon size={18} strokeWidth={1.5} className={cn("relative shrink-0 transition-transform duration-200 group-hover:scale-110", on && "text-teal")} />
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
        <div className={cn("flex items-center gap-2.5 rounded-xl bg-white/5 p-2", collapsed && "justify-center")}>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky to-teal text-xs font-semibold text-[#04121a]">{initials}</div>
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
