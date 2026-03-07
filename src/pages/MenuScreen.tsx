import { useEffect, useRef } from "react";

type Screen =
  | "menu"
  | "game"
  | "gameover"
  | "leaderboard"
  | "settings"
  | "help";

const RAINBOW_COLORS = [
  "#ff0000",
  "#ff7700",
  "#ffff00",
  "#00ff41",
  "#00ffff",
  "#0066ff",
  "#bf00ff",
];

function StartButtonParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
      life: number;
    }[]
  >([]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const loop = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      if (Math.random() < 0.5 && particlesRef.current.length < 45) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: h + 4,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -(1.8 + Math.random() * 2.2),
          r: 2 + Math.random() * 3,
          color:
            RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)],
          life: 1,
        });
      }

      ctx.clearRect(0, 0, w, h);
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.018;
        return p.y > -15 && p.life > 0;
      });

      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.shadowBlur = 14;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-full h-14 pointer-events-none"
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

interface MenuScreenProps {
  screen: "menu" | "gameover";
  lastScore: number;
  lastWave: number;
  showNameInput: boolean;
  nameInput: string;
  onNameInputChange: (value: string) => void;
  onSaveScore: () => void;
  onShowNameInput: () => void;
  onNavigate: (screen: Screen) => void;
}

export default function MenuScreen({
  screen,
  lastScore,
  lastWave,
  showNameInput,
  nameInput,
  onNameInputChange,
  onSaveScore,
  onShowNameInput,
  onNavigate,
}: MenuScreenProps) {
  const menuAnimRef = useRef<number>(0);
  const menuCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = menuCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let f = 0;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
    }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        color: ["#00ffff", "#bf00ff", "#00ff41", "#ff006e", "#ffff00"][
          Math.floor(Math.random() * 5)
        ],
      });
    }

    const loop = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const W = canvas.width,
        H = canvas.height;
      f++;

      ctx.fillStyle = "#070a0f";
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(0,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 50) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 50) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const cx = W / 2,
        cy = H * 0.36;
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
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#00ffff";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(Math.cos(-Math.PI * 0.6) * 32, Math.sin(-Math.PI * 0.6) * 32);
      ctx.lineTo(44, 0);
      ctx.lineTo(Math.cos(Math.PI * 0.6) * 32, Math.sin(Math.PI * 0.6) * 32);
      ctx.strokeStyle = "rgba(0,255,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      menuAnimRef.current = requestAnimationFrame(loop);
    };

    menuAnimRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(menuAnimRef.current);
  }, []);

  return (
    <div className="absolute inset-0">
      <canvas ref={menuCanvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0 animate-fade-in">
        {screen === "gameover" && (
          <div className="mb-8 text-center animate-scale-in">
            <div
              className="font-orbitron font-black neon-pink animate-flicker mb-2"
              style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
            >
              ИГРА ОКОНЧЕНА
            </div>
            <div className="font-rajdhani text-xl text-white/60 tracking-widest">
              СЧЁТ:{" "}
              <span className="neon-cyan font-bold">
                {lastScore.toLocaleString()}
              </span>
              &nbsp;·&nbsp; ВОЛНА:{" "}
              <span className="neon-purple font-bold">{lastWave}</span>
            </div>
          </div>
        )}

        {screen === "menu" && (
          <>
            <div
              className="font-orbitron font-black tracking-wider neon-cyan animate-flicker title-line-float opacity-0"
              style={{
                fontSize: "clamp(2rem, 7vw, 4.5rem)",
                animationDelay: "0.1s, 0.7s",
                animationFillMode: "forwards, both",
              }}
            >
              NEON
            </div>
            <div
              className="font-orbitron font-black tracking-[0.15em] title-space title-line-float opacity-0"
              style={{
                fontSize: "clamp(2rem, 6.5vw, 4.5rem)",
                animationDelay: "0.25s, 0.85s",
                animationFillMode: "forwards, both",
              }}
            >
              SPACE
            </div>
            <div
              className="font-orbitron font-black tracking-[0.3em] neon-cyan title-line-float opacity-0"
              style={{
                fontSize: "clamp(2.5rem, 9vw, 6rem)",
                animationDelay: "0.4s, 1s",
                animationFillMode: "forwards, both",
              }}
            >
              ARCHER
            </div>
            <div
              className="font-rajdhani text-sm tracking-[0.4em] text-white/40 mb-10 uppercase title-line opacity-0"
              style={{ animationDelay: "0.55s", animationFillMode: "forwards" }}
            >
              Космическая аркада
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 w-64">
          {screen === "gameover" && !showNameInput && (
            <button
              className="neon-btn py-3 px-6 rounded font-bold text-sm"
              onClick={onShowNameInput}
            >
              💾 СОХРАНИТЬ РЕКОРД
            </button>
          )}
          {screen === "gameover" && showNameInput && (
            <div className="flex gap-2 animate-scale-in">
              <input
                className="flex-1 bg-black/60 border border-cyan-500/50 rounded px-3 py-2 text-cyan-300 font-orbitron text-sm outline-none focus:border-cyan-400"
                placeholder="ТВОЁ ИМЯ..."
                maxLength={10}
                value={nameInput}
                onChange={(e) =>
                  onNameInputChange(e.target.value.toUpperCase())
                }
                onKeyDown={(e) => e.key === "Enter" && onSaveScore()}
                autoFocus
              />
              <button
                className="neon-btn py-2 px-4 rounded text-sm"
                onClick={onSaveScore}
              >
                OK
              </button>
            </div>
          )}

          <div className="relative overflow-visible">
            <button
              className="neon-btn-rainbow py-4 px-6 rounded font-bold text-sm animate-scale-in w-full"
              style={{ animationDelay: "0.05s" }}
              onClick={() => onNavigate("game")}
            >
              {screen === "gameover" ? "↺ ИГРАТЬ СНОВА" : "▶ НАЧАТЬ ИГРУ"}
            </button>
            <StartButtonParticles />
          </div>
          <button
            className="neon-btn neon-btn-purple py-3 px-6 rounded font-bold text-sm animate-scale-in"
            style={{ animationDelay: "0.1s" }}
            onClick={() => onNavigate("leaderboard")}
          >
            🏆 РЕКОРДЫ
          </button>
          <button
            className="neon-btn py-3 px-6 rounded font-bold text-sm animate-scale-in"
            style={{ animationDelay: "0.15s" }}
            onClick={() => onNavigate("settings")}
          >
            ⚙ НАСТРОЙКИ
          </button>
          <button
            className="neon-btn neon-btn-green py-3 px-6 rounded font-bold text-sm animate-scale-in"
            style={{ animationDelay: "0.2s" }}
            onClick={() => onNavigate("help")}
          >
            ? СПРАВКА
          </button>
        </div>

        {screen === "menu" && (
          <div className="mt-8 font-rajdhani text-white/25 text-xs tracking-widest text-center">
            КЛИК — ВЫСТРЕЛ · МЫШЬ — ПРИЦЕЛ
          </div>
        )}
      </div>
    </div>
  );
}
