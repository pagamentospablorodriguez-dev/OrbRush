import { useState, useEffect } from "react";
import { Gem, Flame, Crown, Gift, X, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { getLoginReward, getNextReward, getAccumulatedGems, getLossIfBreak } from "@/lib/loginRewards";

interface LoginRewardModalProps {
  open: boolean;
  onClose: () => void;
  onClaim: () => void;
  currentDay: number;
  streakBroken: boolean;
}

export function LoginRewardModal({ open, onClose, onClaim, currentDay, streakBroken }: LoginRewardModalProps) {
  const [claimed, setClaimed] = useState(false);
  const [showStreakWarning, setShowStreakWarning] = useState(false);

  useEffect(() => {
    if (open) {
      setClaimed(false);
      setShowStreakWarning(streakBroken && currentDay > 1);
    }
  }, [open, streakBroken, currentDay]);

  if (!open) return null;

  const reward = getLoginReward(currentDay);
  const nextReward = getNextReward(currentDay);
  const accumulated = getAccumulatedGems(currentDay);
  const lossIfBreak = getLossIfBreak(currentDay + 1);

  const days = Array.from({ length: 7 }, (_, i) => i + 1);
  const dayLabels: Record<number, string> = {
    7: "LEGENDARY",
    14: "BIG",
    30: "MEGA",
  };

  const handleClaim = () => {
    setClaimed(true);
    onClaim();
  };

  return (
    <div className="fixed inset-0 z-[105] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative max-w-md w-full my-auto bg-slate-900 border-2 border-amber-400/40 rounded-3xl p-6 sm:p-8 text-center" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn 400ms ease-out" }}>
        <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        {claimed ? (
          <div style={{ animation: "modalIn 500ms ease-out" }}>
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border-2 border-green-400/50 flex items-center justify-center mb-4" style={{ animation: "pulseGlow 1s ease-in-out infinite" }}>
              <Gem className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Reward Claimed!</h2>
            <p className="text-amber-400 text-2xl font-black mb-2">+{reward.gems} gems</p>
            {reward.bonus && <p className="text-fuchsia-300 font-bold text-sm mb-4">{reward.bonus}</p>}
            <p className="text-slate-400 text-sm mb-6">Come back tomorrow for Day {currentDay + 1}!</p>
            <button onClick={onClose} className="w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:scale-105 active:scale-95 transition-transform">
              Continue
            </button>
          </div>
        ) : (
          <>
            {/* Streak broken warning */}
            {showStreakWarning && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-400/40 flex items-center gap-2" style={{ animation: "nudgeShake 0.5s ease-in-out 3" }}>
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-xs font-bold text-left">You broke your streak! Starting over from Day 1. Don't lose it again!</span>
              </div>
            )}

            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center mb-3" style={{ animation: "orbPulse 2s ease-in-out infinite" }}>
              <Calendar className="w-8 h-8 text-amber-400" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">Daily Login Reward</h2>
            <p className="text-slate-400 text-sm mb-1">Day {currentDay} of your streak</p>
            <p className="text-amber-300 text-xs font-bold mb-4">Total accumulated: {accumulated.toLocaleString()} gems</p>

            {/* 7-day preview */}
            <div className="mb-5 grid grid-cols-7 gap-1.5">
              {days.map((d) => {
                const r = getLoginReward(d);
                const isToday = d === currentDay;
                const isPast = d < currentDay;
                const isSpecial = d === 7;
                return (
                  <div key={d} className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl border ${
                    isToday ? "bg-amber-500/20 border-amber-400/60 ring-2 ring-amber-400/30" :
                    isSpecial ? "bg-fuchsia-500/15 border-fuchsia-400/40" :
                    isPast ? "bg-slate-800/40 border-slate-700" :
                    "bg-slate-800/60 border-slate-700"
                  }`}>
                    <span className={`text-[10px] font-bold ${isToday ? "text-amber-300" : "text-slate-500"}`}>D{d}</span>
                    {isSpecial ? <Crown className="w-4 h-4 text-fuchsia-400" /> : <Gem className={`w-4 h-4 ${isToday ? "text-amber-400" : isPast ? "text-slate-600" : "text-slate-400"}`} />}
                    <span className={`text-[9px] font-bold ${isToday ? "text-amber-300" : isPast ? "text-slate-600" : "text-slate-400"}`}>{r.gems}</span>
                  </div>
                );
              })}
            </div>

            {/* Current reward */}
            <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-2 border-amber-400/40">
              <div className="flex items-center justify-center gap-2 mb-2">
                {reward.isLegendary ? <Crown className="w-6 h-6 text-fuchsia-400" /> : <Gem className="w-6 h-6 text-amber-400" />}
                <span className="text-3xl font-black text-amber-400">+{reward.gems}</span>
                <span className="text-amber-400/60 text-sm font-bold">gems</span>
              </div>
              {reward.bonus && (
                <div className="text-fuchsia-300 font-bold text-sm" style={{ animation: "pulseGlow 1.5s ease-in-out infinite" }}>
                  {reward.bonus}
                </div>
              )}
            </div>

            {/* Next reward preview */}
            <div className="mb-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tomorrow: Day {nextReward.day} → +{nextReward.gems} gems{nextReward.bonus ? ` + ${nextReward.bonus}` : ""}</span>
            </div>

            {/* Loss aversion */}
            {currentDay >= 3 && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-400/30 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-[11px] font-bold text-left">Miss tomorrow and lose {lossIfBreak} gems of bonus!</span>
              </div>
            )}

            <button
              onClick={handleClaim}
              className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-transform"
            >
              <span className="flex items-center justify-center gap-2">
                <Gift className="w-5 h-5" />
                CLAIM {reward.gems} GEMS
              </span>
            </button>

            <p className="mt-3 text-slate-600 text-[11px]">Keep playing daily to grow your reward!</p>
          </>
        )}
      </div>
    </div>
  );
}
