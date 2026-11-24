"use client";
import { useId } from "react";

const DROP = "M32 3.5C40.500 14.500 53 25 53 39.500a21 21 0 0 1-42 0C11 25 23.500 14.500 32 3.500Z";

/** SAFAA mark: a faceted fuel droplet (blue to teal to amber) carrying a flight-path swoosh. */
export function SafaaMark({ size = 36 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ filter: "drop-shadow(0 6px 14px rgba(45,212,191,0.28))" }}>
      <defs>
        <linearGradient id={`b${id}`} x1="14" y1="6" x2="50" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5B9BFF" />
          <stop offset="0.45" stopColor="#2DD4BF" />
          <stop offset="1" stopColor="#F5A524" />
        </linearGradient>
        <linearGradient id={`f${id}`} x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0B1B3D" stopOpacity="0.38" />
          <stop offset="1" stopColor="#0B1B3D" stopOpacity="0" />
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

export function SafaaLogo({ compact = false, size = 36, stacked = false }: { compact?: boolean; size?: number; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="flex flex-col items-center gap-2.5 text-center">
        <SafaaMark size={size * 1.4} />
        <div className="text-[34px] font-semibold leading-none tracking-[0.04em]">SAFAA</div>
        <div className="-mt-0.5 text-[10px] font-medium uppercase tracking-[0.32em] text-muted">by APSCO</div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <SafaaMark size={size} />
      {!compact && (
        <div className="leading-none">
          <div className="text-[19px] font-semibold tracking-[0.05em]">SAFAA</div>
          <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.3em] text-muted">by APSCO</div>
        </div>
      )}
    </div>
  );
}

/** Placeholder wordmark. Swap for the official APSCO logo (see README). */
export function ApscoWordmark({ className = "" }: { className?: string }) {
  return <span className={`font-sans text-xl font-bold tracking-[0.14em] text-white ${className}`}>APSCO</span>;
}
