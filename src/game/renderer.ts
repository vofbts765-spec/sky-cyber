import { SHIPS } from './constants';
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
import { ShipId } from './types';

export function drawGalaxyBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stars: StarLayerItem[],
  nebulae: NebulaCloud[],
  trailAlpha = 0.42
): void {
  // Deep space fade with subtle motion trail
  ctx.fillStyle = `rgba(3, 4, 12, ${trailAlpha})`;
  ctx.fillRect(0, 0, width, height);

  // Drifting nebula clouds
  for (let i = 0; i < nebulae.length; i++) {
    const n = nebulae[i];
    const grad = ctx.createRadialGradient(n.x, n.y, n.radius * 0.08, n.x, n.y, n.radius);
    grad.addColorStop(0, n.color);
    grad.addColorStop(1, 'rgba(3, 4, 12, 0)');
    ctx.save();
    ctx.globalAlpha = n.alpha;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Multi-layer parallax starfield
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = s.color;
    if (s.layer === 2) {
      ctx.fillRect(s.x, s.y, s.size, s.size * 2.4);
    } else {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }
  ctx.globalAlpha = 1;
}

export function drawPlayerShip(
  ctx: CanvasRenderingContext2D,
  shipId: ShipId,
  x: number,
  y: number,
  radius: number,
  tilt: number,
  time: number,
  options: {
    shieldRatio?: number;
    invulnTimer?: number;
    overdrive?: boolean;
    scale?: number;
  } = {}
): void {
  const cfg = SHIPS[shipId];
  const scale = options.scale ?? 1;
  const invuln = options.invulnTimer ?? 0;

  // Blink during invulnerability frames
  if (invuln > 0 && Math.floor(time * 20) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (1 - Math.abs(tilt) * 0.08), scale);
  ctx.rotate(tilt * 0.22);

  // Animated Engine Flames
  const flicker = 0.8 + Math.sin(time * 48) * 0.22 + Math.cos(time * 73) * 0.12;
  const drawFlame = (fx: number, fy: number, fw: number, fh: number) => {
    const grad = ctx.createLinearGradient(fx, fy, fx, fy + fh * flicker);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, cfg.engineColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(fx - fw, fy);
    ctx.lineTo(fx, fy + fh * flicker);
    ctx.lineTo(fx + fw, fy);
    ctx.closePath();
    ctx.fill();
  };

  if (shipId === 'striker') {
    drawFlame(-8, 13, 3.5, 19);
    drawFlame(8, 13, 3.5, 19);
    drawFlame(0, 17, 4.5, 25);
  } else if (shipId === 'phantom') {
    drawFlame(-12, 15, 3, 21);
    drawFlame(12, 15, 3, 21);
  } else if (shipId === 'titan') {
    drawFlame(-11, 16, 4.5, 22);
    drawFlame(0, 18, 5.5, 26);
    drawFlame(11, 16, 4.5, 22);
  } else {
    drawFlame(-9, 15, 3.8, 22);
    drawFlame(9, 15, 3.8, 22);
    drawFlame(0, 17, 4.5, 28);
  }

  // Overdrive Aura
  if (options.overdrive) {
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.45 + Math.sin(time * 14) * 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.shadowBlur = 16;
  ctx.shadowColor = cfg.primaryColor;
  ctx.strokeStyle = cfg.primaryColor;
  ctx.lineWidth = 2.2;

  if (shipId === 'striker') {
    // Sleek classic-upgraded Void Striker silhouette
    ctx.fillStyle = '#071426';
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(9, -6);
    ctx.lineTo(22, 14);
    ctx.lineTo(10, 12);
    ctx.lineTo(7, 19);
    ctx.lineTo(0, 15);
    ctx.lineTo(-7, 19);
    ctx.lineTo(-10, 12);
    ctx.lineTo(-22, 14);
    ctx.lineTo(-9, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner wing accents
    ctx.strokeStyle = cfg.secondaryColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-14, 11);
    ctx.lineTo(-5, -4);
    ctx.moveTo(14, 11);
    ctx.lineTo(5, -4);
    ctx.stroke();

    // Canopy
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.ellipse(0, -4, 3.8, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (shipId === 'phantom') {
    // Stealth forward-swept twin blade fighter
    ctx.fillStyle = '#180726';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(7, -10);
    ctx.lineTo(24, 4);
    ctx.lineTo(18, 19);
    ctx.lineTo(8, 12);
    ctx.lineTo(0, 18);
    ctx.lineTo(-8, 12);
    ctx.lineTo(-18, 19);
    ctx.lineTo(-24, 4);
    ctx.lineTo(-7, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = cfg.secondaryColor;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-16, 4);
    ctx.lineTo(0, -14);
    ctx.lineTo(16, 4);
    ctx.stroke();

    ctx.fillStyle = '#fdf4ff';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(4, 1);
    ctx.lineTo(0, 6);
    ctx.lineTo(-4, 1);
    ctx.closePath();
    ctx.fill();
  } else if (shipId === 'titan') {
    // Heavy armored gunship
    ctx.fillStyle = '#08182e';
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(11, -14);
    ctx.lineTo(14, -4);
    ctx.lineTo(25, 8);
    ctx.lineTo(22, 18);
    ctx.lineTo(9, 18);
    ctx.lineTo(5, 13);
    ctx.lineTo(-5, 13);
    ctx.lineTo(-9, 18);
    ctx.lineTo(-22, 18);
    ctx.lineTo(-25, 8);
    ctx.lineTo(-14, -4);
    ctx.lineTo(-11, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin cannon pods
    ctx.fillStyle = cfg.secondaryColor;
    ctx.fillRect(-17, -4, 4, 14);
    ctx.fillRect(13, -4, 4, 14);

    // Core reactor
    ctx.fillStyle = '#cffafe';
    ctx.beginPath();
    ctx.arc(0, -2, 5.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Solar Nova experimental starfighter
    ctx.fillStyle = '#240b14';
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.lineTo(8, -11);
    ctx.lineTo(15, -14);
    ctx.lineTo(24, 10);
    ctx.lineTo(13, 17);
    ctx.lineTo(5, 12);
    ctx.lineTo(0, 19);
    ctx.lineTo(-5, 12);
    ctx.lineTo(-13, 17);
    ctx.lineTo(-24, 10);
    ctx.lineTo(-15, -14);
    ctx.lineTo(-8, -11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Solar wing coils
    ctx.strokeStyle = cfg.secondaryColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, -11);
    ctx.lineTo(-18, 8);
    ctx.moveTo(15, -11);
    ctx.lineTo(18, 8);
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(0, -3, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hexagonal Energy Shield Aura
  const shieldRatio = options.shieldRatio ?? 0;
  if (shieldRatio > 0) {
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#00ff9d';
    ctx.strokeStyle = `rgba(0, 255, 157, ${0.35 + shieldRatio * 0.55})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sr = radius + 11;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + time * 0.9;
      const px = Math.cos(a) * sr;
      const py = Math.sin(a) * sr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: EnemyEntity, time: number): void {
  // Sniper telegraph laser line
  if (e.type === 'sniper' && e.telegraphTimer > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 40, 120, ${0.25 + (1 - e.telegraphTimer) * 0.65})`;
    ctx.lineWidth = e.telegraphTimer < 0.2 ? 2.5 : 1.2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.telegraphTargetX, e.telegraphTargetY);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(e.x, e.y);

  const color = e.hitFlash > 0 ? '#ffffff' : e.color;
  ctx.shadowBlur = 14;
  ctx.shadowColor = color;
  ctx.strokeStyle = color;
  ctx.fillStyle = e.hitFlash > 0 ? 'rgba(255,255,255,0.35)' : 'rgba(14, 6, 24, 0.88)';
  ctx.lineWidth = 2.2;

  if (e.type === 'basic') {
    ctx.rotate(e.angle * 0.4);
    ctx.beginPath();
    ctx.moveTo(0, e.radius);
    ctx.lineTo(e.radius * 0.88, -e.radius * 0.55);
    ctx.lineTo(0, -e.radius * 0.25);
    ctx.lineTo(-e.radius * 0.88, -e.radius * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.type === 'fast') {
    ctx.rotate(Math.sin(e.age * 7) * 0.35);
    ctx.beginPath();
    ctx.moveTo(0, e.radius * 1.15);
    ctx.lineTo(e.radius * 0.78, -e.radius * 0.7);
    ctx.lineTo(0, -e.radius * 0.95);
    ctx.lineTo(-e.radius * 0.78, -e.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.type === 'tank') {
    ctx.rotate(e.angle);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = Math.cos(a) * e.radius;
      const py = Math.sin(a) * e.radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, e.radius * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  } else if (e.type === 'sniper') {
    ctx.beginPath();
    ctx.moveTo(0, e.radius * 1.15);
    ctx.lineTo(e.radius * 0.6, 0);
    ctx.lineTo(e.radius * 0.95, -e.radius * 0.85);
    ctx.lineTo(0, -e.radius * 0.45);
    ctx.lineTo(-e.radius * 0.95, -e.radius * 0.85);
    ctx.lineTo(-e.radius * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (e.type === 'kamikaze') {
    const pulse = 1 + Math.sin(time * 22) * 0.14;
    ctx.scale(pulse, pulse);
    ctx.rotate(e.angle * 2.2);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.lineTo(Math.cos(a) * e.radius, Math.sin(a) * e.radius);
      const a2 = a + Math.PI / 4;
      ctx.lineTo(Math.cos(a2) * e.radius * 0.45, Math.sin(a2) * e.radius * 0.45);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Carrier
    ctx.beginPath();
    ctx.moveTo(-e.radius, -e.radius * 0.4);
    ctx.lineTo(-e.radius * 0.5, -e.radius * 0.9);
    ctx.lineTo(e.radius * 0.5, -e.radius * 0.9);
    ctx.lineTo(e.radius, -e.radius * 0.4);
    ctx.lineTo(e.radius * 0.85, e.radius * 0.75);
    ctx.lineTo(-e.radius * 0.85, e.radius * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Glowing Core
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(3, e.radius * 0.24), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Mini Health Bar for multi-HP enemies once damaged
  if (e.maxHp > 1 && e.hp < e.maxHp) {
    const barW = e.radius * 1.7;
    const barH = 4;
    const bx = e.x - barW / 2;
    const by = e.y - e.radius - 11;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = e.color;
    ctx.fillRect(bx, by, barW * Math.max(0, e.hp / e.maxHp), barH);
  }
}

export function drawBoss(ctx: CanvasRenderingContext2D, b: BossEntity, time: number): void {
  // Laser sweep telegraph if active
  if (b.telegraphTimer > 0) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.laserSweepAngle);
    ctx.strokeStyle = b.telegraphTimer < 0.25 ? 'rgba(255, 45, 110, 0.95)' : 'rgba(255, 190, 50, 0.55)';
    ctx.lineWidth = b.telegraphTimer < 0.25 ? 10 : 2.5;
    ctx.setLineDash(b.telegraphTimer < 0.25 ? [] : [10, 8]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 900);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(b.x, b.y);

  const primary = b.hitFlash > 0 ? '#ffffff' : b.color;
  const secondary = b.hitFlash > 0 ? '#ffffff' : b.secondaryColor;

  ctx.shadowBlur = 24;
  ctx.shadowColor = primary;
  ctx.strokeStyle = primary;
  ctx.fillStyle = 'rgba(10, 6, 24, 0.92)';
  ctx.lineWidth = 3;

  // Outer rotating orbital ring for Phase 2+
  if (b.phase >= 2) {
    ctx.save();
    ctx.rotate(time * 1.4);
    ctx.strokeStyle = secondary;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, b.radius + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (b.archetype === 'vortex_sentinel') {
    // Rotating outer prism + wing cannons
    ctx.beginPath();
    ctx.moveTo(0, b.radius);
    ctx.lineTo(b.radius * 0.95, 0);
    ctx.lineTo(b.radius * 0.55, -b.radius * 0.85);
    ctx.lineTo(-b.radius * 0.55, -b.radius * 0.85);
    ctx.lineTo(-b.radius * 0.95, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.rotate(-time * 2.2);
    ctx.strokeStyle = secondary;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const r = b.radius * 0.55;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  } else if (b.archetype === 'crimson_leviathan') {
    // Wide armored dreadnought with twin mandibles
    ctx.beginPath();
    ctx.moveTo(-b.radius * 1.15, -b.radius * 0.35);
    ctx.lineTo(-b.radius * 0.5, -b.radius * 0.9);
    ctx.lineTo(b.radius * 0.5, -b.radius * 0.9);
    ctx.lineTo(b.radius * 1.15, -b.radius * 0.35);
    ctx.lineTo(b.radius * 0.9, b.radius * 0.85);
    ctx.lineTo(b.radius * 0.4, b.radius * 0.45);
    ctx.lineTo(0, b.radius * 0.95);
    ctx.lineTo(-b.radius * 0.4, b.radius * 0.45);
    ctx.lineTo(-b.radius * 0.9, b.radius * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (b.archetype === 'nebula_hydra') {
    // Three-headed cybernetic flagship
    for (const offset of [-b.radius * 0.72, 0, b.radius * 0.72]) {
      ctx.beginPath();
      ctx.arc(offset, offset === 0 ? 8 : -8, b.radius * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-b.radius, -b.radius * 0.5);
    ctx.lineTo(b.radius, -b.radius * 0.5);
    ctx.lineTo(b.radius * 0.65, b.radius * 0.6);
    ctx.lineTo(-b.radius * 0.65, b.radius * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (b.archetype === 'chrono_overlord') {
    // Ringed orbital citadel
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + time * 0.45;
      const r = i % 2 === 0 ? b.radius : b.radius * 0.7;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Omega Singularity
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 + time * 0.8;
      const r = i % 2 === 0 ? b.radius * 1.05 : b.radius * 0.62;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Pulsing Singularity Core
  const corePulse = 1 + Math.sin(time * 8) * 0.16;
  ctx.fillStyle = secondary;
  ctx.beginPath();
  ctx.arc(0, 0, b.radius * 0.25 * corePulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, b.radius * 0.11 * corePulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawAsteroid(ctx: CanvasRenderingContext2D, a: AsteroidEntity): void {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.angle);
  ctx.strokeStyle = a.hitFlash > 0 ? '#ffffff' : '#64748b';
  ctx.fillStyle = a.hitFlash > 0 ? 'rgba(255,255,255,0.25)' : 'rgba(18, 24, 42, 0.88)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  for (let i = 0; i < a.vertices.length; i++) {
    const ang = (i / a.vertices.length) * Math.PI * 2;
    const r = a.radius * a.vertices[i];
    const px = Math.cos(ang) * r;
    const py = Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUpEntity, time: number): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  const pulse = 1 + Math.sin(time * 8 + p.pulse) * 0.1;
  ctx.scale(pulse, pulse);

  ctx.shadowBlur = 14;
  ctx.shadowColor = p.color;
  ctx.strokeStyle = p.color;
  ctx.fillStyle = 'rgba(5, 10, 22, 0.85)';
  ctx.lineWidth = 2.2;

  // Octagonal / Diamond frame
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 10px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.label, 0, 1);
  ctx.restore();
}

export function drawCoin(ctx: CanvasRenderingContext2D, c: CoinPickup, time: number): void {
  ctx.save();
  ctx.translate(c.x, c.y);
  const spin = Math.abs(Math.cos(time * 6 + c.age * 4));
  ctx.scale(Math.max(0.35, spin), 1);

  ctx.shadowBlur = 10;
  ctx.shadowColor = '#fbbf24';
  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawBullet(ctx: CanvasRenderingContext2D, b: PooledBullet): void {
  ctx.save();
  ctx.shadowBlur = b.fromPlayer ? 12 : 10;
  ctx.shadowColor = b.color;

  if (b.weapon === 'laser' || b.weapon === 'spread') {
    const angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
    ctx.translate(b.x, b.y);
    ctx.rotate(angle);
    ctx.fillStyle = b.isCrit ? '#fef08a' : '#ffffff';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 1.5;
    drawRoundedRectPath(ctx, -2.4, -10, 4.8, 20, 2.4);
    ctx.fill();
    ctx.stroke();
  } else if (b.weapon === 'plasma') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (b.weapon === 'missile') {
    const angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
    ctx.translate(b.x, b.y);
    ctx.rotate(angle);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(4.5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4.5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -3, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.weapon === 'enemy_lance') {
    const angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
    ctx.translate(b.x, b.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    drawRoundedRectPath(ctx, -2.5, -14, 5, 28, 2.5);
    ctx.fill();
    ctx.stroke();
  } else {
    // Enemy orb / mine
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawParticle(ctx: CanvasRenderingContext2D, pt: PooledParticle): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, pt.alpha);
  ctx.fillStyle = pt.color;

  if (pt.shape === 'shard') {
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.rotation);
    ctx.fillRect(-pt.size, -pt.size * 0.45, pt.size * 2, pt.size * 0.9);
  } else if (pt.shape === 'spark') {
    ctx.strokeStyle = pt.color;
    ctx.lineWidth = Math.max(1.2, pt.size * 0.65);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineTo(pt.x - pt.vx * 0.035, pt.y - pt.vy * 0.035);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawShockwave(ctx: CanvasRenderingContext2D, sw: PooledShockwave): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, sw.alpha);
  ctx.strokeStyle = sw.color;
  ctx.lineWidth = sw.lineWidth;
  ctx.beginPath();
  ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawFloatingText(ctx: CanvasRenderingContext2D, ft: PooledFloatingText): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, ft.alpha);
  ctx.font = `800 ${Math.round(13 * ft.scale)}px Orbitron, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = ft.color;
  ctx.shadowBlur = 8;
  ctx.shadowColor = ft.color;
  ctx.fillText(ft.text, ft.x, ft.y);
  ctx.restore();
}
