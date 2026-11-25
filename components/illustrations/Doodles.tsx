"use client";

/** Minimal NFC glyph used on the scan screen. */
export function NfcTag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="24" cy="24" r="3" fill="currentColor" stroke="none" />
      <path d="M16 16a11 11 0 0 0 0 16M32 16a11 11 0 0 1 0 16M10 10a19 19 0 0 0 0 28M38 10a19 19 0 0 1 0 28" />
    </svg>
  );
}

/** Phone frame for the mobile showcase. */
export function PhoneFrame({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[260px] shrink-0 rounded-[2.4rem] border border-white/20 bg-[#0d0818]/80 p-2 shadow-[0_30px_80px_rgba(0,0,0,0.5)] ${className}`}>
      <div className="absolute left-1/2 top-3 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#1a1030] to-[#0d0818]">{children}</div>
    </div>
  );
}
