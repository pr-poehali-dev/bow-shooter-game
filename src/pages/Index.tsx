import { useState, useEffect, useRef } from 'react';
import GameCanvas from '@/game/GameCanvas';
import { ENEMY_TYPES } from '@/game/enemies';

type Screen = 'menu' | 'game' | 'gameover' | 'leaderboard' | 'settings' | 'help';
type Difficulty = 'easy' | 'normal' | 'hard';

interface LeaderEntry {
  name: string;
  score: number;
  wave: number;
  date: string;
}

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

const SHAPE_EMOJIS: Record<string, string> = {
  circle: '⬤',
  triangle: '▲',
  square: '■',
  diamond: '◆',
  hexagon: '⬡',
  pentagon: '⬠',
  star: '★',
};

export default function Index() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hudState, setHudState] = useState<GameHudState>({
    hp: 100, maxHp: 100, score: 0, wave: 1,
    arrows: 8, maxArrows: 8, reloading: false, reloadProgress: 0,
  });
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [lastScore, setLastScore] = useState(0);
  const [lastWave, setLastWave] = useState(1);
  const [playerName, setPlayerName] = useState('ARCHER');
  const [nameInput, setNameInput] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const menuAnimRef = useRef<number>(0);
  const menuCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('neon_archer_lb');
    if (saved) setLeaderboard(JSON.parse(saved));
    const savedName = localStorage.getItem('neon_archer_name');
    if (savedName) setPlayerName(savedName);
  }, []);

  useEffect(() => {
    if (screen !== 'menu' && screen !== 'gameover') return;
    const canvas = menuCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let f = 0;

    const particles: { x: number; y: number; vx: number; vy: number; r: number; color: string }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        color: ['#00ffff', '#bf00ff', '#00ff41', '#ff006e', '#ffff00'][Math.floor(Math.random() * 5)],
      });
    }

    const loop = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const W = canvas.width, H = canvas.height;
      f++;

      ctx.fillStyle = '#070a0f';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(0,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 50) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 50) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10; ctx.shadowColor = p.color;
        ctx.fill(); ctx.shadowBlur = 0;
      });

      const cx = W / 2, cy = H * 0.36;
      const t = f * 0.025;

      for (let ring = 0; ring < 3; ring++) {
        const r = 50 + ring * 30 + Math.sin(t + ring) * 6;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,255,${0.04 + 0.02 * Math.sin(t)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(cx, cy);
      const bowAngle = Math.sin(t * 0.5) * 0.3;
      ctx.rotate(bowAngle);

      ctx.beginPath();
      ctx.arc(0, 0, 32, -Math.PI * 0.6, Math.PI * 0.6);
      ctx.strokeStyle = `rgba(0,255,255,${0.7 + 0.3 * Math.sin(t * 2)})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 25; ctx.shadowColor = '#00ffff';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(Math.cos(-Math.PI * 0.6) * 32, Math.sin(-Math.PI * 0.6) * 32);
      ctx.lineTo(44, 0);
      ctx.lineTo(Math.cos(Math.PI * 0.6) * 32, Math.sin(Math.PI * 0.6) * 32);
      ctx.strokeStyle = 'rgba(0,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      menuAnimRef.current = requestAnimationFrame(loop);
    };

    menuAnimRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(menuAnimRef.current);
  }, [screen]);

  const handleGameOver = (score: number) => {
    setLastScore(score);
    setLastWave(hudState.wave);
    setShowNameInput(false);
    setNameInput('');
    setScreen('gameover');
  };

  const saveScore = () => {
    const name = (nameInput.trim() || playerName).toUpperCase().slice(0, 10);
    const newEntry: LeaderEntry = {
      name,
      score: lastScore,
      wave: lastWave,
      date: new Date().toLocaleDateString('ru-RU'),
    };
    const updated = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem('neon_archer_lb', JSON.stringify(updated));
    localStorage.setItem('neon_archer_name', name);
    setPlayerName(name);
    setShowNameInput(false);
    setScreen('leaderboard');
  };

  const hpPercent = (hudState.hp / hudState.maxHp) * 100;
  const hpColor = hpPercent > 60 ? '#00ff41' : hpPercent > 30 ? '#ffff00' : '#ff0000';

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#070a0f' }}>

      {/* MENU / GAMEOVER */}
      {(screen === 'menu' || screen === 'gameover') && (
        <div className="absolute inset-0">
          <canvas ref={menuCanvasRef} className="absolute inset-0 w-full h-full" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0 animate-fade-in">
            {screen === 'gameover' && (
              <div className="mb-8 text-center animate-scale-in">
                <div className="font-orbitron font-black neon-pink animate-flicker mb-2"
                  style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
                  ИГРА ОКОНЧЕНА
                </div>
                <div className="font-rajdhani text-xl text-white/60 tracking-widest">
                  СЧЁТ: <span className="neon-cyan font-bold">{lastScore.toLocaleString()}</span>
                  &nbsp;·&nbsp; ВОЛНА: <span className="neon-purple font-bold">{lastWave}</span>
                </div>
              </div>
            )}

            {screen === 'menu' && (
              <>
                <div className="font-orbitron font-black tracking-wider neon-cyan animate-flicker"
                  style={{ fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}>NEON</div>
                <div className="font-orbitron font-black tracking-[0.3em] neon-purple"
                  style={{ fontSize: 'clamp(2.5rem, 9vw, 6rem)' }}>ARCHER</div>
                <div className="font-rajdhani text-sm tracking-[0.4em] text-white/40 mb-10 uppercase">
                  Стрелковая аркада
                </div>
              </>
            )}

            <div className="flex flex-col gap-3 w-64">
              {screen === 'gameover' && !showNameInput && (
                <button className="neon-btn py-3 px-6 rounded font-bold text-sm"
                  onClick={() => setShowNameInput(true)}>
                  💾 СОХРАНИТЬ РЕКОРД
                </button>
              )}
              {screen === 'gameover' && showNameInput && (
                <div className="flex gap-2 animate-scale-in">
                  <input
                    className="flex-1 bg-black/60 border border-cyan-500/50 rounded px-3 py-2 text-cyan-300 font-orbitron text-sm outline-none focus:border-cyan-400"
                    placeholder="ТВОЁ ИМЯ..."
                    maxLength={10}
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && saveScore()}
                    autoFocus
                  />
                  <button className="neon-btn py-2 px-4 rounded text-sm" onClick={saveScore}>OK</button>
                </div>
              )}

              <button className="neon-btn py-4 px-6 rounded font-bold text-sm animate-scale-in"
                style={{ animationDelay: '0.05s' }}
                onClick={() => setScreen('game')}>
                {screen === 'gameover' ? '↺ ИГРАТЬ СНОВА' : '▶ НАЧАТЬ ИГРУ'}
              </button>
              <button className="neon-btn neon-btn-purple py-3 px-6 rounded font-bold text-sm animate-scale-in"
                style={{ animationDelay: '0.1s' }}
                onClick={() => setScreen('leaderboard')}>
                🏆 РЕКОРДЫ
              </button>
              <button className="neon-btn py-3 px-6 rounded font-bold text-sm animate-scale-in"
                style={{ animationDelay: '0.15s' }}
                onClick={() => setScreen('settings')}>
                ⚙ НАСТРОЙКИ
              </button>
              <button className="neon-btn neon-btn-green py-3 px-6 rounded font-bold text-sm animate-scale-in"
                style={{ animationDelay: '0.2s' }}
                onClick={() => setScreen('help')}>
                ? СПРАВКА
              </button>
            </div>

            {screen === 'menu' && (
              <div className="mt-8 font-rajdhani text-white/25 text-xs tracking-widest text-center">
                КЛИК — ВЫСТРЕЛ · МЫШЬ — ПРИЦЕЛ
              </div>
            )}
          </div>
        </div>
      )}

      {/* GAME */}
      {screen === 'game' && (
        <>
          <GameCanvas
            difficulty={difficulty}
            soundEnabled={soundEnabled}
            onGameOver={handleGameOver}
            onStateChange={setHudState}
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
            onClick={() => setScreen('menu')}>
            [ESC] МЕНЮ
          </button>
        </>
      )}

      {/* LEADERBOARD */}
      {screen === 'leaderboard' && (
        <div className="absolute inset-0 flex flex-col items-center pt-12 px-4 animate-fade-in overflow-auto"
          style={{ background: 'linear-gradient(135deg, #070a0f 0%, #0a0520 100%)', paddingBottom: '2rem' }}>
          <div className="w-full max-w-md">
            <div className="font-orbitron text-3xl font-black neon-cyan text-center mb-2 tracking-wider">🏆 РЕКОРДЫ</div>
            <div className="font-rajdhani text-white/30 text-center text-sm tracking-widest mb-8">ТОП-10</div>

            {leaderboard.length === 0 ? (
              <div className="text-center font-rajdhani text-white/30 text-lg py-16">
                Пока нет рекордов.<br />Сыграй первым!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {leaderboard.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded border"
                    style={{
                      borderColor: i === 0 ? '#ffff00' : i === 1 ? '#aaaaaa' : i === 2 ? '#ff6600' : 'rgba(0,255,255,0.15)',
                      background: i === 0 ? 'rgba(255,255,0,0.05)' : 'rgba(0,255,255,0.02)',
                      boxShadow: i === 0 ? '0 0 15px rgba(255,255,0,0.15)' : 'none',
                    }}>
                    <span className="font-orbitron text-lg font-black w-8 text-center"
                      style={{ color: i === 0 ? '#ffff00' : i === 1 ? '#aaaaaa' : i === 2 ? '#ff6600' : '#ffffff44' }}>
                      {i + 1}
                    </span>
                    <span className="font-orbitron text-sm font-bold text-white flex-1 tracking-wider">{e.name}</span>
                    <span className="font-rajdhani text-xs text-white/40">в.{e.wave}</span>
                    <span className="font-orbitron text-base font-black neon-cyan">{e.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-8 justify-center">
              <button className="neon-btn py-3 px-6 rounded text-sm font-bold" onClick={() => setScreen('menu')}>← НАЗАД</button>
              {leaderboard.length > 0 && (
                <button className="neon-btn neon-btn-purple py-3 px-6 rounded text-sm font-bold"
                  onClick={() => { setLeaderboard([]); localStorage.removeItem('neon_archer_lb'); }}>
                  🗑 ОЧИСТИТЬ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {screen === 'settings' && (
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
                  onClick={() => setSoundEnabled(v => !v)}>
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
                        onClick={() => setDifficulty(d)}>
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

            <button className="neon-btn py-3 px-6 rounded text-sm font-bold mt-8 w-full"
              onClick={() => setScreen('menu')}>← НАЗАД</button>
          </div>
        </div>
      )}

      {/* HELP */}
      {screen === 'help' && (
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
                  <span className="text-white/80">Авто-перезарядка 3 сек</span>
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

            <button className="neon-btn py-3 px-6 rounded text-sm font-bold w-full"
              onClick={() => setScreen('menu')}>← НАЗАД</button>
          </div>
        </div>
      )}
    </div>
  );
}
