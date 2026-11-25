import Image from "next/image";
import { cn } from "@/lib/utils";

const BLUR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiMwYTE2MzAiLz48L3N2Zz4=";

export type Crop = "full" | "tanker" | "engine" | "plane" | "tower" | "skyline" | "apron" | "sky" | "refuel" | "truck";
/** Crops of the supplied apron photograph plus a licensed Unsplash refuelling photo (see public/credits.md). */
const SRC: Record<Crop, { src: string; pos: string }> = {
  full: { src: "hero-apron", pos: "50% 62%" },
  tanker: { src: "tanker", pos: "50% 55%" },
  tower: { src: "terminal", pos: "50% 45%" },
  skyline: { src: "skyline", pos: "30% 60%" },
  engine: { src: "engine", pos: "50% 50%" },
  plane: { src: "nose", pos: "50% 30%" },
  apron: { src: "apron", pos: "50% 60%" },
  sky: { src: "sky", pos: "50% 50%" },
  refuel: { src: "refuel-scene", pos: "50% 55%" },
  truck: { src: "refuel-truck", pos: "50% 55%" },
};

/** Photographic panel under a dark brand scrim. Gradient fallback behind, edge vignette and bloom on top. */
export function Photo({ crop = "full", className, scrim = "from-[#050b18]/25 via-[#050b18]/55 to-[#050b18]/92", children, bloom = true }: { crop?: Crop; className?: string; scrim?: string; children?: React.ReactNode; bloom?: boolean }) {
  const c = SRC[crop];
  return (
    <div className={cn("relative isolate overflow-hidden bg-gradient-to-br from-[#0a1630] to-[#050b18]", className)}>
      <Image src={`/images/${c.src}.webp`} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" placeholder="blur" blurDataURL={BLUR} quality={80}
        className="object-cover" style={{ objectPosition: c.pos }} />
      <div className={cn("absolute inset-0 bg-gradient-to-b", scrim)} />
      {bloom && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_85%_0%,rgba(45,212,191,0.16),transparent_55%),radial-gradient(90%_70%_at_0%_100%,rgba(59,130,246,0.18),transparent_60%)]" />}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(5,11,24,0.6)]" />
      {children && <div className="relative h-full">{children}</div>}
    </div>
  );
}
