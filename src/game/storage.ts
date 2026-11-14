import { SHIPS, UPGRADE_META } from './constants';
import { GameMode, SaveData, ShipId, ShipUpgrades, UpgradeKey } from './types';

const STORAGE_KEY = 'neon_galaxy_void_striker_save_v2';
const LEGACY_HIGH_KEY = 'neonGalaxyHigh';

function createDefaultUpgrades(): ShipUpgrades {
  return {
    speed: 0,
    health: 0,
    damage: 0,
    fireRate: 0,
    shield: 0,
  };
}

export function createDefaultSaveData(): SaveData {
  let legacyHigh = 0;
  try {
    const rawLegacy = window.localStorage.getItem(LEGACY_HIGH_KEY);
    if (rawLegacy) {
      const parsed = Number(rawLegacy);
      if (Number.isFinite(parsed) && parsed > 0) legacyHigh = Math.floor(parsed);
    }
  } catch {
    // ignore storage access issues
  }

  return {
    version: 2,
    highScore: legacyHigh,
    modeHighScores: {
      classic: legacyHigh,
      survival: 0,
      endless: 0,
      boss_rush: 0,
      time_attack: 0,
      challenge: 0,
    },
    coins: 120, // Starter credits so players can explore the upgrade garage right away
    unlockedShips: ['striker'],
    selectedShip: 'striker',
    upgrades: {
      striker: createDefaultUpgrades(),
      phantom: createDefaultUpgrades(),
      titan: createDefaultUpgrades(),
      nova: createDefaultUpgrades(),
    },
    achievements: [],
    stats: {
      totalKills: 0,
      totalBossesDefeated: 0,
      totalGamesPlayed: 0,
      totalCoinsEarned: 0,
      highestWave: 1,
      highestCombo: 0,
      totalCrits: 0,
    },
    settings: {
      musicVolume: 0.45,
      sfxVolume: 0.65,
      muted: false,
      controlScheme: 'auto',
      screenShake: true,
      autoFire: true,
      highQualityParticles: true,
    },
  };
}

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(val)));
}

function clampFloat(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

export function loadSaveData(): SaveData {
  const defaults = createDefaultSaveData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (!parsed || typeof parsed !== 'object') return defaults;

    const validShips: ShipId[] = ['striker', 'phantom', 'titan', 'nova'];
    const unlockedShips = Array.isArray(parsed.unlockedShips)
      ? parsed.unlockedShips.filter((s): s is ShipId => validShips.includes(s as ShipId))
      : defaults.unlockedShips;
    if (!unlockedShips.includes('striker')) unlockedShips.unshift('striker');

    const selectedShip: ShipId =
      typeof parsed.selectedShip === 'string' && unlockedShips.includes(parsed.selectedShip as ShipId)
        ? (parsed.selectedShip as ShipId)
        : 'striker';

    const upgrades: Record<ShipId, ShipUpgrades> = {
      striker: createDefaultUpgrades(),
      phantom: createDefaultUpgrades(),
      titan: createDefaultUpgrades(),
      nova: createDefaultUpgrades(),
    };

    for (const sId of validShips) {
      const src = parsed.upgrades?.[sId];
      if (src && typeof src === 'object') {
        upgrades[sId] = {
          speed: clampInt(src.speed, 0, UPGRADE_META.speed.maxLevel, 0),
          health: clampInt(src.health, 0, UPGRADE_META.health.maxLevel, 0),
          damage: clampInt(src.damage, 0, UPGRADE_META.damage.maxLevel, 0),
          fireRate: clampInt(src.fireRate, 0, UPGRADE_META.fireRate.maxLevel, 0),
          shield: clampInt(src.shield, 0, UPGRADE_META.shield.maxLevel, 0),
        };
      }
    }

    const modes: GameMode[] = ['classic', 'survival', 'endless', 'boss_rush', 'time_attack', 'challenge'];
    const modeHighScores = { ...defaults.modeHighScores };
    for (const m of modes) {
      modeHighScores[m] = clampInt(parsed.modeHighScores?.[m], 0, 999_999_999, defaults.modeHighScores[m]);
    }

    const achievements = Array.isArray(parsed.achievements)
      ? Array.from(new Set(parsed.achievements.filter((a): a is string => typeof a === 'string')))
      : [];

    const stats = {
      totalKills: clampInt(parsed.stats?.totalKills, 0, 999_999_999, 0),
      totalBossesDefeated: clampInt(parsed.stats?.totalBossesDefeated, 0, 999_999_999, 0),
      totalGamesPlayed: clampInt(parsed.stats?.totalGamesPlayed, 0, 999_999_999, 0),
      totalCoinsEarned: clampInt(parsed.stats?.totalCoinsEarned, 0, 999_999_999, 0),
      highestWave: clampInt(parsed.stats?.highestWave, 1, 999_999, 1),
      highestCombo: clampInt(parsed.stats?.highestCombo, 0, 999_999, 0),
      totalCrits: clampInt(parsed.stats?.totalCrits, 0, 999_999_999, 0),
    };

    const validSchemes = ['auto', 'joystick', 'touch_drag'];
    const controlScheme =
      typeof parsed.settings?.controlScheme === 'string' && validSchemes.includes(parsed.settings.controlScheme)
        ? parsed.settings.controlScheme
        : 'auto';

    const settings = {
      musicVolume: clampFloat(parsed.settings?.musicVolume, 0, 1, defaults.settings.musicVolume),
      sfxVolume: clampFloat(parsed.settings?.sfxVolume, 0, 1, defaults.settings.sfxVolume),
      muted: typeof parsed.settings?.muted === 'boolean' ? parsed.settings.muted : false,
      controlScheme: controlScheme as SaveData['settings']['controlScheme'],
      screenShake: typeof parsed.settings?.screenShake === 'boolean' ? parsed.settings.screenShake : true,
      autoFire: typeof parsed.settings?.autoFire === 'boolean' ? parsed.settings.autoFire : true,
      highQualityParticles:
        typeof parsed.settings?.highQualityParticles === 'boolean' ? parsed.settings.highQualityParticles : true,
    };

    return {
      version: 2,
      highScore: Math.max(defaults.highScore, clampInt(parsed.highScore, 0, 999_999_999, 0)),
      modeHighScores,
      coins: clampInt(parsed.coins, 0, 999_999_999, defaults.coins),
      unlockedShips,
      selectedShip,
      upgrades,
      achievements,
      stats,
      settings,
    };
  } catch {
    return defaults;
  }
}

export function persistSaveData(data: SaveData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.localStorage.setItem(LEGACY_HIGH_KEY, String(data.highScore));
  } catch {
    // Gracefully handle quota exceeded or private browsing restrictions
  }
}

export function resetAllSaveData(): SaveData {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_HIGH_KEY);
  } catch {
    // ignore
  }
  const fresh = createDefaultSaveData();
  persistSaveData(fresh);
  return fresh;
}

export function getUpgradeCost(key: UpgradeKey, currentLevel: number): number {
  const meta = UPGRADE_META[key];
  return meta.baseCost + currentLevel * meta.costStep;
}

export function getComputedShipStats(shipId: ShipId, upgrades: ShipUpgrades) {
  const base = SHIPS[shipId];
  return {
    speed: base.baseSpeed + upgrades.speed * 24,
    health: base.baseHealth + upgrades.health * 20,
    damage: base.baseDamage + upgrades.damage * 2.5,
    fireRate: Number((base.baseFireRate + upgrades.fireRate * 0.45).toFixed(2)),
    shield: base.baseShield + upgrades.shield * 18,
    critChance: base.critChance,
  };
}
