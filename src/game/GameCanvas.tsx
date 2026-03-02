import { useRef } from 'react';
import { InternalGameState, DIFFICULTY } from './gameLogic';
import { useGameLoop } from './useGameLoop';

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

export default function GameCanvas({ difficulty, onGameOver, onStateChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const gameStateRef = useRef<InternalGameState>({
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
    enemies: [],
    projectiles: [],
    particles: [],
    alive: true,
    bowPulse: 0,
    canShoot: true,
    shootCooldown: 0,
  });

  useGameLoop({
    canvasRef,
    mousePos,
    animRef,
    gameStateRef,
    difficulty,
    onGameOver,
    onStateChange,
  });

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: 'none' }}
    />
  );
}
