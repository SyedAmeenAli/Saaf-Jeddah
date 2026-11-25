"use client";

const DROP = "M32 3.5C40.500 14.500 53 25 53 39.500a21 21 0 0 1-42 0C11 25 23.500 14.500 32 3.500Z";

/** SAFAA mark: flat droplet outline with a sample-level line. Single colour, scales to 16px. */
export function SafaaMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" fill="none">
      <path d={DROP} stroke="var(--teal)" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M13 41h38" stroke="var(--teal)" strokeWidth="3.5" strokeLinecap="butt" />
      <path d="M21 50.500h22" stroke="var(--teal)" strokeWidth="3.5" strokeOpacity="0.45" />
    </svg>
  );
}

export function SafaaLogo({ compact = false, size = 36, stacked = false }: { compact?: boolean; size?: number; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="flex flex-col items-center gap-2.5 text-center">
        <SafaaMark size={size * 1.4} />
        <div className="text-[30px] font-semibold leading-none tracking-[0.08em]">SAFAA</div>
        <div className="-mt-0.5 font-mono text-[10px] uppercase tracking-[0.28em] text-faint">by APSCO</div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <SafaaMark size={size} />
      {!compact && (
        <div className="leading-none">
          <div className="text-[17px] font-semibold tracking-[0.1em]">SAFAA</div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.26em] text-faint">by APSCO</div>
        </div>
      )}
    </div>
  );
}

/** Placeholder wordmark. Swap for the official APSCO logo (see README). */
export function ApscoWordmark({ className = "" }: { className?: string }) {
  return <span className={`font-sans text-xl font-bold tracking-[0.14em] text-white ${className}`}>APSCO</span>;
}
