"use client";
import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useMedia, useT } from "@/lib/hooks";
import { Sidebar, SIDEBAR_W, SIDEBAR_W_COLLAPSED } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { MobileTabs } from "@/components/shell/MobileTabs";
import { RouteProgress } from "@/components/shell/RouteProgress";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { Loader } from "@/components/illustrations/Vehicles";
import { ROLE_NAV, SHARED_ROUTES } from "@/components/shell/nav";
import { spring } from "@/lib/motion";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const ready = useStore((s) => s.ready);
  const loggedIn = useStore((s) => s.loggedIn);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const router = useRouter();
  const pathname = usePathname();
  const desktop = useMedia("(min-width: 1024px)");
  const t = useT();
  const role = useStore((s) => s.role);
  const allowed = ROLE_NAV[role].some((n) => pathname === n.href || pathname.startsWith(n.href + "/")) || SHARED_ROUTES.some((h) => pathname === h || pathname.startsWith(h + "/"));

  useEffect(() => {
    if (ready && loggedIn && !allowed) router.replace("/dashboard");
  }, [ready, loggedIn, allowed, router]);

  useEffect(() => {
    if (ready && !loggedIn) router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
  }, [ready, loggedIn, router, pathname]);

  if (!ready || !loggedIn) {
    return <div className="flex min-h-dvh items-center justify-center"><Loader label="Loading SAFAA…" /></div>;
  }
  const pad = desktop ? (collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W) + 24 : 0;

  return (
    <div className="min-h-dvh overflow-x-clip">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-teal focus:px-4 focus:py-2 focus:text-[#04121a]">Skip to content</a>
      <RouteProgress />
      <Sidebar />
      <motion.div initial={false} animate={{ paddingInlineStart: pad }} transition={spring} className="flex min-h-dvh flex-col">
        <Topbar />
        <main id="main" className="mx-auto w-full max-w-[1500px] flex-1 px-3 pb-32 pt-6 md:px-6 lg:pb-12">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
        <footer className="px-6 pb-28 text-center text-xs leading-relaxed text-faint lg:pb-8">
          {t("Illustrative demo data. Final checklist and acceptance criteria to be approved by APSCO Quality Control against controlled copies of the applicable standards.")}
          <span className="mx-1">·</span>JIG-aligned (JIG 1 / JIG 2)
        </footer>
      </motion.div>
      <MobileTabs />
      <CommandPalette />
    </div>
  );
}
