interface LeaderEntry {
  name: string;
  score: number;
  wave: number;
  date: string;
}

interface LeaderboardScreenProps {
  leaderboard: LeaderEntry[];
  onBack: () => void;
  onClear: () => void;
}

export default function LeaderboardScreen({ leaderboard, onBack, onClear }: LeaderboardScreenProps) {
  return (
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
          <button className="neon-btn py-3 px-6 rounded text-sm font-bold" onClick={onBack}>← НАЗАД</button>
          {leaderboard.length > 0 && (
            <button className="neon-btn neon-btn-purple py-3 px-6 rounded text-sm font-bold" onClick={onClear}>
              🗑 ОЧИСТИТЬ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
