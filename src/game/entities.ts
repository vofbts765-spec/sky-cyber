import { BossArchetype, EnemyType, PowerUpType, WeaponType } from './types';

export interface PooledBullet {
  active: boolean;
  fromPlayer: boolean;
  weapon: WeaponType | 'enemy_orb' | 'enemy_lance' | 'enemy_mine';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  isCrit: boolean;
  splashRadius: number;
  homing: boolean;
  life: number;
  maxLife: number;
}

export interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  drag: number;
  shape: 'circle' | 'spark' | 'shard';
  rotation: number;
  vRot: number;
}

export interface PooledShockwave {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export interface PooledFloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
}

export interface EnemyEntity {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  color: string;
  angle: number;
  age: number;
  fireTimer: number;
  telegraphTimer: number;
  telegraphTargetX: number;
  telegraphTargetY: number;
  hitFlash: number;
  scoreValue: number;
  coinValue: number;
}

export interface BossEntity {
  archetype: BossArchetype;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  targetY: number;
  vx: number;
  radius: number;
  hp: number;
  maxHp: number;
  phase: number;
  maxPhases: number;
  color: string;
  secondaryColor: string;
  entering: boolean;
  enterProgress: number;
  age: number;
  attackTimer: number;
  patternIndex: number;
  subBurstCount: number;
  subBurstTimer: number;
  spiralAngle: number;
  telegraphTimer: number;
  laserSweepAngle: number;
  hitFlash: number;
  scoreValue: number;
  coinValue: number;
}

export interface AsteroidEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  angle: number;
  vRot: number;
  vertices: number[];
  hitFlash: number;
}

export interface PowerUpEntity {
  x: number;
  y: number;
  vy: number;
  radius: number;
  type: PowerUpType;
  color: string;
  label: string;
  pulse: number;
}

export interface CoinPickup {
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  radius: number;
  age: number;
}

export interface StarLayerItem {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  color: string;
  layer: 0 | 1 | 2;
}

export interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  color: string;
  speed: number;
  alpha: number;
}
