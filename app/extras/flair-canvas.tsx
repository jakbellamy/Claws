"use client";
import { useRef, useState } from "react";

const COLORS = ["red", "yellow", "blue", "black", "white", "grey", "brown", "green", "pink"];

export default function FlairCanvas({ initial, save, label = "save" }: { initial?: string; save: (image: string) => Promise<void>; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const last = useRef<[number, number] | null>(null);
  const [color, setColor] = useState("black");
  const [erase, setErase] = useState(false);

  const at = (e: React.PointerEvent): [number, number] => {
    const r = ref.current!.getBoundingClientRect();
    return [((e.clientX - r.left) * 200) / r.width, ((e.clientY - r.top) * 200) / r.height];
  };

  const draw = (e: React.PointerEvent) => {
    if (!last.current) return;
    const ctx = ref.current!.getContext("2d")!;
    const p = at(e);
    ctx.strokeStyle = erase ? "white" : color;
    ctx.lineWidth = erase ? 16 : 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(...last.current);
    ctx.lineTo(...p);
    ctx.stroke();
    last.current = p;
  };

  const clear = () => {
    const ctx = ref.current!.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 200, 200);
  };

  return (
    <>
      <canvas
        ref={(c) => {
          ref.current = c;
          if (c && !c.dataset.init) {
            c.dataset.init = "1";
            clear();
            if (initial) {
              const img = new Image();
              img.onload = () => c.getContext("2d")!.drawImage(img, 0, 0, 200, 200);
              img.src = initial;
            }
          }
        }}
        width={200}
        height={200}
        style={{ border: "1px solid black", touchAction: "none", width: 200, height: 200 }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          last.current = at(e);
          draw(e);
        }}
        onPointerMove={draw}
        onPointerUp={() => (last.current = null)}
      />
      <p>
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => { setColor(c); setErase(false); }}
            aria-label={c}
            style={{ background: c, width: 28, height: 28, border: !erase && c === color ? "3px solid orange" : "1px solid black" }}
          />
        ))}
      </p>
      <button onClick={() => setErase(true)} style={{ fontWeight: erase ? "bold" : "normal" }}>eraser</button>{" "}
      <button onClick={clear}>clear</button>{" "}
      <button onClick={() => save(ref.current!.toDataURL("image/png"))}>{label}</button>
    </>
  );
}
