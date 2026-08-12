import { useState, useEffect } from "react";
import { Timer, Gem, X, Sparkles, Package, CheckCircle2, Loader2 } from "lucide-react";
import { MYSTERY_BOX_COST, MYSTERY_BOX_DURATION, getRemainingTime, canOpen } from "@/lib/mysteryBox";
import { STRIPE_LINKS, consumeSkipTimer } from "@/lib/monetization";
import { playChestTease, playChestReveal, playChestNearMiss } from "@/lib/sound";
import { rollChestWithTease, rarityIndex } from "@/lib/chest";
import { saveStats, addGems } from "@/lib/supabase";

interface Props { open: boolean; onClose: () => void; }

export function MysteryBoxModal({ open, onClose }: Props) {
  const [boxState, setBoxState] = useState({ isUnlocking: false, unlockStartTime: null as number | null, duration: MYSTERY_BOX_DURATION });
  const [timeLeft, setTimeLeft] = useState(0);
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [skipLoading, setSkipLoading] = useState(false);
  const [skipSuccess, setSkipSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("orbrush_mystery_box");
    if (saved) setBoxState(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!boxState.isUnlocking) return;
    const timer = setInterval(() => {
      const remaining = getRemainingTime(boxState);
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [boxState]);

  // Poll for skip timer activation when loading
  useEffect(() => {
    if (!open || !skipLoading) return;
    const checkInterval = setInterval(() => {
      if (consumeSkipTimer()) {
        clearInterval(checkInterval);
        setSkipLoading(false);
        setSkipSuccess(true);
        // Skip the timer — mark box as ready to open
        const newState = { isUnlocking: true, unlockStartTime: Date.now() - MYSTERY_BOX_DURATION, duration: MYSTERY_BOX_DURATION };
        setBoxState(newState);
        localStorage.setItem("orbrush_mystery_box", JSON.stringify(newState));
        setTimeLeft(0);
        setTimeout(() => setSkipSuccess(false), 2000);
      }
    }, 500);
    const timeout = setTimeout(() => clearInterval(checkInterval), 300000);
    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [open, skipLoading]);

  const handleBuy = () => {
    const newState = { isUnlocking: true, unlockStartTime: Date.now(), duration: MYSTERY_BOX_DURATION };
    setBoxState(newState);
    localStorage.setItem("orbrush_mystery_box", JSON.stringify(newState));
  };

  const handleOpen = () => {
    setOpening(true);
    const { reward: chestReward, teaseSequence } = rollChestWithTease();
    let idx = 0;
    const interval = setInterval(() => {
      playChestTease();
      idx++;
      if (idx >= teaseSequence.length) {
        clearInterval(interval);
        setOpening(false);
        setReward(chestReward);
        addGems(chestReward.gems);
        if (chestReward.rarity === "legendary" || chestReward.rarity === "mythic") playChestReveal();
        else playChestNearMiss();
        setBoxState({ isUnlocking: false, unlockStartTime: null, duration: MYSTERY_BOX_DURATION });
        localStorage.removeItem("orbrush_mystery_box");
      }
    }, 150);
  };

  const handleSkipTimer = () => {
    setSkipLoading(true);
    window.open(STRIPE_LINKS.MYSTERY_BOX_UNLOCK, "_blank");
  };

  if (!open) return null;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const mins = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-sm w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-8 text-center shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-black text-white mb-2">Mystery Box</h2>
        <p className="text-slate-400 text-sm mb-6">Unlock powerful rewards! Needs 2h to open.</p>

        <div className="w-32 h-32 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 relative overflow-hidden">
          {opening ? <div className="text-6xl animate-bounce">📦</div> : <Package className={`w-16 h-16 ${boxState.isUnlocking ? 'text-amber-400' : 'text-slate-600'}`} />}
          {boxState.isUnlocking && timeLeft > 0 && (
            <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center backdrop-blur-sm">
              <Timer className="w-6 h-6 text-amber-400 mb-1" />
              <span className="text-white font-black tabular-nums">{hours}h {mins}m {secs}s</span>
            </div>
          )}
        </div>

        {skipSuccess ? (
          <div className="mb-6" style={{ animation: "modalIn 0.4s ease-out" }}>
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-green-400 font-black text-lg">TIMER SKIPPED!</div>
            <div className="text-slate-400 text-xs mt-1">Open your box now!</div>
          </div>
        ) : reward ? (
          <div className="mb-6" style={{ animation: "modalIn 0.3s ease-out" }}>
            <div className="text-amber-400 text-2xl font-black">+{reward.gems} GEMS!</div>
            <div className="text-slate-400 text-xs">{reward.rarity.toUpperCase()} REWARD</div>
          </div>
        ) : !boxState.isUnlocking ? (
          <button onClick={handleBuy} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2">
            <Gem className="w-5 h-5" /> BUY FOR 50 GEMS
          </button>
        ) : timeLeft === 0 ? (
          <button onClick={handleOpen} className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-black rounded-2xl animate-pulse">
            OPEN NOW!
          </button>
        ) : (
          <button
            onClick={handleSkipTimer}
            disabled={skipLoading}
            className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl border border-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {skipLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Waiting for payment...</>
            ) : (
              <>SKIP TIMER ($0.99)</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
