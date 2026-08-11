import { useState, useEffect } from "react";
import { Crown, Zap, Shield, Sparkles, CheckCircle2, Loader2, Lock, Flame, Trophy, Infinity as InfinityIcon, X, Heart, Timer } from "lucide-react";
import { STRIPE_CHECKOUT_URL, setPremium } from "@/lib/premium";
import { getSecondsToNextLife } from "@/lib/lives";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onActivated: () => void;
}

export function PaywallModal({ open, onClose, onActivated }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(getSecondsToNextLife());
    const timer = setInterval(() => {
      setSecondsLeft(getSecondsToNextLife());
    }, 1000);
    return () => clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const handleCheckout = () => {
    setLoading(true);
    window.open(STRIPE_CHECKOUT_URL, "_blank");
    // Check periodically if premium got activated (e.g., via redirect back with code)
    const checkInterval = setInterval(() => {
      if (localStorage.getItem("orbrush_premium") === "true") {
        clearInterval(checkInterval);
        setSuccess(true);
        setPremium(true);
        setTimeout(() => onActivated(), 1500);
      }
    }, 500);
    // Stop checking after 5 minutes
    setTimeout(() => clearInterval(checkInterval), 300000);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative max-w-md w-full my-auto" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn 400ms ease-out" }}>
        {/* Close button — player can close and navigate, but can't play without lives */}
        <button onClick={onClose} className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/20">
          {success ? (
            <div style={{ animation: "modalIn 500ms ease-out" }}>
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border-2 border-green-400/50 flex items-center justify-center mb-4" style={{ animation: "pulseGlow 1s ease-in-out infinite" }}>
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">OrbRush Unlocked!</h2>
              <p className="text-slate-400 text-sm">Enjoy unlimited lives and premium power!</p>
            </div>
          ) : (
            <>
              {/* Out of lives badge */}
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 font-black text-xs mb-4" style={{ animation: "countdownPulse 1s ease-in-out infinite" }}>
                <Heart className="w-3.5 h-3.5" />
                OUT OF LIVES
              </div>

              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400/20 to-orange-600/20 border-2 border-amber-400/40 flex items-center justify-center mb-4" style={{ animation: "orbPulse 2s ease-in-out infinite" }}>
                <Crown className="w-10 h-10 text-amber-400" />
              </div>

              <h2 className="text-3xl font-black text-white mb-1">Unlock OrbRush</h2>
              <p className="text-amber-300 font-bold text-sm mb-1">One-time purchase. Play forever.</p>
              <p className="text-slate-400 text-sm mb-6">No more waiting. No more limits. Just pure orb-tapping action.</p>

              {/* Benefits */}
              <div className="mb-6 space-y-2.5 text-left">
                <div className="flex items-center gap-2.5 text-sm text-slate-200 bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/50">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0"><InfinityIcon className="w-4 h-4 text-amber-400" /></div>
                  <span><b className="text-white">Unlimited lives</b> — play as much as you want</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-200 bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/50">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0"><Flame className="w-4 h-4 text-orange-400" /></div>
                  <span><b className="text-white">No waiting</b> — never wait 20 min for a life again</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-200 bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/50">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-fuchsia-400" /></div>
                  <span><b className="text-white">Exclusive orbs & rewards</b> — premium-only content</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-200 bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/50">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0"><Shield className="w-4 h-4 text-cyan-400" /></div>
                  <span><b className="text-white">Premium power-ups</b> — shield, frenzy & more</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-200 bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/50">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0"><Trophy className="w-4 h-4 text-amber-400" /></div>
                  <span><b className="text-white">2x points forever</b> — dominate the leaderboard</span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4 flex items-center justify-center gap-2">
                <span className="text-slate-500 line-through text-lg">$9.99</span>
                <span className="text-4xl font-black text-amber-400">$4.99</span>
                <span className="text-slate-400 text-sm font-medium">one-time</span>
              </div>
              <div className="mb-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/15 border border-green-400/30 text-green-300 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pay once · Play forever
              </div>

              {/* CTA */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg shadow-2xl shadow-amber-500/50 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
                  {loading ? "Waiting for payment..." : "UNLOCK ORBRUSH — $4.99"}
                </span>
              </button>

              {/* Wait option */}
              <div className="mt-5 pt-5 border-t border-slate-800">
                <p className="text-slate-500 text-xs mb-2">Or wait for your next free life</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700">
                  <Timer className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-400 font-mono font-bold text-sm tabular-nums">{timeStr}</span>
                </div>
                <p className="mt-2 text-slate-600 text-[11px]">Premium members never wait — they play instantly.</p>
              </div>

              <div className="mt-5 flex items-center justify-center gap-1.5 text-slate-600 text-xs">
                <Lock className="w-3 h-3" />
                <span>Secure checkout via Stripe</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
