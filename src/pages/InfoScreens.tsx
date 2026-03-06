import { ENEMY_TYPES } from '@/game/enemies';

type Difficulty = 'easy' | 'normal' | 'hard';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'ЛЁГКИЙ',
  normal: 'НОРМАЛЬНЫЙ',
  hard: 'СЛОЖНЫЙ',
};

const SHAPE_EMOJIS: Record<string, string> = {
  circle: '⬤',
  triangle: '▲',
  square: '■',
  diamond: '◆',
  hexagon: '⬡',
  pentagon: '⬠',
  star: '★',
};

interface SettingsScreenProps {
  soundEnabled: boolean;
  difficulty: Difficulty;
  onSoundToggle: () => void;
  onDifficultyChange: (d: Difficulty) => void;
  onBack: () => void;
}

export function SettingsScreen({
  soundEnabled,
  difficulty,
  onSoundToggle,
  onDifficultyChange,
  onBack,
}: SettingsScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 animate-fade-in"
      style={{ background: 'linear-gradient(135deg, #070a0f 0%, #0a0520 100%)' }}>
      <div className="w-full max-w-md">
        <div className="font-orbitron text-3xl font-black neon-purple text-center mb-2 tracking-wider">⚙ НАСТРОЙКИ</div>
        <div className="font-rajdhani text-white/30 text-center text-sm tracking-widest mb-8">ПАРАМЕТРЫ ИГРЫ</div>

        <div className="flex flex-col gap-4">
          {/* Sound */}
          <div className="flex items-center justify-between px-4 py-4 rounded border border-white/10"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div>
              <div className="font-orbitron text-sm font-bold text-white/80 tracking-wider">ЗВУК</div>
              <div className="font-rajdhani text-white/40 text-xs mt-0.5">Звуковые эффекты</div>
            </div>
            <button
              className="w-14 h-7 rounded-full relative transition-all duration-300"
              style={{
                background: soundEnabled ? 'rgba(0,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${soundEnabled ? '#00ffff' : 'rgba(255,255,255,0.2)'}`,
              }}
              onClick={onSoundToggle}>
              <div className="absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300"
                style={{
                  left: soundEnabled ? '1.75rem' : '0.125rem',
                  background: soundEnabled ? '#00ffff' : 'rgba(255,255,255,0.4)',
                  boxShadow: soundEnabled ? '0 0 8px #00ffff' : 'none',
                }} />
            </button>
          </div>

          {/* Difficulty */}
          <div className="px-4 py-4 rounded border border-white/10"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="font-orbitron text-sm font-bold text-white/80 tracking-wider mb-3">СЛОЖНОСТЬ</div>
            <div className="flex gap-2">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => {
                const colors = { easy: '#00ff41', normal: '#00ffff', hard: '#ff0000' };
                const active = difficulty === d;
                return (
                  <button key={d}
                    className="flex-1 py-2 px-2 rounded text-xs font-orbitron font-bold tracking-wider transition-all border"
                    style={{
                      borderColor: active ? colors[d] : 'rgba(255,255,255,0.15)',
                      color: active ? colors[d] : 'rgba(255,255,255,0.35)',
                      background: active ? colors[d] + '18' : 'transparent',
                      boxShadow: active ? `0 0 12px ${colors[d]}44` : 'none',
                    }}
                    onClick={() => onDifficultyChange(d)}>
                    {DIFFICULTY_LABELS[d]}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 font-rajdhani text-xs text-white/30">
              {difficulty === 'easy' && '🟢 Меньше врагов, меньше урон, 12 стрел'}
              {difficulty === 'normal' && '🔵 Стандартный режим, 8 стрел'}
              {difficulty === 'hard' && '🔴 Много быстрых врагов, 5 стрел'}
            </div>
          </div>
        </div>

        <button className="neon-btn py-3 px-6 rounded text-sm font-bold mt-8 w-full" onClick={onBack}>← НАЗАД</button>
      </div>
    </div>
  );
}

interface HelpScreenProps {
  onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center pt-8 px-4 animate-fade-in overflow-auto"
      style={{ background: 'linear-gradient(135deg, #070a0f 0%, #0a0520 100%)', paddingBottom: '2rem' }}>
      <div className="w-full max-w-lg">
        <div className="font-orbitron text-3xl font-black neon-green text-center mb-2 tracking-wider">? СПРАВКА</div>
        <div className="font-rajdhani text-white/30 text-center text-sm tracking-widest mb-6">ПРАВИЛА И ОПИСАНИЕ ВРАГОВ</div>

        <div className="mb-5 px-4 py-4 rounded border border-white/10"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="font-orbitron text-sm font-bold text-white/70 tracking-wider mb-3">🎮 УПРАВЛЕНИЕ</div>
          <div className="flex flex-col gap-2 font-rajdhani text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Мышь</span>
              <span className="text-white/80">Направление лука (прицел)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Клик мыши</span>
              <span className="text-white/80">Выстрел стрелой</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Стрелы = 0</span>
              <span className="text-white/80">Авто-перезарядка 2 сек</span>
            </div>
          </div>
        </div>

        <div className="mb-5 px-4 py-4 rounded border border-white/10"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="font-orbitron text-sm font-bold text-white/70 tracking-wider mb-3">🎯 ЦЕЛЬ</div>
          <div className="font-rajdhani text-sm text-white/60 leading-relaxed">
            Лук стоит в центре и не двигается. Уничтожай волны врагов — фигур, которые летят к тебе.
            Если враг касается лука — теряешь HP. При 0 HP — конец. Очки = очки врага × номер волны.
          </div>
        </div>

        <div className="mb-5">
          <div className="font-orbitron text-sm font-bold text-white/70 tracking-wider mb-3 px-1">👾 ТИПЫ ВРАГОВ</div>
          <div className="flex flex-col gap-2">
            {ENEMY_TYPES.map(e => (
              <div key={e.id} className="flex items-start gap-3 px-3 py-3 rounded border"
                style={{ borderColor: e.color + '33', background: e.color + '08' }}>
                <span className="text-2xl leading-none mt-0.5"
                  style={{ color: e.color, filter: `drop-shadow(0 0 6px ${e.color})` }}>
                  {SHAPE_EMOJIS[e.shape]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-orbitron text-xs font-bold" style={{ color: e.color }}>{e.name}</span>
                    <span className="font-rajdhani text-xs text-white/30">HP:{e.maxHp} · {e.points}оч</span>
                    {e.special && (
                      <span className="font-rajdhani text-xs px-1.5 py-0.5 rounded"
                        style={{ background: e.color + '22', color: e.color }}>
                        {e.special}
                      </span>
                    )}
                  </div>
                  <div className="font-rajdhani text-xs text-white/50">{e.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="neon-btn py-3 px-6 rounded text-sm font-bold w-full" onClick={onBack}>← НАЗАД</button>
      </div>
    </div>
  );
}