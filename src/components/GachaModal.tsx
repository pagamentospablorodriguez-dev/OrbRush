import { useState } from "react";
import { Gem, Swords, X } from "lucide-react";
import { rollGacha, type GachaOrb } from "@/lib/gacha";
import { playChestTease, playChestReveal } from "@/lib/sound";

interface Props {
  open: boolean;
  onClose: () => void;
  gems: number;
  pity: number;
  onPull: (orb: GachaOrb, newPity: number) => void;
}

export function GachaModal({ open, onClose, gems, pity, onPull }: Props) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<GachaOrb | null>(null);

  const handlePull = () => {
    if (gems < 100 || rolling) return;
    setRolling(true);
    setResult(null);

    let count = 0;
    const interval = setInterval(() => {
      playChestTease();
      count++;
      if (count > 10) {
        clearInterval(interval);
        const { orb, newPity } = rollGacha(pity);
        setResult(orb);
        setRolling(false);
        playChestReveal();
        onPull(orb, newPity);
      }
    }, 150);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-md w-full bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-6 text-center overflow-hidden shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500"><X className="w-6 h-6"/></button>
        <h2 className="text-2xl font-black text-white mb-1">Orb Summon</h2>
        <p className="text-slate-400 text-xs mb-6 italic">Summon permanent orbs for passive bonuses!</p>

        <div className="relative h-48 flex items-center justify-center mb-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          {rolling ? <div className="text-7xl animate-bounce">✨</div> : result ? (
            <div style={{ animation: "modalIn 0.3s ease-out" }}>
              <div className="text-7xl mb-2">{result.icon}</div>
              <div className={`font-black text-lg ${result.rarity === 'legendary' ? 'text-amber-400' : 'text-white'}`}>{result.name}</div>
              <div className="text-emerald-400 font-bold">+{result.bonus}% Points</div>
            </div>
          ) : <Swords className="w-20 h-20 text-slate-700" />}
        </div>

        <button onClick={handlePull} disabled={gems < 100 || rolling} className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-transform active:scale-95">
          <Gem className="w-5 h-5" /> PULL (100 GEMS)
        </button>
        <div className="text-slate-500 text-[10px] font-bold mt-3 uppercase tracking-widest">Pity: {50 - pity} pulls until Legendary</div>
      </div>
    </div>
  );
}
