"use client";
import { useId } from "react";

const DROP = "M32 3.5C40.500 14.500 53 25 53 39.500a21 21 0 0 1-42 0C11 25 23.500 14.500 32 3.500Z";

/** SAFAA mark: a faceted fuel droplet (blue to teal to amber) carrying a flight-path swoosh. */
export function SafaaMark({ size = 36 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ filter: "drop-shadow(0 6px 14px rgba(181,138,255,0.28))" }}>
      <defs>
        <linearGradient id={`b${id}`} x1="14" y1="6" x2="50" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#d7bcff" />
          <stop offset="0.45" stopColor="#b58aff" />
          <stop offset="1" stopColor="#ff405c" />
        </linearGradient>
        <linearGradient id={`f${id}`} x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1d0f3a" stopOpacity="0.38" />
          <stop offset="1" stopColor="#1d0f3a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`h${id}`} x1="20" y1="10" x2="30" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`c${id}`}><path d={DROP} /></clipPath>
      </defs>
      <path d={DROP} fill={`url(#b${id})`} />
      <g clipPath={`url(#c${id})`}>
        {/* left facet shade */}
        <path d="M32 3.500C23.500 14.500 11 25 11 39.500a21 21 0 0 0 21 21Z" fill={`url(#f${id})`} />
        {/* soft top-left specular */}
        <path d="M27 12C22 19 16.500 26.500 15.500 35" stroke={`url(#h${id})`} strokeWidth="3.200" strokeLinecap="round" fill="none" />
        {/* flight-path swoosh */}
        <path d="M17 46.500C30 46 42 38 50 22C44 34.500 32 42.500 17 46.500Z" fill="#fff" fillOpacity="0.95" />
        <circle cx="49" cy="23" r="2.200" fill="#fff" />
      </g>
      <path d={DROP} fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1" />
    </svg>
  );
}

/** Official APSCO logo (public/apsco-logo-en.svg). Geometry untouched; the dark-theme file only swaps the purple ink for near-white. */
export function ApscoWordmark({ className = "h-9", ink = false }: { className?: string; ink?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center ${className}`} role="img" aria-label="APSCO">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/apsco-logo-en.svg" alt="" className={`h-full w-auto ${ink ? "" : "theme-light-only"}`} />
      {!ink && /* eslint-disable-next-line @next/next/no-img-element */ <img src="/apsco-logo-en-reversed.svg" alt="" className="theme-dark-only h-full w-auto" />}
    </span>
  );
}

/** SAFAA wordmark: Sora, wide tracking, coral flight-tick on the final A. */
function SafaaWord({ size = 19 }: { size?: number }) {
  return (
    <span className="relative inline-block font-display font-semibold leading-none" style={{ fontSize: size, letterSpacing: "0.22em" }} dir="ltr">
      SAFA<span className="relative">A<svg viewBox="0 0 10 8" width={size * 0.42} height={size * 0.34} className="absolute left-[0.28em] top-[-0.42em]" aria-hidden="true"><path d="M0 8 L7 0 L10 2 L4 8Z" fill="#ff405c" /></svg></span>
    </span>
  );
}

/** Header lockup: official APSCO logo | SAFAA, with the descriptor underneath. */
export function SafaaLogo({ compact = false, size = 36, stacked = false }: { compact?: boolean; size?: number; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <ApscoWordmark className="h-16" />
        <SafaaWord size={30} />
        <div className="-mt-1 text-[10px] font-medium uppercase tracking-[0.3em] text-muted">Fuel Quality Assurance</div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <ApscoWordmark className={size <= 30 ? "h-8" : "h-10"} />
      {!compact && (
        <>
          <span className="h-8 w-px bg-hair-strong" aria-hidden="true" />
          <div className="leading-none">
            <SafaaWord size={size <= 30 ? 15 : 18} />
            <div className="mt-1.5 text-[8.5px] font-medium uppercase tracking-[0.22em] text-muted">Fuel Quality Assurance</div>
          </div>
        </>
      )}
    </div>
  );
}
