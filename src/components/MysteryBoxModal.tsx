import { useState, useEffect } from "react";
import { Timer, Gem, X, Package, CheckCircle2, Loader2 } from "lucide-react";
import { MYSTERY_BOX_COST, MYSTERY_BOX_DURATION, getRemainingTime } from "@/lib/mysteryBox";
import { STRIPE_LINKS, consumeSkipTimer } from "@/lib/monetization";
import { playChestTease, playChestReveal, playChestNearMiss } from "@/lib/sound";
import { rollChestWithTease, type ChestRarity, RARITY_ORDER } from "@/lib/chest";

interface Props {
  open: boolean;
  onClose: () => void;
  gems: number;
  onGemsChange: (delta: number) => void;
}

export function MysteryBoxModal({ open, onClose, gems, onGemsChange }: Props) {
  const [boxState, setBoxState] = useState({ isUnlocking: false, unlockStartTime: null as number | null, duration: MYSTERY_BOX_DURATION });
  const [timeLeft, setTimeLeft] = useState(0);
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [skipLoading, setSkipLoading] = useState(false);
  const [skipSuccess, setSkipSuccess] = useState(false);
  const [teaseRarities, setTeaseRarities] = useState<ChestRarity[]>([]);
  const [teaseIndex, setTeaseIndex] = useState(-1);

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

  useEffect(() => {
    if (!open || !skipLoading) return;
    const checkInterval = setInterval(() => {
      if (consumeSkipTimer()) {
        clearInterval(checkInterval);
        setSkipLoading(false);
        setSkipSuccess(true);
        const newState = { isUnlocking: true, unlockStartTime: Date.now() - MYSTERY_BOX_DURATION, duration: MYSTERY_BOX_DURATION };
        setBoxState(newState);
        localStorage.setItem("orbrush_mystery_box", JSON.stringify(newState));
        setTimeLeft(0);
        setTimeout(() => setSkipSuccess(false), 2000);
      }
    }, 500);
    const timeout = setTimeout(() => clearInterval(checkInterval), 300000);
    return () => { clearInterval(checkInterval); clearTimeout(timeout); };
  }, [open, skipLoading]);

  const handleBuy = () => {
    if (gems < MYSTERY_BOX_COST) return;
    onGemsChange(-MYSTERY_BOX_COST);
    const newState = { isUnlocking: true, unlockStartTime: Date.now(), duration: MYSTERY_BOX_DURATION };
    setBoxState(newState);
    localStorage.setItem("orbrush_mystery_box", JSON.stringify(newState));
  };

  const handleOpen = () => {
    setOpening(true);
    setReward(null);
    setTeaseIndex(-1);
    const { reward: chestReward, teaseSequence } = rollChestWithTease();
    setTeaseRarities(teaseSequence);
    let idx = 0;
    const interval = setInterval(() => {
      playChestTease();
      setTeaseIndex(idx);
      idx++;
      if (idx >= teaseSequence.length) {
        clearInterval(interval);
        setOpening(false);
        setReward(chestReward);
        onGemsChange(chestReward.gems);
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

  const teaseColors: Record<ChestRarity, string> = {
    common: "bg-slate-500", rare: "bg-blue-500", epic: "bg-fuchsia-500",
    legendary: "bg-amber-500", mythic: "bg-rose-500",
  };
  const teaseTextColors = ["#94a3b8", "#3b82f6", "#d946ef", "#f59e0b", "#f43f5e"];
  const teaseLabels = ["Common", "Rare", "Epic", "Legendary", "MYTHIC"];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-sm w-full my-auto bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-8 text-center shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"><X className="w-6 h-6"/></button>

        <div className="flex items-center justify-center gap-2 mb-1">
          <Package className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-black text-white">Mystery Box</h2>
        </div>
        <p className="text-slate-400 text-sm mb-6">Unlock powerful rewards! Needs 2h to open.</p>

        <div className="w-32 h-32 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-700 relative overflow-hidden">
          {opening ? (
            <div className="text-6xl" style={{ animation: "chestShake 300ms ease-in-out infinite" }}>📦</div>
          ) : (
            <Package className={`w-16 h-16 ${boxState.isUnlocking ? 'text-amber-400' : 'text-slate-600'}`} />
          )}
          {boxState.isUnlocking && timeLeft > 0 && (
            <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center backdrop-blur-sm">
              <Timer className="w-6 h-6 text-amber-400 mb-1" />
              <span className="text-white font-black tabular-nums">{hours}h {mins}m {secs}s</span>
            </div>
          )}
        </div>

        {/* Near-miss tease display */}
        {opening && teaseRarities.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {teaseRarities.map((r, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i === teaseIndex ? `${teaseColors[r]} scale-150 shadow-lg` : "bg-slate-700"
                  }`}
                  style={i === teaseIndex ? { animation: "scoreBump 150ms ease-out" } : undefined}
                />
              ))}
            </div>
            {teaseIndex >= 0 && teaseIndex < teaseRarities.length && (
              <div className="mt-2 text-sm font-bold" style={{ color: teaseTextColors[RARITY_ORDER.indexOf(teaseRarities[teaseIndex])] }}>
                {teaseLabels[RARITY_ORDER.indexOf(teaseRarities[teaseIndex])]}
              </div>
            )}
          </div>
        )}

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
            <div className="text-4xl mb-2" style={{ animation: "chestBurst 0.5s ease-out" }}>{reward.rarity === "mythic" ? "🏆" : "💎"}</div>
            <div className="text-amber-400 text-2xl font-black">+{reward.gems} GEMS!</div>
            <div className="text-slate-400 text-xs">{reward.rarity.toUpperCase()} REWARD</div>
          </div>
        ) : !boxState.isUnlocking ? (
          <>
            <button onClick={handleBuy} disabled={gems < MYSTERY_BOX_COST} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
              <Gem className="w-5 h-5" /> BUY FOR {MYSTERY_BOX_COST} GEMS
            </button>
            {gems < MYSTERY_BOX_COST && (
              <div className="mt-2 text-amber-400 text-xs font-bold">Not enough gems!</div>
            )}
          </>
        ) : timeLeft === 0 ? (
          <button onClick={handleOpen} className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-black rounded-2xl animate-pulse transition-transform active:scale-95">
            OPEN NOW!
          </button>
        ) : (
          <button onClick={handleSkipTimer} disabled={skipLoading} className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl border border-slate-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-transform active:scale-95">
            {skipLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Waiting...</> : <>SKIP TIMER ($0.99)</>}
          </button>
        )}
      </div>
    </div>
  );
}
