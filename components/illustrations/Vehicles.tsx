"use client";
import { useId } from "react";
import type { PointId, VehicleType } from "@/lib/types";

/** Flat technical side elevation of a refueller (steel tank, navy cab). */
export function TruckSvg({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 400 210" className={className} role="img" aria-label="Refueller side elevation">
      <defs>
        <linearGradient id={`t${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6edf7" />
          <stop offset=".55" stopColor="#aebbd0" />
          <stop offset="1" stopColor="#6f7f99" />
        </linearGradient>
        <linearGradient id={`c${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f5fb" />
          <stop offset="1" stopColor="#b7c3d6" />
        </linearGradient>
      </defs>
      <ellipse cx="205" cy="192" rx="175" ry="7" fill="#000" opacity=".35" />
      <rect x="30" y="150" width="345" height="10" rx="3" fill="#1c2742" />
      <rect x="126" y="58" width="248" height="90" rx="44" fill={`url(#t${id})`} stroke="#2b3a5c" strokeWidth="1.5" />
      <rect x="148" y="68" width="204" height="6" rx="3" fill="#fff" opacity=".5" />
      <rect x="126" y="108" width="248" height="10" fill="#14b8a6" opacity=".85" />
      <rect x="240" y="48" width="26" height="12" rx="3" fill="#7c8aa5" />
      <path d="M36 150 V98 q0-12 12-16 l40-12 q10-3 17 5 l18 25 v50z" fill={`url(#c${id})`} stroke="#2b3a5c" strokeWidth="1.5" />
      <path d="M62 96 l26-8 q6-1 9 3 l11 14 H62z" fill="#0f1d3a" opacity=".85" />
      <rect x="34" y="134" width="9" height="7" rx="2" fill="#f5a524" />
      <rect x="284" y="124" width="30" height="46" rx="6" fill="#d4dbe8" stroke="#2b3a5c" strokeWidth="1.5" />
      <rect x="290" y="132" width="5" height="30" rx="2.5" fill="#fff" opacity=".55" />
      <path d="M299 124 v-8 h28" stroke="#5b6b88" strokeWidth="4" fill="none" strokeLinecap="round" />
      {[78, 205, 330].map((x) => (
        <g key={x} transform={`translate(${x} 168)`}>
          <circle r="21" fill="#0c1426" stroke="#2b3a5c" strokeWidth="1.5" />
          <circle r="10" fill="#8795ae" />
          <circle r="3.5" fill="#0c1426" />
        </g>
      ))}
    </svg>
  );
}

export function DispenserSvg({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 400 210" className={className} role="img" aria-label="Hydrant dispenser side elevation">
      <defs>
        <linearGradient id={`d${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6edf7" />
          <stop offset="1" stopColor="#7f8ea8" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="192" rx="150" ry="7" fill="#000" opacity=".35" />
      <rect x="70" y="150" width="270" height="10" rx="3" fill="#1c2742" />
      <rect x="82" y="78" width="86" height="74" rx="8" fill="#c9d3e3" stroke="#2b3a5c" strokeWidth="1.5" />
      <rect x="94" y="90" width="62" height="26" rx="4" fill="#0f1d3a" opacity=".85" />
      <circle cx="108" cy="134" r="4" fill="#2dd4bf" />
      <circle cx="126" cy="134" r="4" fill="#f5a524" />
      <rect x="180" y="96" width="150" height="56" rx="28" fill={`url(#d${id})`} stroke="#2b3a5c" strokeWidth="1.5" />
      <rect x="200" y="104" width="110" height="6" rx="3" fill="#fff" opacity=".5" />
      <rect x="180" y="124" width="150" height="9" fill="#14b8a6" opacity=".85" />
      <circle cx="290" cy="70" r="20" fill="none" stroke="#5b6b88" strokeWidth="5" />
      <circle cx="290" cy="70" r="7" fill="#f5a524" />
      <path d="M330 126 h24 v-28" stroke="#5b6b88" strokeWidth="5" fill="none" strokeLinecap="round" />
      {[110, 300].map((x) => (
        <g key={x} transform={`translate(${x} 168)`}>
          <circle r="19" fill="#0c1426" stroke="#2b3a5c" strokeWidth="1.5" />
          <circle r="9" fill="#8795ae" />
        </g>
      ))}
    </svg>
  );
}

/** Hotspot positions (% of the 400x210 viewBox) */
export const HOTSPOTS: Record<VehicleType, Partial<Record<PointId, { x: number; y: number }>>> = {
  refueller: {
    tank_sump: { x: 52, y: 70 },
    tank_drain: { x: 87, y: 69 },
    filter_sump: { x: 74.5, y: 81 },
    filter_outlet: { x: 79, y: 58 },
  },
  dispenser: {
    filter_sump: { x: 62, y: 69 },
    filter_outlet: { x: 88, y: 56 },
  },
};

export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={label ?? "Loading"}>
      <span className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-teal" />
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );
}
