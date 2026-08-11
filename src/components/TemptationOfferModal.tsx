// src/components/TemptationOfferModal.tsx
import { useState, useEffect } from "react";
import { Zap, Timer, X, Sparkles } from "lucide-react";
import { STRIPE_LINKS } from "@/lib/monetization";

interface TemptationOfferModalProps {
  open: boolean;
  onClose: () => void;
}

export function TemptationOfferModal({ open, onClose }: TemptationOfferModalProps) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative max-w-sm w-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(251,191,36,0.3)]" style={{ animation: "modalIn 0.3s ease-out" }}>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-4 py-1 rounded-full font-black text-xs flex items-center gap-2">
          <Timer className="w-3 h-3" /> EXPIRES IN {timeLeft}s
        </div>
        
        <div className="w-20 h-20 mx-auto bg-amber-400/20 rounded-full flex items-center justify-center mb-6" style={{ animation: "pulseGlow 1s infinite" }}>
          <Zap className="w-10 h-10 text-amber-400" fill="currentColor" />
        </div>

        <h2 className="text-3xl font-black text-white mb-2">CONGRATULATIONS!</h2>
        <p className="text-slate-400 text-sm mb-6">You're on fire! Unlock <span className="text-amber-400 font-bold">2x POINTS FOREVER</span> now for a special price.</p>

        <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700">
          <div className="text-slate-500 line-through text-sm">$9.99</div>
          <div className="text-4xl font-black text-white">$2.99</div>
          <div className="text-amber-400 text-xs font-bold mt-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> ONE TIME OFFER
          </div>
        </div>

        <button 
          onClick={() => window.open(STRIPE_LINKS.TEMPTATION_OFFER, "_blank")}
          className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl transition-transform active:scale-95 shadow-lg shadow-amber-400/20"
        >
          CLAIM 2x POINTS NOW
        </button>
        
        <button onClick={onClose} className="mt-4 text-slate-500 text-xs font-bold hover:text-slate-400">
          MAYBE LATER
        </button>
      </div>
    </div>
  );
}
