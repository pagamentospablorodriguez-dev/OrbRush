import { useState } from "react";
import { Heart, X, Loader2, Crown, Sparkles, Zap } from "lucide-react";
import { STRIPE_CHECKOUT_URL, setPremium } from "@/lib/premium";

interface ContinueOfferModalProps {
  open: boolean;
  onClose: () => void;
  onActivated: () => void;
}

export function ContinueOfferModal({ open, onClose, onActivated }: ContinueOfferModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleCheckout = () => {
    setLoading(true);
    window.open(STRIPE_CHECKOUT_URL, "_blank");
    const checkInterval = setInterval(() => {
      if (localStorage.getItem("orbrush_premium") === "true") {
        clearInterval(checkInterval);
        setPremium(true);
        onActivated();
      }
    }, 500);
    setTimeout(() => clearInterval(checkInterval), 300000);
  };

  return (
    <div className="fixed inset-0 z-[95] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative max-w-sm w-full my-auto bg-slate-900 border-2 border-rose-400/40 rounded-3xl p-6 sm:p-8 text-center" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn 300ms ease-out" }}>
        <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        {/* Frustration hook */}
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-400/50 flex items-center justify-center mb-4" style={{ animation: "pulseGlow 1s ease-in-out infinite" }}>
          <Heart className="w-8 h-8 text-rose-400" fill="currentColor" />
        </div>

        <h3 className="text-2xl font-black text-white mb-1">Don't Stop Now!</h3>
        <p className="text-slate-400 text-sm mb-6">You were on a roll. Keep your momentum going.</p>

        {/* Premium upsell */}
        <div className="mb-3 p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-2 border-amber-400/40">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300 font-black text-sm">BEST VALUE</span>
          </div>
          <p className="text-slate-300 text-xs mb-3">Unlock OrbRush once and play forever — no more waiting, no more limits.</p>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-base shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? "Waiting..." : "UNLOCK — $4.99"}
            </span>
          </button>
        </div>

        {/* Maybe later */}
        <button
          onClick={onClose}
          className="w-full px-6 py-3 rounded-2xl bg-slate-700 border border-slate-600 text-white font-bold text-sm hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Maybe later
          </span>
        </button>

        <p className="mt-4 text-slate-600 text-[11px]">Or wait for your next free life to recharge.</p>
      </div>
    </div>
  );
}
