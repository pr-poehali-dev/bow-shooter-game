import { useEffect, useRef, useCallback } from 'react';
import { Enemy, Projectile, Particle, ENEMY_TYPES, createEnemy, drawShape } from './enemies';

interface GameState {
  hp: number;
  maxHp: number;
  score: number;
  wave: number;
  arrows: number;
  maxArrows: number;
  reloading: boolean;
  reloadProgress: number;
}

interface GameCanvasProps {
  difficulty: 'easy' | 'normal' | 'hard';
  soundEnabled: boolean;
  onGameOver: (score: number) => void;
  onStateChange: (state: GameState) => void;
}

const DIFFICULTY = {
  easy:   { spawnRate: 180, enemySpeedMult: 0.7, playerDamageMult: 0.6, maxArrows: 12 },
  normal: { spawnRate: 120, enemySpeedMult: 1.0, playerDamageMult: 1.0, maxArrows: 8 },
  hard:   { spawnRate: 70,  enemySpeedMult: 1.4, playerDamageMult: 1.4, maxArrows: 5 },
};

export default function GameCanvas({ difficulty, soundEnabled, onGameOver, onStateChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const gameStateRef = useRef({
    hp: 100,
    score: 0,
    wave: 1,
    arrows: DIFFICULTY[difficulty].maxArrows,
    maxArrows: DIFFICULTY[difficulty].maxArrows,
    reloading: false,
    reloadProgress: 0,
    reloadTimer: 0,
    spawnTimer: 0,
    waveTimer: 0,
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    alive: true,
    bowPulse: 0,
    canShoot: true,
    shootCooldown: 0,
  });

  const emitState = useCallback(() => {
    const s = gameStateRef.current;
    onStateChange({
      hp: s.hp,
      maxHp: 100,
      score: s.score,
      wave: s.wave,
      arrows: s.arrows,
      maxArrows: s.maxArrows,
      reloading: s.reloading,
      reloadProgress: s.reloadProgress,
    });
  }, [onStateChange]);

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    const s = gameStateRef.current;
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
  };

  const shoot = useCallback(() => {
    const s = gameStateRef.current;
    if (!s.alive || s.reloading || s.arrows <= 0 || s.shootCooldown > 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = mousePos.current.x - cx;
    const dy = mousePos.current.y - cy;
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
  }, [emitState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const s = gameStateRef.current;
    const diff = DIFFICULTY[difficulty];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleClick = () => shoot();
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    let frame = 0;
    const loop = () => {
      if (!s.alive) return;
      frame++;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;

      // Spawn enemies
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

      // Reload
      if (s.reloading) {
        s.reloadTimer--;
        s.reloadProgress = 1 - s.reloadTimer / 180;
        if (s.reloadTimer <= 0) {
          s.reloading = false;
          s.arrows = s.maxArrows;
          s.reloadProgress = 0;
          spawnParticles(cx, cy, '#00ffff', 6);
        }
        emitState();
      }

      if (s.shootCooldown > 0) s.shootCooldown--;
      if (s.bowPulse > 0) s.bowPulse--;

      // Update enemies
      const deadEnemies: number[] = [];
      s.enemies.forEach((e, i) => {
        if (e.flashTimer > 0) e.flashTimer--;

        switch (e.pattern) {
          case 'straight':
          case 'split':
            e.x += e.vx;
            e.y += e.vy;
            break;
          case 'zigzag':
            e.zigzagTimer++;
            e.x += e.vx;
            e.y += e.vy;
            if (e.zigzagTimer % 40 === 0) {
              const perp = { x: -e.vy / e.speed, y: e.vx / e.speed };
              const flip = Math.random() > 0.5 ? 1 : -1;
              e.vx = (e.vx / e.speed + perp.x * flip * 1.5) * e.speed * 0.7;
              e.vy = (e.vy / e.speed + perp.y * flip * 1.5) * e.speed * 0.7;
              const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
              e.vx = (e.vx / spd) * e.speed;
              e.vy = (e.vy / spd) * e.speed;
            }
            break;
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
          case 'teleport':
            e.x += e.vx;
            e.y += e.vy;
            e.teleportTimer--;
            if (e.teleportTimer <= 0) {
              e.teleportTimer = 120 + Math.random() * 120;
              const newE = createEnemy(e, W, H);
              e.x = newE.x;
              e.y = newE.y;
              spawnParticles(e.x, e.y, e.color, 5);
            }
            break;
          case 'bounce':
            e.x += e.vx;
            e.y += e.vy;
            if (e.x - e.radius < 0 || e.x + e.radius > W) e.vx *= -1;
            if (e.y - e.radius < 0 || e.y + e.radius > H) e.vy *= -1;
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
          spawnParticles(cx, cy, '#ff0000', 3);
          deadEnemies.push(i);
          emitState();
          if (s.hp <= 0) {
            s.alive = false;
            onGameOver(s.score);
          }
        }

        // Out of bounds (non-bounce)
        if (e.pattern !== 'bounce') {
          const margin = 200;
          if (e.x < -margin || e.x > W + margin || e.y < -margin || e.y > H + margin) {
            deadEnemies.push(i);
          }
        }
      });

      // Check projectile hits
      s.projectiles.forEach((p, pi) => {
        s.enemies.forEach((e, ei) => {
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < p.radius + e.radius) {
            e.hp--;
            e.flashTimer = 8;
            spawnParticles(e.x, e.y, e.color, 5);
            if (e.hp <= 0) {
              s.score += e.points * s.wave;
              spawnParticles(e.x, e.y, e.color, 15);

              // Splitter spawns 2 scouts
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

      // Remove dead enemies
      const uniqueDead = [...new Set(deadEnemies)].sort((a, b) => b - a);
      uniqueDead.forEach(i => s.enemies.splice(i, 1));

      // Move projectiles
      s.projectiles = s.projectiles.filter(p => {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 10) p.trail.shift();
        p.x += p.vx;
        p.y += p.vy;
        return p.x > -50 && p.x < W + 50 && p.y > -50 && p.y < H + 50;
      });

      // Move particles
      s.particles = s.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life--;
        return p.life > 0;
      });

      // === DRAW ===
      ctx.clearRect(0, 0, W, H);

      // Background
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

      // Particles
      s.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Projectiles
      s.projectiles.forEach(p => {
        // Trail
        p.trail.forEach((t, ti) => {
          const alpha = (ti / p.trail.length) * 0.6;
          const r = p.radius * (ti / p.trail.length) * 0.8;
          ctx.beginPath();
          ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,255,${alpha})`;
          ctx.fill();
        });
        // Arrow head
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Enemies
      s.enemies.forEach(e => {
        // Pulse glow ring
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.pulseRadius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = e.color + '44';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = e.color;
        ctx.stroke();
        ctx.shadowBlur = 0;

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
      });

      // === BOW / ARCHER ===
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
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

      // Arrow ready (if not reloading)
      if (!s.reloading && s.arrows > 0) {
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(32 * pulse, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(32 * pulse, 0);
        ctx.lineTo(27 * pulse, -3);
        ctx.lineTo(27 * pulse, 3);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      ctx.restore();

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

      // Reload arc
      if (s.reloading) {
        ctx.beginPath();
        ctx.arc(cx, cy, 35, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * s.reloadProgress);
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

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [difficulty, shoot, onGameOver, emitState]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: 'none' }}
    />
  );
}
