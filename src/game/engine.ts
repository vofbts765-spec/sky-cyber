import { soundEngine } from './audio';
import {
  ACHIEVEMENTS,
  CHALLENGE_MODIFIERS,
  GAME_MODES,
  SHIPS,
  WEAPONS,
} from './constants';
import {
  AsteroidEntity,
  BossEntity,
  CoinPickup,
  EnemyEntity,
  NebulaCloud,
  PooledBullet,
  PooledFloatingText,
  PooledParticle,
  PooledShockwave,
  PowerUpEntity,
  StarLayerItem,
} from './entities';
import { ObjectPool } from './pool';
import {
  drawAsteroid,
  drawBoss,
  drawBullet,
  drawCoin,
  drawEnemy,
  drawFloatingText,
  drawGalaxyBackground,
  drawParticle,
  drawPlayerShip,
  drawPowerUp,
  drawShockwave,
} from './renderer';
import { getComputedShipStats, persistSaveData } from './storage';
import {
  BannerAlert,
  BossArchetype,
  ChallengeModifierId,
  EnemyType,
  GameMode,
  GameSettings,
  HudSnapshot,
  PowerUpType,
  RunSummary,
  SaveData,
  WeaponType,
} from './types';

interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onBanner: (banner: BannerAlert) => void;
  onRunEnd: (summary: RunSummary) => void;
  onPauseRequest: () => void;
  onSaveUpdate: (save: SaveData) => void;
  onAchievementUnlocked: (achievementId: string) => void;
}

const BOSS_ORDER: BossArchetype[] = [
  'vortex_sentinel',
  'crimson_leviathan',
  'nebula_hydra',
  'chrono_overlord',
  'omega_singularity',
];

const BOSS_META: Record<
  BossArchetype,
  { name: string; subtitle: string; color: string; secondary: string; baseHp: number; radius: number }
> = {
  vortex_sentinel: {
    name: 'VORTEX SENTINEL',
    subtitle: 'Sector 01 Prism Dreadnought',
    color: '#00f3ff',
    secondary: '#bd00ff',
    baseHp: 900,
    radius: 52,
  },
  crimson_leviathan: {
    name: 'CRIMSON LEVIATHAN',
    subtitle: 'Heavy Assault Flagship',
    color: '#ff0055',
    secondary: '#fbbf24',
    baseHp: 1450,
    radius: 58,
  },
  nebula_hydra: {
    name: 'NEBULA HYDRA',
    subtitle: 'Tri-Node Void Carrier',
    color: '#bd00ff',
    secondary: '#00f3ff',
    baseHp: 2100,
    radius: 62,
  },
  chrono_overlord: {
    name: 'CHRONO OVERLORD',
    subtitle: 'Orbital Siege Citadel',
    color: '#38bdf8',
    secondary: '#f472b6',
    baseHp: 2700,
    radius: 60,
  },
  omega_singularity: {
    name: 'OMEGA SINGULARITY',
    subtitle: 'Apex Void Entity',
    color: '#f43f5e',
    secondary: '#a855f7',
    baseHp: 3500,
    radius: 68,
  },
};

export class NeonGalaxyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  private width = 900;
  private height = 700;
  private dpr = 1;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private elapsedTime = 0;

  private running = false;
  private paused = false;
  private menuAmbientMode = true;

  // Save & Settings reference
  private saveData: SaveData;
  private settings: GameSettings;

  // Active Run Config
  private mode: GameMode = 'classic';
  private challengeMod: ChallengeModifierId = 'hyper_velocity';

  // Player state
  private player = {
    x: 450,
    y: 580,
    vx: 0,
    vy: 0,
    tilt: 0,
    radius: 19,
    speed: 390,
    hp: 100,
    maxHp: 100,
    shield: 50,
    maxShield: 50,
    shieldRegenDelay: 0,
    damage: 14,
    fireRate: 5.5,
    critChance: 0.12,
    weapon: 'laser' as WeaponType,
    weaponLevel: 1,
    fireCooldown: 0,
    invulnTimer: 0,
    tripleTimer: 0,
    rapidTimer: 0,
    overdriveTimer: 0,
  };

  // Run progression state
  private score = 0;
  private kills = 0;
  private runCoins = 0;
  private bossesDefeated = 0;
  private wave = 1;
  private waveKills = 0;
  private waveQuota = 12;
  private combo = 1;
  private maxCombo = 1;
  private comboTimer = 0;
  private readonly comboDuration = 3.2;
  private shotsFired = 0;
  private shotsHit = 0;
  private timeRemaining: number | null = null;
  private bossRushIndex = 0;
  private bossRushTotal = 5;
  private pendingBossWave = 0;
  private bossSpawnDelay = 0;
  private critFlashTimer = 0;

  // Screen shake & transitions
  private shakeTime = 0;
  private shakeIntensity = 0;
  private hudSyncTimer = 0;
  private spawnTimer = 0;
  private asteroidTimer = 4;
  private nextEnemyId = 1;
  private bannerId = 1;

  // Input
  private keys: Record<string, boolean> = {};
  private pointerActive = false;
  private pointerX = 0;
  private pointerY = 0;
  private virtualJoystick = { active: false, dx: 0, dy: 0 };
  private touchFireActive = false;

  // Background
  private stars: StarLayerItem[] = [];
  private nebulae: NebulaCloud[] = [];

  // Active Entity Lists & Pools
  private bullets: PooledBullet[] = [];
  private particles: PooledParticle[] = [];
  private shockwaves: PooledShockwave[] = [];
  private floatingTexts: PooledFloatingText[] = [];
  private enemies: EnemyEntity[] = [];
  private boss: BossEntity | null = null;
  private asteroids: AsteroidEntity[] = [];
  private powerups: PowerUpEntity[] = [];
  private coins: CoinPickup[] = [];

  private bulletPool: ObjectPool<PooledBullet>;
  private particlePool: ObjectPool<PooledParticle>;
  private shockwavePool: ObjectPool<PooledShockwave>;
  private textPool: ObjectPool<PooledFloatingText>;

  // Bound event listeners for clean removal
  private readonly onResizeBound = () => this.resize();
  private readonly onKeyDownBound = (e: KeyboardEvent) => this.handleKeyDown(e);
  private readonly onKeyUpBound = (e: KeyboardEvent) => this.handleKeyUp(e);
  private readonly onMouseMoveBound = (e: MouseEvent) => this.handleMouseMove(e);
  private readonly onMouseDownBound = (e: MouseEvent) => this.handleMouseDown(e);
  private readonly onMouseUpBound = () => {
    this.pointerActive = false;
  };
  private readonly onTouchStartBound = (e: TouchEvent) => this.handleTouchMove(e, true);
  private readonly onTouchMoveBound = (e: TouchEvent) => this.handleTouchMove(e, false);
  private readonly onTouchEndBound = () => {
    this.pointerActive = false;
  };
  private readonly onVisibilityBound = () => {
    if (document.hidden && this.running && !this.paused && !this.menuAmbientMode) {
      this.setPaused(true);
      this.callbacks.onPauseRequest();
    }
  };

  constructor(canvas: HTMLCanvasElement, saveData: SaveData, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.saveData = saveData;
    this.settings = saveData.settings;
    this.callbacks = callbacks;

    this.bulletPool = new ObjectPool<PooledBullet>(
      () => ({
        active: false,
        fromPlayer: true,
        weapon: 'laser',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 4,
        damage: 10,
        color: '#00f3ff',
        isCrit: false,
        splashRadius: 0,
        homing: false,
        life: 0,
        maxLife: 4,
      }),
      (b) => {
        b.active = false;
        b.homing = false;
        b.splashRadius = 0;
        b.isCrit = false;
      },
      120,
      1000
    );

    this.particlePool = new ObjectPool<PooledParticle>(
      () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#00f3ff',
        alpha: 1,
        decay: 1.8,
        drag: 0.96,
        shape: 'circle',
        rotation: 0,
        vRot: 0,
      }),
      (p) => {
        p.active = false;
      },
      180,
      1400
    );

    this.shockwavePool = new ObjectPool<PooledShockwave>(
      () => ({
        active: false,
        x: 0,
        y: 0,
        radius: 4,
        maxRadius: 80,
        color: '#00f3ff',
        alpha: 0.9,
        lineWidth: 3,
      }),
      (s) => {
        s.active = false;
      },
      24,
      150
    );

    this.textPool = new ObjectPool<PooledFloatingText>(
      () => ({
        active: false,
        x: 0,
        y: 0,
        vy: -40,
        text: '',
        color: '#ffffff',
        alpha: 1,
        scale: 1,
      }),
      (t) => {
        t.active = false;
      },
      32,
      160
    );

    this.resize();
    this.initBackground();
    this.attachListeners();
    this.startLoop();
  }

  public updateSaveData(saveData: SaveData): void {
    this.saveData = saveData;
    this.settings = saveData.settings;
  }

  public setVirtualJoystick(active: boolean, dx: number, dy: number): void {
    this.virtualJoystick.active = active;
    this.virtualJoystick.dx = dx;
    this.virtualJoystick.dy = dy;
  }

  public setTouchFire(active: boolean): void {
    this.touchFireActive = active;
  }

  public switchWeapon(weapon: WeaponType): void {
    if (!this.running || this.paused) return;
    if (this.player.weapon !== weapon) {
      this.player.weapon = weapon;
      soundEngine.play('menuClick');
      this.spawnFloatingText(this.player.x, this.player.y - 34, WEAPONS[weapon].shortName, WEAPONS[weapon].color, 1);
      this.emitHud();
    }
  }

  public startMenuAmbient(): void {
    this.menuAmbientMode = true;
    this.running = false;
    this.paused = false;
    this.clearEntities();
    soundEngine.setMusicIntensity('menu');
  }

  public startGame(mode: GameMode, challengeModifier: ChallengeModifierId = 'hyper_velocity'): void {
    this.mode = mode;
    this.challengeMod = challengeModifier;
    this.menuAmbientMode = false;
    this.running = true;
    this.paused = false;

    this.clearEntities();

    const shipId = this.saveData.selectedShip;
    const shipCfg = SHIPS[shipId];
    const stats = getComputedShipStats(shipId, this.saveData.upgrades[shipId]);

    let maxHp = stats.health;
    let damage = stats.damage;
    let speed = stats.speed;
    let fireRate = stats.fireRate;

    if (mode === 'challenge') {
      if (challengeModifier === 'glass_cannon') {
        maxHp = Math.max(40, Math.round(maxHp * 0.5));
        damage *= 2;
      } else if (challengeModifier === 'hyper_velocity') {
        speed *= 1.2;
        fireRate *= 1.2;
      }
    }

    this.player = {
      x: this.width / 2,
      y: this.height - 96,
      vx: 0,
      vy: 0,
      tilt: 0,
      radius: 19,
      speed,
      hp: maxHp,
      maxHp,
      shield: stats.shield,
      maxShield: stats.shield,
      shieldRegenDelay: 0,
      damage,
      fireRate,
      critChance: stats.critChance,
      weapon: shipCfg.defaultWeapon,
      weaponLevel: shipId === 'nova' ? 2 : 1,
      fireCooldown: 0,
      invulnTimer: 1.5,
      tripleTimer: 0,
      rapidTimer: 0,
      overdriveTimer: 0,
    };

    this.score = 0;
    this.kills = 0;
    this.runCoins = 0;
    this.bossesDefeated = 0;
    this.wave = 1;
    this.waveKills = 0;
    this.waveQuota = this.calcWaveQuota(1);
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.timeRemaining = mode === 'time_attack' ? 180 : null;
    this.bossRushIndex = 0;
    this.bossRushTotal = BOSS_ORDER.length;
    this.pendingBossWave = 0;
    this.bossSpawnDelay = 0;
    this.spawnTimer = 0.6;
    this.asteroidTimer = 4.5;
    this.shakeTime = 0;
    this.pointerActive = false;

    this.saveData.stats.totalGamesPlayed += 1;
    persistSaveData(this.saveData);
    this.callbacks.onSaveUpdate({ ...this.saveData });

    soundEngine.init();
    soundEngine.startMusic();
    soundEngine.setMusicIntensity('combat');

    const modeMeta = GAME_MODES[mode];
    const subtitle =
      mode === 'challenge'
        ? `${CHALLENGE_MODIFIERS[challengeModifier].name} · Clear Wave 10`
        : modeMeta.tagline;

    this.emitBanner('mission', modeMeta.name.toUpperCase(), subtitle, modeMeta.accentColor);

    if (mode === 'boss_rush') {
      this.triggerBossEncounter(BOSS_ORDER[0], 1);
    }

    this.emitHud();
    this.startLoop();
  }

  public setPaused(paused: boolean): void {
    if (!this.running || this.menuAmbientMode) return;
    this.paused = paused;
    if (!paused) {
      this.lastTimestamp = performance.now();
    }
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.detachListeners();
    this.clearEntities();
    this.bulletPool.clear();
    this.particlePool.clear();
    this.shockwavePool.clear();
    this.textPool.clear();
  }

  private attachListeners(): void {
    window.addEventListener('resize', this.onResizeBound);
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    document.addEventListener('visibilitychange', this.onVisibilityBound);

    this.canvas.addEventListener('mousemove', this.onMouseMoveBound);
    this.canvas.addEventListener('mousedown', this.onMouseDownBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    this.canvas.addEventListener('touchstart', this.onTouchStartBound, { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEndBound);
    this.canvas.addEventListener('touchcancel', this.onTouchEndBound);
  }

  private detachListeners(): void {
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    document.removeEventListener('visibilitychange', this.onVisibilityBound);

    this.canvas.removeEventListener('mousemove', this.onMouseMoveBound);
    this.canvas.removeEventListener('mousedown', this.onMouseDownBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    this.canvas.removeEventListener('touchstart', this.onTouchStartBound);
    this.canvas.removeEventListener('touchmove', this.onTouchMoveBound);
    this.canvas.removeEventListener('touchend', this.onTouchEndBound);
    this.canvas.removeEventListener('touchcancel', this.onTouchEndBound);
  }

  private resize(): void {
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    this.width = Math.max(320, w);
    this.height = Math.max(420, h);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Keep player inside new bounds
    this.player.x = Math.max(24, Math.min(this.width - 24, this.player.x));
    this.player.y = Math.max(48, Math.min(this.height - 24, this.player.y));
  }

  private initBackground(): void {
    this.stars = [];
    const starColors = ['#ffffff', '#bae6fd', '#e9d5ff', '#a5f3fc'];
    for (let i = 0; i < 120; i++) {
      const layer = (i % 3) as 0 | 1 | 2;
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: layer === 0 ? 1 : layer === 1 ? 1.6 : 2.2,
        speed: layer === 0 ? 22 : layer === 1 ? 56 : 115,
        alpha: layer === 0 ? 0.35 : layer === 1 ? 0.6 : 0.85,
        color: starColors[i % starColors.length],
        layer,
      });
    }

    this.nebulae = [
      { x: this.width * 0.25, y: this.height * 0.25, radius: 260, color: 'rgba(0, 243, 255, 0.14)', speed: 12, alpha: 0.55 },
      { x: this.width * 0.78, y: this.height * 0.55, radius: 300, color: 'rgba(189, 0, 255, 0.14)', speed: 16, alpha: 0.5 },
      { x: this.width * 0.45, y: this.height * 0.82, radius: 240, color: 'rgba(255, 0, 128, 0.10)', speed: 10, alpha: 0.45 },
    ];
  }

  private clearEntities(): void {
    for (const b of this.bullets) this.bulletPool.release(b);
    for (const p of this.particles) this.particlePool.release(p);
    for (const s of this.shockwaves) this.shockwavePool.release(s);
    for (const t of this.floatingTexts) this.textPool.release(t);
    this.bullets.length = 0;
    this.particles.length = 0;
    this.shockwaves.length = 0;
    this.floatingTexts.length = 0;
    this.enemies.length = 0;
    this.asteroids.length = 0;
    this.powerups.length = 0;
    this.coins.length = 0;
    this.boss = null;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys[e.code] = true;
    if (!this.running || this.menuAmbientMode) return;

    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      this.callbacks.onPauseRequest();
    } else if (e.code === 'Digit1') {
      this.switchWeapon('laser');
    } else if (e.code === 'Digit2') {
      this.switchWeapon('plasma');
    } else if (e.code === 'Digit3') {
      this.switchWeapon('spread');
    } else if (e.code === 'Digit4') {
      this.switchWeapon('missile');
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.running || this.paused || this.menuAmbientMode) return;
    if (e.buttons === 1 || this.settings.controlScheme === 'touch_drag') {
      const rect = this.canvas.getBoundingClientRect();
      this.pointerX = e.clientX - rect.left;
      this.pointerY = e.clientY - rect.top;
      this.pointerActive = true;
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.running || this.paused || this.menuAmbientMode) return;
    if (e.button === 0) {
      const rect = this.canvas.getBoundingClientRect();
      this.pointerX = e.clientX - rect.left;
      this.pointerY = e.clientY - rect.top;
      this.pointerActive = true;
    }
  }

  private handleTouchMove(e: TouchEvent, isStart: boolean): void {
    if (!this.running || this.paused || this.menuAmbientMode) return;
    // If using virtual joystick mode explicitly and joystick is active, don't override
    if (this.settings.controlScheme === 'joystick' || this.virtualJoystick.active) return;

    if (e.touches.length > 0) {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      this.pointerX = e.touches[0].clientX - rect.left;
      this.pointerY = e.touches[0].clientY - rect.top - (isStart ? 36 : 42);
      this.pointerActive = true;
    }
  }

  private startLoop(): void {
    if (this.rafId !== null) return; // Prevent duplicate loops!
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(0.05, Math.max(0.001, rawDt));

      if (!this.paused) {
        this.elapsedTime += dt;
        this.update(dt);
      }
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private update(dt: number): void {
    this.updateBackground(dt);

    if (this.menuAmbientMode || !this.running) {
      return;
    }

    // Screen Shake decay
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }
    if (this.critFlashTimer > 0) {
      this.critFlashTimer = Math.max(0, this.critFlashTimer - dt);
    }

    // Time Attack Countdown
    if (this.mode === 'time_attack' && this.timeRemaining !== null) {
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
      if (this.timeRemaining <= 0) {
        this.finishRun(true);
        return;
      }
    }

    // Combo Decay
    if (this.combo > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.comboTimer = 0;
      }
    }

    // Update Player
    this.updatePlayer(dt);

    // Boss Spawn Delay
    if (this.pendingBossWave > 0) {
      this.bossSpawnDelay -= dt;
      if (this.bossSpawnDelay <= 0) {
        const idx = Math.floor((this.pendingBossWave / 5 - 1)) % BOSS_ORDER.length;
        this.triggerBossEncounter(BOSS_ORDER[idx], this.pendingBossWave);
        this.pendingBossWave = 0;
      }
    }

    // Spawning Enemies & Asteroids
    if (!this.boss && this.pendingBossWave === 0 && this.mode !== 'boss_rush') {
      this.updateSpawning(dt);
    }

    // Update Entities
    this.updateBullets(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateAsteroids(dt);
    this.updatePowerUps(dt);
    this.updateCoins(dt);
    this.updateParticles(dt);

    // Throttled HUD update (~20Hz)
    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.05) {
      this.hudSyncTimer = 0;
      this.emitHud();
    }
  }

  private updateBackground(dt: number): void {
    const speedFactor = this.menuAmbientMode ? 0.5 : 1 + (this.wave - 1) * 0.07;
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.y += s.speed * speedFactor * dt;
      if (s.y > this.height + 6) {
        s.y = -4;
        s.x = Math.random() * this.width;
      }
    }

    for (let i = 0; i < this.nebulae.length; i++) {
      const n = this.nebulae[i];
      n.y += n.speed * dt;
      if (n.y - n.radius > this.height) {
        n.y = -n.radius;
        n.x = Math.random() * this.width;
      }
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    let moveX = 0;
    let moveY = 0;

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveX -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) moveX += 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) moveY -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) moveY += 1;

    if (moveX !== 0 || moveY !== 0) {
      this.pointerActive = false;
      const len = Math.hypot(moveX, moveY);
      moveX /= len;
      moveY /= len;
      p.vx = moveX * p.speed;
      p.vy = moveY * p.speed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    } else if (this.virtualJoystick.active) {
      p.vx = this.virtualJoystick.dx * p.speed;
      p.vy = this.virtualJoystick.dy * p.speed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    } else if (this.pointerActive) {
      const dx = this.pointerX - p.x;
      const dy = this.pointerY - p.y;
      const lerpFactor = Math.min(1, dt * 13);
      p.vx = (dx * lerpFactor) / dt;
      p.vy = (dy * lerpFactor) / dt;
      p.x += dx * lerpFactor;
      p.y += dy * lerpFactor;
    } else {
      p.vx *= 0.8;
      p.vy *= 0.8;
    }

    // Clamp inside playfield
    p.x = Math.max(p.radius + 10, Math.min(this.width - p.radius - 10, p.x));
    p.y = Math.max(54, Math.min(this.height - p.radius - 12, p.y));

    // Smooth banking tilt
    const targetTilt = Math.max(-1, Math.min(1, p.vx / p.speed));
    p.tilt += (targetTilt - p.tilt) * Math.min(1, dt * 12);

    // Timers
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.tripleTimer > 0) p.tripleTimer = Math.max(0, p.tripleTimer - dt);
    if (p.rapidTimer > 0) p.rapidTimer = Math.max(0, p.rapidTimer - dt);
    if (p.overdriveTimer > 0) p.overdriveTimer = Math.max(0, p.overdriveTimer - dt);

    // Shield Regeneration
    if (p.shieldRegenDelay > 0) {
      p.shieldRegenDelay = Math.max(0, p.shieldRegenDelay - dt);
    } else if (p.shield < p.maxShield) {
      const regenRate = this.saveData.selectedShip === 'titan' ? 4.2 : 2.5;
      p.shield = Math.min(p.maxShield, p.shield + regenRate * dt);
    }

    // Firing
    if (p.fireCooldown > 0) p.fireCooldown -= dt;
    const wantsToFire =
      this.settings.autoFire ||
      this.keys['Space'] ||
      this.pointerActive ||
      this.touchFireActive ||
      this.virtualJoystick.active;

    if (wantsToFire && p.fireCooldown <= 0) {
      this.firePlayerWeapon();
    }

    // Thruster Exhaust Particles
    if (Math.random() < (this.settings.highQualityParticles ? 0.65 : 0.35)) {
      const cfg = SHIPS[this.saveData.selectedShip];
      this.spawnParticle(
        p.x + (Math.random() - 0.5) * 10,
        p.y + 19,
        (Math.random() - 0.5) * 28,
        85 + Math.random() * 65,
        1.6 + Math.random() * 1.4,
        cfg.engineColor,
        2.6,
        'circle'
      );
    }
  }

  private firePlayerWeapon(): void {
    const p = this.player;
    const rapidMult = p.rapidTimer > 0 ? 1.55 : 1;
    const levelFireBonus = 1 + (p.weaponLevel - 1) * 0.08;
    const effectiveRate = p.fireRate * rapidMult * levelFireBonus;
    p.fireCooldown = 1 / effectiveRate;

    const isCrit = Math.random() < p.critChance;
    const dmgScale = (1 + (p.weaponLevel - 1) * 0.24) * (isCrit ? 2.0 : 1.0);
    const baseDmg = p.damage * dmgScale;

    const tripleActive = p.tripleTimer > 0;
    const lvl = p.weaponLevel;

    if (p.weapon === 'laser') {
      soundEngine.play('laser');
      const color = '#00f3ff';
      const speed = -780;
      const count = tripleActive ? Math.max(3, lvl >= 3 ? 5 : 3) : lvl >= 4 ? 3 : lvl >= 2 ? 2 : 1;

      if (count === 1) {
        this.spawnBullet(true, 'laser', p.x, p.y - 24, 0, speed, 4, baseDmg, color, isCrit);
      } else if (count === 2) {
        this.spawnBullet(true, 'laser', p.x - 10, p.y - 18, 0, speed, 4, baseDmg * 0.85, color, isCrit);
        this.spawnBullet(true, 'laser', p.x + 10, p.y - 18, 0, speed, 4, baseDmg * 0.85, color, isCrit);
      } else {
        this.spawnBullet(true, 'laser', p.x, p.y - 24, 0, speed, 4.5, baseDmg * 0.85, color, isCrit);
        const spreadVx = tripleActive ? 140 : 80;
        this.spawnBullet(true, 'laser', p.x - 12, p.y - 16, -spreadVx, speed * 0.96, 4, baseDmg * 0.72, '#bd00ff', isCrit);
        this.spawnBullet(true, 'laser', p.x + 12, p.y - 16, spreadVx, speed * 0.96, 4, baseDmg * 0.72, '#bd00ff', isCrit);
        if (count === 5) {
          this.spawnBullet(true, 'laser', p.x - 18, p.y - 10, -250, speed * 0.92, 3.8, baseDmg * 0.65, color, isCrit);
          this.spawnBullet(true, 'laser', p.x + 18, p.y - 10, 250, speed * 0.92, 3.8, baseDmg * 0.65, color, isCrit);
        }
      }
    } else if (p.weapon === 'plasma') {
      soundEngine.play('plasma');
      p.fireCooldown *= 1.32;
      const splash = 46 + lvl * 10;
      const plasmaDmg = baseDmg * 1.48;
      if (tripleActive || lvl >= 4) {
        this.spawnBullet(true, 'plasma', p.x, p.y - 24, 0, -560, 8, plasmaDmg, '#bd00ff', isCrit, splash);
        this.spawnBullet(true, 'plasma', p.x - 14, p.y - 16, -95, -540, 6.5, plasmaDmg * 0.75, '#e879f9', isCrit, splash * 0.8);
        this.spawnBullet(true, 'plasma', p.x + 14, p.y - 16, 95, -540, 6.5, plasmaDmg * 0.75, '#e879f9', isCrit, splash * 0.8);
      } else {
        this.spawnBullet(true, 'plasma', p.x, p.y - 24, 0, -560, 8.5, plasmaDmg, '#bd00ff', isCrit, splash);
      }
    } else if (p.weapon === 'spread') {
      soundEngine.play('spread');
      const pellets = tripleActive ? 7 : Math.min(7, 3 + Math.floor(lvl / 2) * 2);
      const maxAngle = tripleActive ? 0.56 : 0.42;
      for (let i = 0; i < pellets; i++) {
        const t = pellets === 1 ? 0 : (i / (pellets - 1)) * 2 - 1;
        const angle = -Math.PI / 2 + t * maxAngle;
        const spd = 710;
        this.spawnBullet(
          true,
          'spread',
          p.x + t * 10,
          p.y - 18,
          Math.cos(angle) * spd,
          Math.sin(angle) * spd,
          4,
          baseDmg * 0.62,
          '#ff0088',
          isCrit
        );
      }
    } else {
      // Missile
      soundEngine.play('missile');
      p.fireCooldown *= 1.25;
      const count = tripleActive ? 4 : Math.min(4, 1 + Math.floor(lvl / 2));
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 16;
        this.spawnBullet(
          true,
          'missile',
          p.x + offset,
          p.y - 16,
          offset * 4,
          -440,
          5.5,
          baseDmg * 1.15,
          '#fbbf24',
          isCrit,
          36,
          true
        );
      }
    }
  }

  private calcWaveQuota(wave: number): number {
    if (this.mode === 'time_attack') return 14 + wave * 3;
    return 10 + wave * 4;
  }

  private updateSpawning(dt: number): void {
    const isBulletStorm = this.mode === 'challenge' && this.challengeMod === 'bullet_storm';
    const isHyper = this.mode === 'challenge' && this.challengeMod === 'hyper_velocity';
    const modeDensity =
      this.mode === 'time_attack' ? 0.68 : isBulletStorm ? 0.65 : this.mode === 'survival' ? 0.85 : 1.0;

    const baseInterval = Math.max(0.36, (1.15 - this.wave * 0.048) * modeDensity);
    this.spawnTimer -= dt;

    if (this.spawnTimer <= 0) {
      this.spawnTimer = baseInterval * (0.75 + Math.random() * 0.5);
      this.spawnWaveEnemy(isHyper ? 1.4 : 1.0);
    }

    // Asteroid belt hazard/loot in waves >= 2
    if (this.wave >= 2) {
      this.asteroidTimer -= dt;
      if (this.asteroidTimer <= 0) {
        this.asteroidTimer = Math.max(3.2, 7.5 - this.wave * 0.25);
        this.spawnAsteroid();
      }
    }
  }

  private spawnWaveEnemy(speedMult: number): void {
    const r = Math.random();
    let type: EnemyType = 'basic';
    if (this.wave >= 4 && r > 0.88) type = 'carrier';
    else if (this.wave >= 3 && r > 0.74) type = 'sniper';
    else if (this.wave >= 2 && r > 0.60) type = 'kamikaze';
    else if (r > 0.44) type = 'tank';
    else if (r > 0.24) type = 'fast';

    const waveHpScale = 1 + (this.wave - 1) * (this.mode === 'survival' ? 0.24 : 0.17);
    const waveSpdScale = (1 + (this.wave - 1) * 0.045) * speedMult;

    let radius = 20;
    let baseHp = 22;
    let vy = 130;
    let vx = 0;
    let color = '#ff0055';
    let scoreValue = 110;
    let coinValue = 2;

    if (type === 'fast') {
      radius = 16;
      baseHp = 14;
      vy = 215;
      vx = (Math.random() < 0.5 ? -1 : 1) * 110;
      color = '#fbbf24';
      scoreValue = 140;
      coinValue = 3;
    } else if (type === 'tank') {
      radius = 27;
      baseHp = 64;
      vy = 78;
      color = '#bd00ff';
      scoreValue = 260;
      coinValue = 5;
    } else if (type === 'sniper') {
      radius = 21;
      baseHp = 32;
      vy = 95;
      color = '#f43f5e';
      scoreValue = 220;
      coinValue = 4;
    } else if (type === 'kamikaze') {
      radius = 18;
      baseHp = 18;
      vy = 160;
      color = '#fb7185';
      scoreValue = 180;
      coinValue = 3;
    } else if (type === 'carrier') {
      radius = 32;
      baseHp = 105;
      vy = 58;
      color = '#38bdf8';
      scoreValue = 400;
      coinValue = 8;
    }

    const x = radius + 16 + Math.random() * Math.max(40, this.width - (radius + 16) * 2);

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      x,
      y: -radius - 15,
      vx: vx * waveSpdScale,
      vy: vy * waveSpdScale,
      radius,
      hp: Math.round(baseHp * waveHpScale),
      maxHp: Math.round(baseHp * waveHpScale),
      color,
      angle: 0,
      age: 0,
      fireTimer: 0.9 + Math.random() * 1.4,
      telegraphTimer: 0,
      telegraphTargetX: this.player.x,
      telegraphTargetY: this.player.y,
      hitFlash: 0,
      scoreValue,
      coinValue,
    });
  }

  private spawnAsteroid(): void {
    const radius = 22 + Math.random() * 18;
    const vertices: number[] = [];
    const sides = 9;
    for (let i = 0; i < sides; i++) {
      vertices.push(0.74 + Math.random() * 0.42);
    }
    const hp = Math.round((30 + this.wave * 8) * (radius / 26));
    this.asteroids.push({
      x: radius + Math.random() * (this.width - radius * 2),
      y: -radius - 10,
      vx: (Math.random() - 0.5) * 48,
      vy: 75 + Math.random() * 55,
      radius,
      hp,
      maxHp: hp,
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 1.8,
      vertices,
      hitFlash: 0,
    });
  }

  private triggerBossEncounter(archetype: BossArchetype, waveNum: number): void {
    const meta = BOSS_META[archetype];
    const scale = 1 + Math.max(0, waveNum - 5) * 0.08 + (this.mode === 'boss_rush' ? this.bossRushIndex * 0.25 : 0);
    const maxHp = Math.round(meta.baseHp * scale);

    this.boss = {
      archetype,
      name: meta.name,
      subtitle: meta.subtitle,
      x: this.width / 2,
      y: -meta.radius - 30,
      targetY: 122,
      vx: 115,
      radius: meta.radius,
      hp: maxHp,
      maxHp,
      phase: 1,
      maxPhases: archetype === 'omega_singularity' ? 3 : 2,
      color: meta.color,
      secondaryColor: meta.secondary,
      entering: true,
      enterProgress: 0,
      age: 0,
      attackTimer: 1.4,
      patternIndex: 0,
      subBurstCount: 0,
      subBurstTimer: 0,
      spiralAngle: 0,
      telegraphTimer: 0,
      laserSweepAngle: 0,
      hitFlash: 0,
      scoreValue: 2500 + waveNum * 450,
      coinValue: 45 + waveNum * 6,
    };

    soundEngine.play('bossWarning');
    soundEngine.setMusicIntensity('boss');
    this.triggerShake(0.55, 7);
    this.emitBanner('boss_warning', `WARNING // ${meta.name}`, meta.subtitle, meta.color);
    this.emitHud();
  }

  private updateBullets(dt: number): void {
    const hyperFactor = this.mode === 'challenge' && this.challengeMod === 'hyper_velocity' ? 1.35 : 1.0;

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life += dt;

      // Homing missile tracking
      if (b.fromPlayer && b.homing) {
        let targetX = b.x;
        let targetY = -100;
        let minDist = Infinity;

        if (this.boss && !this.boss.entering) {
          minDist = Math.hypot(this.boss.x - b.x, this.boss.y - b.y);
          targetX = this.boss.x;
          targetY = this.boss.y;
        }
        for (let k = 0; k < this.enemies.length; k++) {
          const e = this.enemies[k];
          const d = Math.hypot(e.x - b.x, e.y - b.y);
          if (d < minDist) {
            minDist = d;
            targetX = e.x;
            targetY = e.y;
          }
        }

        if (minDist < Infinity) {
          const desiredAngle = Math.atan2(targetY - b.y, targetX - b.x);
          const speed = Math.hypot(b.vx, b.vy) || 460;
          const currentAngle = Math.atan2(b.vy, b.vx);
          let diff = desiredAngle - currentAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const newAngle = currentAngle + Math.max(-7.5 * dt, Math.min(7.5 * dt, diff));
          b.vx = Math.cos(newAngle) * speed;
          b.vy = Math.sin(newAngle) * speed;
        }

        if (Math.random() < 0.45) {
          this.spawnParticle(b.x, b.y, 0, 40, 1.8, '#fbbf24', 3.5, 'circle');
        }
      }

      const spdMult = b.fromPlayer ? 1 : hyperFactor;
      b.x += b.vx * spdMult * dt;
      b.y += b.vy * spdMult * dt;

      if (
        b.life >= b.maxLife ||
        b.x < -40 ||
        b.x > this.width + 40 ||
        b.y < -40 ||
        b.y > this.height + 40
      ) {
        this.bulletPool.release(b);
        this.bullets.splice(i, 1);
        continue;
      }

      // Enemy bullet hitting player
      if (!b.fromPlayer) {
        const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
        if (dist < b.radius + this.player.radius - 4) {
          this.createExplosion(b.x, b.y, b.color, 7);
          this.bulletPool.release(b);
          this.bullets.splice(i, 1);
          this.damagePlayer(b.damage);
        }
      }
    }
  }

  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.age += dt;
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);

      // Movement patterns
      if (e.type === 'fast') {
        e.x += Math.sin(e.age * 4.5) * 180 * dt + e.vx * dt;
        e.y += e.vy * dt;
      } else if (e.type === 'kamikaze') {
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const len = Math.hypot(dx, dy) || 1;
        e.vx += (dx / len) * 240 * dt;
        e.vy += (dy / len) * 200 * dt;
        const maxSpd = 300;
        const curSpd = Math.hypot(e.vx, e.vy);
        if (curSpd > maxSpd) {
          e.vx = (e.vx / curSpd) * maxSpd;
          e.vy = (e.vy / curSpd) * maxSpd;
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      } else if (e.type === 'sniper') {
        if (e.y < 150) {
          e.y += e.vy * dt;
        } else {
          e.y += 18 * dt;
          e.x += Math.sin(e.age * 1.8) * 55 * dt;
        }
      } else {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      }

      if (e.x < e.radius + 8) {
        e.x = e.radius + 8;
        e.vx = Math.abs(e.vx);
      } else if (e.x > this.width - e.radius - 8) {
        e.x = this.width - e.radius - 8;
        e.vx = -Math.abs(e.vx);
      }
      e.angle += dt * 1.6;

      // Enemy Firing AI
      e.fireTimer -= dt;
      if (e.type === 'sniper' && e.telegraphTimer > 0) {
        e.telegraphTimer -= dt;
        if (e.telegraphTimer <= 0) {
          const dx = e.telegraphTargetX - e.x;
          const dy = e.telegraphTargetY - e.y;
          const len = Math.hypot(dx, dy) || 1;
          this.spawnBullet(false, 'enemy_lance', e.x, e.y + 12, (dx / len) * 520, (dy / len) * 520, 4.5, 22, '#f43f5e', false);
        }
      } else if (e.fireTimer <= 0 && e.y > 24 && e.y < this.height * 0.72) {
        if (e.type === 'basic') {
          e.fireTimer = Math.max(1.2, 2.5 - this.wave * 0.06);
          this.spawnBullet(false, 'enemy_orb', e.x, e.y + e.radius, 0, 260, 5, 14, '#ff0055', false);
        } else if (e.type === 'tank') {
          e.fireTimer = Math.max(1.5, 2.8 - this.wave * 0.05);
          for (const spreadAngle of [-0.28, 0, 0.28]) {
            const a = Math.PI / 2 + spreadAngle;
            this.spawnBullet(
              false,
              'enemy_orb',
              e.x,
              e.y + e.radius,
              Math.cos(a) * 235,
              Math.sin(a) * 235,
              5.5,
              16,
              '#bd00ff',
              false
            );
          }
        } else if (e.type === 'sniper') {
          e.fireTimer = 2.6;
          e.telegraphTimer = 0.75;
          e.telegraphTargetX = this.player.x;
          e.telegraphTargetY = this.player.y;
        } else if (e.type === 'carrier') {
          e.fireTimer = 3.1;
          for (let k = 0; k < 6; k++) {
            const a = (k * Math.PI) / 3 + e.age;
            this.spawnBullet(
              false,
              'enemy_orb',
              e.x,
              e.y,
              Math.cos(a) * 190,
              Math.sin(a) * 190,
              5,
              14,
              '#38bdf8',
              false
            );
          }
        }
      }

      // Check Player Bullets hitting Enemy
      let destroyed = false;
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (!b.fromPlayer) continue;

        const dist = Math.hypot(e.x - b.x, e.y - b.y);
        if (dist < e.radius + b.radius) {
          this.shotsHit++;
          const hitDmg = b.damage;
          const splash = b.splashRadius;
          const bx = b.x;
          const by = b.y;
          const isCrit = b.isCrit;

          this.bulletPool.release(b);
          this.bullets.splice(j, 1);

          e.hp -= hitDmg;
          e.hitFlash = 0.09;
          this.createExplosion(bx, by, e.color, 5);

          if (isCrit) {
            this.critFlashTimer = 0.14;
            this.saveData.stats.totalCrits += 1;
            soundEngine.play('crit');
            this.spawnFloatingText(e.x, e.y - e.radius, `CRIT ${Math.round(hitDmg)}!`, '#fef08a', 1.15);
          } else {
            soundEngine.play('hit');
          }

          if (splash > 0) {
            this.applySplashDamage(bx, by, splash, hitDmg * 0.55, e.id);
          }

          if (e.hp <= 0) {
            this.handleEnemyDestroyed(e, i);
            destroyed = true;
            break;
          }
        }
      }

      if (destroyed) continue;

      // Player Collision
      const distPlayer = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (distPlayer < e.radius + this.player.radius - 4) {
        this.createExplosion(e.x, e.y, e.color, 22);
        this.spawnShockwave(e.x, e.y, e.radius * 2.2, e.color);
        this.enemies.splice(i, 1);
        this.damagePlayer(26);
        continue;
      }

      if (e.y > this.height + 50) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private applySplashDamage(x: number, y: number, radius: number, dmg: number, excludeEnemyId: number): void {
    this.spawnShockwave(x, y, radius, '#bd00ff');
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.id === excludeEnemyId) continue;
      if (Math.hypot(e.x - x, e.y - y) <= radius + e.radius) {
        e.hp -= dmg;
        e.hitFlash = 0.08;
        if (e.hp <= 0) {
          this.handleEnemyDestroyed(e, i);
        }
      }
    }
    if (this.boss && !this.boss.entering && Math.hypot(this.boss.x - x, this.boss.y - y) <= radius + this.boss.radius) {
      this.boss.hp -= dmg;
      this.boss.hitFlash = 0.06;
    }
  }

  private handleEnemyDestroyed(e: EnemyEntity, index: number): void {
    soundEngine.play('explosion');
    this.createExplosion(e.x, e.y, e.color, this.settings.highQualityParticles ? 26 : 14);
    this.spawnShockwave(e.x, e.y, e.radius * 2.4, e.color);
    this.enemies.splice(index, 1);

    this.kills += 1;
    this.waveKills += 1;
    this.saveData.stats.totalKills += 1;

    // Combo progression
    const comboStep = this.mode === 'time_attack' ? 1.5 : 1;
    this.combo = Math.min(8, Number((this.combo + 0.25 * comboStep).toFixed(2)));
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.comboTimer = this.comboDuration;
    if (Math.floor(this.combo * 4) > this.saveData.stats.highestCombo) {
      this.saveData.stats.highestCombo = Math.max(this.saveData.stats.highestCombo, this.kills);
    }

    const shipBonus = this.saveData.selectedShip === 'striker' ? 1.15 : 1.0;
    const gained = Math.round(e.scoreValue * this.combo * shipBonus);
    this.score += gained;
    this.spawnFloatingText(e.x, e.y - 12, `+${gained}`, '#ffffff', 0.95);

    // Coin drop
    this.spawnCoins(e.x, e.y, e.coinValue);

    // Power-up drop chance
    const dropRate = this.mode === 'challenge' && this.challengeMod === 'bullet_storm' ? 0.24 : 0.16;
    if (Math.random() < dropRate) {
      this.spawnPowerUp(e.x, e.y);
    }

    // Check Wave Progression
    if (this.waveKills >= this.waveQuota) {
      this.advanceWave();
    }

    this.checkAchievements();
  }

  private advanceWave(): void {
    this.wave += 1;
    this.waveKills = 0;
    this.waveQuota = this.calcWaveQuota(this.wave);

    if (this.wave > this.saveData.stats.highestWave) {
      this.saveData.stats.highestWave = this.wave;
    }

    // Boss Check every 5 waves (except Time Attack)
    if (this.mode !== 'time_attack' && this.wave % 5 === 0) {
      this.pendingBossWave = this.wave;
      this.bossSpawnDelay = 1.6;
    } else {
      this.emitBanner('wave', `WAVE ${String(this.wave).padStart(2, '0')}`, 'Hostile Squadron Approaching', '#00f3ff');
      soundEngine.play('powerup');
    }

    this.checkAchievements();
  }

  private updateBoss(dt: number): void {
    const b = this.boss;
    if (!b) return;

    b.age += dt;
    if (b.hitFlash > 0) b.hitFlash = Math.max(0, b.hitFlash - dt);

    // Entrance glide
    if (b.entering) {
      b.y += (b.targetY - b.y) * Math.min(1, dt * 3.5);
      if (Math.abs(b.y - b.targetY) < 2) {
        b.y = b.targetY;
        b.entering = false;
      }
      return;
    }

    // Horizontal patrol + subtle vertical bob
    b.x += b.vx * (b.phase >= 2 ? 1.35 : 1) * dt;
    if (b.x < b.radius + 26) {
      b.x = b.radius + 26;
      b.vx = Math.abs(b.vx);
    } else if (b.x > this.width - b.radius - 26) {
      b.x = this.width - b.radius - 26;
      b.vx = -Math.abs(b.vx);
    }
    b.y = b.targetY + Math.sin(b.age * 1.9) * 14;

    // Phase transitions
    const hpRatio = b.hp / b.maxHp;
    if (b.phase === 1 && hpRatio <= 0.55) {
      b.phase = 2;
      this.triggerShake(0.45, 9);
      this.spawnShockwave(b.x, b.y, b.radius * 3.5, b.secondaryColor);
      this.emitBanner('boss_warning', `${b.name} // PHASE 2`, 'Overdrive Weapons Engaged', b.secondaryColor);
      soundEngine.play('bossWarning');
    } else if (b.maxPhases === 3 && b.phase === 2 && hpRatio <= 0.28) {
      b.phase = 3;
      this.triggerShake(0.55, 11);
      this.spawnShockwave(b.x, b.y, b.radius * 4.2, '#ffffff');
      this.emitBanner('boss_warning', `${b.name} // FINAL PHASE`, 'Critical Singularity Storm', '#f43f5e');
      soundEngine.play('bossWarning');
    }

    // Boss Telegraph Sweep Laser
    if (b.telegraphTimer > 0) {
      b.telegraphTimer -= dt;
      b.laserSweepAngle += dt * (b.phase >= 2 ? 0.55 : 0.35);
      if (b.telegraphTimer <= 0.25 && b.telegraphTimer > 0) {
        // Check player line intersection during active beam window
        const beamDx = Math.sin(-b.laserSweepAngle);
        const beamDy = Math.cos(-b.laserSweepAngle);
        const px = this.player.x - b.x;
        const py = this.player.y - b.y;
        const proj = px * beamDx + py * beamDy;
        if (proj > 0) {
          const perp = Math.abs(px * beamDy - py * beamDx);
          if (perp < this.player.radius + 6) {
            this.damagePlayer(18);
          }
        }
      }
    }

    // Attack Patterns
    if (b.subBurstCount > 0) {
      b.subBurstTimer -= dt;
      if (b.subBurstTimer <= 0) {
        b.subBurstTimer = 0.14;
        b.subBurstCount--;
        b.spiralAngle += 0.36;
        const arms = b.phase >= 2 ? 4 : 2;
        for (let a = 0; a < arms; a++) {
          const ang = b.spiralAngle + (a * Math.PI * 2) / arms;
          this.spawnBullet(
            false,
            'enemy_orb',
            b.x,
            b.y,
            Math.cos(ang) * 235,
            Math.sin(ang) * 235,
            6,
            16,
            b.secondaryColor,
            false
          );
        }
      }
    } else {
      b.attackTimer -= dt;
      if (b.attackTimer <= 0) {
        b.patternIndex = (b.patternIndex + 1) % 4;
        b.attackTimer = b.phase >= 2 ? 1.35 : 1.85;
        soundEngine.play('bossAttack');

        if (b.patternIndex === 0) {
          // Aimed Fan Volley
          const baseAngle = Math.atan2(this.player.y - b.y, this.player.x - b.x);
          const count = b.phase >= 2 ? 7 : 5;
          for (let k = 0; k < count; k++) {
            const offset = (k - (count - 1) / 2) * 0.17;
            const ang = baseAngle + offset;
            this.spawnBullet(
              false,
              'enemy_orb',
              b.x,
              b.y + b.radius * 0.5,
              Math.cos(ang) * 290,
              Math.sin(ang) * 290,
              6,
              16,
              b.color,
              false
            );
          }
        } else if (b.patternIndex === 1) {
          // Spiral Barrage
          b.subBurstCount = b.phase >= 2 ? 9 : 6;
          b.subBurstTimer = 0.05;
        } else if (b.patternIndex === 2) {
          // Radial Shock Ring + Twin Escort Drones
          const ringCount = b.phase >= 2 ? 14 : 10;
          for (let k = 0; k < ringCount; k++) {
            const ang = (k * Math.PI * 2) / ringCount + b.age;
            this.spawnBullet(
              false,
              'enemy_orb',
              b.x,
              b.y,
              Math.cos(ang) * 220,
              Math.sin(ang) * 220,
              5.5,
              15,
              b.secondaryColor,
              false
            );
          }
          if (this.enemies.length < 4 && b.phase >= 2) {
            this.spawnWaveEnemy(1.0);
          }
        } else {
          // Sweeping Laser Telegraph
          b.telegraphTimer = 1.1;
          b.laserSweepAngle = -0.35;
        }
      }
    }

    // Player bullets hitting Boss
    for (let j = this.bullets.length - 1; j >= 0; j--) {
      const blt = this.bullets[j];
      if (!blt.fromPlayer) continue;
      if (Math.hypot(blt.x - b.x, blt.y - b.y) < b.radius + blt.radius) {
        this.shotsHit++;
        const dmg = blt.damage;
        const isCrit = blt.isCrit;
        const bx = blt.x;
        const by = blt.y;
        this.bulletPool.release(blt);
        this.bullets.splice(j, 1);

        b.hp -= dmg;
        b.hitFlash = 0.05;
        this.createExplosion(bx, by, b.color, 5);

        if (isCrit) {
          this.critFlashTimer = 0.12;
          this.saveData.stats.totalCrits += 1;
          soundEngine.play('crit');
          this.spawnFloatingText(bx, by - 10, `CRIT ${Math.round(dmg)}!`, '#fef08a', 1.1);
        }

        if (b.hp <= 0) {
          this.handleBossDefeated(b);
          return;
        }
      }
    }

    // Boss colliding directly with Player
    if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < b.radius + this.player.radius - 6) {
      this.damagePlayer(32);
    }
  }

  private handleBossDefeated(b: BossEntity): void {
    soundEngine.play('bossExplosion');
    soundEngine.setMusicIntensity('combat');
    this.triggerShake(0.85, 14);
    this.createExplosion(b.x, b.y, b.color, 55);
    this.createExplosion(b.x, b.y, b.secondaryColor, 40);
    this.spawnShockwave(b.x, b.y, b.radius * 4.5, '#ffffff');
    this.spawnShockwave(b.x, b.y, b.radius * 3.2, b.color);

    // Clear active enemy bullets cleanly for cinematic victory moment
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      if (!this.bullets[i].fromPlayer) {
        this.bulletPool.release(this.bullets[i]);
        this.bullets.splice(i, 1);
      }
    }

    this.bossesDefeated += 1;
    this.saveData.stats.totalBossesDefeated += 1;

    const bonusScore = Math.round(b.scoreValue * this.combo);
    this.score += bonusScore;
    this.spawnFloatingText(b.x, b.y, `+${bonusScore} BOSS CLEAR!`, '#fbbf24', 1.35);

    // Shower coins and power-ups
    this.spawnCoins(b.x, b.y, b.coinValue);
    this.spawnPowerUp(b.x - 28, b.y, 'weapon_up');
    if (this.mode !== 'survival') {
      this.spawnPowerUp(b.x + 28, b.y, 'health');
    }

    this.boss = null;
    this.checkAchievements();

    // Check Victory Conditions
    if (this.mode === 'classic' && this.wave >= 15) {
      this.finishRun(true);
      return;
    }
    if (this.mode === 'challenge' && this.wave >= 10) {
      this.finishRun(true);
      return;
    }
    if (this.mode === 'boss_rush') {
      this.bossRushIndex += 1;
      if (this.bossRushIndex >= this.bossRushTotal) {
        this.finishRun(true);
        return;
      }
      // Inter-boss recharge & next boss
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
      this.player.shield = this.player.maxShield;
      this.player.weaponLevel = Math.min(5, this.player.weaponLevel + 1);
      this.wave += 1;
      this.emitBanner(
        'mission',
        `DREADNOUGHT ${this.bossRushIndex}/${this.bossRushTotal} CLEARED`,
        'Hull Repaired · Weapon Upgraded',
        '#10b981'
      );
      this.triggerBossEncounter(BOSS_ORDER[this.bossRushIndex], this.bossRushIndex * 5 + 5);
      return;
    }

    this.emitBanner('victory_pulse', `${b.name} DESTROYED`, `+${bonusScore} PTS · +${b.coinValue} CREDITS`, '#10b981');
  }

  private updateAsteroids(dt: number): void {
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.angle += a.vRot * dt;
      if (a.hitFlash > 0) a.hitFlash = Math.max(0, a.hitFlash - dt);

      // Bullets hitting asteroid
      let destroyed = false;
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (!b.fromPlayer) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius) {
          this.bulletPool.release(b);
          this.bullets.splice(j, 1);
          a.hp -= b.damage;
          a.hitFlash = 0.08;
          this.createExplosion(b.x, b.y, '#94a3b8', 4);
          if (a.hp <= 0) {
            soundEngine.play('explosion');
            this.createExplosion(a.x, a.y, '#94a3b8', 18);
            this.score += 120;
            this.spawnCoins(a.x, a.y, 4);
            this.asteroids.splice(i, 1);
            destroyed = true;
            break;
          }
        }
      }
      if (destroyed) continue;

      if (Math.hypot(a.x - this.player.x, a.y - this.player.y) < a.radius + this.player.radius - 5) {
        this.createExplosion(a.x, a.y, '#94a3b8', 18);
        this.asteroids.splice(i, 1);
        this.damagePlayer(20);
        continue;
      }

      if (a.y > this.height + 60) {
        this.asteroids.splice(i, 1);
      }
    }
  }

  private updatePowerUps(dt: number): void {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.y += pu.vy * dt;

      if (Math.hypot(pu.x - this.player.x, pu.y - this.player.y) < pu.radius + this.player.radius + 4) {
        this.applyPowerUp(pu);
        this.powerups.splice(i, 1);
        continue;
      }

      if (pu.y > this.height + 40) {
        this.powerups.splice(i, 1);
      }
    }
  }

  private applyPowerUp(pu: PowerUpEntity): void {
    soundEngine.play('powerup');
    const p = this.player;
    this.score += 200;

    switch (pu.type) {
      case 'triple':
        p.tripleTimer = 9.0;
        this.spawnFloatingText(p.x, p.y - 30, 'TRIPLE SHOT!', '#00f3ff', 1.1);
        break;
      case 'rapid':
        p.rapidTimer = 8.5;
        this.spawnFloatingText(p.x, p.y - 30, 'RAPID OVERCLOCK!', '#fbbf24', 1.1);
        break;
      case 'shield':
        p.shield = Math.min(p.maxShield, p.shield + Math.max(30, p.maxShield * 0.6));
        this.spawnFloatingText(p.x, p.y - 30, 'SHIELD CHARGED!', '#10b981', 1.1);
        break;
      case 'health':
        p.hp = Math.min(p.maxHp, p.hp + 35);
        this.spawnFloatingText(p.x, p.y - 30, '+35 HULL REPAIR', '#f43f5e', 1.1);
        break;
      case 'weapon_up':
        p.weaponLevel = Math.min(5, p.weaponLevel + 1);
        this.spawnFloatingText(p.x, p.y - 30, `WEAPON LV.${p.weaponLevel}!`, '#bd00ff', 1.15);
        if (p.weaponLevel >= 5) {
          this.checkAchievements();
        }
        break;
      case 'weapon_laser':
        p.weapon = 'laser';
        this.spawnFloatingText(p.x, p.y - 30, 'PULSE LASER', '#00f3ff', 1.05);
        break;
      case 'weapon_plasma':
        p.weapon = 'plasma';
        this.spawnFloatingText(p.x, p.y - 30, 'HEAVY PLASMA', '#bd00ff', 1.05);
        break;
      case 'weapon_spread':
        p.weapon = 'spread';
        this.spawnFloatingText(p.x, p.y - 30, 'PRISM SPREAD', '#ff0088', 1.05);
        break;
      case 'weapon_missile':
        p.weapon = 'missile';
        this.spawnFloatingText(p.x, p.y - 30, 'HOMING MISSILES', '#fbbf24', 1.05);
        break;
    }
    this.emitHud();
  }

  private updateCoins(dt: number): void {
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.age += dt;
      c.vy += 120 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vx *= 0.96;

      // Magnetic attraction when near player
      const dx = this.player.x - c.x;
      const dy = this.player.y - c.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 130) {
        const pull = (1 - dist / 130) * 520;
        c.x += (dx / (dist || 1)) * pull * dt;
        c.y += (dy / (dist || 1)) * pull * dt;
      }

      if (dist < c.radius + this.player.radius + 6) {
        this.runCoins += c.value;
        this.coins.splice(i, 1);
        continue;
      }

      if (c.y > this.height + 40) {
        this.coins.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= Math.pow(pt.drag, dt * 60);
      pt.vy *= Math.pow(pt.drag, dt * 60);
      pt.rotation += pt.vRot * dt;
      pt.alpha -= pt.decay * dt;
      if (pt.alpha <= 0) {
        this.particlePool.release(pt);
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 8.5);
      sw.alpha -= dt * 2.4;
      if (sw.alpha <= 0) {
        this.shockwavePool.release(sw);
        this.shockwaves.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 1.15;
      if (ft.alpha <= 0) {
        this.textPool.release(ft);
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private damagePlayer(rawDmg: number): void {
    const p = this.player;
    if (p.invulnTimer > 0) return;

    this.triggerShake(0.24, 8);
    p.invulnTimer = 0.45;
    p.shieldRegenDelay = 3.0;

    let remaining = rawDmg;
    if (p.shield > 0) {
      const absorbed = Math.min(p.shield, remaining);
      p.shield -= absorbed;
      remaining -= absorbed;
      soundEngine.play('shieldHit');
      this.spawnShockwave(p.x, p.y, p.radius * 2.1, '#00ff9d');
    }

    if (remaining > 0) {
      p.hp = Math.max(0, p.hp - remaining);
      soundEngine.play('explosion');
      this.createExplosion(p.x, p.y, '#ff0055', 14);
      this.combo = 1;
      this.comboTimer = 0;
    }

    this.emitHud();

    if (p.hp <= 0) {
      this.finishRun(false);
    }
  }

  private finishRun(victory: boolean): void {
    this.running = false;
    this.paused = false;
    soundEngine.setMusicIntensity('menu');
    soundEngine.play(victory ? 'victory' : 'gameover');

    const modeMult = GAME_MODES[this.mode].coinMultiplier;
    const victoryBonus = victory ? 150 : 0;
    const finalCoins = Math.round(this.runCoins * modeMult) + victoryBonus;

    const prevBest = this.saveData.highScore;
    const isNewHighScore = this.score > prevBest;
    if (isNewHighScore) {
      this.saveData.highScore = this.score;
    }
    if (this.score > (this.saveData.modeHighScores[this.mode] || 0)) {
      this.saveData.modeHighScores[this.mode] = this.score;
    }

    this.saveData.coins += finalCoins;
    this.saveData.stats.totalCoinsEarned += finalCoins;
    this.checkAchievements();
    persistSaveData(this.saveData);
    this.callbacks.onSaveUpdate({ ...this.saveData });

    const accuracy = this.shotsFired > 0 ? Math.min(100, Math.round((this.shotsHit / this.shotsFired) * 100)) : 0;

    this.callbacks.onRunEnd({
      victory,
      mode: this.mode,
      score: this.score,
      highScore: this.saveData.highScore,
      isNewHighScore,
      wave: this.wave,
      kills: this.kills,
      bossesDefeated: this.bossesDefeated,
      maxCombo: Math.round(this.maxCombo * 10) / 10,
      coinsEarned: finalCoins,
      durationSeconds: Math.round(this.elapsedTime),
      accuracy,
      shipUsed: this.saveData.selectedShip,
    });
  }

  private checkAchievements(): void {
    const unlocked = new Set(this.saveData.achievements);
    const tryUnlock = (id: string) => {
      if (unlocked.has(id)) return;
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return;
      unlocked.add(id);
      this.saveData.achievements.push(id);
      this.saveData.coins += def.rewardCoins;
      this.saveData.stats.totalCoinsEarned += def.rewardCoins;
      soundEngine.play('achievement');
      this.emitBanner('achievement', `ACHIEVEMENT // ${def.title}`, `${def.description} (+${def.rewardCoins} Credits)`, '#fbbf24');
      this.callbacks.onAchievementUnlocked(id);
      persistSaveData(this.saveData);
      this.callbacks.onSaveUpdate({ ...this.saveData });
    };

    if (this.saveData.stats.totalKills >= 1) tryUnlock('first_kill');
    if (this.saveData.stats.totalKills >= 150) tryUnlock('enemy_destroyer');
    if (this.saveData.stats.totalBossesDefeated >= 1) tryUnlock('boss_slayer');
    if (this.saveData.stats.totalBossesDefeated >= 5) tryUnlock('boss_rusher');
    if (this.mode === 'survival' && this.wave >= 8) tryUnlock('survival_expert');
    if (this.score >= 25000) tryUnlock('high_scorer');
    if (this.player.weaponLevel >= 5) tryUnlock('weapon_master');
    if ((this.mode === 'classic' || this.mode === 'endless') && this.wave >= 15) tryUnlock('wave_champion');
    if (this.kills >= 25 && this.combo >= 6) tryUnlock('combo_king');
    if (this.saveData.unlockedShips.length >= 3) tryUnlock('fleet_commander');
  }

  private spawnBullet(
    fromPlayer: boolean,
    weapon: PooledBullet['weapon'],
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    damage: number,
    color: string,
    isCrit: boolean,
    splashRadius = 0,
    homing = false
  ): void {
    const b = this.bulletPool.acquire();
    b.active = true;
    b.fromPlayer = fromPlayer;
    b.weapon = weapon;
    b.x = x;
    b.y = y;
    b.vx = vx;
    b.vy = vy;
    b.radius = radius;
    b.damage = damage;
    b.color = color;
    b.isCrit = isCrit;
    b.splashRadius = splashRadius;
    b.homing = homing;
    b.life = 0;
    b.maxLife = homing ? 4.2 : 3.2;
    this.bullets.push(b);
    if (fromPlayer) this.shotsFired++;
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    decay: number,
    shape: PooledParticle['shape']
  ): void {
    const pt = this.particlePool.acquire();
    pt.active = true;
    pt.x = x;
    pt.y = y;
    pt.vx = vx;
    pt.vy = vy;
    pt.size = size;
    pt.color = color;
    pt.alpha = 1;
    pt.decay = decay;
    pt.drag = shape === 'shard' ? 0.94 : 0.97;
    pt.shape = shape;
    pt.rotation = Math.random() * Math.PI * 2;
    pt.vRot = (Math.random() - 0.5) * 10;
    this.particles.push(pt);
  }

  private createExplosion(x: number, y: number, color: string, count: number): void {
    const actualCount = this.settings.highQualityParticles ? count : Math.ceil(count * 0.55);
    for (let i = 0; i < actualCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 45 + Math.random() * 240;
      const shape: PooledParticle['shape'] = i % 3 === 0 ? 'shard' : i % 2 === 0 ? 'spark' : 'circle';
      this.spawnParticle(
        x,
        y,
        Math.cos(ang) * spd,
        Math.sin(ang) * spd,
        1.8 + Math.random() * 2.8,
        i % 5 === 0 ? '#ffffff' : color,
        1.4 + Math.random() * 1.4,
        shape
      );
    }
  }

  private spawnShockwave(x: number, y: number, maxRadius: number, color: string): void {
    const sw = this.shockwavePool.acquire();
    sw.active = true;
    sw.x = x;
    sw.y = y;
    sw.radius = 6;
    sw.maxRadius = maxRadius;
    sw.color = color;
    sw.alpha = 0.85;
    sw.lineWidth = 3;
    this.shockwaves.push(sw);
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string, scale = 1): void {
    const ft = this.textPool.acquire();
    ft.active = true;
    ft.x = x;
    ft.y = y;
    ft.vy = -44;
    ft.text = text;
    ft.color = color;
    ft.alpha = 1;
    ft.scale = scale;
    this.floatingTexts.push(ft);
  }

  private spawnPowerUp(x: number, y: number, forcedType?: PowerUpType): void {
    let type: PowerUpType = forcedType ?? 'triple';
    if (!forcedType) {
      const pool: PowerUpType[] =
        this.mode === 'survival'
          ? ['triple', 'rapid', 'shield', 'weapon_up', 'weapon_plasma', 'weapon_spread', 'weapon_missile']
          : ['triple', 'rapid', 'shield', 'health', 'health', 'weapon_up', 'weapon_laser', 'weapon_plasma', 'weapon_spread', 'weapon_missile'];
      type = pool[Math.floor(Math.random() * pool.length)];
    }

    const meta: Record<PowerUpType, { color: string; label: string }> = {
      triple: { color: '#00f3ff', label: '3X' },
      rapid: { color: '#fbbf24', label: 'RPD' },
      shield: { color: '#10b981', label: 'SHD' },
      health: { color: '#f43f5e', label: '+HP' },
      weapon_up: { color: '#bd00ff', label: 'LV+' },
      weapon_laser: { color: '#00f3ff', label: 'LSR' },
      weapon_plasma: { color: '#bd00ff', label: 'PLS' },
      weapon_spread: { color: '#ff0088', label: 'SPR' },
      weapon_missile: { color: '#fbbf24', label: 'MSL' },
    };

    this.powerups.push({
      x,
      y,
      vy: 96,
      radius: 15,
      type,
      color: meta[type].color,
      label: meta[type].label,
      pulse: Math.random() * Math.PI * 2,
    });
  }

  private spawnCoins(x: number, y: number, totalValue: number): void {
    const orbs = Math.min(8, Math.max(1, Math.ceil(totalValue / 3)));
    const valPerOrb = Math.max(1, Math.round(totalValue / orbs));
    for (let i = 0; i < orbs; i++) {
      this.coins.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 120,
        vy: -55 + (Math.random() - 0.5) * 40,
        value: valPerOrb,
        radius: 6.5,
        age: 0,
      });
    }
  }

  private triggerShake(duration: number, intensity: number): void {
    if (!this.settings.screenShake) return;
    this.shakeTime = Math.max(this.shakeTime, duration);
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  private emitBanner(type: BannerAlert['type'], title: string, subtitle: string, color: string): void {
    this.callbacks.onBanner({
      id: this.bannerId++,
      type,
      title,
      subtitle,
      color,
    });
  }

  private emitHud(): void {
    const p = this.player;
    this.callbacks.onHudUpdate({
      score: this.score,
      highScore: Math.max(this.saveData.highScore, this.score),
      wave: this.wave,
      hp: Math.ceil(p.hp),
      maxHp: p.maxHp,
      shield: Math.ceil(p.shield),
      maxShield: p.maxShield,
      weapon: p.weapon,
      weaponLevel: p.weaponLevel,
      combo: this.combo,
      comboTimerRatio: this.combo > 1 ? Math.max(0, this.comboTimer / this.comboDuration) : 0,
      kills: this.kills,
      runCoins: this.runCoins,
      tripleTimer: p.tripleTimer,
      rapidTimer: p.rapidTimer,
      overdriveTimer: p.overdriveTimer,
      timeRemaining: this.timeRemaining,
      bossRushIndex: this.bossRushIndex + 1,
      bossRushTotal: this.bossRushTotal,
      boss: this.boss
        ? {
            name: this.boss.name,
            subtitle: this.boss.subtitle,
            hp: Math.max(0, Math.ceil(this.boss.hp)),
            maxHp: this.boss.maxHp,
            phase: this.boss.phase,
            maxPhases: this.boss.maxPhases,
            color: this.boss.color,
          }
        : null,
      mode: this.mode,
      critFlash: this.critFlashTimer > 0,
    });
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.save();

    if (this.shakeTime > 0 && !this.paused && !this.menuAmbientMode) {
      const dx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const dy = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      ctx.translate(dx, dy);
    }

    drawGalaxyBackground(
      ctx,
      this.width,
      this.height,
      this.stars,
      this.nebulae,
      this.menuAmbientMode ? 0.55 : 0.42
    );

    if (!this.menuAmbientMode && this.running) {
      for (let i = 0; i < this.shockwaves.length; i++) drawShockwave(ctx, this.shockwaves[i]);
      for (let i = 0; i < this.asteroids.length; i++) drawAsteroid(ctx, this.asteroids[i]);
      for (let i = 0; i < this.coins.length; i++) drawCoin(ctx, this.coins[i], this.elapsedTime);
      for (let i = 0; i < this.powerups.length; i++) drawPowerUp(ctx, this.powerups[i], this.elapsedTime);
      for (let i = 0; i < this.bullets.length; i++) drawBullet(ctx, this.bullets[i]);
      for (let i = 0; i < this.enemies.length; i++) drawEnemy(ctx, this.enemies[i], this.elapsedTime);
      if (this.boss) drawBoss(ctx, this.boss, this.elapsedTime);

      drawPlayerShip(
        ctx,
        this.saveData.selectedShip,
        this.player.x,
        this.player.y,
        this.player.radius,
        this.player.tilt,
        this.elapsedTime,
        {
          shieldRatio: this.player.maxShield > 0 ? this.player.shield / this.player.maxShield : 0,
          invulnTimer: this.player.invulnTimer,
          overdrive: this.player.tripleTimer > 0 || this.player.rapidTimer > 0,
        }
      );

      for (let i = 0; i < this.particles.length; i++) drawParticle(ctx, this.particles[i]);
      for (let i = 0; i < this.floatingTexts.length; i++) drawFloatingText(ctx, this.floatingTexts[i]);
    }

    ctx.restore();
  }
}
