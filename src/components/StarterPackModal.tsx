import { useState, useEffect } from "react";
import { Gem, Shield, X, Clock, Crown } from "lucide-react";

const STORAGE_KEY = "orbrush_starter_pack";
const DURATION = 24 * 60 * 60 * 1000;

export function StarterPackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!open) return;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const { startTime } = JSON.parse(data);
    const update = () => {
      const remaining = DURATION - (Date.now() - startTime);
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) onClose();
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [open, onClose]);

  if (!open) return null;

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const mins = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const handleBuy = () => {
    window.open("https://buy.stripe.com/PLACEHOLDER_STARTER_PACK", "_blank");
  };

  const handleDismiss = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      parsed.status = "dismissed";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative max-w-sm w-full my-auto bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-400/50 rounded-3xl p-6 text-center shadow-2xl" style={{ animation: "modalIn 0.3s ease-out" }}>
        <button onClick={handleDismiss} className="absolute top-3 right-3 text-slate-500 hover:text-white z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold mb-3" style={{ animation: "pulseGlow 1s ease-in-out infinite" }}>
          <Clock className="w-3.5 h-3.5" />
          Expires in {hours}h {mins}m {secs}s
        </div>

        <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-400/30">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>

        <h2 className="text-2xl font-black text-white mb-1">Starter Pack</h2>
        <p className="text-slate-400 text-xs mb-4">Special offer for new players!</p>

        <div className="space-y-2 mb-4 text-left">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700">
            <Gem className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-bold text-sm">300 Gems</span>
            <span className="text-slate-500 text-xs ml-auto">$3.00 value</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-white font-bold text-sm">Permanent Shield</span>
            <span className="text-slate-500 text-xs ml-auto">$2.99 value</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-slate-500 text-sm line-through">$5.99</div>
          <div className="text-3xl font-black text-amber-400">$1.99</div>
          <div className="text-amber-400/70 text-xs font-bold">Save 67%!</div>
        </div>

        <button onClick={handleBuy} className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-transform">
          BUY NOW
        </button>
        <button onClick={handleDismiss} className="mt-2 text-slate-500 text-xs hover:text-slate-400">
          Maybe later
        </button>
      </div>
    </div>
  );
}
