import { Gem, Shield, X, ShoppingBag, Sparkles } from "lucide-react";
import { STRIPE_LINKS } from "@/lib/monetization";

export function ShopModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative max-w-sm w-full bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-6 h-6"/></button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
            <ShoppingBag className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white">Orb Shop</h2>
          <p className="text-slate-500 text-xs">Get gems and permanent power-ups</p>
        </div>

        <div className="space-y-3">
          {/* PERMANENT SHIELD */}
          <button onClick={() => window.open(STRIPE_LINKS.SHIELD_PERM, "_blank")} className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between hover:border-blue-500/50 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Shield className="text-blue-400 w-5 h-5"/></div>
              <div className="text-left"><div className="text-white font-bold text-sm">Permanent Shield</div><div className="text-[9px] text-slate-500 uppercase font-black">Never die to 1st bomb</div></div>
            </div>
            <div className="text-white font-black text-sm">$2.99</div>
          </button>

          {/* GEMS */}
          <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] pt-2 px-1">Gem Packs</div>
          <button onClick={() => window.open(STRIPE_LINKS.GEMS_100, "_blank")} className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between hover:border-emerald-500/50 transition-all">
            <div className="flex items-center gap-3"><Gem className="text-emerald-400 w-5 h-5"/><span className="text-white font-bold text-sm">100 Gems</span></div>
            <div className="text-white font-black text-sm">$0.99</div>
          </button>
          <button onClick={() => window.open(STRIPE_LINKS.GEMS_600, "_blank")} className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between hover:border-emerald-500/50 transition-all">
            <div className="flex items-center gap-3"><Gem className="text-emerald-400 w-5 h-5"/><span className="text-white font-bold text-sm">600 Gems</span></div>
            <div className="text-white font-black text-sm">$4.99</div>
          </button>
        </div>
      </div>
    </div>
  );
}
