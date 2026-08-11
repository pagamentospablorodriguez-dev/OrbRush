import { createClient } from "@supabase/supabase-js";
import { getDeviceId } from "./deviceId";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);

const deviceId = getDeviceId();

export interface PlayerStats {
  id: number;
  device_id: string;
  high_score: number;
  best_combo: number;
  total_taps: number;
  total_golden: number;
  current_level: number;
  daily_streak: number;
  last_played_date: string | null;
  prestige: number;
  total_games: number;
  total_jackpots: number;
  best_comeback: number;
  daily_challenge_target: number;
  daily_challenge_progress: number;
  daily_challenge_date: string | null;
  total_revives: number;
  total_bosses: number;
  total_treasures: number;
  total_rainbows: number;
  total_chains: number;
  best_streak_bonus: number;
  lucky_streak: number;
  gems: number;
  quest_date: string | null;
  quest1_type: string;
  quest1_progress: number;
  quest1_target: number;
  quest1_done: boolean;
  quest2_type: string;
  quest2_progress: number;
  quest2_target: number;
  quest2_done: boolean;
  quest3_type: string;
  quest3_progress: number;
  quest3_target: number;
  quest3_done: boolean;
  wheel_date: string | null;
  total_chests: number;
  best_rarity: number;
  power_shield: boolean;
  power_extra_life: boolean;
  power_frenzy: boolean;
  power_double: boolean;
  power_freeze: boolean;
  login_reward_day: number;
  login_reward_date: string | null;
  login_reward_claimed_today: boolean;
  squeeze_state: string;
  squeeze_games_threshold: number;
  squeeze_games_counter: number;
  invite_count: number;
  invited_by: string | null;
  invite_reward_claimed: boolean;
  gacha_pity: number;
first_gameover_offered: boolean;

}

const DEFAULT_STATS: Omit<PlayerStats, "id" | "device_id"> = {
  high_score: 0,
  best_combo: 0,
  total_taps: 0,
  total_golden: 0,
  current_level: 1,
  daily_streak: 0,
  last_played_date: null,
  prestige: 0,
  total_games: 0,
  total_jackpots: 0,
  best_comeback: 0,
  daily_challenge_target: 0,
  daily_challenge_progress: 0,
  daily_challenge_date: null,
  total_revives: 0,
  total_bosses: 0,
  total_treasures: 0,
  total_rainbows: 0,
  total_chains: 0,
  best_streak_bonus: 0,
  lucky_streak: 0,
  gems: 0,
  quest_date: null,
  quest1_type: "",
  quest1_progress: 0,
  quest1_target: 0,
  quest1_done: false,
  quest2_type: "",
  quest2_progress: 0,
  quest2_target: 0,
  quest2_done: false,
  quest3_type: "",
  quest3_progress: 0,
  quest3_target: 0,
  quest3_done: false,
  wheel_date: null,
  total_chests: 0,
  best_rarity: 0,
  power_shield: false,
  power_extra_life: false,
  power_frenzy: false,
  power_double: false,
  power_freeze: false,
  login_reward_day: 0,
  login_reward_date: null,
  login_reward_claimed_today: false,
  squeeze_state: "dry",
  squeeze_games_threshold: 3,
  squeeze_games_counter: 0,
  invite_count: 0,
  invited_by: null,
  invite_reward_claimed: false,
  gacha_pity: 0,
first_gameover_offered: false,

};

export async function loadStats(): Promise<PlayerStats | null> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) {
    console.error("Failed to load stats:", error);
    return null;
  }
  if (data) return data as PlayerStats;

  // New player — create a row with zeroed defaults
  const { data: inserted, error: insertError } = await supabase
    .from("player_stats")
    .insert({ device_id: deviceId, ...DEFAULT_STATS })
    .select()
    .maybeSingle();
  if (insertError) {
    console.error("Failed to create player stats:", insertError);
    return null;
  }
  return inserted as PlayerStats | null;
}

export async function saveStats(stats: Partial<PlayerStats>): Promise<void> {
  const { error } = await supabase
    .from("player_stats")
    .update({ ...stats, updated_at: new Date().toISOString() })
    .eq("device_id", deviceId);
  if (error) console.error("Failed to save stats:", error);
}

export async function updateDailyStreak(): Promise<{ streak: number; isFirstPlayToday: boolean } | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("player_stats")
    .select("daily_streak, last_played_date")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) {
    console.error("Failed to load streak:", error);
    return null;
  }

  let streak = data?.daily_streak ?? 0;
  const lastDate = data?.last_played_date;

  if (lastDate === today) {
    return { streak, isFirstPlayToday: false };
  }

  if (lastDate) {
    const last = new Date(lastDate + "T00:00:00");
    const diffDays = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) streak += 1;
    else if (diffDays > 1) streak = 1;
  } else {
    streak = 1;
  }

  await saveStats({ daily_streak: streak, last_played_date: today });
  return { streak, isFirstPlayToday: true };
}

export async function rollDailyChallenge(): Promise<{ target: number; isNew: boolean } | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("player_stats")
    .select("daily_challenge_target, daily_challenge_date, daily_challenge_progress")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) {
    console.error("Failed to load challenge:", error);
    return null;
  }

  if (data?.daily_challenge_date === today && data.daily_challenge_target) {
    return { target: data.daily_challenge_target, isNew: false };
  }

  const targets = [500, 750, 1000, 1500, 2000, 3000, 5000];
  const target = targets[Math.floor(Math.random() * targets.length)];
  await saveStats({
    daily_challenge_target: target,
    daily_challenge_progress: 0,
    daily_challenge_date: today,
  });
  return { target, isNew: true };
}

export async function updateChallengeProgress(score: number): Promise<void> {
  await saveStats({ daily_challenge_progress: score });
}

export async function rollDailyQuests(): Promise<PlayerStats | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("player_stats")
    .select("quest_date, quest1_type, quest2_type, quest3_type")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (data?.quest_date === today && data.quest1_type) {
    return loadStats();
  }

  const pool = [
    { type: "score_2000", target: 2000, label: "Score 2000 points" },
    { type: "score_5000", target: 5000, label: "Score 5000 points" },
    { type: "combo_20", target: 20, label: "Combo x20" },
    { type: "combo_40", target: 40, label: "Combo x40" },
    { type: "golden_10", target: 10, label: "Collect 10 golden orbs" },
    { type: "golden_20", target: 20, label: "Collect 20 golden orbs" },
    { type: "jackpot_1", target: 1, label: "Win 1 jackpot" },
    { type: "jackpot_3", target: 3, label: "Win 3 jackpots" },
    { type: "level_10", target: 10, label: "Reach level 10" },
    { type: "boss_1", target: 1, label: "Defeat 1 boss" },
    { type: "rainbow_1", target: 1, label: "Collect 1 rainbow" },
    { type: "treasure_1", target: 1, label: "Open 1 treasure" },
    { type: "games_3", target: 3, label: "Play 3 games" },
    { type: "games_5", target: 5, label: "Play 5 games" },
  ];

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, 3);

  await saveStats({
    quest_date: today,
    quest1_type: picked[0].type,
    quest1_progress: 0,
    quest1_target: picked[0].target,
    quest1_done: false,
    quest2_type: picked[1].type,
    quest2_progress: 0,
    quest2_target: picked[1].target,
    quest2_done: false,
    quest3_type: picked[2].type,
    quest3_progress: 0,
    quest3_target: picked[2].target,
    quest3_done: false,
  });

  return loadStats();
}

export async function updateQuestProgress(
  type: string,
  value: number,
  incremental: boolean = false,
): Promise<void> {
  const stats = await loadStats();
  if (!stats) return;

  const updates: Record<string, any> = {};

  for (const i of [1, 2, 3] as const) {
    const qType = stats[`quest${i}_type` as keyof PlayerStats] as string;
    const qDone = stats[`quest${i}_done` as keyof PlayerStats] as boolean;
    const qProg = stats[`quest${i}_progress` as keyof PlayerStats] as number;
    const qTarget = stats[`quest${i}_target` as keyof PlayerStats] as number;

    if (qType === type && !qDone) {
      const newProg = incremental ? qProg + value : Math.max(qProg, value);
      if (newProg >= qTarget) {
        updates[`quest${i}_progress`] = qTarget;
        updates[`quest${i}_done`] = true;
      } else {
        updates[`quest${i}_progress`] = newProg;
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    await saveStats(updates as Partial<PlayerStats>);
  }
}

export async function claimQuestRewards(): Promise<{ gems: number; claimed: number }> {
  const stats = await loadStats();
  if (!stats) return { gems: 0, claimed: 0 };

  let gems = 0;
  let claimed = 0;
  const updates: Record<string, any> = {};

  for (const i of [1, 2, 3] as const) {
    const done = stats[`quest${i}_done` as keyof PlayerStats] as boolean;
    const type = stats[`quest${i}_type` as keyof PlayerStats] as string;
    if (done && !type.startsWith("claimed_")) {
      gems += 50;
      claimed++;
      updates[`quest${i}_type`] = `claimed_${type}`;
    }
  }

  if (claimed > 0) {
    updates.gems = (stats.gems ?? 0) + gems;
    await saveStats(updates as Partial<PlayerStats>);
  }

  return { gems, claimed };
}

export async function canSpinWheel(): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("player_stats")
    .select("wheel_date")
    .eq("device_id", deviceId)
    .maybeSingle();
  return data?.wheel_date !== today;
}

export async function spinWheelSave(reward: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const stats = await loadStats();
  if (!stats) return;
  await saveStats({
    wheel_date: today,
    gems: (stats.gems ?? 0) + reward,
  });
}

export async function buyPowerUp(power: "shield" | "extra_life" | "frenzy" | "double" | "freeze", cost: number): Promise<boolean> {
  const stats = await loadStats();
  if (!stats) return false;
  if ((stats.gems ?? 0) < cost) return false;

  const key = `power_${power}` as keyof PlayerStats;
  await saveStats({
    gems: (stats.gems ?? 0) - cost,
    [key]: true,
  } as Partial<PlayerStats>);
  return true;
}

export async function clearPowerUps(): Promise<void> {
  await saveStats({
    power_shield: false,
    power_extra_life: false,
    power_frenzy: false,
    power_double: false,
    power_freeze: false,
  });
}

export async function addGems(amount: number): Promise<void> {
  const stats = await loadStats();
  if (!stats) return;
  await saveStats({ gems: (stats.gems ?? 0) + amount });
}

// ===== LOGIN REWARD SYSTEM =====

export async function checkLoginReward(): Promise<{
  available: boolean;
  day: number;
  gems: number;
  bonus?: string;
  isLegendary?: boolean;
  streakBroken: boolean;
} | null> {
  const today = new Date().toISOString().slice(0, 10);
  const stats = await loadStats();
  if (!stats) return null;

  if (stats.login_reward_date === today && stats.login_reward_claimed_today) {
    return { available: false, day: stats.login_reward_day, gems: 0, streakBroken: false };
  }

  let day = stats.login_reward_day ?? 0;
  let streakBroken = false;

  if (stats.login_reward_date) {
    const last = new Date(stats.login_reward_date + "T00:00:00");
    const diffDays = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      day += 1;
    } else if (diffDays > 1) {
      day = 1;
      streakBroken = true;
    } else if (diffDays === 0) {
      // Same day but not claimed yet — shouldn't happen, but handle it
      day = day > 0 ? day : 1;
    }
  } else {
    day = 1;
  }

  const { getLoginReward } = await import("./loginRewards");
  const reward = getLoginReward(day);

  return {
    available: true,
    day,
    gems: reward.gems,
    bonus: reward.bonus,
    isLegendary: reward.isLegendary,
    streakBroken,
  };
}

export async function claimLoginReward(): Promise<{ gems: number; day: number; bonus?: string; isLegendary?: boolean } | null> {
  const today = new Date().toISOString().slice(0, 10);
  const check = await checkLoginReward();
  if (!check || !check.available) return null;

  const stats = await loadStats();
  if (!stats) return null;

  await saveStats({
    login_reward_day: check.day,
    login_reward_date: today,
    login_reward_claimed_today: true,
    gems: (stats.gems ?? 0) + check.gems,
  });

  return { gems: check.gems, day: check.day, bonus: check.bonus, isLegendary: check.isLegendary };
}

// ===== SQUEEZE SYSTEM =====

export async function getSqueezeData(): Promise<{ state: string; counter: number; threshold: number }> {
  const stats = await loadStats();
  if (!stats) return { state: "dry", counter: 0, threshold: 3 };
  return {
    state: stats.squeeze_state ?? "dry",
    counter: stats.squeeze_games_counter ?? 0,
    threshold: stats.squeeze_games_threshold ?? 3,
  };
}

export async function recordGamePlayedSqueeze(): Promise<{ newState: string; isReady: boolean }> {
  const stats = await loadStats();
  if (!stats) return { newState: "dry", isReady: false };

  let counter = (stats.squeeze_games_counter ?? 0) + 1;
  let state = stats.squeeze_state ?? "dry";
  const threshold = stats.squeeze_games_threshold ?? 3;

  if (state === "dry" && counter >= threshold) {
    state = "ready";
    await saveStats({ squeeze_state: state, squeeze_games_counter: counter });
    return { newState: state, isReady: true };
  }

  await saveStats({ squeeze_games_counter: counter });
  return { newState: state, isReady: false };
}

export async function consumeSqueezeReward(): Promise<void> {
  const { getInitialThreshold } = await import("./squeeze");
  const newThreshold = getInitialThreshold();
  await saveStats({
    squeeze_state: "dry",
    squeeze_games_counter: 0,
    squeeze_games_threshold: newThreshold,
  });
}

export async function getSqueezeMultiplier(): Promise<number> {
  const stats = await loadStats();
  if (!stats) return 1;
  const state = stats.squeeze_state ?? "dry";
  if (state === "ready") {
    const { getReadyMultiplier } = await import("./squeeze");
    return getReadyMultiplier();
  }
  const { getDryMultiplier } = await import("./squeeze");
  return getDryMultiplier();
}
