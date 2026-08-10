import { useCallback, useEffect, useRef, useState } from "react";
import {
  playTap,
  playGolden,
  playJackpot,
  playLevelUp,
  playMiss,
  playStreakBreak,
  playAchievement,
  playGameOver,
  playStart,
  playWhoosh,
  playMystery,
  playShield,
  playShieldBreak,
  playComeback,
  playNearMiss,
  playProgressiveTick,
  playBigWin,
  playPrestige,
  playChallenge,
  playHeartbeat,
  startDrone,
  stopDrone,
} from "./sound";

export type OrbType =
  | "normal"
  | "golden"
  | "bomb"
  | "bonus"
  | "frenzy"
  | "mystery"
  | "shield"
  | "comeback";

export interface Orb {
  id: number;
  x: number;
  y: number;
  type: OrbType;
  size: number;
  bornAt: number;
  ttl: number;
  pulse: number;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_tap", title: "Primeiro Toque", desc: "Seu primeiro orb!", icon: "✨" },
  { id: "combo_10", title: "Combo x10", desc: "Dez seguidos!", icon: "🔥" },
  { id: "combo_25", title: "Combo x25", desc: "Imparável!", icon: "⚡" },
  { id: "combo_50", title: "Combo x50", desc: "Lendário!", icon: "💎" },
  { id: "combo_100", title: "Combo x100", desc: "IMORTAL!", icon: "🔮" },
  { id: "golden_1", title: "Dourado!", desc: "Primeiro orb dourado", icon: "🌟" },
  { id: "golden_10", title: "Colecionador", desc: "10 orbes dourados", icon: "👑" },
  { id: "golden_50", title: "Midas", desc: "50 orbes dourados", icon: "🪙" },
  { id: "level_5", title: "Nível 5", desc: "Subindo de nível!", icon: "🚀" },
  { id: "level_10", title: "Nível 10", desc: "Mestre dos orbes", icon: "🏆" },
  { id: "level_20", title: "Nível 20", desc: "Lenda viva", icon: "⭐" },
  { id: "score_1k", title: "1.000 pontos", desc: "Marcou mil!", icon: "💯" },
  { id: "score_10k", title: "10.000 pontos", desc: "Lenda absoluta", icon: "🎖️" },
  { id: "score_50k", title: "50.000 pontos", desc: "Além da lenda", icon: "🥇" },
  { id: "frenzy_1", title: "FRENESI!", desc: "Modo frenesi ativado", icon: "🌀" },
  { id: "jackpot_1", title: "JACKPOT!", desc: "Ganhou o jackpot", icon: "🎰" },
  { id: "mystery_1", title: "Mistério!", desc: "Orb misterioso revelado", icon: "❓" },
  { id: "shield_1", title: "Escudo!", desc: "Proteção ativada", icon: "🛡️" },
  { id: "comeback_1", title: "Comeback!", desc: "Recuperou do perigo", icon: "💥" },
  { id: "prestige_1", title: "PRESTÍGIO!", desc: "Renasceu mais forte", icon: "🌟" },
  { id: "challenge_done", title: "Desafio Diário!", desc: "Completou o desafio de hoje", icon: "🎯" },
];

const REWARD_WORDS = ["BOM!", "ÓTIMO!", "INCRÍVEL!", "PERFEITO!", "INSANO!", "LENDA!", "DEUS!"];

interface GameCallbacks {
  onBurst: (x: number, y: number, count: number, color: string, opts?: any) => void;
  onFloatText: (x: number, y: number, text: string, color: string, size?: number) => void;
  onShockwave: (x: number, y: number, maxRadius: number, color: string) => void;
  onAchievement: (a: Achievement) => void;
  onScreenShake: (intensity: number) => void;
  onFlash: (color: string) => void;
}

export function useGame(callbacks: GameCallbacks) {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [frenzy, setFrenzy] = useState(false);
  const [frenzyTime, setFrenzyTime] = useState(0);
  const [totalTaps, setTotalTaps] = useState(0);
  const [totalGolden, setTotalGolden] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [prestige, setPrestige] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [totalJackpots, setTotalJackpots] = useState(0);
  const [hasShield, setHasShield] = useState(false);
  const [comebackActive, setComebackActive] = useState(false);
  const [comebackTime, setComebackTime] = useState(0);
  const [progressiveJackpot, setProgressiveJackpot] = useState(0);
  const [challengeTarget, setChallengeTarget] = useState(0);
  const [challengeDone, setChallengeDone] = useState(false);
  const [newRecord, setNewRecord] = useState(false);

  const orbIdRef = useRef(0);
  const comboTimerRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const frenzyTimerRef = useRef<number | null>(null);
  const comebackTimerRef = useRef<number | null>(null);
  const droneRef = useRef(false);
  const unlockedRef = useRef<Set<string>>(new Set());
  const stateRef = useRef(gameState);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const comboRef = useRef(0);
  const livesRef = useRef(3);
  const frenzyRef = useRef(false);
  const totalTapsRef = useRef(0);
  const totalGoldenRef = useRef(0);
  const highScoreRef = useRef(0);
  const prestigeRef = useRef(0);
  const totalJackpotsRef = useRef(0);
  const hasShieldRef = useRef(false);
  const comebackRef = useRef(false);
  const progressiveRef = useRef(0);
  const challengeTargetRef = useRef(0);
  const challengeDoneRef = useRef(false);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const syncRefs = () => {
    stateRef.current = gameState;
    scoreRef.current = score;
    levelRef.current = level;
    comboRef.current = combo;
    livesRef.current = lives;
    frenzyRef.current = frenzy;
    totalTapsRef.current = totalTaps;
    totalGoldenRef.current = totalGolden;
    highScoreRef.current = highScore;
    prestigeRef.current = prestige;
    totalJackpotsRef.current = totalJackpots;
    hasShieldRef.current = hasShield;
    comebackRef.current = comebackActive;
    progressiveRef.current = progressiveJackpot;
    challengeTargetRef.current = challengeTarget;
    challengeDoneRef.current = challengeDone;
  };
  syncRefs();

  const unlock = useCallback((id: string) => {
    if (unlockedRef.current.has(id)) return;
    unlockedRef.current.add(id);
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) {
      playAchievement();
      callbacksRef.current.onAchievement(a);
    }
  }, []);

  const checkAchievements = useCallback(() => {
    if (totalTapsRef.current >= 1) unlock("first_tap");
    if (comboRef.current >= 10) unlock("combo_10");
    if (comboRef.current >= 25) unlock("combo_25");
    if (comboRef.current >= 50) unlock("combo_50");
    if (comboRef.current >= 100) unlock("combo_100");
    if (totalGoldenRef.current >= 1) unlock("golden_1");
    if (totalGoldenRef.current >= 10) unlock("golden_10");
    if (totalGoldenRef.current >= 50) unlock("golden_50");
    if (levelRef.current >= 5) unlock("level_5");
    if (levelRef.current >= 10) unlock("level_10");
    if (levelRef.current >= 20) unlock("level_20");
    if (scoreRef.current >= 1000) unlock("score_1k");
    if (scoreRef.current >= 10000) unlock("score_10k");
    if (scoreRef.current >= 50000) unlock("score_50k");
    if (challengeDoneRef.current) unlock("challenge_done");
  }, [unlock]);

  const spawnOrb = useCallback(() => {
    if (stateRef.current !== "playing") return;
    const lvl = levelRef.current;
    const r = Math.random();
    let type: OrbType = "normal";

    const goldenChance = 0.06 + lvl * 0.003;
    const bombChance = Math.min(0.04 + lvl * 0.005, 0.16);
    const bonusChance = 0.05;
    const frenzyChance = frenzyRef.current ? 0 : 0.01;
    const mysteryChance = 0.03;
    const shieldChance = hasShieldRef.current ? 0 : 0.008;
    const comebackChance = livesRef.current <= 1 && !comebackRef.current ? 0.025 : 0;

    let acc = 0;
    if (r < (acc += goldenChance)) type = "golden";
    else if (r < (acc += bombChance)) type = "bomb";
    else if (r < (acc += bonusChance)) type = "bonus";
    else if (r < (acc += frenzyChance)) type = "frenzy";
    else if (r < (acc += mysteryChance)) type = "mystery";
    else if (r < (acc += shieldChance)) type = "shield";
    else if (r < (acc += comebackChance)) type = "comeback";

    const size =
      type === "golden" ? 70 :
      type === "bomb" ? 60 :
      type === "bonus" ? 65 :
      type === "frenzy" ? 75 :
      type === "mystery" ? 68 :
      type === "shield" ? 72 :
      type === "comeback" ? 78 :
      55 + Math.random() * 20;

    const ttl =
      type === "bomb" ? Math.max(700, 2200 - lvl * 60) :
      type === "golden" ? Math.max(700, 1400 - lvl * 30) :
      type === "comeback" ? 2500 :
      Math.max(700, 1800 - lvl * 50);

    const margin = 8;
    const orb: Orb = {
      id: orbIdRef.current++,
      x: margin + Math.random() * (100 - margin * 2),
      y: margin + Math.random() * (100 - margin * 2),
      type,
      size,
      bornAt: performance.now(),
      ttl,
      pulse: Math.random() * Math.PI * 2,
    };
    setOrbs((prev) => [...prev, orb]);
  }, []);

  const startSpawnLoop = useCallback(() => {
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    const tick = () => {
      if (stateRef.current !== "playing") return;
      const lvl = levelRef.current;
      const baseInterval = Math.max(300, 900 - lvl * 40);
      const interval = frenzyRef.current ? baseInterval * 0.4 : baseInterval;
      spawnOrb();
      spawnTimerRef.current = window.setTimeout(tick, interval + Math.random() * 200);
    };
    tick();
  }, [spawnOrb]);

  const resetCombo = useCallback((broke: boolean) => {
    if (comboRef.current > 3 && broke) {
      playStreakBreak();
    }
    setCombo(0);
    comboRef.current = 0;
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }
  }, []);

  const endGame = useCallback(() => {
    setGameState("gameover");
    stateRef.current = "gameover";
    playGameOver();
    stopDrone();
    droneRef.current = false;
    if (spawnTimerRef.current) { clearTimeout(spawnTimerRef.current); spawnTimerRef.current = null; }
    if (frenzyTimerRef.current) { clearInterval(frenzyTimerRef.current); frenzyTimerRef.current = null; }
    if (comebackTimerRef.current) { clearInterval(comebackTimerRef.current); comebackTimerRef.current = null; }
    if (comboTimerRef.current) { clearTimeout(comboTimerRef.current); comboTimerRef.current = null; }
    setOrbs([]);
    setFrenzy(false);
    frenzyRef.current = false;
    setComebackActive(false);
    comebackRef.current = false;
    setHasShield(false);
    hasShieldRef.current = false;

    const finalScore = scoreRef.current;
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      highScoreRef.current = finalScore;
      setNewRecord(true);
    }
    setTotalGames((g) => g + 1);

    // Prestige check: at 20k score, auto-prestige
    if (finalScore >= 20000) {
      setPrestige((p) => p + 1);
      prestigeRef.current += 1;
      playPrestige();
      unlock("prestige_1");
    }
  }, [unlock]);

  const startFrenzy = useCallback(() => {
    setFrenzy(true);
    frenzyRef.current = true;
    setFrenzyTime(8);
    playWhoosh();
    callbacksRef.current.onFlash("rgba(255,200,0,0.25)");
    unlock("frenzy_1");
    if (frenzyTimerRef.current) clearInterval(frenzyTimerRef.current);
    frenzyTimerRef.current = window.setInterval(() => {
      setFrenzyTime((t) => {
        if (t <= 1) {
          setFrenzy(false);
          frenzyRef.current = false;
          if (frenzyTimerRef.current) clearInterval(frenzyTimerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [unlock]);

  const startComeback = useCallback(() => {
    setComebackActive(true);
    comebackRef.current = true;
    setComebackTime(6);
    playComeback();
    callbacksRef.current.onFlash("rgba(34,197,94,0.25)");
    callbacksRef.current.onScreenShake(12);
    unlock("comeback_1");
    if (comebackTimerRef.current) clearInterval(comebackTimerRef.current);
    comebackTimerRef.current = window.setInterval(() => {
      setComebackTime((t) => {
        if (t <= 1) {
          setComebackActive(false);
          comebackRef.current = false;
          if (comebackTimerRef.current) clearInterval(comebackTimerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [unlock]);

  const tapOrb = useCallback(
    (orb: Orb, clientX: number, clientY: number) => {
      if (stateRef.current !== "playing") return;
      const rect = document.getElementById("game-area")?.getBoundingClientRect();
      if (!rect) return;
      const px = ((clientX - rect.left) / rect.width) * 100;
      const py = ((clientY - rect.top) / rect.height) * 100;

      setOrbs((prev) => prev.filter((o) => o.id !== orb.id));

      if (orb.type === "bomb") {
        if (hasShieldRef.current) {
          playShieldBreak();
          setHasShield(false);
          hasShieldRef.current = false;
          callbacksRef.current.onBurst(px, py, 25, "#3b82f6", { speed: 5, size: 4, shape: "square" });
          callbacksRef.current.onShockwave(px, py, 180, "#3b82f6");
          callbacksRef.current.onFloatText(px, py, "ESCUDO QUEBROU!", "#3b82f6", 28);
          callbacksRef.current.onScreenShake(8);
          return;
        }
        playMiss();
        callbacksRef.current.onBurst(px, py, 30, "#ef4444", { speed: 6, size: 5, shape: "square" });
        callbacksRef.current.onShockwave(px, py, 200, "#ef4444");
        callbacksRef.current.onFloatText(px, py, "BOOM!", "#ef4444", 32);
        callbacksRef.current.onScreenShake(15);
        resetCombo(true);
        const newLives = livesRef.current - 1;
        setLives(newLives);
        livesRef.current = newLives;
        if (newLives <= 1 && !droneRef.current) {
          startDrone();
          droneRef.current = true;
        }
        if (newLives <= 0) {
          endGame();
        }
        return;
      }

      // Combo
      const newCombo = comboRef.current + 1;
      setCombo(newCombo);
      comboRef.current = newCombo;
      if (newCombo > bestCombo) setBestCombo(newCombo);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = window.setTimeout(() => resetCombo(true), 1600);

      // Progressive jackpot grows with every tap
      const progAdd = 2 + Math.floor(newCombo / 10);
      const newProg = progressiveRef.current + progAdd;
      setProgressiveJackpot(newProg);
      progressiveRef.current = newProg;
      if (newCombo % 10 === 0) playProgressiveTick();

      let basePoints = 10;
      let color = "#22d3ee";
      let particleCount = 12;
      let particleShape: "circle" | "star" | "square" = "circle";
      let floatText = "";

      if (orb.type === "golden") {
        basePoints = 100;
        color = "#fbbf24";
        particleCount = 30;
        particleShape = "star";
        playGolden();
        const newGolden = totalGoldenRef.current + 1;
        setTotalGolden(newGolden);
        totalGoldenRef.current = newGolden;
        callbacksRef.current.onShockwave(px, py, 120, "#fbbf24");
        floatText = "+100";
      } else if (orb.type === "bonus") {
        basePoints = 50;
        color = "#a855f7";
        particleCount = 20;
        particleShape = "square";
        playTap(newCombo);
        floatText = "+50";
      } else if (orb.type === "frenzy") {
        startFrenzy();
        basePoints = 30;
        color = "#f97316";
        particleCount = 40;
        particleShape = "star";
        floatText = "FRENESI!";
        callbacksRef.current.onShockwave(px, py, 250, "#f97316");
        callbacksRef.current.onScreenShake(10);
      } else if (orb.type === "mystery") {
        // Random reward: 10, 50, 100, 200, or jackpot
        const outcomes = [
          { pts: 10, w: 40, label: "+10" },
          { pts: 50, w: 25, label: "+50" },
          { pts: 100, w: 18, label: "+100!" },
          { pts: 200, w: 12, label: "+200!!" },
          { pts: 500, w: 5, label: "MEGA +500!" },
        ];
        const totalW = outcomes.reduce((s, o) => s + o.w, 0);
        let roll = Math.random() * totalW;
        let chosen = outcomes[0];
        for (const o of outcomes) {
          roll -= o.w;
          if (roll <= 0) { chosen = o; break; }
        }
        basePoints = chosen.pts;
        color = chosen.pts >= 200 ? "#fbbf24" : "#e879f9";
        particleCount = 15 + chosen.pts / 10;
        particleShape = "star";
        playMystery();
        floatText = chosen.label;
        callbacksRef.current.onShockwave(px, py, 80 + chosen.pts / 5, color);
        unlock("mystery_1");
      } else if (orb.type === "shield") {
        setHasShield(true);
        hasShieldRef.current = true;
        playShield();
        color = "#3b82f6";
        particleCount = 25;
        particleShape = "circle";
        floatText = "ESCUDO!";
        callbacksRef.current.onShockwave(px, py, 150, "#3b82f6");
        unlock("shield_1");
      } else if (orb.type === "comeback") {
        startComeback();
        basePoints = 50;
        color = "#22c55e";
        particleCount = 35;
        particleShape = "star";
        floatText = "COMEBACK!";
        callbacksRef.current.onShockwave(px, py, 250, "#22c55e");
        callbacksRef.current.onScreenShake(12);
      } else {
        playTap(newCombo);
      }

      const comboMult = 1 + Math.floor(newCombo / 5) * 0.5;
      const frenzyMult = frenzyRef.current ? 2 : 1;
      const comebackMult = comebackRef.current ? 3 : 1;
      const prestigeMult = 1 + prestigeRef.current * 0.1;
      const points = Math.floor(basePoints * comboMult * frenzyMult * comebackMult * prestigeMult);

      const newScore = scoreRef.current + points;
      setScore(newScore);
      scoreRef.current = newScore;

      const newTaps = totalTapsRef.current + 1;
      setTotalTaps(newTaps);
      totalTapsRef.current = newTaps;

      callbacksRef.current.onBurst(px, py, particleCount, color, {
        speed: 5,
        size: 4,
        shape: particleShape,
      });

      if (floatText) {
        callbacksRef.current.onFloatText(px, py, floatText, color, orb.type === "mystery" ? 32 : 30);
      }

      // Random reward word at high combos
      if (newCombo >= 10 && newCombo % 5 === 0) {
        const word = REWARD_WORDS[Math.min(Math.floor(newCombo / 10), REWARD_WORDS.length - 1)];
        callbacksRef.current.onFloatText(px, py - 30, word, color, 22);
        callbacksRef.current.onScreenShake(5);
      }

      // Jackpot at combo milestones — now includes progressive jackpot
      if (newCombo > 0 && newCombo % 15 === 0) {
        const baseJackpot = 500 * (newCombo / 15);
        const totalJackpot = baseJackpot + progressiveRef.current;
        setScore((s) => {
          const ns = s + totalJackpot;
          scoreRef.current = ns;
          return ns;
        });
        setProgressiveJackpot(0);
        progressiveRef.current = 0;
        playJackpot();
        callbacksRef.current.onFloatText(px, py - 50, `JACKPOT +${totalJackpot}`, "#fbbf24", 44);
        callbacksRef.current.onShockwave(px, py, 300, "#fbbf24");
        callbacksRef.current.onFlash("rgba(251,191,36,0.2)");
        callbacksRef.current.onScreenShake(20);
        unlock("jackpot_1");
        const newJp = totalJackpotsRef.current + 1;
        setTotalJackpots(newJp);
        totalJackpotsRef.current = newJp;
      }

      // Level up every 500 points
      const newLevel = Math.floor(newScore / 500) + 1;
      if (newLevel > levelRef.current) {
        setLevel(newLevel);
        levelRef.current = newLevel;
        playLevelUp();
        callbacksRef.current.onFloatText(50, 30, `NÍVEL ${newLevel}`, "#22d3ee", 48);
        callbacksRef.current.onFlash("rgba(34,211,238,0.15)");
        callbacksRef.current.onScreenShake(8);
      }

      // Daily challenge check
      if (!challengeDoneRef.current && challengeTargetRef.current > 0 && newScore >= challengeTargetRef.current) {
        setChallengeDone(true);
        challengeDoneRef.current = true;
        playChallenge();
        callbacksRef.current.onFloatText(50, 25, "DESAFIO COMPLETO!", "#22c55e", 40);
        callbacksRef.current.onFlash("rgba(34,197,94,0.2)");
        callbacksRef.current.onScreenShake(10);
        unlock("challenge_done");
      }

      checkAchievements();
    },
    [bestCombo, resetCombo, endGame, startFrenzy, startComeback, checkAchievements, unlock],
  );

  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLevel(1);
    setLives(3);
    setOrbs([]);
    setFrenzy(false);
    setFrenzyTime(0);
    setTotalTaps(0);
    setTotalGolden(0);
    setHasShield(false);
    setComebackActive(false);
    setComebackTime(0);
    setProgressiveJackpot(0);
    setNewRecord(false);
    scoreRef.current = 0;
    comboRef.current = 0;
    levelRef.current = 1;
    livesRef.current = 3;
    frenzyRef.current = false;
    totalTapsRef.current = 0;
    totalGoldenRef.current = 0;
    hasShieldRef.current = false;
    comebackRef.current = false;
    progressiveRef.current = 0;
    droneRef.current = false;
    stopDrone();
    setGameState("playing");
    stateRef.current = "playing";
    playStart();
    startSpawnLoop();
  }, [startSpawnLoop]);

  // Expire orbs that reach their ttl — with near-miss feedback
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      const now = performance.now();
      setOrbs((prev) => {
        const survivors: Orb[] = [];
        let missedNormal = false;
        let nearMiss = false;
        for (const o of prev) {
          if (now - o.bornAt < o.ttl) {
            survivors.push(o);
          } else {
            if (o.type === "normal" || o.type === "golden" || o.type === "bonus") {
              missedNormal = true;
              if (o.type === "golden") nearMiss = true;
            }
          }
        }
        if (nearMiss) {
          playNearMiss();
        }
        if (missedNormal) {
          resetCombo(true);
        }
        return survivors;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, resetCombo]);

  // Heartbeat sound at 1 life
  useEffect(() => {
    if (gameState === "playing" && lives === 1) {
      const hb = setInterval(() => {
        playHeartbeat();
      }, 800);
      return () => clearInterval(hb);
    }
  }, [gameState, lives]);

  return {
    score,
    combo,
    bestCombo,
    level,
    lives,
    orbs,
    gameState,
    frenzy,
    frenzyTime,
    totalTaps,
    totalGolden,
    highScore,
    dailyStreak,
    prestige,
    totalGames,
    totalJackpots,
    hasShield,
    comebackActive,
    comebackTime,
    progressiveJackpot,
    challengeTarget,
    challengeDone,
    newRecord,
    setHighScore,
    setDailyStreak,
    setPrestige,
    setTotalGames,
    setTotalJackpots,
    setChallengeTarget,
    setChallengeDone,
    tapOrb,
    startGame,
    endGame,
  };
}
