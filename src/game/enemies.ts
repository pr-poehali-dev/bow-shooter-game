export type EnemyType = {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  shape:
    | "circle"
    | "triangle"
    | "square"
    | "hexagon"
    | "star"
    | "diamond"
    | "pentagon";
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  points: number;
  pattern:
    | "straight"
    | "zigzag"
    | "spiral"
    | "teleport"
    | "chase"
    | "bounce"
    | "split";
  special?: string;
  description: string;
};

export type Enemy = EnemyType & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  zigzagTimer: number;
  teleportTimer: number;
  splitDone?: boolean;
  pulseRadius: number;
  pulseGrowing: boolean;
  flashTimer: number;
  bouncerEntered?: boolean;
  teleportAlpha?: number;
  teleportFading?: boolean;
  teleportsLeft?: number;
  teleportRingAnim?: number;
};

export type Projectile = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  trail: { x: number; y: number }[];
  piercing?: boolean;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
};

export const ENEMY_TYPES: Omit<EnemyType, "hp">[] = [
  {
    id: "scout",
    name: "Скаут",
    color: "#00ff41",
    glowColor: "rgba(0,255,65,0.6)",
    shape: "circle",
    maxHp: 1,
    speed: 2.5,
    damage: 18,
    radius: 14,
    points: 10,
    pattern: "straight",
    description: "Быстрый и слабый. Умирает с одного попадания.",
  },
  {
    id: "tank",
    name: "Танк",
    color: "#ff6600",
    glowColor: "rgba(255,102,0,0.6)",
    shape: "hexagon",
    maxHp: 5,
    speed: 1.0,
    damage: 40,
    radius: 24,
    points: 40,
    pattern: "straight",
    description: "Медленный, но требует 5 попаданий. Наносит большой урон.",
  },
  {
    id: "zigzagger",
    name: "Зигзаг",
    color: "#ffff00",
    glowColor: "rgba(255,255,0,0.6)",
    shape: "diamond",
    maxHp: 2,
    speed: 2.0,
    damage: 25,
    radius: 16,
    points: 25,
    pattern: "zigzag",
    special: "Движется зигзагом",
    description: "Движется зигзагом — сложно прицелиться. 2 попадания.",
  },
  {
    id: "ghost",
    name: "Призрак",
    color: "#bf00ff",
    glowColor: "rgba(191,0,255,0.6)",
    shape: "pentagon",
    maxHp: 3,
    speed: 1.8,
    damage: 30,
    radius: 18,
    points: 35,
    pattern: "teleport",
    special: "Телепортируется",
    description: "Периодически телепортируется. Держи глаз востро!",
  },
  {
    id: "splitter",
    name: "Делитель",
    color: "#ff006e",
    glowColor: "rgba(255,0,110,0.6)",
    shape: "square",
    maxHp: 4,
    speed: 1.5,
    damage: 28,
    radius: 20,
    points: 50,
    pattern: "straight",
    special: "Делится при смерти",
    description: "При гибели делится на 2 скаута. Будь осторожен!",
  },
  {
    id: "berserker",
    name: "Берсерк",
    color: "#ff0000",
    glowColor: "rgba(255,0,0,0.7)",
    shape: "star",
    maxHp: 3,
    speed: 3.5,
    damage: 45,
    radius: 17,
    points: 60,
    pattern: "chase",
    special: "Преследует игрока",
    description: "Быстро несётся прямо на лук. Очень опасен!",
  },
  {
    id: "bouncer",
    name: "Рикошет",
    color: "#00ffff",
    glowColor: "rgba(0,255,255,0.6)",
    shape: "triangle",
    maxHp: 3,
    speed: 2.2,
    damage: 22,
    radius: 15,
    points: 45,
    pattern: "bounce",
    special: "Отражается от стен",
    description: "Отскакивает от краёв экрана. Непредсказуемый!",
  },
];

export function createEnemy(
  type: Omit<EnemyType, "hp">,
  canvasW: number,
  canvasH: number,
  overrides?: Partial<Enemy>,
): Enemy {
  const side = Math.floor(Math.random() * 4);
  let x = 0,
    y = 0;
  const margin = 60;
  switch (side) {
    case 0:
      x = Math.random() * canvasW;
      y = -margin;
      break;
    case 1:
      x = canvasW + margin;
      y = Math.random() * canvasH;
      break;
    case 2:
      x = Math.random() * canvasW;
      y = canvasH + margin;
      break;
    case 3:
      x = -margin;
      y = Math.random() * canvasH;
      break;
  }
  const speed = type.speed * (0.85 + Math.random() * 0.3);
  let angle = Math.atan2(canvasH / 2 - y, canvasW / 2 - x);

  // Bouncer: first fly into a wall for an early ricochet (not straight to the bow).
  if (type.pattern === "bounce") {
    const inset = Math.max(10, type.radius);
    let tx = canvasW / 2;
    let ty = canvasH / 2;
    switch (side) {
      case 0: // spawned above -> aim to bottom wall
        tx = inset + Math.random() * (canvasW - inset * 2);
        ty = canvasH - inset;
        break;
      case 2: // spawned below -> aim to top wall
        tx = inset + Math.random() * (canvasW - inset * 2);
        ty = inset;
        break;
      case 1: // spawned right -> aim to left wall
        tx = inset;
        ty = inset + Math.random() * (canvasH - inset * 2);
        break;
      case 3: // spawned left -> aim to right wall
        tx = canvasW - inset;
        ty = inset + Math.random() * (canvasH - inset * 2);
        break;
    }
    angle = Math.atan2(ty - y, tx - x);
  }
  return {
    ...type,
    hp: type.maxHp,
    x: overrides?.x ?? x,
    y: overrides?.y ?? y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    zigzagTimer: 0,
    teleportTimer: Math.random() * 180,
    splitDone: false,
    pulseRadius: type.radius,
    pulseGrowing: true,
    flashTimer: 0,
    bouncerEntered: false,
    teleportAlpha: type.pattern === "teleport" ? 0 : 1,
    teleportFading: false,
    teleportsLeft:
      type.pattern === "teleport" ? 2 + Math.floor(Math.random() * 3) : 0,
    teleportRingAnim: 0,
    ...overrides,
  };
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: EnemyType["shape"],
  x: number,
  y: number,
  radius: number,
  color: string,
  glowColor: string,
  rotation: number = 0,
  flashTimer: number = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const path = buildEnemyPath(shape, radius);

  // Light direction (in local space) to fake 3D shading.
  const lx = Math.cos(-rotation - Math.PI * 0.25);
  const ly = Math.sin(-rotation - Math.PI * 0.25);

  const depth = Math.max(2, Math.min(6, radius * 0.18));
  const dx = lx * depth;
  const dy = ly * depth;

  // Ambient glow
  ctx.shadowBlur = 22;
  ctx.shadowColor = glowColor;

  // "Extrusion" / side face (drawn first, slightly offset)
  ctx.save();
  ctx.translate(dx, dy);
  ctx.fillStyle = withAlpha(darkenHex(color, 0.35), 0.32);
  ctx.strokeStyle = withAlpha(darkenHex(color, 0.45), 0.55);
  ctx.lineWidth = Math.max(1.5, radius * 0.12);
  ctx.lineJoin = "round";
  ctx.fill(path);
  ctx.stroke(path);
  ctx.restore();

  // Main body fill with a specular-like gradient.
  const highlightX = -lx * radius * 0.35;
  const highlightY = -ly * radius * 0.35;
  const g = ctx.createRadialGradient(
    highlightX,
    highlightY,
    radius * 0.1,
    0,
    0,
    radius * 1.15,
  );
  g.addColorStop(0, withAlpha(lightenHex(color, 0.55), 0.8));
  g.addColorStop(0.38, withAlpha(color, 0.26));
  g.addColorStop(1, withAlpha(darkenHex(color, 0.2), 0.22));

  ctx.fillStyle = g;
  ctx.lineJoin = "round";
  ctx.fill(path);

  // Rim light / edge
  const edge = ctx.createLinearGradient(
    -lx * radius,
    -ly * radius,
    lx * radius,
    ly * radius,
  );
  edge.addColorStop(0, withAlpha("#ffffff", 0.75));
  edge.addColorStop(0.5, withAlpha(color, 0.9));
  edge.addColorStop(1, withAlpha(darkenHex(color, 0.35), 0.8));
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(2, radius * 0.14);
  ctx.stroke(path);

  // Inner cut / contour to enhance depth
  ctx.shadowBlur = 0;
  ctx.strokeStyle = withAlpha("#000000", 0.25);
  ctx.lineWidth = Math.max(1, radius * 0.08);
  ctx.setLineDash([]);
  ctx.stroke(path);

  // Specular highlight streak (simple arc/line in the top-left quadrant)
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.55;
  ctx.shadowBlur = 18;
  ctx.shadowColor = withAlpha("#ffffff", 0.9);
  ctx.beginPath();
  if (shape === "circle") {
    ctx.arc(
      highlightX,
      highlightY,
      radius * 0.55,
      -Math.PI * 0.1,
      Math.PI * 0.7,
    );
  } else {
    ctx.moveTo(highlightX - radius * 0.25, highlightY - radius * 0.15);
    ctx.lineTo(highlightX + radius * 0.35, highlightY + radius * 0.15);
  }
  ctx.strokeStyle = withAlpha("#ffffff", 0.7);
  ctx.lineWidth = Math.max(1, radius * 0.09);
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();

  // Flash feedback (hit): additive white overlay that keeps 3D shading.
  if (flashTimer > 0) {
    const flash = Math.min(1, flashTimer / 8);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.75 * flash;
    ctx.fillStyle = withAlpha("#ffffff", 0.35);
    ctx.fill(path);
    ctx.strokeStyle = withAlpha("#ffffff", 0.85);
    ctx.lineWidth = Math.max(2, radius * 0.16);
    ctx.stroke(path);
    ctx.restore();
  }

  ctx.restore();
}

function buildEnemyPath(shape: EnemyType["shape"], radius: number) {
  const p = new Path2D();

  switch (shape) {
    case "circle":
      p.arc(0, 0, radius, 0, Math.PI * 2);
      break;
    case "triangle": {
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius;
        if (i === 0) p.moveTo(px, py);
        else p.lineTo(px, py);
      }
      p.closePath();
      break;
    }
    case "square":
      p.rect(-radius * 0.8, -radius * 0.8, radius * 1.6, radius * 1.6);
      break;
    case "diamond":
      p.moveTo(0, -radius);
      p.lineTo(radius * 0.7, 0);
      p.lineTo(0, radius);
      p.lineTo(-radius * 0.7, 0);
      p.closePath();
      break;
    case "hexagon": {
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius;
        if (i === 0) p.moveTo(px, py);
        else p.lineTo(px, py);
      }
      p.closePath();
      break;
    }
    case "pentagon": {
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius;
        if (i === 0) p.moveTo(px, py);
        else p.lineTo(px, py);
      }
      p.closePath();
      break;
    }
    case "star": {
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? radius : radius * 0.45;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) p.moveTo(px, py);
        else p.lineTo(px, py);
      }
      p.closePath();
      break;
    }
  }
  return p;
}

function withAlpha(hexOrRgb: string, alpha: number) {
  if (hexOrRgb.startsWith("rgba(") || hexOrRgb.startsWith("hsla("))
    return hexOrRgb;
  const hex = hexOrRgb.trim();
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // Fallback: if it's already css color name, keep it (alpha won't apply).
  return hexOrRgb;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function darkenHex(hex: string, amount01: number) {
  return tintHex(hex, -Math.abs(amount01));
}

function lightenHex(hex: string, amount01: number) {
  return tintHex(hex, Math.abs(amount01));
}

function tintHex(hex: string, amount01: number) {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const amt = clamp01(Math.abs(amount01));
  const r0 = parseInt(m[1].slice(0, 2), 16);
  const g0 = parseInt(m[1].slice(2, 4), 16);
  const b0 = parseInt(m[1].slice(4, 6), 16);

  const t = amount01 >= 0 ? 255 : 0;
  const mix = (c: number) => Math.round(c + (t - c) * amt);

  const r = mix(r0).toString(16).padStart(2, "0");
  const g = mix(g0).toString(16).padStart(2, "0");
  const b = mix(b0).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}
