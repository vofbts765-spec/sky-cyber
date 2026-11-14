import { ArrowLeft, Check, Coins, Lock, Play, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { SHIPS, SHIP_ORDER, UPGRADE_META, WEAPONS } from '../game/constants';
import { getComputedShipStats, getUpgradeCost } from '../game/storage';
import { SaveData, ShipId, UpgradeKey } from '../game/types';
import { ShipPreviewCanvas } from './ShipPreviewCanvas';

interface ShipGarageProps {
  saveData: SaveData;
  onSelectShip: (shipId: ShipId) => void;
  onUnlockShip: (shipId: ShipId) => void;
  onUpgradeShip: (shipId: ShipId, key: UpgradeKey) => void;
  onPlayWithShip: () => void;
  onBack: () => void;
}

const UPGRADE_KEYS: UpgradeKey[] = ['speed', 'health', 'damage', 'fireRate', 'shield'];

export function ShipGarage({
  saveData,
  onSelectShip,
  onUnlockShip,
  onUpgradeShip,
  onPlayWithShip,
  onBack,
}: ShipGarageProps) {
  const [inspectShip, setInspectShip] = useState<ShipId>(saveData.selectedShip);

  const ship = SHIPS[inspectShip];
  const isUnlocked = saveData.unlockedShips.includes(inspectShip);
  const isEquipped = saveData.selectedShip === inspectShip;
  const upgrades = saveData.upgrades[inspectShip];
  const computed = getComputedShipStats(inspectShip, upgrades);
  const defaultWeapon = WEAPONS[ship.defaultWeapon];

  return (
    <div className="relative z-10 flex h-full w-full flex-col overflow-y-auto custom-scroll px-4 py-5 sm:px-8 sm:py-7">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fuchsia-500/25 pb-4">
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
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white">Ship Hangar</h1>
              <p className="text-xs text-slate-400">Unlock starfighters and upgrade flight & weapon systems</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/35 bg-amber-950/30 px-3.5 py-2 font-mono-tabular text-sm">
              <Coins className="h-4 w-4 text-amber-400" />
              <span className="font-bold text-amber-300">{saveData.coins.toLocaleString()}</span>
              <span className="text-xs text-amber-200/70">Credits</span>
            </div>

            <button
              type="button"
              onClick={onPlayWithShip}
              className="flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 px-5 font-display text-xs font-black tracking-wider text-slate-950 hover:brightness-110 cursor-pointer whitespace-nowrap"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Launch</span>
            </button>
          </div>
        </div>

        {/* Ship Selector Tabs */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SHIP_ORDER.map((id) => {
            const cfg = SHIPS[id];
            const unlocked = saveData.unlockedShips.includes(id);
            const equipped = saveData.selectedShip === id;
            const active = inspectShip === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setInspectShip(id)}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                  active
                    ? 'border-cyan-400 bg-cyan-950/35 shadow-[0_0_20px_rgba(0,243,255,0.18)]'
                    : 'border-slate-800 bg-[#090d1e]/85 hover:border-slate-600'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-[11px] font-medium" style={{ color: cfg.primaryColor }}>
                    {cfg.role}
                  </span>
                  {!unlocked ? (
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  ) : equipped ? (
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : null}
                </div>
                <div className="font-display text-sm sm:text-base font-bold text-white mt-1">{cfg.name}</div>
                <div className="mt-1.5 text-[11px] text-slate-400 font-mono-tabular">
                  {unlocked ? (equipped ? 'Equipped' : 'Unlocked') : `Unlock: ${cfg.unlockCost} Cr`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Ship View & Upgrades */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Ship Profile & Actions */}
          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#090d1e]/90 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: ship.primaryColor }}>
                    {ship.role}
                  </p>
                  <h2 className="font-display text-2xl font-black text-white mt-0.5">{ship.name}</h2>
                </div>
                <span className="text-xs font-mono-tabular text-slate-400">
                  Crit: <strong className="text-amber-300">{Math.round(computed.critChance * 100)}%</strong>
                </span>
              </div>

              <div className="my-5 flex items-center justify-center rounded-xl border border-slate-800/90 bg-slate-950/75 py-4">
                <ShipPreviewCanvas shipId={inspectShip} size={156} />
              </div>

              <p className="text-xs sm:text-sm leading-relaxed text-slate-300">{ship.description}</p>

              <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Default Weapon</span>
                  <span className="font-semibold" style={{ color: defaultWeapon.color }}>
                    {defaultWeapon.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Special Passive</span>
                  <span className="font-semibold text-emerald-300">{ship.passiveLabel}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {!isUnlocked ? (
                <button
                  type="button"
                  disabled={saveData.coins < ship.unlockCost}
                  onClick={() => onUnlockShip(inspectShip)}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-lg font-display text-sm font-bold tracking-wider transition-all ${
                    saveData.coins >= ship.unlockCost
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:brightness-110 cursor-pointer'
                      : 'border border-slate-700 bg-slate-900 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="h-4 w-4" />
                  <span>
                    {saveData.coins >= ship.unlockCost
                      ? `Unlock Ship (${ship.unlockCost} Credits)`
                      : `Need ${ship.unlockCost} Credits`}
                  </span>
                </button>
              ) : isEquipped ? (
                <div className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-950/30 font-display text-sm font-bold text-emerald-300">
                  <Check className="h-4 w-4" />
                  <span>Currently Equipped</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectShip(inspectShip)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-cyan-400 bg-cyan-500/15 font-display text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 transition-colors cursor-pointer"
                >
                  <Shield className="h-4 w-4" />
                  <span>Equip Starfighter</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: 5 Upgrade Systems */}
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#090d1e]/90 p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div>
                <h3 className="font-display text-lg font-bold text-white">System Upgrades</h3>
                <p className="text-xs text-slate-400">Upgrades apply permanently to {ship.name}</p>
              </div>
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>

            <div className="mt-4 space-y-3.5">
              {UPGRADE_KEYS.map((key) => {
                const meta = UPGRADE_META[key];
                const level = upgrades[key];
                const isMax = level >= meta.maxLevel;
                const cost = getUpgradeCost(key, level);
                const canAfford = saveData.coins >= cost;

                const currentStat =
                  key === 'speed'
                    ? `${computed.speed} px/s`
                    : key === 'health'
                    ? `${computed.health} HP`
                    : key === 'damage'
                    ? `${computed.damage} DMG`
                    : key === 'fireRate'
                    ? `${computed.fireRate}/s`
                    : `${computed.shield} SHD`;

                return (
                  <div
                    key={key}
                    className="flex flex-col gap-3 rounded-lg border border-slate-800/90 bg-slate-950/60 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                        <span className="font-display text-sm font-bold text-white">{meta.label}</span>
                        <span className="font-mono-tabular text-xs text-cyan-300">{currentStat}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{meta.shortDesc}</p>

                      {/* 5-segment progress meter */}
                      <div className="mt-2.5 flex items-center gap-1.5">
                        {Array.from({ length: meta.maxLevel }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 flex-1 rounded-sm ${
                              idx < level ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,243,255,0.6)]' : 'bg-slate-800'
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-mono-tabular text-[11px] text-slate-400">
                          Lv.{level}/{meta.maxLevel}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isUnlocked || isMax || !canAfford}
                      onClick={() => onUpgradeShip(inspectShip, key)}
                      className={`flex h-10 min-w-[140px] shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-bold transition-colors whitespace-nowrap ${
                        !isUnlocked
                          ? 'border border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
                          : isMax
                          ? 'border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 cursor-default'
                          : canAfford
                          ? 'border border-cyan-400/60 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 cursor-pointer'
                          : 'border border-slate-800 bg-slate-900 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {!isUnlocked ? (
                        <span>Locked</span>
                      ) : isMax ? (
                        <span>Maxed</span>
                      ) : (
                        <>
                          <Coins className="h-3.5 w-3.5 text-amber-400" />
                          <span className="font-mono-tabular">{cost} · {meta.bonusPerLevel}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
