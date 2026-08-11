// Social invite system — players share a link, new players who click it trigger a 200 gem reward.
// Also tracks invite count for the inviter.

import { supabase } from "./supabase";
import { getDeviceId } from "./deviceId";

const INVITE_REWARD = 200;

export function getInviteLink(): string {
  const deviceId = getDeviceId();
  const baseUrl = window.location.origin;
  return `${baseUrl}/?ref=${deviceId}`;
}

export async function checkReferral(): Promise<{ wasReferred: boolean; inviterDeviceId: string | null }> {
  try {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (!ref) return { wasReferred: false, inviterDeviceId: null };

    const myDeviceId = getDeviceId();
    if (ref === myDeviceId) {
      // Don't refer yourself
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.origin + url.pathname);
      return { wasReferred: false, inviterDeviceId: null };
    }

    // Check if this device was already invited
    const { data: existing } = await supabase
      .from("invite_tracking")
      .select("id")
      .eq("invited_device_id", myDeviceId)
      .maybeSingle();

    if (existing) {
      // Already tracked — clean URL
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.origin + url.pathname);
      return { wasReferred: false, inviterDeviceId: null };
    }

    // Record the referral
    const { error } = await supabase
      .from("invite_tracking")
      .insert({
        inviter_device_id: ref,
        invited_device_id: myDeviceId,
        reward_claimed: false,
      });

    if (error) {
      // Might be a race condition — another tab already inserted
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.origin + url.pathname);
      return { wasReferred: false, inviterDeviceId: null };
    }

    // Mark this player as invited-by
    await supabase
      .from("player_stats")
      .update({ invited_by: ref })
      .eq("device_id", myDeviceId);

    // Clean the URL
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.origin + url.pathname);

    return { wasReferred: true, inviterDeviceId: ref };
  } catch {
    return { wasReferred: false, inviterDeviceId: null };
  }
}

export async function claimInviteReward(inviterDeviceId: string): Promise<{ gems: number; success: boolean }> {
  try {
    const myDeviceId = getDeviceId();

    // Mark the invite_tracking row as claimed
    const { error: updateError } = await supabase
      .from("invite_tracking")
      .update({ reward_claimed: true })
      .eq("inviter_device_id", inviterDeviceId)
      .eq("invited_device_id", myDeviceId)
      .eq("reward_claimed", false);

    if (updateError) return { gems: 0, success: false };

    // Give the inviter 200 gems and increment their invite_count
    const { data: inviter } = await supabase
      .from("player_stats")
      .select("gems, invite_count")
      .eq("device_id", inviterDeviceId)
      .maybeSingle();

    if (inviter) {
      await supabase
        .from("player_stats")
        .update({
          gems: (inviter.gems ?? 0) + INVITE_REWARD,
          invite_count: (inviter.invite_count ?? 0) + 1,
        })
        .eq("device_id", inviterDeviceId);
    }

    return { gems: INVITE_REWARD, success: true };
  } catch {
    return { gems: 0, success: false };
  }
}

export async function getInviteCount(): Promise<number> {
  try {
    const myDeviceId = getDeviceId();
    const { data } = await supabase
      .from("player_stats")
      .select("invite_count")
      .eq("device_id", myDeviceId)
      .maybeSingle();
    return data?.invite_count ?? 0;
  } catch {
    return 0;
  }
}

export async function getPendingInviteRewards(): Promise<{ count: number; gems: number }> {
  try {
    const myDeviceId = getDeviceId();
    const { data } = await supabase
      .from("invite_tracking")
      .select("id")
      .eq("inviter_device_id", myDeviceId)
      .eq("reward_claimed", false);

    const count = data?.length ?? 0;
    return { count, gems: count * INVITE_REWARD };
  } catch {
    return { count: 0, gems: 0 };
  }
}

export async function claimAllPendingInviteRewards(): Promise<{ gems: number; count: number }> {
  try {
    const myDeviceId = getDeviceId();
    const { data: pending } = await supabase
      .from("invite_tracking")
      .select("id, invited_device_id")
      .eq("inviter_device_id", myDeviceId)
      .eq("reward_claimed", false);

    if (!pending || pending.length === 0) return { gems: 0, count: 0 };

    const count = pending.length;
    const totalGems = count * INVITE_REWARD;

    // Mark all as claimed
    const ids = pending.map((p) => p.id);
    await supabase
      .from("invite_tracking")
      .update({ reward_claimed: true })
      .in("id", ids);

    // Give gems to inviter
    const { data: me } = await supabase
      .from("player_stats")
      .select("gems, invite_count")
      .eq("device_id", myDeviceId)
      .maybeSingle();

    if (me) {
      await supabase
        .from("player_stats")
        .update({
          gems: (me.gems ?? 0) + totalGems,
          invite_count: (me.invite_count ?? 0) + count,
        })
        .eq("device_id", myDeviceId);
    }

    return { gems: totalGems, count };
  } catch {
    return { gems: 0, count: 0 };
  }
}

export { INVITE_REWARD };
