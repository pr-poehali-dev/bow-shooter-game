import { useEffect, useRef, useCallback } from 'react';
import { Enemy, Projectile, Particle, ENEMY_TYPES, createEnemy, drawShape } from './enemies';
import { sfx } from './audio';

interface GameState {
  hp: number;
  maxHp: number;
  score: number;
  wave: number;
  arrows: number;
  maxArrows: number;
  reloading: boolean;
  reloadProgress: number;
  combo: number;
  killStreak: number;
}

interface GameCanvasProps {
  difficulty: 'easy' | 'normal' | 'hard';
  soundEnabled: boolean;
  onGameOver: (score: number) => void;
  onStateChange: (state: GameState) => void;
}

interface FloatingText {
  x: number; y: number;
  text: string; color: string;
  life: number; maxLife: number;
  vy: number; scale: number;
}

interface PowerUp {
  x: number; y: number;
  type: 'multi' | 'pierce' | 'rapid' | 'bomb';
  radius: number; angle: number; life: number;
  pulsePhase: number;
}

const DIFFICULTY = {
  easy:   { spawnRate: 180, enemySpeedMult: 0.7, playerDamageMult: 0.6, maxArrows: 12, reloadTime: 150 },
  normal: { spawnRate: 110, enemySpeedMult: 1.0, playerDamageMult: 1.0, maxArrows: 8,  reloadTime: 180 },
  hard:   { spawnRate: 65,  enemySpeedMult: 1.4, playerDamageMult: 1.4, maxArrows: 5,  reloadTime: 220 },
};

const POWERUP_COLORS = { multi: '#ff006e', pierce: '#00ffff', rapid: '#ffff00', bomb: '#ff6600' };
const POWERUP_LABELS = { multi: '×3', pierce: '▶▶', rapid: '⚡', bomb: '💥' };

export default function GameCanvas({ difficulty, soundEnabled, onGameOver, onStateChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const diff = DIFFICULTY[difficulty];

  const s = useRef({
    hp: 100,
    score: 0,
    wave: 1,
    arrows: diff.maxArrows,
    maxArrows: diff.maxArrows,
    reloading: false,
    reloadProgress: 0,
    reloadTimer: 0,
    spawnTimer: 0,
    waveTimer: 0,
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    particles: [] as Particle[],
    floats: [] as FloatingText[],
    powerups: [] as PowerUp[],
    alive: true,
    bowPulse: 0,
    shootCooldown: 0,
    combo: 0,
    comboTimer: 0,
    killStreak: 0,
    shakeX: 0,
    shakeY: 0,
    shakePower: 0,
    // active power-up
    activePowerup: null as null | 'multi' | 'pierce' | 'rapid' | 'bomb',
    powerupTimer: 0,
    rapidFire: false,
    waveAnnounce: 0,
    totalKills: 0,
    nextPowerupKill: 10,
  }).current;

  const play = useCallback((fn: () => void) => { if (soundEnabled) fn(); }, [soundEnabled]);

  const emitState = useCallback(() => {
    onStateChange({
      hp: s.hp, maxHp: 100,
      score: s.score, wave: s.wave,
      arrows: s.arrows, maxArrows: s.maxArrows,
      reloading: s.reloading, reloadProgress: s.reloadProgress,
      combo: s.combo, killStreak: s.killStreak,
    });
  }, [onStateChange, s]);

  const addShake = (power: number) => {
    s.shakePower = Math.max(s.shakePower, power);
  };

  const spawnParticles = useCallback((x: number, y: number, color: string, count = 8, speedMult = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.8;
      const speed = (1.5 + Math.random() * 3.5) * speedMult;
      s.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 35 + Math.random() * 30,
        maxLife: 65,
        color,
        radius: 2 + Math.random() * 3,
      });
    }
  }, [s]);

  const addFloat = (x: number, y: number, text: string, color: string, big = false) => {
    s.floats.push({ x, y, text, color, life: 55, maxLife: 55, vy: -1.2, scale: big ? 1.6 : 1 });
  };

  const spawnBombExplosion = useCallback((cx: number, cy: number) => {
    const W = canvasRef.current?.width ?? 800;
    const H = canvasRef.current?.height ?? 600;
    const killed: number[] = [];
    s.enemies.forEach((e, i) => {
      const dx = e.x - cx; const dy = e.y - cy;
      if (Math.sqrt(dx * dx + dy * dy) < 180) {
        killed.push(i);
        s.score += e.points * s.wave;
        spawnParticles(e.x, e.y, e.color, 12, 1.5);
        addFloat(e.x, e.y - 20, `+${e.points * s.wave}`, e.color);
        s.totalKills++;
      }
    });
    [...killed].sort((a, b) => b - a).forEach(i => s.enemies.splice(i, 1));
    // big explosion ring
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 3 + Math.random() * 5;
      s.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 50 + Math.random() * 30,
        maxLife: 80,
        color: '#ff6600',
        radius: 3 + Math.random() * 5,
      });
    }
    addShake(14);
    void W; void H;
  }, [s, spawnParticles]);

  const shoot = useCallback(() => {
    if (!s.alive || s.reloading || s.arrows <= 0) return;
    const cooldown = s.activePowerup === 'rapid' ? 4 : 12;
    if (s.shootCooldown > 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = mousePos.current.x - cx;
    const dy = mousePos.current.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;
    const speed = 15;

    const isPierce = s.activePowerup === 'pierce';
    const isMulti = s.activePowerup === 'multi';

    if (s.activePowerup === 'bomb') {
      spawnBombExplosion(mousePos.current.x, mousePos.current.y);
      s.activePowerup = null;
      s.powerupTimer = 0;
      play(() => sfx.kill(200));
    } else {
      const angles = isMulti ? [-0.18, 0, 0.18] : [0];
      angles.forEach(offset => {
        const a = Math.atan2(dy, dx) + offset;
        s.projectiles.push({
          x: cx, y: cy,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          radius: isPierce ? 5 : 4,
          trail: [],
          piercing: isPierce,
        });
      });
    }

    s.arrows--;
    s.shootCooldown = cooldown;
    s.bowPulse = 12;
    play(() => sfx.shoot());

    if (s.arrows <= 0) {
      s.reloading = true;
      s.reloadTimer = diff.reloadTime;
      s.reloadProgress = 0;
    }
    emitState();
  }, [s, diff, play, spawnBombExplosion, emitState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Reset state
    s.hp = 100; s.score = 0; s.wave = 1;
    s.arrows = diff.maxArrows; s.maxArrows = diff.maxArrows;
    s.reloading = false; s.reloadProgress = 0; s.reloadTimer = 0;
    s.spawnTimer = 0; s.waveTimer = 0;
    s.enemies = []; s.projectiles = []; s.particles = []; s.floats = []; s.powerups = [];
    s.alive = true; s.bowPulse = 0; s.shootCooldown = 0;
    s.combo = 0; s.comboTimer = 0; s.killStreak = 0;
    s.shakeX = 0; s.shakeY = 0; s.shakePower = 0;
    s.activePowerup = null; s.powerupTimer = 0; s.waveAnnounce = 0;
    s.totalKills = 0; s.nextPowerupKill = 10;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', shoot);

    let frame = 0;

    const loop = () => {
      if (!s.alive) return;
      frame++;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;

      // Wave
      s.spawnTimer++;
      s.waveTimer++;
      if (s.waveTimer > 700) {
        s.wave++;
        s.waveTimer = 0;
        s.waveAnnounce = 150;
        play(() => sfx.waveup());
        emitState();
      }
      if (s.waveAnnounce > 0) s.waveAnnounce--;

      // Spawn
      const spawnRate = Math.max(35, diff.spawnRate - s.wave * 6);
      if (s.spawnTimer >= spawnRate) {
        s.spawnTimer = 0;
        const maxTypes = Math.min(s.wave + 1, ENEMY_TYPES.length);
        const pool = ENEMY_TYPES.slice(0, maxTypes);
        const type = pool[Math.floor(Math.random() * pool.length)];
        const e = createEnemy(type, W, H);
        e.speed *= diff.enemySpeedMult * (1 + s.wave * 0.04);
        e.vx *= diff.enemySpeedMult * (1 + s.wave * 0.04);
        e.vy *= diff.enemySpeedMult * (1 + s.wave * 0.04);
        s.enemies.push(e);
      }

      // Reload
      if (s.reloading) {
        s.reloadTimer--;
        s.reloadProgress = 1 - s.reloadTimer / diff.reloadTime;
        if (s.reloadTimer <= 0) {
          s.reloading = false;
          s.arrows = s.maxArrows;
          s.reloadProgress = 0;
          spawnParticles(cx, cy, '#00ffff', 8);
          play(() => sfx.reload());
        }
        emitState();
      }

      if (s.shootCooldown > 0) s.shootCooldown--;
      if (s.bowPulse > 0) s.bowPulse--;

      // Combo decay
      if (s.comboTimer > 0) {
        s.comboTimer--;
        if (s.comboTimer === 0) {
          s.combo = 0;
          emitState();
        }
      }

      // Active powerup timer
      if (s.powerupTimer > 0) {
        s.powerupTimer--;
        if (s.powerupTimer === 0) s.activePowerup = null;
      }

      // Screen shake decay
      if (s.shakePower > 0) {
        s.shakeX = (Math.random() - 0.5) * s.shakePower;
        s.shakeY = (Math.random() - 0.5) * s.shakePower;
        s.shakePower *= 0.82;
        if (s.shakePower < 0.3) { s.shakePower = 0; s.shakeX = 0; s.shakeY = 0; }
      }

      // Power-up rotation
      s.powerups.forEach(p => {
        p.angle += 0.04;
        p.pulsePhase += 0.07;
        p.life--;
      });
      s.powerups = s.powerups.filter(p => p.life > 0);

      // ---- ENEMY UPDATE ----
      const deadEnemies: number[] = [];

      s.enemies.forEach((e, i) => {
        if (e.flashTimer > 0) e.flashTimer--;

        switch (e.pattern) {
          case 'straight':
          case 'split':
            e.x += e.vx; e.y += e.vy; break;

          case 'zigzag':
            e.zigzagTimer++;
            e.x += e.vx; e.y += e.vy;
            if (e.zigzagTimer % 35 === 0) {
              const perp = { x: -e.vy / e.speed, y: e.vx / e.speed };
              const flip = Math.random() > 0.5 ? 1 : -1;
              e.vx = (e.vx / e.speed + perp.x * flip * 1.8) * e.speed * 0.65;
              e.vy = (e.vy / e.speed + perp.y * flip * 1.8) * e.speed * 0.65;
              const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
              e.vx = (e.vx / spd) * e.speed;
              e.vy = (e.vy / spd) * e.speed;
            }
            break;

          case 'chase': {
            const dx = cx - e.x; const dy = cy - e.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            const accel = 0.08;
            e.vx += (dx / d) * e.speed * accel;
            e.vy += (dy / d) * e.speed * accel;
            const curSpd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
            if (curSpd > e.speed) { e.vx = (e.vx / curSpd) * e.speed; e.vy = (e.vy / curSpd) * e.speed; }
            e.x += e.vx; e.y += e.vy;
            break;
          }

          case 'teleport':
            e.x += e.vx; e.y += e.vy;
            e.teleportTimer--;
            if (e.teleportTimer <= 0) {
              e.teleportTimer = 100 + Math.random() * 100;
              spawnParticles(e.x, e.y, e.color, 6);
              const newE = createEnemy(e, W, H);
              e.x = newE.x; e.y = newE.y;
              spawnParticles(e.x, e.y, e.color, 6);
            }
            break;

          case 'bounce':
            e.x += e.vx; e.y += e.vy;
            if (e.x - e.radius < 0) { e.vx = Math.abs(e.vx); spawnParticles(e.x, e.y, e.color, 3); }
            if (e.x + e.radius > W) { e.vx = -Math.abs(e.vx); spawnParticles(e.x, e.y, e.color, 3); }
            if (e.y - e.radius < 0) { e.vy = Math.abs(e.vy); spawnParticles(e.x, e.y, e.color, 3); }
            if (e.y + e.radius > H) { e.vy = -Math.abs(e.vy); spawnParticles(e.x, e.y, e.color, 3); }
            break;

          case 'spiral': {
            const dx = cx - e.x; const dy = cy - e.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            e.angle += 0.05;
            e.vx = Math.cos(e.angle) * e.speed * 0.8 + (dx / d) * e.speed * 0.6;
            e.vy = Math.sin(e.angle) * e.speed * 0.8 + (dy / d) * e.speed * 0.6;
            const spd = Math.sqrt(e.vx * e.vx + e.vy * e.vy);
            e.vx = (e.vx / spd) * e.speed;
            e.vy = (e.vy / spd) * e.speed;
            e.x += e.vx; e.y += e.vy;
            break;
          }
        }

        // Pulse ring
        if (e.pulseGrowing) {
          e.pulseRadius += 0.18;
          if (e.pulseRadius > e.radius + 5) e.pulseGrowing = false;
        } else {
          e.pulseRadius -= 0.18;
          if (e.pulseRadius < e.radius) e.pulseGrowing = true;
        }

        // Shape rotation (non-chase)
        if (e.pattern !== 'chase') e.angle += 0.012;

        // Collision with bow
        const dx = e.x - cx; const dy = e.y - cy;
        if (Math.sqrt(dx * dx + dy * dy) < e.radius + 22) {
          const dmg = e.damage * diff.playerDamageMult * 0.017;
          s.hp = Math.max(0, s.hp - dmg);
          spawnParticles(cx, cy, '#ff0000', 6, 1.2);
          addShake(10);
          s.combo = 0; s.comboTimer = 0; s.killStreak = 0;
          play(() => sfx.damage());
          deadEnemies.push(i);
          emitState();
          if (s.hp <= 0) { s.alive = false; onGameOver(s.score); return; }
        }

        // Out of bounds (non-bounce)
        if (e.pattern !== 'bounce') {
          const margin = 220;
          if (e.x < -margin || e.x > W + margin || e.y < -margin || e.y > H + margin) deadEnemies.push(i);
        }
      });

      // ---- PROJECTILE HIT ----
      const deadProjectiles = new Set<number>();
      s.projectiles.forEach((p, pi) => {
        s.enemies.forEach((e, ei) => {
          if (deadEnemies.includes(ei)) return;
          const dx = p.x - e.x; const dy = p.y - e.y;
          if (Math.sqrt(dx * dx + dy * dy) < p.radius + e.radius) {
            e.hp--;
            e.flashTimer = 7;
            spawnParticles(e.x, e.y, e.color, 4);
            play(() => sfx.hit(e.hp));

            if (e.hp <= 0) {
              const earned = e.points * s.wave * (1 + Math.floor(s.combo / 3) * 0.5);
              s.score += Math.round(earned);
              s.totalKills++;
              s.killStreak++;

              // Combo
              s.combo++;
              s.comboTimer = 90;
              if (s.combo >= 2) { play(() => sfx.combo(s.combo)); }

              spawnParticles(e.x, e.y, e.color, 14, 1.3);
              addFloat(e.x, e.y - e.radius - 8, `+${Math.round(earned)}`, e.color, s.combo >= 3);
              if (s.combo >= 3) addFloat(e.x, e.y - e.radius - 28, `×${s.combo} COMBO!`, '#ffff00', true);

              addShake(4 + e.maxHp);
              play(() => sfx.kill(e.points));

              // Splitter spawns 2 scouts on death
              if (e.id === 'splitter' && !e.splitDone) {
                e.splitDone = true;
                const scout = ENEMY_TYPES.find(t => t.id === 'scout')!;
                for (let k = 0; k < 2; k++) {
                  s.enemies.push(createEnemy(scout, W, H, {
                    x: e.x + (Math.random() - 0.5) * 50,
                    y: e.y + (Math.random() - 0.5) * 50,
                  }));
                }
              }

              if (!deadEnemies.includes(ei)) deadEnemies.push(ei);
              emitState();

              // Power-up drop
              if (s.totalKills >= s.nextPowerupKill) {
                s.nextPowerupKill += 8 + Math.floor(Math.random() * 8);
                const types: PowerUp['type'][] = ['multi', 'pierce', 'rapid', 'bomb'];
                s.powerups.push({
                  x: e.x, y: e.y,
                  type: types[Math.floor(Math.random() * types.length)],
                  radius: 16, angle: 0, life: 360, pulsePhase: 0,
                });
              }
            }
            if (!p.piercing) deadProjectiles.add(pi);
          }
        });
      });

      // Remove dead
      [...new Set(deadEnemies)].sort((a, b) => b - a).forEach(i => s.enemies.splice(i, 1));
      s.projectiles = s.projectiles.filter((_, i) => !deadProjectiles.has(i));

      // Power-up pickup
      s.powerups = s.powerups.filter(pu => {
        const dx = mousePos.current.x - pu.x;
        const dy = mousePos.current.y - pu.y;
        if (Math.sqrt(dx * dx + dy * dy) < pu.radius + 20) {
          s.activePowerup = pu.type;
          s.powerupTimer = pu.type === 'bomb' ? 1 : 360;
          spawnParticles(pu.x, pu.y, POWERUP_COLORS[pu.type], 12, 1.5);
          addFloat(pu.x, pu.y - 30, POWERUP_LABELS[pu.type] + ' POWER!', POWERUP_COLORS[pu.type], true);
          play(() => sfx.powerup());
          return false;
        }
        return true;
      });

      // Move projectiles
      s.projectiles = s.projectiles.filter(p => {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 12) p.trail.shift();
        p.x += p.vx; p.y += p.vy;
        return p.x > -80 && p.x < W + 80 && p.y > -80 && p.y < H + 80;
      });

      // Particles
      s.particles = s.particles.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.94; p.vy *= 0.94;
        p.life--;
        return p.life > 0;
      });

      // Floats
      s.floats = s.floats.filter(f => {
        f.y += f.vy; f.life--;
        return f.life > 0;
      });

      // ===== DRAW =====
      ctx.save();
      ctx.translate(s.shakeX, s.shakeY);

      // BG
      ctx.fillStyle = '#060910';
      ctx.fillRect(-10, -10, W + 20, H + 20);

      // Dynamic grid (shifts with wave)
      const gridOffset = (frame * 0.3) % 50;
      ctx.strokeStyle = `rgba(0,255,255,${0.025 + 0.01 * Math.sin(frame * 0.02)})`;
      ctx.lineWidth = 1;
      for (let gx = -gridOffset; gx < W + 50; gx += 50) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = -gridOffset; gy < H + 50; gy += 50) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      // Center rings
      for (let r = 70; r < Math.max(W, H) * 0.8; r += 100) {
        const alpha = 0.025 + 0.015 * Math.sin(frame * 0.015 + r * 0.01);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Danger zone (close to bow)
      if (s.enemies.some(e => {
        const dx = e.x - cx; const dy = e.y - cy;
        return Math.sqrt(dx * dx + dy * dy) < 130;
      })) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 130);
        grad.addColorStop(0, 'rgba(255,0,0,0.0)');
        grad.addColorStop(0.7, 'rgba(255,0,0,0.0)');
        grad.addColorStop(1, `rgba(255,0,0,${0.06 + 0.04 * Math.sin(frame * 0.15)})`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, 130, 0, Math.PI * 2);
        ctx.fill();
      }

      // Power-ups
      s.powerups.forEach(pu => {
        const col = POWERUP_COLORS[pu.type];
        const pScale = 1 + 0.15 * Math.sin(pu.pulsePhase);
        const r = pu.radius * pScale;
        const fadeAlpha = pu.life < 80 ? pu.life / 80 : 1;

        ctx.save();
        ctx.translate(pu.x, pu.y);
        ctx.rotate(pu.angle);
        ctx.globalAlpha = fadeAlpha;

        // Outer glow
        ctx.beginPath();
        ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = col + '44';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20; ctx.shadowColor = col;
        ctx.stroke(); ctx.shadowBlur = 0;

        // Body
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI) / 2;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fillStyle = col + '22';
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.fill(); ctx.stroke();

        // Label
        ctx.fillStyle = col;
        ctx.font = `bold ${Math.round(13 * pScale)}px Orbitron, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 10; ctx.shadowColor = col;
        ctx.fillText(POWERUP_LABELS[pu.type], 0, 0);
        ctx.shadowBlur = 0;

        ctx.restore();
      });

      // Particles
      s.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 200).toString(16).padStart(2, '0');
        ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.fill(); ctx.shadowBlur = 0;
      });

      // Projectiles
      s.projectiles.forEach(p => {
        const col = p.piercing ? '#bf00ff' : '#00ffff';
        p.trail.forEach((t, ti) => {
          const alpha = (ti / p.trail.length) * 0.55;
          const r = p.radius * (ti / p.trail.length) * 0.7;
          ctx.beginPath();
          ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
          ctx.fillStyle = col + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          ctx.fill();
        });
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.shadowBlur = 18; ctx.shadowColor = col;
        ctx.fill(); ctx.shadowBlur = 0;
      });

      // Enemies
      s.enemies.forEach(e => {
        // Glow ring
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.pulseRadius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = e.color + '33';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 18; ctx.shadowColor = e.color;
        ctx.stroke(); ctx.shadowBlur = 0;

        drawShape(ctx, e.shape, e.x, e.y, e.radius, e.color, e.glowColor, e.angle, e.flashTimer);

        // HP pips
        if (e.maxHp > 1) {
          const bw = e.radius * 2.2;
          const bx = e.x - bw / 2;
          const by = e.y - e.radius - 11;
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.beginPath(); ctx.roundRect(bx - 1, by - 1, bw + 2, 6, 2); ctx.fill();
          ctx.fillStyle = e.color;
          ctx.shadowBlur = 6; ctx.shadowColor = e.color;
          ctx.beginPath(); ctx.roundRect(bx, by, bw * (e.hp / e.maxHp), 4, 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // BOW
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const bowAngle = Math.atan2(my - cy, mx - cx);
      const pulse = s.bowPulse > 0 ? 1 + s.bowPulse * 0.025 : 1;
      const bowCol = s.activePowerup ? POWERUP_COLORS[s.activePowerup] : '#00ffff';

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(bowAngle);

      // Base platform
      ctx.beginPath(); ctx.arc(0, 0, 24 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = bowCol + '22'; ctx.lineWidth = 10;
      ctx.shadowBlur = 25; ctx.shadowColor = bowCol;
      ctx.stroke(); ctx.shadowBlur = 0;

      // Arc body
      ctx.beginPath();
      ctx.arc(0, 0, 19 * pulse, -Math.PI * 0.62, Math.PI * 0.62);
      ctx.strokeStyle = bowCol;
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 18; ctx.shadowColor = bowCol;
      ctx.stroke();

      // String
      ctx.beginPath();
      ctx.moveTo(Math.cos(-Math.PI * 0.62) * 19 * pulse, Math.sin(-Math.PI * 0.62) * 19 * pulse);
      ctx.lineTo(26 * pulse, 0);
      ctx.lineTo(Math.cos(Math.PI * 0.62) * 19 * pulse, Math.sin(Math.PI * 0.62) * 19 * pulse);
      ctx.strokeStyle = bowCol + 'aa';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.stroke();

      // Arrow
      if (!s.reloading && s.arrows > 0) {
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.lineTo(33 * pulse, 0);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10; ctx.shadowColor = '#ffffff';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(33 * pulse, 0);
        ctx.lineTo(28 * pulse, -3.5); ctx.lineTo(28 * pulse, 3.5);
        ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // Aim line (dotted)
      ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(mx, my);
      ctx.strokeStyle = bowCol + '18';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 9]);
      ctx.stroke(); ctx.setLineDash([]);

      // Crosshair
      ctx.strokeStyle = bowCol + 'cc';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10; ctx.shadowColor = bowCol;
      ctx.beginPath();
      ctx.moveTo(mx - 12, my); ctx.lineTo(mx + 12, my);
      ctx.moveTo(mx, my - 12); ctx.lineTo(mx, my + 12);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;

      // Reload ring
      if (s.reloading) {
        ctx.beginPath();
        ctx.arc(cx, cy, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * s.reloadProgress);
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3;
        ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff';
        ctx.stroke(); ctx.shadowBlur = 0;
      }

      // Active power-up indicator (top-center of bow)
      if (s.activePowerup && s.activePowerup !== 'bomb') {
        const col = POWERUP_COLORS[s.activePowerup];
        const progress = s.powerupTimer / 360;
        ctx.save();
        ctx.translate(cx, cy - 48);
        ctx.beginPath();
        ctx.arc(0, 0, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.strokeStyle = col; ctx.lineWidth = 2.5;
        ctx.shadowBlur = 10; ctx.shadowColor = col;
        ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = col;
        ctx.font = 'bold 11px Orbitron, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(POWERUP_LABELS[s.activePowerup], 0, 0);
        ctx.restore();
      }

      // Floating texts
      s.floats.forEach(f => {
        const alpha = Math.min(1, f.life / 20);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = f.color;
        ctx.shadowBlur = 12; ctx.shadowColor = f.color;
        ctx.font = `bold ${Math.round(13 * f.scale)}px Orbitron, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.text, f.x, f.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // Wave announce
      if (s.waveAnnounce > 0) {
        const alpha = Math.min(1, s.waveAnnounce / 30) * Math.min(1, s.waveAnnounce / 150);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#bf00ff';
        ctx.shadowBlur = 30; ctx.shadowColor = '#bf00ff';
        ctx.font = `bold ${Math.round(36)}px Orbitron, monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`ВОЛНА ${s.wave}`, cx, cy - 80);
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('ПРИГОТОВЬСЯ!', cx, cy - 50);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      ctx.restore(); // end shake

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', shoot);
    };
  }, [difficulty, shoot, onGameOver, emitState, s, diff, spawnParticles, play]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ cursor: 'none' }} />;
}
