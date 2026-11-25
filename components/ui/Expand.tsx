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
  const t = useT();
  const cardRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const prev = cardRef.current;
    const raf = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
      prev?.focus({ preventScroll: true }); // restore focus to originating card
    };
  }, [isOpen, close]);

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
          transition={spring}
          className="glass hover-glow h-full cursor-pointer text-start"
          style={{ borderRadius: 8 }}
        >
          {card}
        </motion.div>
      </motion.div>

      <Portal>
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[70]">
              <motion.div
                className="absolute inset-0 bg-black/70"
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
                className="glass glass-strong absolute inset-x-0 bottom-0 top-6 flex flex-col overflow-hidden outline-none md:inset-6 lg:inset-x-[6%] lg:inset-y-6"
                style={{ borderRadius: 8 }}
              >
                <motion.div
                  className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-2 md:hidden"
                  onPanEnd={(_, info) => { if (info.offset.y > 90) close(); }}
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-10 rounded-full bg-fg/25" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.25 } }} exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-3 md:px-6 md:pt-5">
                    <button onClick={close} className="glass inline-flex h-9 items-center gap-2 rounded-md ps-2.5 pe-3.5 text-[13px] font-medium hover:bg-hi" style={{ borderRadius: 6 }}>
                      <ArrowLeft size={16} className="rtl:rotate-180" />
                      {t("Back")}
                    </button>
                    <h2 id={titleId} className="min-w-0 flex-1 truncate font-display text-base font-semibold md:text-lg">{title}</h2>
                    {headerRight}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 md:px-6">{detail()}</div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
