import { ArrowLeft, Check, Play, Trophy } from 'lucide-react';
import { CHALLENGE_MODIFIERS, GAME_MODES, MODE_ORDER } from '../game/constants';
import { ChallengeModifierId, GameMode, SaveData } from '../game/types';

interface ModeSelectProps {
  saveData: SaveData;
  selectedMode: GameMode;
  challengeModifier: ChallengeModifierId;
  onSelectMode: (mode: GameMode) => void;
  onSelectChallengeMod: (mod: ChallengeModifierId) => void;
  onLaunchMode: (mode: GameMode) => void;
  onBack: () => void;
}

export function ModeSelect({
  saveData,
  selectedMode,
  challengeModifier,
  onSelectMode,
  onSelectChallengeMod,
  onLaunchMode,
  onBack,
}: ModeSelectProps) {
  return (
    <div className="relative z-10 flex h-full w-full flex-col overflow-y-auto custom-scroll px-4 py-5 sm:px-8 sm:py-7">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
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
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white">Game Modes</h1>
              <p className="text-xs text-slate-400">Choose your mission parameters and scoring rules</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onLaunchMode(selectedMode)}
            className="flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 px-6 font-display text-xs sm:text-sm font-black tracking-wider text-slate-950 shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:brightness-110 cursor-pointer whitespace-nowrap"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Launch {GAME_MODES[selectedMode].name}</span>
          </button>
        </div>

        {/* Mode Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODE_ORDER.map((modeId) => {
            const cfg = GAME_MODES[modeId];
            const isSelected = selectedMode === modeId;
            const best = saveData.modeHighScores[modeId] || 0;

            return (
              <div
                key={modeId}
                onClick={() => onSelectMode(modeId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectMode(modeId);
                  }
                }}
                className={`flex flex-col justify-between rounded-xl border p-5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_24px_rgba(0,243,255,0.18)]'
                    : 'border-slate-800 bg-[#090d1e]/85 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium" style={{ color: cfg.accentColor }}>
                        {cfg.tagline}
                      </p>
                      <h2 className="font-display text-lg font-bold text-white mt-0.5">{cfg.name}</h2>
                    </div>
                    {isSelected && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-300">{cfg.description}</p>

                  <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                    {cfg.rules.map((r) => (
                      <li key={r} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-cyan-400 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-800/90 pt-3 text-xs">
                  <div className="flex items-center gap-1.5 font-mono-tabular text-slate-300">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    <span>Best: {best.toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMode(modeId);
                      onLaunchMode(modeId);
                    }}
                    className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 font-semibold text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Play
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Challenge Modifier Selection */}
        {selectedMode === 'challenge' && (
          <div className="mt-6 rounded-xl border border-sky-500/35 bg-slate-900/80 p-5">
            <h3 className="font-display text-sm font-bold text-sky-300 uppercase tracking-wider">
              Challenge Ops Mutator
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(Object.keys(CHALLENGE_MODIFIERS) as ChallengeModifierId[]).map((modId) => {
                const mod = CHALLENGE_MODIFIERS[modId];
                const active = challengeModifier === modId;
                return (
                  <button
                    key={modId}
                    type="button"
                    onClick={() => onSelectChallengeMod(modId)}
                    className={`rounded-lg border p-3.5 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-sky-400 bg-sky-950/50 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-display text-sm font-bold">{mod.name}</div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{mod.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
