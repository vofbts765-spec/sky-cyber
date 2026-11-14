import { Coins, Pause, Volume2, VolumeX } from 'lucide-react';
import { WEAPONS } from '../game/constants';
import { BannerAlert, HudSnapshot, WeaponType } from '../game/types';

interface GameHUDProps {
  hud: HudSnapshot;
  banner: BannerAlert | null;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onSwitchWeapon: (weapon: WeaponType) => void;
}

const WEAPON_KEYS: WeaponType[] = ['laser', 'plasma', 'spread', 'missile'];

function formatTimer(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function GameHUD({
  hud,
  banner,
  muted,
  onToggleMute,
  onPause,
  onSwitchWeapon,
}: GameHUDProps) {
  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const shieldPct = Math.max(0, Math.min(100, (hud.shield / Math.max(1, hud.maxShield)) * 100));
  const activeWeapon = WEAPONS[hud.weapon];

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-4">
      {/* Top Row: Primary Telemetry + Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          {/* Score & Best */}
          <div className="rounded-lg border border-cyan-500/30 bg-[#070b18]/75 px-3 py-2 backdrop-blur-md">
            <div className="flex items-baseline gap-3">
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">Score</div>
                <div className="font-display text-lg sm:text-2xl font-black text-white tabular-nums leading-tight">
                  {String(hud.score).padStart(6, '0')}
                </div>
              </div>
              <div className="hidden sm:block border-l border-slate-700/80 pl-3">
                <div className="text-[10px] text-slate-400 uppercase">Best</div>
                <div className="font-mono-tabular text-xs font-bold text-slate-200">
                  {hud.highScore.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Center Wave / Mode Indicator */}
          <div className="rounded-lg border border-fuchsia-500/30 bg-[#070b18]/75 px-3.5 py-2 text-center backdrop-blur-md">
            {hud.timeRemaining !== null ? (
              <>
                <div className="text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">Time Left</div>
                <div
                  className={`font-display text-lg sm:text-2xl font-black tabular-nums leading-tight ${
                    hud.timeRemaining <= 20 ? 'text-rose-400' : 'text-emerald-300'
                  }`}
                >
                  {formatTimer(hud.timeRemaining)}
                </div>
              </>
            ) : hud.mode === 'boss_rush' ? (
              <>
                <div className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase">Boss Rush</div>
                <div className="font-display text-lg sm:text-2xl font-black text-amber-300 tabular-nums leading-tight">
                  {hud.bossRushIndex}/{hud.bossRushTotal}
                </div>
              </>
            ) : (
              <>
                <div className="text-[10px] font-semibold tracking-wider text-fuchsia-400 uppercase">Wave</div>
                <div className="font-display text-lg sm:text-2xl font-black text-fuchsia-300 tabular-nums leading-tight">
                  {String(hud.wave).padStart(2, '0')}
                </div>
              </>
            )}
          </div>

          {/* Right: Kills, Coins, Audio, Pause */}
          <div className="flex items-start gap-2">
            <div className="hidden md:flex items-center gap-4 rounded-lg border border-slate-700/70 bg-[#070b18]/75 px-3 py-2 backdrop-blur-md font-mono-tabular text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Kills</div>
                <div className="font-bold text-white">{hud.kills}</div>
              </div>
              <div>
                <div className="text-[10px] text-amber-300/80 uppercase">Credits</div>
                <div className="flex items-center gap-1 font-bold text-amber-300">
                  <Coins className="h-3 w-3" />
                  <span>{hud.runCoins}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700/80 bg-[#070b18]/80 text-slate-200 hover:border-cyan-400 hover:text-cyan-300 cursor-pointer"
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            >
              {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onPause}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-[#070b18]/80 text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 transition-colors cursor-pointer"
              aria-label="Pause game"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Second Row: Hull/Shield Bars + Combo + Power-Up Timers */}
        <div className="flex items-start justify-between gap-2">
          {/* Hull & Shield */}
          <div className="w-44 sm:w-56 rounded-lg border border-slate-800 bg-[#070b18]/70 px-3 py-2 backdrop-blur-sm space-y-1.5">
            <div>
              <div className="flex justify-between text-[10px] font-mono-tabular">
                <span className="text-rose-300 font-semibold">HULL</span>
                <span className="text-slate-200">
                  {hud.hp}/{hud.maxHp}
                </span>
              </div>
              <div className="mt-0.5 h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-[width] duration-150"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono-tabular">
                <span className="text-emerald-300 font-semibold">SHIELD</span>
                <span className="text-slate-200">
                  {hud.shield}/{hud.maxShield}
                </span>
              </div>
              <div className="mt-0.5 h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-[width] duration-150"
                  style={{ width: `${shieldPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Cluster: Combo & Active Buffs */}
          <div className="flex flex-col items-end gap-1.5">
            {hud.combo > 1 && (
              <div className="rounded-lg border border-amber-400/45 bg-amber-950/45 px-3 py-1.5 text-right backdrop-blur-sm">
                <div className="font-display text-sm sm:text-base font-black text-amber-300 tabular-nums">
                  {hud.combo.toFixed(1)}x COMBO
                </div>
                <div className="mt-1 h-1 w-24 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${Math.round(hud.comboTimerRatio * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {(hud.tripleTimer > 0 || hud.rapidTimer > 0) && (
              <div className="flex items-center gap-2 font-mono-tabular text-[11px]">
                {hud.tripleTimer > 0 && (
                  <div className="rounded-md border border-cyan-400/50 bg-cyan-950/60 px-2 py-1 text-cyan-200">
                    3X {hud.tripleTimer.toFixed(1)}s
                  </div>
                )}
                {hud.rapidTimer > 0 && (
                  <div className="rounded-md border border-amber-400/50 bg-amber-950/60 px-2 py-1 text-amber-200">
                    RAPID {hud.rapidTimer.toFixed(1)}s
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Boss Health Bar */}
        {hud.boss && (
          <div className="mx-auto mt-1 w-full max-w-xl rounded-xl border border-rose-500/45 bg-[#0a0616]/85 px-4 py-2.5 backdrop-blur-md shadow-[0_0_24px_rgba(244,63,94,0.22)]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div>
                <span className="font-display font-black tracking-wide text-white">{hud.boss.name}</span>
                <span className="hidden sm:inline ml-2 text-slate-400">· {hud.boss.subtitle}</span>
              </div>
              <div className="font-mono-tabular text-rose-300 font-bold">
                Phase {hud.boss.phase}/{hud.boss.maxPhases} · {hud.boss.hp.toLocaleString()} HP
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
              <div
                className="h-full transition-[width] duration-100"
                style={{
                  width: `${Math.max(0, (hud.boss.hp / Math.max(1, hud.boss.maxHp)) * 100)}%`,
                  background: `linear-gradient(90deg, ${hud.boss.color}, #f43f5e)`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Center Mission / Boss / Achievement Banner */}
      {banner && (
        <div className="pointer-events-none fixed inset-x-0 top-36 sm:top-40 z-20 flex justify-center px-4">
          <div
            key={banner.id}
            className="rounded-xl border bg-[#060916]/90 px-6 py-3 text-center backdrop-blur-md shadow-2xl"
            style={{
              borderColor: banner.color,
              boxShadow: `0 0 28px ${banner.color}33`,
            }}
          >
            <div className="font-display text-sm sm:text-lg font-black tracking-wider text-white">
              {banner.title}
            </div>
            <div className="mt-0.5 text-xs font-medium" style={{ color: banner.color }}>
              {banner.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Weapon Bar (Interactive on Desktop & Touch) */}
      <div className="flex items-end justify-center pb-1">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#070b18]/80 px-2.5 py-1.5 backdrop-blur-md">
          <div className="hidden sm:block pr-2 mr-1 border-r border-slate-800 text-[11px] font-mono-tabular">
            <div className="text-slate-400">WEAPON</div>
            <div className="font-bold" style={{ color: activeWeapon.color }}>
              {activeWeapon.shortName} · LV.{hud.weaponLevel}
            </div>
          </div>

          {WEAPON_KEYS.map((w) => {
            const cfg = WEAPONS[w];
            const active = hud.weapon === w;
            return (
              <button
                key={w}
                type="button"
                onClick={() => onSwitchWeapon(w)}
                className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-display font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-slate-800 text-white border'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                style={active ? { borderColor: cfg.color, color: cfg.color } : undefined}
              >
                <span className="opacity-65 font-mono-tabular">{cfg.keyHint}</span>
                <span>{cfg.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
