import { useState, useEffect } from "react";
import { X, Clock, Gift, Flame } from "lucide-react";

const STORAGE_KEY = "orbrush_limited_offer";
const DURATION = 30 * 60 * 1000;

export function LimitedOfferModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!open) return;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const { startTime } = JSON.parse(data);
    const update = () => {
      const remaining = DURATION - (Date.now() - startTime);
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        localStorage.removeItem(STORAGE_KEY);
        onClose();
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [open, onClose]);

  if (!open) return null;

  const mins = Math.floor(timeLeft / (1000 * 60));
  const secs = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const handleBuy = () => {
    window.open("https://buy.stripe.com/PLACEHOLDER_LEGENDARY_50OFF", "_blank");
  };

  const handleDismiss = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem("orbrush_limited_offer_last", Date.now().toString());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-sm w-full my-auto bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-rose-400/50 rounded-3xl p-6 text-center shadow-2xl" style={{ animation: "modalIn 0.3s ease-out" }}>
        <button onClick={handleDismiss} className="absolute top-3 right-3 text-slate-500 hover:text-white z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold mb-3" style={{ animation: "pulseGlow 1s ease-in-out infinite" }}>
          <Clock className="w-3.5 h-3.5" />
          {mins}m {secs}s left!
        </div>

        <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-400/30" style={{ animation: "chestShake 2s ease-in-out infinite" }}>
          <Gift className="w-8 h-8 text-amber-400" />
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-black mb-2">
          <Flame className="w-3 h-3" fill="currentColor" /> 50% OFF
        </div>

        <h2 className="text-2xl font-black text-white mb-1">Legendary Chest</h2>
        <p className="text-slate-400 text-xs mb-4">Limited time offer! Grab it before it's gone!</p>

        <div className="mb-4">
          <div className="text-slate-500 text-sm line-through">$1.99</div>
          <div className="text-3xl font-black text-amber-400">$0.99</div>
          <div className="text-amber-400/70 text-xs font-bold">Save 50%!</div>
        </div>

        <button onClick={handleBuy} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform">
          CLAIM NOW
        </button>
        <button onClick={handleDismiss} className="mt-2 text-slate-500 text-xs hover:text-slate-400">
          No thanks
        </button>
      </div>
    </div>
  );
}
