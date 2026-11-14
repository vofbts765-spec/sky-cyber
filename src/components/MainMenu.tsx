import { Award, Coins, Play, Rocket, Settings, Sliders, Trophy } from 'lucide-react';
import { ACHIEVEMENTS, GAME_MODES, SHIPS } from '../game/constants';
import { getComputedShipStats } from '../game/storage';
import { GameMode, SaveData } from '../game/types';
import { ShipPreviewCanvas } from './ShipPreviewCanvas';

interface MainMenuProps {
  saveData: SaveData;
  selectedMode: GameMode;
  onPlayNow: () => void;
  onOpenModes: () => void;
  onOpenGarage: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
}

export function MainMenu({
  saveData,
  selectedMode,
  onPlayNow,
  onOpenModes,
  onOpenGarage,
  onOpenAchievements,
  onOpenSettings,
}: MainMenuProps) {
  const ship = SHIPS[saveData.selectedShip];
  const stats = getComputedShipStats(saveData.selectedShip, saveData.upgrades[saveData.selectedShip]);
  const modeCfg = GAME_MODES[selectedMode];

  return (
    <div className="relative z-10 flex h-full w-full flex-col justify-between overflow-y-auto custom-scroll px-4 py-5 sm:px-8 sm:py-7">
      {/* Top Bar: Clean 3-zone header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div className="font-display text-lg sm:text-xl font-black tracking-wider text-white whitespace-nowrap shrink-0">
          NEON GALAXY
        </div>

        <div className="flex items-center gap-5 text-xs sm:text-sm text-slate-300 font-mono-tabular">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Trophy className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-400">Best</span>
            <span className="font-bold text-white">{saveData.highScore.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Coins className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-amber-300">{saveData.coins.toLocaleString()}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-10 items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/70 hover:text-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
          aria-label="Open Settings"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </header>

      {/* Main Content Split */}
      <main className="mx-auto my-auto grid w-full max-w-6xl grid-cols-1 gap-8 py-6 lg:grid-cols-12 lg:items-center">
        {/* Left: Hero Title + Primary Actions */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <p className="text-xs sm:text-sm font-medium tracking-[0.22em] text-cyan-300 uppercase mb-2">
            Void Striker · Ultimate Edition
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-[1.06] bg-gradient-to-b from-white via-cyan-200 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(0,243,255,0.35)]">
            NEON GALAXY
          </h1>
          <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300">
            Pilot customizable starfighters across six tactical game modes, unleash upgradable laser, plasma, spread, and missile arsenals, and dismantle multi-phase sector dreadnoughts.
          </p>

          {/* Active Deployment Summary */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-300">
            <span>
              Mode: <strong className="text-cyan-300">{modeCfg.name}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>
              Ship: <strong className="text-fuchsia-300">{ship.name}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              Achievements: <strong className="text-white">{saveData.achievements.length}/{ACHIEVEMENTS.length}</strong>
            </span>
          </div>

          {/* Primary + Secondary Action Buttons */}
          <div className="mt-7 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onPlayNow}
              className="flex h-12 min-w-[190px] items-center justify-center gap-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 px-7 font-display text-sm font-black tracking-wider text-slate-950 shadow-[0_0_26px_rgba(0,243,255,0.45)] transition-transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Start Game</span>
            </button>

            <button
              type="button"
              onClick={onOpenModes}
              className="flex h-12 items-center justify-center gap-2 rounded-lg border border-cyan-500/45 bg-slate-900/75 px-5 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400 hover:bg-cyan-950/50 whitespace-nowrap cursor-pointer"
            >
              <Sliders className="h-4 w-4" />
              <span>Game Modes</span>
            </button>

            <button
              type="button"
              onClick={onOpenGarage}
              className="flex h-12 items-center justify-center gap-2 rounded-lg border border-fuchsia-500/45 bg-slate-900/75 px-5 text-sm font-semibold text-fuchsia-200 transition-colors hover:border-fuchsia-400 hover:bg-fuchsia-950/40 whitespace-nowrap cursor-pointer"
            >
              <Rocket className="h-4 w-4" />
              <span>Ship Hangar</span>
            </button>

            <button
              type="button"
              onClick={onOpenAchievements}
              className="flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/75 px-5 text-sm font-semibold text-slate-200 transition-colors hover:border-amber-400/60 hover:text-amber-300 whitespace-nowrap cursor-pointer"
            >
              <Award className="h-4 w-4" />
              <span>Achievements</span>
            </button>
          </div>
        </div>

        {/* Right: Active Starfighter Card */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-cyan-500/25 bg-[#090d1e]/85 p-5 sm:p-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs font-medium text-cyan-400">{ship.role}</p>
                <h2 className="font-display text-xl font-bold text-white mt-0.5">{ship.name}</h2>
              </div>
              <button
                type="button"
                onClick={onOpenGarage}
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline underline-offset-4 whitespace-nowrap cursor-pointer"
              >
                Upgrade Ship
              </button>
            </div>

            <div className="my-4 flex items-center gap-5">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/70">
                <ShipPreviewCanvas shipId={saveData.selectedShip} size={108} />
              </div>
              <div className="flex-1 space-y-2.5 text-xs">
                <div className="flex justify-between font-mono-tabular">
                  <span className="text-slate-400">Hull HP</span>
                  <span className="font-semibold text-white">{stats.health}</span>
                </div>
                <div className="flex justify-between font-mono-tabular">
                  <span className="text-slate-400">Shield</span>
                  <span className="font-semibold text-emerald-300">{stats.shield}</span>
                </div>
                <div className="flex justify-between font-mono-tabular">
                  <span className="text-slate-400">Weapon Damage</span>
                  <span className="font-semibold text-fuchsia-300">{stats.damage}</span>
                </div>
                <div className="flex justify-between font-mono-tabular">
                  <span className="text-slate-400">Fire Rate</span>
                  <span className="font-semibold text-cyan-300">{stats.fireRate}/s</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Passive: <span className="text-slate-200 font-medium">{ship.passiveLabel}</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer: Controls Quick Reference */}
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3.5 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <span><strong className="text-cyan-300">WASD / Arrows</strong> Move</span>
          <span><strong className="text-cyan-300">1 - 4</strong> Switch Weapons</span>
          <span><strong className="text-cyan-300">Space</strong> Fire</span>
          <span><strong className="text-cyan-300">Esc / P</strong> Pause</span>
          <span><strong className="text-cyan-300">Touch / Drag</strong> Mobile Controls</span>
        </div>
        <div className="font-mono-tabular text-slate-500">
          Kills: {saveData.stats.totalKills.toLocaleString()} · Bosses: {saveData.stats.totalBossesDefeated}
        </div>
      </footer>
    </div>
  );
}
