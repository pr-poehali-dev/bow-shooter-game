import { Enemy, Particle, Projectile, drawShape } from "./enemies";
import { InternalGameState } from "./gameLogic";

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  frame: number,
  cx: number,
  cy: number,
) {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#070a0f";
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = "rgba(0,255,255,0.04)";
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let gx = 0; gx < W; gx += gridSize) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
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

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
) {
  particles.forEach((p) => {
    const alpha = p.life / p.maxLife;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
    ctx.fillStyle =
      p.color +
      Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, "0");
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

export function renderProjectiles(
  ctx: CanvasRenderingContext2D,
  projectiles: Projectile[],
  frame: number,
) {
  projectiles.forEach((p, pi) => {
    const trailPulse = 0.85 + 0.2 * Math.sin(frame * 0.25 + pi);
    p.trail.forEach((t, ti) => {
      const tNorm = ti / Math.max(1, p.trail.length);
      const alpha =
        tNorm * 0.7 * (0.6 + 0.2 * Math.sin(frame * 0.2 + ti * 0.5));
      const r = p.radius * tNorm * 0.9 * trailPulse;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.fill();
    });
    const corePulse = 1 + 0.12 * Math.sin(frame * 0.3 + pi);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * corePulse, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(
      p.x - 2,
      p.y - 2,
      0,
      p.x,
      p.y,
      p.radius * corePulse * 1.5,
    );
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.4, "rgba(0,255,255,0.9)");
    grad.addColorStop(1, "rgba(0,200,255,0.4)");
    ctx.fillStyle = grad;
    ctx.shadowBlur = 18 + 4 * Math.sin(frame * 0.2 + pi);
    ctx.shadowColor = "#00ffff";
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

export function renderEnemies(
  ctx: CanvasRenderingContext2D,
  enemies: Enemy[],
  frame: number,
) {
  enemies.forEach((e, i) => {
    const isGhost = e.id === "ghost";
    const alpha = isGhost ? (e.teleportAlpha ?? 1) : 1;
    const ringAnim = e.teleportRingAnim ?? 0;

    // Анимация появления после телепортации: расширяющееся кольцо (рисуем до globalAlpha)
    if (isGhost && ringAnim > 0) {
      const ringProgress = 1 - ringAnim / 30;
      const ringRadius = e.radius + ringProgress * e.radius * 2.5;
      const ringAlpha = ringAnim / 30;
      ctx.globalAlpha = ringAlpha;
      // Внешнее кольцо
      ctx.beginPath();
      ctx.arc(e.x, e.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3 * ringAlpha;
      ctx.shadowBlur = 30;
      ctx.shadowColor = e.color;
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Второе кольцо чуть меньше
      ctx.beginPath();
      ctx.arc(e.x, e.y, ringRadius * 0.65, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5 * ringAlpha;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ffffff";
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = alpha;

    const breath = 1 + 0.06 * Math.sin(frame * 0.06 + i * 1.2);
    const glowPulse = 12 + 6 * Math.sin(frame * 0.08 + i);

    // Pulse glow ring (animated)
    ctx.beginPath();
    ctx.arc(e.x, e.y, (e.pulseRadius + 4) * breath, 0, Math.PI * 2);
    ctx.strokeStyle = e.color + "55";
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = glowPulse;
    ctx.shadowColor = e.color;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fade-in ring (пока появляется после телепорта)
    if (isGhost && alpha < 1 && !e.teleportFading) {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * (1.5 + (1 - alpha)), 0, Math.PI * 2);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 25;
      ctx.shadowColor = e.color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Индикатор оставшихся телепортаций (маленькие точки над врагом)
    if (isGhost && (e.teleportsLeft ?? 0) > 0 && alpha >= 1) {
      ctx.globalAlpha = 0.8;
      const dots = e.teleportsLeft ?? 0;
      for (let d = 0; d < dots; d++) {
        const dotX = e.x - (dots - 1) * 5 + d * 10;
        const dotY = e.y - e.radius - 18;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = e.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = alpha;
    }

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(breath, breath);
    ctx.translate(-e.x, -e.y);
    drawShape(
      ctx,
      e.shape,
      e.x,
      e.y,
      e.radius,
      e.color,
      e.glowColor,
      e.angle,
      e.flashTimer,
      frame,
      i,
    );
    ctx.restore();

    // HP bar
    if (e.maxHp > 1) {
      const bw = e.radius * 2;
      const bh = 4;
      const bx = e.x - bw / 2;
      const by = e.y - e.radius - 10;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
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
  frame: number = 0,
) {
  const bowAngle = Math.atan2(my - cy, mx - cx);
  const pulse = s.bowPulse > 0 ? 1 + s.bowPulse * 0.03 : 1;
  const release = Math.max(0, Math.min(1, s.shootCooldown / 12)); // 1 right after shot -> 0 idle
  const idleGlow = 0.18 + 0.04 * Math.sin(frame * 0.05);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(bowAngle);

  const R = 18 * pulse;
  const limbOuter = 22 * pulse;

  // Soft 3D drop shadow (depth)
  ctx.save();
  ctx.translate(3, 3);
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(0, 0, limbOuter, -Math.PI * 0.72, Math.PI * 0.72);
  ctx.strokeStyle = "rgba(0,0,0,0.9)";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.shadowBlur = 0;
  ctx.stroke();
  ctx.restore();

  // Outer glow aura (idle pulse)
  ctx.beginPath();
  ctx.arc(0, 0, limbOuter, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(0,255,255,${idleGlow})`;
  ctx.lineWidth = 10;
  ctx.shadowBlur = 26 + 6 * Math.sin(frame * 0.05);
  ctx.shadowColor = "#00ffff";
  ctx.stroke();

  // Bow limbs: "laminated" look using gradient strokes
  const limbGrad = ctx.createLinearGradient(0, -limbOuter, 0, limbOuter);
  limbGrad.addColorStop(0, "rgba(255,255,255,0.85)");
  limbGrad.addColorStop(0.45, "rgba(0,255,255,0.95)");
  limbGrad.addColorStop(1, "rgba(0,120,140,0.95)");

  const limbGlow = 16 + 4 * Math.sin(frame * 0.06);
  ctx.beginPath();
  ctx.arc(0, 0, R, -Math.PI * 0.62, Math.PI * 0.62);
  ctx.strokeStyle = limbGrad;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.shadowBlur = limbGlow;
  ctx.shadowColor = "#00ffff";
  ctx.stroke();

  // Inner rim (adds depth)
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(0, 0, R - 2, -Math.PI * 0.62, Math.PI * 0.62);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Grip: small cylinder
  const gripR = 6.5 * pulse;
  const gripGrad = ctx.createRadialGradient(
    -2 * pulse,
    -2 * pulse,
    1,
    0,
    0,
    gripR * 1.6,
  );
  gripGrad.addColorStop(0, "rgba(255,255,255,0.9)");
  gripGrad.addColorStop(0.35, "rgba(0,255,255,0.55)");
  gripGrad.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.beginPath();
  ctx.arc(-2 * pulse, 0, gripR, 0, Math.PI * 2);
  ctx.fillStyle = gripGrad;
  ctx.shadowBlur = 14;
  ctx.shadowColor = "#00ffff";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bow string: curve in/out depending on release (after shot it "snaps" forward)
  const a0 = -Math.PI * 0.62;
  const a1 = Math.PI * 0.62;
  const p0 = { x: Math.cos(a0) * R, y: Math.sin(a0) * R };
  const p2 = { x: Math.cos(a1) * R, y: Math.sin(a1) * R };
  const stringX = 24 * pulse + release * 6 * pulse; // snap forward on release
  const tension = (1 - release) * 6 * pulse; // idle is slightly pulled back (towards arrow)
  const p1 = { x: stringX - tension, y: 0 };

  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
  const stringGrad = ctx.createLinearGradient(p0.x, 0, p1.x, 0);
  stringGrad.addColorStop(0, "rgba(0,255,255,0.25)");
  stringGrad.addColorStop(0.55, "rgba(255,255,255,0.95)");
  stringGrad.addColorStop(1, "rgba(0,255,255,0.45)");
  ctx.strokeStyle = stringGrad;
  ctx.lineWidth = 1.7;
  ctx.lineCap = "round";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#ffffff";
  ctx.stroke();

  // Arrow ready
  if (!s.reloading && s.arrows > 0) {
    // Shaft with slight "metallic" gradient
    const shaftStart = -10 * pulse;
    const shaftEnd = 32 * pulse - release * 5 * pulse;
    const shaftGrad = ctx.createLinearGradient(shaftStart, -3, shaftEnd, 3);
    shaftGrad.addColorStop(0, "rgba(255,255,255,0.9)");
    shaftGrad.addColorStop(0.5, "rgba(200,240,255,0.95)");
    shaftGrad.addColorStop(1, "rgba(140,200,220,0.85)");
    ctx.beginPath();
    ctx.moveTo(shaftStart, 0);
    ctx.lineTo(shaftEnd, 0);
    ctx.strokeStyle = shaftGrad;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ffffff";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(shaftEnd, 0);
    ctx.lineTo(shaftEnd - 5 * pulse, -3.2 * pulse);
    ctx.lineTo(shaftEnd - 5 * pulse, 3.2 * pulse);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();

    // Nock glow point on string
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#00ffff";
    ctx.beginPath();
    ctx.arc(p1.x, 0, 2.4 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,255,255,0.65)";
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
  ctx.strokeStyle = "rgba(0,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crosshair
  const chSize = 10;
  ctx.strokeStyle = "rgba(0,255,255,0.8)";
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 8;
  ctx.shadowColor = "#00ffff";
  ctx.beginPath();
  ctx.moveTo(mx - chSize, my);
  ctx.lineTo(mx + chSize, my);
  ctx.moveTo(mx, my - chSize);
  ctx.lineTo(mx, my + chSize);
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
  ctx.arc(
    cx,
    cy,
    35,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * reloadProgress,
  );
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 3;
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#00ffff";
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(0,255,255,0.9)";
  ctx.font = "bold 11px Orbitron, monospace";
  ctx.textAlign = "center";
  ctx.fillText("RELOAD", cx, cy + 55);
}
