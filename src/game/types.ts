export type GameScreen =
  | 'loading'
  | 'menu'
  | 'modes'
  | 'garage'
  | 'achievements'
  | 'settings'
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'victory';

export type GameMode =
  | 'classic'
  | 'survival'
  | 'endless'
  | 'boss_rush'
  | 'time_attack'
  | 'challenge';

export type ChallengeModifierId =
  | 'hyper_velocity'
  | 'glass_cannon'
  | 'bullet_storm';

export type WeaponType = 'laser' | 'plasma' | 'spread' | 'missile';

export type ShipId = 'striker' | 'phantom' | 'titan' | 'nova';

export type UpgradeKey = 'speed' | 'health' | 'damage' | 'fireRate' | 'shield';

export type ControlScheme = 'auto' | 'joystick' | 'touch_drag';

export type EnemyType =
  | 'basic'
  | 'fast'
  | 'tank'
  | 'sniper'
  | 'kamikaze'
  | 'carrier';

export type PowerUpType =
  | 'triple'
  | 'shield'
  | 'health'
  | 'rapid'
  | 'weapon_up'
  | 'weapon_laser'
  | 'weapon_plasma'
  | 'weapon_spread'
  | 'weapon_missile';

export type BossArchetype =
  | 'vortex_sentinel'
  | 'crimson_leviathan'
  | 'nebula_hydra'
  | 'chrono_overlord'
  | 'omega_singularity';

export interface ShipUpgrades {
  speed: number;
  health: number;
  damage: number;
  fireRate: number;
  shield: number;
}

export interface ShipConfig {
  id: ShipId;
  name: string;
  role: string;
  description: string;
  unlockCost: number;
  primaryColor: string;
  secondaryColor: string;
  engineColor: string;
  defaultWeapon: WeaponType;
  baseSpeed: number; // px per second
  baseHealth: number;
  baseDamage: number;
  baseFireRate: number; // shots per second
  baseShield: number;
  critChance: number; // 0..1
  passiveLabel: string;
}

export interface GameModeConfig {
  id: GameMode;
  name: string;
  tagline: string;
  description: string;
  rules: string[];
  accentColor: string;
  coinMultiplier: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  category: 'combat' | 'boss' | 'progression' | 'mastery';
}

export interface GameSettings {
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  muted: boolean;
  controlScheme: ControlScheme;
  screenShake: boolean;
  autoFire: boolean;
  highQualityParticles: boolean;
}

export interface PlayerStats {
  totalKills: number;
  totalBossesDefeated: number;
  totalGamesPlayed: number;
  totalCoinsEarned: number;
  highestWave: number;
  highestCombo: number;
  totalCrits: number;
}

export interface SaveData {
  version: number;
  highScore: number;
  modeHighScores: Record<GameMode, number>;
  coins: number;
  unlockedShips: ShipId[];
  selectedShip: ShipId;
  upgrades: Record<ShipId, ShipUpgrades>;
  achievements: string[];
  stats: PlayerStats;
  settings: GameSettings;
}

export interface BossHudInfo {
  name: string;
  subtitle: string;
  hp: number;
  maxHp: number;
  phase: number;
  maxPhases: number;
  color: string;
}

export interface BannerAlert {
  id: number;
  type: 'wave' | 'boss_warning' | 'mission' | 'achievement' | 'victory_pulse';
  title: string;
  subtitle: string;
  color: string;
}

export interface HudSnapshot {
  score: number;
  highScore: number;
  wave: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  weapon: WeaponType;
  weaponLevel: number;
  combo: number;
  comboTimerRatio: number; // 0..1
  kills: number;
  runCoins: number;
  tripleTimer: number;
  rapidTimer: number;
  overdriveTimer: number;
  timeRemaining: number | null; // Time Attack countdown seconds
  bossRushIndex: number;
  bossRushTotal: number;
  boss: BossHudInfo | null;
  mode: GameMode;
  critFlash: boolean;
}

export interface RunSummary {
  victory: boolean;
  mode: GameMode;
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  wave: number;
  kills: number;
  bossesDefeated: number;
  maxCombo: number;
  coinsEarned: number;
  durationSeconds: number;
  accuracy: number;
  shipUsed: ShipId;
}
