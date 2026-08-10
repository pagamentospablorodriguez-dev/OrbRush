import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey);

export interface PlayerStats {
  id: number;
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
}

export async function loadStats(): Promise<PlayerStats | null> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.error("Failed to load stats:", error);
    return null;
  }
  return data as PlayerStats | null;
}

export async function saveStats(stats: Partial<PlayerStats>): Promise<void> {
  const { error } = await supabase
    .from("player_stats")
    .update({ ...stats, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) console.error("Failed to save stats:", error);
}

export async function updateDailyStreak(): Promise<{ streak: number; isFirstPlayToday: boolean } | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("player_stats")
    .select("daily_streak, last_played_date")
    .eq("id", 1)
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
    .eq("id", 1)
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
    .eq("id", 1)
    .maybeSingle();

  if (data?.quest_date === today && data.quest1_type) {
    return loadStats();
  }

  const pool = [
    { type: "score_2000", target: 2000, label: "Faça 2000 pontos" },
    { type: "score_5000", target: 5000, label: "Faça 5000 pontos" },
    { type: "combo_20", target: 20, label: "Combo x20" },
    { type: "combo_40", target: 40, label: "Combo x40" },
    { type: "golden_10", target: 10, label: "Pegue 10 dourados" },
    { type: "golden_20", target: 20, label: "Pegue 20 dourados" },
    { type: "jackpot_1", target: 1, label: "Ganhe 1 jackpot" },
    { type: "jackpot_3", target: 3, label: "Ganhe 3 jackpots" },
    { type: "level_10", target: 10, label: "Alcance o nível 10" },
    { type: "boss_1", target: 1, label: "Derrote 1 chefe" },
    { type: "rainbow_1", target: 1, label: "Pegue 1 arco-íris" },
    { type: "treasure_1", target: 1, label: "Abra 1 tesouro" },
    { type: "games_3", target: 3, label: "Jogue 3 partidas" },
    { type: "games_5", target: 5, label: "Jogue 5 partidas" },
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

  const updates: Partial<PlayerStats> = {};

  for (const i of [1, 2, 3] as const) {
    const qType = stats[`quest${i}_type` as keyof PlayerStats] as string;
    const qDone = stats[`quest${i}_done` as keyof PlayerStats] as boolean;
    const qProg = stats[`quest${i}_progress` as keyof PlayerStats] as number;
    const qTarget = stats[`quest${i}_target` as keyof PlayerStats] as number;

    if (qType === type && !qDone) {
      const newProg = incremental ? qProg + value : Math.max(qProg, value);
      if (newProg >= qTarget) {
        updates[`quest${i}_progress` as keyof PlayerStats] = qTarget;
        updates[`quest${i}_done` as keyof PlayerStats] = true;
      } else {
        updates[`quest${i}_progress` as keyof PlayerStats] = newProg;
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    await saveStats(updates);
  }
}

export async function claimQuestRewards(): Promise<{ gems: number; claimed: number }> {
  const stats = await loadStats();
  if (!stats) return { gems: 0, claimed: 0 };

  let gems = 0;
  let claimed = 0;
  const updates: Partial<PlayerStats> = {};

  for (const i of [1, 2, 3] as const) {
    const done = stats[`quest${i}_done` as keyof PlayerStats] as boolean;
    const type = stats[`quest${i}_type` as keyof PlayerStats] as string;
    if (done && !type.startsWith("claimed_")) {
      gems += 50;
      claimed++;
      updates[`quest${i}_type` as keyof PlayerStats] = `claimed_${type}`;
    }
  }

  if (claimed > 0) {
    updates.gems = (stats.gems ?? 0) + gems;
    await saveStats(updates);
  }

  return { gems, claimed };
}

export async function canSpinWheel(): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("player_stats")
    .select("wheel_date")
    .eq("id", 1)
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
