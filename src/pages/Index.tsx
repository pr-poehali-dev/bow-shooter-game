import { useState, useEffect } from 'react';
import MenuScreen from './MenuScreen';
import GameScreen from './GameScreen';
import LeaderboardScreen from './LeaderboardScreen';
import { SettingsScreen, HelpScreen } from './InfoScreens';

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

  useEffect(() => {
    const saved = localStorage.getItem('neon_archer_lb');
    if (saved) setLeaderboard(JSON.parse(saved));
    const savedName = localStorage.getItem('neon_archer_name');
    if (savedName) setPlayerName(savedName);
  }, []);

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

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#070a0f' }}>

      {(screen === 'menu' || screen === 'gameover') && (
        <MenuScreen
          screen={screen}
          lastScore={lastScore}
          lastWave={lastWave}
          showNameInput={showNameInput}
          nameInput={nameInput}
          onNameInputChange={setNameInput}
          onSaveScore={saveScore}
          onShowNameInput={() => setShowNameInput(true)}
          onNavigate={setScreen}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          difficulty={difficulty}
          soundEnabled={soundEnabled}
          hudState={hudState}
          onGameOver={handleGameOver}
          onStateChange={setHudState}
          onMenu={() => setScreen('menu')}
        />
      )}

      {screen === 'leaderboard' && (
        <LeaderboardScreen
          leaderboard={leaderboard}
          onBack={() => setScreen('menu')}
          onClear={() => { setLeaderboard([]); localStorage.removeItem('neon_archer_lb'); }}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          soundEnabled={soundEnabled}
          difficulty={difficulty}
          onSoundToggle={() => setSoundEnabled(v => !v)}
          onDifficultyChange={setDifficulty}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'help' && (
        <HelpScreen onBack={() => setScreen('menu')} />
      )}

    </div>
  );
}
