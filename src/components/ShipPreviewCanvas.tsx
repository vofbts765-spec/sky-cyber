import { useEffect, useRef } from 'react';
import { drawPlayerShip } from '../game/renderer';
import { ShipId } from '../game/types';

interface ShipPreviewCanvasProps {
  shipId: ShipId;
  size?: number;
  showShield?: boolean;
}

export function ShipPreviewCanvas({ shipId, size = 128, showShield = true }: ShipPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let rafId = 0;
    const start = performance.now();

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, size, size);

      // Subtle radial backdrop glow
      const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size * 0.46);
      grad.addColorStop(0, 'rgba(0, 243, 255, 0.14)');
      grad.addColorStop(1, 'rgba(3, 4, 12, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      drawPlayerShip(
        ctx,
        shipId,
        size / 2,
        size / 2 + Math.sin(t * 2.4) * 3,
        19,
        Math.sin(t * 1.4) * 0.25,
        t,
        {
          shieldRatio: showShield ? 0.65 : 0,
          scale: size / 96,
        }
      );

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [shipId, size, showShield]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="block shrink-0"
      aria-hidden="true"
    />
  );
}
