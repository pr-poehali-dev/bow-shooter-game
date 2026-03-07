import { Enemy, Projectile, Particle, ENEMY_TYPES, createEnemy } from './enemies';

export interface InternalGameState {
  hp: number;
  score: number;
  wave: number;
  arrows: number;
  maxArrows: number;
  reloading: boolean;
  reloadProgress: number;
  reloadTimer: number;
  spawnTimer: number;
  waveTimer: number;
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  alive: boolean;
  bowPulse: number;
  canShoot: boolean;
  shootCooldown: number;
}

export const DIFFICULTY = {
  easy:   { spawnRate: 180, enemySpeedMult: 0.7, playerDamageMult: 0.6, maxArrows: 12 },
  normal: { spawnRate: 120, enemySpeedMult: 1.0, playerDamageMult: 1.0, maxArrows: 8 },
  hard:   { spawnRate: 70,  enemySpeedMult: 1.4, playerDamageMult: 1.4, maxArrows: 5 },
};

export function spawnParticles(s: InternalGameState, x: number, y: number, color: string, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 1.5 + Math.random() * 3;
    s.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 40 + Math.random() * 20,
      maxLife: 60,
      color,
      radius: 2 + Math.random() * 3,
    });
  }
}

export function tickSpawn(
  s: InternalGameState,
  W: number,
  H: number,
  diff: typeof DIFFICULTY[keyof typeof DIFFICULTY],
) {
  s.spawnTimer++;
  s.waveTimer++;
  if (s.waveTimer > 600) {
    s.wave++;
    s.waveTimer = 0;
  }
  const currentSpawnRate = Math.max(40, diff.spawnRate - s.wave * 5);
  if (s.spawnTimer >= currentSpawnRate) {
    s.spawnTimer = 0;
    const pool = s.wave >= 5
      ? ENEMY_TYPES
      : ENEMY_TYPES.slice(0, Math.min(s.wave + 1, ENEMY_TYPES.length));
    const type = pool[Math.floor(Math.random() * pool.length)];
    const e = createEnemy(type, W, H);
    e.speed *= diff.enemySpeedMult;
    e.vx *= diff.enemySpeedMult;
    e.vy *= diff.enemySpeedMult;
    s.enemies.push(e);
  }
}

export function tickReload(
  s: InternalGameState,
  cx: number,
  cy: number,
  emitState: () => void,
) {
  if (!s.reloading) return;
  s.reloadTimer--;
  s.reloadProgress = 1 - s.reloadTimer / 180;
  if (s.reloadTimer <= 0) {
    s.reloading = false;
    s.arrows = s.maxArrows;
    s.reloadProgress = 0;
    spawnParticles(s, cx, cy, '#00ffff', 6);
  }
  emitState();
}

export function tickEnemies(
  s: InternalGameState,
  W: number,
  H: number,
  cx: number,
  cy: number,
  diff: typeof DIFFICULTY[keyof typeof DIFFICULTY],
  emitState: () => void,
  onGameOver: (score: number) => void,
) {
  const deadEnemies: number[] = [];

  s.enemies.forEach((e, i) => {
    if (e.flashTimer > 0) e.flashTimer--;

    switch (e.pattern) {
      case 'straight':
      case 'split':
        e.x += e.vx;
        e.y += e.vy;
        break;
      case 'zigzag': {
        e.zigzagTimer++;
        e.x += e.vx;
        e.y += e.vy;
        if (e.zigzagTimer % 40 === 0) {
          // Вычисляем направление к игроку
          const tdx = cx - e.x; const tdy = cy - e.y;
          const td = Math.sqrt(tdx * tdx + tdy * tdy);
          const toPlayerX = tdx / td; const toPlayerY = tdy / td;
          // Перпендикуляр к направлению на игрока
          const perp = { x: -toPlayerY, y: toPlayerX };
          const flip = Math.random() > 0.5 ? 1 : -1;
          // Смешиваем: 70% к игроку + 50% зигзаг
          const nx = toPlayerX + perp.x * flip * 0.5;
          const ny = toPlayerY + perp.y * flip * 0.5;
          const nd = Math.sqrt(nx * nx + ny * ny);
          e.vx = (nx / nd) * e.speed;
          e.vy = (ny / nd) * e.speed;
        }
        break;
      }
      case 'chase': {
        const dx = cx - e.x;
        const dy = cy - e.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        e.vx = (dx / d) * e.speed;
        e.vy = (dy / d) * e.speed;
        e.x += e.vx;
        e.y += e.vy;
        break;
      }
      case 'teleport': {
        // Плавное появление fade-in
        if ((e.teleportAlpha ?? 1) < 1) {
          e.teleportAlpha = Math.min(1, (e.teleportAlpha ?? 0) + 0.06);
        }
        // Анимация кольца при появлении
        if ((e.teleportRingAnim ?? 0) > 0) {
          e.teleportRingAnim = (e.teleportRingAnim ?? 0) - 1;
        }

        if (!e.teleportFading) {
          e.x += e.vx;
          e.y += e.vy;
        }
        e.teleportTimer--;

        if (e.teleportTimer <= 0 && !e.teleportFading) {
          if ((e.teleportsLeft ?? 0) > 0) {
            // Есть ещё телепортации — уходим в fade-out
            e.teleportFading = true;
            e.teleportTimer = 18;
          }
          // Если телепортаций не осталось — просто летим прямо (chase), таймер не сбрасываем
        }

        if (e.teleportFading) {
          e.teleportAlpha = Math.max(0, (e.teleportAlpha ?? 1) - 0.09);
          if ((e.teleportAlpha ?? 0) <= 0) {
            // Появляемся в случайной точке ВНУТРИ экрана (не за краем)
            const margin3 = 80;
            e.x = margin3 + Math.random() * (W - margin3 * 2);
            e.y = margin3 + Math.random() * (H - margin3 * 2);
            const tdx = cx - e.x; const tdy = cy - e.y;
            const td = Math.sqrt(tdx * tdx + tdy * tdy);
            e.vx = (tdx / td) * e.speed; e.vy = (tdy / td) * e.speed;
            // Эффект появления: частицы + кольцо
            spawnParticles(s, e.x, e.y, e.color, 12);
            e.teleportRingAnim = 30;
            e.teleportFading = false;
            e.teleportAlpha = 0;
            e.teleportsLeft = (e.teleportsLeft ?? 1) - 1;
            e.teleportTimer = 90 + Math.random() * 90;

            // Если телепортаций больше нет — переключаемся на chase
            if ((e.teleportsLeft ?? 0) <= 0) {
              (e as Enemy).pattern = 'chase';
              e.teleportAlpha = 1;
            }
          }
        }
        break;
      }
      case 'bounce':
        if (!e.bouncerEntered) {
          e.x += e.vx;
          e.y += e.vy;
          if (e.x > e.radius && e.x < W - e.radius && e.y > e.radius && e.y < H - e.radius) {
            e.bouncerEntered = true;
          }
        } else {
          e.x += e.vx;
          e.y += e.vy;
          if (e.x - e.radius < 0) { e.x = e.radius; e.vx = Math.abs(e.vx); spawnParticles(s, e.x, e.y, e.color, 4); }
          if (e.x + e.radius > W) { e.x = W - e.radius; e.vx = -Math.abs(e.vx); spawnParticles(s, e.x, e.y, e.color, 4); }
          if (e.y - e.radius < 0) { e.y = e.radius; e.vy = Math.abs(e.vy); spawnParticles(s, e.x, e.y, e.color, 4); }
          if (e.y + e.radius > H) { e.y = H - e.radius; e.vy = -Math.abs(e.vy); spawnParticles(s, e.x, e.y, e.color, 4); }
        }
        break;
      case 'spiral': {
        const dx = cx - e.x;
        const dy = cy - e.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        e.angle += 0.04;
        e.vx = Math.cos(e.angle) * e.speed + (dx / d) * 0.5;
        e.vy = Math.sin(e.angle) * e.speed + (dy / d) * 0.5;
        e.x += e.vx;
        e.y += e.vy;
        break;
      }
    }

    // Pulse effect
    if (e.pulseGrowing) {
      e.pulseRadius += 0.15;
      if (e.pulseRadius > e.radius + 4) e.pulseGrowing = false;
    } else {
      e.pulseRadius -= 0.15;
      if (e.pulseRadius < e.radius) e.pulseGrowing = true;
    }

    // HP bar rotation
    e.angle += 0.01;

    // Check collision with bow
    const dx = e.x - cx;
    const dy = e.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < e.radius + 20) {
      s.hp = Math.max(0, s.hp - e.damage * diff.playerDamageMult * 0.016);
      spawnParticles(s, cx, cy, '#ff0000', 3);
      deadEnemies.push(i);
      emitState();
      if (s.hp <= 0) {
        s.alive = false;
        onGameOver(s.score);
      }
    }

    // Out of bounds
    if (e.pattern !== 'bounce') {
      const margin = 200;
      if (e.x < -margin || e.x > W + margin || e.y < -margin || e.y > H + margin) {
        deadEnemies.push(i);
      }
    }
  });

  return deadEnemies;
}

export function tickProjectiles(
  s: InternalGameState,
  W: number,
  H: number,
  deadEnemies: number[],
  emitState: () => void,
) {
  s.projectiles.forEach((p, pi) => {
    s.enemies.forEach((e, ei) => {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < p.radius + e.radius) {
        e.hp--;
        e.flashTimer = 8;
        spawnParticles(s, e.x, e.y, e.color, 5);
        if (e.hp <= 0) {
          s.score += e.points * s.wave;
          spawnParticles(s, e.x, e.y, e.color, 15);

          if (e.id === 'splitter' && !e.splitDone) {
            e.splitDone = true;
            const scout = ENEMY_TYPES.find(t => t.id === 'scout')!;
            for (let k = 0; k < 2; k++) {
              const sp = createEnemy(scout, W, H, {
                x: e.x + (Math.random() - 0.5) * 40,
                y: e.y + (Math.random() - 0.5) * 40,
              });
              s.enemies.push(sp);
            }
          }

          if (!deadEnemies.includes(ei)) deadEnemies.push(ei);
          emitState();
        }
        if (!p.piercing) {
          s.projectiles.splice(pi, 1);
        }
      }
    });
  });
}

export function tickCleanup(s: InternalGameState, W: number, H: number, deadEnemies: number[]) {
  const uniqueDead = [...new Set(deadEnemies)].sort((a, b) => b - a);
  uniqueDead.forEach(i => s.enemies.splice(i, 1));

  s.projectiles = s.projectiles.filter(p => {
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 10) p.trail.shift();
    p.x += p.vx;
    p.y += p.vy;
    return p.x > -50 && p.x < W + 50 && p.y > -50 && p.y < H + 50;
  });

  s.particles = s.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life--;
    return p.life > 0;
  });
}

export function shootProjectile(
  s: InternalGameState,
  cx: number,
  cy: number,
  mouseX: number,
  mouseY: number,
  emitState: () => void,
) {
  if (!s.alive || s.reloading || s.arrows <= 0 || s.shootCooldown > 0) return;
  const dx = mouseX - cx;
  const dy = mouseY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  const speed = 14;
  s.projectiles.push({
    x: cx, y: cy,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    radius: 4,
    trail: [],
  });
  s.arrows--;
  s.shootCooldown = 12;
  s.bowPulse = 15;
  if (s.arrows <= 0) {
    s.reloading = true;
    s.reloadTimer = 180;
    s.reloadProgress = 0;
  }
  emitState();
}