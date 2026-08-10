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
