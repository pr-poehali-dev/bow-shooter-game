export type EnemyType = {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  shape: 'circle' | 'triangle' | 'square' | 'hexagon' | 'star' | 'diamond' | 'pentagon';
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  points: number;
  pattern: 'straight' | 'zigzag' | 'spiral' | 'teleport' | 'chase' | 'bounce' | 'split';
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

export const ENEMY_TYPES: Omit<EnemyType, 'hp'>[] = [
  {
    id: 'scout',
    name: 'Скаут',
    color: '#00ff41',
    glowColor: 'rgba(0,255,65,0.6)',
    shape: 'circle',
    maxHp: 1,
    speed: 2.5,
    damage: 10,
    radius: 14,
    points: 10,
    pattern: 'straight',
    description: 'Быстрый и слабый. Умирает с одного попадания.',
  },
  {
    id: 'tank',
    name: 'Танк',
    color: '#ff6600',
    glowColor: 'rgba(255,102,0,0.6)',
    shape: 'hexagon',
    maxHp: 5,
    speed: 1.0,
    damage: 25,
    radius: 24,
    points: 40,
    pattern: 'straight',
    description: 'Медленный, но требует 5 попаданий. Наносит большой урон.',
  },
  {
    id: 'zigzagger',
    name: 'Зигзаг',
    color: '#ffff00',
    glowColor: 'rgba(255,255,0,0.6)',
    shape: 'diamond',
    maxHp: 2,
    speed: 2.0,
    damage: 15,
    radius: 16,
    points: 25,
    pattern: 'zigzag',
    special: 'Движется зигзагом',
    description: 'Движется зигзагом — сложно прицелиться. 2 попадания.',
  },
  {
    id: 'ghost',
    name: 'Призрак',
    color: '#bf00ff',
    glowColor: 'rgba(191,0,255,0.6)',
    shape: 'pentagon',
    maxHp: 3,
    speed: 1.8,
    damage: 20,
    radius: 18,
    points: 35,
    pattern: 'teleport',
    special: 'Телепортируется',
    description: 'Периодически телепортируется. Держи глаз востро!',
  },
  {
    id: 'splitter',
    name: 'Делитель',
    color: '#ff006e',
    glowColor: 'rgba(255,0,110,0.6)',
    shape: 'square',
    maxHp: 4,
    speed: 1.5,
    damage: 18,
    radius: 20,
    points: 50,
    pattern: 'straight',
    special: 'Делится при смерти',
    description: 'При гибели делится на 2 скаута. Будь осторожен!',
  },
  {
    id: 'berserker',
    name: 'Берсерк',
    color: '#ff0000',
    glowColor: 'rgba(255,0,0,0.7)',
    shape: 'star',
    maxHp: 3,
    speed: 3.5,
    damage: 30,
    radius: 17,
    points: 60,
    pattern: 'chase',
    special: 'Преследует игрока',
    description: 'Быстро несётся прямо на лук. Очень опасен!',
  },
  {
    id: 'bouncer',
    name: 'Рикошет',
    color: '#00ffff',
    glowColor: 'rgba(0,255,255,0.6)',
    shape: 'triangle',
    maxHp: 3,
    speed: 2.2,
    damage: 15,
    radius: 15,
    points: 45,
    pattern: 'bounce',
    special: 'Отражается от стен',
    description: 'Отскакивает от краёв экрана. Непредсказуемый!',
  },
];

export function createEnemy(
  type: Omit<EnemyType, 'hp'>,
  canvasW: number,
  canvasH: number,
  overrides?: Partial<Enemy>
): Enemy {
  const side = Math.floor(Math.random() * 4);
  let x = 0, y = 0;
  const margin = 60;
  switch (side) {
    case 0: x = Math.random() * canvasW; y = -margin; break;
    case 1: x = canvasW + margin; y = Math.random() * canvasH; break;
    case 2: x = Math.random() * canvasW; y = canvasH + margin; break;
    case 3: x = -margin; y = Math.random() * canvasH; break;
  }
  const speed = type.speed * (0.85 + Math.random() * 0.3);
  const angle = Math.atan2(canvasH / 2 - y, canvasW / 2 - x);
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
    ...overrides,
  };
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: EnemyType['shape'],
  x: number,
  y: number,
  radius: number,
  color: string,
  glowColor: string,
  rotation: number = 0,
  flashTimer: number = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const flashAlpha = flashTimer > 0 ? 1 : 0;
  
  ctx.shadowBlur = 20;
  ctx.shadowColor = glowColor;

  ctx.beginPath();

  switch (shape) {
    case 'circle':
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      break;
    case 'triangle':
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
        else ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      }
      ctx.closePath();
      break;
    case 'square':
      ctx.rect(-radius * 0.8, -radius * 0.8, radius * 1.6, radius * 1.6);
      break;
    case 'diamond':
      ctx.moveTo(0, -radius);
      ctx.lineTo(radius * 0.7, 0);
      ctx.lineTo(0, radius);
      ctx.lineTo(-radius * 0.7, 0);
      ctx.closePath();
      break;
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        if (i === 0) ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
        else ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      }
      ctx.closePath();
      break;
    case 'pentagon':
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
        else ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      }
      ctx.closePath();
      break;
    case 'star':
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? radius : radius * 0.45;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      break;
  }

  if (flashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.8})`;
  } else {
    ctx.fillStyle = color + '33';
  }
  ctx.fill();

  ctx.strokeStyle = flashTimer > 0 ? '#ffffff' : color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}