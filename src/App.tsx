//Bune

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play, RotateCcw, Volume2, VolumeX, Flame, Star, Heart, Zap, Trophy, Target,
  Sparkles, Crown, Shield, HelpCircle, TrendingUp, Award, Link as LinkIcon,
  Ghost, Gift, Snowflake, Swords, Rainbow, Gem, CheckCircle2, Circle, X,
  ShoppingBag, ChevronRight, BookOpen, Users, AlertTriangle, Timer,
} from "lucide-react";
import { useParticleCanvas } from "@/lib/particles";
import { useGame, type Orb, type Achievement, type PowerUps } from "@/lib/useGame";
import { setMuted, isMuted, playChestTease, playChestReveal, playSocialNotification, playLossChase, playCountdown } from "@/lib/sound";
import {
  loadStats, saveStats, updateDailyStreak, rollDailyChallenge, updateChallengeProgress,
  rollDailyQuests, updateQuestProgress, claimQuestRewards, canSpinWheel, spinWheelSave,
  buyPowerUp, clearPowerUps,
} from "@/lib/supabase";
import { rollChest, rollChestWithTease, rarityIndex, type ChestReward, type ChestRarity, RARITY_ORDER } from "@/lib/chest";
import { parseQuests, questLabel, questIcon, type QuestState } from "@/lib/quests";
import { WHEEL_SEGMENTS, spinWheel } from "@/lib/wheel";
import { POWER_UPS } from "@/lib/shop";
import { getCollectionEntries, getCollectionStats, type CollectionEntry } from "@/lib/collection";
import { rollSocialNotification, randomSocialDelay, type SocialNotification } from "@/lib/social";
import { getLossChaseBonus, type LossChaseBonus } from "@/lib/lossChase";
import { isPremium, incrementPlayCount, hasPaywallBeenShown, setPaywallShown, resetPaywallState } from "@/lib/premium";
import { PaywallModal } from "@/components/PaywallModal";

const ORB_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  normal: { bg: "from-cyan-400 to-blue-500", border: "border-cyan-300", glow: "shadow-cyan-400/50" },
  golden: { bg: "from-amber-300 to-yellow-500", border: "border-amber-200", glow: "shadow-amber-400/60" },
  bomb: { bg: "from-red-500 to-rose-700", border: "border-red-400", glow: "shadow-red-500/60" },
  bonus: { bg: "from-fuchsia-400 to-purple-500", border: "border-fuchsia-300", glow: "shadow-fuchsia-400/50" },
  frenzy: { bg: "from-orange-400 to-red-500", border: "border-orange-300", glow: "shadow-orange-400/60" },
  mystery: { bg: "from-violet-400 to-indigo-500", border: "border-violet-300", glow: "shadow-violet-400/60" },
  shield: { bg: "from-blue-400 to-cyan-600", border: "border-blue-300", glow: "shadow-blue-400/60" },
  comeback: { bg: "from-green-400 to-emerald-600", border: "border-green-300", glow: "shadow-green-400/60" },
  rainbow: { bg: "from-pink-400 via-yellow-400 to-cyan-400", border: "border-pink-300", glow: "shadow-pink-400/60" },
  boss: { bg: "from-red-600 to-rose-900", border: "border-red-400", glow: "shadow-red-500/70" },
  timefreeze: { bg: "from-sky-300 to-cyan-500", border: "border-sky-200", glow: "shadow-sky-400/60" },
  chain: { bg: "from-yellow-400 to-amber-600", border: "border-yellow-300", glow: "shadow-yellow-400/60" },
  ghost: { bg: "from-slate-300 to-slate-500", border: "border-slate-200", glow: "shadow-slate-300/50" },
  treasure: { bg: "from-amber-400 to-orange-500", border: "border-amber-300", glow: "shadow-amber-400/70" },
};

type ModalType = "chest" | "wheel" | "shop" | "quests" | "collection" | null;

function App() {
  const { canvasRef, burst, floatText, shockwave } = useParticleCanvas();
  const [muted, setMutedState] = useState(isMuted());
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [streakInfo, setStreakInfo] = useState<{ streak: number; isFirst: boolean } | null>(null);
  const [loadedStats, setLoadedStats] = useState<{
    high: number; bestCombo: number; streak: number; totalTaps: number; totalGolden: number;
    prestige: number; totalGames: number; totalJackpots: number; gems: number;
  } | null>(null);
  const [challengeInfo, setChallengeInfo] = useState<{ target: number; isNew: boolean } | null>(null);
  const [showChallengePopup, setShowChallengePopup] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [chestReward, setChestReward] = useState<ChestReward | null>(null);
  const [chestOpening, setChestOpening] = useState(false);
  const [chestTeaseIndex, setChestTeaseIndex] = useState(-1);
  const [chestTeaseRarities, setChestTeaseRarities] = useState<ChestRarity[]>([]);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wheelResult, setWheelResult] = useState<number | null>(null);
  const [wheelAvailable, setWheelAvailable] = useState(false);
  const [quests, setQuests] = useState<QuestState[]>([]);
  const [gems, setGems] = useState(0);
  const [powerUps, setPowerUps] = useState<PowerUps>({ shield: false, extra_life: false, frenzy: false, double: false, freeze: false });
  const [activePowerUps, setActivePowerUps] = useState<PowerUps>({ shield: false, extra_life: false, frenzy: false, double: false, freeze: false });
  const [buyError, setBuyError] = useState<string | null>(null);
  const [socialNotifs, setSocialNotifs] = useState<SocialNotification[]>([]);
  const [collectionEntries, setCollectionEntries] = useState<CollectionEntry[]>([]);
  const [collectionStats, setCollectionStats] = useState({ discovered: 0, total: 13 });
  const [lossChase, setLossChase] = useState<LossChaseBonus>({ active: false, multiplier: 1, secondsLeft: 0, reason: "" });
  const [showStreakWarning, setShowStreakWarning] = useState(false);
  const [collectionPopup, setCollectionPopup] = useState<{ label: string; icon: string } | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [premium, setPremiumState] = useState(isPremium());
  const shakeTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const onAchievement = useCallback((a: Achievement) => {
    setAchievements((prev) => [...prev, a]);
    setTimeout(() => setAchievements((prev) => prev.filter((x) => x.id !== a.id)), 3500);
  }, []);

  const onScreenShake = useCallback((intensity: number) => {
    setShake(intensity);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = window.setTimeout(() => setShake(0), 300);
  }, []);

  const onFlash = useCallback((color: string) => {
    setFlash(color);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 200);
  }, []);

  const onQuestProgress = useCallback((type: string, value: number, incremental?: boolean) => {
    updateQuestProgress(type, value, incremental);
  }, []);

  const onCollectionNew = useCallback((type: string, label: string, icon: string) => {
    setCollectionPopup({ label, icon });
    setTimeout(() => setCollectionPopup(null), 3000);
    setCollectionEntries(getCollectionEntries());
    setCollectionStats(getCollectionStats());
  }, []);

  const game = useGame({
    onBurst: burst, onFloatText: floatText, onShockwave: shockwave,
    onAchievement, onScreenShake, onFlash, onQuestProgress, onCollectionNew,
  });

  // Social proof notifications — fake players achieving things
  useEffect(() => {
    if (game.gameState === "idle") return;
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        const notif = rollSocialNotification();
        setSocialNotifs((prev) => [...prev.slice(-2), notif]);
        playSocialNotification();
        setTimeout(() => {
          setSocialNotifs((prev) => prev.filter((n) => n.id !== notif.id));
        }, 5000);
        schedule();
      }, randomSocialDelay());
    };
    schedule();
    return () => clearTimeout(timer);
  }, [game.gameState]);

  // Streak FOMO warning — show when idle and has a streak to lose
  useEffect(() => {
    if (game.gameState === "idle" && game.dailyStreak >= 2 && !showStreakWarning) {
      const timer = setTimeout(() => setShowStreakWarning(true), 2000);
      return () => clearTimeout(timer);
    }
    if (game.gameState === "playing") setShowStreakWarning(false);
  }, [game.gameState, game.dailyStreak, showStreakWarning]);

  // Loss-chase bonus after game over
  useEffect(() => {
    if (game.gameState === "gameover") {
      const bonus = getLossChaseBonus(game.sessionStreak, game.nearRecord, game.newRecord);
      if (bonus.active) {
        setLossChase(bonus);
        playLossChase();
        let countdown = bonus.secondsLeft;
        const timer = setInterval(() => {
          countdown--;
          setLossChase((prev) => ({ ...prev, secondsLeft: countdown }));
          if (countdown <= 5 && countdown > 0) playCountdown();
          if (countdown <= 0) {
            clearInterval(timer);
            setLossChase({ active: false, multiplier: 1, secondsLeft: 0, reason: "" });
          }
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [game.gameState, game.sessionStreak, game.nearRecord, game.newRecord]);

  // Game over save
  useEffect(() => {
    if (game.gameState === "gameover") {
      const newHigh = Math.max(game.highScore, game.score);
      const newBestCombo = Math.max(loadedStats?.bestCombo ?? 0, game.bestCombo);
      const gemsEarned = game.gems;
      saveStats({
        high_score: newHigh, best_combo: newBestCombo,
        total_taps: (loadedStats?.totalTaps ?? 0) + game.totalTaps,
        total_golden: (loadedStats?.totalGolden ?? 0) + game.totalGolden,
        current_level: game.level, prestige: game.prestige,
        total_games: (loadedStats?.totalGames ?? 0) + 1,
        total_jackpots: (loadedStats?.totalJackpots ?? 0) + game.totalJackpots,
        daily_challenge_progress: Math.max(game.score, loadedStats?.high ?? 0),
        gems: (loadedStats?.gems ?? 0) + gemsEarned,
      });
      setGems((g) => g + gemsEarned);
      setLoadedStats((prev) => prev ? {
        ...prev, high: newHigh, bestCombo: newBestCombo,
        totalTaps: (prev.totalTaps ?? 0) + game.totalTaps,
        totalGolden: (prev.totalGolden ?? 0) + game.totalGolden,
        totalGames: (prev.totalGames ?? 0) + 1,
        totalJackpots: (prev.totalJackpots ?? 0) + game.totalJackpots,
        gems: (prev.gems ?? 0) + gemsEarned,
      } : prev);
      if (game.score > (loadedStats?.high ?? 0)) game.setHighScore(game.score);
      clearPowerUps();
      setActivePowerUps({ shield: false, extra_life: false, frenzy: false, double: false, freeze: false });
      setPowerUps({ shield: false, extra_life: false, frenzy: false, double: false, freeze: false });
      refreshQuests();

      // Paywall logic: show after 3 games for non-premium users
      if (!premium) {
        const playCount = incrementPlayCount();
        if (playCount >= 3 && !hasPaywallBeenShown()) {
          setTimeout(() => {
            setShowPaywall(true);
            setPaywallShown(true);
          }, 1200);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameState]);

  // Challenge progress
  useEffect(() => {
    if (game.gameState === "playing" && game.score > 0 && game.challengeTarget > 0 && !game.challengeDone) {
      const t = setTimeout(() => updateChallengeProgress(game.score), 1000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.score]);

  const refreshQuests = useCallback(async () => {
    const stats = await rollDailyQuests();
    if (stats) { setQuests(parseQuests(stats)); setGems(stats.gems ?? 0); }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const stats = await loadStats();
      if (stats) {
        game.setHighScore(stats.high_score);
        game.setDailyStreak(stats.daily_streak);
        game.setPrestige(stats.prestige);
        game.setTotalGames(stats.total_games);
        game.setTotalJackpots(stats.total_jackpots);
        game.setChallengeTarget(stats.daily_challenge_target);
        game.setChallengeDone(stats.daily_challenge_progress >= stats.daily_challenge_target && stats.daily_challenge_target > 0);
        setLoadedStats({
          high: stats.high_score, bestCombo: stats.best_combo, streak: stats.daily_streak,
          totalTaps: stats.total_taps, totalGolden: stats.total_golden, prestige: stats.prestige,
          totalGames: stats.total_games, totalJackpots: stats.total_jackpots, gems: stats.gems ?? 0,
        });
        setGems(stats.gems ?? 0);
        setPowerUps({
          shield: stats.power_shield, extra_life: stats.power_extra_life,
          frenzy: stats.power_frenzy, double: stats.power_double, freeze: stats.power_freeze,
        });
        setQuests(parseQuests(stats));
      }
      const streakResult = await updateDailyStreak();
      if (streakResult) {
        game.setDailyStreak(streakResult.streak);
        setStreakInfo({ streak: streakResult.streak, isFirst: streakResult.isFirstPlayToday });
        if (streakResult.isFirstPlayToday && streakResult.streak > 1) {
          setShowStreakPopup(true);
          setTimeout(() => setShowStreakPopup(false), 4000);
        }
      }
      const challengeResult = await rollDailyChallenge();
      if (challengeResult) {
        game.setChallengeTarget(challengeResult.target);
        setChallengeInfo(challengeResult);
        if (challengeResult.isNew) { setShowChallengePopup(true); setTimeout(() => setShowChallengePopup(false), 4500); }
      }
      await refreshQuests();
      setWheelAvailable(await canSpinWheel());
      setCollectionEntries(getCollectionEntries());
      setCollectionStats(getCollectionStats());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => { const m = !muted; setMuted(m); setMutedState(m); };

  const handleOrbTap = (orb: Orb, e: React.PointerEvent) => {
    e.stopPropagation();
    game.tapOrb(orb, e.clientX, e.clientY);
  };

  const handleStartGame = () => {
    setLossChase({ active: false, multiplier: 1, secondsLeft: 0, reason: "" });
    game.startGame(activePowerUps);
  };

  // Chest with near-miss tease animation
  const handleOpenChest = () => {
    setChestOpening(true);
    setChestReward(null);
    const { reward, teaseSequence } = rollChestWithTease();
    setChestTeaseRarities(teaseSequence);
    let idx = 0;
    const teaseInterval = setInterval(() => {
      setChestTeaseIndex(idx);
      playChestTease();
      idx++;
      if (idx >= teaseSequence.length) {
        clearInterval(teaseInterval);
        setChestOpening(false);
        setChestReward(reward);
        setGems((g) => g + reward.gems);
        playChestReveal();
        saveStats({ gems: (loadedStats?.gems ?? 0) + game.gems + reward.gems });
        const ri = rarityIndex(reward.rarity);
        if (ri > (loadedStats?.totalJackpots ?? 0)) saveStats({ best_rarity: ri });
      }
    }, 150);
  };

  const handleSpinWheel = () => {
    if (wheelSpinning || !wheelAvailable) return;
    setWheelSpinning(true);
    setWheelResult(null);
    const { segment, index, angle } = spinWheel();
    setWheelAngle(angle);
    setTimeout(() => {
      setWheelSpinning(false);
      setWheelResult(index);
      setWheelAvailable(false);
      spinWheelSave(segment.gems);
      setGems((g) => g + segment.gems);
    }, 4000);
  };

  const handleBuy = async (key: "shield" | "extra_life" | "frenzy" | "double" | "freeze", cost: number) => {
    setBuyError(null);
    const success = await buyPowerUp(key, cost);
    if (success) {
      setPowerUps((p) => ({ ...p, [key]: true }));
      setActivePowerUps((p) => ({ ...p, [key]: true }));
      setGems((g) => Math.max(0, g - cost));
    } else {
      setBuyError("Not enough gems!");
      setTimeout(() => setBuyError(null), 2000);
    }
  };

  const handleClaimQuests = async () => {
    const { gems: claimed, claimed: count } = await claimQuestRewards();
    if (count > 0) { setGems((g) => g + claimed); refreshQuests(); }
  };

  const closeModal = () => { setModal(null); setChestReward(null); setWheelResult(null); setBuyError(null); setChestTeaseIndex(-1); };

  const handlePaywallActivated = () => {
    setPremiumState(true);
    setShowPaywall(false);
    resetPaywallState();
  };

  const shakeStyle = shake > 0 ? { animation: `shake 300ms ease-out` } : undefined;
  const activePowerUpCount = Object.values(activePowerUps).filter(Boolean).length;
  const lossChaseActive = lossChase.active && game.gameState === "gameover";

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      <style>{`
        @keyframes shake { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-${shake}px,${shake/2}px)} 40%{transform:translate(${shake}px,-${shake/2}px)} 60%{transform:translate(-${shake/2}px,-${shake/3}px)} 80%{transform:translate(${shake/2}px,${shake/3}px)} }
        @keyframes orbPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes orbAppear { 0%{transform:scale(0) rotate(-180deg);opacity:0} 60%{transform:scale(1.15) rotate(10deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideDownFade { 0%{transform:translateY(-20px);opacity:0} 15%{transform:translateY(0);opacity:1} 85%{transform:translateY(0);opacity:1} 100%{transform:translateY(-20px);opacity:0} }
        @keyframes slideInLeft { 0%{transform:translateX(-100%);opacity:0} 15%{transform:translateX(0);opacity:1} 85%{transform:translateX(0);opacity:1} 100%{transform:translateX(-100%);opacity:0} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px 5px rgba(251,191,36,0.3)} 50%{box-shadow:0 0 40px 15px rgba(251,191,36,0.6)} }
        @keyframes scoreBump { 0%{transform:scale(1)} 50%{transform:scale(1.15)} 100%{transform:scale(1)} }
        @keyframes heartBeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        @keyframes frenzyBg { 0%,100%{background:radial-gradient(circle at 50% 50%,rgba(251,146,60,0.15),transparent 70%)} 50%{background:radial-gradient(circle at 50% 50%,rgba(251,146,60,0.3),transparent 70%)} }
        @keyframes comebackBg { 0%,100%{background:radial-gradient(circle at 50% 50%,rgba(34,197,94,0.12),transparent 70%)} 50%{background:radial-gradient(circle at 50% 50%,rgba(34,197,94,0.25),transparent 70%)} }
        @keyframes freezeBg { 0%,100%{background:radial-gradient(circle at 50% 50%,rgba(125,211,252,0.12),transparent 70%)} 50%{background:radial-gradient(circle at 50% 50%,rgba(125,211,252,0.25),transparent 70%)} }
        @keyframes luckyBg { 0%,100%{background:radial-gradient(circle at 50% 50%,rgba(251,191,36,0.15),transparent 70%)} 50%{background:radial-gradient(circle at 50% 50%,rgba(251,191,36,0.35),transparent 70%)} }
        @keyframes doubleBg { 0%,100%{background:radial-gradient(circle at 50% 50%,rgba(168,85,247,0.12),transparent 70%)} 50%{background:radial-gradient(circle at 50% 50%,rgba(168,85,247,0.25),transparent 70%)} }
        @keyframes dangerPulse { 0%,100%{box-shadow:inset 0 0 60px rgba(239,68,68,0.15)} 50%{box-shadow:inset 0 0 100px rgba(239,68,68,0.3)} }
        @keyframes mysterySpin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
        @keyframes shieldRing { 0%,100%{box-shadow:0 0 15px 3px rgba(59,130,246,0.4)} 50%{box-shadow:0 0 25px 8px rgba(59,130,246,0.7)} }
        @keyframes rainbowShift { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
        @keyframes bossShake { 0%,100%{transform:translate(-50%,-50%) rotate(0)} 25%{transform:translate(-52%,-48%) rotate(-3deg)} 75%{transform:translate(-48%,-52%) rotate(3deg)} }
        @keyframes chestShake { 0%,100%{transform:rotate(0) scale(1)} 25%{transform:rotate(-5deg) scale(1.05)} 75%{transform:rotate(5deg) scale(1.05)} }
        @keyframes chestBurst { 0%{transform:scale(1)} 50%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes modalIn { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes countdownPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.2);opacity:0.7} }
        @keyframes adrenalineBg { 0%,100%{background:radial-gradient(circle at 50% 50%,rgba(239,68,68,0.1),transparent 60%)} 50%{background:radial-gradient(circle at 50% 50%,rgba(239,68,68,0.25),transparent 60%)} }
        @keyframes nudgeShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
        @keyframes firstWinPop { 0%{transform:scale(0) rotate(-10deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes lossChaseGlow { 0%,100%{box-shadow:0 0 20px 5px rgba(249,115,22,0.4)} 50%{box-shadow:0 0 40px 15px rgba(249,115,22,0.7)} }
        @keyframes streakWarningPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes collectionPop { 0%{transform:scale(0) rotate(-15deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
      `}</style>

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-30" />
      {flash && <div className="absolute inset-0 z-40 pointer-events-none" style={{ background: flash }} />}

      {game.frenzy && <div className="absolute inset-0 z-0 pointer-events-none" style={{ animation: "frenzyBg 0.8s ease-in-out infinite" }} />}
      {game.comebackActive && <div className="absolute inset-0 z-0 pointer-events-none" style={{ animation: "comebackBg 0.6s ease-in-out infinite" }} />}
      {game.timeFreeze && <div className="absolute inset-0 z-0 pointer-events-none" style={{ animation: "freezeBg 0.8s ease-in-out infinite" }} />}
      {game.luckyTime && <div className="absolute inset-0 z-0 pointer-events-none" style={{ animation: "luckyBg 0.5s ease-in-out infinite" }} />}
      {game.doublePoints && <div className="absolute inset-0 z-0 pointer-events-none" style={{ animation: "doubleBg 0.8s ease-in-out infinite" }} />}
      {game.gameState === "playing" && game.lives === 1 && <div className="absolute inset-0 z-0 pointer-events-none" style={{ animation: "dangerPulse 0.8s ease-in-out infinite" }} />}
      {game.adrenaline && <div className="absolute inset-0 z-0 pointer-events-none" style={{ animation: "adrenalineBg 0.6s ease-in-out infinite" }} />}

      <div id="game-area" className="absolute inset-0 z-10" style={shakeStyle}>
        {game.gameState === "playing" && game.orbs.map((orb) => {
          const colors = ORB_COLORS[orb.type];
          const age = performance.now() - orb.bornAt;
          const lifePercent = Math.max(0, 1 - age / orb.ttl);
          const isGhost = orb.type === "ghost";
          const isRainbow = orb.type === "rainbow";
          const isBoss = orb.type === "boss";
          return (
            <button key={orb.id} onPointerDown={(e) => handleOrbTap(orb, e)}
              className={`absolute rounded-full bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-2xl ${colors.glow} cursor-pointer transition-transform hover:scale-110 active:scale-90`}
              style={{
                left: `${orb.x}%`, top: `${orb.y}%`, width: orb.size, height: orb.size,
                transform: "translate(-50%, -50%)",
                animation: isBoss ? `orbAppear 200ms ease-out, bossShake 400ms ease-in-out infinite`
                  : isRainbow ? `orbAppear 200ms ease-out, orbPulse 600ms ease-in-out infinite, rainbowShift 2s linear infinite`
                  : `orbAppear 200ms ease-out, orbPulse 800ms ease-in-out ${orb.pulse}s infinite`,
                opacity: isGhost ? 0.5 : lifePercent < 0.3 ? lifePercent * 2 : 1,
              }}>
              {orb.type === "golden" && <Star className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" fill="white" />}
              {orb.type === "bomb" && <span className="absolute inset-0 flex items-center justify-center text-2xl">💣</span>}
              {orb.type === "bonus" && <Sparkles className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "frenzy" && <Zap className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" fill="white" />}
              {orb.type === "mystery" && <HelpCircle className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" style={{ animation: "mysterySpin 2s linear infinite" }} />}
              {orb.type === "shield" && <Shield className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "comeback" && <TrendingUp className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "rainbow" && <Rainbow className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "boss" && (<><Swords className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />{orb.hp && orb.maxHp && (<div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-1.5 rounded-full bg-black/50 overflow-hidden"><div className="h-full bg-red-400 rounded-full" style={{ width: `${(orb.hp / orb.maxHp) * 100}%` }} /></div>)}</>)}
              {orb.type === "timefreeze" && <Snowflake className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "chain" && <LinkIcon className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "ghost" && <Ghost className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "treasure" && <Gift className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "normal" && <span className="absolute inset-0 flex items-center justify-center"><span className="w-1/3 h-1/3 rounded-full bg-white/40" /></span>}
              {!isBoss && (<svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" strokeDasharray={`${lifePercent * 289} 289`} /></svg>)}
            </button>
          );
        })}

        {/* IDLE / START SCREEN */}
        {game.gameState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-y-auto py-8">
            <div className="text-center px-6 max-w-lg" style={{ animation: "slideUp 600ms ease-out" }}>
              {/* Streak FOMO warning */}
              {showStreakWarning && game.dailyStreak >= 2 && (
                <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/15 border border-orange-400/40 text-orange-300 text-sm font-bold" style={{ animation: "streakWarningPulse 1.5s ease-in-out infinite" }}>
                  <AlertTriangle className="w-4 h-4" />
                  You're on a {game.dailyStreak}-day streak! Don't lose it!
                </div>
              )}

              <div className="mb-6 flex justify-center gap-2">
                {[Star, Zap, Flame, Crown, Shield].map((Icon, i) => (
                  <div key={i} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center" style={{ animation: `orbPulse 1.5s ease-in-out ${i * 0.2}s infinite` }}>
                    <Icon className="w-7 h-7 text-cyan-300" />
                  </div>
                ))}
              </div>
              <h1 className="text-5xl font-black text-white mb-3 tracking-tight">ORBRUSH<span className="text-cyan-400">.FUN</span></h1>

              {game.prestige > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-sm font-bold mb-3">
                  <Crown className="w-4 h-4" /> Prestige {game.prestige} · +{Math.round(game.prestige * 10)}% points
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 text-sm font-bold mb-3">
                <Gem className="w-4 h-4" /> {gems.toLocaleString()} gems
              </div>
              {game.sessionStreak > 1 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-sm font-bold mb-3">
                  <Flame className="w-4 h-4" fill="currentColor" /> Streak: {game.sessionStreak} games · Next: {game.sessionMult.toFixed(1)}x points!
                </div>
              )}
              {collectionStats.discovered > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-sm font-bold mb-3">
                  <BookOpen className="w-4 h-4" /> Collection: {collectionStats.discovered}/{collectionStats.total}
                </div>
              )}

              {activePowerUpCount > 0 && (
                <div className="mb-3 flex items-center justify-center gap-2 flex-wrap">
                  {activePowerUps.shield && <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold">🛡️ Shield</span>}
                  {activePowerUps.extra_life && <span className="text-xs px-2 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-bold">❤️ Extra Life</span>}
                  {activePowerUps.frenzy && <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 font-bold">⚡ Frenzy</span>}
                  {activePowerUps.double && <span className="text-xs px-2 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300 font-bold">✨ Double</span>}
                  {activePowerUps.freeze && <span className="text-xs px-2 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-bold">❄️ Freeze</span>}
                </div>
              )}

              <p className="text-slate-400 text-lg mb-2">Tap the orbs. Build combos. Unlock achievements.</p>
              <p className="text-slate-500 text-sm mb-6">How many points can you score before losing all your lives?</p>

              {/* Meta-game buttons */}
              <div className="mb-4 flex items-center justify-center gap-2 flex-wrap">
                <button onClick={() => setModal("chest")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 font-bold text-sm hover:bg-amber-500/25 transition-colors">
                  <Gift className="w-4 h-4" /> Free Chest
                </button>
                <button onClick={() => setModal("wheel")} disabled={!wheelAvailable} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold text-sm hover:bg-cyan-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <Target className="w-4 h-4" /> Wheel {wheelAvailable ? "" : "(used)"}
                </button>
                <button onClick={() => setModal("quests")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/15 border border-green-400/30 text-green-300 font-bold text-sm hover:bg-green-500/25 transition-colors">
                  <CheckCircle2 className="w-4 h-4" /> Quests
                </button>
                <button onClick={() => setModal("shop")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 font-bold text-sm hover:bg-fuchsia-500/25 transition-colors">
                  <ShoppingBag className="w-4 h-4" /> Shop
                </button>
                <button onClick={() => setModal("collection")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold text-sm hover:bg-emerald-500/25 transition-colors">
                  <BookOpen className="w-4 h-4" /> Collection
                </button>
              </div>

              {game.challengeTarget > 0 && !game.challengeDone && (
                <div className="mb-6 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-400/30">
                  <Target className="w-5 h-5 text-green-400" />
                  <div className="text-left">
                    <div className="text-green-300 font-bold text-sm">Daily Challenge</div>
                    <div className="text-slate-400 text-xs">Reach {game.challengeTarget.toLocaleString()} points today</div>
                  </div>
                </div>
              )}
              {game.challengeDone && (
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-400/40 text-green-300 font-bold text-sm">
                  <Award className="w-4 h-4" /> Today's challenge complete!
                </div>
              )}

              {loadedStats && (
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5">
                    <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <div className="text-amber-400 font-bold text-lg">{loadedStats.high.toLocaleString()}</div>
                    <div className="text-slate-500 text-[10px]">Best</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5">
                    <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                    <div className="text-orange-400 font-bold text-lg">{game.dailyStreak}</div>
                    <div className="text-slate-500 text-[10px]">Days</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5">
                    <Target className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <div className="text-cyan-400 font-bold text-lg">{loadedStats.totalTaps.toLocaleString()}</div>
                    <div className="text-slate-500 text-[10px]">Taps</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5">
                    <Crown className="w-4 h-4 text-amber-300 mx-auto mb-1" />
                    <div className="text-amber-300 font-bold text-lg">{loadedStats.prestige}</div>
                    <div className="text-slate-500 text-[10px]">Prestige</div>
                  </div>
                </div>
              )}

              <button onClick={handleStartGame} className="group relative px-12 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xl shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-transform">
                <span className="flex items-center gap-3"><Play className="w-6 h-6" fill="white" />PLAY</span>
              </button>

              <div className="mt-6 flex flex-wrap gap-1.5 justify-center text-[11px] text-slate-500 max-w-md mx-auto">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" /> +10</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><Star className="w-2.5 h-2.5 text-amber-400" /> +100</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><Sparkles className="w-2.5 h-2.5 text-fuchsia-400" /> +50</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><Zap className="w-2.5 h-2.5 text-orange-400" /> Frenzy</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><HelpCircle className="w-2.5 h-2.5 text-violet-400" /> Mystery</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><Shield className="w-2.5 h-2.5 text-blue-400" /> Shield</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><TrendingUp className="w-2.5 h-2.5 text-green-400" /> Comeback</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><Rainbow className="w-2.5 h-2.5 text-pink-400" /> Rainbow</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><Swords className="w-2.5 h-2.5 text-red-400" /> Boss</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><Snowflake className="w-2.5 h-2.5 text-sky-400" /> Freeze</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><LinkIcon className="w-2.5 h-2.5 text-yellow-400" /> Chain</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><Ghost className="w-2.5 h-2.5 text-slate-300" /> Ghost</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><Gift className="w-2.5 h-2.5 text-amber-400" /> Treasure</span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700"><span>💣</span> Avoid!</span>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {game.gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-950/60 backdrop-blur-sm">
            <div className="text-center px-6 max-w-md" style={{ animation: "slideUp 500ms ease-out" }}>
              {/* Loss-chase bonus banner */}
              {lossChaseActive && (
                <div className="mb-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500/20 border-2 border-orange-400/50 text-orange-300 font-black" style={{ animation: "lossChaseGlow 1s ease-in-out infinite" }}>
                  <Timer className="w-5 h-5" />
                  {lossChase.reason} · {lossChase.secondsLeft}s
                </div>
              )}
              {game.newRecord && game.score > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-sm mb-3" style={{ animation: "pulseGlow 1s ease-in-out infinite" }}>
                  <Crown className="w-4 h-4" /> NEW RECORD!
                </div>
              )}
              {game.prestige > 0 && (loadedStats?.prestige ?? 0) < game.prestige && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-sm mb-3">
                  <Crown className="w-4 h-4" /> PRESTIGE {game.prestige}! +10% permanent
                </div>
              )}
              <h2 className="text-4xl font-black text-white mb-2">Game Over</h2>
              <div className="text-6xl font-black text-cyan-400 mb-2" style={{ animation: "scoreBump 600ms ease-out" }}>{game.score.toLocaleString()}</div>
              {game.gems > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 text-sm font-bold mb-4">
                  <Gem className="w-4 h-4" /> +{game.gems} gems earned!
                </div>
              )}
              {game.firstWinToday && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-sm font-bold mb-3" style={{ animation: "firstWinPop 500ms ease-out" }}>
                  <Star className="w-4 h-4" fill="currentColor" /> First win of the day! +100 gems!
                </div>
              )}
              {game.nearRecord && !game.newRecord && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/15 border border-orange-400/40 text-orange-300 text-sm font-bold mb-3" style={{ animation: "nudgeShake 0.5s ease-in-out 3" }}>
                  <Trophy className="w-4 h-4" /> You were only {game.recordGap.toLocaleString()} points from the record!
                </div>
              )}
              {game.sessionStreak > 1 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-sm font-bold mb-4">
                  <Flame className="w-4 h-4" fill="currentColor" /> {game.sessionStreak} games in a row · {game.sessionMult.toFixed(1)}x bonus!
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                  <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                  <div className="text-orange-400 font-bold text-xl">{game.bestCombo}</div>
                  <div className="text-slate-500 text-[10px]">Combo</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                  <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <div className="text-amber-400 font-bold text-xl">Lv {game.level}</div>
                  <div className="text-slate-500 text-[10px]">Level</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                  <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <div className="text-yellow-400 font-bold text-xl">{game.totalGolden}</div>
                  <div className="text-slate-500 text-[10px]">Golden</div>
                </div>
              </div>

              <button onClick={() => setModal("chest")} className="mb-3 w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-transform">
                <span className="flex items-center justify-center gap-2"><Gift className="w-5 h-5" /> OPEN FREE CHEST</span>
              </button>
              {game.canRevive && game.score > 0 && (
                <button onClick={game.revive} className="mb-3 w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-2xl shadow-green-500/40 hover:scale-105 active:scale-95 transition-transform">
                  <span className="flex items-center justify-center gap-2"><Heart className="w-5 h-5" fill="currentColor" /> REVIVE (1 life)</span>
                </button>
              )}
              <button onClick={handleStartGame} className={`group px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-2xl hover:scale-105 active:scale-95 transition-transform ${lossChaseActive ? "bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/40" : "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/40"}`}>
                <span className="flex items-center gap-2"><RotateCcw className="w-5 h-5" /> {lossChaseActive ? `PLAY (${lossChase.multiplier}x BONUS!)` : "PLAY AGAIN"}</span>
              </button>
              {game.autoRestartCountdown > 0 && (
                <div className="mt-4 text-slate-400 text-sm">Restarting in <span className="text-cyan-400 font-bold" style={{ animation: "countdownPulse 1s ease-in-out infinite" }}>{game.autoRestartCountdown}</span>s</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* HUD */}
      {game.gameState === "playing" && (
        <>
          <div className="absolute top-0 left-0 right-0 z-20 p-3 pointer-events-none">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Score</div>
                <div key={game.score} className="text-2xl font-black text-white tabular-nums leading-none" style={{ animation: "scoreBump 200ms ease-out" }}>{game.score.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">
                  Best: {Math.max(game.highScore, game.score).toLocaleString()}
                  {game.prestige > 0 && <span className="text-amber-300 ml-1">· P{game.prestige}</span>}
                  {game.doublePoints && <span className="text-fuchsia-300 ml-1">· 2x</span>}
                  {game.adrenaline && <span className="text-red-400 ml-1 font-bold">· ADRENALINE 1.5x</span>}
                  {game.sessionMult > 1 && <span className="text-cyan-300 ml-1">· Session {game.sessionMult.toFixed(1)}x</span>}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Lives</div>
                <div className="flex gap-1 items-center">
                  {Array.from({ length: Math.min(game.lives, 4) }).map((_, i) => (
                    <Heart key={i} className={`w-5 h-5 transition-all ${i < game.lives ? "text-rose-500 fill-rose-500" : "text-slate-700"}`} style={i < game.lives ? { animation: "heartBeat 1s ease-in-out infinite" } : undefined} />
                  ))}
                  {game.hasShield && <Shield className="w-5 h-5 text-blue-400 ml-1" style={{ animation: "shieldRing 1s ease-in-out infinite" }} />}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Level</div>
                <div className="text-2xl font-black text-cyan-400 tabular-nums leading-none">{game.level}</div>
                <div className="w-24 h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300" style={{ width: `${(game.score % 500) / 5}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {game.progressiveJackpot > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30">
                  <span className="text-[10px] text-amber-300 font-bold">PROG. JACKPOT</span>
                  <span className="text-xs text-amber-400 font-black tabular-nums">{game.progressiveJackpot}</span>
                </div>
              )}
              {game.luckyStreak >= 3 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-400/30">
                  <span className="text-[10px] text-green-300 font-bold">LUCKY x{game.luckyStreak}</span>
                  <span className="text-xs text-green-400 font-black tabular-nums">{game.luckyMult.toFixed(1)}x</span>
                </div>
              )}
              {game.gems > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/30">
                  <Gem className="w-3 h-3 text-fuchsia-300" />
                  <span className="text-xs text-fuchsia-300 font-black tabular-nums">{game.gems}</span>
                </div>
              )}
              {game.challengeTarget > 0 && !game.challengeDone && (
                <div className="flex-1 min-w-[120px] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, (game.score / game.challengeTarget) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-green-400 font-bold tabular-nums">{Math.min(100, Math.round((game.score / game.challengeTarget) * 100))}%</span>
                </div>
              )}
              {game.challengeDone && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-400/30">
                  <Award className="w-3 h-3 text-green-400" /><span className="text-[10px] text-green-300 font-bold">Challenge done!</span>
                </div>
              )}
            </div>
          </div>

          {game.combo > 0 && (
            <div className="absolute z-20 p-3 pointer-events-none flex flex-col items-center" style={{ bottom: "70px", left: "50%", transform: "translateX(-50%)" }}>
              <div key={game.combo} className="flex items-center gap-2 px-5 py-1.5 rounded-full border-2" style={{
                background: game.combo >= 25 ? "linear-gradient(90deg, rgba(251,191,36,0.2), rgba(249,115,22,0.2))" : "rgba(15,23,42,0.7)",
                borderColor: game.combo >= 25 ? "rgba(251,191,36,0.5)" : game.combo >= 10 ? "rgba(168,85,247,0.5)" : "rgba(34,211,238,0.4)",
                animation: "scoreBump 200ms ease-out",
              }}>
                <Flame className={`w-4 h-4 ${game.combo >= 25 ? "text-amber-400" : game.combo >= 10 ? "text-fuchsia-400" : "text-cyan-400"}`} fill="currentColor" />
                <span className={`font-black text-lg tabular-nums ${game.combo >= 25 ? "text-amber-300" : game.combo >= 10 ? "text-fuchsia-300" : "text-cyan-300"}`}>COMBO x{game.combo}</span>
                {game.combo >= 5 && <span className="text-[10px] text-slate-400 font-bold">{game.combo >= 25 ? "3x" : game.combo >= 15 ? "2.5x" : game.combo >= 10 ? "2x" : "1.5x"}</span>}
              </div>
              <div className="mt-1 w-32 h-1 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full transition-none" style={{
                  width: `${game.comboDecay * 100}%`,
                  background: game.combo >= 25 ? "linear-gradient(90deg, #fbbf24, #f97316)" : game.combo >= 10 ? "linear-gradient(90deg, #a855f7, #d946ef)" : "linear-gradient(90deg, #22d3ee, #3b82f6)",
                }} />
              </div>
            </div>
          )}

          {game.frenzy && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-orange-500/20 border-2 border-orange-400/50 backdrop-blur-sm" style={{ animation: "pulseGlow 0.8s ease-in-out infinite" }}>
                <Zap className="w-6 h-6 text-orange-300" fill="currentColor" />
                <div className="text-center"><div className="text-xl font-black text-orange-300">FRENZY</div><div className="text-xs text-orange-200">2x points · {game.frenzyTime}s</div></div>
              </div>
            </div>
          )}
          {game.comebackActive && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style={{ marginTop: "60px" }}>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-green-500/20 border-2 border-green-400/50 backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <div className="text-center"><div className="text-lg font-black text-green-300">COMEBACK 3x</div><div className="text-xs text-green-200">{game.comebackTime}s</div></div>
              </div>
            </div>
          )}
          {game.timeFreeze && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style={{ marginTop: game.comebackActive ? "120px" : "60px" }}>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-500/20 border-2 border-sky-400/50 backdrop-blur-sm">
                <Snowflake className="w-5 h-5 text-sky-300" />
                <div className="text-center"><div className="text-lg font-black text-sky-300">TIME FROZEN</div><div className="text-xs text-sky-200">{game.timeFreezeTime}s</div></div>
              </div>
            </div>
          )}
          {game.luckyTime && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style={{ marginTop: game.timeFreeze ? "180px" : game.comebackActive ? "180px" : "120px" }}>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 backdrop-blur-sm" style={{ animation: "pulseGlow 0.5s ease-in-out infinite" }}>
                <Star className="w-5 h-5 text-amber-300" fill="currentColor" />
                <div className="text-center"><div className="text-lg font-black text-amber-300">LUCKY TIME</div><div className="text-xs text-amber-200">Golden at 35%! · {game.luckyTimeLeft}s</div></div>
              </div>
            </div>
          )}
          {game.doublePoints && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/20 border-2 border-fuchsia-400/50 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-fuchsia-300" />
                <span className="text-sm font-black text-fuchsia-300">2x POINTS · {game.doubleTimeLeft}s</span>
              </div>
            </div>
          )}
          {game.adrenaline && (
            <div className="absolute z-20 pointer-events-none" style={{ bottom: "70px", left: "50%", transform: "translateX(-50%)" }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border-2 border-red-400/50 backdrop-blur-sm" style={{ animation: "pulseGlow 0.5s ease-in-out infinite" }}>
                <Zap className="w-4 h-4 text-red-400" fill="currentColor" />
                <span className="text-sm font-black text-red-300">ADRENALINE 1.5x</span>
              </div>
            </div>
          )}
          {game.score > 0 && game.highScore > 0 && game.score < game.highScore && (game.highScore - game.score) <= 500 && (
            <div className="absolute z-20 pointer-events-none" style={{ bottom: "120px", left: "50%", transform: "translateX(-50%)" }}>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40" style={{ animation: "nudgeShake 0.5s ease-in-out 3" }}>
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">Only {(game.highScore - game.score).toLocaleString()} pts from the record!</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Social proof notifications */}
      {socialNotifs.length > 0 && (
        <div className="absolute z-40 flex flex-col gap-2 pointer-events-none" style={{ bottom: "70px", left: "16px" }}>
          {socialNotifs.map((n) => (
            <div key={n.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-600/50 shadow-lg backdrop-blur-sm" style={{ animation: "slideInLeft 5s ease-in-out forwards" }}>
              <span className="text-lg">{n.icon}</span>
              <span className="text-xs text-slate-300 font-medium">{n.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mute button */}
<button onClick={toggleMute} className="absolute top-3 right-3 translate-y-[10px] z-50 w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
</button>

      {/* Achievement popups */}
      <div className="absolute top-16 right-3 z-50 flex flex-col gap-2 pointer-events-none">
        {achievements.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/90 border border-amber-400/40 shadow-xl backdrop-blur-sm" style={{ animation: "slideDownFade 3.5s ease-in-out forwards" }}>
            <span className="text-xl">{a.icon}</span>
            <div><div className="text-amber-300 font-bold text-xs">{a.title}</div><div className="text-slate-400 text-[10px]">{a.desc}</div></div>
          </div>
        ))}
      </div>

      {/* Collection discovery popup */}
      {collectionPopup && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/50 backdrop-blur-md" style={{ animation: "collectionPop 500ms ease-out, slideDownFade 3s ease-in-out forwards" }}>
            <span className="text-4xl">{collectionPopup.icon}</span>
            <div className="text-lg font-black text-emerald-300">NEW ORB!</div>
            <div className="text-sm text-emerald-200">{collectionPopup.label}</div>
          </div>
        </div>
      )}

      {/* Daily streak popup */}
      {showStreakPopup && streakInfo && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-orange-500/20 border-2 border-orange-400/50 backdrop-blur-md" style={{ animation: "slideDownFade 4s ease-in-out forwards" }}>
            <Flame className="w-10 h-10 text-orange-400" fill="currentColor" />
            <div className="text-2xl font-black text-orange-300">{streakInfo.streak} days in a row!</div>
            <div className="text-sm text-orange-200">Come back tomorrow to keep the fire going</div>
          </div>
        </div>
      )}

      {/* Daily challenge popup */}
      {showChallengePopup && challengeInfo && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-green-500/20 border-2 border-green-400/50 backdrop-blur-md" style={{ animation: "slideDownFade 4.5s ease-in-out forwards" }}>
            <Target className="w-10 h-10 text-green-400" />
            <div className="text-xl font-black text-green-300">Today's Challenge!</div>
            <div className="text-sm text-green-200">Reach {challengeInfo.target.toLocaleString()} points</div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" onClick={closeModal}>
          <div className="relative max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn 300ms ease-out" }}>
            <button onClick={closeModal} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10">
              <X className="w-4 h-4" />
            </button>

            {/* CHEST MODAL with near-miss tease */}
            {modal === "chest" && (
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center">
                <h3 className="text-2xl font-black text-white mb-1">Free Chest</h3>
                <p className="text-slate-400 text-sm mb-6">Open it and win gems! Better rarities give more.</p>

                {!chestOpening && !chestReward && (
                  <button onClick={handleOpenChest} className="mx-auto block">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-2 border-amber-400/40 flex items-center justify-center hover:scale-110 transition-transform" style={{ animation: "orbPulse 2s ease-in-out infinite" }}>
                      <Gift className="w-16 h-16 text-amber-400" />
                    </div>
                  </button>
                )}

                {chestOpening && (
                  <div>
                    <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-2 border-amber-400/40 flex items-center justify-center" style={{ animation: "chestShake 300ms ease-in-out infinite" }}>
                      <Gift className="w-16 h-16 text-amber-400" />
                    </div>
                    {/* Tease rarity sequence */}
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                      {chestTeaseRarities.map((r, i) => {
                        const colors: Record<ChestRarity, string> = {
                          common: "bg-slate-500", rare: "bg-blue-500", epic: "bg-fuchsia-500",
                          legendary: "bg-amber-500", mythic: "bg-rose-500",
                        };
                        return (
                          <div key={i} className={`w-3 h-3 rounded-full transition-all ${i === chestTeaseIndex ? `${colors[r]} scale-150 shadow-lg` : "bg-slate-700"}`} style={i === chestTeaseIndex ? { animation: "scoreBump 150ms ease-out" } : undefined} />
                        );
                      })}
                    </div>
                    {chestTeaseIndex >= 0 && chestTeaseIndex < chestTeaseRarities.length && (
                      <div className="mt-2 text-sm font-bold" style={{ color: ["#94a3b8", "#3b82f6", "#d946ef", "#f59e0b", "#f43f5e"][RARITY_ORDER.indexOf(chestTeaseRarities[chestTeaseIndex])] }}>
                        {["Common", "Rare", "Epic", "Legendary", "MYTHIC"][RARITY_ORDER.indexOf(chestTeaseRarities[chestTeaseIndex])]}
                      </div>
                    )}
                  </div>
                )}

                {chestReward && (
                  <div style={{ animation: "chestBurst 500ms ease-out" }}>
                    <div className={`w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br ${chestReward.color} border-2 border-white/30 flex items-center justify-center shadow-2xl ${chestReward.glow}`} style={{ animation: "pulseGlow 1s ease-in-out infinite" }}>
                      <Gem className="w-16 h-16 text-white" />
                    </div>
                    <div className="mt-4 text-3xl font-black text-white">{chestReward.label}!</div>
                    <div className="mt-1 text-4xl font-black text-amber-400">+{chestReward.gems} gems</div>
                    {chestReward.rarity === "mythic" && <div className="mt-2 text-rose-400 font-black text-sm" style={{ animation: "countdownPulse 0.5s ease-in-out infinite" }}>MYTHIC! INCREDIBLE!</div>}
                    {chestReward.rarity === "legendary" && <div className="mt-2 text-amber-400 font-black text-sm">LEGENDARY!</div>}
                    <button onClick={() => setChestReward(null)} className="mt-6 px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:scale-105 active:scale-95 transition-transform">Continue</button>
                  </div>
                )}
              </div>
            )}

            {/* WHEEL MODAL */}
            {modal === "wheel" && (
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 text-center">
                <h3 className="text-2xl font-black text-white mb-1">Daily Wheel</h3>
                <p className="text-slate-400 text-sm mb-6">{wheelAvailable ? "Spin and win gems!" : "You already spun today. Come back tomorrow!"}</p>
                <div className="relative w-56 h-56 mx-auto mb-6">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-amber-400" />
                  <div className="absolute inset-0 rounded-full border-4 border-slate-600 overflow-hidden" style={{ transform: `rotate(${wheelAngle}deg)`, transition: wheelSpinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none" }}>
                    {WHEEL_SEGMENTS.map((seg, i) => {
                      const segAngle = 360 / WHEEL_SEGMENTS.length;
                      const startAngle = i * segAngle - 90;
                      return (
                        <div key={i} className="absolute inset-0 flex items-center justify-center" style={{
                          clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle * Math.PI) / 180)}% ${50 + 50 * Math.sin((startAngle * Math.PI) / 180)}%, ${50 + 50 * Math.cos(((startAngle + segAngle) * Math.PI) / 180)}% ${50 + 50 * Math.sin(((startAngle + segAngle) * Math.PI) / 180)}%)`,
                          background: seg.color,
                        }}>
                          <span className="text-white font-black text-sm" style={{ transform: `rotate(${startAngle + segAngle / 2}deg) translateY(-60px)` }}>{seg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {wheelResult !== null && !wheelSpinning && (
                  <div className="mb-4 text-2xl font-black text-amber-400" style={{ animation: "scoreBump 500ms ease-out" }}>+{WHEEL_SEGMENTS[wheelResult].gems} gems!</div>
                )}
                <button onClick={handleSpinWheel} disabled={!wheelAvailable || wheelSpinning} className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed">
                  {wheelSpinning ? "Spinning..." : wheelAvailable ? "SPIN" : "Come back tomorrow"}
                </button>
              </div>
            )}

            {/* SHOP MODAL */}
            {modal === "shop" && (
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black text-white">Power-up Shop</h3>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 font-bold text-sm"><Gem className="w-4 h-4" /> {gems}</div>
                </div>
                <p className="text-slate-400 text-sm mb-4">Buy power-ups for your next game. They activate automatically.</p>
                {buyError && <div className="mb-3 text-rose-400 text-sm font-bold text-center">{buyError}</div>}
                <div className="space-y-2">
                  {POWER_UPS.map((p) => {
                    const owned = powerUps[p.key as keyof PowerUps];
                    return (
                      <div key={p.key} className={`flex items-center gap-3 p-3 rounded-xl border ${owned ? "bg-green-500/10 border-green-400/30" : "bg-slate-800/60 border-slate-700"}`}>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-lg flex-shrink-0`}>{p.icon}</div>
                        <div className="flex-1 min-w-0"><div className="text-white font-bold text-sm">{p.name}</div><div className="text-slate-400 text-xs">{p.desc}</div></div>
                        {owned ? <div className="flex items-center gap-1 text-green-400 font-bold text-xs"><CheckCircle2 className="w-4 h-4" /> Active</div>
                          : <button onClick={() => handleBuy(p.key, p.cost)} disabled={gems < p.cost} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs ${gems >= p.cost ? "bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300 hover:bg-fuchsia-500/30" : "bg-slate-700/50 border border-slate-600 text-slate-500 cursor-not-allowed"} transition-colors`}><Gem className="w-3 h-3" /> {p.cost}</button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUESTS MODAL */}
            {modal === "quests" && (
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black text-white">Daily Quests</h3>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 font-bold text-sm"><Gem className="w-4 h-4" /> {gems}</div>
                </div>
                <p className="text-slate-400 text-sm mb-4">Complete 3 quests and earn 50 gems each!</p>
                <div className="space-y-2 mb-4">
                  {quests.length === 0 && <div className="text-slate-500 text-sm text-center py-4">Loading quests...</div>}
                  {quests.map((q, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${q.claimed ? "bg-slate-800/30 border-slate-700" : q.done ? "bg-green-500/10 border-green-400/30" : "bg-slate-800/60 border-slate-700"}`}>
                      <span className="text-xl flex-shrink-0">{questIcon(q.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm ${q.claimed ? "text-slate-500 line-through" : "text-white"}`}>{questLabel(q.type)}</div>
                        <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden mt-1"><div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }} /></div>
                        <div className="text-slate-400 text-xs mt-0.5">{q.progress} / {q.target}</div>
                      </div>
                      {q.claimed ? <span className="text-slate-500 text-xs font-bold">Claimed</span>
                        : q.done ? <span className="flex items-center gap-1 text-green-400 text-xs font-bold"><CheckCircle2 className="w-4 h-4" /> +50</span>
                        : <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
                {quests.some((q) => q.done && !q.claimed) && (
                  <button onClick={handleClaimQuests} className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:scale-105 active:scale-95 transition-transform">Claim Rewards</button>
                )}
              </div>
            )}

            {/* COLLECTION MODAL */}
            {modal === "collection" && (
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black text-white">Orb Collection</h3>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold text-sm">
                    <BookOpen className="w-4 h-4" /> {collectionStats.discovered}/{collectionStats.total}
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-4">Discover all orb types! Each one has different effects.</p>
                <div className="grid grid-cols-3 gap-3">
                  {collectionEntries.map((entry) => (
                    <div key={entry.type} className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${entry.discovered ? "bg-slate-800/60 border-slate-600" : "bg-slate-800/20 border-slate-700/50"}`}>
                      <div className={`text-3xl ${entry.discovered ? "" : "opacity-30 grayscale"}`}>{entry.discovered ? entry.icon : "❓"}</div>
                      <div className={`text-xs font-bold text-center ${entry.discovered ? "text-white" : "text-slate-600"}`}>{entry.discovered ? entry.label : "???"}</div>
                      {entry.discovered && entry.count > 0 && <div className="text-[10px] text-slate-500">x{entry.count}</div>}
                    </div>
                  ))}
                </div>
                {collectionStats.discovered === collectionStats.total && (
                  <div className="mt-4 text-center text-amber-400 font-black text-sm" style={{ animation: "pulseGlow 1s ease-in-out infinite" }}>
                    🏅 CONGRATULATIONS! Collection complete!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYWALL MODAL */}
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} onActivated={handlePaywallActivated} />
    </div>
  );
}

export default App;
