import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Coins,
  Home,
  Lock,
  Play,
  Rocket,
  RotateCcw,
  Settings,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import { ACHIEVEMENTS, GAME_MODES, SHIPS } from '../game/constants';
import { ControlScheme, GameSettings, RunSummary, SaveData } from '../game/types';

/* ==================== PAUSE MODAL ==================== */
interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export function PauseModal({ onResume, onRestart, onOpenSettings, onMainMenu }: PauseModalProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#03040c]/80 px-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl border border-cyan-500/35 bg-[#090d1e]/95 p-6 text-center shadow-[0_0_40px_rgba(0,243,255,0.18)]">
        <p className="text-xs font-medium tracking-[0.22em] text-cyan-400 uppercase">Mission Suspended</p>
        <h2 className="font-display text-3xl font-black text-white mt-1">Paused</h2>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onResume}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 font-display text-sm font-black tracking-wider text-slate-950 hover:brightness-110 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/40 bg-slate-900/80 text-sm font-semibold text-cyan-200 hover:border-cyan-400 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restart Mission</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 text-sm font-semibold text-slate-200 hover:border-slate-500 cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-rose-500/35 bg-rose-950/20 text-sm font-semibold text-rose-300 hover:border-rose-400 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== GAME OVER / VICTORY MODAL ==================== */
interface RunEndModalProps {
  summary: RunSummary;
  onRestart: () => void;
  onOpenGarage: () => void;
  onMainMenu: () => void;
}

export function RunEndModal({ summary, onRestart, onOpenGarage, onMainMenu }: RunEndModalProps) {
  const isVictory = summary.victory;
  const modeCfg = GAME_MODES[summary.mode];
  const shipCfg = SHIPS[summary.shipUsed];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#03040c]/85 px-4 py-6 backdrop-blur-md overflow-y-auto custom-scroll">
      <div
        className={`w-full max-w-lg rounded-2xl border bg-[#090d1e]/95 p-6 sm:p-8 text-center ${
          isVictory
            ? 'border-emerald-400/50 shadow-[0_0_45px_rgba(16,185,129,0.2)]'
            : 'border-rose-500/45 shadow-[0_0_45px_rgba(244,63,94,0.2)]'
        }`}
      >
        <p
          className={`text-xs font-semibold tracking-[0.22em] uppercase ${
            isVictory ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {modeCfg.name} · {shipCfg.name}
        </p>
        <h2
          className={`font-display text-3xl sm:text-4xl font-black mt-1 ${
            isVictory
              ? 'bg-gradient-to-b from-white to-emerald-400 bg-clip-text text-transparent'
              : 'bg-gradient-to-b from-white to-rose-500 bg-clip-text text-transparent'
          }`}
        >
          {isVictory ? 'Victory Achieved' : 'System Failure'}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
          {isVictory ? 'Sector threat neutralized. Outstanding piloting.' : 'Your starfighter was destroyed in combat.'}
        </p>

        {/* Score Highlight */}
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/75 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Final Score</div>
          <div className="font-display text-3xl sm:text-4xl font-black text-white tabular-nums mt-0.5">
            {summary.score.toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs font-mono-tabular">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className={summary.isNewHighScore ? 'text-amber-300 font-bold' : 'text-slate-400'}>
              {summary.isNewHighScore
                ? 'New All-Time High Score!'
                : `High Score: ${summary.highScore.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* Combat Breakdown */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[10px] text-slate-400 uppercase">Wave</div>
            <div className="font-mono-tabular text-base font-bold text-white mt-0.5">{summary.wave}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[10px] text-slate-400 uppercase">Kills</div>
            <div className="font-mono-tabular text-base font-bold text-white mt-0.5">{summary.kills}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[10px] text-slate-400 uppercase">Bosses</div>
            <div className="font-mono-tabular text-base font-bold text-fuchsia-300 mt-0.5">
              {summary.bossesDefeated}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="text-[10px] text-slate-400 uppercase">Credits</div>
            <div className="flex items-center gap-1 font-mono-tabular text-base font-bold text-amber-300 mt-0.5">
              <Coins className="h-3.5 w-3.5" />
              <span>+{summary.coinsEarned}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400 font-mono-tabular">
          <span>Max Combo: {summary.maxCombo}x</span>
          <span>·</span>
          <span>Accuracy: {summary.accuracy}%</span>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 px-5 font-display text-sm font-black tracking-wider text-slate-950 hover:brightness-110 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Again</span>
          </button>

          <button
            type="button"
            onClick={onOpenGarage}
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-fuchsia-500/45 bg-slate-900 px-4 text-sm font-semibold text-fuchsia-200 hover:border-fuchsia-400 cursor-pointer whitespace-nowrap"
          >
            <Rocket className="h-4 w-4" />
            <span>Hangar</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-slate-200 hover:border-slate-500 cursor-pointer whitespace-nowrap"
          >
            <Home className="h-4 w-4" />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== SETTINGS MODAL ==================== */
interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (next: Partial<GameSettings>) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onUpdateSettings, onResetProgress, onClose }: SettingsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const schemes: { id: ControlScheme; label: string }[] = [
    { id: 'auto', label: 'Auto (Touch + Keys)' },
    { id: 'joystick', label: 'Virtual Joystick' },
    { id: 'touch_drag', label: 'Touch Drag' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#03040c]/85 px-4 py-6 backdrop-blur-md overflow-y-auto custom-scroll">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#090d1e]/95 p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-display text-2xl font-black text-white">Settings</h2>
            <p className="text-xs text-slate-400">Audio, controls, and visual preferences</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-200 hover:border-cyan-400 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Done</span>
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm">
          {/* Audio Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">Master Audio</span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ muted: !settings.muted })}
                className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold cursor-pointer ${
                  settings.muted
                    ? 'border-rose-500/50 bg-rose-950/30 text-rose-300'
                    : 'border-cyan-500/50 bg-cyan-950/30 text-cyan-200'
                }`}
              >
                {settings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                <span>{settings.muted ? 'Muted' : 'Enabled'}</span>
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Music Volume</span>
                <span className="font-mono-tabular text-cyan-300">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.musicVolume * 100)}
                onChange={(e) => onUpdateSettings({ musicVolume: Number(e.target.value) / 100 })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Sound Effects Volume</span>
                <span className="font-mono-tabular text-cyan-300">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.sfxVolume * 100)}
                onChange={(e) => onUpdateSettings({ sfxVolume: Number(e.target.value) / 100 })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Control Scheme */}
          <div className="border-t border-slate-800 pt-4">
            <div className="text-xs font-semibold text-slate-300 mb-2">Mobile / Touch Control Mode</div>
            <div className="grid grid-cols-3 gap-2">
              {schemes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdateSettings({ controlScheme: s.id })}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    settings.controlScheme === s.id
                      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="border-t border-slate-800 pt-4 space-y-2.5">
            {[
              { key: 'autoFire' as const, label: 'Auto-Fire Weapons', desc: 'Automatically fire primary weapons in combat' },
              { key: 'screenShake' as const, label: 'Screen Shake FX', desc: 'Camera impact shake on explosions and bosses' },
              { key: 'highQualityParticles' as const, label: 'High Particle Density', desc: 'Full debris and thruster spark density' },
            ].map((item) => {
              const active = settings[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ [item.key]: !active })}
                    className={`h-8 min-w-[64px] rounded-lg border px-3 text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300'
                        : 'border-slate-700 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {active ? 'ON' : 'OFF'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Reset Progress */}
          <div className="border-t border-slate-800 pt-4">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/20 text-xs font-semibold text-rose-300 hover:border-rose-400 cursor-pointer"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Reset Saved Progress</span>
              </button>
            ) : (
              <div className="rounded-lg border border-rose-500/50 bg-rose-950/35 p-3 text-center">
                <p className="text-xs text-rose-200 font-semibold">
                  Erase all high scores, credits, unlocked ships, upgrades, and achievements?
                </p>
                <div className="mt-2.5 flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      onResetProgress();
                      setConfirmReset(false);
                    }}
                    className="rounded-md bg-rose-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-400 cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== ACHIEVEMENTS MODAL ==================== */
interface AchievementsModalProps {
  saveData: SaveData;
  onBack: () => void;
}

export function AchievementsModal({ saveData, onBack }: AchievementsModalProps) {
  const unlockedSet = new Set(saveData.achievements);

  return (
    <div className="relative z-10 flex h-full w-full flex-col overflow-y-auto custom-scroll px-4 py-5 sm:px-8 sm:py-7">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/25 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 text-xs font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white">Achievements</h1>
              <p className="text-xs text-slate-400">
                Unlocked {saveData.achievements.length} of {ACHIEVEMENTS.length} career milestones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono-tabular text-slate-300">
            <span>Games: <strong className="text-white">{saveData.stats.totalGamesPlayed}</strong></span>
            <span>Kills: <strong className="text-cyan-300">{saveData.stats.totalKills.toLocaleString()}</strong></span>
            <span>Crits: <strong className="text-amber-300">{saveData.stats.totalCrits.toLocaleString()}</strong></span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = unlockedSet.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`flex items-start gap-3.5 rounded-xl border p-4 ${
                  unlocked
                    ? 'border-amber-400/45 bg-amber-950/20'
                    : 'border-slate-800 bg-[#090d1e]/80 opacity-80'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                    unlocked
                      ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                      : 'border-slate-700 bg-slate-900 text-slate-500'
                  }`}
                >
                  {unlocked ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-bold text-white">{ach.title}</h3>
                    {unlocked ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-mono-tabular text-[11px] text-amber-300 shrink-0">
                        <Coins className="h-3 w-3" />
                        <span>+{ach.rewardCoins}</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{ach.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
