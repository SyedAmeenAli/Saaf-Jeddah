"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, KeyRound, PenLine } from "lucide-react";
import { useT } from "@/lib/hooks";
import { Button, Modal, inputCls } from "@/components/ui/Glass";
import { T } from "@/components/ui/T";

export function SignaturePad({ onInk, height = 140 }: { onInk: (has: boolean) => void; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [has, setHas] = useState(false);
  const t = useT();

  const setup = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    g.lineWidth = 2.6;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() || "#fff";
  }, []);
  useEffect(() => { setup(); }, [setup]);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    ref.current!.setPointerCapture(e.pointerId);
    const g = ref.current!.getContext("2d")!;
    const p = pos(e);
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(p.x + 0.1, p.y + 0.1);
    g.stroke();
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const g = ref.current!.getContext("2d")!;
    const p = pos(e);
    g.lineTo(p.x, p.y);
    g.stroke();
    if (!has) { setHas(true); onInk(true); }
  };
  const up = () => { drawing.current = false; };
  const clear = () => {
    const c = ref.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setHas(false);
    onInk(false);
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-hair-strong bg-hi">
        <canvas ref={ref} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
          className="sig-pad block w-full cursor-crosshair" style={{ height }} aria-label="Signature pad: draw your signature" />
        {!has && <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm text-faint"><PenLine size={16} /> <T>{"Sign here (finger or mouse)"}</T></span>}
        <button type="button" onClick={clear} className="absolute end-2 top-2 flex h-9 items-center gap-1.5 rounded-full bg-hi px-3 text-xs font-medium text-muted hover:text-fg">
          <Eraser size={13} /> {t("Clear")}
        </button>
      </div>
    </div>
  );
}

/** Signature + PIN confirm (gloves make drawing hard). `onReady` reports when both are satisfied. */
export function SignBlock({ onReady }: { onReady: (ok: boolean) => void }) {
  const [ink, setInk] = useState(false);
  const [pin, setPin] = useState("");
  const t = useT();
  useEffect(() => { onReady(ink && pin.length === 4); }, [ink, pin, onReady]);
  return (
    <div className="space-y-3">
      <SignaturePad onInk={setInk} />
      <label className="block">
        <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-muted"><KeyRound size={14} /> {t("PIN confirm")} <span className="text-xs text-faint"><T>{"(demo: any 4 digits)"}</T></span></span>
        <input
          inputMode="numeric" autoComplete="off" maxLength={4} value={pin} type="password" aria-label="PIN"
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="••••" className={`${inputCls} text-center font-mono text-2xl tracking-[0.6em]`}
        />
      </label>
    </div>
  );
}

export function SignModal({ open, onClose, title, confirmLabel, onConfirm, children, variant = "primary" }: {
  open: boolean; onClose: () => void; title: string; confirmLabel: string; onConfirm: () => void; children?: React.ReactNode; variant?: "primary" | "danger";
}) {
  const [ok, setOk] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title={title} sheet>
      {open && (
        <div className="space-y-4">
          {children}
          <SignBlock onReady={setOk} />
          <Button variant={variant} size="lg" className="w-full" disabled={!ok} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </div>
      )}
    </Modal>
  );
}
