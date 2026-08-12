import { useState, useEffect } from "react";
import { Heart, X, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { STRIPE_LINKS } from "@/lib/monetization";
import { hasDoublePoints } from "@/lib/premium";

interface Props { open: boolean; onClose: () => void; }

export function FirstGameOverOfferModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSuccess(false);
    setLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open || !loading) return;
    const checkInterval = setInterval(() => {
      if (hasDoublePoints()) {
        clearInterval(checkInterval);
        setSuccess(true);
        setLoading(false);
        setTimeout(() => onClose(), 2000);
      }
    }, 500);
    const timeout = setTimeout(() => clearInterval(checkInterval), 300000);
    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleCheckout = () => {
    setLoading(true);
    window.open(STRIPE_LINKS.FIRST_GAME_OVER, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-sm w-full bg-slate-900 border-2 border-cyan-400 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(34,211,238,0.2)]">
        <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        {success ? (
          <div style={{ animation: "modalIn 0.4s ease-out" }}>
            <div className="w-20 h-20 mx-auto bg-green-400/20 rounded-full flex items-center justify-center mb-6" style={{ animation: "pulseGlow 1s infinite" }}>
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">2x POINTS ACTIVATED!</h2>
            <p className="text-slate-400 text-sm">All your points are now doubled forever!</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto bg-cyan-400/20 rounded-full flex items-center justify-center mb-6" style={{ animation: "pulseGlow 1.5s infinite" }}>
              <Heart className="w-8 h-8 text-cyan-400" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">DON'T GIVE UP!</h2>
            <p className="text-slate-400 text-sm mb-6">Start your journey with a massive boost. Get <span className="text-cyan-400 font-bold">2x POINTS FOREVER</span> for less than a coffee.</p>
            <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700">
              <div className="text-3xl font-black text-white">$0.99</div>
              <div className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mt-1">First Time Special</div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-black rounded-2xl transition-transform active:scale-95 disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? "Waiting for payment..." : "UNLOCK 2x POINTS"}
              </span>
            </button>
            <button onClick={onClose} className="mt-4 text-slate-500 text-xs font-bold hover:text-slate-400">CLOSE</button>
          </>
        )}
      </div>
    </div>
  );
}
