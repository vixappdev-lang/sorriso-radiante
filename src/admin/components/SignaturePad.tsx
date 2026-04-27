import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, PenLine } from "lucide-react";

export default function SignaturePad({
  onChange,
  height = 180,
}: {
  onChange: (dataUrl: string | null) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "hsl(222 32% 12%)";
    ctx.lineWidth = 2;
  }, []);

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent) {
    const c = canvasRef.current!;
    c.setPointerCapture(e.pointerId);
    const ctx = c.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawing.current = true;
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    const data = canvasRef.current!.toDataURL("image/png");
    setHasInk(true);
    onChange(data);
  }
  function clear() {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div
        className="relative rounded-xl border-2 border-dashed border-[hsl(var(--admin-border-strong))] bg-[hsl(var(--admin-input-bg))] overflow-hidden"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        />
        {!hasInk && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-[hsl(var(--admin-text-muted))]">
            <PenLine className="h-6 w-6 mb-1.5 opacity-50" />
            <p className="text-xs">Assine aqui com o dedo ou mouse</p>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!hasInk}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Limpar
        </Button>
      </div>
    </div>
  );
}
