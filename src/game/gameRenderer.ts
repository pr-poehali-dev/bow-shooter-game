import { Enemy, Particle, Projectile, drawShape } from './enemies';
import { InternalGameState } from './gameLogic';

export function renderBackground(ctx: CanvasRenderingContext2D, W: number, H: number, frame: number, cx: number, cy: number) {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#070a0f';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(0,255,255,0.04)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let gx = 0; gx < W; gx += gridSize) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // Center rings
  for (let r = 80; r < Math.max(W, H); r += 120) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,255,${0.03 + 0.02 * Math.sin(frame * 0.02)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

export function renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
  projectiles.forEach(p => {
    p.trail.forEach((t, ti) => {
      const alpha = (ti / p.trail.length) * 0.6;
      const r = p.radius * (ti / p.trail.length) * 0.8;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

export function renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
  enemies.forEach(e => {
    const alpha = e.pattern === 'teleport' ? (e.teleportAlpha ?? 1) : 1;
    ctx.globalAlpha = alpha;

    // Pulse glow ring
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.pulseRadius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = e.color + '44';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = e.color;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Teleport ring effect when appearing
    if (e.pattern === 'teleport' && alpha < 1 && !e.teleportFading) {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * (2 - alpha), 0, Math.PI * 2);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 20;
      ctx.shadowColor = e.color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    drawShape(ctx, e.shape, e.x, e.y, e.radius, e.color, e.glowColor, e.angle, e.flashTimer);

    // HP bar
    if (e.maxHp > 1) {
      const bw = e.radius * 2;
      const bh = 4;
      const bx = e.x - bw / 2;
      const by = e.y - e.radius - 10;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = e.color;
      ctx.shadowBlur = 5;
      ctx.shadowColor = e.color;
      ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), bh);
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
  });
}

export function renderBow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  mx: number,
  my: number,
  s: InternalGameState,
) {
  const bowAngle = Math.atan2(my - cy, mx - cx);
  const pulse = s.bowPulse > 0 ? 1 + s.bowPulse * 0.03 : 1;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(bowAngle);

  // Bow outer glow ring
  ctx.beginPath();
  ctx.arc(0, 0, 22 * pulse, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,255,255,0.2)';
  ctx.lineWidth = 8;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#00ffff';
  ctx.stroke();

  // Bow body
  ctx.beginPath();
  ctx.arc(0, 0, 18 * pulse, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00ffff';
  ctx.stroke();

  // Bow string
  ctx.beginPath();
  ctx.moveTo(Math.cos(-Math.PI * 0.6) * 18 * pulse, Math.sin(-Math.PI * 0.6) * 18 * pulse);
  ctx.lineTo(24 * pulse, 0);
  ctx.lineTo(Math.cos(Math.PI * 0.6) * 18 * pulse, Math.sin(Math.PI * 0.6) * 18 * pulse);
  ctx.strokeStyle = 'rgba(0,255,255,0.7)';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 8;
  ctx.stroke();

  // Arrow ready
  if (!s.reloading && s.arrows > 0) {
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(32 * pulse, 0);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(32 * pulse, 0);
    ctx.lineTo(27 * pulse, -3);
    ctx.lineTo(27 * pulse, 3);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  ctx.restore();
}

export function renderAim(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  mx: number,
  my: number,
) {
  // Aim line
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(mx, my);
  ctx.strokeStyle = 'rgba(0,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crosshair
  const chSize = 10;
  ctx.strokeStyle = 'rgba(0,255,255,0.8)';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#00ffff';
  ctx.beginPath();
  ctx.moveTo(mx - chSize, my); ctx.lineTo(mx + chSize, my);
  ctx.moveTo(mx, my - chSize); ctx.lineTo(mx, my + chSize);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mx, my, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

export function renderReload(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  reloadProgress: number,
) {
  ctx.beginPath();
  ctx.arc(cx, cy, 35, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * reloadProgress);
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00ffff';
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(0,255,255,0.9)';
  ctx.font = 'bold 11px Orbitron, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RELOAD', cx, cy + 55);
}
