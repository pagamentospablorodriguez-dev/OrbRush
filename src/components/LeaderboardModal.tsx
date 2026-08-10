import { Crown, Swords, Flame, TrendingUp } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/leaderboard";

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  rivalBeatenCount: number;
  onClose: () => void;
}

export function LeaderboardModal({ entries, rivalBeatenCount, onClose }: LeaderboardModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative max-w-md w-full my-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn 300ms ease-out" }}>
        <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10">
          <span className="text-lg leading-none">×</span>
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-6 h-6 text-amber-400" />
          <h3 className="text-xl sm:text-2xl font-black text-white">Leaderboard</h3>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mb-4">Climb the ranks and beat your rivals!</p>

        {rivalBeatenCount > 0 && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/15 border border-orange-400/30">
            <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span className="text-orange-300 text-xs font-bold">Rivals beaten: {rivalBeatenCount}</span>
          </div>
        )}

        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {entries.map((entry) => (
            <div
              key={`${entry.rank}-${entry.name}`}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                entry.isYou
                  ? "bg-cyan-500/15 border-cyan-400/50 ring-1 ring-cyan-400/30"
                  : entry.isWhale
                  ? "bg-amber-500/10 border-amber-400/30"
                  : entry.isRival
                  ? "bg-orange-500/10 border-orange-400/30"
                  : "bg-slate-800/60 border-slate-700"
              }`}
            >
              <div className={`w-8 text-center font-black text-sm flex-shrink-0 ${
                entry.rank === 1 ? "text-amber-400" : entry.rank === 2 ? "text-slate-300" : entry.rank === 3 ? "text-orange-400" : "text-slate-500"
              }`}>
                {entry.rank <= 3 ? `#${entry.rank}` : entry.rank}
              </div>
              <div className={`text-2xl flex-shrink-0 ${entry.isWhale ? "" : ""}`}>{entry.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm truncate flex items-center gap-1.5 ${
                  entry.isYou ? "text-cyan-300" : entry.isWhale ? "text-amber-300" : entry.isRival ? "text-orange-300" : "text-white"
                }`}>
                  {entry.name}
                  {entry.isWhale && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                  {entry.isYou && <span className="text-[10px] text-cyan-400 font-bold">(YOU)</span>}
                  {entry.isRival && <Swords className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                </div>
                {entry.isRival && (
                  <div className="flex items-center gap-1 text-[10px] text-orange-400/80 font-medium">
                    <TrendingUp className="w-3 h-3" /> Your rival — beat them!
                  </div>
                )}
                {entry.isWhale && (
                  <div className="text-[10px] text-amber-400/60 font-medium">Premium legend</div>
                )}
              </div>
              <div className={`font-black tabular-nums text-sm flex-shrink-0 ${
                entry.isYou ? "text-cyan-300" : entry.isWhale ? "text-amber-400" : entry.isRival ? "text-orange-300" : "text-slate-300"
              }`}>
                {entry.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-xs">
            <Crown className="w-3 h-3 inline text-amber-400 mr-1" />
            Top players dominate with Premium power-ups
          </p>
        </div>
      </div>
    </div>
  );
}
