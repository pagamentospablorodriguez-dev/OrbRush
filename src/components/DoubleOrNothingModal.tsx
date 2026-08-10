import { useState, useEffect, useRef } from "react";
import { Gem, Zap, AlertTriangle, CheckCircle2, X, RotateCcw } from "lucide-react";
import { flipDoubleOrNothing } from "@/lib/doubleOrNothing";

interface DoubleOrNothingModalProps {
  initialGems: number;
  onCollect: (finalGems: number) => void;
  onClose: () => void;
}

type Phase = "offer" | "flipping" | "result" | "ended";

export function DoubleOrNothingModal({ initialGems, onCollect, onClose }: DoubleOrNothingModalProps) {
  const [currentGems, setCurrentGems] = useState(initialGems);
  const [phase, setPhase] = useState<Phase>("offer");
  const [wonLast, setWonLast] = useState(false);
  const [history, setHistory] = useState<boolean[]>([]);
  const [coinAngle, setCoinAngle] = useState(0);
  const flipTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, []);

  const handleFlip = () => {
    if (phase !== "offer" && phase !== "result") return;
    setPhase("flipping");
    setCoinAngle((prev) => prev + 720 + Math.random() * 360);

    flipTimerRef.current = window.setTimeout(() => {
      const result = flipDoubleOrNothing(currentGems);
      setWonLast(result.won);
      setCurrentGems(result.newAmount);
      setHistory((prev) => [...prev, result.won]);
      setPhase(result.won ? "result" : "ended");
    }, 1800);
  };

  const handleCollect = () => {
    onCollect(currentGems);
  };

  const canContinue = phase === "result" && wonLast && currentGems > 0;
  const isUnclosable = phase === "flipping";

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={isUnclosable ? undefined : onClose}>
      <div className="relative max-w-sm w-full my-auto bg-slate-900 border-2 border-fuchsia-400/30 rounded-3xl p-6 sm:p-8 text-center" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn 300ms ease-out" }}>
        {!isUnclosable && phase !== "ended" && (
          <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10">
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center justify-center gap-2 mb-1">
          <Zap className="w-6 h-6 text-fuchsia-400" fill="currentColor" />
          <h3 className="text-xl sm:text-2xl font-black text-white">Double or Nothing</h3>
        </div>

        {phase === "ended" ? (
          <div style={{ animation: "modalIn 400ms ease-out" }}>
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 border-2 border-red-400/50 flex items-center justify-center mb-4">
              <X className="w-10 h-10 text-red-400" />
            </div>
            <h4 className="text-2xl font-black text-white mb-2">You Lost It All!</h4>
            <p className="text-slate-400 text-sm mb-6">Better luck next time. The thrill is the game!</p>
            <button onClick={onClose} className="w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold hover:scale-105 active:scale-95 transition-transform">
              <span className="flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" /> Continue</span>
            </button>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-xs sm:text-sm mb-6">
              {phase === "offer" && initialGems > 0
                ? `You earned ${initialGems} gems! Risk them for 2x or keep them safe.`
                : canContinue
                ? `You're on fire! Risk ${currentGems} gems for ${currentGems * 2}?`
                : "50/50 chance — double your gems or lose them all!"}
            </p>

            {/* Current gems display */}
            <div className="mb-6 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-fuchsia-500/15 border-2 border-fuchsia-400/40">
              <Gem className="w-6 h-6 text-fuchsia-300" />
              <span className="text-3xl font-black text-fuchsia-300 tabular-nums">{currentGems}</span>
              <span className="text-fuchsia-400/60 text-sm font-bold">gems</span>
            </div>

            {/* Coin / flip animation */}
            <div className="mb-6 flex justify-center">
              {phase === "flipping" || phase === "result" ? (
                <div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 border-4 border-amber-300 flex items-center justify-center shadow-2xl shadow-amber-500/50"
                  style={{
                    transform: `rotateY(${coinAngle}deg)`,
                    transition: "transform 1.8s cubic-bezier(0.22, 0.61, 0.36, 1)",
                  }}
                >
                  <Gem className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-4 border-slate-600 flex items-center justify-center">
                  <Gem className="w-10 h-10 text-slate-400" />
                </div>
              )}
            </div>

            {/* Result indicator */}
            {phase === "result" && (
              <div className="mb-4" style={{ animation: "modalIn 300ms ease-out" }}>
                {wonLast ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border-2 border-green-400/50 text-green-300 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5" /> DOUBLED! Now you have {currentGems}!
                  </div>
                ) : null}
              </div>
            )}

            {/* History dots */}
            {history.length > 0 && (
              <div className="mb-4 flex items-center justify-center gap-1.5">
                {history.map((won, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${won ? "bg-green-400" : "bg-red-400"}`}
                  />
                ))}
              </div>
            )}

            {/* Action buttons */}
            {phase === "flipping" ? (
              <div className="text-fuchsia-400 font-bold text-sm animate-pulse">Flipping...</div>
            ) : canContinue ? (
              <div className="space-y-2.5">
                <button
                  onClick={handleFlip}
                  className="w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-black text-base shadow-2xl shadow-fuchsia-500/40 hover:scale-105 active:scale-95 transition-transform"
                >
                  <span className="flex items-center justify-center gap-2"><Zap className="w-5 h-5" fill="currentColor" /> GO AGAIN — RISK {currentGems}</span>
                </button>
                <button
                  onClick={handleCollect}
                  className="w-full px-8 py-3 rounded-2xl bg-slate-700 border border-slate-600 text-white font-bold hover:scale-105 active:scale-95 transition-transform"
                >
                  <span className="flex items-center justify-center gap-2"><Gem className="w-4 h-4 text-fuchsia-300" /> Collect {currentGems} gems</span>
                </button>
              </div>
            ) : phase === "offer" && initialGems > 0 ? (
              <div className="space-y-2.5">
                <button
                  onClick={handleFlip}
                  className="w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-black text-base shadow-2xl shadow-fuchsia-500/40 hover:scale-105 active:scale-95 transition-transform"
                >
                  <span className="flex items-center justify-center gap-2"><Zap className="w-5 h-5" fill="currentColor" /> RISK IT — {initialGems} → {initialGems * 2}</span>
                </button>
                <button
                  onClick={handleCollect}
                  className="w-full px-8 py-3 rounded-2xl bg-slate-700 border border-slate-600 text-white font-bold hover:scale-105 active:scale-95 transition-transform"
                >
                  <span className="flex items-center justify-center gap-2"><Gem className="w-4 h-4 text-fuchsia-300" /> Keep {initialGems} gems safe</span>
                </button>
              </div>
            ) : (
              <button onClick={onClose} className="w-full px-8 py-3.5 rounded-2xl bg-slate-700 border border-slate-600 text-white font-bold hover:scale-105 active:scale-95 transition-transform">
                Continue
              </button>
            )}

            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>50/50 chance · Pure luck, no skill involved</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
