import { useState, useEffect } from "react";
import { Gem, Shield, X, ShoppingBag, Crown, Gift, CheckCircle2 } from "lucide-react";
import { STRIPE_LINKS, getPendingChests, consumePendingChest } from "@/lib/monetization";
import { rollChestWithTease, type ChestReward, type ChestRarity, RARITY_ORDER } from "@/lib/chest";
import { playChestTease, playChestReveal, playChestNearMiss } from "@/lib/sound";

interface Props {
  open: boolean;
  onClose: () => void;
  onGemsChange: (delta: number) => void;
}

export function ShopModal({ open, onClose, onGemsChange }: Props) {
  const [pendingChests, setPendingChests] = useState(getPendingChests());
  const [chestReward, setChestReward] = useState<ChestReward | null>(null);
  const [opening, setOpening] = useState(false);
  const [teaseRarities, setTeaseRarities] = useState<ChestRarity[]>([]);
  const [teaseIndex, setTeaseIndex] = useState(-1);

  useEffect(() => {
    if (open) {
      setPendingChests(getPendingChests());
      setChestReward(null);
      setTeaseIndex(-1);
      setTeaseRarities([]);
    }
  }, [open]);

  if (!open) return null;

  const handleClaimChest = (rarity: "legendary" | "mythic") => {
    if (pendingChests[rarity] <= 0 || opening) return;
    setOpening(true);
    setChestReward(null);
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
        consumePendingChest(rarity);
        onGemsChange(reward.gems);
        setChestReward(reward);
        setOpening(false);
        setPendingChests(getPendingChests());
        if (reward.rarity === "legendary" || reward.rarity === "mythic") playChestReveal();
        else playChestNearMiss();
      }
    }, 150);
  };

  const teaseColors: Record<ChestRarity, string> = {
    common: "bg-slate-500", rare: "bg-blue-500", epic: "bg-fuchsia-500",
    legendary: "bg-amber-500", mythic: "bg-rose-500",
  };
  const teaseTextColors = ["#94a3b8", "#3b82f6", "#d946ef", "#f59e0b", "#f43f5e"];
  const teaseLabels = ["Common", "Rare", "Epic", "Legendary", "MYTHIC"];

  const hasPending = pendingChests.legendary > 0 || pendingChests.mythic > 0;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-sm w-full my-auto bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"><X className="w-6 h-6"/></button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
            <ShoppingBag className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white">Orb Shop</h2>
          <p className="text-slate-500 text-xs">Get gems and permanent power-ups</p>
        </div>

        {/* Pending chests — shows even when 0 remaining if there's a reward to display */}
        {(hasPending || chestReward) && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-amber-400" />
              <span className="text-amber-300 font-black text-sm">PENDING CHESTS</span>
            </div>

            {/* Tease display during opening */}
            {opening && teaseRarities.length > 0 && (
              <div className="mb-3">
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

            {chestReward ? (
              <div className="text-center" style={{ animation: "modalIn 0.3s ease-out" }}>
                <div className="text-4xl mb-2" style={{ animation: "chestBurst 0.5s ease-out" }}>{chestReward.rarity === "mythic" ? "🏆" : "💎"}</div>
                <div className="mt-2 text-lg font-black text-white">{chestReward.label}!</div>
                <div className="text-2xl font-black text-amber-400">+{chestReward.gems} gems</div>
                <button onClick={() => { setChestReward(null); setTeaseRarities([]); }} className="mt-3 px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm">Continue</button>
              </div>
            ) : !opening && (
              <div className="space-y-2">
                {pendingChests.legendary > 0 && (
                  <button onClick={() => handleClaimChest("legendary")} disabled={opening} className="w-full py-2.5 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300 font-bold text-sm hover:bg-amber-500/30 transition-colors disabled:opacity-50">
                    {opening ? "Opening..." : `Open Legendary Chest (${pendingChests.legendary} left)`}
                  </button>
                )}
                {pendingChests.mythic > 0 && (
                  <button onClick={() => handleClaimChest("mythic")} disabled={opening} className="w-full py-2.5 bg-rose-500/20 border border-rose-400/40 rounded-xl text-rose-300 font-bold text-sm hover:bg-rose-500/30 transition-colors disabled:opacity-50">
                    {opening ? "Opening..." : `Open Mythic Chest (${pendingChests.mythic} left)`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] pt-2 px-1">Gem Packs</div>

          <button onClick={() => window.open(STRIPE_LINKS.GEMS_100, "_blank")} className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between hover:border-emerald-500/50 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Gem className="text-emerald-400 w-5 h-5"/></div>
              <div className="text-left"><div className="text-white font-bold text-sm">100 Gems</div><div className="text-[9px] text-slate-500 uppercase font-black">Starter Pack</div></div>
            </div>
            <div className="text-white font-black text-sm">$0.99</div>
          </button>

          <button onClick={() => window.open(STRIPE_LINKS.GEMS_600, "_blank")} className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between hover:border-emerald-500/50 transition-all group relative">
            <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-full">BEST VALUE</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Gem className="text-emerald-400 w-5 h-5"/></div>
              <div className="text-left"><div className="text-white font-bold text-sm">600 Gems + 1 Legendary Chest</div><div className="text-[9px] text-amber-400 uppercase font-black">Save 15%</div></div>
            </div>
            <div className="text-white font-black text-sm">$4.99</div>
          </button>

          <button onClick={() => window.open(STRIPE_LINKS.GEMS_1500, "_blank")} className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between hover:border-emerald-500/50 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Gem className="text-emerald-400 w-5 h-5"/></div>
              <div className="text-left"><div className="text-white font-bold text-sm">1500 Gems + 3 Leg. Chests</div><div className="text-[9px] text-blue-400 uppercase font-black">+ Permanent Shield</div></div>
            </div>
            <div className="text-white font-black text-sm">$9.99</div>
          </button>

          <button onClick={() => window.open(STRIPE_LINKS.GEMS_5000, "_blank")} className="w-full p-4 bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-2 border-amber-500/40 rounded-2xl flex items-center justify-between hover:border-amber-400/60 transition-all group relative">
            <div className="absolute top-2 right-2 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">MEGA</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Crown className="text-amber-400 w-5 h-5"/></div>
              <div className="text-left"><div className="text-white font-bold text-sm">5000 Gems + Mythic Chest</div><div className="text-[9px] text-amber-400 uppercase font-black">Best Deal — Save 20%</div></div>
            </div>
            <div className="text-amber-300 font-black text-sm">$19.99</div>
          </button>

          <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] pt-2 px-1">Power-ups</div>
          <button onClick={() => window.open(STRIPE_LINKS.SHIELD_PERM, "_blank")} className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between hover:border-blue-500/50 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Shield className="text-blue-400 w-5 h-5"/></div>
              <div className="text-left"><div className="text-white font-bold text-sm">Permanent Shield</div><div className="text-[9px] text-slate-500 uppercase font-black">Never die to 1st bomb</div></div>
            </div>
            <div className="text-white font-black text-sm">$2.99</div>
          </button>
        </div>
      </div>
    </div>
  );
}
