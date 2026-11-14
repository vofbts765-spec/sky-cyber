import {
  AchievementDef,
  ChallengeModifierId,
  GameMode,
  GameModeConfig,
  ShipConfig,
  ShipId,
  UpgradeKey,
  WeaponType,
} from './types';

export const SHIPS: Record<ShipId, ShipConfig> = {
  striker: {
    id: 'striker',
    name: 'Void Striker',
    role: 'Balanced Interceptor',
    description: 'The flagship neon interceptor. Balanced agility, crisp laser cannons, and reliable energy shielding.',
    unlockCost: 0,
    primaryColor: '#00f3ff',
    secondaryColor: '#38bdf8',
    engineColor: '#00f3ff',
    defaultWeapon: 'laser',
    baseSpeed: 390,
    baseHealth: 100,
    baseDamage: 14,
    baseFireRate: 5.5,
    baseShield: 50,
    critChance: 0.12,
    passiveLabel: '+15% Combo Score Gain',
  },
  phantom: {
    id: 'phantom',
    name: 'Shadow Phantom',
    role: 'Stealth Assault Wing',
    description: 'Razor-fast twin-delta interceptor tuned for critical strikes and wide spread volleys.',
    unlockCost: 350,
    primaryColor: '#e879f9',
    secondaryColor: '#bd00ff',
    engineColor: '#f472b6',
    defaultWeapon: 'spread',
    baseSpeed: 465,
    baseHealth: 85,
    baseDamage: 15,
    baseFireRate: 6.2,
    baseShield: 40,
    critChance: 0.28,
    passiveLabel: '28% Critical Hit Chance (2x DMG)',
  },
  titan: {
    id: 'titan',
    name: 'Aegis Titan',
    role: 'Heavy Gunship',
    description: 'Armored dreadnought hull with reinforced shields and superheated plasma batteries.',
    unlockCost: 650,
    primaryColor: '#22d3ee',
    secondaryColor: '#818cf8',
    engineColor: '#60a5fa',
    defaultWeapon: 'plasma',
    baseSpeed: 330,
    baseHealth: 155,
    baseDamage: 20,
    baseFireRate: 4.6,
    baseShield: 90,
    critChance: 0.15,
    passiveLabel: 'Regenerates +1.5 Shield/sec',
  },
  nova: {
    id: 'nova',
    name: 'Solar Nova',
    role: 'Experimental Hunter',
    description: 'Prototype starfighter equipped with smart homing warheads and accelerated weapon cores.',
    unlockCost: 1100,
    primaryColor: '#fb7185',
    secondaryColor: '#f59e0b',
    engineColor: '#fbbf24',
    defaultWeapon: 'missile',
    baseSpeed: 425,
    baseHealth: 120,
    baseDamage: 18,
    baseFireRate: 5.8,
    baseShield: 70,
    critChance: 0.22,
    passiveLabel: 'Starts at Weapon Lv.2 + Homing Salvos',
  },
};

export const SHIP_ORDER: ShipId[] = ['striker', 'phantom', 'titan', 'nova'];

export const UPGRADE_META: Record<
  UpgradeKey,
  {
    label: string;
    shortDesc: string;
    maxLevel: number;
    baseCost: number;
    costStep: number;
    bonusPerLevel: string;
  }
> = {
  speed: {
    label: 'Thruster Speed',
    shortDesc: 'Increases flight velocity & maneuverability',
    maxLevel: 5,
    baseCost: 70,
    costStep: 60,
    bonusPerLevel: '+24 px/s',
  },
  health: {
    label: 'Hull Integrity',
    shortDesc: 'Reinforces maximum ship armor HP',
    maxLevel: 5,
    baseCost: 80,
    costStep: 70,
    bonusPerLevel: '+20 HP',
  },
  damage: {
    label: 'Weapon Core',
    shortDesc: 'Boosts base damage across all weapons',
    maxLevel: 5,
    baseCost: 90,
    costStep: 80,
    bonusPerLevel: '+2.5 DMG',
  },
  fireRate: {
    label: 'Cyclic Capacitor',
    shortDesc: 'Accelerates firing cadence',
    maxLevel: 5,
    baseCost: 85,
    costStep: 75,
    bonusPerLevel: '+0.45/s',
  },
  shield: {
    label: 'Energy Shield',
    shortDesc: 'Expands maximum regenerating barrier',
    maxLevel: 5,
    baseCost: 75,
    costStep: 65,
    bonusPerLevel: '+18 Shield',
  },
};

export const WEAPONS: Record<
  WeaponType,
  {
    id: WeaponType;
    name: string;
    shortName: string;
    color: string;
    keyHint: string;
    description: string;
  }
> = {
  laser: {
    id: 'laser',
    name: 'Pulse Laser',
    shortName: 'LASER',
    color: '#00f3ff',
    keyHint: '1',
    description: 'High-velocity precision cyan bolts with rapid cycling.',
  },
  plasma: {
    id: 'plasma',
    name: 'Heavy Plasma',
    shortName: 'PLASMA',
    color: '#bd00ff',
    keyHint: '2',
    description: 'High-impact violet plasma orbs with splash shockwaves.',
  },
  spread: {
    id: 'spread',
    name: 'Prism Spread',
    shortName: 'SPREAD',
    color: '#ff0088',
    keyHint: '3',
    description: 'Multi-arc fan salvo ideal for clearing swarms.',
  },
  missile: {
    id: 'missile',
    name: 'Homing Missiles',
    shortName: 'MISSILE',
    color: '#fbbf24',
    keyHint: '4',
    description: 'Heat-seeking warheads that track targets and detonate.',
  },
};

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic Campaign',
    tagline: '15 Waves · 3 Sector Bosses',
    description: 'Progress through 15 escalating waves with boss encounters every 5 waves. Defeat the Nebula Hydra on Wave 15 for Victory.',
    rules: ['Bosses at Waves 5, 10, 15', 'Balanced power-up drops', 'Victory on Wave 15 Clear'],
    accentColor: '#00f3ff',
    coinMultiplier: 1.0,
  },
  survival: {
    id: 'survival',
    name: 'Survival Protocol',
    tagline: 'No Hull Repairs · Pure Endurance',
    description: 'Health repair pickups are disabled. Rely on shields, dodging, and aggressive clears to outlast escalating waves.',
    rules: ['No Health Repair Drops', 'Faster Enemy Scaling', '+35% Coin Rewards'],
    accentColor: '#ff006e',
    coinMultiplier: 1.35,
  },
  endless: {
    id: 'endless',
    name: 'Endless Void',
    tagline: 'Infinite Waves · Unlimited Scaling',
    description: 'No wave cap. Push your high score and combo chains against endlessly intensifying fleets and recurring bosses.',
    rules: ['Infinite Waves', 'Boss Every 5 Waves', 'All 5 Boss Archetypes'],
    accentColor: '#bd00ff',
    coinMultiplier: 1.15,
  },
  boss_rush: {
    id: 'boss_rush',
    name: 'Boss Rush',
    tagline: '5 Dreadnoughts · Back-to-Back',
    description: 'Face all 5 sector bosses sequentially with full weapon upgrades and shield recharges awarded between encounters.',
    rules: ['5 Consecutive Bosses', 'Inter-Boss Repair & Upgrade', '+50% Coin Rewards'],
    accentColor: '#f59e0b',
    coinMultiplier: 1.5,
  },
  time_attack: {
    id: 'time_attack',
    name: 'Time Attack',
    tagline: '180 Seconds · Maximum Carnage',
    description: 'Score as many points as possible before the 3-minute clock expires. Rapid spawns and boosted combo retention.',
    rules: ['3:00 Countdown Timer', 'Accelerated Enemy Waves', '1.5x Combo Build Speed'],
    accentColor: '#10b981',
    coinMultiplier: 1.25,
  },
  challenge: {
    id: 'challenge',
    name: 'Challenge Ops',
    tagline: '10 Waves · Custom Mutator',
    description: 'Deploy with an active combat mutator for high-stakes tactical combat. Clear Wave 10 Boss for double coin payout.',
    rules: ['Select Combat Mutator', '10 Waves to Victory', '2.0x Coin Rewards'],
    accentColor: '#38bdf8',
    coinMultiplier: 2.0,
  },
};

export const MODE_ORDER: GameMode[] = [
  'classic',
  'survival',
  'endless',
  'boss_rush',
  'time_attack',
  'challenge',
];

export const CHALLENGE_MODIFIERS: Record<
  ChallengeModifierId,
  {
    id: ChallengeModifierId;
    name: string;
    description: string;
  }
> = {
  hyper_velocity: {
    id: 'hyper_velocity',
    name: 'Hyper Velocity',
    description: 'Enemies and projectiles move 40% faster, but player speed and fire rate increase by 20%.',
  },
  glass_cannon: {
    id: 'glass_cannon',
    name: 'Glass Cannon',
    description: 'Player deals 2.0x weapon damage, but maximum hull HP is halved.',
  },
  bullet_storm: {
    id: 'bullet_storm',
    name: 'Bullet Storm',
    description: 'Enemy squadrons spawn 45% denser with higher power-up drop rates.',
  },
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_kill',
    title: 'First Contact',
    description: 'Destroy your first enemy starfighter.',
    rewardCoins: 50,
    category: 'combat',
  },
  {
    id: 'enemy_destroyer',
    title: 'Enemy Destroyer',
    description: 'Destroy 150 enemy ships across all sorties.',
    rewardCoins: 150,
    category: 'combat',
  },
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    description: 'Defeat any sector boss dreadnought.',
    rewardCoins: 200,
    category: 'boss',
  },
  {
    id: 'boss_rusher',
    title: 'Dreadnought Bane',
    description: 'Defeat 5 bosses across all missions.',
    rewardCoins: 350,
    category: 'boss',
  },
  {
    id: 'survival_expert',
    title: 'Survival Expert',
    description: 'Reach Wave 8 in Survival Protocol.',
    rewardCoins: 250,
    category: 'mastery',
  },
  {
    id: 'high_scorer',
    title: 'High Scorer',
    description: 'Achieve a single-run score of 25,000 or higher.',
    rewardCoins: 200,
    category: 'progression',
  },
  {
    id: 'weapon_master',
    title: 'Weapon Master',
    description: 'Upgrade a weapon to Level 5 during combat.',
    rewardCoins: 150,
    category: 'mastery',
  },
  {
    id: 'wave_champion',
    title: 'Wave Champion',
    description: 'Reach Wave 15 in Classic or Endless mode.',
    rewardCoins: 300,
    category: 'progression',
  },
  {
    id: 'combo_king',
    title: 'Overdrive Chain',
    description: 'Reach a 25-kill combo chain in a single run.',
    rewardCoins: 175,
    category: 'combat',
  },
  {
    id: 'fleet_commander',
    title: 'Fleet Commander',
    description: 'Unlock at least 3 different starfighters in the Hangar.',
    rewardCoins: 300,
    category: 'progression',
  },
];
