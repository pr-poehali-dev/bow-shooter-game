import GameCanvas from '@/game/GameCanvas';

type Difficulty = 'easy' | 'normal' | 'hard';

interface GameHudState {
  hp: number;
  maxHp: number;
  score: number;
  wave: number;
  arrows: number;
  maxArrows: number;
  reloading: boolean;
  reloadProgress: number;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'ЛЁГКИЙ',
  normal: 'НОРМАЛЬНЫЙ',
  hard: 'СЛОЖНЫЙ',
};

interface GameScreenProps {
  difficulty: Difficulty;
  soundEnabled: boolean;
  hudState: GameHudState;
  onGameOver: (score: number) => void;
  onStateChange: (state: GameHudState) => void;
  onMenu: () => void;
}

export default function GameScreen({
  difficulty,
  soundEnabled,
  hudState,
  onGameOver,
  onStateChange,
  onMenu,
}: GameScreenProps) {
  const hpPercent = (hudState.hp / hudState.maxHp) * 100;
  const hpColor = hpPercent > 60 ? '#00ff41' : hpPercent > 30 ? '#ffff00' : '#ff0000';

  return (
    <>
      <GameCanvas
        difficulty={difficulty}
        soundEnabled={soundEnabled}
        onGameOver={onGameOver}
        onStateChange={onStateChange}
      />

      {/* HUD top */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-3 pb-2 flex items-center gap-4 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(7,10,15,0.92), transparent)' }}>
        {/* HP */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <div className="flex items-center gap-2">
            <span className="font-orbitron text-xs text-white/50 tracking-widest">HP</span>
            <span className="font-orbitron text-sm font-bold"
              style={{ color: hpColor, textShadow: `0 0 8px ${hpColor}` }}>
              {Math.ceil(hudState.hp)}
            </span>
          </div>
          <div className="w-36 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-100"
              style={{ width: `${hpPercent}%`, background: hpColor, boxShadow: `0 0 8px ${hpColor}` }} />
          </div>
        </div>

        {/* Score */}
        <div className="flex-1 text-center">
          <div className="font-orbitron text-xs text-white/40 tracking-[0.3em]">СЧЁТ</div>
          <div className="font-orbitron text-2xl font-black neon-cyan">{hudState.score.toLocaleString()}</div>
        </div>

        {/* Wave */}
        <div className="text-center">
          <div className="font-orbitron text-xs text-white/40 tracking-[0.3em]">ВОЛНА</div>
          <div className="font-orbitron text-2xl font-black neon-purple">{hudState.wave}</div>
        </div>

        {/* Arrows */}
        <div className="flex flex-col items-end gap-1 min-w-[110px]">
          <div className="font-orbitron text-xs text-white/50 tracking-widest">
            {hudState.reloading ? 'RELOAD...' : 'СТРЕЛЫ'}
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {Array.from({ length: hudState.maxArrows }).map((_, i) => (
              <div key={i} className="w-2 h-4 rounded-sm transition-all duration-150"
                style={{
                  background: i < hudState.arrows ? '#00ffff' : 'rgba(0,255,255,0.1)',
                  boxShadow: i < hudState.arrows ? '0 0 6px #00ffff' : 'none',
                }} />
            ))}
          </div>
          {hudState.reloading && (
            <div className="w-full h-1 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${hudState.reloadProgress * 100}%`, background: '#00ffff', boxShadow: '0 0 6px #00ffff' }} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-3 left-3 font-orbitron text-xs text-white/20 tracking-widest pointer-events-none">
        {DIFFICULTY_LABELS[difficulty]}
      </div>
      <button className="absolute bottom-3 right-3 font-orbitron text-xs text-white/30 hover:text-white/60 tracking-widest transition-colors"
        onClick={onMenu}>
        [ESC] МЕНЮ
      </button>
    </>
  );
}
