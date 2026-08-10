import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Star,
  Heart,
  Zap,
  Trophy,
  Target,
  Sparkles,
  Crown,
  Shield,
  HelpCircle,
  TrendingUp,
  Award,
  Clock,
} from "lucide-react";
import { useParticleCanvas } from "@/lib/particles";
import { useGame, type Orb, type Achievement } from "@/lib/useGame";
import { setMuted, isMuted } from "@/lib/sound";
import { loadStats, saveStats, updateDailyStreak, rollDailyChallenge, updateChallengeProgress } from "@/lib/supabase";

const ORB_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  normal: { bg: "from-cyan-400 to-blue-500", border: "border-cyan-300", glow: "shadow-cyan-400/50" },
  golden: { bg: "from-amber-300 to-yellow-500", border: "border-amber-200", glow: "shadow-amber-400/60" },
  bomb: { bg: "from-red-500 to-rose-700", border: "border-red-400", glow: "shadow-red-500/60" },
  bonus: { bg: "from-fuchsia-400 to-purple-500", border: "border-fuchsia-300", glow: "shadow-fuchsia-400/50" },
  frenzy: { bg: "from-orange-400 to-red-500", border: "border-orange-300", glow: "shadow-orange-400/60" },
  mystery: { bg: "from-violet-400 to-indigo-500", border: "border-violet-300", glow: "shadow-violet-400/60" },
  shield: { bg: "from-blue-400 to-cyan-600", border: "border-blue-300", glow: "shadow-blue-400/60" },
  comeback: { bg: "from-green-400 to-emerald-600", border: "border-green-300", glow: "shadow-green-400/60" },
};

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
    prestige: number; totalGames: number; totalJackpots: number;
  } | null>(null);
  const [challengeInfo, setChallengeInfo] = useState<{ target: number; isNew: boolean } | null>(null);
  const [showChallengePopup, setShowChallengePopup] = useState(false);
  const shakeTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const onAchievement = useCallback((a: Achievement) => {
    setAchievements((prev) => [...prev, a]);
    setTimeout(() => {
      setAchievements((prev) => prev.filter((x) => x.id !== a.id));
    }, 3500);
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

  const game = useGame({
    onBurst: burst,
    onFloatText: floatText,
    onShockwave: shockwave,
    onAchievement,
    onScreenShake,
    onFlash,
  });

  // Load stats + daily challenge on mount
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
          high: stats.high_score,
          bestCombo: stats.best_combo,
          streak: stats.daily_streak,
          totalTaps: stats.total_taps,
          totalGolden: stats.total_golden,
          prestige: stats.prestige,
          totalGames: stats.total_games,
          totalJackpots: stats.total_jackpots,
        });
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
        if (challengeResult.isNew) {
          setShowChallengePopup(true);
          setTimeout(() => setShowChallengePopup(false), 4500);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save stats on game over
  useEffect(() => {
    if (game.gameState === "gameover") {
      const newHigh = Math.max(game.highScore, game.score);
      const newBestCombo = Math.max(loadedStats?.bestCombo ?? 0, game.bestCombo);
      saveStats({
        high_score: newHigh,
        best_combo: newBestCombo,
        total_taps: (loadedStats?.totalTaps ?? 0) + game.totalTaps,
        total_golden: (loadedStats?.totalGolden ?? 0) + game.totalGolden,
        current_level: game.level,
        prestige: game.prestige,
        total_games: (loadedStats?.totalGames ?? 0) + 1,
        total_jackpots: (loadedStats?.totalJackpots ?? 0) + game.totalJackpots,
        daily_challenge_progress: Math.max(game.score, loadedStats?.high ?? 0),
      });
      if (game.score > (loadedStats?.high ?? 0)) {
        game.setHighScore(game.score);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameState]);

  // Update challenge progress during play
  useEffect(() => {
    if (game.gameState === "playing" && game.score > 0 && game.challengeTarget > 0 && !game.challengeDone) {
      const t = setTimeout(() => updateChallengeProgress(game.score), 1000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.score]);

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    setMutedState(m);
  };

  const handleOrbTap = (orb: Orb, e: React.PointerEvent) => {
    e.stopPropagation();
    game.tapOrb(orb, e.clientX, e.clientY);
  };

  const shakeStyle = shake > 0 ? { animation: `shake 300ms ease-out` } : undefined;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-${shake}px, ${shake / 2}px); }
          40% { transform: translate(${shake}px, -${shake / 2}px); }
          60% { transform: translate(-${shake / 2}px, -${shake / 3}px); }
          80% { transform: translate(${shake / 2}px, ${shake / 3}px); }
        }
        @keyframes orbPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes orbAppear {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideDownFade {
          0% { transform: translateY(-20px); opacity: 0; }
          15% { transform: translateY(0); opacity: 1; }
          85% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px 5px rgba(251,191,36,0.3); }
          50% { box-shadow: 0 0 40px 15px rgba(251,191,36,0.6); }
        }
        @keyframes scoreBump { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        @keyframes heartBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        @keyframes frenzyBg {
          0%, 100% { background: radial-gradient(circle at 50% 50%, rgba(251,146,60,0.15), transparent 70%); }
          50% { background: radial-gradient(circle at 50% 50%, rgba(251,146,60,0.3), transparent 70%); }
        }
        @keyframes comebackBg {
          0%, 100% { background: radial-gradient(circle at 50% 50%, rgba(34,197,94,0.12), transparent 70%); }
          50% { background: radial-gradient(circle at 50% 50%, rgba(34,197,94,0.25), transparent 70%); }
        }
        @keyframes dangerPulse {
          0%, 100% { box-shadow: inset 0 0 60px rgba(239,68,68,0.15); }
          50% { box-shadow: inset 0 0 100px rgba(239,68,68,0.3); }
        }
        @keyframes mysterySpin { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }
        @keyframes shieldRing {
          0%, 100% { box-shadow: 0 0 15px 3px rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 25px 8px rgba(59,130,246,0.7); }
        }
        @keyframes ghostPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-30" />

      {/* Flash overlay */}
      {flash && <div className="absolute inset-0 z-40 pointer-events-none" style={{ background: flash }} />}

      {/* Frenzy background */}
      {game.frenzy && <div className="absolute inset-0 z-0 pointer-events-none" style={{ animation: "frenzyBg 0.8s ease-in-out infinite" }} />}

      {/* Comeback background */}
      {game.comebackActive && <div className="absolute inset-0 z-0 pointer-events-none" style={{ animation: "comebackBg 0.6s ease-in-out infinite" }} />}

      {/* Danger overlay at 1 life */}
      {game.gameState === "playing" && game.lives === 1 && (
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ animation: "dangerPulse 0.8s ease-in-out infinite" }} />
      )}

      {/* Game area */}
      <div id="game-area" className="absolute inset-0 z-10" style={shakeStyle}>
        {/* Orbs */}
        {game.gameState === "playing" && game.orbs.map((orb) => {
          const colors = ORB_COLORS[orb.type];
          const age = performance.now() - orb.bornAt;
          const lifePercent = Math.max(0, 1 - age / orb.ttl);
          return (
            <button
              key={orb.id}
              onPointerDown={(e) => handleOrbTap(orb, e)}
              className={`absolute rounded-full bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-2xl ${colors.glow} cursor-pointer transition-transform hover:scale-110 active:scale-90`}
              style={{
                left: `${orb.x}%`,
                top: `${orb.y}%`,
                width: orb.size,
                height: orb.size,
                transform: "translate(-50%, -50%)",
                animation: `orbAppear 200ms ease-out, orbPulse 800ms ease-in-out ${orb.pulse}s infinite`,
                opacity: lifePercent < 0.3 ? lifePercent * 2 : 1,
              }}
            >
              {orb.type === "golden" && <Star className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" fill="white" />}
              {orb.type === "bomb" && <span className="absolute inset-0 flex items-center justify-center text-2xl">💣</span>}
              {orb.type === "bonus" && <Sparkles className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "frenzy" && <Zap className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" fill="white" />}
              {orb.type === "mystery" && (
                <HelpCircle
                  className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg"
                  style={{ animation: "mysterySpin 2s linear infinite" }}
                />
              )}
              {orb.type === "shield" && <Shield className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "comeback" && <TrendingUp className="absolute inset-0 m-auto w-1/2 h-1/2 text-white drop-shadow-lg" />}
              {orb.type === "normal" && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-1/3 h-1/3 rounded-full bg-white/40" />
                </span>
              )}
              {/* TTL ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" strokeDasharray={`${lifePercent * 289} 289`} />
              </svg>
            </button>
          );
        })}

        {/* Idle / Start screen */}
        {game.gameState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-y-auto py-8">
            <div className="text-center px-6 max-w-lg" style={{ animation: "slideUp 600ms ease-out" }}>
              <div className="mb-6 flex justify-center gap-2">
                {[Star, Zap, Flame, Crown, Shield].map((Icon, i) => (
                  <div
                    key={i}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center"
                    style={{ animation: `orbPulse 1.5s ease-in-out ${i * 0.2}s infinite` }}
                  >
                    <Icon className="w-7 h-7 text-cyan-300" />
                  </div>
                ))}
              </div>
              <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
                ORB<span className="text-cyan-400">RUSH</span>
              </h1>
              {game.prestige > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-sm font-bold mb-3">
                  <Crown className="w-4 h-4" /> Prestígio {game.prestige} · +{Math.round(game.prestige * 10)}% pontos
                </div>
              )}
              <p className="text-slate-400 text-lg mb-2 leading-relaxed">
                Toque nos orbes. Faça combos. Desbloqueie conquistas.
              </p>
              <p className="text-slate-500 text-sm mb-6">
                Quantos pontos você consegue antes de perder 3 vidas?
              </p>

              {/* Daily challenge banner */}
              {game.challengeTarget > 0 && !game.challengeDone && (
                <div className="mb-6 flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-400/30">
                  <Target className="w-5 h-5 text-green-400" />
                  <div className="text-left">
                    <div className="text-green-300 font-bold text-sm">Desafio Diário</div>
                    <div className="text-slate-400 text-xs">Alcance {game.challengeTarget.toLocaleString()} pontos hoje</div>
                  </div>
                </div>
              )}
              {game.challengeDone && (
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-400/40 text-green-300 font-bold text-sm">
                  <Award className="w-4 h-4" /> Desafio de hoje completo!
                </div>
              )}

              {loadedStats && (
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5">
                    <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <div className="text-amber-400 font-bold text-lg">{loadedStats.high.toLocaleString()}</div>
                    <div className="text-slate-500 text-[10px]">Recorde</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5">
                    <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                    <div className="text-orange-400 font-bold text-lg">{game.dailyStreak}</div>
                    <div className="text-slate-500 text-[10px]">Dias</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5">
                    <Target className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                    <div className="text-cyan-400 font-bold text-lg">{loadedStats.totalTaps.toLocaleString()}</div>
                    <div className="text-slate-500 text-[10px]">Toques</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-2.5">
                    <Crown className="w-4 h-4 text-amber-300 mx-auto mb-1" />
                    <div className="text-amber-300 font-bold text-lg">{loadedStats.prestige}</div>
                    <div className="text-slate-500 text-[10px]">Prestígio</div>
                  </div>
                </div>
              )}

              <button
                onClick={game.startGame}
                className="group relative px-12 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xl shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-transform"
              >
                <span className="flex items-center gap-3">
                  <Play className="w-6 h-6" fill="white" />
                  JOGAR
                </span>
              </button>

              <div className="mt-6 flex flex-wrap gap-1.5 justify-center text-[11px] text-slate-500 max-w-md mx-auto">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" /> +10
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700">
                  <Star className="w-2.5 h-2.5 text-amber-400" /> +100
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700">
                  <Sparkles className="w-2.5 h-2.5 text-fuchsia-400" /> +50
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700">
                  <Zap className="w-2.5 h-2.5 text-orange-400" /> Frenesi
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700">
                  <HelpCircle className="w-2.5 h-2.5 text-violet-400" /> Mistério
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700">
                  <Shield className="w-2.5 h-2.5 text-blue-400" /> Escudo
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700">
                  <TrendingUp className="w-2.5 h-2.5 text-green-400" /> Comeback
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700">
                  <span>💣</span> Evite!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Game Over screen */}
        {game.gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-950/60 backdrop-blur-sm">
            <div className="text-center px-6 max-w-md" style={{ animation: "slideUp 500ms ease-out" }}>
              {game.newRecord && game.score > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-sm mb-3" style={{ animation: "pulseGlow 1s ease-in-out infinite" }}>
                  <Crown className="w-4 h-4" /> NOVO RECORDE!
                </div>
              )}
              {game.prestige > 0 && (loadedStats?.prestige ?? 0) < game.prestige && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 font-bold text-sm mb-3">
                  <Crown className="w-4 h-4" /> PRESTÍGIO {game.prestige}! +10% permanente
                </div>
              )}
              <h2 className="text-4xl font-black text-white mb-2">Fim de Jogo</h2>
              <div className="text-6xl font-black text-cyan-400 mb-6" style={{ animation: "scoreBump 600ms ease-out" }}>
                {game.score.toLocaleString()}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-8">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                  <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                  <div className="text-orange-400 font-bold text-xl">{game.bestCombo}</div>
                  <div className="text-slate-500 text-[10px]">Combo</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                  <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <div className="text-amber-400 font-bold text-xl">Nv {game.level}</div>
                  <div className="text-slate-500 text-[10px]">Nível</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
                  <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <div className="text-yellow-400 font-bold text-xl">{game.totalGolden}</div>
                  <div className="text-slate-500 text-[10px]">Dourados</div>
                </div>
              </div>
              <button
                onClick={game.startGame}
                className="group px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-transform"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  JOGAR DE NOVO
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* HUD — top bar */}
      {game.gameState === "playing" && (
        <>
          <div className="absolute top-0 left-0 right-0 z-20 p-3 pointer-events-none">
            <div className="flex items-start justify-between gap-3">
              {/* Score + prestige */}
              <div className="flex flex-col gap-0.5">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Pontos</div>
                <div key={game.score} className="text-2xl font-black text-white tabular-nums leading-none" style={{ animation: "scoreBump 200ms ease-out" }}>
                  {game.score.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  Recorde: {Math.max(game.highScore, game.score).toLocaleString()}
                  {game.prestige > 0 && <span className="text-amber-300 ml-1">· P{game.prestige}</span>}
                </div>
              </div>

              {/* Lives + shield */}
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Vidas</div>
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <Heart
                      key={i}
                      className={`w-5 h-5 transition-all ${i < game.lives ? "text-rose-500 fill-rose-500" : "text-slate-700"}`}
                      style={i < game.lives ? { animation: "heartBeat 1s ease-in-out infinite" } : undefined}
                    />
                  ))}
                  {game.hasShield && (
                    <Shield className="w-5 h-5 text-blue-400 ml-1" style={{ animation: "shieldRing 1s ease-in-out infinite" }} />
                  )}
                </div>
              </div>

              {/* Level */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Nível</div>
                <div className="text-2xl font-black text-cyan-400 tabular-nums leading-none">{game.level}</div>
                <div className="w-24 h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300" style={{ width: `${(game.score % 500) / 5}%` }} />
                </div>
              </div>
            </div>

            {/* Progressive jackpot + challenge bars */}
            <div className="mt-2 flex items-center gap-2">
              {game.progressiveJackpot > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30">
                  <span className="text-[10px] text-amber-300 font-bold">JACKPOT PROG.</span>
                  <span className="text-xs text-amber-400 font-black tabular-nums">{game.progressiveJackpot}</span>
                </div>
              )}
              {game.challengeTarget > 0 && !game.challengeDone && (
                <div className="flex-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (game.score / game.challengeTarget) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-green-400 font-bold tabular-nums">
                    {Math.min(100, Math.round((game.score / game.challengeTarget) * 100))}%
                  </span>
                </div>
              )}
              {game.challengeDone && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-400/30">
                  <Award className="w-3 h-3 text-green-400" />
                  <span className="text-[10px] text-green-300 font-bold">Desafio completo!</span>
                </div>
              )}
            </div>
          </div>

          {/* Combo meter — bottom */}
          {game.combo > 0 && (
            <div className="absolute bottom-0 left-0 right-0 z-20 p-3 pointer-events-none flex flex-col items-center">
              <div
                key={game.combo}
                className="flex items-center gap-2 px-5 py-1.5 rounded-full border-2"
                style={{
                  background: game.combo >= 25 ? "linear-gradient(90deg, rgba(251,191,36,0.2), rgba(249,115,22,0.2))" : "rgba(15,23,42,0.7)",
                  borderColor: game.combo >= 25 ? "rgba(251,191,36,0.5)" : game.combo >= 10 ? "rgba(168,85,247,0.5)" : "rgba(34,211,238,0.4)",
                  animation: "scoreBump 200ms ease-out",
                }}
              >
                <Flame
                  className={`w-4 h-4 ${game.combo >= 25 ? "text-amber-400" : game.combo >= 10 ? "text-fuchsia-400" : "text-cyan-400"}`}
                  fill="currentColor"
                />
                <span className={`font-black text-lg tabular-nums ${game.combo >= 25 ? "text-amber-300" : game.combo >= 10 ? "text-fuchsia-300" : "text-cyan-300"}`}>
                  COMBO x{game.combo}
                </span>
                {game.combo >= 5 && (
                  <span className="text-[10px] text-slate-400 font-bold">
                    {game.combo >= 25 ? "3x" : game.combo >= 15 ? "2.5x" : game.combo >= 10 ? "2x" : "1.5x"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Frenzy indicator */}
          {game.frenzy && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-orange-500/20 border-2 border-orange-400/50 backdrop-blur-sm" style={{ animation: "pulseGlow 0.8s ease-in-out infinite" }}>
                <Zap className="w-6 h-6 text-orange-300" fill="currentColor" />
                <div className="text-center">
                  <div className="text-xl font-black text-orange-300">FRENESI</div>
                  <div className="text-xs text-orange-200">2x pontos · {game.frenzyTime}s</div>
                </div>
              </div>
            </div>
          )}

          {/* Comeback indicator */}
          {game.comebackActive && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style={{ marginTop: "60px" }}>
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-green-500/20 border-2 border-green-400/50 backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <div className="text-center">
                  <div className="text-lg font-black text-green-300">COMEBACK 3x</div>
                  <div className="text-xs text-green-200">{game.comebackTime}s</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Achievement popups */}
      <div className="absolute top-16 right-3 z-50 flex flex-col gap-2 pointer-events-none">
        {achievements.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/90 border border-amber-400/40 shadow-xl backdrop-blur-sm"
            style={{ animation: "slideDownFade 3.5s ease-in-out forwards" }}
          >
            <span className="text-xl">{a.icon}</span>
            <div>
              <div className="text-amber-300 font-bold text-xs">{a.title}</div>
              <div className="text-slate-400 text-[10px]">{a.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily streak popup */}
      {showStreakPopup && streakInfo && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-orange-500/20 border-2 border-orange-400/50 backdrop-blur-md" style={{ animation: "slideDownFade 4s ease-in-out forwards" }}>
            <Flame className="w-10 h-10 text-orange-400" fill="currentColor" />
            <div className="text-2xl font-black text-orange-300">{streakInfo.streak} dias seguidos!</div>
            <div className="text-sm text-orange-200">Volte amanhã para manter o fogo aceso</div>
          </div>
        </div>
      )}

      {/* Daily challenge popup */}
      {showChallengePopup && challengeInfo && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex flex-col items-center gap-2 px-8 py-6 rounded-2xl bg-green-500/20 border-2 border-green-400/50 backdrop-blur-md" style={{ animation: "slideDownFade 4.5s ease-in-out forwards" }}>
            <Target className="w-10 h-10 text-green-400" />
            <div className="text-xl font-black text-green-300">Desafio de hoje!</div>
            <div className="text-sm text-green-200">Alcance {challengeInfo.target.toLocaleString()} pontos</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
