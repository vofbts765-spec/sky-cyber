import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 700;
    let raf = 0;
    let completed = false;

    const finish = () => {
      if (completed) return;
      completed = true;
      setFading(true);
      window.setTimeout(onComplete, 220);
    };

    const step = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed < duration) {
        raf = requestAnimationFrame(step);
      } else {
        finish();
      }
    };

    raf = requestAnimationFrame(step);
    const safetyTimer = window.setTimeout(finish, duration + 350);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safetyTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030308] px-6 transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-medium tracking-[0.28em] text-cyan-400/80 uppercase mb-3">
          Void Striker Ultimate Edition
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-wider bg-gradient-to-b from-white via-cyan-300 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(0,243,255,0.45)]">
          NEON GALAXY
        </h1>

        <div className="mt-8 w-full h-2 rounded-full bg-slate-900 border border-cyan-500/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500 transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono-tabular">
          <span>{progress < 40 ? 'Loading star charts' : progress < 80 ? 'Calibrating weapons' : 'Ready for launch'}</span>
          <span className="text-cyan-300">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
