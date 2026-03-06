import { useRef, useEffect } from "react";

export default function PixelDiff({ original, modified, zoom = 6 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!original || !modified || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const size = 32;
    canvas.width = size * zoom;
    canvas.height = size * zoom;
    const ctx = canvas.getContext("2d");

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * original.width + x) * 4;
        const ro = original.data[idx], go = original.data[idx + 1], bo = original.data[idx + 2];
        const rm = modified[idx],      gm = modified[idx + 1],      bm = modified[idx + 2];
        const changed = ro !== rm || go !== gm || bo !== bm;
        ctx.fillStyle = changed ? "rgba(0,255,136,0.9)" : `rgb(${ro},${go},${bo})`;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        if (changed) {
          ctx.strokeStyle = "rgba(0,255,136,0.4)";
          ctx.strokeRect(x * zoom, y * zoom, zoom, zoom);
        }
      }
    }
  }, [original, modified, zoom]);

  return (
    <canvas
      ref={canvasRef}
      style={{ imageRendering: "pixelated", width: "100%", maxHeight: 220, objectFit: "contain" }}
    />
  );
}