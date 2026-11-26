"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/hooks";
import { Portal } from "./Glass";

/**
 * Card → full-screen shared-element expansion.
 * State lives in the URL (?open=<id>) so it is deep-linkable and the browser back button works.
 */
let pushed = false;
let userNav = false; // true once a card was opened by click (shared-element origin exists)

const Ctx = createContext<{ anyOpen: boolean }>({ anyOpen: false });

export function useExpandNav() {
  const pathname = usePathname();
  const open = useCallback((id: string) => {
    if (new URLSearchParams(window.location.search).get("open") === id) return; // ignore rapid repeat clicks
    pushed = true;
    userNav = true;
    window.history.pushState(null, "", `${pathname}?open=${encodeURIComponent(id)}`);
  }, [pathname]);
  const close = useCallback(() => {
    if (pushed) { pushed = false; window.history.back(); }
    else window.history.replaceState(null, "", pathname);
  }, [pathname]);
  return { open, close };
}

/** ?open=<id> state for modal-style details (tables). Same URL contract as ExpandCard. */
export function useOpenId() {
  const sp = useSearchParams();
  const { open, close } = useExpandNav();
  return { id: sp.get("open"), open, close };
}

/** Shared element: render the same <SharedHero id> inside the card and inside its detail, and it morphs between them. */
export function SharedHero({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <motion.div layoutId={`hero-${id}`} transition={spring} className={cn("overflow-hidden", className)} style={{ borderRadius: "inherit" }}>
      <motion.div layout="position" className="h-full w-full">{children}</motion.div>
    </motion.div>
  );
}

export function ExpandGroup({ children, className }: { children: ReactNode; className?: string }) {
  const sp = useSearchParams();
  const anyOpen = !!sp.get("open");
  return (
    <Ctx.Provider value={{ anyOpen }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

interface Props {
  id: string;
  title: string;
  card: ReactNode;
  detail: () => ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

export function ExpandCard({ id, title, card, detail, className, headerRight }: Props) {
  const sp = useSearchParams();
  const { anyOpen } = useContext(Ctx);
  const isOpen = sp.get("open") === id;
  const { open, close } = useExpandNav();
  const pathname = usePathname();
  const t = useT();
  const cardRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const wide = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

  useEffect(() => {
    if (!isOpen) return;
    const prev = cardRef.current;
    const raf = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    const k = (e: KeyboardEvent) => e.key === "Escape" && !new URLSearchParams(window.location.search).get("pt") && close();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
      prev?.focus({ preventScroll: true }); // restore focus to originating card
    };
  }, [isOpen, close]);

  // If this card's source disappears while it is open (e.g. a hold was released), clear the stale ?open= param.
  useEffect(() => {
    if (!isOpen) return;
    return () => {
      if (window.location.pathname === pathname && new URLSearchParams(window.location.search).get("open") === id) { pushed = false; window.history.replaceState(null, "", pathname); }
    };
  }, [isOpen, id, pathname]);

  return (
    <>
      <motion.div
        className={cn("h-full", className)}
        animate={{ scale: anyOpen && !isOpen ? 0.975 : 1, opacity: anyOpen && !isOpen ? 0.7 : 1 }}
        transition={spring}
      >
        <motion.div
          ref={cardRef}
          layoutId={`card-${id}`}
          role="button"
          tabIndex={0}
          aria-label={`${title}. Open details`}
          aria-haspopup="dialog"
          onClick={() => open(id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(id); } }}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
            e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
          }}
          whileHover={{ y: -4 }}
          transition={spring}
          className="glass sheen hover-glow h-full cursor-pointer text-start"
          style={{ borderRadius: 20 }}
        >
          <motion.div className="h-full" animate={{ opacity: isOpen ? 0 : 1 }} transition={isOpen ? { duration: 0.1 } : { duration: 0.22, delay: 0.2 }}>{card}</motion.div>
        </motion.div>
      </motion.div>

      <Portal>
        <AnimatePresence onExitComplete={() => cardRef.current?.focus({ preventScroll: true })}>
          {isOpen && (
            <div className="fixed inset-0 z-[70]">
              <motion.div
                className="absolute inset-0 bg-black/55 backdrop-blur-xl"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={close}
              />
              <motion.div
                ref={panelRef}
                layoutId={userNav ? `card-${id}` : undefined}
                {...(userNav ? {} : { initial: { opacity: 0, scale: 0.97, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.98 } })}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                transition={spring}
                className="glass glass-strong absolute inset-0 flex flex-col overflow-hidden outline-none md:inset-6 lg:inset-x-[6%] lg:inset-y-6"
                style={{ borderRadius: wide ? 24 : 0 }}
              >
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.25 } }} exit={{ opacity: 0, transition: { duration: 0.22, delay: 0.05 } }}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:pt-5">
                    <button onClick={close} className="glass inline-flex h-11 items-center gap-2 rounded-full ps-3 pe-4 text-sm font-semibold hover:bg-hi" style={{ borderRadius: 9999 }}>
                      <ArrowLeft size={18} className="rtl:rotate-180" />
                      {t("Back")}
                    </button>
                    <h2 id={titleId} className="min-w-0 flex-1 truncate font-display text-lg font-semibold md:text-xl">{title}</h2>
                    {headerRight}
                  </div>
                  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.32, ease: [0.22, 1, 0.36, 1] } }} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(2rem,env(safe-area-inset-bottom))] md:px-6">{detail()}</motion.div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
