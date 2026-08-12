import { useState } from "react";
import { Gem, Swords, X } from "lucide-react";
import { rollGacha, GACHA_ORBS, type GachaOrb, type OrbRarity } from "@/lib/gacha";
import { playChestTease, playChestReveal } from "@/lib/sound";

interface Props {
  open: boolean;
  onClose: () => void;
  gems: number;
  pity: number;
  onGemsChange: (delta: number) => void;
  onPull: (orb: GachaOrb, newPity: number) => void;
}

const RARITY_COLORS: Record<OrbRarity, string> = {
  common: "text-slate-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

const RARITY_LABELS: Record<OrbRarity, string> = {
  common: "COMMON",
  rare: "RARE",
  epic: "EPIC",
  legendary: "LEGENDARY!",
};

const RARITY_BG: Record<OrbRarity, string> = {
  common: "from-slate-700 to-slate-800 border-slate-600",
  rare: "from-blue-900 to-blue-950 border-blue-500/50",
  epic: "from-purple-900 to-purple-950 border-purple-500/50",
  legendary: "from-amber-900 to-orange-950 border-amber-500/50",
};

export function GachaModal({ open, onClose, gems, pity, onGemsChange, onPull }: Props) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<GachaOrb | null>(null);
  const [teaseIndex, setTeaseIndex] = useState(-1);
  const [teaseOrbs, setTeaseOrbs] = useState<GachaOrb[]>([]);

  const handlePull = () => {
    if (gems < 100 || rolling) return;
    onGemsChange(-100);
    setRolling(true);
    setResult(null);
    setTeaseIndex(-1);

    const { orb, newPity } = rollGacha(pity);

    const tease: GachaOrb[] = [];
    const teaseCount = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < teaseCount; i++) {
      tease.push(GACHA_ORBS[Math.floor(Math.random() * GACHA_ORBS.length)]);
    }
    tease.push(orb);
    setTeaseOrbs(tease);

    let idx = 0;
    const interval = setInterval(() => {
      playChestTease();
      setTeaseIndex(idx);
      idx++;
      if (idx >= tease.length) {
        clearInterval(interval);
        setResult(orb);
        setRolling(false);
        playChestReveal();
        onPull(orb, newPity);
      }
    }, 150);
  };

  if (!open) return null;

  const currentTease = teaseIndex >= 0 && teaseIndex < teaseOrbs.length ? teaseOrbs[teaseIndex] : null;
  const showResult = result && !rolling;
  const currentRarity = showResult ? result!.rarity : currentTease?.rarity;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-md w-full my-auto bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-6 text-center overflow-hidden shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-center gap-2 mb-1">
          <Swords className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-black text-white">Orb Summon</h2>
        </div>
        <p className="text-slate-400 text-xs mb-6 italic">Summon permanent orbs for passive bonuses!</p>

        <div className={`relative h-52 flex flex-col items-center justify-center mb-6 rounded-2xl border-2 bg-gradient-to-br ${currentRarity ? RARITY_BG[currentRarity] : "from-slate-800/30 to-slate-900/30 border-slate-700/50"} transition-all duration-150`}>
          {rolling ? (
            <>
              <div key={teaseIndex} className="text-7xl mb-2" style={{ animation: "scoreBump 150ms ease-out" }}>
                {currentTease?.icon || "✨"}
              </div>
              {currentTease && (
                <div className={`font-black text-sm ${RARITY_COLORS[currentTease.rarity]}`}>
                  {RARITY_LABELS[currentTease.rarity]}
                </div>
              )}
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {teaseOrbs.map((o, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === teaseIndex
                        ? o.rarity === "legendary" ? "bg-amber-400 scale-150" :
                          o.rarity === "epic" ? "bg-purple-400 scale-150" :
                          o.rarity === "rare" ? "bg-blue-400 scale-150" :
                          "bg-slate-400 scale-150"
                        : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : showResult ? (
            <div style={{ animation: "modalIn 0.4s ease-out" }}>
              <div className="text-7xl mb-2" style={{ animation: "chestBurst 0.5s ease-out" }}>
                {result!.icon}
              </div>
              <div className={`font-black text-lg ${RARITY_COLORS[result!.rarity]}`}>
                {result!.name}
              </div>
              <div className={`text-sm font-bold ${RARITY_COLORS[result!.rarity]}`}>
                {RARITY_LABELS[result!.rarity]}
              </div>
              <div className="text-emerald-400 font-bold text-lg mt-1">+{result!.bonus}% Points</div>
            </div>
          ) : (
            <Swords className="w-20 h-20 text-slate-700" />
          )}
        </div>

        <button
          onClick={handlePull}
          disabled={gems < 100 || rolling}
          className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-transform active:scale-95"
        >
          <Gem className="w-5 h-5" /> {rolling ? "SUMMONING..." : "SUMMON (100 GEMS)"}
        </button>

        <div className="text-slate-500 text-[10px] font-bold mt-3 uppercase tracking-widest">
          {pity >= 50 ? "Guaranteed Legendary!" : `${50 - pity} pulls until Legendary`}
        </div>

        {gems < 100 && !rolling && (
          <div className="mt-3 text-amber-400 text-xs font-bold">
            Not enough gems — visit the Shop to get more!
          </div>
        )}
      </div>
    </div>
  );
}
