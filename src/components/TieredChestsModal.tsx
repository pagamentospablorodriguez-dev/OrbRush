import { Gem, X, Crown, Sparkles, Package } from "lucide-react";
import { TIERED_CHESTS } from "@/lib/tieredChests";
import { rollChest, rarityIndex } from "@/lib/chest";
import { saveStats, addGems } from "@/lib/supabase";
import { useState } from "react";
import { playChestReveal, playChestNearMiss } from "@/lib/sound";

interface Props { open: boolean; onClose: () => void; gems: number; }

export function TieredChestsModal({ open, onClose, gems }: Props) {
  const [result, setResult] = useState<any>(null);

  const handleBuy = (chest: any) => {
    if (gems < chest.cost) return;
    // Lógica simplificada: baús melhores têm probabilidade melhor (implementada no lib/chest se quiser)
    const reward = rollChest(); 
    setResult(reward);
    addGems(-chest.cost + reward.gems);
    if (reward.rarity === "legendary" || reward.rarity === "mythic") playChestReveal();
    else playChestNearMiss();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-md w-full bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-black text-white mb-6 text-center">Premium Chests</h2>

        <div className="grid gap-3">
          {TIERED_CHESTS.map((chest) => (
            <button 
              key={chest.id}
              onClick={() => handleBuy(chest)}
              disabled={gems < chest.cost}
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{chest.icon}</span>
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
          ))}
        </div>

        {result && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-center animate-in zoom-in">
            <div className="text-emerald-400 font-black text-xl">+{result.gems} GEMS!</div>
            <div className="text-slate-500 text-[10px] font-bold">FROM {result.rarity.toUpperCase()} CHEST</div>
          </div>
        )}
      </div>
    </div>
  );
}
