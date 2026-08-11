// src/components/FirstGameOverOfferModal.tsx
import { Zap, X, Heart, Sparkles } from "lucide-react";
import { STRIPE_LINKS } from "@/lib/monetization";

interface Props { open: boolean; onClose: () => void; }

export function FirstGameOverOfferModal({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-sm w-full bg-slate-900 border-2 border-cyan-400 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(34,211,238,0.2)]">
        <div className="w-16 h-16 mx-auto bg-cyan-400/20 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-8 h-8 text-cyan-400" fill="currentColor" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">DON'T GIVE UP!</h2>
        <p className="text-slate-400 text-sm mb-6">Start your journey with a massive boost. Get <span className="text-cyan-400 font-bold">2x POINTS FOREVER</span> for less than a coffee.</p>
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700">
          <div className="text-3xl font-black text-white">$0.99</div>
          <div className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mt-1">First Time Special</div>
        </div>
        <button onClick={() => window.open(STRIPE_LINKS.FIRST_GAME_OVER, "_blank")} className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-black rounded-2xl transition-transform active:scale-95">
          UNLOCK 2x POINTS
        </button>
        <button onClick={onClose} className="mt-4 text-slate-500 text-xs font-bold">CLOSE</button>
      </div>
    </div>
  );
}
