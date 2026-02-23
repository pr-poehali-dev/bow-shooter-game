let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(
  freq: number, type: OscillatorType, duration: number,
  gainVal: number, freqEnd?: number, delay = 0
) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    if (freqEnd !== undefined) osc.frequency.linearRampToValueAtTime(freqEnd, ac.currentTime + delay + duration);
    gain.gain.setValueAtTime(gainVal, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration);
  } catch (_) { /* ignore */ }
}

export const sfx = {
  shoot() {
    playTone(440, 'sawtooth', 0.06, 0.18, 220);
    playTone(880, 'sine', 0.04, 0.06, 440);
  },
  hit(hp: number) {
    const f = 180 + hp * 20;
    playTone(f, 'square', 0.08, 0.12, f * 0.6);
  },
  kill(points: number) {
    const base = 300 + Math.min(points * 2, 400);
    playTone(base, 'sine', 0.05, 0.15, base * 1.5);
    playTone(base * 1.5, 'sine', 0.08, 0.10, base * 2.5, 0.04);
  },
  combo(level: number) {
    const freqs = [440, 550, 660, 880, 1100];
    const f = freqs[Math.min(level - 2, freqs.length - 1)];
    playTone(f, 'sine', 0.12, 0.2, f * 1.3);
    playTone(f * 1.5, 'triangle', 0.08, 0.12, f * 2, 0.06);
  },
  damage() {
    playTone(80, 'sawtooth', 0.15, 0.25, 40);
    playTone(160, 'square', 0.08, 0.15, 60, 0.05);
  },
  reload() {
    for (let i = 0; i < 3; i++) {
      playTone(330 + i * 110, 'sine', 0.05, 0.1, 330 + i * 110 + 50, i * 0.06);
    }
  },
  powerup() {
    [440, 550, 660, 880].forEach((f, i) => {
      playTone(f, 'sine', 0.08, 0.15, f * 1.2, i * 0.07);
    });
  },
  waveup() {
    [220, 330, 440, 660].forEach((f, i) => {
      playTone(f, 'triangle', 0.1, 0.18, f * 1.5, i * 0.09);
    });
  },
};
