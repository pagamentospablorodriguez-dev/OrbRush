import { useState } from "react";
import { Gem, X, Crown, Sparkles, Gift } from "lucide-react";
import { TIERED_CHESTS } from "@/lib/tieredChests";
import { rollChestWithTease, type ChestReward, type ChestRarity, RARITY_ORDER } from "@/lib/chest";
import { playChestTease, playChestReveal, playChestNearMiss } from "@/lib/sound";

interface Props { open: boolean; onClose: () => void; gems: number; onGemsChange: (delta: number) => void; }

export function TieredChestsModal({ open, onClose, gems, onGemsChange }: Props) {
  const [result, setResult] = useState<ChestReward | null>(null);
  const [opening, setOpening] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [teaseRarities, setTeaseRarities] = useState<ChestRarity[]>([]);
  const [teaseIndex, setTeaseIndex] = useState(-1);

  const handleBuy = (chest: any) => {
    if (gems < chest.cost || opening) return;
    onGemsChange(-chest.cost);
    setOpening(true);
    setOpeningId(chest.id);
    setResult(null);
    setTeaseIndex(-1);

    const { reward, teaseSequence } = rollChestWithTease();
    setTeaseRarities(teaseSequence);

    let idx = 0;
    const interval = setInterval(() => {
      playChestTease();
      setTeaseIndex(idx);
      idx++;
      if (idx >= teaseSequence.length) {
        clearInterval(interval);
        onGemsChange(reward.gems);
        setResult(reward);
        setOpening(false);
        setOpeningId(null);
        if (reward.rarity === "legendary" || reward.rarity === "mythic") playChestReveal();
        else playChestNearMiss();
      }
    }, 150);
  };

  if (!open) return null;

  const teaseColors: Record<ChestRarity, string> = {
    common: "bg-slate-500", rare: "bg-blue-500", epic: "bg-fuchsia-500",
    legendary: "bg-amber-500", mythic: "bg-rose-500",
  };
  const teaseTextColors = ["#94a3b8", "#3b82f6", "#d946ef", "#f59e0b", "#f43f5e"];
  const teaseLabels = ["Common", "Rare", "Epic", "Legendary", "MYTHIC"];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-md w-full my-auto bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"><X className="w-6 h-6"/></button>

        <div className="flex items-center justify-center gap-2 mb-1">
          <Gift className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-black text-white">Premium Chests</h2>
        </div>
        <p className="text-slate-400 text-xs mb-6 text-center">Better odds at rare rewards!</p>

        <div className="grid gap-3">
          {TIERED_CHESTS.map((chest) => {
            const isOpeningThis = opening && openingId === chest.id;
            return (
              <button
                key={chest.id}
                onClick={() => handleBuy(chest)}
                disabled={gems < chest.cost || opening}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all disabled:opacity-50 relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="text-3xl"
                    style={isOpeningThis ? { animation: "chestShake 300ms ease-in-out infinite" } : undefined}
                  >
                    {chest.icon}
                  </div>
                  <div className="text-left">
                    <div className={`font-black ${chest.color}`}>{chest.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Better Odds</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-700">
                  <Gem className="w-3 h-3 text-fuchsia-400" />
                  <span className="text-sm font-black text-white">{chest.cost}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Near-miss tease display */}
        {opening && teaseRarities.length > 0 && (
          <div className="mt-4">
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
              <div className="mt-2 text-sm font-bold text-center" style={{ color: teaseTextColors[RARITY_ORDER.indexOf(teaseRarities[teaseIndex])] }}>
                {teaseLabels[RARITY_ORDER.indexOf(teaseRarities[teaseIndex])]}
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-center" style={{ animation: "modalIn 0.3s ease-out" }}>
            <div className="text-4xl mb-2" style={{ animation: "chestBurst 0.5s ease-out" }}>
              {result.rarity === "mythic" ? "🏆" : result.rarity === "legendary" ? "👑" : "💎"}
            </div>
            <div className="text-emerald-400 font-black text-xl">+{result.gems} GEMS!</div>
            <div className="text-slate-500 text-[10px] font-bold">{result.rarity.toUpperCase()} REWARD</div>
            <button onClick={() => setResult(null)} className="mt-3 px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:scale-105 active:scale-95 transition-transform">
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
