import { useEffect, useRef, useCallback } from 'react';
import {
  InternalGameState,
  DIFFICULTY,
  tickSpawn,
  tickReload,
  tickEnemies,
  tickProjectiles,
  tickCleanup,
  shootProjectile,
} from './gameLogic';
import {
  renderBackground,
  renderParticles,
  renderProjectiles,
  renderEnemies,
  renderBow,
  renderAim,
  renderReload,
} from './gameRenderer';

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

interface UseGameLoopOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
  animRef: React.MutableRefObject<number>;
  gameStateRef: React.MutableRefObject<InternalGameState>;
  difficulty: 'easy' | 'normal' | 'hard';
  onGameOver: (score: number) => void;
  onStateChange: (state: GameState) => void;
}

export function useGameLoop({
  canvasRef,
  mousePos,
  animRef,
  gameStateRef,
  difficulty,
  onGameOver,
  onStateChange,
}: UseGameLoopOptions) {
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
  }, [onStateChange, gameStateRef]);

  const shoot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    shootProjectile(gameStateRef.current, cx, cy, mousePos.current.x, mousePos.current.y, emitState);
  }, [canvasRef, gameStateRef, mousePos, emitState]);

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

      tickSpawn(s, W, H, diff);
      tickReload(s, cx, cy, emitState);

      if (s.shootCooldown > 0) s.shootCooldown--;
      if (s.bowPulse > 0) s.bowPulse--;

      const deadEnemies = tickEnemies(s, W, H, cx, cy, diff, emitState, onGameOver);
      tickProjectiles(s, W, H, deadEnemies, emitState);
      tickCleanup(s, W, H, deadEnemies);

      // Draw
      renderBackground(ctx, W, H, frame, cx, cy);
      renderParticles(ctx, s.particles);
      renderProjectiles(ctx, s.projectiles);
      renderEnemies(ctx, s.enemies);
      renderBow(ctx, cx, cy, mousePos.current.x, mousePos.current.y, s);
      renderAim(ctx, cx, cy, mousePos.current.x, mousePos.current.y);
      if (s.reloading) renderReload(ctx, cx, cy, s.reloadProgress);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [difficulty, shoot, onGameOver, emitState, canvasRef, gameStateRef, mousePos, animRef]);
}
