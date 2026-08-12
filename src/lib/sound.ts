let ctx: AudioContext | null = null;
let muted = false;
let droneNodes: { osc: OscillatorNode; gain: GainNode }[] = [];

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
  if (m) stopDrone();
}

export function isMuted() {
  return muted;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.3,
  startTime = 0,
  freqEnd?: number,
) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + startTime;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration);
  }
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function noiseBurst(duration: number, gain = 0.15, startTime = 0) {
  const c = getCtx();
  if (!c) return;
  const bufferSize = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.value = gain;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1000;
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start(c.currentTime + startTime);
}

export function playTap(combo: number) {
  const base = 440;
  const freq = base + Math.min(combo, 40) * 35;
  tone(freq, 0.12, "triangle", 0.18);
  tone(freq * 2, 0.08, "sine", 0.08, 0.01);
}

export function playGolden() {
  tone(880, 0.1, "triangle", 0.2);
  tone(1108, 0.1, "triangle", 0.2, 0.05);
  tone(1318, 0.15, "triangle", 0.2, 0.1);
  tone(1760, 0.25, "sine", 0.15, 0.15);
}

export function playJackpot() {
  const notes = [523, 659, 784, 1046, 1318, 1568, 2093];
  notes.forEach((n, i) => tone(n, 0.15, "triangle", 0.2, i * 0.05));
  notes.forEach((n, i) => tone(n * 2, 0.1, "sine", 0.08, i * 0.05));
}

export function playLevelUp() {
  tone(523, 0.1, "square", 0.12);
  tone(659, 0.1, "square", 0.12, 0.08);
  tone(784, 0.1, "square", 0.12, 0.16);
  tone(1046, 0.3, "triangle", 0.2, 0.24);
}

export function playMiss() {
  tone(180, 0.2, "sawtooth", 0.12, 0, 80);
  noiseBurst(0.1, 0.05);
}

export function playStreakBreak() {
  tone(300, 0.3, "sawtooth", 0.1, 0, 100);
}

export function playAchievement() {
  const notes = [659, 784, 988, 1318];
  notes.forEach((n, i) => tone(n, 0.12, "triangle", 0.18, i * 0.05));
}

export function playTick() {
  tone(1200, 0.04, "sine", 0.08);
}

export function playWhoosh() {
  noiseBurst(0.2, 0.08);
}

export function playGameOver() {
  tone(440, 0.15, "triangle", 0.15);
  tone(370, 0.15, "triangle", 0.15, 0.1);
  tone(294, 0.4, "triangle", 0.15, 0.2);
}

export function playStart() {
  tone(523, 0.08, "triangle", 0.15);
  tone(659, 0.08, "triangle", 0.15, 0.06);
  tone(784, 0.08, "triangle", 0.15, 0.12);
  tone(1046, 0.2, "triangle", 0.2, 0.18);
}

export function playMystery() {
  tone(440, 0.08, "sine", 0.12);
  tone(554, 0.08, "sine", 0.12, 0.06);
  tone(659, 0.08, "sine", 0.12, 0.12);
  tone(880, 0.15, "sine", 0.15, 0.18);
}

export function playShield() {
  tone(300, 0.05, "sine", 0.1);
  tone(600, 0.1, "sine", 0.15, 0.03);
  tone(1200, 0.2, "sine", 0.12, 0.08);
}

export function playShieldBreak() {
  tone(800, 0.1, "sawtooth", 0.12, 0, 200);
  noiseBurst(0.08, 0.06);
}

export function playComeback() {
  const notes = [392, 523, 659, 784, 1046, 1318, 1568, 2093];
  notes.forEach((n, i) => tone(n, 0.1, "triangle", 0.2, i * 0.04));
}

export function playNearMiss() {
  tone(600, 0.06, "sine", 0.08, 0, 300);
}

export function playProgressiveTick() {
  tone(880, 0.03, "sine", 0.06);
  tone(1320, 0.03, "sine", 0.04, 0.01);
}

export function playBigWin() {
  const notes = [523, 659, 784, 1046, 1318, 1568, 2093, 2637];
  notes.forEach((n, i) => tone(n, 0.12, "triangle", 0.2, i * 0.04));
  notes.forEach((n, i) => tone(n * 1.5, 0.08, "sine", 0.06, i * 0.04));
}

export function playHeartbeat() {
  tone(60, 0.08, "sine", 0.2);
  tone(50, 0.12, "sine", 0.15, 0.1);
}

export function startDrone() {
  const c = getCtx();
  if (!c || droneNodes.length > 0) return;
  const freqs = [55, 82.5, 110];
  for (const f of freqs) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.04, c.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    droneNodes.push({ osc, gain });
  }
}

export function stopDrone() {
  const c = ctx;
  if (!c) { droneNodes = []; return; }
  for (const { osc, gain } of droneNodes) {
    gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.3);
    osc.stop(c.currentTime + 0.35);
  }
  droneNodes = [];
}

export function playPrestige() {
  const notes = [523, 659, 784, 1046, 1318, 1568, 2093, 2637, 3136];
  notes.forEach((n, i) => {
    tone(n, 0.2, "triangle", 0.2, i * 0.06);
    tone(n * 0.5, 0.15, "sine", 0.1, i * 0.06);
  });
}

export function playChallenge() {
  tone(659, 0.1, "triangle", 0.15);
  tone(880, 0.1, "triangle", 0.15, 0.08);
  tone(1046, 0.15, "triangle", 0.18, 0.16);
  tone(1318, 0.25, "sine", 0.12, 0.24);
}

// --- EXTREME SOUNDS ---

export function playChain() {
  const notes = [784, 880, 988, 1046, 1175, 1318, 1568, 1760];
  notes.forEach((n, i) => tone(n, 0.06, "triangle", 0.12, i * 0.03));
}

export function playTimeFreeze() {
  tone(2000, 0.5, "sine", 0.08, 0, 200);
  tone(1500, 0.4, "sine", 0.06, 0.05, 100);
  tone(1000, 0.6, "sine", 0.04, 0.1, 50);
}

export function playBoss() {
  tone(110, 0.3, "sawtooth", 0.15);
  tone(165, 0.3, "sawtooth", 0.12, 0.1);
  tone(220, 0.4, "square", 0.1, 0.2);
}

export function playBossDefeated() {
  const notes = [523, 659, 784, 1046, 1318, 1568, 2093, 2637, 3136, 4186];
  notes.forEach((n, i) => tone(n, 0.15, "triangle", 0.2, i * 0.05));
  notes.forEach((n, i) => tone(n * 0.5, 0.1, "sine", 0.08, i * 0.05));
  noiseBurst(0.3, 0.1);
}

export function playRainbow() {
  const notes = [523, 587, 659, 698, 784, 880, 988, 1046, 1175, 1318];
  notes.forEach((n, i) => tone(n, 0.08, "sine", 0.15, i * 0.03));
}

export function playLuckyStreak() {
  const notes = [659, 784, 988, 1175, 1318, 1568, 1760, 2093, 2637];
  notes.forEach((n, i) => tone(n, 0.1, "triangle", 0.18, i * 0.04));
}

export function playRevive() {
  tone(200, 0.3, "sine", 0.15, 0, 400);
  tone(400, 0.3, "sine", 0.15, 0.15, 600);
  tone(600, 0.3, "sine", 0.15, 0.3, 800);
  tone(800, 0.4, "triangle", 0.2, 0.45, 1200);
  tone(1200, 0.5, "triangle", 0.2, 0.6, 1600);
}

export function playMegaCombo() {
  const notes = [523, 659, 784, 1046, 1318, 1568, 2093, 2637, 3136, 4186, 5274];
  notes.forEach((n, i) => {
    tone(n, 0.1, "triangle", 0.2, i * 0.03);
    tone(n * 2, 0.06, "sine", 0.08, i * 0.03);
  });
}

export function playTreasureOpen() {
  const notes = [659, 784, 988, 1318, 1568, 2093, 2637];
  notes.forEach((n, i) => {
    tone(n, 0.12, "triangle", 0.18, i * 0.05);
    tone(n * 1.5, 0.08, "sine", 0.06, i * 0.05);
  });
  noiseBurst(0.15, 0.06);
}

export function playMilestone() {
  tone(523, 0.1, "triangle", 0.15);
  tone(784, 0.1, "triangle", 0.15, 0.08);
  tone(1046, 0.2, "triangle", 0.2, 0.16);
  tone(1318, 0.3, "sine", 0.15, 0.24);
}

export function playSoClose() {
  tone(440, 0.1, "triangle", 0.12);
  tone(392, 0.1, "triangle", 0.12, 0.08);
  tone(370, 0.15, "triangle", 0.1, 0.16);
}

export function playCountdown() {
  tone(880, 0.08, "sine", 0.1);
}

export function playGhost() {
  tone(300, 0.15, "sine", 0.06, 0, 600);
}

export function playStreakBonus() {
  const notes = [784, 988, 1318, 1568];
  notes.forEach((n, i) => tone(n, 0.1, "triangle", 0.15, i * 0.04));
}

export function playChestTease() {
  tone(660, 0.05, "sine", 0.06);
}

export function playChestReveal() {
  tone(880, 0.1, "triangle", 0.15);
  tone(1108, 0.1, "triangle", 0.15, 0.06);
  tone(1318, 0.2, "sine", 0.12, 0.12);
}

export function playSocialNotification() {
  tone(784, 0.06, "sine", 0.08);
  tone(988, 0.08, "sine", 0.06, 0.04);
}

export function playCollectionNew() {
  const notes = [659, 784, 988, 1318, 1568];
  notes.forEach((n, i) => tone(n, 0.1, "triangle", 0.18, i * 0.04));
}

export function playLossChase() {
  tone(440, 0.1, "sawtooth", 0.12, 0, 660);
  tone(660, 0.15, "triangle", 0.15, 0.08, 880);
  tone(880, 0.2, "triangle", 0.18, 0.16);
}

// --- NEW: Chest near-miss sound (rarities below legendary) ---
export function playChestNearMiss() {
  tone(600, 0.15, "sine", 0.12, 0, 400);
  tone(400, 0.2, "sine", 0.1, 0.1, 250);
  tone(250, 0.3, "sine", 0.08, 0.2, 150);
}

// --- NEW: Almost-jackpot frantic build-up sound ---
export function playAlmostJackpot() {
  const notes = [523, 587, 659, 698, 784, 880, 988, 1046, 1175, 1318, 1568, 2093];
  notes.forEach((n, i) => tone(n, 0.06, "square", 0.1, i * 0.03));
}

// --- NEW: Combo grief punishment sound ---
export function playComboGrief() {
  tone(200, 0.3, "sawtooth", 0.15, 0, 100);
  tone(150, 0.4, "sawtooth", 0.12, 0.1, 80);
  noiseBurst(0.2, 0.08);
}

// --- iOS AUDIO UNLOCK ---
// iOS Safari blocks all audio until the AudioContext is created/resumed
// within a user gesture (tap/click). This function must be called from
// a click/tap handler (e.g. handleStartGame, handleOrbTap).
export function unlockAudio() {
  if (muted) return;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return;
    }
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
  // Play a silent buffer to fully unlock the audio pipeline on iOS
  if (ctx && ctx.state === "running") {
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {}
  }
}
