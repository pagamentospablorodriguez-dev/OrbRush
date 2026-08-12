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
  playPrestige,
  playChallenge,
  playHeartbeat,
  startDrone,
  stopDrone,
  playChain,
  playTimeFreeze,
  playBoss,
  playBossDefeated,
  playRainbow,
  playLuckyStreak,
  playRevive,
  playMegaCombo,
  playTreasureOpen,
  playMilestone,
  playSoClose,
  playStreakBonus,
  playGhost,
  playCollectionNew,
  playAlmostJackpot,
  playComboGrief,
} from "./sound";
import { recordDiscovery } from "./collection";
import { getSqueezeMultiplier, consumeSqueezeReward } from "./supabase";

export type OrbType =
  | "normal"
  | "golden"
  | "bomb"
  | "bonus"
  | "frenzy"
  | "mystery"
  | "shield"
  | "comeback"
  | "rainbow"
  | "boss"
  | "timefreeze"
  | "chain"
  | "ghost"
  | "treasure";

export interface Orb {
  id: number;
  x: number;
  y: number;
  type: OrbType;
  size: number;
  bornAt: number;
  ttl: number;
  pulse: number;
  hp?: number;
  maxHp?: number;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

export interface PowerUps {
  shield: boolean;
  extra_life: boolean;
  frenzy: boolean;
  double: boolean;
  freeze: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_tap", title: "First Tap", desc: "Your first orb!", icon: "✨" },
  { id: "combo_10", title: "Combo x10", desc: "Ten in a row!", icon: "🔥" },
  { id: "combo_25", title: "Combo x25", desc: "Unstoppable!", icon: "⚡" },
  { id: "combo_50", title: "Combo x50", desc: "Legendary!", icon: "💎" },
  { id: "combo_100", title: "Combo x100", desc: "IMMORTAL!", icon: "🔮" },
  { id: "golden_1", title: "Golden!", desc: "First golden orb", icon: "🌟" },
  { id: "golden_10", title: "Collector", desc: "10 golden orbs", icon: "👑" },
  { id: "golden_50", title: "Midas", desc: "50 golden orbs", icon: "🪙" },
  { id: "level_5", title: "Level 5", desc: "Leveling up!", icon: "🚀" },
  { id: "level_10", title: "Level 10", desc: "Orb master", icon: "🏆" },
  { id: "level_20", title: "Level 20", desc: "Living legend", icon: "⭐" },
  { id: "score_1k", title: "1,000 points", desc: "Scored a thousand!", icon: "💯" },
  { id: "score_10k", title: "10,000 points", desc: "Absolute legend", icon: "🎖️" },
  { id: "score_50k", title: "50,000 points", desc: "Beyond legend", icon: "🥇" },
  { id: "frenzy_1", title: "FRENZY!", desc: "Frenzy mode activated", icon: "🌀" },
  { id: "jackpot_1", title: "JACKPOT!", desc: "Won the jackpot", icon: "🎰" },
  { id: "mystery_1", title: "Mystery!", desc: "Mystery orb revealed", icon: "❓" },
  { id: "shield_1", title: "Shield!", desc: "Protection activated", icon: "🛡️" },
  { id: "comeback_1", title: "Comeback!", desc: "Recovered from danger", icon: "💥" },
  { id: "prestige_1", title: "PRESTIGE!", desc: "Reborn stronger", icon: "🌟" },
  { id: "challenge_done", title: "Daily Challenge!", desc: "Completed today's challenge", icon: "🎯" },
  { id: "rainbow_1", title: "Rainbow!", desc: "Rainbow orb captured", icon: "🌈" },
  { id: "boss_1", title: "Boss Hunter", desc: "Defeated a boss", icon: "👹" },
  { id: "timefreeze_1", title: "Time Frozen", desc: "Stopped time!", icon: "❄️" },
  { id: "chain_1", title: "Chain Reaction", desc: "Explosive chain!", icon: "🔗" },
  { id: "ghost_1", title: "Ghost", desc: "Captured a ghost orb", icon: "👻" },
  { id: "treasure_1", title: "Treasure!", desc: "Opened a chest", icon: "💎" },
  { id: "revive_1", title: "Second Chance", desc: "Revived!", icon: "❤️" },
  { id: "milestone_1", title: "Milestones", desc: "Thousand-point bonus!", icon: "🏁" },
  { id: "lucky_5", title: "Lucky!", desc: "5 golden orbs in a row", icon: "🍀" },
  { id: "lucky_time", title: "Lucky Time!", desc: "Golden rain!", icon: "🌟" },
  { id: "collector_5", title: "Collector", desc: "Discovered 5 orb types", icon: "📚" },
  { id: "collector_10", title: "Archivist", desc: "Discovered 10 orb types", icon: "📖" },
  { id: "collector_all", title: "Collection Master", desc: "Discovered ALL orbs!", icon: "🏅" },
];

const REWARD_WORDS = ["GOOD!", "GREAT!", "AMAZING!", "PERFECT!", "INSANE!", "LEGEND!", "GODLIKE!"];

const MILESTONE_STEP = 1000;
const COMBO_WINDOW = 1600;

interface GameCallbacks {
  onBurst: (x: number, y: number, count: number, color: string, opts?: any) => void;
  onFloatText: (x: number, y: number, text: string, color: string, size?: number) => void;
  onShockwave: (x: number, y: number, maxRadius: number, color: string) => void;
  onAchievement: (a: Achievement) => void;
  onScreenShake: (intensity: number) => void;
  onFlash: (color: string) => void;
  onQuestProgress?: (type: string, value: number, incremental?: boolean) => void;
  onCollectionNew?: (type: OrbType, label: string, icon: string) => void;
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
  const [timeFreeze, setTimeFreeze] = useState(false);
  const [timeFreezeTime, setTimeFreezeTime] = useState(0);
  const [luckyStreak, setLuckyStreak] = useState(0);
  const [luckyMult, setLuckyMult] = useState(1);
  const [bossActive, setBossActive] = useState(false);
  const [canRevive, setCanRevive] = useState(true);
  const [lastMilestone, setLastMilestone] = useState(0);
  const [comboDecay, setComboDecay] = useState(0);
  const [luckyTime, setLuckyTime] = useState(false);
  const [luckyTimeLeft, setLuckyTimeLeft] = useState(0);
  const [doublePoints, setDoublePoints] = useState(false);
  const [doubleTimeLeft, setDoubleTimeLeft] = useState(0);
  const [gems, setGems] = useState(0);
  const [autoRestartCountdown, setAutoRestartCountdown] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [sessionMult, setSessionMult] = useState(1);
  const [adrenaline, setAdrenaline] = useState(false);
  const [nearRecord, setNearRecord] = useState(false);
  const [recordGap, setRecordGap] = useState(0);
  const [firstWinToday, setFirstWinToday] = useState(false);
  const [firstWinClaimed, setFirstWinClaimed] = useState(false);
  const [collectionDiscovered, setCollectionDiscovered] = useState(0);
  const [almostJackpotActive, setAlmostJackpotActive] = useState(false);

  const orbIdRef = useRef(0);
  const comboTimerRef = useRef<number | null>(null);
  const comboDecayRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const frenzyTimerRef = useRef<number | null>(null);
  const comebackTimerRef = useRef<number | null>(null);
  const freezeTimerRef = useRef<number | null>(null);
  const luckyTimerRef = useRef<number | null>(null);
  const doubleTimerRef = useRef<number | null>(null);
  const autoRestartRef = useRef<number | null>(null);
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
  const freezeRef = useRef(false);
  const luckyStreakRef = useRef(0);
  const luckyMultRef = useRef(1);
  const bossActiveRef = useRef(false);
  const canReviveRef = useRef(true);
  const lastMilestoneRef = useRef(0);
  const luckyTimeRef = useRef(false);
  const doublePointsRef = useRef(false);
  const gemsRef = useRef(0);
  const sessionStreakRef = useRef(0);
  const sessionMultRef = useRef(1);
  const adrenalineRef = useRef(false);
  const firstWinClaimedRef = useRef(false);
  const collectionDiscoveredRef = useRef(0);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const squeezeMultRef = useRef(1);
  const almostJackpotPrimedRef = useRef(false);
  const almostJackpotAnimatingRef = useRef(false);
  const almostJackpotAnimTimerRef = useRef<number | null>(null);

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
    freezeRef.current = timeFreeze;
    luckyStreakRef.current = luckyStreak;
    luckyMultRef.current = luckyMult;
    bossActiveRef.current = bossActive;
    canReviveRef.current = canRevive;
    lastMilestoneRef.current = lastMilestone;
    luckyTimeRef.current = luckyTime;
    doublePointsRef.current = doublePoints;
    gemsRef.current = gems;
    sessionStreakRef.current = sessionStreak;
    sessionMultRef.current = sessionMult;
    adrenalineRef.current = adrenaline;
    firstWinClaimedRef.current = firstWinClaimed;
    collectionDiscoveredRef.current = collectionDiscovered;
  };
  syncRefs();

  const questProgress = useCallback((type: string, value: number, incremental?: boolean) => {
    callbacksRef.current.onQuestProgress?.(type, value, incremental);
  }, []);

  const unlock = useCallback((id: string) => {
    if (unlockedRef.current.has(id)) return;
    unlockedRef.current.add(id);
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) {
      playAchievement();
      callbacksRef.current.onAchievement(a);
    }
  }, []);

  const checkCollectionAchievements = useCallback(() => {
    const count = collectionDiscoveredRef.current;
    if (count >= 5) unlock("collector_5");
    if (count >= 10) unlock("collector_10");
    if (count >= 13) unlock("collector_all");
  }, [unlock]);

  const trackDiscovery = useCallback((type: OrbType, label: string, icon: string) => {
    const { isNew } = recordDiscovery(type);
    if (isNew) {
      collectionDiscoveredRef.current += 1;
      setCollectionDiscovered(collectionDiscoveredRef.current);
      playCollectionNew();
      callbacksRef.current.onCollectionNew?.(type, label, icon);
      checkCollectionAchievements();
    }
  }, [checkCollectionAchievements]);

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
    if (luckyStreakRef.current >= 5) unlock("lucky_5");
    checkCollectionAchievements();
  }, [unlock, checkCollectionAchievements]);

  const spawnOrb = useCallback(() => {
    if (stateRef.current !== "playing") return;
    const lvl = levelRef.current;
    const r = Math.random();
    let type: OrbType = "normal";

        const goldenChance = luckyTimeRef.current ? 0.35 : Math.min(0.06 + lvl * 0.003, 0.25);

    const bombChance = luckyTimeRef.current ? 0.02 : Math.min(0.04 + lvl * 0.005, 0.16);
    const bonusChance = 0.05;
    const frenzyChance = frenzyRef.current ? 0 : 0.01;
    const mysteryChance = 0.03;
    const shieldChance = hasShieldRef.current ? 0 : 0.008;
    const comebackChance = livesRef.current <= 1 && !comebackRef.current ? 0.025 : 0;
    const rainbowChance = 0.004 + lvl * 0.0005;
    const bossChance = bossActiveRef.current ? 0 : (lvl >= 3 ? 0.003 + lvl * 0.0005 : 0);
    const freezeChance = freezeRef.current ? 0 : 0.006;
    const chainChance = 0.012;
    const ghostChance = 0.015;
    const treasureChance = 0.005 + lvl * 0.0005;

    let acc = 0;
    if (r < (acc += goldenChance)) type = "golden";
    else if (r < (acc += bombChance)) type = "bomb";
    else if (r < (acc += bonusChance)) type = "bonus";
    else if (r < (acc += frenzyChance)) type = "frenzy";
    else if (r < (acc += mysteryChance)) type = "mystery";
    else if (r < (acc += shieldChance)) type = "shield";
    else if (r < (acc += comebackChance)) type = "comeback";
    else if (r < (acc += rainbowChance)) type = "rainbow";
    else if (r < (acc += bossChance)) type = "boss";
    else if (r < (acc += freezeChance)) type = "timefreeze";
    else if (r < (acc += chainChance)) type = "chain";
    else if (r < (acc += ghostChance)) type = "ghost";
    else if (r < (acc += treasureChance)) type = "treasure";

    const size =
      type === "golden" ? 70 :
      type === "bomb" ? 60 :
      type === "bonus" ? 65 :
      type === "frenzy" ? 75 :
      type === "mystery" ? 68 :
      type === "shield" ? 72 :
      type === "comeback" ? 78 :
      type === "rainbow" ? 80 :
      type === "boss" ? 110 :
      type === "timefreeze" ? 74 :
      type === "chain" ? 76 :
      type === "ghost" ? 62 :
      type === "treasure" ? 85 :
      55 + Math.random() * 20;

    const ttl =
      type === "bomb" ? Math.max(700, 2200 - lvl * 60) :
      type === "golden" ? Math.max(700, 1400 - lvl * 30) :
      type === "comeback" ? 2500 :
      type === "boss" ? 6000 :
      type === "treasure" ? 3500 :
      type === "ghost" ? 3000 :
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
      hp: type === "boss" ? 5 + Math.floor(lvl / 3) : undefined,
      maxHp: type === "boss" ? 5 + Math.floor(lvl / 3) : undefined,
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
    setLuckyStreak(0);
    luckyStreakRef.current = 0;
    setLuckyMult(1);
    luckyMultRef.current = 1;
    setComboDecay(0);
    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
      comboTimerRef.current = null;
    }
    if (comboDecayRef.current) {
      cancelAnimationFrame(comboDecayRef.current);
      comboDecayRef.current = null;
    }
  }, []);

  const startLuckyTime = useCallback(() => {
    setLuckyTime(true);
    luckyTimeRef.current = true;
    setLuckyTimeLeft(8);
    playLuckyStreak();
    callbacksRef.current.onFlash("rgba(251,191,36,0.3)");
    callbacksRef.current.onScreenShake(15);
    callbacksRef.current.onFloatText(50, 50, "LUCKY TIME!", "#fbbf24", 52);
    unlock("lucky_time");
    if (luckyTimerRef.current) clearInterval(luckyTimerRef.current);
    luckyTimerRef.current = window.setInterval(() => {
      setLuckyTimeLeft((t) => {
        if (t <= 1) {
          setLuckyTime(false);
          luckyTimeRef.current = false;
          if (luckyTimerRef.current) clearInterval(luckyTimerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [unlock]);

  const startDoublePoints = useCallback(() => {
    setDoublePoints(true);
    doublePointsRef.current = true;
    setDoubleTimeLeft(10);
    playWhoosh();
    callbacksRef.current.onFlash("rgba(168,85,247,0.2)");
    if (doubleTimerRef.current) clearInterval(doubleTimerRef.current);
    doubleTimerRef.current = window.setInterval(() => {
      setDoubleTimeLeft((t) => {
        if (t <= 1) {
          setDoublePoints(false);
          doublePointsRef.current = false;
          if (doubleTimerRef.current) clearInterval(doubleTimerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
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
    if (freezeTimerRef.current) { clearInterval(freezeTimerRef.current); freezeTimerRef.current = null; }
    if (luckyTimerRef.current) { clearInterval(luckyTimerRef.current); luckyTimerRef.current = null; }
    if (doubleTimerRef.current) { clearInterval(doubleTimerRef.current); doubleTimerRef.current = null; }
    if (comboTimerRef.current) { clearTimeout(comboTimerRef.current); comboTimerRef.current = null; }
    if (comboDecayRef.current) { cancelAnimationFrame(comboDecayRef.current); comboDecayRef.current = null; }
    if (almostJackpotAnimTimerRef.current) { clearInterval(almostJackpotAnimTimerRef.current); almostJackpotAnimTimerRef.current = null; }
    setOrbs([]);
    setFrenzy(false);
    frenzyRef.current = false;
    setComebackActive(false);
    comebackRef.current = false;
    setHasShield(false);
    hasShieldRef.current = false;
    setTimeFreeze(false);
    freezeRef.current = false;
    setBossActive(false);
    bossActiveRef.current = false;
    setLuckyTime(false);
    luckyTimeRef.current = false;
    setDoublePoints(false);
    doublePointsRef.current = false;
    setComboDecay(0);
    setAlmostJackpotActive(false);
    almostJackpotPrimedRef.current = false;
    almostJackpotAnimatingRef.current = false;

    const finalScore = scoreRef.current;
    const gap = highScoreRef.current - finalScore;
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      highScoreRef.current = finalScore;
      setNewRecord(true);
    } else if (gap > 0 && gap <= 500 && finalScore > 200) {
      setNearRecord(true);
      setRecordGap(gap);
      playSoClose();
    }
    setSessionStreak((s) => s + 1);
    sessionStreakRef.current += 1;
    const newSessionMult = 1 + Math.min(sessionStreakRef.current * 0.1, 1.0);
    setSessionMult(newSessionMult);
    sessionMultRef.current = newSessionMult;
    setAdrenaline(false);
    adrenalineRef.current = false;
    if (!firstWinClaimedRef.current && finalScore >= 1000) {
      setFirstWinToday(true);
      setFirstWinClaimed(true);
      firstWinClaimedRef.current = true;
      setGems((g) => g + 100);
      gemsRef.current += 100;
    }
    setTotalGames((g) => g + 1);

    questProgress("games_3", 1, true);
    questProgress("games_5", 1, true);
    questProgress("score_2000", finalScore);
    questProgress("score_5000", finalScore);
    questProgress("combo_20", bestCombo);
    questProgress("combo_40", bestCombo);
    questProgress("golden_10", totalGoldenRef.current);
    questProgress("golden_20", totalGoldenRef.current);
    questProgress("level_10", levelRef.current);

    if (finalScore >= 20000) {
      setPrestige((p) => p + 1);
      prestigeRef.current += 1;
      playPrestige();
      unlock("prestige_1");
    }

    setAutoRestartCountdown(10);
    autoRestartRef.current = window.setInterval(() => {
      setAutoRestartCountdown((c) => {
        if (c <= 1) {
          if (autoRestartRef.current) clearInterval(autoRestartRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [unlock, questProgress, bestCombo]);

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

  const startTimeFreeze = useCallback(() => {
    setTimeFreeze(true);
    freezeRef.current = true;
    setTimeFreezeTime(5);
    playTimeFreeze();
    callbacksRef.current.onFlash("rgba(125,211,252,0.2)");
    unlock("timefreeze_1");
    setOrbs((prev) => prev.map((o) => ({ ...o, bornAt: o.bornAt + 5000 })));
    if (freezeTimerRef.current) clearInterval(freezeTimerRef.current);
    freezeTimerRef.current = window.setInterval(() => {
      setTimeFreezeTime((t) => {
        if (t <= 1) {
          setTimeFreeze(false);
          freezeRef.current = false;
          if (freezeTimerRef.current) clearInterval(freezeTimerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [unlock]);

  const revive = useCallback(() => {
    if (!canReviveRef.current) return;
    setCanRevive(false);
    canReviveRef.current = false;
    if (autoRestartRef.current) { clearInterval(autoRestartRef.current); autoRestartRef.current = null; }
    setAutoRestartCountdown(0);
    setLives(1);
    livesRef.current = 1;
    setGameState("playing");
    stateRef.current = "playing";
    playRevive();
    callbacksRef.current.onFlash("rgba(34,197,94,0.3)");
    callbacksRef.current.onScreenShake(15);
    unlock("revive_1");
    startSpawnLoop();
  }, [unlock, startSpawnLoop]);

  const tapOrb = useCallback(
    (orb: Orb, clientX: number, clientY: number) => {
      if (stateRef.current !== "playing") return;

      // Almost-jackpot: if primed, this tap triggers the "SO CLOSE!" letdown
      if (almostJackpotPrimedRef.current) {
        almostJackpotPrimedRef.current = false;
        setAlmostJackpotActive(false);
        callbacksRef.current.onFloatText(50, 50, "SO CLOSE! Jackpot was 1 tap away!", "#f97316", 40);
        callbacksRef.current.onFlash("rgba(249,115,22,0.25)");
        callbacksRef.current.onScreenShake(10);
        playSoClose();
        setProgressiveJackpot(0);
        progressiveRef.current = 0;
      }

      const rect = document.getElementById("game-area")?.getBoundingClientRect();
      if (!rect) return;
      const px = ((clientX - rect.left) / rect.width) * 100;
      const py = ((clientY - rect.top) / rect.height) * 100;

      // Boss takes multiple hits
      if (orb.type === "boss" && orb.hp && orb.hp > 1) {
        setOrbs((prev) => prev.map((o) => o.id === orb.id ? { ...o, hp: (o.hp ?? 1) - 1 } : o));
        playBoss();
        callbacksRef.current.onBurst(px, py, 15, "#ef4444", { speed: 4, size: 4, shape: "square" });
        callbacksRef.current.onScreenShake(6);
        callbacksRef.current.onFloatText(px, py, `${(orb.hp ?? 1) - 1}`, "#ef4444", 24);
        return;
      }

      setOrbs((prev) => prev.filter((o) => o.id !== orb.id));

      if (orb.type === "bomb") {
        if (hasShieldRef.current) {
          playShieldBreak();
          setHasShield(false);
          hasShieldRef.current = false;
          callbacksRef.current.onBurst(px, py, 25, "#3b82f6", { speed: 5, size: 4, shape: "square" });
          callbacksRef.current.onShockwave(px, py, 180, "#3b82f6");
          callbacksRef.current.onFloatText(px, py, "SHIELD BROKE!", "#3b82f6", 28);
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
          setAdrenaline(true);
          adrenalineRef.current = true;
          callbacksRef.current.onFlash("rgba(239,68,68,0.15)");
          callbacksRef.current.onFloatText(50, 50, "ADRENALINE! 1.5x", "#ef4444", 36);
        }
        if (newLives <= 0) {
          endGame();
        }
        return;
      }

      // Chain reaction: pop nearby orbs
      if (orb.type === "chain") {
        playChain();
        callbacksRef.current.onBurst(px, py, 40, "#fbbf24", { speed: 7, size: 5, shape: "star" });
        callbacksRef.current.onShockwave(px, py, 300, "#fbbf24");
        callbacksRef.current.onScreenShake(10);
        unlock("chain_1");
        trackDiscovery("chain", "Chain Orb", "🔗");

        const chainRadius = 25;
        setOrbs((prev) => {
          const chainHits: Orb[] = [];
          const survivors: Orb[] = [];
          for (const o of prev) {
            if (o.id === orb.id) continue;
            const dist = Math.hypot(o.x - orb.x, o.y - orb.y);
            if (dist < chainRadius && o.type !== "bomb" && o.type !== "boss") {
              chainHits.push(o);
            } else {
              survivors.push(o);
            }
          }
          chainHits.forEach((o, i) => {
            setTimeout(() => {
              const cx = o.x;
              const cy = o.y;
              const pts = o.type === "golden" ? 100 : o.type === "rainbow" ? 250 : o.type === "bonus" ? 50 : 20;
              setScore((s) => { const ns = s + pts; scoreRef.current = ns; return ns; });
              callbacksRef.current.onBurst(cx, cy, 15, o.type === "golden" ? "#fbbf24" : "#22d3ee", { speed: 5, size: 4, shape: "star" });
              callbacksRef.current.onFloatText(cx, cy, `+${pts}`, "#fbbf24", 22);
              playChain();
            }, i * 80);
          });
          return survivors;
        });

        const newCombo = comboRef.current + 1;
        setCombo(newCombo);
        comboRef.current = newCombo;
        if (newCombo > bestCombo) setBestCombo(newCombo);
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
        comboTimerRef.current = window.setTimeout(() => resetCombo(true), COMBO_WINDOW);
        callbacksRef.current.onFloatText(px, py, "CHAIN!", "#fbbf24", 36);
        return;
      }

      // Combo
      const newCombo = comboRef.current + 1;
      setCombo(newCombo);
      comboRef.current = newCombo;
      if (newCombo > bestCombo) setBestCombo(newCombo);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = window.setTimeout(() => resetCombo(true), COMBO_WINDOW);

      // Combo decay bar animation
      setComboDecay(1);
      if (comboDecayRef.current) cancelAnimationFrame(comboDecayRef.current);
      const decayStart = performance.now();
      const animateDecay = () => {
        const elapsed = performance.now() - decayStart;
        const remaining = Math.max(0, 1 - elapsed / COMBO_WINDOW);
        setComboDecay(remaining);
        if (remaining > 0 && stateRef.current === "playing") {
          comboDecayRef.current = requestAnimationFrame(animateDecay);
        }
      };
      comboDecayRef.current = requestAnimationFrame(animateDecay);

      // Progressive jackpot grows with every tap
      const progAdd = 2 + Math.floor(newCombo / 10);
      const newProg = progressiveRef.current + progAdd;
      setProgressiveJackpot(newProg);
      progressiveRef.current = newProg;
      if (newCombo % 10 === 0) playProgressiveTick();

      // Almost-jackpot trigger: 0.5% chance per tap when progressive > 500
      if (progressiveRef.current > 500 && !almostJackpotPrimedRef.current && !almostJackpotAnimatingRef.current) {
        if (Math.random() < 0.005) {
          almostJackpotAnimatingRef.current = true;
          setAlmostJackpotActive(true);
          playAlmostJackpot();
          callbacksRef.current.onFlash("rgba(251,191,36,0.3)");
          callbacksRef.current.onFloatText(50, 45, "JACKPOT RISING?!", "#fbbf24", 44);
          callbacksRef.current.onScreenShake(8);
          let riseCount = 0;
          if (almostJackpotAnimTimerRef.current) clearInterval(almostJackpotAnimTimerRef.current);
          almostJackpotAnimTimerRef.current = window.setInterval(() => {
            riseCount++;
            const inc = 50 + riseCount * 25;
            setProgressiveJackpot((p) => { const np = p + inc; progressiveRef.current = np; return np; });
            playProgressiveTick();
            if (riseCount % 3 === 0) callbacksRef.current.onFlash("rgba(251,191,36,0.12)");
            if (riseCount >= 15) {
              if (almostJackpotAnimTimerRef.current) { clearInterval(almostJackpotAnimTimerRef.current); almostJackpotAnimTimerRef.current = null; }
              almostJackpotAnimatingRef.current = false;
              almostJackpotPrimedRef.current = true;
            }
          }, 80);
        }
      }

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
        trackDiscovery("golden", "Golden Orb", "🌟");

        const newLucky = luckyStreakRef.current + 1;
        setLuckyStreak(newLucky);
        luckyStreakRef.current = newLucky;
        if (newLucky >= 3) {
          const newMult = 1 + Math.floor(newLucky / 2) * 0.5;
          setLuckyMult(newMult);
          luckyMultRef.current = newMult;
          if (newLucky >= 5) {
            playLuckyStreak();
            callbacksRef.current.onFloatText(px, py - 25, `LUCKY x${newLucky}!`, "#4ade80", 24);
            unlock("lucky_5");
          }
        }
        questProgress("golden_10", newGolden);
        questProgress("golden_20", newGolden);
      } else if (orb.type === "bonus") {
        basePoints = 50;
        color = "#a855f7";
        particleCount = 20;
        particleShape = "square";
        playTap(newCombo);
        floatText = "+50";
        setLuckyStreak(0);
        luckyStreakRef.current = 0;
        setLuckyMult(1);
        luckyMultRef.current = 1;
        trackDiscovery("bonus", "Bonus Orb", "✨");
      } else if (orb.type === "frenzy") {
        startFrenzy();
        basePoints = 30;
        color = "#f97316";
        particleCount = 40;
        particleShape = "star";
        floatText = "FRENZY!";
        callbacksRef.current.onShockwave(px, py, 250, "#f97316");
        callbacksRef.current.onScreenShake(10);
        trackDiscovery("frenzy", "Frenzy Orb", "⚡");
      } else if (orb.type === "mystery") {
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
        trackDiscovery("mystery", "Mystery Orb", "❓");
      } else if (orb.type === "shield") {
        setHasShield(true);
        hasShieldRef.current = true;
        playShield();
        color = "#3b82f6";
        particleCount = 25;
        particleShape = "circle";
        floatText = "SHIELD!";
        callbacksRef.current.onShockwave(px, py, 150, "#3b82f6");
        unlock("shield_1");
        trackDiscovery("shield", "Shield Orb", "🛡️");
      } else if (orb.type === "comeback") {
        startComeback();
        basePoints = 50;
        color = "#22c55e";
        particleCount = 35;
        particleShape = "star";
        floatText = "COMEBACK!";
        callbacksRef.current.onShockwave(px, py, 250, "#22c55e");
        callbacksRef.current.onScreenShake(12);
        trackDiscovery("comeback", "Comeback Orb", "📈");
      } else if (orb.type === "rainbow") {
        basePoints = 250;
        color = "#e879f9";
        particleCount = 50;
        particleShape = "star";
        playRainbow();
        floatText = "RAINBOW +250!";
        callbacksRef.current.onShockwave(px, py, 300, "#e879f9");
        callbacksRef.current.onFlash("rgba(232,121,249,0.2)");
        callbacksRef.current.onScreenShake(12);
        unlock("rainbow_1");
        questProgress("rainbow_1", 1, true);
        trackDiscovery("rainbow", "Rainbow Orb", "🌈");
      } else if (orb.type === "boss") {
        basePoints = 500 + levelRef.current * 50;
        color = "#ef4444";
        particleCount = 60;
        particleShape = "square";
        playBossDefeated();
        floatText = `BOSS! +${basePoints}`;
        callbacksRef.current.onShockwave(px, py, 400, "#ef4444");
        callbacksRef.current.onFlash("rgba(239,68,68,0.2)");
        callbacksRef.current.onScreenShake(20);
        setBossActive(false);
        bossActiveRef.current = false;
        unlock("boss_1");
        questProgress("boss_1", 1, true);
        trackDiscovery("boss", "Boss Orb", "⚔️");
      } else if (orb.type === "timefreeze") {
        startTimeFreeze();
        basePoints = 30;
        color = "#7dd3fc";
        particleCount = 35;
        particleShape = "star";
        floatText = "TIME FROZEN!";
        callbacksRef.current.onShockwave(px, py, 280, "#7dd3fc");
        trackDiscovery("timefreeze", "Freeze Orb", "❄️");
      } else if (orb.type === "ghost") {
        basePoints = 75;
        color = "#cbd5e1";
        particleCount = 25;
        particleShape = "circle";
        playGhost();
        floatText = "GHOST +75!";
        callbacksRef.current.onShockwave(px, py, 180, "#cbd5e1");
        unlock("ghost_1");
        trackDiscovery("ghost", "Ghost Orb", "👻");
      } else if (orb.type === "treasure") {
        const outcomes = [
          { pts: 200, w: 35, label: "+200" },
          { pts: 500, w: 25, label: "+500!" },
          { pts: 1000, w: 20, label: "+1000!!" },
          { pts: 2000, w: 12, label: "+2000!!!" },
          { pts: 5000, w: 8, label: "MEGA +5000!!!" },
        ];
        const totalW = outcomes.reduce((s, o) => s + o.w, 0);
        let roll = Math.random() * totalW;
        let chosen = outcomes[0];
        for (const o of outcomes) {
          roll -= o.w;
          if (roll <= 0) { chosen = o; break; }
        }
        // Apply squeeze multiplier to treasure payout
        basePoints = Math.floor(chosen.pts * squeezeMultRef.current);
        color = "#fbbf24";
        particleCount = 40 + basePoints / 20;
        particleShape = "star";
        playTreasureOpen();
        floatText = `TREASURE +${basePoints}!`;
        callbacksRef.current.onShockwave(px, py, 250 + basePoints / 10, "#fbbf24");
        callbacksRef.current.onFlash("rgba(251,191,36,0.2)");
        callbacksRef.current.onScreenShake(15);
        unlock("treasure_1");
        questProgress("treasure_1", 1, true);
        trackDiscovery("treasure", "Treasure Orb", "💎");
        // If squeeze was in "ready" state (multiplier > 1), consume the reward and go back to dry
        if (squeezeMultRef.current > 1) {
          squeezeMultRef.current = 0.4;
          consumeSqueezeReward();
        }
      } else {
        playTap(newCombo);
        setLuckyStreak(0);
        luckyStreakRef.current = 0;
        setLuckyMult(1);
        luckyMultRef.current = 1;
        trackDiscovery("normal", "Normal Orb", "🔵");
      }

      const comboMult = 1 + Math.floor(newCombo / 5) * 0.5;
      const frenzyMult = frenzyRef.current ? 2 : 1;
      const comebackMult = comebackRef.current ? 3 : 1;
      const prestigeMult = 1 + prestigeRef.current * 0.1;
      const luckyMultVal = luckyMultRef.current;
      const doubleMult = doublePointsRef.current ? 2 : 1;
      const adrenalineMult = adrenalineRef.current ? 1.5 : 1;
      const sessionMultVal = sessionMultRef.current;
      const points = Math.floor(basePoints * comboMult * frenzyMult * comebackMult * prestigeMult * luckyMultVal * doubleMult * adrenalineMult * sessionMultVal);

      const newScore = scoreRef.current + points;
      setScore(newScore);
      scoreRef.current = newScore;

      const newTaps = totalTapsRef.current + 1;
      setTotalTaps(newTaps);
      totalTapsRef.current = newTaps;

      const gemsEarned = Math.floor(points / 100);
      if (gemsEarned > 0) {
        setGems((g) => g + gemsEarned);
        gemsRef.current += gemsEarned;
      }

      callbacksRef.current.onBurst(px, py, particleCount, color, {
        speed: 5,
        size: 4,
        shape: particleShape,
      });

      if (floatText) {
        callbacksRef.current.onFloatText(px, py, floatText, color, orb.type === "mystery" || orb.type === "treasure" ? 32 : 30);
      }

      if (newCombo >= 10 && newCombo % 5 === 0) {
        const word = REWARD_WORDS[Math.min(Math.floor(newCombo / 10), REWARD_WORDS.length - 1)];
        callbacksRef.current.onFloatText(px, py - 30, word, color, 22);
        callbacksRef.current.onScreenShake(5);
      }

      if (newCombo >= 50 && newCombo % 25 === 0) {
        playMegaCombo();
        callbacksRef.current.onFlash("rgba(251,191,36,0.15)");
        callbacksRef.current.onScreenShake(15);
        callbacksRef.current.onFloatText(50, 50, `MEGA COMBO x${newCombo}!`, "#fbbf24", 52);
      }

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
        questProgress("jackpot_1", 1, true);
        questProgress("jackpot_3", 1, true);
      }

      const milestone = Math.floor(newScore / MILESTONE_STEP);
      if (milestone > lastMilestoneRef.current) {
        const milestonesHit = milestone - lastMilestoneRef.current;
        const bonus = 200 * milestonesHit;
        setScore((s) => { const ns = s + bonus; scoreRef.current = ns; return ns; });
        setLastMilestone(milestone);
        lastMilestoneRef.current = milestone;
        playMilestone();
        callbacksRef.current.onFloatText(50, 40, `MILESTONE ${milestone * 1000}! +${bonus}`, "#22d3ee", 36);
        callbacksRef.current.onFlash("rgba(34,211,238,0.15)");
        callbacksRef.current.onScreenShake(8);
        unlock("milestone_1");
      }

      const newLevel = Math.floor(newScore / 500) + 1;
      if (newLevel > levelRef.current) {
        setLevel(newLevel);
        levelRef.current = newLevel;
        playLevelUp();
        callbacksRef.current.onFloatText(50, 30, `LEVEL ${newLevel}`, "#22d3ee", 48);
        callbacksRef.current.onFlash("rgba(34,211,238,0.15)");
        callbacksRef.current.onScreenShake(8);
        questProgress("level_10", newLevel);
      }

      if (!challengeDoneRef.current && challengeTargetRef.current > 0 && newScore >= challengeTargetRef.current) {
        setChallengeDone(true);
        challengeDoneRef.current = true;
        playChallenge();
        callbacksRef.current.onFloatText(50, 25, "CHALLENGE COMPLETE!", "#22c55e", 40);
        callbacksRef.current.onFlash("rgba(34,197,94,0.2)");
        callbacksRef.current.onScreenShake(10);
        unlock("challenge_done");
      }

      if (!luckyTimeRef.current && levelRef.current >= 3 && Math.random() < 0.002) {
        startLuckyTime();
      }

      checkAchievements();
    },
    [bestCombo, resetCombo, endGame, startFrenzy, startComeback, startTimeFreeze, startLuckyTime, startDoublePoints, checkAchievements, unlock, questProgress, trackDiscovery],
  );

  const startGame = useCallback((powerUps?: PowerUps) => {
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setLevel(1);
    setLives(powerUps?.extra_life ? 4 : 3);
    setOrbs([]);
    setFrenzy(false);
    setFrenzyTime(0);
    setTotalTaps(0);
    setTotalGolden(0);
    setProgressiveJackpot(0);
    setNewRecord(false);
    setTimeFreeze(false);
    setTimeFreezeTime(0);
    setLuckyStreak(0);
    setLuckyMult(1);
    setBossActive(false);
    setCanRevive(true);
    setLastMilestone(0);
    setComboDecay(0);
    setLuckyTime(false);
    setLuckyTimeLeft(0);
    setDoublePoints(false);
    setDoubleTimeLeft(0);
    setGems(0);
    setAutoRestartCountdown(0);
    setNearRecord(false);
    setRecordGap(0);
    setAdrenaline(false);
    adrenalineRef.current = false;
    setAlmostJackpotActive(false);
    almostJackpotPrimedRef.current = false;
    almostJackpotAnimatingRef.current = false;
    if (almostJackpotAnimTimerRef.current) { clearInterval(almostJackpotAnimTimerRef.current); almostJackpotAnimTimerRef.current = null; }
    scoreRef.current = 0;
    comboRef.current = 0;
    levelRef.current = 1;
    livesRef.current = powerUps?.extra_life ? 4 : 3;
    frenzyRef.current = false;
    totalTapsRef.current = 0;
    totalGoldenRef.current = 0;
    hasShieldRef.current = false;
    comebackRef.current = false;
    progressiveRef.current = 0;
    droneRef.current = false;
    freezeRef.current = false;
    luckyStreakRef.current = 0;
    luckyMultRef.current = 1;
    bossActiveRef.current = false;
    canReviveRef.current = true;
    lastMilestoneRef.current = 0;
    luckyTimeRef.current = false;
    doublePointsRef.current = false;
    gemsRef.current = 0;
    if (autoRestartRef.current) { clearInterval(autoRestartRef.current); autoRestartRef.current = null; }
    stopDrone();

    // Fetch squeeze multiplier for this game session
    squeezeMultRef.current = 1;
    getSqueezeMultiplier().then((m) => { squeezeMultRef.current = m; });

    if (powerUps?.shield) {
      setHasShield(true);
      hasShieldRef.current = true;
    }
    if (powerUps?.frenzy) {
      setFrenzy(true);
      frenzyRef.current = true;
      setFrenzyTime(8);
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
    }
    if (powerUps?.freeze) {
      setTimeFreeze(true);
      freezeRef.current = true;
      setTimeFreezeTime(5);
      freezeTimerRef.current = window.setInterval(() => {
        setTimeFreezeTime((t) => {
          if (t <= 1) {
            setTimeFreeze(false);
            freezeRef.current = false;
            if (freezeTimerRef.current) clearInterval(freezeTimerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    if (powerUps?.double) {
      startDoublePoints();
    }

    setGameState("playing");
    stateRef.current = "playing";
    playStart();
    startSpawnLoop();
  }, [startSpawnLoop, startDoublePoints]);

  // Expire orbs that reach their ttl — with near-miss feedback and combo grief
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      const now = performance.now();
      setOrbs((prev) => {
        const survivors: Orb[] = [];
        let missedNormal = false;
        let nearMiss = false;
        let bossExpired = false;
        for (const o of prev) {
          if (now - o.bornAt < o.ttl) {
            survivors.push(o);
          } else {
            if (o.type === "normal" || o.type === "golden" || o.type === "bonus") {
              missedNormal = true;
              if (o.type === "golden") nearMiss = true;
            }
            if (o.type === "boss") {
              bossExpired = true;
            }
          }
        }
        if (nearMiss) {
          playNearMiss();
          callbacksRef.current.onFloatText(50, 50, "SO CLOSE!", "#f97316", 28);
        }
        if (missedNormal) {
          // Combo grief: if combo was 20+, lose 10% of current score
          if (comboRef.current >= 20) {
            const penalty = Math.floor(scoreRef.current * 0.1);
            if (penalty > 0) {
              setScore((s) => { const ns = Math.max(0, s - penalty); scoreRef.current = ns; return ns; });
              callbacksRef.current.onFloatText(50, 55, `COMBO GRIEF! -${penalty}`, "#ef4444", 36);
              callbacksRef.current.onScreenShake(12);
              playComboGrief();
            }
          }
          resetCombo(true);
        }
        if (bossExpired) {
          setBossActive(false);
          bossActiveRef.current = false;
        }
        return survivors;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, resetCombo, callbacksRef]);

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
    timeFreeze,
    timeFreezeTime,
    luckyStreak,
    luckyMult,
    bossActive,
    canRevive,
    comboDecay,
    luckyTime,
    luckyTimeLeft,
    doublePoints,
    doubleTimeLeft,
    gems,
    autoRestartCountdown,
    sessionStreak,
    sessionMult,
    adrenaline,
    nearRecord,
    recordGap,
    firstWinToday,
    collectionDiscovered,
    almostJackpotActive,
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
    revive,
  };
}
