import { useState } from "react";
import { Crown, Lock, Zap, Star, Shield, X, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { STRIPE_CHECKOUT_URL, activateWithCode, setPremium } from "@/lib/premium";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onActivated: () => void;
}

export function PaywallModal({ open, onClose, onActivated }: PaywallModalProps) {
  const [mode, setMode] = useState<"checkout" | "activate">("checkout");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleCheckout = () => {
    window.open(STRIPE_CHECKOUT_URL, "_blank");
  };

  const handleActivate = async () => {
    if (!code.trim()) {
      setError("Please enter your activation code.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await activateWithCode(code.trim());
    setLoading(false);
    if (result.valid) {
      setSuccess(true);
      setPremium(true);
      setTimeout(() => {
        onActivated();
      }, 1500);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ animation: "modalIn 300ms ease-out" }}>
        <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-400/30 rounded-3xl p-8 text-center">
          {success ? (
            <div style={{ animation: "modalIn 500ms ease-out" }}>
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border-2 border-green-400/50 flex items-center justify-center mb-4" style={{ animation: "pulseGlow 1s ease-in-out infinite" }}>
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Premium Activated!</h2>
              <p className="text-slate-400 text-sm">Enjoy unlimited access to OrbRush!</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400/20 to-orange-600/20 border-2 border-amber-400/40 flex items-center justify-center mb-4" style={{ animation: "orbPulse 2s ease-in-out infinite" }}>
                <Crown className="w-10 h-10 text-amber-400" />
              </div>

              <h2 className="text-3xl font-black text-white mb-1">OrbRush Premium</h2>
              <p className="text-slate-400 text-sm mb-6">Unlock unlimited play and keep your streak alive!</p>

              <div className="mb-6 space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm text-slate-300"><Zap className="w-4 h-4 text-amber-400 flex-shrink-0" /> Unlimited gameplay — no interruptions</div>
                <div className="flex items-center gap-2 text-sm text-slate-300"><Star className="w-4 h-4 text-amber-400 flex-shrink-0" /> Keep your daily streak and progress</div>
                <div className="flex items-center gap-2 text-sm text-slate-300"><Shield className="w-4 h-4 text-amber-400 flex-shrink-0" /> Premium power-ups and bonuses</div>
                <div className="flex items-center gap-2 text-sm text-slate-300"><Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" /> Exclusive orbs and rewards</div>
              </div>

              <div className="mb-6 inline-flex items-baseline gap-1">
                <span className="text-4xl font-black text-amber-400">$19.99</span>
                <span className="text-slate-400 text-sm font-medium">/month</span>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setMode("checkout")} className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${mode === "checkout" ? "bg-amber-500/20 border-2 border-amber-400/50 text-amber-300" : "bg-slate-800/60 border border-slate-700 text-slate-400"}`}>
                  Subscribe
                </button>
                <button onClick={() => setMode("activate")} className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${mode === "activate" ? "bg-amber-500/20 border-2 border-amber-400/50 text-amber-300" : "bg-slate-800/60 border border-slate-700 text-slate-400"}`}>
                  Activation Code
                </button>
              </div>

              {mode === "checkout" ? (
                <>
                  <button onClick={handleCheckout} className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-transform">
                    <span className="flex items-center justify-center gap-2"><Crown className="w-5 h-5" /> Subscribe Now — $19.99/mo</span>
                  </button>
                  <p className="mt-3 text-slate-500 text-xs">Cancel anytime. Secure payment via Stripe.</p>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter activation code"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-amber-400/50 mb-3"
                    onKeyDown={(e) => { if (e.key === "Enter") handleActivate(); }}
                  />
                  {error && <div className="mb-3 text-rose-400 text-sm font-bold">{error}</div>}
                  <button onClick={handleActivate} disabled={loading} className="w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg shadow-2xl shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="flex items-center justify-center gap-2">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Activate Premium</span>
                  </button>
                  <p className="mt-3 text-slate-500 text-xs">Have an activation code? Enter it above to unlock Premium.</p>
                </>
              )}

              <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-500 text-xs">
                <Lock className="w-3 h-3" />
                <span>Secure checkout · Instant activation</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
