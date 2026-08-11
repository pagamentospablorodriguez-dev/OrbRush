import { useState, useEffect } from "react";
import { Users, Link as LinkIcon, Copy, Check, Gift, X, Gem, Share2, Trophy } from "lucide-react";
import { getInviteLink, getPendingInviteRewards, claimAllPendingInviteRewards, getInviteCount, INVITE_REWARD } from "@/lib/invites";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onRewardsClaimed: (gems: number) => void;
}

export function InviteModal({ open, onClose, onRewardsClaimed }: InviteModalProps) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [pendingGems, setPendingGems] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [inviteCount, setInviteCount] = useState(0);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (open) {
      setLink(getInviteLink());
      setCopied(false);
      (async () => {
        const pending = await getPendingInviteRewards();
        setPendingGems(pending.gems);
        setPendingCount(pending.count);
        setInviteCount(await getInviteCount());
      })();
    }
  }, [open]);

  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "OrbRush",
          text: "Beat my high score on OrbRush! Can you do better?",
          url: link,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    const result = await claimAllPendingInviteRewards();
    if (result.gems > 0) {
      setPendingGems(0);
      setPendingCount(0);
      setInviteCount(inviteCount + result.count);
      onRewardsClaimed(result.gems);
    }
    setClaiming(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="relative max-w-md w-full my-auto bg-slate-900 border-2 border-cyan-400/40 rounded-3xl p-6 sm:p-8 text-center" onClick={(e) => e.stopPropagation()} style={{ animation: "modalIn 400ms ease-out" }}>
        <button onClick={onClose} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center mb-3" style={{ animation: "orbPulse 2s ease-in-out infinite" }}>
          <Users className="w-8 h-8 text-cyan-400" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">Invite Friends</h2>
        <p className="text-slate-400 text-sm mb-4">Share your link and earn {INVITE_REWARD} gems per friend who joins!</p>

        {/* Pending rewards */}
        {pendingCount > 0 && (
          <div className="mb-4 p-4 rounded-2xl bg-green-500/15 border-2 border-green-400/40" style={{ animation: "pulseGlow 1.5s ease-in-out infinite" }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Gift className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-black text-lg">{pendingCount} friend{pendingCount > 1 ? "s" : ""} joined!</span>
            </div>
            <div className="text-green-400 font-black text-2xl">+{pendingGems} gems ready!</div>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="mt-3 w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
            >
              {claiming ? "Claiming..." : `CLAIM ${pendingGems} GEMS`}
            </button>
          </div>
        )}

        {/* Invite link */}
        <div className="mb-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
            <LinkIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              readOnly
              value={link}
              className="flex-1 bg-transparent text-slate-300 text-xs font-mono outline-none truncate"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors flex-shrink-0 ${
                copied ? "bg-green-500/20 text-green-300 border border-green-400/40" : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30"
              }`}
            >
              {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
            </button>
          </div>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:scale-105 active:scale-95 transition-transform mb-4"
        >
          <span className="flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" />
            SHARE LINK
          </span>
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
            <Users className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <div className="text-cyan-400 font-bold text-lg">{inviteCount}</div>
            <div className="text-slate-500 text-[10px]">Friends Invited</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
            <Gem className="w-4 h-4 text-fuchsia-400 mx-auto mb-1" />
            <div className="text-fuchsia-400 font-bold text-lg">{inviteCount * INVITE_REWARD}</div>
            <div className="text-slate-500 text-[10px]">Total Earned</div>
          </div>
        </div>

        {/* Challenge friend */}
        <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-amber-300 text-xs font-bold text-left">Challenge your friends to beat your high score!</span>
        </div>
      </div>
    </div>
  );
}
