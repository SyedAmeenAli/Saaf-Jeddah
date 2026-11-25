"use client";
import { forwardRef, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { motion, animate, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { createPortal } from "react-dom";
import { Check, Clock, X, Lock, Search, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion";
import { useT } from "@/lib/hooks";

/* ---------- Card with cursor-following sheen ---------- */
export const GlassCard = forwardRef<HTMLDivElement, HTMLMotionProps<"div"> & { lift?: boolean; sheen?: boolean }>(function GlassCard(
  { className, lift = false, sheen = true, onPointerMove, style, ...p }, ref,
) {
  return (
    <motion.div
      ref={ref}
      whileHover={lift ? { y: -4 } : undefined}
      transition={spring}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
        onPointerMove?.(e);
      }}
      className={cn("glass", sheen && "sheen", lift && "hover-glow", className)}
      style={{ borderRadius: 20, ...style }}
      {...p}
    />
  );
});

/* ---------- Button system: primary / secondary / ghost / danger ---------- */
type BtnProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: "primary" | "glass" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg" | "sm";
  children?: React.ReactNode;
};
export function Button({ variant = "glass", size = "md", className, children, ...p }: BtnProps) {
  const sizes = { sm: "h-9 px-3.5 text-[13px]", md: "h-11 px-5 text-sm", lg: "h-12 px-7 text-[15px]" };
  const variants = { primary: "cta", glass: "btn-secondary", secondary: "btn-secondary", ghost: "btn-ghost", danger: "btn-danger" };
  return (
    <motion.button
      style={{ borderRadius: 16 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={cn("inline-flex min-h-9 items-center justify-center gap-2 rounded-2xl font-medium disabled:cursor-not-allowed disabled:opacity-45", sizes[size], variants[variant], className)}
      {...p}
    >
      {children}
    </motion.button>
  );
}
export const GlassButton = Button;

/** Round glass icon button with a tooltip. */
export function GlassIconButton({ label, children, onClick, className, size = 44, active }: { label: string; children: React.ReactNode; onClick?: () => void; className?: string; size?: number; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={cn("group btn-secondary relative flex shrink-0 items-center justify-center rounded-2xl", active && "!border-teal/60 text-teal", className)} style={{ width: size, height: size, borderRadius: 14 }}>
      {children}
      <span role="tooltip" className="pointer-events-none absolute -bottom-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg border border-hair bg-[#0b1928]/95 px-2 py-1 text-[11px] text-fg opacity-0 transition-opacity duration-150 group-hover:opacity-100 max-lg:hidden">{label}</span>
    </button>
  );
}

/* ---------- Chip ---------- */
export function Chip({ active, children, onClick, className, icon }: { active?: boolean; children: React.ReactNode; onClick?: () => void; className?: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-all",
        active ? "border-teal bg-teal/20 text-fg shadow-[0_0_20px_-6px_var(--teal)]" : "border-hair bg-hi text-muted hover:text-fg",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------- Status badge: always colour + icon ---------- */
export type StatusKind = "pass" | "fail" | "pending" | "info" | "locked";
const SK = {
  pass: { c: "text-pass-fg bg-pass/15 border-pass/40", I: Check },
  fail: { c: "text-fail-fg bg-fail/15 border-fail/40", I: X },
  pending: { c: "text-pending-fg bg-pending/15 border-pending/40", I: Clock },
  info: { c: "text-info-fg bg-info/15 border-info/40", I: Clock },
  locked: { c: "text-fg bg-hi border-hair-strong", I: Lock },
};
export function StatusBadge({ kind, children, className }: { kind: StatusKind; children: React.ReactNode; className?: string }) {
  const { c, I } = SK[kind];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", c, className)}>
      <I size={12} strokeWidth={2.5} aria-hidden="true" />
      {children}
    </span>
  );
}

/* ---------- Count-up number ---------- */
export function CountUp({ value, decimals = 0, suffix = "", className }: { value: number; decimals?: number; suffix?: string; className?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1], onUpdate: (n) => setV(n) });
    return () => c.stop();
  }, [value]);
  return <span className={cn("tnum", className)}>{v.toFixed(decimals)}{suffix}</span>;
}

/* ---------- Progress ring ---------- */
export function Ring({ value, size = 160, stroke = 14, children, color = "url(#ringg)" }: { value: number; size?: number; stroke?: number; children?: React.ReactNode; color?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--hair-strong)" strokeWidth={stroke} opacity=".5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, sub, actions, visible = false }: { title: string; sub?: string; actions?: React.ReactNode; visible?: boolean }) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-4", !visible && !actions && "lg:hidden")}>
      <div className={cn(!visible && "lg:sr-only")}>
        <h1 className="text-[28px] font-semibold leading-8 tracking-tight">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
      {children}
    </motion.div>
  );
}
export function Rise({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: spring } }}>
      {children}
    </motion.div>
  );
}

/* ---------- Portal helper ---------- */
export function Portal({ children }: { children: React.ReactNode }) {
  const m = useSyncExternalStore(() => () => {}, () => true, () => false);
  return m ? createPortal(children, document.body) : null;
}

/* ---------- Modal + bottom sheet ---------- */
export function Modal({ open, onClose, title, children, sheet = false, wide = false, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; sheet?: boolean; wide?: boolean; footer?: React.ReactNode }) {
  const t = useT();
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; prev?.focus?.(); };
  }, [open, onClose]);
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className={cn("fixed inset-0 z-[80] flex justify-center", sheet ? "items-end md:items-center" : "items-center", "p-0 md:p-6")}>
            <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.div
              ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id}
              initial={sheet ? { y: "100%" } : { opacity: 0, scale: 0.94, y: 12 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={sheet ? { y: "100%" } : { opacity: 0, scale: 0.96 }}
              transition={spring}
              className={cn("glass glass-strong relative flex max-h-[92dvh] w-full flex-col overflow-hidden outline-none", wide ? "max-w-3xl" : "max-w-lg", sheet && "rounded-b-none md:rounded-b-[28px]")}
              style={{ borderRadius: 20 }}
            >
              <div className="flex items-center justify-between gap-3 px-6 pb-3 pt-5">
                <h2 id={id} className="text-xl font-semibold">{title}</h2>
                <button onClick={onClose} aria-label={t("Close")} className="flex size-10 items-center justify-center rounded-full bg-hi text-muted hover:text-fg">
                  <XIcon size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
              {footer && <div className="shrink-0 border-t border-hair px-6 py-4">{footer}</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ---------- Form bits ---------- */
export const inputCls = "h-12 w-full rounded-xl border border-hair-strong bg-white/5 px-4 text-sm text-fg placeholder:text-faint focus:border-teal focus:outline-none";
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <p className="font-display text-lg font-medium">{title}</p>
      {sub && <p className="max-w-sm text-sm text-muted">{sub}</p>}
    </div>
  );
}

/* ---------- Tabs: one pattern for every tabbed screen ---------- */
export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: readonly (readonly [T, string, number?])[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("no-scrollbar mb-4 flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white/5 p-1", className)} role="tablist">
      {tabs.map(([k, l, n]) => (
        <button key={k} type="button" role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={cn("h-10 shrink-0 flex-1 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors", value === k ? "bg-teal/20 text-teal" : "text-muted hover:text-fg")}>
          {l}{n !== undefined ? ` (${n})` : ""}
        </button>
      ))}
    </div>
  );
}

/* ---------- Card: titled glass section ---------- */
export function Card({ title, action, children, className, pad = true }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn("glass", pad && "p-5", className)} style={{ borderRadius: 16 }}>
      {(title || action) && (
        <div className={cn("mb-3 flex items-center justify-between gap-3", !pad && "px-5 pt-5")}>
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------- Search field ---------- */
export function SearchField({ value, onChange, placeholder, label = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  return (
    <label className="flex h-10 min-w-48 flex-1 items-center gap-2 rounded-xl bg-white/5 px-3.5">
      <Search size={16} strokeWidth={1.5} className="text-muted" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} className="w-full bg-transparent text-sm placeholder:text-faint focus:outline-none" style={{ boxShadow: "none" }} />
    </label>
  );
}

/* ---------- Toggle switch ---------- */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full border transition-colors", checked ? "border-teal bg-teal/30" : "border-hair-strong bg-white/5")}>
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "start-6" : "start-0.5")} />
    </button>
  );
}


/* ---------- Extra glass primitives ---------- */
export function GlassInput(p: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  const { icon, className, ...rest } = p;
  return (
    <div className={cn("glass-2 flex h-12 items-center gap-2 rounded-2xl border border-hair px-3.5 focus-within:border-teal/70", className)}>
      {icon && <span className="text-muted">{icon}</span>}
      <input {...rest} className="h-full w-full bg-transparent text-sm text-fg placeholder:text-faint focus:outline-none" style={{ boxShadow: "none" }} />
    </div>
  );
}

/** Frosted dropdown that replaces the native select popup. */
export function GlassDropdown<T extends string>({ value, onChange, options, label, icon, className }: { value: T; onChange: (v: T) => void; options: readonly (readonly [T, string])[]; label: string; icon?: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o[0] === value);
  return (
    <div className={cn("relative", className)}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)}
        className="btn-secondary flex h-11 w-full items-center gap-2 rounded-2xl px-3.5 text-sm">
        {icon}<span className="min-w-0 flex-1 truncate text-start">{cur?.[1] ?? label}</span><span className="text-faint">▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
            <motion.ul role="listbox" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }} transition={spring}
              className="glass glass-strong absolute inset-x-0 top-[calc(100%+6px)] z-[56] max-h-64 overflow-y-auto p-1.5" style={{ borderRadius: 16 }}>
              {options.map(([k, l]) => (
                <li key={k}><button type="button" role="option" aria-selected={k === value} onClick={() => { onChange(k); setOpen(false); }}
                  className={cn("flex w-full items-center rounded-xl px-3 py-2.5 text-start text-sm hover:bg-white/10", k === value && "bg-teal/15 text-teal")}>{l}</button></li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GlassToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("glass-2 flex flex-wrap items-center gap-2 rounded-2xl border border-hair p-2", className)}>{children}</div>;
}
export const GlassBadge = StatusBadge;
export const GlassModal = Modal;
export function GlassBottomSheet(p: Omit<React.ComponentProps<typeof Modal>, "sheet">) { return <Modal {...p} sheet />; }

export function Skeleton({ className }: { className?: string }) { return <div className={cn("skeleton", className)} aria-hidden="true" />; }
