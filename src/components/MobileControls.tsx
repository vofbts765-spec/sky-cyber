import { Crosshair } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { ControlScheme } from '../game/types';

interface MobileControlsProps {
  visible: boolean;
  controlScheme: ControlScheme;
  autoFire: boolean;
  onJoystickChange: (active: boolean, dx: number, dy: number) => void;
  onFireChange: (active: boolean) => void;
}

export function MobileControls({
  visible,
  controlScheme,
  autoFire,
  onJoystickChange,
  onFireChange,
}: MobileControlsProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [joyActive, setJoyActive] = useState(false);
  const [firing, setFiring] = useState(false);
  const activePointerId = useRef<number | null>(null);

  const maxRadius = 42;

  const updateStick = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      setKnobOffset({ x: dx, y: dy });
      onJoystickChange(true, dx / maxRadius, dy / maxRadius);
    },
    [onJoystickChange]
  );

  if (!visible || controlScheme === 'touch_drag') {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between px-5 pb-6 sm:px-8 sm:pb-8">
      {/* Virtual Joystick */}
      <div
        ref={padRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          activePointerId.current = e.pointerId;
          setJoyActive(true);
          updateStick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (activePointerId.current !== e.pointerId) return;
          e.stopPropagation();
          updateStick(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (activePointerId.current !== e.pointerId) return;
          activePointerId.current = null;
          setJoyActive(false);
          setKnobOffset({ x: 0, y: 0 });
          onJoystickChange(false, 0, 0);
        }}
        onPointerCancel={() => {
          activePointerId.current = null;
          setJoyActive(false);
          setKnobOffset({ x: 0, y: 0 });
          onJoystickChange(false, 0, 0);
        }}
        className={`pointer-events-auto relative flex h-28 w-28 touch-none items-center justify-center rounded-full border transition-colors ${
          joyActive
            ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_24px_rgba(0,243,255,0.28)]'
            : 'border-cyan-500/35 bg-slate-950/45'
        } backdrop-blur-sm`}
        aria-label="Virtual movement joystick"
      >
        <div className="h-14 w-14 rounded-full border border-cyan-500/20" />
        <div
          className="absolute h-11 w-11 rounded-full border border-cyan-300 bg-cyan-400/30 shadow-[0_0_16px_rgba(0,243,255,0.5)]"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        />
      </div>

      {/* Dedicated Fire Button */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          setFiring(true);
          onFireChange(true);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          setFiring(false);
          onFireChange(false);
        }}
        onPointerCancel={() => {
          setFiring(false);
          onFireChange(false);
        }}
        className={`pointer-events-auto flex h-20 w-20 touch-none flex-col items-center justify-center rounded-full border-2 font-display text-[11px] font-bold tracking-wider transition-transform ${
          firing
            ? 'scale-95 border-pink-400 bg-pink-500/35 text-white shadow-[0_0_25px_rgba(236,72,153,0.65)]'
            : 'border-fuchsia-400/60 bg-slate-950/55 text-fuchsia-200'
        } backdrop-blur-sm`}
        aria-label="Fire weapons"
      >
        <Crosshair className="h-6 w-6 mb-0.5" />
        <span>{autoFire ? 'BOOST' : 'FIRE'}</span>
      </button>
    </div>
  );
}
